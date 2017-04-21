'use strict';
const Scan = require('../models/scan');
const util = require('../util');
const ScanLog = require('../scanLog');
const Metrics = require('./metrics');
const GlobalStats = require('./globalStats');
const debug = require('debug')('hawkeye:scanManager');
const async = require('async');

module.exports = function ScanManager(options) {
  util.enforceArgs(options, ['dal', 'id']);
  let self = {};
  const repoId = options.id;
  const store = options.dal.collection('scans:' + options.id);
  const pending = options.dal.fifoList('scans:pending');
  const stats = new GlobalStats({ dal: options.dal });
  const metrics = new Metrics({ dal: options.dal });

  self.pushPending = function(scan, repo, oauth, token, done) {
    const model = {
      scan: scan,
      repo: repo,
      oauth: oauth,
      token: token
    };
    pending.push(model, err => {
      return done(err, scan);
    });
  };

  self.popPending = function(done) {
    pending.pop(done);
  };

  let map = data => {
    return Object.keys(data).map(m => { return data[m] });
  };

  self.scans = function(done) {
    return store.all((err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { data = []; }
      done(null, map(data));
    });
  };

  self.scanLogFor = function(number) {
    return new ScanLog({ repoId: repoId, number: number, dal: options.dal });
  };

  let incrementScans = (reason, done) => {
    return self.scans((err, data) => {
      const number = data.length + 1;
      if(number === 1) {
        stats.repos(1, () => {
          debug('incremented repo stat by 1');
        });
      }
      debug(repoId, 'scheduling new scan', number);
      const scan = new Scan({
        number: number,
        reason: reason
      });
      store.set(scan.number, scan, err => {
        if(err) { return done(err); }
        done(null, scan);
      });
    });
  };

  self.schedule = function(options, done) {
    util.enforceArgs(options.repo, ['id']);
    util.enforceArgs(options, ['oauth', 'repo', 'token']);
    util.enforceArgs(options.oauth, ['accessToken']);

    const pushNewPending = (scan, next) => {
      self.pushPending(scan, options.repo, options.oauth, options.token, next);
    };
    async.waterfall([
      next => { incrementScans(options.reason, next) },
        pushNewPending
    ], done);
  };

  let update = (number, metadata, output, done) => {
    util.enforceArgs(metadata, ['state']);
    const updateMetrics = next => { metrics.update(repoId, output, next); };
    let scanMetrics;
    const updateStats = (metrics, next) => {
      scanMetrics = metrics;
      const issues = (!util.isEmpty(metrics.items)) ? metrics.items.length : 0;
      stats.scans(1, () => {});
      stats.issues(issues, () => {});
      next();
    };
    const getScan = next => {
      self.get(number, next);
    };
    const updateScan = (data, next) => {
      if(util.isEmpty(data)) { return done(); }
      data.status = metadata.state;
      data.metrics = scanMetrics;
      store.set(number, data, next);
    };

    async.waterfall([
      updateMetrics,
      updateStats,
      getScan,
      updateScan
    ], done);
  };

  self.handleResult = function(result, done) {
    util.enforceArgs(result, ['results', 'metadata']);
    incrementScans(result.metadata.reason, (err, data) => {
      if(err) { return done(err); }
      update(data.number, result.metadata, result.results, done);
    });
  };

  self.handleScan = function(id, result, done) {
    util.enforceArgs(result, ['results', 'metadata']);
    update(id, result.metadata, result.results, done);
  };

  self.get = store.get;
  return Object.freeze(self);
};
