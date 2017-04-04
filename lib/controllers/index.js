'use strict';
module.exports = function Index() {
  let self = {};
  self.read = function(req, res) {
    res.render('index');
  };
  return Object.freeze(self);
};
