'use strict';

const mongoose = require('mongoose');

const { DATABASE_URL } = require('../config');

console.log(`Connecting to mongodb at ${DATABASE_URL}`);
mongoose.connect(DATABASE_URL)
  .then(() => {
    console.log('Dropping database');
    return mongoose.connection.db.dropDatabase();
  })
  .then(() => {
    console.info('Disconnecting');
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    return mongoose.disconnect();
  });
