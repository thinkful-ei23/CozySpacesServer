'use strict';

const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipcode: { type: String, required: true, default: '' },
  location: {
    type: { type: String },
    coordinates: []
  },
  averageCozyness: {type: Number, default: 0},
  averageWarmLighting: {type: Number, default: 0},
  averageRelaxedMusic: {type: Number, default: 0},
  averageCalmEnvironment: {type: Number, default: 0},
  averageSoftFabrics: {type: Number, default: 0},
  averageComfySeating: {type: Number, default: 0},
  averageHotFoodDrink: {type: Number, default: 0},
  photos: [{type: mongoose.Schema.Types.ObjectId, ref: 'Photo'}], 
  ratings: [{type: mongoose.Schema.Types.ObjectId, ref: 'Rating'}],
  userReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users'}],
  archived: {type: Boolean, default: false}
});

placeSchema.index({ location: '2dsphere' });

placeSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.location.$init;
  }
});

placeSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});


module.exports = mongoose.model('Place', placeSchema);