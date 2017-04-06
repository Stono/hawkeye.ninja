'use strict';
const ScanManager = require('./scanManager');

module.exports = function App(config) {
  const scanManager = new ScanManager();

  const passport = new require('./passport')({
    clientid: config.github.clientid,
    secret: config.github.clientsecret,
    callbackUrl: config.github.callbackUrl
  });
  const server = new require('./server')({
    passport: passport,
    scanManager: scanManager,
    port: config.port
  });
  return server;
};
