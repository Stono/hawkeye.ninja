'use strict';
let util = require('../util');
function PrimativeStore(namespace, client) {
  util.enforceNotEmpty(namespace);
  util.enforceType(client, Object);

  this.get = (key, done) => {
    client.hget(namespace, key, done);
  };

  this.getAll = (done) => {
    client.hgetall(namespace, (err, results) => {
      /* jshint maxcomplexity: 5 */
      if(results === undefined || results === null) {
        return done(null, null);
      }
      let keys = Object.keys(results);
      for(var x = 0; x < keys.length; x++) {
        let key = keys[x];
        let result = results[key];
        results[key] = result; 
      }
      done(err, results);
    });
  };

  this.set = (key, value, done) => {
    /* jshint maxcomplexity: 5 */
    if(typeof value === 'object') {
      throw new Error('PrimativeStore is a store for store basic stuff, and youre trying to save a ' + typeof value);
    }
    client.hset(namespace, key, value, done);
  };

  this.remove = (key, done) => {
    client.hdel(namespace, key, done);
  };

  this.keys = (done) => {
    client.hkeys(namespace, done);
  };

  this.flush = (done) => {
    client.del(namespace, done); 
  };

  this.flushAll = (done) => {
    client.flushall(done);
  };
}
module.exports = PrimativeStore;
