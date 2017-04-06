'use strict';
const passport = require('passport');
const GitHubStrategy = require('passport-github');
const util = require('./util');
const User = require('./models/user');
const debug = require('debug')('hawkeye:user');

const redis = new require('./redis')();
const UserStateStore = function(redis) {
  util.enforceNotEmpty(redis);
  let self = {};
  self.get = function(login, done) {
    redis.hget('he:users', login, (err, data) => {
      done(err, JSON.parse(data));
    });
  };
  self.set = function(login, user, done) {
    redis.hset('he:users', login, JSON.stringify(user), done);
  };
  return Object.freeze(self);
};
const state = new UserStateStore(redis);

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
    state.set(user.profile.login, user, err => {
      done(err, user.profile.login);
    });
  });

  passport.deserializeUser(function(login, done) {
    state.get(login, (err, user) => {
      if(user === null) {
        return done(new Error('No user: ' + login));
      }
      done(null, new User(user));
    });
  });

  return passport;
};
