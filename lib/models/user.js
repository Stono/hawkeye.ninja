'use strict';
/* jshint camelcase: false */
const GitHubApi = require('github');
const util = require('../util');
const debug = require('debug')('hawkeye:user');
const Repo = require('./repo');
const dateFormat = require('dateformat');

module.exports = function User(serialised, diClient) {
  let self = util.defaultValue(serialised, {});

  let client;
  const github = () => {
    if(!util.isEmpty(client)) { return client; }
    diClient = util.defaultValue(diClient, () => {
      return new GitHubApi({
        debug: false,
        protocol: 'https',
        host: 'api.github.com',
        followRedirects: false,
        timeout: 5000
      });
    });

    diClient.authenticate({
      type: 'oauth',
      token: self.oauth.accessToken
    });
    return diClient;
  };

  let setProfile = function(profile) {
    self.profile = profile;
    /* jshint camelcase: false */
    self.profile.created_at = dateFormat(self.profile.created_at, 'yyyy-mm-dd');
    return self;
  };
  let setOauthCredentials = function(creds) {
    util.enforceArgs(creds, ['accessToken']);
    self.oauth = creds;
  };
  let fetchRepositories = function(done) {
    debug(self.profile.login, 'fetching repositories');
    github().repos.getAll({
      visibility: 'all',
      per_page: 500
    }, (err, result) => {
      var repos =  result.data.map(r => { return new Repo().fromGithub(r); });
      self.setRepositories(repos);
      done(err, repos);
    });
  };

  const getRepo = function(repoId) {
    return self.repos.find(repo => { return repo.id === repoId; });
  };

  const getHooks = function(repoId, done) {
    let repo = getRepo(repoId);
    github().repos.getHooks({
      owner: repo.owner.login,
      repo: repo.name,
      per_page: 500
    }, (err, result) => {
      if(err) { return done(err); }
      repo.hooks = result.data.filter(hook => { return hook.name === 'hawkeye'; });
      done();
    });
  };
  let setRepositories = function(repos) {
    self.repos = repos;
  };
  Object.defineProperty(self, 'setProfile', { value: setProfile, enumerable: false });
  Object.defineProperty(self, 'setOauthCredentials', { value: setOauthCredentials, enumerable: false });
  Object.defineProperty(self, 'fetchRepositories', { value: fetchRepositories, enumerable: false });
  Object.defineProperty(self, 'getHooks', { value: getHooks, enumerable: false });
  Object.defineProperty(self, 'setRepositories', { value: setRepositories, enumerable: false });
  Object.defineProperty(self, 'getRepo', { value: getRepo, enumerable: false });
  return self;
};
