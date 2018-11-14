'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_DATABASE_URL, JWT_SECRET  } = require('../config');

const User = require('../models/users');
const Place = require('../models/places');
const jwt = require('jsonwebtoken');

const seedUsers = require('../db/seed/users.json');
const seedPlaces = require('../db/seed/places.json');

const expect = chai.expect;

chai.use(chaiHttp);

describe('CozySpacesServer - Reports', function () {

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
      Place.createIndexes()
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
  
  describe('/api/report', function () {
    describe('POST', function () {
      it('Should create a new report', function () {
        const placeId = '333333333333333333333001';
        let res;
        return chai
          .request(app)
          .post('/api/report')
          .send({placeId})
          .set('Authorization', `Bearer ${token}`)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('n', 'nModified', 'ok');
            expect(res.body.n).to.equal(1);
            expect(res.body.nModified).to.equal(1);
            expect(res.body.ok).to.equal(1);

            return Place.findOne({ _id : placeId });
          })
          .then(place => {
            expect(place).to.exist;
            expect(place.userReports.length).to.equal(1);
            expect(mongoose.Types.ObjectId(place.userReports[0])).to.deep.equal(mongoose.Types.ObjectId(user.id));
          });
      });


      it('Should not allow the same user to create two reports on a place', function () {
        const placeId = '333333333333333333333001';
        return chai
          .request(app)
          .post('/api/report')
          .send({placeId})
          .set('Authorization', `Bearer ${token}`)
          .then(_res => {
            return chai
              .request(app)
              .post('/api/report')
              .send({placeId})
              .set('Authorization', `Bearer ${token}`)
              .then(res => {
                const message = JSON.parse(res.text).message;
                expect(message).to.equal('You have already reported the place');
                expect(res).to.have.status(400);
                expect(res.body.reason).to.equal('No duplicate reports');
              });
          });
      });
    

      it('Should reject users with an unauthorized jwt', function () {
        const badJWT = 'fdifsdf';
        const placeId = '333333333333333333333001';
        return chai.request(app).post('/api/report').send({placeId})
          .set('Authorization', `Bearer ${badJWT}`)
          .then(res => {
            const message = JSON.parse(res.text).message;
            expect(message).to.equal('Unauthorized');
            expect(res).to.have.status(401);
          });
      });

      it('Should reject making a report on a place with invalid placeId', function() {
        const placeId = '3333333333333333333330';
        return chai.request(app).post('/api/report').send({placeId})
          .set('Authorization', `Bearer ${token}`)
          .then(res => {
            const message = JSON.parse(res.text).message;
            expect(message).to.equal('The `place id` is not valid');
            expect(res).to.have.status(400);
          });
      });
    
    });

    describe('Delete', function () {

      it('Should allow a user to delete a reports they have made', function () {
        const placeId = '333333333333333333333001';
        return chai
          .request(app)
          .post('/api/report')
          .send({placeId})
          .set('Authorization', `Bearer ${token}`)
          .then(_res => {
            return chai
              .request(app)
              .delete('/api/report')
              .send({placeId})
              .set('Authorization', `Bearer ${token}`)
              .then(res => {
                res = _res;
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.keys('n', 'nModified', 'ok');
                expect(res.body.n).to.equal(1);
                expect(res.body.nModified).to.equal(1);
                expect(res.body.ok).to.equal(1);
    
                return Place.findOne({ _id : placeId });
              })
              .then(place => {
                expect(place).to.exist;
                expect(place.userReports.length).to.equal(0);
              });
          });
      });

      it('Should not allow a user to delete reports they have not made', function () {
        const placeId = '333333333333333333333001';
        return chai
          .request(app)
          .delete('/api/report')
          .send({placeId})
          .set('Authorization', `Bearer ${token}`)
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('n', 'nModified', 'ok');
            expect(res.body.n).to.equal(1);
            expect(res.body.nModified).to.equal(0);
            expect(res.body.ok).to.equal(1);
          });
      });

      it('Should reject users with an unauthorized jwt', function () {
        const badJWT = 'fdifsdf';
        const placeId = '333333333333333333333001';
        return chai.request(app).delete('/api/report').send({placeId})
          .set('Authorization', `Bearer ${badJWT}`)
          .then(res => {
            const message = JSON.parse(res.text).message;
            expect(message).to.equal('Unauthorized');
            expect(res).to.have.status(401);
          });
      });

      it('Should reject deleting a report on a place with invalid placeId', function() {
        const placeId = '3333333333333333333330';
        return chai.request(app).delete('/api/report').send({placeId})
          .set('Authorization', `Bearer ${token}`)
          .then(res => {
            const message = JSON.parse(res.text).message;
            expect(message).to.equal('The `place id` is not valid');
            expect(res).to.have.status(400);
          });
      });

    });
  });
});