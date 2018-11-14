'use strict';

// Clear the console before each run
// process.stdout.write("\x1Bc\n");

//nyc --reporter=lcov --reporter=text cross-env NODE_ENV=test mocha --file test/server.test.js --timeout 30000 --exit

const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../server');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Basic Express setup', () => {

  describe('404 handler', () => {

    it('should respond with 404 when given a bad path', () => {
      return chai.request(app)
        .get('/bad/path')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });
});