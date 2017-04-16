'use strict';
const Redis = require('./redis');
const SessionStore = require('connect-redis')(require('express-session'));
const util = require('./util');
const config = require('../config');

module.exports = function App(options) {
  util.enforceArgs(options, ['dal', 'passport', 'port'], true);

  const sessionRedis = new Redis(config.dal.redis);
  const sessionStore = new SessionStore({
    client: sessionRedis,
    prefix: 'session:',
    db: 1
  });
  const server = new require('./server')({
    passport: options.passport,
    port: options.port,
    sessionSecret: config.sessionSecret,
    sessionStore: sessionStore,
    dal: options.dal
  });
  return server;
};
