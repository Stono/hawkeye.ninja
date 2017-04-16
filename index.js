'use strict';
const App = require('./lib/app');
const config = require('./config');
const Dal = require('./lib/dal');
const dal = new Dal();

const app = new App({
  dal: dal,
  port: config.port
});

app.start(() => {});
