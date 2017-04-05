'use strict';
module.exports = function Repo(app, middleware, controller) {
  app.get('/repo/:org/:repo', middleware.protect, controller.viewRepo);
  app.get('/repo', middleware.protect, controller.selectRepo);
};
