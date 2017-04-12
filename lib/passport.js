'use strict';
const passport = require('passport');
const GitHubStrategy = require('passport-github');
const util = require('./util');
const User = require('./models/user');
const debug = require('debug')('hawkeye:user');

module.exports = function Passport(options) {
  util.enforceArgs(options, ['clientid', 'secret', 'callbackUrl', 'store']);
  passport.use(new GitHubStrategy({
    clientID: options.clientid,
    clientSecret: options.secret,
    callbackURL: options.callbackUrl,
    authorizationURL: options.authorizationURL,
    tokenURL: options.tokenURL,
    userProfileURL: options.userProfileURL,
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
    options.store.set(user.profile.login, user, err => {
      done(err, user.profile.login);
    });
  });

  passport.deserializeUser(function(login, done) {
    options.store.get(login, (err, user) => {
      if(user === null) {
        return done(new Error('No user: ' + login));
      }
      done(null, new User(user));
    });
  });

  return passport;
};
