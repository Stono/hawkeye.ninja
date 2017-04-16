'use strict';
const App = require('./lib/app');
const config = require('./config');
const Dal = require('./lib/dal');
const dal = new Dal();

const passport = new require('./lib/passport')({
  clientid: config.github.clientid,
  secret: config.github.clientsecret,
  callbackUrl: config.github.callbackUrl,
  authorizationURL: config.github.authorizationURL,
  tokenURL: config.github.tokenURL,
  userProfileURL: config.github.userProfileURL,
  dal: dal
});
const app = new App({
  dal: dal,
  passport: passport,
  port: config.port
});

app.start(() => {});
