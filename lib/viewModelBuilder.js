'use strict';
const _ = require('lodash');

module.exports = function ViewModelScaner() {
  let self = {};
  let model = {};

  self.withUser = function(req) {
    model.user = req.user.profile;
    return self;
  };

  self.withRepo = function(req) {
    const fullName = `${req.params.org}/${req.params.repo}`.toLowerCase();
    const repo = req.user.repos.find(repo => {
      return repo.fullName.toLowerCase() === fullName;
    });
    model.repo = repo;
    return self;
  };

  self.withRepoList = function(req) {
    model.repos = req.user.repos;
    return self;
  };

  self.withScans = function(scans) {
    model.scans = scans;
    return self;
  };

  self.build = function() {
    const result = _.cloneDeep(model);
    return result;
  };

  return Object.freeze(self);
};
