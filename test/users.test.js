'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_DATABASE_URL } = require('../config');

const User = require('../models/users');

const expect = chai.expect;

chai.use(chaiHttp);

describe('CozySpacesServer - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const email = 'test@gmail.com';

  before(function () {
    return mongoose.connect(TEST_DATABASE_URL)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return User.createIndexes();
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });
  
  describe('/api/users', function () {
    describe('POST', function () {
      it('Should create a new user', function () {
        const testUser = { username, password, email };

        let res;
        return chai
          .request(app)
          .post('/api/users')
          .send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'email', 'photos', 'ratings');
            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(testUser.username);
            expect(res.body.email).to.equal(testUser.email);

            return User.findOne({ username });
          })
          .then(user => {
            expect(user).to.exist;
            expect(user.id).to.equal(res.body.id);
            expect(user.email).to.equal(testUser.email);
            return user.validatePassword(password);
          })
          .then(isValid => {
            expect(isValid).to.be.true;
          });
      });

      it('Should reject users with missing username', function () {
        const testUser = { password, email };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            const message = JSON.parse(res.text).message;
            expect(message).to.equal('Missing \'username\' in request body');
            expect(res).to.have.status(422);
          });
      });

      it('Should reject users with missing password', function() {
        const testUser = { username, email };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            const message = JSON.parse(res.text).message;
            expect(message).to.equal('Missing \'password\' in request body');
            expect(res).to.have.status(422);
          });
      });

      it('Should reject users with non-string username', function() {
        const nonStringUserName = 358;
        const testUser = { username: nonStringUserName, email, password };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            const message = JSON.parse(res.text).message;
            expect(message).to.equal('Field: \'username\' must be type String');
            expect(res).to.have.status(422);
          });
      });

      it('Should reject users with non-string password', function() {
        const nonStringPassword = 358;
        const testUser = { username, email, password: nonStringPassword };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            const message = JSON.parse(res.text).message;
            expect(message).to.equal('Field: \'password\' must be type String');
            expect(res).to.have.status(422);
          });
      });

      it('Should reject users with non-trimmed username', function() {
        const nonTrimmedUsername = '   user';
        const testUser = { username: nonTrimmedUsername, email, password };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            const message = JSON.parse(res.text).message;
            expect(message).to.equal('Field: \'username\' cannot start or end with whitespace');
            expect(res).to.have.status(422);
          });
      });

      it('Should reject users with non-trimmed password', function() {
        const nonTrimmedPassword = '   password';
        const testUser = { username, email, password: nonTrimmedPassword };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            const message = JSON.parse(res.text).message;
            expect(message).to.equal('Field: \'password\' cannot start or end with whitespace');
            expect(res).to.have.status(422);
          });
      });

      it('Should reject users with empty username', function() {
        const emptyUsername = '';
        const testUser = { username: emptyUsername, email, password};
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            const message = JSON.parse(res.text).message;
            expect(message).to.equal('Field: \'username\' must be at least 1 characters long');
            expect(res).to.have.status(422);
          });
      });

      it('Should reject users with password less than 8 characters', function() {
        const smallPassword = '1234';
        const testUser = { username, email, password: smallPassword};
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            const message = JSON.parse(res.text).message;
            expect(message).to.equal('Field: \'password\' must be at least 8 characters long');
            expect(res).to.have.status(422);
          });
      });

      it('Should reject users with password greater than 72 characters', function() {
        const longPassword = 'a'.repeat(74);
        const testUser = { username, email, password: longPassword};
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            const message = JSON.parse(res.text).message;
            expect(message).to.equal('Field: \'password\' must be at most 72 characters long');
            expect(res).to.have.status(422);
          });
      });

      it('Should reject users with duplicate username', function() {
        const testUser = { username, email, password};
        return chai.request(app).post('/api/users').send(testUser)
          .then(() => {
            return chai.request(app).post('/api/users').send(testUser)
              .then(res => {
                const message = JSON.parse(res.text).message;
                expect(message).to.equal('The username already exists');
                expect(res).to.have.status(400);
              });
          });
      });
    
    });
  });
});