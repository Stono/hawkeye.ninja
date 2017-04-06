'use strict';
const ScanManager = require('./scanManager');
const Redis = require('./redis');

module.exports = function App(config) {
  const scanManager = new ScanManager();
  const redis = new Redis(config.redis);
  const passport = new require('./passport')({
    clientid: config.github.clientid,
    secret: config.github.clientsecret,
    callbackUrl: config.github.callbackUrl
  });
  const server = new require('./server')({
    passport: passport,
    scanManager: scanManager,
    port: config.port,
    redis: redis
  });
  return server;
};
