'use strict';
const should = require('should');
const User = require('../../lib/models/user');
const util = require('../../lib/util');
const MockGithubApi = require('../mockGithub');

const accessToken = util.defaultValue(process.env.GITHUB_ACCESS_TOKEN, 'accessToken');
const repoId = 85411269;

describe('User', () => {
  let user, profile, mockGithubApi, repos;
  beforeEach(done => {
    mockGithubApi = new MockGithubApi();
    repos = mockGithubApi.repos;
    user = new User(null, mockGithubApi);
    profile = require('../samples/github/profile.json');
    user.setProfile(profile);
    user.setOauthCredentials({ accessToken: accessToken });
    user.fetchRepositories(done);
  });
  it('should populate the profile', () => {
    should(user.profile).eql(profile);
  });
  it('should set oauth credentials', () => {
    should(user.oauth.accessToken).eql(accessToken);
  });
  it('should fetch the users repositories', () => {
    should(user.repos.length).eql(3);
    mockGithubApi.repos.expect.getAll.called.once();
  });
  describe('Hooks', () => {
    let hookData;
    it('should create a hook for a given repo', done => {
      const url = 'http://127.0.0.1/hook/test';
      repos.getHooks = function(repo, next) {
        next(null, [null, []]);
      };
      user.createHook(repoId, url, (err, hook) => {
        should.ifError(err);
        repos.expect.createHook.called.once();
        should(hook.config.service).eql('hawkeye');
        done();
      });
    });
    it('should fetch the hawkeye hook', done => {
      user.getHook(repoId, (err, hook) => {
        should.ifError(err);
        hookData = hook;
        should(hook.config.service).eql('hawkeye');
        done();
      });
    });
    it('should delete a hook for a given repo', done => {
      user.deleteHook(repoId, hookData.id, (err) => {
        should.ifError(err);
        done();
      });
    });
    it('should not try and create a hook twice', done => {
      const url = 'http://127.0.0.1/hook/test';
      user.createHook(repoId, url, (err, hook) => {
        should.ifError(err);
        repos.expect.getHooks.called.once();
        repos.expect.createHook.called.never();
        should(hook.config.service).eql('hawkeye');
        done();
      });
    });
  });
});
