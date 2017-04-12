'use strict';
module.exports = function Api(app, middleware, controller) {
  app.get('/api/repo/:org/:repo', middleware.protect, controller.viewRepo);
};
