'use strict';
/* jshint camelcase: false */
module.exports = function Repo(repo) {
  return Object.freeze({
    id: repo.id,
    name: repo.name,
    private: repo.private,
    description: repo.description,
    fullName: repo.full_name
  });
};
