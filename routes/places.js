'use strict';
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const Place = require('../models/places');
const Rating = require('../models/ratings');
const Photo = require('../models/photos');
const UserComment = require('../models/userComments');

const router = express.Router();

/* ===============USE PASSPORT AUTH JWT ============= */
router.use(
  '/',
  passport.authenticate('jwt', { session: false, failWithError: true })
);

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  Place.find()
    .populate('photos')
    // .sort({ })
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Place.findOne({ _id: id })
    .populate('photos')
    .populate('userComments')
    // .populate('ratings')
    .populate({ path: 'ratings' })
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});

router.post('/', (req, res, next) => {
  const userId = req.user.id;
  const { placeId } = req.body;

  console.log('userId: ', userId);
  console.log('placeId: ', placeId);

  Place.update({ _id: placeId }, { $push: { userReports: userId } })
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});

router.put('/', (req, res, next) => {
  const userId = req.user.id;
  const { placeId } = req.body;

  console.log('userId: ', userId);
  console.log('placeId: ', placeId);

  Place.update({ _id: placeId }, { $pull: {userReports: userId } })
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
