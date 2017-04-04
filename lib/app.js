'use strict';
const util = require('./util');
module.exports = function App() {
  const port = 5000;
  const callbackUrl = util.defaultValue(process.env.GITHUB_CALLBACK_URL, `http://127.0.0.1:${port}`);
  const passport = new require('./passport')({
    clientid: process.env.GITHUB_CLIENTID,
    secret: process.env.GITHUB_SECRET,
    callbackUrl: `${callbackUrl}/oauth/github/callback`
  });
  const server = new require('./server')({
    passport: passport,
    port: port
  });
  return server;
};
