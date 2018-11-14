'use strict';

const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/users');

const router = express.Router();

router.post('/', (req, res, next) => {
  const requiredFields = ['username', 'email', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    const err = new Error(`Missing '${missingField}' in request body`);
    err.status = 422;
    return next(err);
  }

  const stringFields = ['username', 'email', 'password'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    const err = new Error(`Field: '${nonStringField}' must be type String`);
    err.status = 422;
    return next(err);
  }

  const explicitlyTrimmedFields = ['username', 'email', 'password'];
  const nonTrimmedField = explicitlyTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    const err = new Error(
      `Field: '${nonTrimmedField}' cannot start or end with whitespace`
    );
    err.status = 422;
    return next(err);
  }

  const sizedFields = {
    username: { min: 1 },
    password: { min: 8, max: 72 }
  };

  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
      req.body[field].trim().length < sizedFields[field].min
  );

  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
      req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField) {
    const min = sizedFields[tooSmallField].min;
    const err = new Error(
      `Field: '${tooSmallField}' must be at least ${min} characters long`
    );
    err.status = 422;
    return next(err);
  }

  if (tooLargeField) {
    const max = sizedFields[tooLargeField].max;
    const err = new Error(
      `Field: '${tooLargeField}' must be at most ${max} characters long`
    );
    err.status = 422;
    return next(err);
  }

  let { username, email, password } = req.body;

  return User.hashPassword(password)
    .then(digest => {
      const newUser = {
        username,
        email,
        password: digest
      };
      return User.create(newUser);
    })
    .then(result => {
      return res
        .status(201)
        .location(`/api/users/${result.id}`)
        .json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The username already exists');
        err.status = 400;
        err.reason = 'ValidationError';
      }
      next(err);
    });
});

router.delete('/:id', (req, res, next) => {
  const userId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  User.findByIdAndDelete(userId)
    .then(() => {

      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;