'use strict';
const express = require('express');
const util = require('./util');
const debug = require('debug')('hawkeye:server');

module.exports = function Server(options) {
  util.enforceArgs(options, ['passport', 'port']);
  const app = express();
  const http = require('http').Server(app);

  app.use(require('cookie-parser')());
  app.use(require('body-parser').urlencoded({ extended: true }));
  app.use(require('express-session')({
    secret: 'hawkeye cookie secret',
    cookie: { maxAge: 60000 },
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
      profile: new require('./controllers/profile')(),
      index: new require('./controllers/index')()
    };
    require('./routes/oauth')(app, middleware, controllers.oauth);
    require('./routes/profile')(app, middleware, controllers.profile);
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
