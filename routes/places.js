'use strict';
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');


const Place = require('../models/places');
const Rating = require('../models/ratings');
const Photo = require('../models/photos');

const router = express.Router();

cron.schedule('* * 1 * * *', () => {
  const d = new Date();
  console.log('running a task every 5 seconds: ', d);

  Place.find({}, (err, places) => {
    places.forEach(place => {
      if (place.userReports.length >= 5) {
        place.archived = true;
        place.save();
      }
    });
  });
});

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  Place.find({ archived : false,
    location: {
      $near: {
        $maxDistance: 60000,
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      }
    }
  })
    .populate('photos')
    .then(results => {
      if (results) {
        res.json(results);
      } else {
        next();
      }
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
    .populate('ratings')
    // .populate({ path: 'ratings' })
    .then(result => {
      //      console.log(result);
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});

router.post('/', (req, res, next) => {
//  console.log(req.body); 
  //console.log('req.user', req.user);
  /***** Never trust users - validate input *****/
  if (!req.body) {
    const err = new Error('Missing `place` in request body');
    err.status = 400;
    return next(err);
  }

  Place.create(req.body).then(result => {
    res
      .location(`${req.originalUrl}/${result.id}`)
      .status(201)
      .json(result);
  })
    .catch(err => {
      console.log(err);
      next(err);
    });
});


module.exports = router;
