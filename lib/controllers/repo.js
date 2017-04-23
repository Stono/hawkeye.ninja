'use strict';
const builder = require('../viewModelBuilder');
const util = require('../util');
const ScanManager = require('../managers/scan');
const RepoManager = require('../managers/repo');

module.exports = function Repo(options) {
  util.enforceArgs(options, ['dal']);
  let self = {};
  const scanManager = new ScanManager({
    dal: options.dal
  });
  const repoManager = new RepoManager({
    dal: options.dal
  });

  self.newScan = function(req, res, next) {
    const viewModel = builder(options)
    .withUser(req)
    .withRepo(req);
    if(util.isEmpty(viewModel.repo)) {
      return next();
    }

    repoManager.track(viewModel.repo, (err, data) => {
      if(err) { return next(err); }
      const schedule = {
        oauth: viewModel.oauth,
        repo: viewModel.repo,
        token: data.token,
        reason: 'Manually Triggered'
      };
      scanManager.schedule(schedule, (err, scan) => {
        if(err) { return next(err); }
        res.redirect(`/repo/${viewModel.repo.fullName}/${scan.number}`);
      });
    });
  };

  self.viewScan = function(req, res, next) {
    const viewModel = builder(options)
    .withUser(req)
    .withMenu(req)
    .withRepo(req);

    if(util.isEmpty(viewModel.repo)) {
      return next();
    }

    scanManager.scans(viewModel.repo.id, (err, scans) => {
      if(err) { return next(err); }
      viewModel.withScans(scans);
      viewModel.withScan(req);
      if(util.isEmpty(viewModel.scan)) {
        return next();
      }
      viewModel.withTitle(viewModel.repo.name);
      res.render('viewScan', viewModel);
    });
  };

  self.viewRepo = function(req, res, next) {
    const viewModel = builder(options)
    .withUser(req)
    .withMenu(req)
    .withRepo(req);
    if(util.isEmpty(viewModel.repo)) {
      return next();
    }

    viewModel.withTitle(viewModel.repo.name);
    scanManager.scans(viewModel.repo.id, (err, scans) => {
      if(err) { return next(err); }
      viewModel.withScans(scans);
      res.render('viewRepo', viewModel);
    });
  };

  self.apiViewRepo = function(req, res, next) {
    const viewModel = builder(options)
    .withUser(req)
    .withMenu(req)
    .withRepo(req);

    if(util.isEmpty(viewModel.repo)) {
      return next();
    }

    viewModel.withRepoTracking(req);
    viewModel.withTitle(viewModel.repo.name);

    viewModel.build(() => {
      scanManager.scans(viewModel.repo.id, (err, scans) => {
        if(err) { return next(err); }
        res.json({
          scans: scans,
          tracking: viewModel.tracking
        });
      });
    });
  };

  self.apiUpdateSchedule = function(req, res, next) {
    const viewModel = builder(options)
    .withUser(req)
    .withMenu(req)
    .withRepo(req);
    viewModel.build(() => {
      repoManager.track(viewModel.repo, err => {
        if(err) { return next(err); }
        let schedule = req.body;
        schedule.user = viewModel.user.id;
        repoManager.schedule(viewModel.repo.id, schedule, err => {
          if(err) { return next(err); }
          res.sendStatus(204);
        });
      });
    });
  };

  return Object.freeze(self);
};
