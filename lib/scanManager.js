'use strict';
const Scan = require('./models/scan');
const debug = require('debug')('hawkeye:scanManager');
const util = require('./util');
const JsonStore = require('./stores/jsonStore');
const List = require('./list');
const ScanLog = require('./scanLog');
module.exports = function ScanManager(options) {
  util.enforceArgs(options, ['redis']);
  let self = {};

  const store = new JsonStore('scans', options.redis);
  const pending = new List({ id: 'scans:pending', redis: options.redis });

  self.scans = function(repoName, done) {
    return store.get(repoName, (err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { data = []; }
      done(null, data);
    });
  };

  self.schedule = function(repoName, done) {
    return self.scans(repoName, (err, data) => {
      const number = data.length + 1;
      debug(repoName, 'scheduling new scan', number);
      const scan = new Scan({
        number: number
      });
      const log = new ScanLog({ id: repoName, redis: options.redis });
      log.write('Scan scheduled');

      data.push(scan);
      store.set(repoName, data, err => {
        if(err) { return done(err); }
        pending.push(scan, () => {
          return done(null, scan);
        });
      });
    });
  };
  return Object.freeze(self);
};
