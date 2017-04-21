'use strict';
const RepoManager = require('./repoManager');
const ScanManager = require('./scanManager');
const util = require('./util');
const async = require('async');

module.exports = function Scheduler(options) {
  util.enforceArgs(options, ['dal'], true);
  const repoManager = new RepoManager(options);
  const scanManager = new ScanManager({ dal: options.dal, id: 0 });
  const userStore = options.dal.collection('users');

  let self = {};

  const scheduleRepo = (tracked, next) => {
    const updateLastRun = err => {
      if(err) { return next(err); }
      repoManager.updateLastRun(tracked.repo.id, next);
    };
    userStore.get(tracked.schedule.user, (err, user) => {
      if(err) { return next(err); }
      scanManager.schedule({
        repo: tracked.repo,
        oauth: user.oauth,
        token: tracked.token
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
  return Object.freeze(self);
};
