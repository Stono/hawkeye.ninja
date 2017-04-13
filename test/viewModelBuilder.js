'use strict';
const builder = require('../lib/viewModelBuilder');
const Redis = require('../lib/redis');
const EncryptedRedis = require('../lib/encryptedRedis');
const should = require('should');
const Repo = require('../lib/models/repo');

describe('ViewModels', () => {
  let model, request, encryptedRedis, redis, config;
  before(() => {
    encryptedRedis = new EncryptedRedis({
      encryptionKey: 'test'
    });
    redis = new Redis();
    config = {
      redis: redis,
      encryptedRedis: encryptedRedis
    };
    request = {
      params: {
        org: 'stono',
        repo: 'hawkeye'
      },
      user: {
        profile: 'profile info here',
        oauth: 'oauth here',
        repos: require('./samples/github/repos.json').map(r => { return new Repo().fromGithub(r); })
      }
    };
  });
  const userInfo = () => {
    it('should have user info', () => {
      should(model.user).eql(request.user.profile);
    });
  };
  const shouldHaveKeys = (obj, keys) => {
    should(Object.keys(obj).sort()).eql(keys.sort());
  };
  describe('selectRepo', () => {
    before(() => {
      model = builder(config)
      .withUser(request)
      .withRepoList(request);
    });
    userInfo();
    it('should have the repo list', () => {
      should(model.repos).eql(request.user.repos);
    });
  });
  describe('viewRepo', () => {
    before(() => {
      model = builder(config)
      .withUser(request)
      .withRepo(request)
      .withScans([]);
    });
    it('should have the repo information', () => {
      shouldHaveKeys(model.repo, ['id', 'name', 'private', 'description', 'fullName', 'owner']);
      should(model.repo.fullName).eql('Stono/hawkeye');
      should(model.scans).eql([]);
    });
  });
});
