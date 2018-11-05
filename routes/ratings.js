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
  const placeId = req.params.id;  
  const userId = req.user.id; // userID

  if (!mongoose.Types.ObjectId.isValid(placeId)) {
    const err = new Error('The `placeId` is not valid');
    err.status = 400;
    return next(err);
  }

  Rating.findOne({ placesLink: placeId, userLink: userId })
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
  const { rating, placesLink } = req.body;
  const userLink = req.user.id;
  //console.log('req.user', req.user);
  /***** Never trust users - validate input *****/
  if (!rating) {
    const err = new Error('Missing `rating` in request body');
    err.status = 400;
    return next(err);
  }

  if (placesLink && !mongoose.Types.ObjectId.isValid(placesLink)) {
    const err = new Error('The `places Link` is not valid');
    err.status = 400;
    return next(err);
  }

  if (userLink && !mongoose.Types.ObjectId.isValid(userLink)) {
    const err = new Error('The `user Link` is not valid');
    err.status = 400;
    return next(err);
  }

  const newRating = { rating, placesLink, userLink };

  Rating.findOne({ placesLink: placesLink, userLink: userLink })
    .then((result) => {
      if (result) {
        const err = new Error('Rating exists already');
        err.status = 400;
        return next(err);
      }
      return Rating.create(newRating)
        .then(result => {
          res
            .location(`${req.originalUrl}/${result.id}`)
            .status(201)
            .json(result);
        });
    })
    .catch(err => {
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const placeId = req.params.id;
  const userLink = req.user.id;
  const { warmLighting, relaxedMusic, calmEnvironment, softFabrics, comfySeating, hotFoodDrink } = req.body;
  const updateRating = {};
  const updateFields = [ warmLighting, relaxedMusic, calmEnvironment, softFabrics, comfySeating, hotFoodDrink];
  updateFields.forEach(field => {
    if (field in req.body) {
      updateRating[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(userLink)) {
    const err = new Error('The `user Link` is not valid');
    err.status = 400;
    return next(err);
  }
  if (placeId && !mongoose.Types.ObjectId.isValid(placeId)) {
    const err = new Error('The `places id` is not valid');
    err.status = 400;
    return next(err);
  }
  if (updateFields.length === 0) {
    const err = new Error('Missing `a rating to update` in request body');
    err.status = 400;
    return next(err);
  }
  Rating.findOne({ placesLink: placeId, userLink: userLink })
    .then((result) => {
    Rating.updateOne(
      
      { placesLink: placeId, userLink: userLink }, 
      { "$set": 
        {
          rating: {
          warmLighting: warmLighting,
          relaxedMusic: relaxedMusic, 
          calmEnvironment: calmEnvironment,
          softFabrics: softFabrics,
          comfySeating: comfySeating,
          hotFoodDrink: hotFoodDrink
          }
        }
      })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
  });
});
/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Rating.deleteOne({ _id: id, userId })
    .then(result => {
      if (result.n) {
        res.sendStatus(204);
      } else {
        res.sendStatus(404);
      }
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
