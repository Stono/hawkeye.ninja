'use strict';
module.exports = function Scan(app, middleware, controller) {
  app.post('/api/scan/:token/:number', controller.handleScan);
  app.post('/api/scan/:token', controller.handleResult);
  app.post('/api/github/:token', controller.handleGithubHook);
};
