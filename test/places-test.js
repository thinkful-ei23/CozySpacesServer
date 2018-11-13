'use strict';

const { TEST_DATABASE_URL, JWT_SECRET  } = require('../config');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');

const User = require('../models/users');
const seedUsers = require('../db/seed/users');

const { app } = require('../server');
const Place = require('../models/places');
const Rating = require('../models/ratings');


const seedplaces = require('../db/seed/places');
const seedRatings = require('../db/seed/ratings');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Cozy Spaces API', function () {

  before(function () {
    return mongoose.connect(TEST_DATABASE_URL)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  let token;
  let user;
  beforeEach(function () {
    return Promise.all([
      User.insertMany(seedUsers),
      User.createIndexes(),

      Place.insertMany(seedplaces),

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

  describe('GET /api/places', function () {

    it('should return places near a specified location', function () {

      // const lat = parseFloat(45.536223);
      // const lng = parseFloat(-122.883890);
      const dbPromise =   Place.find({ archived : false,
        location: {
          $near: {
            $maxDistance: 60000,
            $geometry: {
              type: 'Point',
              coordinates: [-122.883890, 45.536223]
            }
          }
        }
      });

      const apiPromise = chai.request(app)
        .get('/api/places')
        .set('Authorization', `Bearer ${token}`); 

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it.only('should return a list of Places with the correct fields', function () {
      return Promise.all([
        Place.find({ userId: user.id }).sort({ updatedAt: 'desc' }),
        chai.request(app).get('/api/places')
        .set('Authorization', `Bearer ${token}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            // Place: RatingId and content are optional
            expect(item).to.include.all.keys(
              'name', 
              'type',
              'address', 
              'city', 
              'state', 
              'zipcode', 
              'location', 
              'averageCozyness',
              'averageRelaxedMusic',
              'averageCalmEnvironment',
              'averageSoftFabrics',
              'averageComfySeating',
              'averageHotFoodDrink',
              'photos',
              'ratings',
              'userReports',
              'archived'
            );
            expect(item.name).to.equal(data[i].name);
            expect(item.type).to.equal(data[i].type);
            expect(item.address).to.equal(data[i].address);
            expect(item.city).to.equal(data[i].city);
            expect(item.state).to.equal(data[i].state);
            expect(item.zipcode).to.equal(data[i].zipcode);
            expect(item.location).to.equal(data[i].location);
            expect(item.averageCozyness).to.equal(data[i].averageCozyness);
            expect(item.averageSoftFabrics).to.equal(data[i].averageSoftFabrics);
            expect(item.averageComfySeating).to.equal(data[i].averageComfySeating);
            expect(item.averageHotFoodDrink).to.equal(data[i].averageHotFoodDrink);
            expect(item.photos).to.equal(data[i].photos);
            expect(item.ratings).to.equal(data[i].photos);
            expect(item.userReports).to.equal(data[i].userReports);
            expect(item.archived).to.equal(data[i].archived);
        });
      });
    });
      it('should return cozy places within 60km with GET query', function () {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const dbPromise = Place.find({ archived : false,
          location: {
            $near: {
              $maxDistance: 60000,
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              }
            }
          }
        })
        const apiPromise = chai.request(app)
          .get(`/api/places`)
          .set('Authorization', `Bearer ${token}`);

        return Promise.all([dbPromise, apiPromise])
          .then(([data, res]) => {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.a('array');
            expect(res.body).to.have.length(1);
            res.body.forEach(function (item, i) {
              expect(item).to.be.a('object');
              expect(item).to.include.all.keys(
                'name', 
                'type',
                'address', 
                'city', 
                'state', 
                'zipcode', 
                'location', 
                'averageCozyness',
                'averageRelaxedMusic',
                'averageCalmEnvironment',
                'averageSoftFabrics',
                'averageComfySeating',
                'averageHotFoodDrink',
                'photos',
                'ratings',
                'userReports',
                'archived'
              );
              expect(item.name).to.equal(data[i].name);
              expect(item.type).to.equal(data[i].type);
              expect(item.address).to.equal(data[i].address);
              expect(item.city).to.equal(data[i].city);
              expect(item.state).to.equal(data[i].state);
              expect(item.zipcode).to.equal(data[i].zipcode);
              expect(item.location).to.equal(data[i].location);
              expect(item.averageCozyness).to.equal(data[i].averageCozyness);
              expect(item.averageSoftFabrics).to.equal(data[i].averageSoftFabrics);
              expect(item.averageComfySeating).to.equal(data[i].averageComfySeating);
              expect(item.averageHotFoodDrink).to.equal(data[i].averageHotFoodDrink);
              expect(item.photos).to.equal(data[i].photos);
              expect(item.ratings).to.equal(data[i].photos);
              expect(item.userReports).to.equal(data[i].userReports);
              expect(item.archived).to.equal(data[i].archived);
            });
          });
      });
  });
  describe('GET /api/places/:id', function () {

    it('should return correct places', function () {
      let data;
      return Place.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
          .get(`/api/places/${data.id}`)
          .set('Authorization', `Bearer ${token}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          ////console.log('res.body: ', res.body);
          expect(item).to.include.all.keys(
            'name', 
            'type',
            'address', 
            'city', 
            'state', 
            'zipcode', 
            'location', 
            'averageCozyness',
            'averageRelaxedMusic',
            'averageCalmEnvironment',
            'averageSoftFabrics',
            'averageComfySeating',
            'averageHotFoodDrink',
            'photos',
            'ratings',
            'userReports',
            'archived'
          );
          expect(item.name).to.equal(data[i].name);
          expect(item.type).to.equal(data[i].type);
          expect(item.address).to.equal(data[i].address);
          expect(item.city).to.equal(data[i].city);
          expect(item.state).to.equal(data[i].state);
          expect(item.zipcode).to.equal(data[i].zipcode);
          expect(item.location).to.equal(data[i].location);
          expect(item.averageCozyness).to.equal(data[i].averageCozyness);
          expect(item.averageSoftFabrics).to.equal(data[i].averageSoftFabrics);
          expect(item.averageComfySeating).to.equal(data[i].averageComfySeating);
          expect(item.averageHotFoodDrink).to.equal(data[i].averageHotFoodDrink);
          expect(item.photos).to.equal(data[i].photos);
          expect(item.ratings).to.equal(data[i].photos);
          expect(item.userReports).to.equal(data[i].userReports);
          expect(item.archived).to.equal(data[i].archived);
        });
    });

    it('should respond with status 400 and an error message when `id` is not valid', function () {
      return chai.request(app)
        .get('/api/places/NOT-A-VALID-ID').set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      // The string "DOESPlaceXIST" is 12 bytes which is a valid Mongo ObjectId
      return chai.request(app)
        .get('/api/places/DOESPlaceXIST').set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });

  // describe('POST /api/places', function () {

  //   it('should create and return a new item when provided valid data', function () {
  //     const newItem = {
  //       title: 'The best article about cats ever!',
  //       content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
  //     };
  //     let res;
  //     return chai.request(app)
  //       .post('/api/places')
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(newItem)
  //       .then(function (_res) {
  //         res = _res;
  //         expect(res).to.have.status(201);
  //         expect(res).to.have.header('location');
  //         expect(res).to.be.json;
  //         expect(res.body).to.be.a('object');
  //         expect(res.body).to.have.all.keys('id', 'userId','title', 'content', 'createdAt', 'updatedAt', 'tags');
  //         return Place.findById(res.body.id);
  //       })
  //       .then(data => {
  //         expect(res.body.id).to.equal(data.id);
  //         expect(res.body.title).to.equal(data.title);
  //         expect(res.body.content).to.equal(data.content);
  //         expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
  //         expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
  //       });
  //   });

  //   it('should return an error when missing "title" field', function () {
  //     const newItem = {
  //       content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
  //     };
  //     return chai.request(app)
  //       .post('/api/places')
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(newItem)
  //       .then(res => {
  //         expect(res).to.have.status(400);
  //         expect(res).to.be.json;
  //         expect(res.body).to.be.a('object');
  //         expect(res.body.message).to.equal('Missing `title` in request body');
  //       });
  //   });

  //   it('should return an error when `RatingId` is not valid ', function () {
  //     const newItem = {
  //       title: 'What about dogs?!',
  //       content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...',
  //       RatingId: 'NOT-A-VALID-ID'
  //     };
  //     return chai.request(app)
  //       .post('/api/places').set('Authorization', `Bearer ${token}`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(newItem)
  //       .then(res => {
  //         expect(res).to.have.status(400);
  //         expect(res).to.be.json;
  //         expect(res.body).to.be.a('object');
  //         expect(res.body.message).to.equal('The `RatingId` is not valid');
  //       });
  //   });

  //   it('should return an error when a tags `id` is not valid ', function () {
  //     const newItem = {
  //       title: 'What about dogs?!',
  //       content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...',
  //       tags: ['NOT-A-VALID-ID']
  //     };
  //     return chai.request(app)
  //       .post('/api/places').set('Authorization', `Bearer ${token}`)
  //       .send(newItem)
  //       .then(res => {
  //         expect(res).to.have.status(400);
  //         expect(res).to.be.json;
  //         expect(res.body).to.be.a('object');
  //         expect(res.body.message).to.equal('The `tags` array contains an invalid `id`');
  //       });
  //   });

  // });

  // describe('PUT /api/places/:id', function () {

  //   it('should update the Place when provided valid data', function () {
  //     const updateItem = {
  //       title: 'What about dogs?!',
  //       content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
  //     };
  //     let data;
  //     return Place.findOne({userId:user.id})

  //       .then(_data => {
  //         data = _data;
  //         return chai.request(app)
  //           .put(`/api/places/${data.id}`)
  //           .set('Authorization', `Bearer ${token}`)
  //           .send(updateItem);
  //       })
  //       .then(function (res) {
  //         expect(res).to.have.status(200);
  //         expect(res).to.be.json;
  //         expect(res.body).to.be.a('object');
  //         expect(res.body).to.have.all.keys('id', 'userId', 'title', 'content', 'RatingId', 'createdAt', 'updatedAt',  'tags');
  //         expect(res.body.id).to.equal(data.id);
  //         expect(res.body.title).to.equal(updateItem.title);
  //         expect(res.body.content).to.equal(updateItem.content);
  //         expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
  //         // expect Place to have been updated
  //         expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
  //       });
  //   });

  //   it('should respond with status 400 and an error message when `id` is not valid', function () {
  //     const updateItem = {
  //       title: 'What about dogs?!',
  //       content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
  //     };
  //     return chai.request(app)
  //       .put('/api/places/NOT-A-VALID-ID')
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(updateItem)
  //       .then(res => {
  //         expect(res).to.have.status(400);
  //         expect(res.body.message).to.equal('The `id` is not valid');
  //       });
  //   });

  //   it('should respond with a 404 for an id that does not exist', function () {
  //     // The string "DOESPlaceXIST" is 12 bytes which is a valid Mongo ObjectId
  //     const updateItem = {
  //       title: 'What about dogs?!',
  //       content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
  //     };
  //     return chai.request(app)
  //       .put('/api/places/DOESPlaceXIST').set('Authorization', `Bearer ${token}`)
  //       .send(updateItem)
  //       .then(res => {
  //         expect(res).to.have.status(404);
  //       });
  //   });

  //   it('should return an error when "title" is an empty string', function () {
  //     const updateItem = {
  //       title: ''
  //     };
  //     let data;
  //     return Place.findOne()
  //       .then(_data => {
  //         data = _data;
  //         return chai.request(app)
  //           .put(`/api/places/${data.id}`)
  //           .set('Authorization', `Bearer ${token}`)
  //           .send(updateItem);
  //       })
  //       .then(res => {
  //         expect(res).to.have.status(400);
  //         expect(res).to.be.json;
  //         expect(res.body).to.be.a('object');
  //         expect(res.body.message).to.equal('Missing `title` in request body');
  //       });
  //   });

  //   it('should return an error when `RatingId` is not valid ', function () {
  //     const updateItem = {
  //       RatingId: 'NOT-A-VALID-ID'
  //     };
  //     return Place.findOne()
  //       .then(data => {
  //         return chai.request(app)
  //           .put(`/api/places/${data.id}`).set('Authorization', `Bearer ${token}`)
  //           .send(updateItem);
  //       })
  //       .then(res => {
  //         expect(res).to.have.status(400);
  //         expect(res).to.be.json;
  //         expect(res.body).to.be.a('object');
  //         expect(res.body.message).to.equal('The `RatingId` is not valid');
  //       });
  //   });

  //   it('should return an error when a tags `id` is not valid ', function () {
  //     const updateItem = {
  //       tags: ['NOT-A-VALID-ID']
  //     };
  //     return Place.findOne({ userId: user.id })
  //       .then(data => {
  //         return chai.request(app)
  //           .put(`/api/places/${data.id}`).set('Authorization', `Bearer ${token}`)
  //           .send(updateItem);
  //       })
  //       .then(res => {
  //         expect(res).to.have.status(400);
  //         expect(res).to.be.json;
  //         expect(res.body).to.be.a('object');
  //         expect(res.body.message).to.equal('The `tagsId` is not valid');
  //       });
  //   });

  // });

  // describe('DELETE /api/places/:id', function () {

  //   it('should delete an existing document and respond with 204', function () {
  //     let data;
  //     return Place.findOne()
  //       .then(_data => {
  //         data = _data;
  //         return chai.request(app).delete(`/api/places/${data.id}`).set('Authorization', `Bearer ${token}`);
  //       })
  //       .then(function (res) {
  //         expect(res).to.have.status(204);
  //         return Place.count({ _id: data.id });
  //       })
  //       .then(count => {
  //         expect(count).to.equal(0);
  //       });
  //   });

  //   it('should respond with a 400 for an invalid id', function () {
  //     return chai.request(app)
  //       .delete('/api/places/NOT-A-VALID-ID').set('Authorization', `Bearer ${token}`)
  //       .then(res => {
  //         expect(res).to.have.status(400);
  //         expect(res.body.message).to.equal('The `id` is not valid');
  //       });
  //   });

  // });

});