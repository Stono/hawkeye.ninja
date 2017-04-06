'use strict';
const ScanManager = require('./scanManager');
const Redis = require('./redis');
const UserStore = require('./userStore');

module.exports = function App(config) {
  const redis = new Redis(config.redis);
  const scanManager = new ScanManager(redis);
  const userStore = new UserStore(redis);
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
    redis: redis
  });
  return server;
};
