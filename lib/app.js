'use strict';
module.exports = function App() {
  const port = 5000;
  const passport = new require('./passport')({
    clientid: process.env.GITHUB_CLIENTID,
    secret: process.env.GITHUB_SECRET,
    callbackUrl: `http://127.0.0.1:${port}/oauth/github/callback`
  });
  const server = new require('./server')({
    passport: passport,
    port: port
  });
  return server;
};
