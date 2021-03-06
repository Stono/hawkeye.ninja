'use strict';
const RepoManager = require('./repo');
const ScanManager = require('./scan');
const util = require('../util');
const async = require('async');
const debug = require('debug')('hawkeye:scheduler');

module.exports = function Scheduler(options) {
  util.enforceArgs(options, ['dal'], true);
  util.enforceTypes([options.dal], ['object']);
  const repoManager = new RepoManager(options);
  const userStore = options.dal.collection('users');
  const scanManager = new ScanManager({ dal: options.dal });

  let self = {};

  const scheduleRepo = (tracked, next) => {
    const updateLastRun = err => {
      if(err) { return next(err); }
      repoManager.updateLastRun(tracked.repo.id, next);
    };
    userStore.get(tracked.user, (err, user) => {
      if(err) { return next(err); }
      if(util.isEmpty(user)) { return next(new Error('No user found with id: ' + tracked.user)); }
      scanManager.schedule({
        repo: tracked.repo,
        oauth: user.oauth,
        token: tracked.token,
        reason: 'Scheduled Scan'
      }, updateLastRun);
    });
  };
  const addToQueue = (repos, next) => {
    async.each(repos, scheduleRepo, next);
  };
  const getScheduled = next => {
    repoManager.getScheduled(next);
  };
  self.run = done => {
    async.waterfall([
      getScheduled,
      addToQueue
    ], done);
  };

  let interval;
  self.start = function(frequency) {
    interval = setInterval(() => {
      self.run(err => {
        if(err) {
          debug('Scheduler failed to run', err);
        }
      });
    }, util.defaultValue(frequency, 10000));
  };
  self.stop = function() {
    clearInterval(interval);
  };
  return Object.freeze(self);
};
