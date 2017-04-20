'use strict';
module.exports = function Scan(app, middleware, controller) {
  app.post('/api/scan/scheduled/:token/:number', controller.handleScan);
  app.post('/api/scan/:reason/:token', controller.handleResult);
};
