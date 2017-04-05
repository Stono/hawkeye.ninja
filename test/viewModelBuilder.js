'use strict';
const builder = require('../lib/viewModels/builder');
const should = require('should');

describe('ViewModels', () => {
  let model, request;
  before(() => {
    request = {
      user: {
        profile: 'profile info here',
        oauth: 'oauth here',
        repos: 'repos here'
      }
    };
  });
  const userInfo = () => {
    it('should have user info', () => {
      should(model.user).eql(request.user.profile);
    });
  };
  describe('selectRepo', () => {
    before(() => {
      model = builder('selectRepo').withRequest(request).build();
    });
    userInfo();
    it('should have the repo list', () => {
      should(model.repos).eql(request.user.repos);
    });
  });
});
