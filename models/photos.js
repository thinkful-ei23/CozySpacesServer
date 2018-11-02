'use strict';
const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true},
  caption: { type: String},
  placesLink: { type: mongoose.Schema.Types.ObjectId, ref: 'Place'},
  // userLink: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

photoSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model('Photo', photoSchema);
