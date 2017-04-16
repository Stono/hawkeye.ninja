'use strict';
const util = require('./util');
const async = require('async');

module.exports = function GlobalStats(options) {
  util.enforceArgs(options, ['dal']);
  let self = {};
  let counters = [];
  const addGlobalCounter = name => {
    counters.push(name);
    const counter = options.dal.counter(name);
    self[name] = function(amount, done) {
      if(typeof amount === 'function') { return counter.get(amount); }
      counter.inc(amount, done);
    };
  };
  addGlobalCounter('repos');
  addGlobalCounter('users');
  addGlobalCounter('scans');
  addGlobalCounter('issues');

  self.all = function(done) {
    const batch = options.dal.batch();
    const each = counters.map(name => {
      return batch.counter(name).get;
    });
    let result = {};
    async.parallel(each, (err, data) => {
      counters.forEach(counter => {
        const count = data[counters.indexOf(counter)];
        result[counter] = count;
      });
    });
    batch.exec(err => {
      done(err, result);
    });
  };
  return Object.freeze(self);
};
