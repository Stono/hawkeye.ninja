'use strict';
module.exports = function OAuth(app, middleware, controller) {
  app.get('/oauth/github', middleware.github);
  app.get('/oauth/github/callback', middleware.github, controller.callback);
};
