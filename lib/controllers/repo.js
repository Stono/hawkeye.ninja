'use strict';
const builder = require('../viewModels/builder');
const util = require('../util');
module.exports = function Repo(options) {
  util.enforceArgs(options, ['scanManager']);
  let self = {};

  self.selectRepo = function(req, res) {
    const viewModel = builder('selectRepo')
    .withRequest(req)
    .scan();
    res.render('selectRepo', viewModel);
  };

  self.viewRepo = function(req, res) {
    const viewModel = builder('viewRepo')
    .withRequest(req);

    options.scanManager.scans(viewModel.scan().repo.fullName, (err, scans) => {
      viewModel.withScans(scans);
      res.render('viewRepo', viewModel.scan());
    });
  };

  return Object.freeze(self);
};
