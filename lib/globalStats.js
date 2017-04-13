'use strict';
const Counter = require('./stores/counter');
const util = require('./util');
const async = require('async');

module.exports = function GlobalStats(options) {
  util.enforceArgs(options, ['redis']);
  let self = {};
  let counters = [];
  const addGlobalCounter = name => {
    counters.push(name);
    const counter = new Counter({ id: name, redis: options.redis });
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
