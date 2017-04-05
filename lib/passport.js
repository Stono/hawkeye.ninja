'use strict';
const passport = require('passport');
const GitHubStrategy = require('passport-github');
const util = require('./util');
const User = require('./models/user');
const debug = require('debug')('hawkeye:user');

const UserStateStore = function() {
  let store = {};
  let self = {};
  self.get = function(login) {
    return store[login];
  };
  self.set = function(user) {
    store[user.profile.login] = user;
  };
  return Object.freeze(self);
};
const state = new UserStateStore();

module.exports = function Passport(options) {
  util.enforceArgs(options, ['clientid', 'secret', 'callbackUrl']);
  passport.use(new GitHubStrategy({
    clientID: options.clientid,
    clientSecret: options.secret,
    callbackURL: options.callbackUrl,
    scope: ['user:email', 'repo']
  },
  (accessToken, refreshToken, profile, cb) => {
    const user = new User();
    user.setProfile(profile._json);
    user.setOauthCredentials({
      accessToken: accessToken
    });
    debug(user.profile.login, 'authenticated using oauth');
    user.fetchRepositories(() => {
      cb(null, user);
    });
  }));

  passport.serializeUser(function(user, done) {
    state.set(user);
    done(null, user.profile.login);
  });

  passport.deserializeUser(function(login, done) {
    done(null, new User(state.get(login)));
  });

  return passport;
};
