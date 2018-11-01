'use strict';

const mongoose = require('mongoose');

const { DATABASE_URL } = require('../config');

const Places = require('../models/places');
const User = require('../models/users');
const Rating = require('../models/ratings');
const Photo = require('../models/photos');

const seedPlaces = require('../db/seed/places');
const seedUsers = require('../db/seed/users');
const seedRatings = require('../db/seed/ratings');
const seedPhotos = require('../db/seed/photos');


console.log(`Connecting to mongodb at ${DATABASE_URL}`);
mongoose.connect(DATABASE_URL)
  .then(() => {
    console.info('Dropping Database');
    return mongoose.connection.db.dropDatabase();
  })
  .then(() => {
    delete mongoose.connection.models['Place'];
    console.info('Seeding Database');
    return Promise.all([
      Places.insertMany(seedPlaces),
      Places.createIndexes(),
      Rating.insertMany(seedRatings),
      Rating.createIndexes(),
      User.insertMany(seedUsers),
      User.createIndexes()

    ]);
  })
  .then(() => {
    console.info('Disconnecting');
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    return mongoose.disconnect();
  });
