'use strict';
module.exports = function Scan(app, middleware, controller) {
  app.post('/api/scan/:token/:number', middleware.tokenThrottle, controller.handleScan);
  app.post('/api/scan/:token', middleware.tokenThrottle, controller.handleResult);
  app.post('/api/github/:token', middleware.tokenThrottle, controller.handleGithubHook);
};
