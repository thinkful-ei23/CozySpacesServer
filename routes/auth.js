'use strict';
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const { JWT_SECRET, JWT_EXPIRY } = require('../config');
const router = express.Router();

const localAuth = passport.authenticate('local', { session: false, failWithError: true });

// The user provides a username and password to login
router.post('/login', localAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({authToken});
});

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

// The user exchanges a valid JWT for a new one with a later expiration
router.post('/auth/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({authToken});
});

function createAuthToken(user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}

module.exports = router;