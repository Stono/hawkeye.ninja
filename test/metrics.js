'use strict';
const Metrics = require('../lib/metrics');
const Redis = require('../lib/redis');
const config = require('../config');
const path = require('path');
const should = require('should');

describe('Metrics', () => {
  let metrics, redis;
  beforeEach(done => {
    redis = new Redis(config.redis);
    metrics = new Metrics({
      redis: redis,
      repoId: 123456
    });
    redis.on('ready', () => {
      redis.flushall(done);
    });
  });

  it('should update the metrics fora a repo', done => {
    const sample = require(path.join(__dirname, 'samples/hawkeye/results.json'));
    metrics.update(sample, err => {
      should.ifError(err);
      done();
    });
  });

  it('let me get the latest results', done => {
    const sample = require(path.join(__dirname, 'samples/hawkeye/results.json'));
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
    const sample = require(path.join(__dirname, 'samples/hawkeye/results.json'));
    metrics.update(sample, () => {
      sample.pop();
      metrics.update(sample, () => {
        sample.pop();
        metrics.update(sample, () => {
          metrics.tminus(1, (err, data) => {
            should.ifError(err);
            should(data[0].items.length).eql(1);
            should.ifError(err);
            done();
          });
        });
      });
    });
  });
});
