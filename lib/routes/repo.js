'use strict';
module.exports = function Repo(app, middleware, controller) {
  app.get('/repo/:org/:repo/new', middleware.protect, middleware.repoThrottle, controller.newScan);
  app.get('/repo/:org/:repo/:scanNumber', middleware.protect, controller.viewScan);
  app.get('/repo/:org/:repo', middleware.protect, controller.viewRepo);

  app.put('/api/repo/:org/:repo/tracking/schedule', middleware.protect, controller.apiUpdateSchedule);
  app.get('/api/repo/:org/:repo', middleware.protect, controller.apiViewRepo);
};
