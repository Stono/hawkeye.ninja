'use strict';
const express = require('express');
const util = require('./util');
const debug = require('debug')('hawkeye:server');
const expressSession = require('express-session');
const sharedSession = require('express-socket.io-session');
const builder = require('./viewModelBuilder');
const ScanLog = require('./scanLog');

module.exports = function Server(options) {
  util.enforceArgs(options, [
    'passport',
    'port',
    'scanManager',
    'sessionSecret',
    'sessionStore',
    'userStore'
  ]);

  const app = express();
  const http = require('http').Server(app);
  const session = expressSession({
    store: options.sessionStore,
    secret: options.sessionSecret,
    cookie: { maxAge: 600000 },
    rolling: true,
    resave: false,
    saveUninitialized: true
  });

  const cookieParser = require('cookie-parser')();
  (function expressSetup() {
    app.use(cookieParser);
    app.use(require('body-parser').urlencoded({ extended: true }));
    app.use('/js', express.static('public/js'));
    app.use('/js', express.static('dist/js'));

    app.use('/css', express.static('public/css'));
    app.use('/css', express.static('dist/css'));

    app.use('/fonts', express.static('public/fonts'));
    app.use('/fonts', express.static('dist/fonts'));

    app.use('/images', express.static('images'));

    app.use(session);

    app.use(options.passport.initialize());
    app.use(options.passport.session());

    app.set('views', __dirname + '/../views');
    app.set('view engine', 'pug');
  })();

  const io = require('socket.io')(http);
  (function socketIo() {
    io.use(sharedSession(session, cookieParser));
    io.use((socket, next) => {
      if(util.isEmpty(socket.handshake.session.passport)) {
        return next(new Error('Unauthorized'));
      }
      const user = socket.handshake.session.passport.user;
      options.userStore.get(user, (err, data) => {
        if(err) { return next(err); }
        if(util.isEmpty(data)) { return next(new Error('Unauthorized')); }
        socket.user = data;
        next(null, true);
      });
    });

    io.on('connection', socket => {
      socket.on('streamLogs', function(data) {
        data = data.split('/');
        const org = data[2];
        const repo = data[3];
        const scan = data[4];
        socket.params = {
          org: org,
          repo: repo,
          scanNumber: scan
        };
        const viewModel = builder()
        .withRepoList(socket)
        .withRepo(socket);

        options.scanManager.scans(viewModel.repo.id, (err, scans) => {
          if(err) { return socket.disconnect(err); }
          if(scans.length === 0) { return socket.disconnect(); }
          viewModel.withScans(scans);
          viewModel.withScan(socket);
          const namespace = `scans:log:${viewModel.scan.id}`;
          socket.join(namespace);
        });
      });
    });

    const log = new ScanLog({
      id: '*',
      redis: {}
    });
    log.subscribe((msg, channel) => {
      io.sockets.in(channel).emit('log', msg);
    });

  })();

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

  let self = {
    app: app
  };
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
