'use strict';
const passport = require('passport');
const GitHubStrategy = require('passport-github');
const util = require('./util');
const User = require('./models/user');
const debug = require('debug')('hawkeye:user');
const GlobalStats = require('./globalStats');

module.exports = function Passport(options) {
  util.enforceArgs(options, ['clientid', 'secret', 'callbackUrl', 'store', 'dal']);
  const globalStats = new GlobalStats({ dal: options.dal });

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
    options.store.get(user.profile.login, (err, existing) => {
      if(err) { cb(err); }
      if(util.isEmpty(existing)) {
        debug(user.profile.login, 'first time login, will fetch repos');
        globalStats.users(1, () => {
          debug('global user statistics incremented');
        });
        user.fetchRepositories(() => {
          cb(null, user);
        });
      } else {
        debug(user.profile.login, 'recovered profile from previous login');
        user.setRepositories(existing.repos);
        cb(null, user);
      }
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
