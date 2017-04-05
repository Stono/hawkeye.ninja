'use strict';
const builder = require('../viewModelBuilder');
const util = require('../util');
module.exports = function Repo(options) {
  util.enforceArgs(options, ['scanManager']);
  let self = {};

  self.newScan = function(req, res) {
    const viewModel = builder()
    .withUser(req)
    .withRepo(req)
    .build();
    options.scanManager.schedule(viewModel.repo.fullName, (err, scan) => {
      res.redirect(`/repo/${viewModel.repo.fullName}/${scan.number}`);
    });
  };

  self.selectRepo = function(req, res) {
    const viewModel = builder()
    .withUser(req)
    .withRepoList(req)
    .build();
    res.render('selectRepo', viewModel);
  };

  self.viewRepo = function(req, res) {
    const viewModel = builder()
    .withUser(req)
    .withRepo(req);

    options.scanManager.scans(viewModel.build().repo.fullName, (err, scans) => {
      viewModel.withScans(scans);
      res.render('viewRepo', viewModel.build());
    });
  };

  return Object.freeze(self);
};
