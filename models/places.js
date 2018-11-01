'use strict';

const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipcode: { type: String, required: true, default: '' },
  averageCozyness: {type: Number},
  averageWarmLighting: {type: Number},
  averageRelaxedMusic: {type: Number},
  averageCalmEnvironment: {type: Number},
  averageSoftFabrics: {type: Number},
  averageComfySeating: {type: Number},
  averageHotFoodDrink: {type: Number},
  photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }],
  ratings: [{type: mongoose.Schema.Types.ObjectId, ref: 'Rating'}]
});

placeSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model('Place', placeSchema);