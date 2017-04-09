'use strict';
const ScanManager = require('./scanManager');
const Redis = require('./redis');
const EncryptedRedis = require('./encryptedRedis');
const JsonStore = require('./stores/jsonStore');
const SessionStore = require('connect-redis')(require('express-session'));
const Queue = require('./queue');

module.exports = function App(config) {
  const encryptedRedis = new EncryptedRedis(config.redis);
  const redis = new Redis(config.redis);
  const userStore = new JsonStore('he:users', encryptedRedis);
  const scanStore = new JsonStore('he:scans', encryptedRedis);
  const scanQueue = new Queue('he:scans:queue', encryptedRedis);
  const scanManager = new ScanManager(scanStore, scanQueue);
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
