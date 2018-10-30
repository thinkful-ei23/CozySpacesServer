'use strict';

const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true},
  type: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipcode: { type: String, required: true },

  photos: [
    {
      photoLink: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo' },
    }
  ],
  averageCozyness:  { type: Number },
  ratingsLighting: [
    {
      ratingLink: { type: mongoose.Schema.Types.ObjectId, ref: 'Rating' },
    }
  ],
  ratingsMusic: [
    {
      ratingLink: { type: mongoose.Schema.Types.ObjectId, ref: 'Rating' },
    }
  ],
  ratingsEnvironment: [
    {
      ratingLink: { type: mongoose.Schema.Types.ObjectId, ref: 'Rating' },
    }
  ],
  ratingsFabrics: [
    {
      ratingLink: { type: mongoose.Schema.Types.ObjectId, ref: 'Rating' },
    }
  ],
  ratingsFoodBev: [
    {
      ratingLink: { type: mongoose.Schema.Types.ObjectId, ref: 'Rating' },
    }
  ],
});

placeSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model('Place', placeSchema);