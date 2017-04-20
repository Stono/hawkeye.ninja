'use strict';
const builder = require('../viewModelBuilder');
const util = require('../util');
const ScanManager = require('../scanManager');

module.exports = function Api(options) {
  util.enforceArgs(options, ['dal']);
  let self = {};

  self.viewRepo = function(req, res) {
    const viewModel = builder(options)
    .withUser(req)
    .withMenu(req)
    .withRepo(req)
    .withRepoTracking(req);
    viewModel.withTitle(viewModel.repo.name);

    viewModel.build(() => {
      const scanManager = new ScanManager({
        dal: options.dal,
        id: viewModel.repo.id
      });

      scanManager.scans((err, scans) => {
        res.json({
          scans: scans,
          token: viewModel.tracking.token
        });
      });
    });
  };

  return Object.freeze(self);
};
