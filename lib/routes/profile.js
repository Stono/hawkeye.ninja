'use strict';
module.exports = function OAuth(app, middleware, controller) {
  app.get('/profile', middleware.protect, controller.read);
};
