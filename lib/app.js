'use strict';
const Redis = require('./dal/redis/client');
const SessionStore = require('connect-redis')(require('express-session'));
const util = require('./util');
const config = require('../config');
const ScheduleManager = require('./managers/scheduler');
const EmailManager = require('./managers/email');

module.exports = function App(options) {
  util.enforceArgs(options, ['dal', 'port'], true);
  util.enforceTypes(arguments, ['object', 'number']);
  const passport = new require('./passport')({
    clientid: config.github.clientid,
    secret: config.github.clientsecret,
    callbackUrl: config.github.callbackUrl,
    authorizationURL: config.github.authorizationURL,
    tokenURL: config.github.tokenURL,
    userProfileURL: config.github.userProfileURL,
    dal: options.dal
  });

  const sessionRedis = new Redis(config.dal.redis);
  const sessionStore = new SessionStore({
    client: sessionRedis,
    prefix: 'session:',
    db: 1
  });
  const server = new require('./server')({
    passport: passport,
    port: options.port,
    sessionSecret: config.sessionSecret,
    sessionStore: sessionStore,
    dal: options.dal
  });

  const scheduler = new ScheduleManager({ dal: options.dal });
  const email = new EmailManager({ dal: options.dal });
  let self = {};
  self.start = function(done) {
    scheduler.start();
    email.start();
    server.start(done);
  };
  self.stop = function(done) {
    scheduler.stop();
    email.stop();
    server.stop(done);
  };
  return Object.freeze(self);
};
