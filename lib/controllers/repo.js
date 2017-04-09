'use strict';
const builder = require('../viewModelBuilder');
const util = require('../util');

module.exports = function Repo(options) {
  util.enforceArgs(options, ['scanManager']);
  let self = {};

  self.newScan = function(req, res) {
    const viewModel = builder()
    .withUser(req)
    .withRepo(req);
    options.scanManager.schedule(viewModel.repo, (err, scan) => {
      res.redirect(`/repo/${viewModel.repo.fullName}/${scan.number}`);
    });
  };

  self.viewScan = function(req, res) {
    const viewModel = builder()
    .withUser(req)
    .withMenu(req)
    .withRepo(req);

    viewModel.withTitle(viewModel.repo.name);
    res.render('viewScan', viewModel);
  };

  self.viewRepo = function(req, res) {
    const viewModel = builder()
    .withUser(req)
    .withMenu(req)
    .withRepo(req);

    viewModel.withTitle(viewModel.repo.name);
    options.scanManager.scans(viewModel.repo.id, (err, scans) => {
      viewModel.withScans(scans);
      res.render('viewRepo', viewModel);
    });
  };

  return Object.freeze(self);
};
