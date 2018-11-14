'use strict';

// why aren't we requiring mocha? mocha runs all of our tests. it is a framework vs. a library
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = require('../server');

const {TEST_DATABASE_URL} = require('../config');

const { JWT_SECRET } = require('../config');

const User = require('../models/users');
const Place = require('../models/places');
const Rating = require('../models/ratings');

const seedUsers = require('../db/seed/users.json');
const seedPlaces = require('../db/seed/places.json');
const seedRatings = require('../db/seed/ratings.json');

const expect = chai.expect;

chai.use(chaiHttp);


describe('Ratings API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedRestaurantData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  let user;
  let token;

  before(function () {
    return mongoose.connect(TEST_DATABASE_URL)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Promise.all([
      User.insertMany(seedUsers),
      User.createIndexes(),

      Place.insertMany(seedPlaces),
      Place.createIndexes(),

      Rating.insertMany(seedRatings),
      Rating.createIndexes(),

    ])
      .then(([users]) => {
        user = users[0];
        token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
      });
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });
  
  describe('GET api/ratings', function() {
    
    it('should return all existing ratings for a user', function() {
      return Promise.all([
        Rating.find({userId: user.id}),
        chai.request(app).get('/api/ratings').set('Authorization', `Bearer ${token}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return the right user rating for a specific place', function() {
      let rating = {
        'rating': 
          {        
            'warmLighting':     0, 
            'relaxedMusic':     0,
            'calmEnvironment':  0,
            'softFabrics':      0,
            'comfySeating':     0,
            'hotFoodDrink':     0,
            'comment': 'Love this place - super cozy!'
          }     
      };

      let _place;
      const place = {
        name : 'test',
        type : 'test',
        address : 'test',
        city: 'test',
        state: 'test',
        zipcode: 'test',
        location: {type: 'Point',
          coordinates:  [-122.883890, 45.536223],
        },
        photos: ['444444444444444444444000']
      };

      return chai.request(app).post('/api/places').send(place).set('Authorization', `Bearer ${token}`)
        .then((result) => {
          _place = result.body;
          rating.placeId = result.body._id;
          return chai.request(app).post('/api/ratings').send(rating).set('Authorization', `Bearer ${token}`);
        })
        .then(() => {
          return Promise.all([
            Rating.find({userId: user.id, placeId: _place._id}),
            chai.request(app).get(`/api/ratings?placeId=${_place._id}`).set('Authorization', `Bearer ${token}`)
          ]);
        })
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          expect(res.body.rating).to.deep.equal(data.rating);
        });
    });

    it('should return ratings with the right fields', function() {
      let rating = {
        'placeId' : '333333333333333333333006',
        'rating': 
          {        
            'warmLighting':     0, 
            'relaxedMusic':     0,
            'calmEnvironment':  0,
            'softFabrics':      0,
            'comfySeating':     0,
            'hotFoodDrink':     0,
            'comment': 'Love this place - super cozy!'
          }     
      };

      return chai.request(app).post('/api/ratings').send(rating).set('Authorization', `Bearer ${token}`)
        .then(() => {
          return Promise.all([
            Rating.find({userId: user.id}),
            chai.request(app).get('/api/ratings').set('Authorization', `Bearer ${token}`)
          ]);
        })
        .then(([data, res]) => {
          console.log('data', data);
          console.log('res', res.body);
          expect(data.length).to.equal(res.body.length);
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.lengthOf.at.least(1);
          res.body.forEach(function(rating) {
            expect(rating).to.be.a('object');
            expect(rating).to.include.keys(
              'rating', 'placeId', 'userId', '_id');
          });
          rating = res.body[0];
          return Rating.findById(rating._id);
        })
        .then (data => {
          expect(rating._id).to.equal(data.id);
          expect(rating.rating.calmEnvironment).to.equal(data.rating.calmEnvironment);
          expect(rating.rating.comfySeating).to.equal(data.rating.comfySeating);
          expect(rating.rating.hotFoodDrink).to.equal(data.rating.hotFoodDrink);
          expect(rating.rating.softFabrics).to.equal(data.rating.softFabrics);
          expect(rating.rating.comment).to.equal(data.rating.comment);
          expect(rating.rating.relaxedMusic).to.equal(data.rating.relaxedMusic);
          expect(rating.rating.warmLighting).to.equal(data.rating.warmLighting);
          expect(mongoose.Types.ObjectId(rating.userId)).to.deep.equal(data.userId);
          expect(mongoose.Types.ObjectId(rating.placeId)).to.deep.equal(data.placeId);
        });
    });

    it('should return a 400 if passed an invalid id', function() {
      const id = 3;
      return chai.request(app)
        .get(`/api/ratings?placeId=${id}`)
        .set('Authorization', `Bearer ${token}`)
        .then(function (res) {
          const message = JSON.parse(res.text).message;
          expect(message).to.equal('The `place id` is not valid');
          expect(res).to.have.status(400);
        });
    });

  });

  describe('GET api/ratings/:id', function() {

    it('should return the correct rating', function() {
      let userId = '000000000000000000000001';
      let id = '333333333333333333333002';

      return Rating.findOne({userId, placeId: id})
        .then(obj => {
          return Promise.all([
            Rating.findOne({userId, placeId: id}),
            chai.request(app).get(`/api/ratings/${id}`).set('Authorization', `Bearer ${token}`)
          ]);
        })
        .then(([dataRating, res]) => {
          const resRating = res.body;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(resRating).to.be.a('object');
          expect(resRating._id).to.equal(dataRating.id);
          expect(mongoose.Types.ObjectId(resRating.placeId)).to.deep.equal((mongoose.Types.ObjectId(dataRating.placeId)));
          expect(resRating.rating.calmEnvironment).to.equal(dataRating.rating.calmEnvironment);
          expect(resRating.rating.comfySeating).to.equal(dataRating.rating.comfySeating);
          expect(resRating.rating.hotFoodDrink).to.equal(dataRating.rating.hotFoodDrink);
          expect(resRating.rating.softFabrics).to.equal(dataRating.rating.softFabrics);
          expect(resRating.rating.comment).to.equal(dataRating.rating.comment);
          expect(resRating.rating.relaxedMusic).to.equal(dataRating.rating.relaxedMusic);
          expect(resRating.rating.warmLighting).to.equal(dataRating.rating.warmLighting);
          expect(mongoose.Types.ObjectId(resRating.userId)).to.deep.equal(dataRating.userId);
        });
    });

    it('should return a 400 if passed an invalid id', function() {
      const id = 3;
      return chai.request(app)
        .get(`/api/ratings/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .then(function (res) {
          const message = JSON.parse(res.text).message;
          expect(message).to.equal('The `place id` is not valid');
          expect(res).to.have.status(400);
        });
    });

    it('should return a 204 if passed a placeId that a user has not rated yet', function() {
      // how do we come up with a valid folder and know that it's not in the database?
      const id = '111111111111131111112285';
      return chai.request(app)
        .get(`/api/ratings/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .then(function (res) {
          expect(res).to.have.status(204);
        });
    });

  });


  describe('POST api/rating', function() {

    it('should create a rating and return a new rating when provided valid data', function () {
      let newRating = {
        'placeId' : '333333333333333333333006',
        'rating': 
          {        
            'warmLighting':     0, 
            'relaxedMusic':     0,
            'calmEnvironment':  0,
            'softFabrics':      0,
            'comfySeating':     0,
            'hotFoodDrink':     0,
            'comment': 'Love this place - super cozy!'
          }     
      };

      let res;
      return chai.request(app)
        .post('/api/ratings')
        .send(newRating)
        .set('Authorization', `Bearer ${token}`)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('placeId', 'id', 'userId', 'rating');
          return Rating.findById(res.body.id);
        })
        .then(data => {
          let dataRating = data;
          let resRating = res.body;
          expect(resRating.id).to.equal(dataRating.id);
          expect(mongoose.Types.ObjectId(resRating.placeId)).to.deep.equal((mongoose.Types.ObjectId(dataRating.placeId)));
          expect(resRating.rating.calmEnvironment).to.equal(dataRating.rating.calmEnvironment);
          expect(resRating.rating.comfySeating).to.equal(dataRating.rating.comfySeating);
          expect(resRating.rating.hotFoodDrink).to.equal(dataRating.rating.hotFoodDrink);
          expect(resRating.rating.softFabrics).to.equal(dataRating.rating.softFabrics);
          expect(resRating.rating.comment).to.equal(dataRating.rating.comment);
          expect(resRating.rating.relaxedMusic).to.equal(dataRating.rating.relaxedMusic);
          expect(resRating.rating.warmLighting).to.equal(dataRating.rating.warmLighting);
          expect(mongoose.Types.ObjectId(resRating.userId)).to.deep.equal(dataRating.userId);
        });
        
    });


    it('should respond with a 400 if you attempt to make a rating without a rating within the rating', function () {
      const rating = { };

      return chai.request(app)
        .post('/api/ratings')
        .send(rating)
        .set('Authorization', `Bearer ${token}`)
        .then(function (res) {
          const message = JSON.parse(res.text).message;
          expect(message).to.equal('Missing `rating` in request body');
          expect(res).to.have.status(400);
        });
       
    });

    it('should return a 400 if passed an invalid place id', function() {
      let newRating = {
        'placeId' : '3',
        'rating': 
          {        
            'warmLighting':     0, 
            'relaxedMusic':     0,
            'calmEnvironment':  0,
            'softFabrics':      0,
            'comfySeating':     0,
            'hotFoodDrink':     0,
            'comment': 'Love this place - super cozy!'
          }     
      };
      return chai.request(app)
        .post('/api/ratings')
        .send(newRating)
        .set('Authorization', `Bearer ${token}`)
        .then(function (res) {
          const message = JSON.parse(res.text).message;
          expect(message).to.equal('The `place id` is not valid');
          expect(res).to.have.status(400);
        });
    });

   
    it('should return an error when trying to post a rating on the same place twice', function () {
      let newRating = {
        'placeId' : '333333333333333333333006',
        'rating': 
          {        
            'warmLighting':     0, 
            'relaxedMusic':     0,
            'calmEnvironment':  0,
            'softFabrics':      0,
            'comfySeating':     0,
            'hotFoodDrink':     0,
            'comment': 'Love this place - super cozy!'
          }     
      };

      let res;
      return chai.request(app)
        .post('/api/ratings')
        .send(newRating)
        .set('Authorization', `Bearer ${token}`)
        .then(_res => {
          return chai.request(app)
            .post('/api/ratings')
            .send(newRating)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          const message = JSON.parse(res.text).message;
          expect(message).to.equal('You have already posted a rating');
          expect(res).to.have.status(400);
          expect(res.body.reason).to.equal('ValidationError');
        });
    });

  });





  describe('PUT api/ratings', function() {

    it.only('should update ratings you send over', function() {
      let updatedRating = {
        'placeId' : '333333333333333333333002',
        'rating': 
          {        
            'warmLighting':     0, 
            'relaxedMusic':     0,
            'calmEnvironment':  0,
            'softFabrics':      0,
            'comfySeating':     0,
            'hotFoodDrink':     0,
            'comment': 'Updated - super cozy!'
          }     
      };

      const placeId = '333333333333333333333002';
      
      let data;
      let _res;
      return Rating.findOne({userId: user.id, placeId })
        .then(_data => {
          data = _data;
          return chai.request(app).put(`/api/ratings/${data.id}`)
            .send(updatedRating).set('Authorization', `Bearer ${token}`);
        })
        .then((res) => {
          _res = res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'rating', 'placeId', 'userId');
          return Rating.findById(data.id);
        })
        .then(data => {
          let dataRating = data;
          let resRating = _res.body;
          expect(resRating.id).to.equal(dataRating.id);
          expect(mongoose.Types.ObjectId(resRating.placeId)).to.deep.equal((mongoose.Types.ObjectId(dataRating.placeId)));
          expect(resRating.rating.calmEnvironment).to.equal(dataRating.rating.calmEnvironment);
          expect(resRating.rating.comfySeating).to.equal(dataRating.rating.comfySeating);
          expect(resRating.rating.hotFoodDrink).to.equal(dataRating.rating.hotFoodDrink);
          expect(resRating.rating.softFabrics).to.equal(dataRating.rating.softFabrics);
          expect(resRating.rating.comment).to.equal(dataRating.rating.comment);
          expect(resRating.rating.relaxedMusic).to.equal(dataRating.rating.relaxedMusic);
          expect(resRating.rating.warmLighting).to.equal(dataRating.rating.warmLighting);
          expect(mongoose.Types.ObjectId(resRating.userId)).to.deep.equal(dataRating.userId);
        });

    });

    it.only('should respond with a 400 if you attempt to update a rating with an invalid ratingId', function () {
      let updatedRating = {
        'placeId' : '333333333333333333333006',
        'rating': 
          {        
            'warmLighting':     0, 
            'relaxedMusic':     0,
            'calmEnvironment':  0,
            'softFabrics':      0,
            'comfySeating':     0,
            'hotFoodDrink':     0,
            'comment': 'Updated - super cozy!'
          }     
      };

          return chai.request(app).put(`/api/ratings/3`)
            .send(updatedRating).set('Authorization', `Bearer ${token}`)
        .then((res) => {
          const text = JSON.parse(res.error.text).message;
          expect(res).to.have.status(400);
          expect(text).to.equal('The `rating id` is not valid');
        });
    });

    it.only('should respond with a 400 if you attempt to update a rating with an invalid placeId', function () {
      let updatedRating = {
        'placeId' : '3',
        'rating': 
          {        
            'warmLighting':     0, 
            'relaxedMusic':     0,
            'calmEnvironment':  0,
            'softFabrics':      0,
            'comfySeating':     0,
            'hotFoodDrink':     0,
            'comment': 'Updated - super cozy!'
          }     
      };
      let id = '3';
      return chai.request(app).put(`/api/ratings/${id}`)
        .send(updatedRating).set('Authorization', `Bearer ${token}`)
        .then((res) => {
          const text = JSON.parse(res.error.text).message;
          expect(res).to.have.status(400);
          expect(text).to.equal('The `placeId` is not valid');
        });
    });

    it.only('should respond with a 400 if you attempt to update a rating without a rating', function () {
      const updateObject = {};
      let data;
      return Rating.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).put(`/api/ratings/${data.id}`)
            .send(updateObject).set('Authorization', `Bearer ${token}`);
        })
        .then((res) => {
          const text = JSON.parse(res.error.text).message;
          expect(res).to.have.status(400);
          expect(text).to.equal('Missing `rating` in request body');
        });
    });

    it('should return an error when given a duplicate name', function () {
      return Folder.find({userId: user.id}).limit(2)
        .then(results => {
          const [item1, item2] = results;
          item1.name = item2.name;
          return chai.request(app)
            .put(`/api/folders/${item1.id}`)
            .send({name: item1.name}).set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          const message = JSON.parse(res.text).message;
          expect(message).to.equal('You already have a folder with that name');
          expect(res).to.have.status(400);
        });
    });
    


  });

  describe('DELETE api/folders/:id', function() {

    it('should delete a folder by id and the children of the folder', function() {
      let data;
      return Folder.findOne({userId: user.id})
        .then(_data => {
          data = _data;
          return chai.request(app).delete(`/api/folders/${data.id}`).set('Authorization', `Bearer ${token}`);
        })
        .then((res) => {
          expect(res).to.have.status(204);
          return Note.find({folderId : data.id, userId: user.id});
        })
        .then(res => {
          expect(res).to.be.a('array');
          expect(res.length).to.equal(0);
          return Folder.find({id: data.id, userId : user.id});
        })
        .then(res => {
          expect(res).to.be.a('array');
          expect(res.length).to.equal(0);
        });
    });

    
  });



});

 