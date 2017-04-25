'use strict';
const ViewModelBuilder = require('../viewModelBuilder');
const util = require('../util');

module.exports = function Index(options) {
  util.enforceArgs(options, ['dal'], true);
  const builder = new ViewModelBuilder(options);
  let self = {};
  self.read = function(req, res, next) {
    if(req.user) {
      builder(req)
      .withUser()
      .withTitle('Dashboard')
      .withRepoList()
      .withMenu()
      .build((err, model) => {
        if(err) { return next(err); }
        res.render('index', model);
      });
    } else {
      builder(req)
      .withStats()
      .build((err, model) => {
        res.render('login', model);
      });
    }
  };
  return Object.freeze(self);
};
