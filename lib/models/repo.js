'use strict';
const util = require('../util');

/* jshint camelcase: false */
module.exports = function Repo(serialised) {
  let self = util.defaultValue(serialised, {});
  const fromGithub = repo => {
    return new Repo({
      id: repo.id,
      name: repo.name,
      private: repo.private,
      description: repo.description,
      owner: repo.owner.login,
      fullName: repo.full_name
    });
  };
  Object.defineProperty(self, 'fromGithub', { value: fromGithub, enumerable: false });
  return Object.freeze(self);
};
