'use strict';
const Metrics = require('../../lib/managers/metrics');
const Dal = require('../../lib/dal');
const path = require('path');
const should = require('should');
const _ = require('lodash');
const async = require('async');

describe('Metrics', () => {
  let metrics, sample, dal, id, data;
  beforeEach(done => {
    sample = _.cloneDeep(require(path.join(__dirname, '../samples/hawkeye/results.json')));
    dal = new Dal();
    id = 123456;
    metrics = new Metrics({
      dal: dal
    });
    dal.flushall(() => {
      metrics.generate(id, sample, (err, generated) => {
        should.ifError(err);
        data = generated;
        done();
      });
    });
  });
  afterEach(done => {
    dal.flushall(done);
  });

  it('should update the metrics fora a repo', () => {
    should(data.items.length).eql(16);
    should(data.byLevel.critical).eql(5);
    should(data.byLevel.high).eql(3);
    should(data.byLevel.medium).eql(7);
    should(data.byLevel.low).eql(1);
    should(data.byModule.files).eql(6);
    should(data.byModule.contents).eql(1);
    should(data.byModule.ncu).eql(6);
  });

  it('should calulate what has changed', done => {
    const validateComparison = (data, next) => {
      should(data.new.items.length).eql(4);
      should(data.new.byLevel.critical).eql(1);
      should(data.new.byLevel.high).eql(1);
      should(data.new.byLevel.medium).eql(1);
      should(data.new.byLevel.low).eql(1);
      next();
    };
    const addDifferentSample = next => {
      const newSample = _.cloneDeep(require(path.join(__dirname, '../samples/hawkeye/results2.json')));
      metrics.generate(id, newSample, next);
    };
    async.waterfall([
      addDifferentSample,
      validateComparison
    ], done);
  });

  it('should let me get the latest metrics for a given repo', done => {
    metrics.latest(id, (err, data) => {
      should.ifError(err);
      should(data.items.length).eql(16);
      should(data.byLevel.critical).eql(5);
      should(data.byLevel.high).eql(3);
      should(data.byLevel.medium).eql(7);
      should(data.byLevel.low).eql(1);
      should(data.byModule.files).eql(6);
      should(data.byModule.contents).eql(1);
      should(data.byModule.ncu).eql(6);
      done();
    });
  });

});
