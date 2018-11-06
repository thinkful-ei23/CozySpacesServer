'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const Rating = require('../models/ratings');
const User = require('../models/users');

const router = express.Router();

/* ===============USE PASSPORT AUTH JWT ============= */
router.use(
  '/',
  passport.authenticate('jwt', { session: false, failWithError: true })
);

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, placeId } = req.query;
  const userId = req.user.id;

  let filter = {};

  if (searchTerm) {
    filter.rating = { $regex: searchTerm, $options: 'i' };
  }

  if (placeId) {
    filter.placeId = placeId;
  }

  if (userId) {
    filter.userId = userId;
  }
  Rating.find(filter)
    //Rating.find(filter) //
    .sort({ updatedAt: 'desc' })
    .then(results => {
      console.log('results: ', results);
      res.json(results); //
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM by place Id and user Id in combo========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params; // placeID
  const userId = req.user.id; // userID
  console.log(userId);
  console.log(id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Rating.findOne({ placesId: id, userId: userId })
    .then(result => {
      console.log('this is result', result);
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      console.log(' this is catch err', err);
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { rating, placesId } = req.body;
  const userId = req.user.id;
  //console.log('req.user', req.user);
  /***** Never trust users - validate input *****/
  if (!rating) {
    const err = new Error('Missing `rating` in request body');
    err.status = 400;
    return next(err);
  }

  if (placesId && !mongoose.Types.ObjectId.isValid(placesId)) {
    const err = new Error('The `places Id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('The `user Id` is not valid');
    err.status = 400;
    return next(err);
  }

  const newRating = { rating, placesId, userId };

  Rating.findOne({ placesId: placesId, userId: userId })
    .then(result => {
      if (result) {
        const err = new Error('You have already posted a rating');
        err.status = 400;
        err.reason = 'ValidationError';
        console.log(err);
        return next(err);
      }
      return Rating.create(newRating).then(result => {
        updateAvgRatings(placesId);
        res
          .location(`${req.originalUrl}/${result.id}`)
          .status(201)
          .json(result);
      });
    })
    .catch(err => {
      console.log(err);
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { rating, placeId } = req.body;
  const updateRating = {};
  const updateFields = ['rating', 'userId', 'placeId'];

  updateFields.forEach(field => {
    if (field in req.body) {
      updateRating[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  if (placeId && !mongoose.Types.ObjectId.isValid(placeId)) {
    const err = new Error('The `placeId` is not valid');
    err.status = 400;
    return next(err);
  }
  if (rating === '') {
    const err = new Error('Missing `rating` in request body');
    err.status = 400;
    return next(err);
  }

  Rating.findOne({ _id: id })
    .then(rating => {
      if (rating) {
        rating.rating = updateRating.rating;
        rating.save();
        updateAvgRatings(id);
        res.json(rating);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });

});
/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:placesId', (req, res, next) => {
  const { placesId } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(placesId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Rating.findOneAndDelete({ placesId, userId })
    .then(result => {
      if (result) {
        updateAvgRatings(placesId);
        res.sendStatus(204);
      } else {
        res.sendStatus(404);
      }
    })
    .catch(err => {
      next(err);
    });
});

function updateAvgRatings(placeId) {
  let newwarmLightingScore,
    newRelaxedMusicScore,
    newCalmEnvironmentScore,
    newSoftFabricsScore,
    newComfySeatingScore,
    newHotFoodDrinkScore = 0;

  let warmLightingScore,
    relaxedMusicScore,
    calmEnvironmentScore,
    softFabricsScore,
    comfySeatingScore,
    hotFoodDrinkScore = 0;

  Ratings.find({ placesId: placeId })
    .then((ratings) => {

      let numberOfRatings = ratings.length;
      ratings.forEach((rating) => {
        warmLightingScore += rating.rating.warmLighting;
        relaxedMusicScore += rating.rating.relaxedMusic;
        calmEnvironmentScore += rating.rating.calmEnvironment;
        softFabricsScore += rating.rating.softFabrics;
        comfySeatingScore += rating.rating.comfySeating;
        hotFoodDrinkScore += rating.rating.hotFoodDrink;
      });
      newWarmLightingScore = Math.floor(warmLightingScore / numberOfRatings);
      newRelaxedMusicScore = Math.floor(relaxedMusicScore / numberOfRatings);
      newCalmEnvironmentScore = Math.floor(warmLightingScore / numberOfRatings);
      newSoftFabricsScore = Math.floor(warmLightingScore / numberOfRatings);
      newComfySeatingScore = Math.floor(warmLightingScore / numberOfRatings);
      newHotFoodDrinkScore = Math.floor(warmLightingScore / numberOfRatings);
      return Place.findOne({ _id: placeId })
    })
    .then((place) => {
      place.averageWarmLighting = newWarmLightingScore;
      place.averageRelaxedMusic = newRelaxedMusicScore;
      place.averageCalmEnvironment = newCalmEnvironmentScore;
      place.averageSoftFabrics = newSoftFabricsScore;
      place.averageComfySeating = newComfySeatingScore;
      place.averageHotFoodDrink = newHotFoodDrinkScore;
      place.averageCozyness = 
      Math.floor(
        (
          +place.averageCalmEnvironment +
          +place.averageSoftFabrics +
          +place.averageComfySeating +
          +place.averageHotFoodDrink +
          +place.averageHotFoodDrink
        ) / 6);
      place.save();
    })
    .catch((err) => console.error(err));
}


module.exports = router;
