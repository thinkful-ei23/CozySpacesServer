'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const Rating = require('../models/ratings');
const User = require('../models/users');
const Place = require('../models/places');

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
    .sort({ updatedAt: 'desc' })
    .then(results => {
      res.json(results); 
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM by place Id and user Id in combo========== */
router.get('/:placeId', (req, res, next) => {
  const placeId = req.params.placeId;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('The `user id` is not valid');
    err.status = 400;
    return next(err);
  }

  Rating.findOne({ placeId: placeId, userId: userId })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        res.status(204).send();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { rating, placeId } = req.body;
  const userId = req.user.id;
  /***** Never trust users - validate input *****/
  if (!rating) {
    const err = new Error('Missing `rating` in request body');
    err.status = 400;
    return next(err);
  }

  if (placeId && !mongoose.Types.ObjectId.isValid(placeId)) {
    const err = new Error('The `places Id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('The `user Id` is not valid');
    err.status = 400;
    return next(err);
  }

  const newRating = { rating, placeId, userId };

  Rating.findOne({ placeId: placeId, userId: userId })
    .then(result => {
      if (result) {
        const err = new Error('You have already posted a rating');
        err.status = 400;
        err.reason = 'ValidationError';
        return next(err);
      } else {
        Rating.create(newRating)    
          .then(result => {
            Place.findOne({ _id: placeId })
              .then(place => {
                place.ratings.push(result.id);
                place.save((err,doc,numdocs)=>{
                  updateAvgRatings(placeId, function() {
                    res
                      .location(`${req.originalUrl}/${result.id}`)
                      .status(201)
                      .json(result);
                  });
                }); 
              });              
            User.findOne({ _id: userId })
              .then(user => {
                user.ratings.push(result.id);
                user.save(); 
              });
          });
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:ratingId', (req, res, next) => {
  const { ratingId } = req.params;
  const { rating, placeId } = req.body;

  const updateRating = {};
  const updateFields = ['rating', 'userId', 'placeId'];

  updateFields.forEach(field => {
    if (field in req.body) {
      updateRating[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(ratingId)) {
    const err = new Error('The `rating id` is not valid');
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
  Rating.findOne({ _id: ratingId })
    .then(rating => {
      if (rating) {
        rating.rating = updateRating.rating;
        rating.save((err,doc,numrows) => {
          if(!err){
            updateAvgRatings(placeId, function() {
              res.json(rating);
            }); 
          }
        });
        
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });

});
/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:placeId', (req, res, next) => {
  const { placeId } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(placeId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Rating.findOneAndDelete({ placeId, userId })
    .then(result => {
      if (result) {
        Place.update({_id: placeId }, { $pull: { ratings: result.id }} )
          .then(() => {
            updateAvgRatings(placeId, function() {
              res.sendStatus(204);
            }); 
          });
        User.update({userId: userId }, { $pull: { ratings: { _id: result.id } }} );
      } else {
        res.sendStatus(404);
      }
    })
    .catch(err => {
      next(err);
    });
});

function updateAvgRatings(placeId, callback) {
  let warmLightingTotal,
    relaxedMusicTotal,
    calmEnvironmentTotal,
    softFabricsTotal,
    comfySeatingTotal,
    hotFoodDrinkTotal;

  warmLightingTotal = relaxedMusicTotal = calmEnvironmentTotal = softFabricsTotal = comfySeatingTotal = hotFoodDrinkTotal = 0;

  let warmLightingAverage,
    relaxedMusicAverage,
    calmEnvironmentAverage,
    softFabricsAverage,
    comfySeatingAverage,
    hotFoodDrinkAverage;

  warmLightingAverage = relaxedMusicAverage = calmEnvironmentAverage = softFabricsAverage = comfySeatingAverage = hotFoodDrinkAverage = 0;


  Rating.find({ placeId: placeId })
    .then((ratings) => {

      let numberOfRatings = ratings.length; 
      if (numberOfRatings !== 0) {
        ratings.forEach((rating) => {
          warmLightingTotal += rating.rating.warmLighting;
          relaxedMusicTotal += rating.rating.relaxedMusic;
          calmEnvironmentTotal += rating.rating.calmEnvironment;
          softFabricsTotal += rating.rating.softFabrics;
          comfySeatingTotal += rating.rating.comfySeating;
          hotFoodDrinkTotal += rating.rating.hotFoodDrink;
        });

        warmLightingAverage = (warmLightingTotal / numberOfRatings);
        relaxedMusicAverage = (relaxedMusicTotal / numberOfRatings);
        calmEnvironmentAverage = (calmEnvironmentTotal / numberOfRatings);
        softFabricsAverage = (softFabricsTotal / numberOfRatings);
        comfySeatingAverage = (comfySeatingTotal / numberOfRatings);
        hotFoodDrinkAverage = (hotFoodDrinkTotal / numberOfRatings);
      }

      return Place.findOne({ _id: placeId });
    })
    .then((place) => {
      place.averageWarmLighting = +warmLightingAverage.toFixed(2);
      place.averageRelaxedMusic = +relaxedMusicAverage.toFixed(2);
      place.averageCalmEnvironment = +calmEnvironmentAverage.toFixed(2);
      place.averageSoftFabrics = +softFabricsAverage.toFixed(2);
      place.averageComfySeating = +comfySeatingAverage.toFixed(2);
      place.averageHotFoodDrink = +hotFoodDrinkAverage.toFixed(2);

      let numb = 
        (
          +place.averageWarmLighting +
          +place.averageRelaxedMusic +
          +place.averageCalmEnvironment +
          +place.averageSoftFabrics +
          +place.averageComfySeating +
          +place.averageHotFoodDrink
        ) / 6;
      place.averageCozyness = +numb.toFixed(2);
      place.save();
      callback();
    })
    .catch((err) => console.error(err));
}

module.exports = router;