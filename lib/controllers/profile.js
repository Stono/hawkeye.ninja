'use strict';
module.exports = function Profile() {
  let self = {};
  self.read = function(req, res) {
    res.send(req.user.name);
  };
  return Object.freeze(self);
};
