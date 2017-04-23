'use strict';
const should = require('should');
const deride = require('deride');
const User = require('../../lib/models/user');

const repoData = require('../samples/github/repos.json');
const hookData = require('../samples/github/hooks.json');
const MockGithubApi = function() {
  let repos = deride.stub(['getAll', 'getHooks']);
  let self = deride.stub(['authenticate'], [{
    name: 'repos', options: { value: repos, enumerable: true}
  }]);
  repos.setup.getAll.toCallbackWith([null, { data: repoData }]);
  repos.setup.getHooks.toCallbackWith([null, { data: hookData }]);
  return self;
};
const accessToken = process.env.GITHUB_ACCESS_TOKEN;
const repoId = 85411269;

describe('User', () => {
  let user, profile, mockGithubApi;
  beforeEach(done => {
    mockGithubApi = new MockGithubApi();
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
  it('should fetch hooks for a given repo', done => {
    user.fetchHooks(repoId, err => {
      should.ifError(err);
      const repo = user.getRepo(repoId);
      should(repo.hooks.length).eql(1);
      done();
    });
  });
});
