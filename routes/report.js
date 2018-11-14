'use strict';
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const Place = require('../models/places');
const Rating = require('../models/ratings');

const router = express.Router();

/* ===============USE PASSPORT AUTH JWT ============= */
router.use(
  '/',
  passport.authenticate('jwt', { session: false, failWithError: true })
);

router.post('/', (req, res, next) => {
  const userId = req.user.id;
  const { placeId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('The `user id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(placeId)) {
    const err = new Error('The `place id` is not valid');
    err.status = 400;
    return next(err);
  }

  let filter = {};
  filter._id = placeId;

  Place.find(filter)
    .then(result => {
      let found = result[0].userReports.find((report) => {
        let convertedAndStrippedReport = JSON.stringify(report).replace(/['"]+/g, '');
        return convertedAndStrippedReport === userId;
      });
      if (found) {
        const err = new Error('You have already reported the place');
        err.status = 400;
        err.reason = 'No duplicate reports';
        return next(err);
      }
      return Place.update({ _id: placeId }, { $push: { userReports: userId } })
        .then(result => {
          res.json(result);
        });
    })
    .catch(err => {
      next(err);
    });
});

router.delete('/', (req, res, next) => {
  const userId = req.user.id;
  const { placeId } = req.body;

  
  if (!mongoose.Types.ObjectId.isValid(placeId)) {
    const err = new Error('The `place id` is not valid');
    err.status = 400;
    return next(err);
  }

  console.log('userId: ', userId);
  console.log('placeId: ', placeId);

  Place.update({ _id: placeId }, { $pull: { userReports: userId } })
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
