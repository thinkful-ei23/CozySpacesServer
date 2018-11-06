'use strict';

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  placesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Place'},
  comment: String
});

commentSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model('UserComment', commentSchema);