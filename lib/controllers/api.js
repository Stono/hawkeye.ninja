'use strict';
const builder = require('../viewModelBuilder');
const util = require('../util');
const ScanManager = require('../scanManager');

module.exports = function Api(options) {
  util.enforceArgs(options, ['encryptedRedis']);
  let self = {};

  self.viewRepo = function(req, res) {
    const viewModel = builder(options)
    .withUser(req)
    .withMenu(req)
    .withRepo(req);

    viewModel.withTitle(viewModel.repo.name);

    const scanManager = new ScanManager({
      encryptedRedis: options.encryptedRedis,
      id: viewModel.repo.id
    });

    scanManager.scans((err, scans) => {
      res.json({
        scans: scans
      });
    });
  };

  return Object.freeze(self);
};
