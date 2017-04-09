'use strict';
const Scan = require('./models/scan');
const debug = require('debug')('hawkeye:scanManager');
const util = require('./util');

module.exports = function ScanManager(scanStore, scanQueue) {
  util.enforceNotEmpty(scanStore);
  util.enforceNotEmpty(scanQueue);
  let self = {};

  self.scans = function(repoName, done) {
    return scanStore.get(repoName, (err, data) => {
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
      data.push(scan);
      scanStore.set(repoName, data, err => {
        if(err) { return done(err); }
        scanQueue.push(scan, () => {
          return done(null, scan);
        });
      });
    });
  };
  return Object.freeze(self);
};
