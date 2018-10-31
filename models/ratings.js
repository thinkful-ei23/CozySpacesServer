'use strict';

const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  type: { type: String, required: true},
  score: { type: Number, required: true },
  placesLink: { type: mongoose.Schema.Types.ObjectId, ref: 'Place' },
  userLink: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

ratingSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model('Rating', ratingSchema);