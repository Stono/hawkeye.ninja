'use strict';
const Redis = require('./redis');
const SessionStore = require('connect-redis')(require('express-session'));
const util = require('./util');
const config = require('../config');

module.exports = function App(options) {
  util.enforceArgs(options, ['dal', 'port'], true);
  const passport = new require('./passport')({
    clientid: config.github.clientid,
    secret: config.github.clientsecret,
    callbackUrl: config.github.callbackUrl,
    authorizationURL: config.github.authorizationURL,
    tokenURL: config.github.tokenURL,
    userProfileURL: config.github.userProfileURL,
    dal: options.dal
  });

  const sessionRedis = new Redis(config.dal.redis);
  const sessionStore = new SessionStore({
    client: sessionRedis,
    prefix: 'session:',
    db: 1
  });
  const server = new require('./server')({
    passport: passport,
    port: options.port,
    sessionSecret: config.sessionSecret,
    sessionStore: sessionStore,
    dal: options.dal
  });
  return server;
};
