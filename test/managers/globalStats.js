'use strict';
const GlobalStats = require('../../lib/managers/globalStats');
const Dal = require('../../lib/dal');
const should = require('should');

describe('Global Stats', () => {
  let globalStats, dal;
  beforeEach(done => {
    dal = new Dal();
    globalStats = new GlobalStats({ dal: dal });
    dal.flushall(done);
  });
  afterEach(done => {
    dal.flushall(done);
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
