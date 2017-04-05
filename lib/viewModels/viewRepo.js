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
  return Object.freeze(self);
};
