'use strict';
const passport = require('passport');
const GitHubStrategy = require('passport-github');
const util = require('./util');

module.exports = function Passport(options) {
  util.enforceArgs(options, ['clientid', 'secret', 'callbackUrl']);
  passport.use(new GitHubStrategy({
    clientID: options.clientid,
    clientSecret: options.secret,
    callbackURL: options.callbackUrl,
    scope: ['user:email', 'repo']
  },
  (accessToken, refreshToken, profile, cb) => {
    console.log(profile._json);
    cb(null, profile._json);
  }));

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  return passport;
};
