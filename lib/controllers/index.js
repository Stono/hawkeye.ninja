'use strict';
const builder = require('../viewModelBuilder');

module.exports = function Index() {
  let self = {};
  self.read = function(req, res) {
    if(req.user) {
      const viewModel = builder()
      .withUser(req)
      .withTitle('Dashboard')
      .withMenu(req)
      .withRepoList(req);
      res.render('index', viewModel);
    } else {
      const viewModel = builder();
      res.render('login', viewModel);
    }
  };
  return Object.freeze(self);
};
