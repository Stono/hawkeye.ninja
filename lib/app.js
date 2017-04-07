'use strict';
const ScanManager = require('./scanManager');
const Redis = require('./redis');
const EncryptedRedis = require('./encryptedRedis');
const UserStore = require('./userStore');
const SessionStore = require('connect-redis')(require('express-session'));

module.exports = function App(config) {
  const encryptedRedis = new EncryptedRedis(config.redis);
  const redis = new Redis(config.redis);
  const scanManager = new ScanManager(encryptedRedis);
  const userStore = new UserStore(encryptedRedis);
  const sessionStore = new SessionStore({
    client: redis,
    prefix: 'he:session:',
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
    sessionStore: sessionStore
  });
  return server;
};
