'use strict';
const Scan = require('./models/scan');
const debug = require('debug')('hawkeye:scanManager');
const util = require('./util');
const JsonStore = require('./stores/jsonStore');
const List = require('./list');
const ScanLog = require('./scanLog');
module.exports = function ScanManager(options) {
  util.enforceArgs(options, ['redis', 'id']);
  let self = {};
  const repoId = options.id;

  const store = new JsonStore('scans:' + options.id, options.redis);
  const pending = new List({ id: 'scans:pending', redis: options.redis });

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

  self.scanLogFor = function(scanId) {
    return new ScanLog({ id: scanId, redis: options.redis });
  };

  self.schedule = function(options, done) {
    util.enforceArgs(options, ['oauth']);

    return self.scans((err, data) => {
      const number = data.length + 1;
      debug(repoId, 'scheduling new scan', number);
      const scan = new Scan({
        number: number
      });

      store.set(scan.number, scan, err => {
        if(err) { return done(err); }
        const model = {
          scan: scan,
          repo: options.repo,
          oauth: options.oauth
        };
        pending.push(model, () => {
          return done(null, scan);
        });
      });
    });
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
