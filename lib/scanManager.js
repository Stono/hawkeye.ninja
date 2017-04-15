'use strict';
const Scan = require('./models/scan');
const debug = require('debug')('hawkeye:scanManager');
const util = require('./util');
const ScanLog = require('./scanLog');
const Metrics = require('./metrics');
const GlobalStats = require('./globalStats');

module.exports = function ScanManager(options) {
  util.enforceArgs(options, ['dal', 'id']);
  let self = {};
  const repoId = options.id;
  const store = options.dal.collection('scans:' + options.id);
  const pending = options.dal.fifoList('scans:pending');
  const metrics = new Metrics({ repoId: repoId, dal: options.dal });
  const stats = new GlobalStats({ dal: options.dal });

  self.pushPending = function(scan, repo, oauth, done) {
    const model = {
      scan: scan,
      repo: repo,
      oauth: oauth
    };
    pending.push(model, () => {
      return done(null, scan);
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

  self.schedule = function(options, done) {
    util.enforceArgs(options, ['oauth', 'repo']);
    util.enforceArgs(options.oauth, ['accessToken']);
    util.enforceArgs(options.repo, ['id']);

    return self.scans((err, data) => {
      const number = data.length + 1;
      if(number === 1) {
        stats.repos(1, () => {
          debug('incremented repo stat by 1');
        });
      }
      debug(repoId, 'scheduling new scan', number);
      const scan = new Scan({
        number: number
      });
      const scanSaved = err => {
        if(err) { return done(err); }
        self.pushPending(scan, options.repo, options.oauth, done);
      };

      store.set(scan.number, scan, scanSaved);
    });
  };

  let update = (number, status, output, done) => {
    stats.scans(1, () => {
      metrics.update(output, (err, metrics) => {
        const issues = (!util.isEmpty(metrics.items)) ? metrics.items.length : 0;
        stats.issues(issues, () => {
          self.get(number, (err, data) => {
            if(err) { return done(err); }
            if(util.isEmpty(data)) { return done(); }
            data.status = status;
            data.metrics = metrics;
            store.set(number, data, done);
          });
        });
      });
    });
  };

  self.pass = function(number, output, done) {
    update(number, 'pass', output, done);
  };

  self.fail = function(number, output, done) {
    update(number, 'fail', output, done);
  };

  self.get = function(number, done) {
    self.scans((err, data) => {
      if(err) { return done(err); }
      let result = data.find(x => { return x.number === number });
      done(null, result);
    });
  };
  return Object.freeze(self);
};
