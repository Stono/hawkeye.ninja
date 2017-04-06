'use strict';
const builder = require('../viewModelBuilder');

module.exports = function Index() {
  let self = {};
  self.read = function(req, res) {
    if(req.user) {
      const viewModel = builder()
      .withUser(req)
      .withMenu(req)
      .withRepoList(req)
      .build();
      res.render('index', viewModel);
    } else {
      const viewModel = builder()
      .build();
      res.render('login', viewModel);
    }
  };
  return Object.freeze(self);
};
