'use strict';
const Scan = require('./models/scan');
const util = require('./util');

module.exports = function ScanManager() {
  let self = {};
  let scans = {};

  self.scans = function(repoName, done) {
    scans[repoName] = util.defaultValue(scans[repoName], []);
    done(null, scans[repoName]);
  };
  self.schedule = function(repoName, done) {
    self.scans(repoName, (err, data) => {
      let scan = new Scan({
        number: data.length + 1
      });
      scans[repoName].push(scan);
      done(null, scan);
    });
  };
  return Object.freeze(self);
};
