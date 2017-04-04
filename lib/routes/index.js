'use strict';
module.exports = function Index(app, middleware, controller) {
  app.get('/', controller.read);
};
