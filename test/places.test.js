'use strict';

const { TEST_DATABASE_URL, JWT_SECRET  } = require('../config');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('../models/users');

const Place = require('../models/places');
const Rating = require('../models/ratings');
const Photo = require('../models/photos');

const seedUsers = require('../db/seed/users.json');
const seedPlaces = require('../db/seed/places.json');
const seedRatings = require('../db/seed/ratings.json');
const seedPhotos = require('../db/seed/photos.json');

const app = require('../server');

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

      Place.insertMany(seedPlaces),
      Place.createIndexes(),

      Rating.insertMany(seedRatings),
      Rating.createIndexes(),

      Photo.insertMany(seedPhotos),
      Photo.createIndexes()

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

      const lat = parseFloat(45.536223);
      const lng = parseFloat(-122.883890);
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
      });

      const apiPromise = chai.request(app)
        .get('/api/places?lat=45.536223&lng=-122.883890')
        .set('Authorization', `Bearer ${token}`); 

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list of Places with the correct fields', function () {

      const lat = parseFloat(45.536223);
      const lng = parseFloat(-122.883890);
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
      });

      const apiPromise = chai.request(app)
        .get('/api/places?lat=45.536223&lng=-122.883890')
        .set('Authorization', `Bearer ${token}`); 

      return Promise.all([dbPromise, apiPromise])
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
            expect(item.location.coordinates[0]).to.equal(data[i].location.coordinates[0]);
            expect(item.location.coordinates[1]).to.equal(data[i].location.coordinates[1]);
            expect(item.averageCozyness).to.equal(data[i].averageCozyness);
            expect(item.averageSoftFabrics).to.equal(data[i].averageSoftFabrics);
            expect(item.averageComfySeating).to.equal(data[i].averageComfySeating);
            expect(item.averageHotFoodDrink).to.equal(data[i].averageHotFoodDrink);
            expect(item.photos.length).to.equal(data[i].photos.length);
            expect(item.ratings.length).to.equal(data[i].ratings.length);
            expect(item.userReports.length).to.equal(data[i].userReports.length);
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
          const item = res.body;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          //console.log('res.body: ', res.body);
          expect(res.body).to.include.all.keys(
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
            // 'userReports',
            'archived'
          );
          expect(res.body.name).to.equal(data.name);
          expect(res.body.type).to.equal(data.type);
          expect(res.body.address).to.equal(data.address);
          expect(res.body.city).to.equal(data.city);
          expect(res.body.state).to.equal(data.state);
          expect(res.body.zipcode).to.equal(data.zipcode);
          expect(res.body.location.coordinates[0]).to.equal(data.location.coordinates[0]);
          expect(res.body.averageCozyness).to.equal(data.averageCozyness);
          expect(res.body.averageWarmLighting).to.equal(data.averageWarmLighting);
          expect(res.body.averageSoftFabrics).to.equal(data.averageSoftFabrics);
          expect(res.body.averageComfySeating).to.equal(data.averageComfySeating);
          expect(res.body.averageHotFoodDrink).to.equal(data.averageHotFoodDrink);
          // expect(res.body.userReports).to.equal(data.userReports);
          expect(res.body.archived).to.equal(data.archived);
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

  });

  describe('POST /api/places', function () {

    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        name : 'Jar Jar Coffee Shop',
        type : 'coffee shop',
        address :  '900 SW 5th Ave.',
        city: 'Portland',
        state : 'Oregon',
        zipcode: '97204',
        location: {type: 'Point',
          coordinates: [-122.678034, 45.516993],
        },
        photos: ['444444444444444444444000']
      };
      let res;
      return chai.request(app)
        .post('/api/places')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          console.log('res.body: ', res.body);
          expect(res.body).to.have.all.keys(
            'id',
            'name', 
            'type',
            'address', 
            'city', 
            'state', 
            'zipcode', 
            'location', 
            'averageCozyness',
            'averageWarmLighting',
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
          return Place.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(res.body.type).to.equal(data.type);
          expect(res.body.address).to.equal(data.address);
          expect(res.body.city).to.equal(data.city);
          expect(res.body.state).to.equal(data.state);
          expect(res.body.zipcode).to.equal(data.zipcode);
          expect(res.body.location.coordinates[0]).to.equal(data.location.coordinates[0]);
          expect(res.body.averageCozyness).to.equal(0);
          expect(res.body.averageWarmLighting).to.equal(0);
          expect(res.body.averageRelaxedMusic).to.equal(0);
          expect(res.body.averageCalmEnvironment).to.equal(0);
          expect(res.body.averageSoftFabrics).to.equal(0);
          expect(res.body.averageComfySeating).to.equal(0);
          expect(res.body.averageHotFoodDrink).to.equal(0);
          expect(mongoose.Types.ObjectId(res.body.photos[0])).to.deep.equal(data.photos[0]);
          expect(res.body.archived).to.equal(data.archived);
        });
    });
  });
});
