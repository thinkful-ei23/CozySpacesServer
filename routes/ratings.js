'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const Rating = require('../models/ratings');
const User = require('../models/users');
const Place = require('../models/places');

const router = express.Router();

/* ===============USE PASSPORT AUTH JWT ============= */
router.use(
  '/',
  passport.authenticate('jwt', { session: false, failWithError: true })
);

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, placeId } = req.query;
  const userId = req.user.id;

  let filter = {};

  if (searchTerm) {
    filter.rating = { $regex: searchTerm, $options: 'i' };
  }

  if (placeId) {
    filter.placeId = placeId;
  }

  if (userId) {
    filter.userId = userId;
  }
  Rating.find(filter)
    //Rating.find(filter) //
    .sort({ updatedAt: 'desc' })
    .then(results => {
      console.log('results: ', results);
      res.json(results); //
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM by place Id and user Id in combo========== */
router.get('/:placeId', (req, res, next) => {
  // fetches specific rating
  const placeId = req.params.placeId;
  const userId = req.user.id; // userID

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('The `user id` is not valid');
    err.status = 400;
    return next(err);
  }

  Rating.findOne({ placeId: placeId, userId: userId })
    .then(result => {
      if (result) {
        console.log(result);
        res.json(result);
      } else {
        res.status(204).send();
      }
    })
    .catch(err => {
      console.log(' this is catch err', err);
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { rating, placeId } = req.body;
  const userId = req.user.id;
  /***** Never trust users - validate input *****/
  if (!rating) {
    const err = new Error('Missing `rating` in request body');
    err.status = 400;
    return next(err);
  }

  if (placeId && !mongoose.Types.ObjectId.isValid(placeId)) {
    const err = new Error('The `places Id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('The `user Id` is not valid');
    err.status = 400;
    return next(err);
  }

  const newRating = { rating, placeId, userId };

  Rating.findOne({ placeId: placeId, userId: userId })  //CHECK FOR EXISTING RATING
    .then(result => {
      if (result) {
        const err = new Error('You have already posted a rating');
        err.status = 400;
        err.reason = 'ValidationError';
        console.log(err);
        return next(err);
      } else {
        Rating.create(newRating)    
          .then(result => {
            console.log('This is the new rating result: ', result);
            Place.findOne({ _id: placeId })
              .then(place => {
                place.ratings.push(result.id);
                place.save((err,doc,numdocs)=>{
                  updateAvgRatings(placeId, function() {
                    res
                      .location(`${req.originalUrl}/${result.id}`)
                      .status(201)
                      .json(result);
                  });
                }); 
              });
          });
      }
    })
    .catch(err => {
      console.log(err);
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:ratingId', (req, res, next) => {
  console.log('ENTER ROUTER.PUT*****************************');
  const { ratingId } = req.params;
  const { rating, placeId } = req.body;
  console.log('ROUTER.PUT RATINGS: ', rating);

  const updateRating = {};
  const updateFields = ['rating', 'userId', 'placeId'];

  updateFields.forEach(field => {
    if (field in req.body) {
      updateRating[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(ratingId)) {
    const err = new Error('The `rating id` is not valid');
    err.status = 400;
    return next(err);
  }
  if (placeId && !mongoose.Types.ObjectId.isValid(placeId)) {
    const err = new Error('The `placeId` is not valid');
    err.status = 400;
    return next(err);
  }
  if (rating === '') {
    const err = new Error('Missing `rating` in request body');
    err.status = 400;
    return next(err);
  }
  // try {
  //   const oneRating = await Rating.findOne({ _id: ratingId });

  //   if (oneRating) {
  //     await Rating.
  //   }

  // } catch (err) {
  //   next(err);
  // }
  console.log('++++++++++++Rating.findOne++++++++ratingId is: ', ratingId);
  Rating.findOne({ _id: ratingId })
    .then(rating => {
      if (rating) {
        console.log('+++++++GOT A RATING ++++++++');
        console.log('---beforesave---', rating.rating);
        rating.rating = updateRating.rating;
        console.log( 'updateRating.rating is: ', updateRating.rating);
        console.log( 'rating.rating is: ', rating.rating);
        rating.save((err,doc,numrows) => {
          if(!err){
            console.log('Saved rating.');
            console.log('Ready to update Avg Ratings');
            updateAvgRatings(placeId, function() {
              res.json(rating);
            }); 
          }
        });
        
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });

});
/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:placeId', (req, res, next) => {
  const { placeId } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(placeId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Rating.findOneAndDelete({ placeId, userId })
    .then(result => {
      if (result) {
        console.log(result);
        Place.update({placeId: placeId }, { $pull: { ratings: { _id: result.id } }} )
          .then(() => {
            updateAvgRatings(placeId, function() {
              res.sendStatus(204);
            }); 
          });
      } else {
        res.sendStatus(404);
      }
    })
    .catch(err => {
      next(err);
    });
});

function updateAvgRatings(placeId, callback) {

  console.log('******************START OF UPDATE AVERAGE RATINGS**************************');
  let warmLightingTotal,
    relaxedMusicTotal,
    calmEnvironmentTotal,
    softFabricsTotal,
    comfySeatingTotal,
    hotFoodDrinkTotal;

  warmLightingTotal = relaxedMusicTotal = calmEnvironmentTotal = softFabricsTotal = comfySeatingTotal = hotFoodDrinkTotal = 0;

  let warmLightingAverage,
    relaxedMusicAverage,
    calmEnvironmentAverage,
    softFabricsAverage,
    comfySeatingAverage,
    hotFoodDrinkAverage;

  warmLightingAverage = relaxedMusicAverage = calmEnvironmentAverage = softFabricsAverage = comfySeatingAverage = hotFoodDrinkAverage = 0;


  Rating.find({ placeId: placeId })
    .then((ratings) => {
      console.log('Rating.find in updateAvgRatings');
      console.log('ratings are: ', ratings);

      let numberOfRatings = ratings.length; // 4\
      if (numberOfRatings !== 0) {
        console.log('numberOfRatings are: ', numberOfRatings);
        ratings.forEach((rating) => {
          console.log('****************INSIDE THE FOREACH****************');
          console.log('rating: ', rating);
          warmLightingTotal += rating.rating.warmLighting;
          console.log('warmLightingTotal: ', warmLightingTotal);
          console.log('rating.rating.warmLighting: ', rating.rating.warmLighting);
          relaxedMusicTotal += rating.rating.relaxedMusic;
          calmEnvironmentTotal += rating.rating.calmEnvironment;
          softFabricsTotal += rating.rating.softFabrics;
          comfySeatingTotal += rating.rating.comfySeating;
          hotFoodDrinkTotal += rating.rating.hotFoodDrink;
        });

        warmLightingAverage = (warmLightingTotal / numberOfRatings) ;
        console.log('warmLightingAverage: ', warmLightingAverage);
        relaxedMusicAverage = (relaxedMusicTotal / numberOfRatings);
        calmEnvironmentAverage = (calmEnvironmentTotal / numberOfRatings);
        softFabricsAverage = (softFabricsTotal / numberOfRatings);
        comfySeatingAverage = (comfySeatingTotal / numberOfRatings);
        hotFoodDrinkAverage = (hotFoodDrinkTotal / numberOfRatings);
      }

      return Place.findOne({ _id: placeId });
    })
    .then((place) => {
      console.log('prior to update - place.averageWarmLighting: ', place.averageWarmLighting);
      console.log('prior to update - place.ratings[0]: ', place.ratings[0]);

      place.averageWarmLighting = +warmLightingAverage.toFixed(2);
      place.averageRelaxedMusic = +relaxedMusicAverage.toFixed(2);
      place.averageCalmEnvironment = +calmEnvironmentAverage.toFixed(2);
      place.averageSoftFabrics = +softFabricsAverage.toFixed(2);
      place.averageComfySeating = +comfySeatingAverage.toFixed(2);
      place.averageHotFoodDrink = +hotFoodDrinkAverage.toFixed(2);
      
      console.log ('----------------place before update: ', place);
      let numb = 
        (
          +place.averageWarmLighting +
          +place.averageRelaxedMusic +
          +place.averageCalmEnvironment +
          +place.averageSoftFabrics +
          +place.averageComfySeating +
          +place.averageHotFoodDrink
        ) / 6;
      place.averageCozyness = +numb.toFixed(2);
      place.save();
      callback();
      console.log ('+++++++++++++++place after save : ', place);
    })
    .catch((err) => console.error(err));
}

module.exports = router;