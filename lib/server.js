'use strict';
const express = require('express');
const util = require('./util');
const debug = require('debug')('hawkeye:server');
const expressSession = require('express-session');
const sharedSession = require('express-socket.io-session');
const ViewModelBuilder = require('./viewModelBuilder');
const ScanLog = require('./managers/scanLog');
const _ = require('lodash');
const bodyParser = require('body-parser');
module.exports = function Server(options) {
  util.enforceArgs(options, [
    'passport',
    'port',
    'dal',
    'sessionSecret',
    'sessionStore'
  ]);
  const builder = new ViewModelBuilder({
    dal: options.dal
  });

  const log = new ScanLog({ dal: options.dal });
  const userStore = options.dal.collection('users');
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
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
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

    const socketAuthorization = (socket, next) => {
      if(util.isEmpty(socket.handshake.session.passport)) {
        return next(new Error('Unauthorized'));
      }
      const user = socket.handshake.session.passport.user;
      userStore.get(user, (err, data) => {
        if(err) { return next(err); }
        if(util.isEmpty(data)) { return next(new Error('Unauthorized')); }
        socket.user = data;
        next(null, true);
      });
    };
    io.use(socketAuthorization);

    const handleSocketConnection = socket => {
      const handleStreamLogsRequest = data => {
        data = data.split('/');
        const org = data[2];
        const repo = data[3];
        const scan = data[4];
        socket.params = {
          org: org,
          repo: repo,
          scanNumber: scan
        };
        builder(socket)
        .withUser()
        .withRepo()
        .loadScans()
        .withScan()
        .build((err, model) => {
          if(err) {
            debug('Socket connected, but error', err);
            return socket.disconnect();
          }
          const namespace = `scans:${model.repo.id}:log:${scan}`;
          socket.join(namespace);
          const forEachLogItem = (err, data) => {
            data.forEach(line => { io.sockets.in(namespace).emit('log', line); });
          };
          log.all(parseInt(model.repo.id), parseInt(scan), forEachLogItem);
        });
      };
      socket.on('streamLogs', handleStreamLogsRequest);
    };
    io.on('connection', handleSocketConnection);

    log.subscribe('*', '*', (msg, channel) => {
      io.sockets.in(channel).emit('log', msg);
    }, err => {
      if(err) { throw err; }
    });

  })();

  (function applyRoutes() {
    const middleware = {
      protect: function(req, res, next) {
        if(!req.user) {
          return res.redirect('/oauth/github');
        }
        next();
      },
      github: options.passport.authenticate('github', { failureRedirect: '/oauth/failed' }),
    };

    const controllerConfig =  _.pick(options, ['dal']);
    const controllers = {
      oauth: new require('./controllers/oauth')(controllerConfig),
      repo: new require('./controllers/repo')(controllerConfig),
      scan: new require('./controllers/scan')(controllerConfig),
      index: new require('./controllers/index')(controllerConfig)
    };
    require('./routes/oauth')(app, middleware, controllers.oauth);
    require('./routes/repo')(app, middleware, controllers.repo);
    require('./routes/scan')(app, middleware, controllers.scan);
    require('./routes/index')(app, middleware, controllers.index);
  })();

  (function customErrors() {
    function notFoundHandler(req, res) {
      res.status(404);
      debug('404', req.path);
      if(req.accepts(['html', 'json']) === 'json') {
        return res.send({ error: 'Not Found' });
      }
      res.render('error', { title: 'Not Found' });
    }

    function errorHandler(err, req, res, next) {
      if (res.headersSent) {
        return next(err);
      }
      res.status(500);
      debug('500', err);
      if(req.accepts(['html', 'json']) === 'json') {
        return res.send({ error: 'Server Error' });
      }
      res.render('error', { title: 'Server Error' });
    }
    app.use(notFoundHandler);
    app.use(errorHandler);
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
