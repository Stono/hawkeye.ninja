'use strict';
const Build = require('./models/build');
const util = require('./util');

module.exports = function BuildManager() {
  let self = {};
  let builds = {};

  self.builds = function(repoName, done) {
    builds[repoName] = util.defaultValue(builds[repoName], []);
    done(null, builds[repoName]);
  };
  self.schedule = function(repoName, done) {
    self.builds(repoName, (err, data) => {
      let build = new Build({
        number: data.length + 1
      });
      builds[repoName].push(build);
      done(null, build);
    });
  };
  return Object.freeze(self);
};
