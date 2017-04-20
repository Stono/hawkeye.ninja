'use strict';
module.exports = function Repo(app, middleware, controller) {
  app.get('/scan/:reason/:token', controller.handleResult);
  app.get('/scan/scheduled/:number/:token', controller.handleResult);
};
