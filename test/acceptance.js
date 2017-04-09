'use strict';
const App = require('../lib/app');
const config = require('../config');
const request = require('supertest');

describe('App', () => {
  let server;
  before(() => {
    server = new App(config);
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
