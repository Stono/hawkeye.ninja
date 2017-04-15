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
    async.parallel(counters.map(name => { return self[name]; }), (err, data) => {
      let result = {};
      counters.forEach(counter => {
        result[counter] = data[counters.indexOf(counter)];
      });
      done(null, result);
    });
  };
  return Object.freeze(self);
};
