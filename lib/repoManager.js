'use strict';
const util = require('./util');
const async = require('async');
const rack = require('hat').rack(384);

module.exports = function RepoManager(options) {
  util.enforceArgs(options, ['dal'], true);
  let self = {};
  const store = options.dal.collection('repos');
  const tokenStore = options.dal.collection('repos:bytoken');

  self.track = function(repo, done) {
    const model = {
      repo: repo,
      token: rack(),
      schedule: {
        freq: 'Never',
        when: 'Never',
        email: null
      }
    };
    async.parallel([
      next => store.set(repo.id, model, next),
      next => tokenStore.set(repo.token, repo.id, next)
    ], done);
  };
  self.get = function(id, done) {
    store.get(id, done);
  };
  self.getByToken = function(token, done) {
    async.waterfall([
      next => { tokenStore.get(token, next); },
      (id, next) => { store.get(id, next); }
    ], done);
  };

  self.schedule = function(id, schedule, done) {
    const updateSchedule = (tracked, next) => {
      if(util.isEmpty(tracked)) { return next(new Error('repo ' + id + ' is not tracked')); }
      tracked.schedule = schedule;
      tracked.schedule.last = null;
      store.set(id, tracked, next);
    };
    async.waterfall([
      next => { self.get(id, next); },
        updateSchedule
    ], done);
  };
  self.getScheduled = function(done) {
    const checkInterval = (frequency, last) => {
      if(util.isEmpty(last)) { return true; }
      const comparison = {
        Hourly: new Date().setMinutes(-60)
      };
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
