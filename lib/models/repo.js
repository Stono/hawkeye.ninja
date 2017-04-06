'use strict';
const util = require('../util');

/* jshint camelcase: false */
module.exports = function Repo(serialised) {
  let self = util.defaultValue(serialised, {});
  self.fromGithub = function(repo) {
    return Object.freeze({
      id: repo.id,
      name: repo.name,
      private: repo.private,
      description: repo.description,
      owner: repo.owner.login,
      fullName: repo.full_name
    });
  };
  return Object.freeze(self);
};
