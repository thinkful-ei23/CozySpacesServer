'use strict';

const mongoose = require('mongoose');

const userCommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  placesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Place'},
  comment: String
});

userCommentSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model('UserComment', userCommentSchema);