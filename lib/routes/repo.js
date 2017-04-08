'use strict';
module.exports = function Repo(app, middleware, controller) {
  app.get('/repo/:org/:repo/new', middleware.protect, controller.newScan);
  app.get('/repo/:org/:repo/:buildNumber', middleware.protect, controller.viewBuild);
  app.get('/repo/:org/:repo', middleware.protect, controller.viewRepo);
};
