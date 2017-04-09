'use strict';
const App = require('../lib/app');
const config = require('../config');
const request = require('supertest');
const freePort = require('find-free-port');
const _ = require('lodash');
const should = require('should');

describe('App', () => {
  let server;
  before(() => {
    let modifiedConfig = _.cloneDeep(config);
    freePort(5000, 5100, (err, port) => {
      should.ifError(err);
      modifiedConfig.port = port;
      server = new App(modifiedConfig);
    });
  });
  beforeEach(done => {
    server.start(done);
  });
  afterEach(done => {
    server.stop(done);
  });
  it('should start', done => {
    request(server.app)
    .get('/')
    .expect(200)
    .end(done);
  });
});
