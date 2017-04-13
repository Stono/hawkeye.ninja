'use strict';
const Redis = require('./redis');
const EncryptedRedis = require('./encryptedRedis');
const JsonStore = require('./stores/jsonStore');
const SessionStore = require('connect-redis')(require('express-session'));

module.exports = function App(config) {
  const encryptedRedis = new EncryptedRedis(config.redis);
  const redis = new Redis(config.redis);
  const sessionRedis = new Redis(config.redis);

  const userStore = new JsonStore('users', encryptedRedis);
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
    redis: redis,
    encryptedRedis: encryptedRedis
  });
  const server = new require('./server')({
    passport: passport,
    port: config.port,
    sessionSecret: config.sessionSecret,
    sessionStore: sessionStore,
    userStore: userStore,
    redis: redis,
    encryptedRedis: encryptedRedis
  });
  return server;
};
