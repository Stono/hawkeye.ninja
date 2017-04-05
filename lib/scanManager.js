'use strict';
const Scan = require('./models/scan');
const util = require('./util');
const debug = require('debug')('hawkeye:scanManager');

module.exports = function ScanManager() {
  let self = {};
  let scans = {};

  self.scans = function(repoName, done) {
    scans[repoName] = util.defaultValue(scans[repoName], []);
    done(null, scans[repoName]);
  };
  self.schedule = function(repoName, done) {
    self.scans(repoName, (err, data) => {
      const number = data.length + 1;
      debug(repoName, 'scheduling new scan', number);
      const scan = new Scan({
        number: number
      });
      scans[repoName].push(scan);
      done(null, scan);
    });
  };
  return Object.freeze(self);
};
