'use strict';

const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  placeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Place'},
  rating: {        
    warmLighting:  {type: Number},
    relaxedMusic:     {type: Number},
    calmEnvironment:  {type: Number},
    softFabrics:      {type: Number},
    comfySeating:     {type: Number},
    hotFoodDrink: {type: Number},
    comment: {type: String, default: null}
  }  
});

ratingSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  }
});

ratingSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Rating', ratingSchema);