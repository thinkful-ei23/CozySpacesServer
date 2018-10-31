'use strict';
const express = require('express');
// const mongoose = require('mongoose');

const Place = require('../models/places');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {

  Request.find()
    // .sort({ })
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;