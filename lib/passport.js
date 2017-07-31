'use strict';
const passport = require('passport');
const GitHubStrategy = require('passport-github');
const util = require('./util');
const User = require('./models/user');
const debug = require('debug')('hawkeye:user');
const GlobalStats = require('./managers/globalStats');

module.exports = function Passport(options) {
  util.enforceArgs(options, ['clientid', 'secret', 'callbackUrl', 'dal']);
  const globalStats = new GlobalStats({ dal: options.dal });
  const userStore = options.dal.collection('users');

  passport.use(new GitHubStrategy({
    clientID: options.clientid,
    clientSecret: options.secret,
    callbackURL: options.callbackUrl,
    authorizationURL: options.authorizationURL,
    tokenURL: options.tokenURL,
    userProfileURL: options.userProfileURL,
    scope: ['user:email', 'repo', 'admin:repo_hook', 'admin:org_hook']
  },
  (accessToken, refreshToken, profile, cb) => {
    const user = new User();
    user.setProfile(profile._json);
    user.setOauthCredentials({
      accessToken: accessToken
    });
    debug(user.profile.login, 'authenticated using oauth');
    userStore.get(user.profile.id, (err, existing) => {
      /* jshint maxcomplexity: 6 */
      if(err) { cb(err); }
      let newToken = false;

      if(util.isEmpty(existing)) {
        debug(user.profile.login, 'This is a new user, incrementing stats');
        newToken = true;
        globalStats.users(1, () => {
          debug('global user statistics incremented');
        });
      }

      if(existing && (existing.oauth.accessToken !== accessToken)) {
        debug(user.profile.login, 'Users access token has changed');
        newToken = true;
      }

      if(newToken) {
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
    userStore.set(user.profile.id, user, err => {
      done(err, user.profile.id);
    });
  });

  passport.deserializeUser(function(id, done) {
    userStore.get(id, (err, user) => {
      if(user === null) {
        return done(new Error('No userid: ' + id));
      }
      done(null, new User(user));
    });
  });

  return passport;
};
