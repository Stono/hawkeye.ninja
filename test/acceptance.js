'use strict';
const App = require('../lib/app');
const Dal = require('../lib/dal');
const Browser = require('zombie');
const util = require('../lib/util');


describe('App', () => {
  let server, browser, auth, passthrough;
  before(done => {
    if(util.isEmpty(process.env.TEST_GITHUB_LOGIN) || util.isEmpty(process.env.TEST_GITHUB_PASSWORD)) {
      throw new Error('You must set TEST_GITHUB_LOGIN and TEST_GITHUB_PASSWORD');
    }

    Browser.localhost('hawkeye.website', 5000);
    browser = new Browser();
    const dal = new Dal();

    server = new App({
      dal: dal,
      port: 5000
    });
    server.start(done);
  });
  after(done => {
    server.stop(done);
  });
  afterEach(() => {
    auth = undefined;
    passthrough = undefined;
  });

  const visit = (url, done) => {
    const acceptableErrors = [
      'document.body.createTextRange is not a function',  // codemirror
      'Cannot read property \'canvas\' of undefined'      // chartjs
    ];
    const assertVisit = err => {
      let ok = (err === null) ? false : true;
      acceptableErrors.forEach(msg => {
        if(err.message === msg) {
          ok = true;
        }
      });
      if(ok === true) { done() } else { done(err); }
    };
    browser.visit(url, assertVisit);
  };

  describe('Not logged in', () => {
    describe('/', () => {
      before(done => {
        visit('/', done);
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
          browser.click('.btn-github', done);
        });
        it('should redirect me to github', () => {
          browser.assert.url(/https:\/\/github.com\/login\?client_id=/);
        });
      });
    });
  });

  describe('Logged in', () => {
    let cookie;
    before(d => {
      const done = () => {
        cookie = browser.getCookie('connect.sid');
        d();
      };
      const confirmPassword = () => {
        const url = browser.tabs.current._document._defaultView._response._url;
        const urlMatch = url.match(/https:\/\/github.com\/login\/oauth\/authorize/);
        if(!util.isEmpty(urlMatch)) {
          console.log('filling password again');
          browser.assert.success();
          browser
          .fill('sudo_password', process.env.TEST_GITHUB_PASSWORD)
          .pressButton('Confirm password', done);
        } else {
          done();
        }
      };
      const checkExtraAuth = () => {
        const url = browser.tabs.current._document._defaultView._response._url;
        const urlMatch = url.match(/https:\/\/github.com\/login\/oauth\/authorize/);
        if(!util.isEmpty(urlMatch)) {
          console.log('page requires extra auth');
          setTimeout(() => {
            browser.button('authorize').disabled = false;
            return browser.pressButton('authorize', confirmPassword);
          }, 1000);
        } else {
          done();
        }
      };
      const login = () => {
        browser
        .fill('login', process.env.TEST_GITHUB_LOGIN)
        .fill('password', process.env.TEST_GITHUB_PASSWORD)
        .pressButton('Sign in', checkExtraAuth);
      };
      browser.visit('/oauth/github', login);
    });
    beforeEach(() => {
    });
    describe('/', () => {
      it('should show the dashboard', () => {
        browser.assert.success();
        browser.assert.url('/');
      });
      it('should show links to repos', () => {
        browser.assert.link('li .repo a', 'apizor', '/repo/Stono/apizor');
      });
    });
    describe('/repo/Stono/apizor', () => {
      before(done => {
        browser.setCookie({name: 'connect.sid', domain: 'hawkeye.website', value: cookie});
        visit('/repo/Stono/apizor', done);
      });
      it('should show the repo information page', () => {
        browser.assert.success();
        browser.assert.element('#vulns');
      });
    });
  });
});
