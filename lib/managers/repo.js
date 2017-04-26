'use strict';
const util = require('../util');
const async = require('async');
const rack = require('hat').rack(384);

module.exports = function RepoManager(options) {
  util.enforceArgs(options, ['dal'], true);
  let self = {};
  const store = options.dal.collection('repos');
  const tokenStore = options.dal.collection('repos:bytoken');

  self.track = function(repo, user, done) {
    util.enforceTypes(arguments, ['object', 'number', 'function']);
    self.get(repo.id, (err, data) => {
      if(err) { return done(err); }
      if(!util.isEmpty(data)) { return done(null, data); }
      const model = {
        repo: repo,
        user: user,
        token: rack(),
        schedule: {
          freq: 'never',
          when: 'never',
          github: 'never',
          email: null
        }
      };
      async.parallel([
        next => store.set(repo.id, model, next),
        next => tokenStore.set(model.token, repo.id, next)
      ], err => {
        if(err) { return done(err); }
        done(null, model);
      });
    });
  };

  self.get = function(id, done) {
    util.enforceTypes(arguments, ['number', 'function']);
    store.get(id, (err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { return done(err, data); }
      data.schedule.github = util.defaultValue(data.schedule.github, 'never');
      done(null, data);
    });
  };

  self.getByToken = function(token, done) {
    util.enforceTypes(arguments, ['string', 'function']);
    if(util.isEmpty(token.match(/^[a-z0-9]{96}$/))) {
      return done(new Error('Invalid token: ' + token));
    }
    util.enforceNotEmpty(token);
    const getRepoId = next => {
      tokenStore.get(token, next);
    };
    const getRepo = (id, next) => {
      if(util.isEmpty(id)) { return next(null, null); }
      self.get(id, next);
    };
    async.waterfall([
      getRepoId,
      getRepo
    ], done);
  };

  self.updateLastRun = function(id, done) {
    util.enforceTypes(arguments, ['number', 'function']);
    const updateLast = (tracked, next) => {
      tracked.schedule.last = Date.now();
      store.set(id, tracked, next);
    };
    async.waterfall([
      next => { self.get(id, next); },
      updateLast
    ], done);
  };

  self.schedule = function(id, schedule, done) {
    util.enforceTypes(arguments, ['number', 'object', 'function']);
    util.enforceLimitArgs(schedule, ['freq', 'when', 'email'], ['last', 'github']);
    const updateSchedule = (tracked, next) => {
      if(util.isEmpty(tracked)) { return next(new Error('repo ' + id + ' is not tracked')); }
      tracked.schedule = schedule;
      tracked.schedule.last = util.defaultValue(schedule.last, null);
      store.set(id, tracked, next);
    };
    async.waterfall([
      next => { self.get(id, next); },
        updateSchedule
    ], done);
  };

  self.getScheduled = function(done) {
    const checkInterval = (frequency, last) => {
      const now = new Date();
      const comparison = {
        hourly: new Date().setMinutes(-60),
        daily: new Date().setDate(now.getDate() - 1),
        weekly: new Date().setDate(now.getDate() - 7),
        monthly: new Date().setDate(now.getDate() - 30)
      };
      if(Object.keys(comparison).indexOf(frequency) === -1) { return false; }
      if(util.isEmpty(last)) { return true; }

      return (last <= comparison[frequency]);
    };
    const shouldRun = (tracked, next) => {
      const run = checkInterval(tracked.schedule.freq, tracked.schedule.last);
      next(null, run);
    };
    const filterResults = (scheduled, next) => {
      async.filter(scheduled, shouldRun, next);
    };
    async.waterfall([
      store.all,
      filterResults
    ], done);
  };
  return Object.freeze(self);
};
