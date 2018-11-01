'use strict';

const mongoose = require('mongoose');

const { DATABASE_URL } = require('../config');

const Places = require('../models/places');
const PlacesBK = require('../models/placesBK');
const User = require('../models/users');
const Rating = require('../models/ratings');
const Photo = require('../models/photos');

const seedPlaces = require('../db/seed/places');
const seedUsers = require('../db/seed/users');
const seedRatings = require('../db/seed/ratings');
const seedPhotos = require('../db/seed/photos');

const seedPlacesBK = require('../db/seed/placesBK');
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


      // PlacesBK.insertMany(seedPlacesBK),
      // PlacesBK.createIndexes(),
      Places.insertMany(seedPlaces),
      Places.createIndexes(),
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
