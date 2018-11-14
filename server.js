'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const mongoose = require('mongoose');

const localStrategy = require('./passport/local');
const jwtStrategy = require('./passport/jwt');

const { PORT, CLIENT_ORIGIN, DATABASE_URL} = require('./config');
const { dbConnect } = require('./db-mongoose');

const userRouter = require('./routes/users');
const placesRouter = require('./routes/places');
const ratingsRouter = require('./routes/ratings');
const authRouter = require('./routes/auth');
const reportRouter = require('./routes/report');

passport.use(localStrategy);
passport.use(jwtStrategy);

const app = express();

app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
    skip: (req, res) => process.env.NODE_ENV === 'test'
  })
);

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

app.use(express.json());

app.use('/api', authRouter);
app.use('/api/users', userRouter);
app.use('/api/places', placesRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/report', reportRouter);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  if (err.status) {
    const errBody = Object.assign({}, err, { message: err.message });
    res.status(err.status).json(errBody);
  } else {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  // Connect to DB and Listen for incoming connections
  mongoose.connect(DATABASE_URL)
    .then(instance => {
      const conn = instance.connections[0];
      // console.info(`Connected to: mongodb://${conn.host}:${conn.port}/${conn.name}`);
    })
    .catch(err => {
      // console.error(`ERROR: ${err.message}`);
      // console.error('\n === Did you remember to start `mongod`? === \n');
      // console.error(err);
    });
  
  // Listen for incoming connections
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, function () {
      // console.info(`Server listening on ${this.address().port}`);
    }).on('error', err => {
      // console.error(err);
    });
  }
}
module.exports = app; // Export for testing