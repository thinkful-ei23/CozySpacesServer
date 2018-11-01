'use strict';
const express = require('express');
const mongoose = require('mongoose');

const Place = require('../models/places');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {

  Place.find()
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

  Place
    .findOne({_id: id})
    .populate('Rating')
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
 
});

module.exports = router;