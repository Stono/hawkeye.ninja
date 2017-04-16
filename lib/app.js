'use strict';
const Redis = require('./redis');
const Dal = require('./dal');
const SessionStore = require('connect-redis')(require('express-session'));

module.exports = function App(config) {
  const dal = new Dal();

  const sessionRedis = new Redis(config.dal.redis);
  const userStore = dal.collection('users');
  const sessionStore = new SessionStore({
    client: sessionRedis,
    prefix: 'session:',
    db: 1
  });
  const passport = new require('./passport')({
    clientid: config.github.clientid,
    secret: config.github.clientsecret,
    callbackUrl: config.github.callbackUrl,
    authorizationURL: config.github.authorizationURL,
    tokenURL: config.github.tokenURL,
    userProfileURL: config.github.userProfileURL,
    store: userStore,
    dal: dal
  });
  const server = new require('./server')({
    passport: passport,
    port: config.port,
    sessionSecret: config.sessionSecret,
    sessionStore: sessionStore,
    userStore: userStore,
    dal: dal
  });
  return server;
};
