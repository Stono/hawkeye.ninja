'use strict';
const builder = require('../viewModels/builder');
module.exports = function Repo() {
  let self = {};
  self.selectRepo = function(req, res) {
    const viewModel = builder('selectRepo').withRequest(req).build();
    res.render('selectRepo', viewModel);
  };
  self.viewRepo = function(req, res) {
    const viewModel = builder('viewRepo').withRequest(req).build();
    res.render('viewRepo', viewModel);
  };
  return Object.freeze(self);
};
