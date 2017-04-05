'use strict';
const GitHubApi = require('github');
const util = require('./util');
const debug = require('debug')('hawkeye:user');
const Repo = require('./models/repo');
const github = new GitHubApi({
  debug: false,
  protocol: 'https',
  host: 'api.github.com',
  followRedirects: false,
  timeout: 5000
});

module.exports = function User(serialised) {
  let self = util.defaultValue(serialised, {});
  self.setProfile = function(profile) {
    self.profile = profile;
  };
  self.setOauthCredentials = function(creds) {
    util.enforceArgs(creds, ['accessToken']);
    self.oauth = creds;
  };
  self.fetchRepositories = function(done) {
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
      self.repos = result.data.map(r => { return new Repo(r); });
      done(err, result.data);
    });
  };
  return self;
};
