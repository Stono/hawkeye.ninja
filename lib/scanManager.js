'use strict';
const Scan = require('./models/scan');
const debug = require('debug')('hawkeye:scanManager');
const util = require('./util');
const JsonStore = require('./stores/jsonStore');
const List = require('./stores/list');
const ScanLog = require('./scanLog');
const Metrics = require('./metrics');
const GlobalStats = require('./globalStats');

module.exports = function ScanManager(options) {
  util.enforceArgs(options, ['encryptedRedis', 'id']);
  let self = {};
  const repoId = options.id;

  const store = new JsonStore('scans:' + options.id, options.encryptedRedis);
  const pending = new List({ id: 'scans:pending', redis: options.encryptedRedis });
  const metrics = new Metrics({ repoId: repoId, encryptedRedis: options.encryptedRedis });
  const stats = new GlobalStats({ redis: options.encryptedRedis });

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
    return store.getAll((err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { data = []; }
      done(null, map(data));
    });
  };

  self.scanLogFor = function(number) {
    return new ScanLog({ repoId: repoId, number: number, encryptedRedis: options.encryptedRedis });
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
