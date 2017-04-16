'use strict';
const App = require('../lib/app');
const config = require('../config');
const request = require('supertest');
const freePort = require('find-free-port');
const _ = require('lodash');
const should = require('should');
const logger = require('superagent-logger');

describe('App', () => {
  let server;
  beforeEach(done => {
    let modifiedConfig = _.cloneDeep(config);
    freePort(5100, 5200, (err, port) => {
      should.ifError(err);
      modifiedConfig.port = port;
      server = new App(modifiedConfig);
      server.start(done);
    });
  });
  afterEach(done => {
    server.stop(done);
  });

  it('should start', done => {
    request(server.app)
    .get('/')
    .use(logger)
    .expect(200)
    .end(done);
  });
  it('should redirect to github login', done => {
    request(server.app)
    .get('/oauth/github')
    .use(logger)
    .expect(302)
    .expect('Location', new RegExp(config.github.authorizationURL))
    .end(done);
  });
  it('should redirect protected pages to login', done => {
    request(server.app)
    .get('/repo/org/name')
    .use(logger)
    .expect(302)
    .expect('Location', '/oauth/github')
    .end(done);
  });
});
