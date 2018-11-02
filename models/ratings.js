'use strict';

const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userLink: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  placesLink: { type: mongoose.Schema.Types.ObjectId, ref: 'Place'},
  rating: {        
    warmLighting:  {type: Number},
    relaxedMusic:     {type: Number},
    calmEnvironment:  {type: Number},
    softFabrics:      {type: Number},
    comfySeating:     {type: Number},
    hotFoodDrink: {type: Number}
  }  
});

ratingSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model('Rating', ratingSchema);