'use strict';
const Throttler = require('../lib/throttler');
const Dal = require('../lib/dal');
const deride = require('deride');
const should = require('should');

describe('Throttler', () => {
  let throttler, dal;
  beforeEach(done => {
    dal = new Dal();
    throttler = new Throttler({ dal: dal });
    dal.flushall(done);
  });
  afterEach(done => {
    dal.flushall(done);
  });
  it('Should throttle requests', done => {
    const middleware = throttler.middleware({
      key: 'query.token',
      amount: 1,
      per: 60
    });
    const req = {
      query: {
        token: 'testing'
      }
    };
    const res = deride.stub(['sendStatus']);
    res.setup.sendStatus.toDoThis(code => {
      should(code).eql(429);
      done();
    });
    let nextCalled = 0;
    const next = () => {
      nextCalled = nextCalled + 1;
      if(nextCalled === 2) { return done(new Error('Next was called twice, it should have been throttled')); }
      middleware(req, res, next);
    };
    middleware(req, res, next);
  });
  it('Should throttle requests based on multiple paramters', done => {
    const middleware = throttler.middleware({
      key: ['query.token', 'query.another'],
      amount: 1,
      per: 60
    });
    const req = {
      query: {
        token: 'testing',
        another: 'thing'
      }
    };
    const res = deride.stub(['sendStatus']);
    res.setup.sendStatus.toDoThis(code => {
      should(code).eql(429);
      done();
    });
    let nextCalled = 0;
    const next = () => {
      nextCalled = nextCalled + 1;
      if(nextCalled === 2) { return done(new Error('Next was called twice, it should have been throttled')); }
      middleware(req, res, next);
    };
    middleware(req, res, next);
  });
  it('Should not throttle when the keys arent all present', function(done) {
    this.timeout(2000);
    const middleware = throttler.middleware({
      key: ['query.token', 'query.missing'],
      amount: 1,
      per: 60
    });
    const req = {
      query: {
        token: 'testing'
      }
    };
    const res = deride.stub(['sendStatus']);
    res.setup.sendStatus.toDoThis(code => {
      return done(new Error('Code: ' + code + ' returned, it shouldnt have been throttled'));
    });
    let nextCalled = 0;
    const next = () => {
      nextCalled = nextCalled + 1;
      if(nextCalled === 2) {
        return done();
      }
      setTimeout(() => {
        middleware(req, res, next);
      }, 1001);
    };
    middleware(req, res, next);
  });
  it('Should not throttle when the "per" has expired', function(done) {
    this.timeout(2000);
    const middleware = throttler.middleware({
      key: 'query.token',
      amount: 1,
      per: 1
    });
    const req = {
      query: {
        token: 'testing'
      }
    };
    const res = deride.stub(['sendStatus']);
    res.setup.sendStatus.toDoThis(code => {
      return done(new Error('Code: ' + code + ' returned, it shouldnt have been throttled'));
    });
    let nextCalled = 0;
    const next = () => {
      nextCalled = nextCalled + 1;
      if(nextCalled === 2) {
        return done();
      }
      setTimeout(() => {
        middleware(req, res, next);
      }, 1001);
    };
    middleware(req, res, next);
  });
});
