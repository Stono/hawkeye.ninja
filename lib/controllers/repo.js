'use strict';
const ViewModelBuilder = require('../viewModelBuilder');
const util = require('../util');
const ScanManager = require('../managers/scan');
const RepoManager = require('../managers/repo');
const async = require('async');
const config = require('../../config');

module.exports = function Repo(options) {
  util.enforceArgs(options, ['dal'], true);
  const builder = new ViewModelBuilder(options);
  let self = {};
  const scanManager = new ScanManager({
    dal: options.dal
  });
  const repoManager = new RepoManager({
    dal: options.dal
  });

  self.newScan = function(req, res, next) {
    let model;
    const schedule = (tracking, next) => {
      const schedule = {
        oauth: model.oauth,
        repo: model.repo,
        token: tracking.token,
        reason: 'Manually Triggered'
      };
      scanManager.schedule(schedule, next);
    };

    const track = (built, next) => {
      model = built;
      repoManager.track(model.repo, model.user.id, next);
    };

    const viewModel = builder(req)
    .withUser()
    .withRepo();

    async.waterfall([
      viewModel.build,
      track,
      schedule
    ], (err, scan) => {
      if(err) { return next(err); }
      res.redirect(`/repo/${model.repo.fullName}/${scan.number}`);
    });
  };

  self.viewScan = function(req, res, next) {
    builder(req)
    .withUser()
    .withRepoList()
    .withRepo()
    .loadScans()
    .withScan()
    .withMenu()
    .withTitle((model, set) => {
      set(model.repo.name);
    })
    .build((err, model) => {
      if(!util.isEmpty(err)) { return next(err); }
      res.render('viewScan', model);
    });
  };

  self.viewRepo = function(req, res, next) {
    builder(req)
    .withUser()
    .withRepoList()
    .withRepo()
    .withMenu()
    .withTitle((model, set) => {
      set(model.repo.name);
    })
    .build((err, model) => {
      if(err) { return next(err); }
      res.render('viewRepo', model);
    });
  };

  self.apiViewRepo = function(req, res, next) {
    const sendResult = (err, model) => {
      if(err) { return next(err); }
      res.json({
        scans: model.scans,
        metrics: model.metrics,
        tracking: model.tracking
      });
    };
    builder(req)
    .withUser()
    .withRepo()
    .loadMetrics()
    .loadRepoTracking()
    .loadScans()
    .build(sendResult);
  };

  self.apiUpdateSchedule = function(req, res, next) {
    const setSchedule = (err, model) => {
      if(err) { return next(err); }
      const schedule = req.body;

      const updateSchedule = next => {
        repoManager.schedule(model.repo.id, schedule, next);
      };

      const deleteHook = next => {
        req.user.getHook(model.repo.id, (err, hook) => {
          if(err) { return next(err); }
          if(util.isEmpty(hook)) { return next(); }
          req.user.deleteHook(model.repo.id, hook.id, next);
        });
      };

      const createHook = next => {
        const url = config.url + '/api/github/' + model.tracking.token;
        req.user.createHook(model.repo.id, url, next);
      };

      const updateGithub = next => {
        const now = schedule.github;
        const was = model.tracking.schedule.github;
        const opts = {
          'push:never': deleteHook,
          'never:push': createHook
        };
        const key = was + ':' + now;
        const handler = opts[key];
        if(!util.isEmpty(handler)) {
          return handler(next);
        }
        next();
      };

      const handleComplete = err => {
        if(err) { return next(err); }
        res.sendStatus(204);
      };

      async.series([
        updateSchedule,
        updateGithub
      ], handleComplete);

    };
    builder(req)
    .withUser()
    .withRepo()
    .loadRepoTracking()
    .build(setSchedule);
  };

  return Object.freeze(self);
};
