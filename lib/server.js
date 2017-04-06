'use strict';
const express = require('express');
const util = require('./util');
const debug = require('debug')('hawkeye:server');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

module.exports = function Server(options) {
  util.enforceArgs(options, ['passport', 'port', 'scanManager', 'sessionSecret', 'redis']);
  const app = express();
  const http = require('http').Server(app);

  app.use(require('cookie-parser')());
  app.use(require('body-parser').urlencoded({ extended: true }));
  app.use('/js', express.static('public/js'));
  app.use('/js', express.static('dist/js'));

  app.use('/css', express.static('public/css'));
  app.use('/css', express.static('dist/css'));

  app.use('/fonts', express.static('public/fonts'));
  app.use('/fonts', express.static('dist/fonts'));

  app.use('/images', express.static('images'));

  app.use(session({
    store: new RedisStore({
      client: options.redis,
      prefix: 'he:session:',
      db: 1
    }),
    secret: options.sessionSecret,
    cookie: { maxAge: 600000 },
    resave: false,
    saveUninitialized: true
  }));

  app.use(options.passport.initialize());
  app.use(options.passport.session());

  app.set('views', __dirname + '/../views');
  app.set('view engine', 'pug');

  const middleware = {
    protect: function(req, res, next) {
      if(!req.user) {
        return res.redirect('/oauth/github');
      }
      next();
    },
    github: options.passport.authenticate('github', { failureRedirect: '/oauth/failed' }),
  };
  (function applyRoutes() {
    const controllers = {
      oauth: new require('./controllers/oauth')(),
      repo: new require('./controllers/repo')({ scanManager: options.scanManager }),
      index: new require('./controllers/index')()
    };
    require('./routes/oauth')(app, middleware, controllers.oauth);
    require('./routes/repo')(app, middleware, controllers.repo);
    require('./routes/index')(app, middleware, controllers.index);
  })();

  let self = {};
  self.start = function(done) {
    debug(`server started on port ${options.port}`);
    http.listen(options.port, done);
  };
  self.stop = function(done) {
    http.close();
    done();
  };
  return Object.freeze(self);
};
