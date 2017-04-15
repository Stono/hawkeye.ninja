'use strict';
const Metrics = require('../lib/metrics');
const path = require('path');
const should = require('should');
const _ = require('lodash');
const Dal = require('../lib/dal');

describe('Metrics', () => {
  let metrics, sample, dal;
  beforeEach(done => {
    sample = _.cloneDeep(require(path.join(__dirname, 'samples/hawkeye/results.json')));
    dal = new Dal();

    metrics = new Metrics({
      dal: dal,
      repoId: 123456
    });
    dal.flushall(done);
  });
  afterEach(done => {
    dal.flushall(done);
  });

  it('should update the metrics fora a repo', done => {
    metrics.update(sample, err => {
      should.ifError(err);
      done();
    });
  });

  it('let me get the latest results', done => {
    metrics.update(sample, () => {
      sample.pop();
      metrics.update(sample, () => {
        metrics.update(sample, () => {
          metrics.latest((err, data) => {
            should(data.items.length).eql(13);
            should(data.byLevel.critical).eql(4);
            should(data.byLevel.high).eql(2);
            should(data.byLevel.medium).eql(6);
            should(data.byLevel.low).eql(1);
            should(data.byModule.files).eql(6);
            should(data.byModule.contents).eql(1);
            should(data.byModule.ncu).eql(6);
            should.ifError(err);
            done();
          });
        });
      });
    });
  });

  it('let me get a range of tminus results', done => {
    metrics.update(sample, () => {
      sample.pop();
      metrics.update(sample, () => {
        sample.pop();
        metrics.update(sample, () => {
          metrics.tminus(1, (err, data) => {
            should.ifError(err);
            should(data[0].items.length).eql(7);
            should.ifError(err);
            done();
          });
        });
      });
    });
  });
});
