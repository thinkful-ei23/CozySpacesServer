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
router.get('/:placeId', (req, res, next) => {
  // fetches specific rating
  const placeId = req.params.placeId;
  const userId = req.user.id; // userID

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('The `user id` is not valid');
    err.status = 400;
    return next(err);
  }

  Rating.findOne({ placesId: placeId, userId: userId })
    .then(result => {
      if (result) {
        console.log(result);
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
  /***** Never trust users - validate input *****/
  if (!rating) {
    const err = new Error('Missing `rating` in request body');
    err.status = 400;
    return next(err);
  }

  if (placesId && !mongoose.Types.ObjectId.isValid(placesId)) {
    const err = new Error('The `places Link` is not valid');
    err.status = 400;
    return next(err);
  }

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('The `user Link` is not valid');
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
        return result;
      }).then((result) => {
        return Place.update({ _id: placesId }, { $push: { ratings: result._id } })
          .then(result => {
            console.log(result);
            res
              .location(`${req.originalUrl}/${result._id}`)
              .status(201)
              .json(result);

          });
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

  console.log('updateFields: ', updateFields);

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

  Rating.findOne({_id: id})
    .then(rating => {
      if (rating) {
        rating.rating = updateRating.rating;
        rating.save();
        console.log(rating);
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
