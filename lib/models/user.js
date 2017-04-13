'use strict';
const GitHubApi = require('github');
const util = require('../util');
const debug = require('debug')('hawkeye:user');
const Repo = require('./repo');
const dateFormat = require('dateformat');
const github = new GitHubApi({
  debug: false,
  protocol: 'https',
  host: 'api.github.com',
  followRedirects: false,
  timeout: 5000
});

module.exports = function User(serialised) {
  let self = util.defaultValue(serialised, {});

  let setProfile = function(profile) {
    self.profile = profile;
    /* jshint camelcase: false */
    self.profile.created_at = dateFormat(self.profile.created_at, 'yyyy-mm-dd');
  };
  let setOauthCredentials = function(creds) {
    util.enforceArgs(creds, ['accessToken']);
    self.oauth = creds;
  };
  let fetchRepositories = function(done) {
    debug(self.profile.login, 'fetching repositories');
    github.authenticate({
      type: 'oauth',
      token: self.oauth.accessToken
    });
    /* jshint camelcase: false */
    github.repos.getAll({
      visibility: 'all',
      per_page: 500
    }, (err, result) => {
      var repos =  result.data.map(r => { return new Repo().fromGithub(r); });
      self.setRepositories(repos);
      done(err, repos);
    });
  };
  let setRepositories = function(repos) {
    self.repos = repos;
  };
  Object.defineProperty(self, 'setProfile', { value: setProfile, enumerable: false });
  Object.defineProperty(self, 'setOauthCredentials', { value: setOauthCredentials, enumerable: false });
  Object.defineProperty(self, 'fetchRepositories', { value: fetchRepositories, enumerable: false });
  Object.defineProperty(self, 'setRepositories', { value: setRepositories, enumerable: false });
  return self;
};
