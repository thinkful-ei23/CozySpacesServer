'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true},
  password: { type: String, required: true },
  ratings: [{type: mongoose.Schema.Types.ObjectId, ref: 'Rating'}],
  photos: [{type: mongoose.Schema.Types.ObjectId, ref: 'Photo'}]
});

userSchema.set('toObject', {
  virtuals: true,
  versionKey: false, 
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.password;
    delete ret.__v;
  }
});


userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false, 
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.password;
    delete ret.__v;
  }
});

userSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('User', userSchema);
