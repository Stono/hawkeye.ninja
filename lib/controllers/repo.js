'use strict';
const builder = require('../viewModels/builder');
const util = require('../util');
module.exports = function Repo(options) {
  util.enforceArgs(options, ['buildManager']);
  let self = {};

  self.selectRepo = function(req, res) {
    const viewModel = builder('selectRepo')
    .withRequest(req)
    .build();
    res.render('selectRepo', viewModel);
  };

  self.viewRepo = function(req, res) {
    const viewModel = builder('viewRepo')
    .withRequest(req);

    options.buildManager.builds(viewModel.build().repo.fullName, (err, builds) => {
      viewModel.withBuilds(builds);
      res.render('viewRepo', viewModel.build());
    });
  };

  return Object.freeze(self);
};
