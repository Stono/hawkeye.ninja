'use strict';
const util = require('./util');
const _ = require('lodash');
const async = require('async');
const debug = require('debug')('hawkeye:throttler');

module.exports = function Throttler(options) {
  util.enforceArgs(options, ['dal']);
  const dal = options.dal;

  let self = {};
  self.middleware = function(options) {
    util.enforceArgs(options, ['key', 'amount', 'per']);
    if(options.per < 1) {
      throw new Error('The options.per value must be >= 1');
    }
    return function(req, res, done) {
      const value = _.get(req, options.key);
      if(util.isEmpty(value)) { return done(); }
      const namespace = 'throttle:' + value;
      const counter = dal.counter(namespace);

      let current;

      const handleComplete = err => {
        if(err) { return done(err); }

        if(current > options.amount) {
          debug(value, 'throttled due to more than ' + options.amount + ' requests per ' + options.per + ' seconds');
          return res.sendStatus(429);
        }
        done();
      };

      const setTtl = (newCount, next) => {
        current = newCount;
        counter.expire(options.per, next);
      };

      const incrementCounter = next => {
        counter.inc(1, next);
      };

      async.waterfall([
        incrementCounter,
        setTtl
      ], handleComplete);
    };
  };
  return Object.freeze(self);
};
