'use strict';
module.exports = function OAuth() {
  let self = {};
  self.callback = function(req, res) {
    res.redirect('/');
  };
  return Object.freeze(self);
};
