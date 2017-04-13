'use strict';
const builder = require('../viewModelBuilder');
const util = require('../util');

module.exports = function Index(options) {
  util.enforceArgs(options, ['redis']);
  let self = {};
  self.read = function(req, res) {
    if(req.user) {
      const viewModel = builder(options)
      .withUser(req)
      .withTitle('Dashboard')
      .withMenu(req)
      .withRepoList(req);
      res.render('index', viewModel);
    } else {
      builder(options)
      .withStats()
      .build((err, model) => {
        res.render('login', model);
      });
    }
  };
  return Object.freeze(self);
};
