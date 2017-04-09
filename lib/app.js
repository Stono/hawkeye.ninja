'use strict';
const ScanManager = require('./scanManager');
const Redis = require('./redis');
const EncryptedRedis = require('./encryptedRedis');
const JsonStore = require('./stores/jsonStore');
const SessionStore = require('connect-redis')(require('express-session'));

module.exports = function App(config) {
  const encryptedRedis = new EncryptedRedis(config.redis);
  const redis = new Redis(config.redis);
  const userStore = new JsonStore('users', encryptedRedis);
  const scanManager = new ScanManager({ redis: encryptedRedis });
  const sessionStore = new SessionStore({
    client: redis,
    prefix: 'session:',
    db: 1
  });
  const passport = new require('./passport')({
    clientid: config.github.clientid,
    secret: config.github.clientsecret,
    callbackUrl: config.github.callbackUrl,
    store: userStore
  });
  const server = new require('./server')({
    passport: passport,
    scanManager: scanManager,
    port: config.port,
    sessionSecret: config.sessionSecret,
    sessionStore: sessionStore,
    userStore: userStore
  });
  return server;
};
