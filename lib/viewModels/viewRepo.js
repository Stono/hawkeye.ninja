'use strict';
module.exports = function ViewRepo() {
  let self = {};
  self.withRequest = function(model, req) {
    const fullName = `${req.params.org}/${req.params.repo}`.toLowerCase();
    const repo = req.user.repos.find(repo => {
      return repo.fullName.toLowerCase() === fullName;
    });
    model.repo = repo;
  };
  self.withScans = function(model, scans) {
    model.scans = scans;
  };
  return Object.freeze(self);
};
