'use strict';
const App = require('../lib/app');
const freePort = require('find-free-port');
const should = require('should');
const Dal = require('../lib/dal');
const Browser = require('zombie');
const deride = require('deride');
const fs = require('fs');
const path = require('path');

describe.skip('App', () => {
  let server, browser, passport, auth, passthrough;
  before(done => {
    freePort(5100, 5200, (err, port) => {
      Browser.localhost('hawkeye.website', port);
      browser = new Browser();
      should.ifError(err);
      const dal = new Dal();
      const passThrough = function() {
        return (req, res, next) => {
          if(passthrough) { return passthrough(req, res, next); }
          next();
        };
      };

      passport = deride.stub(['initialize', 'session', 'authenticate']);
      passport.setup.initialize.toDoThis(passThrough);
      passport.setup.session.toDoThis(passThrough);

      passport.setup.authenticate.toDoThis(() => {
        return (req, res, next) => {
          if(auth) { return auth(req, res, next); }
          next();
        };
      });

      server = new App({
        dal: dal,
        passport: passport,
        port: port
      });
      server.start(done);
    });
  });
  after(done => {
    server.stop(done);
  });
  afterEach(() => {
    auth = undefined;
    passthrough = undefined;
  });
  describe.only('Not logged in', () => {
    describe('/', () => {
      before(done => {
        browser.visit('/', err => {
          if(err.message !== 'document.body.createTextRange is not a function') {
            return done(err);
          }
          done();
        });
      });
      it('should be successful', () => {
        browser.assert.success();
      });
      it('should show the sign in with github button', () => {
        browser.assert.elements('.btn-github');
      });
      // Not sure on the value here, feels like i'm testing a mock
      describe('clicking login', () => {
        before(done => {
          auth = (req, res) => {
            res.redirect('https://github.com');
          };
          browser.click('.btn-github', done);
        });
        it('should redirect me to github', () => {
          browser
          .assert.url('https://github.com');
        });
      });
    });
  });
  describe.skip('Logged in', () => {
    describe('/', () => {
      before(done => {
        passthrough = (req, res, next) => {
          req.user = fs.readFileSync(path.join(__dirname, 'samples/hawkeye/user.json')).toString();
          next();
        };
        browser.visit('/', done);
      });
      it('should be successful', () => {
        browser.assert.success();
      });
      it('should show the dashboard', () => {
        browser.assert.text('title', 'Hawkeye - Dashboard');
      });
    });

  });
});
