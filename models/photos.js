const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true},
  caption: { type: String, required: true },
  placesLink: { type: mongoose.Schema.Types.ObjectId, ref: 'Place' },
});

photoSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model('Photo', photoSchema);
