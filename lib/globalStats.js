'use strict';
const Counter = require('./stores/counter');
const util = require('./util');

module.exports = function GlobalStats(options) {
  util.enforceArgs(options, ['redis']);
  let self = {};
  const addGlobalCounter = name => {
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

  return Object.freeze(self);
};
