'use strict';
const App = require('./lib/app');
const config = require('./config');
const app = new App(config);
app.start(() => {});
