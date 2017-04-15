'use strict';
const GlobalStats = require('../lib/globalStats');
const Redis = require('../lib/redis');
const should = require('should');
const Dal = require('../lib/dal');

describe('Global Stats', () => {
  let globalStats, redis, dal;
  before(done => {
    redis = new Redis();
    dal = new Dal({ redis: redis });
    redis.once('ready', done);
  });
  beforeEach(done => {
    globalStats = new GlobalStats({ dal: dal });
    redis.flushall(done);
  });
  afterEach(done => {
    redis.flushall(done);
  });

  it('should return all stats', done => {
    globalStats.all((err, data) => {
      should.ifError(err);
      should(data.users).eql(0);
      should(data.scans).eql(0);
      should(data.repos).eql(0);
      should(data.issues).eql(0);
      done();
    });
  });

});

