'use strict';
const Metrics = require('../../lib/managers/metrics');
const Dal = require('../../lib/dal');
const path = require('path');
const should = require('should');
const _ = require('lodash');
const async = require('async');

describe('Metrics', () => {
  let metrics, sample, dal, id;
  beforeEach(done => {
    sample = _.cloneDeep(require(path.join(__dirname, '../samples/hawkeye/results.json')));
    dal = new Dal();
    id = 123456;
    metrics = new Metrics({
      dal: dal
    });
    dal.flushall(done);
  });
  afterEach(done => {
    dal.flushall(done);
  });

  it('should update the metrics fora a repo', done => {
    metrics.update(id, sample, done);
  });

  it('let me get the latest results', done => {
    async.series([
      next => { metrics.update(id, sample, next); },
        next => { sample.pop(); next(); },
        next => { metrics.update(id, sample, next); },
        next => {
        metrics.latest(id, (err, data) => {
          should(data.items.length).eql(13);
          should(data.byLevel.critical).eql(4);
          should(data.byLevel.high).eql(2);
          should(data.byLevel.medium).eql(6);
          should(data.byLevel.low).eql(1);
          should(data.byModule.files).eql(6);
          should(data.byModule.contents).eql(1);
          should(data.byModule.ncu).eql(6);
          should.ifError(err);
          next();
        });
      }], done);
  });

  it('let me get a range of tminus results', done => {
    async.series([
      next => { metrics.update(id, sample, next); },
        next => { sample.pop(); next(); },
        next => { metrics.update(id, sample, next); },
        next => { sample.pop(); next(); },
        next => { metrics.update(id, sample, next); },
        next => {
        metrics.tminus(id, 1, (err, data) => {
          should.ifError(err);
          should(data[0].items.length).eql(7);
          should.ifError(err);
          next();
        });
      }], done);
  });
});
