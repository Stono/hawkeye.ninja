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
  const setProfile = function(profile) {
    self.profile = profile;
    /* jshint camelcase: false */
    self.profile.created_at = dateFormat(self.profile.created_at, 'yyyy-mm-dd');
    return self;
  };
  const setOauthCredentials = function(creds) {
    util.enforceArgs(creds, ['accessToken']);
    self.oauth = creds;
  };
  const fetchRepositories = function(done) {
    debug(self.profile.login, 'fetching repositories');
    github().repos.getAll({
      visibility: 'all',
      per_page: 500
    }, (err, result) => {
      if(err) { return done(err); }
      var repos =  result.data.map(r => { return new Repo().fromGithub(r); });
      self.setRepositories(repos);
      done(err, repos);
    });
  };
  const getRepo = function(repoId) {
    return self.repos.find(repo => { return repo.id === repoId; });
  };

  const getHook = function(repoId, done) {
    let repo = getRepo(repoId);
    github().repos.getHooks({
      owner: repo.owner,
      repo: repo.name,
      per_page: 500
    }, (err, result) => {
      if(err) { return done(err); }
      let hook = null;
      if(!util.isEmpty(result) && !util.isEmpty(result.data)) {
        hook = result.data.find(hook => {
          return (hook.config.service === 'hawkeye' && hook.name === 'web');
        });
      }
      done(null, hook);
    });
  };

  const deleteHook = function(repoId, hookId, done) {
    debug(repoId, 'deleting hook ' + hookId);
    let repo = getRepo(repoId);
    github().repos.deleteHook({
      owner: repo.owner,
      repo: repo.name,
      id: hookId
    }, err => {
      done(err);
    });
  };

  const createHook = function(repoId, url, done) {
    debug(repoId, 'creating hook ' + url);
    let repo = getRepo(repoId);
    getHook(repoId, (err, hook) => {
      if(!util.isEmpty(err) || !util.isEmpty(hook)) { return done(err, hook); }
      const config = {
        url: url,
        content_type: 'json',
        service: 'hawkeye'
      };
      github().repos.createHook({
        owner: repo.owner,
        repo: repo.name,
        name: 'web',
        config: config,
        events: ['push'],
        active: true
      }, (err, result) => {
        if(err) { return done(err); }
        const hook = result.data;
        done(null, hook);
      });
    });
  };

  const setRepositories = function(repos) {
    self.repos = repos;
  };

  util.setProperty(self, 'setProfile', setProfile);
  util.setProperty(self, 'setOauthCredentials', setOauthCredentials);
  util.setProperty(self, 'fetchRepositories', fetchRepositories);
  util.setProperty(self, 'getHook', getHook);
  util.setProperty(self, 'createHook', createHook);
  util.setProperty(self, 'deleteHook', deleteHook);
  util.setProperty(self, 'setRepositories', setRepositories);
  util.setProperty(self, 'getRepo', getRepo);
  return self;
};
