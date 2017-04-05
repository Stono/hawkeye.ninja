'use strict';
module.exports = function SelectRepo() {
  let self = {};
  self.withRequest = function(model, req) {
    model.repos = req.user.repos;
  };
  return Object.freeze(self);
};
