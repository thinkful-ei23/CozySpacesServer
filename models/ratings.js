'use strict';

const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userLink: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  placesLink: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  rating: { type: Object, required: true},
});

ratingSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model('Rating', ratingSchema);