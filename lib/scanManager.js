'use strict';
const Scan = require('./models/scan');
const debug = require('debug')('hawkeye:scanManager');

module.exports = function ScanManager(redis) {
  let self = {};

  let map = function(obj) {
    return Object.keys(obj).map(k => {
      return obj[k];
    });
  };
  self.scans = function(repoName, done) {
    const hset = 'scan:' + repoName;
    redis.hgetall(hset, (err, results) => {
      done(null, map(results));
    });
  };
  self.schedule = function(repoName, done) {
    const hset = 'scan:' + repoName;
    self.scans(repoName, (err, data) => {
      if(err) { return done(err); }
      const number = Object.keys(data).length + 1;
      debug(repoName, 'scheduling new scan', number);
      const scan = new Scan({
        number: number
      });
      redis.hset(hset, scan.number, scan, err => {
        done(err, scan);
      });
    });
  };
  return Object.freeze(self);
};
