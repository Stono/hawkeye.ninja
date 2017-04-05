'use strict';
const mock = require('mock-require');
const should = require('should');
const deride = require('deride');
const MockGithubApi = function() {
  let repos = deride.stub(['getAll']);
  let self = deride.stub(['authenticate'], [{
    name: 'repos', options: { value: repos, enumerable: true}
  }]);
  repos.setup.getAll.toCallbackWith([null, { data: [] }]);
  return self;
};
const mockGithubApi = new MockGithubApi();
mock('github', function StubGithub() { return mockGithubApi; });
const User = require('../lib/user');

describe('User', () => {
  let user, profile;
  beforeEach(() => {
    user = new User();
    profile = require('./samples/github/profile.json');
    user.setProfile(profile);
  });
  it('should populate the profile', () => {
    should(user.profile).eql(profile);
  });
  it('should set oauth credentials', () => {
    user.setOauthCredentials({ accessToken: 'test' });
    should(user.oauth.accessToken).eql('test');
  });
  it('should fetch the users repositories', done => {
    user.setOauthCredentials({ accessToken: 'test' });
    user.fetchRepositories(() => {
      should(user.repos).eql([]);
      mockGithubApi.repos.expect.getAll.called.once();
      done();
    });
  });
});
