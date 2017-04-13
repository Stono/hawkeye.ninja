'use strict';
const Redis = require('./redis');
const EncryptedRedis = require('./encryptedRedis');
const JsonStore = require('./stores/jsonStore');
const SessionStore = require('connect-redis')(require('express-session'));

module.exports = function App(config) {
  const encryptedRedis = new EncryptedRedis(config.redis);
  const redis = new Redis(config.redis);
  const userStore = new JsonStore('users', encryptedRedis);
  const sessionStore = new SessionStore({
    client: redis,
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
    redis: redis
  });
  const server = new require('./server')({
    passport: passport,
    redis: redis,
    encryptedRedis: encryptedRedis,
    port: config.port,
    sessionSecret: config.sessionSecret,
    sessionStore: sessionStore,
    userStore: userStore
  });
  return server;
};
