'use strict';
const ScanManager = require('./scanManager');
const Redis = require('./redis');

module.exports = function App(config) {
  const redis = new Redis(config.redis);
  const scanManager = new ScanManager(redis);
  const passport = new require('./passport')({
    clientid: config.github.clientid,
    secret: config.github.clientsecret,
    callbackUrl: config.github.callbackUrl
  });
  const server = new require('./server')({
    passport: passport,
    scanManager: scanManager,
    port: config.port,
    sessionSecret: config.sessionSecret
  });
  return server;
};
