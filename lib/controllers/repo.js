'use strict';
const builder = require('../viewModelBuilder');
const util = require('../util');
const ScanManager = require('../scanManager');
const RepoManager = require('../repoManager');

module.exports = function Repo(options) {
  util.enforceArgs(options, ['dal']);
  let self = {};

  self.newScan = function(req, res) {
    const viewModel = builder(options)
    .withUser(req)
    .withRepo(req);
    const scanManager = new ScanManager({
      dal: options.dal,
      id: viewModel.repo.id
    });
    const repoManager = new RepoManager({
      dal: options.dal
    });

    repoManager.track(viewModel.repo, (err, data) => {
      if(err) { throw err; }
      const schedule = {
        oauth: viewModel.oauth,
        repo: viewModel.repo,
        token: data.token
      };
      scanManager.schedule(schedule, (err, scan) => {
        res.redirect(`/repo/${viewModel.repo.fullName}/${scan.number}`);
      });
    });
  };

  self.viewScan = function(req, res, next) {
    const viewModel = builder(options)
    .withUser(req)
    .withMenu(req)
    .withRepo(req);
    const scanManager = new ScanManager({
      dal: options.dal,
      id: viewModel.repo.id
    });

    scanManager.scans((err, scans) => {
      if(err) { return next(err); }
      viewModel.withScans(scans);
      viewModel.withScan(req);
      if(util.isEmpty(viewModel.scan)) {
        return next(new Error('Scan not found'));
      }
      viewModel.withTitle(viewModel.repo.name);
      res.render('viewScan', viewModel);
    });
  };

  self.viewRepo = function(req, res) {
    const viewModel = builder(options)
    .withUser(req)
    .withMenu(req)
    .withRepo(req);

    viewModel.withTitle(viewModel.repo.name);

    const scanManager = new ScanManager({
      dal: options.dal,
      id: viewModel.repo.id
    });

    scanManager.scans((err, scans) => {
      viewModel.withScans(scans);
      res.render('viewRepo', viewModel);
    });
  };

  return Object.freeze(self);
};
