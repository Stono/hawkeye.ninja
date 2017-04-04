'use strict';
module.exports = function OAuth() {
  let self = {};
  self.callback = function(req, res) {
    // User is logged in
    res.redirect('/profile');
  };
  return Object.freeze(self);
};
