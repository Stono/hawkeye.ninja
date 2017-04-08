'use strict';
let util = require('../util');
function JsonStore(namespace, client) {
  util.enforceNotEmpty(namespace);
  util.enforceType(client, Object);

  let parse = (result) => {
    try {
      result = JSON.parse(result);
      return result;
    } catch(ex) {
      return result;
    }
  };

  this.get = (key, done) => {
    client.hget(namespace, key, (err, result) => {
      if(err) { return done(err); }
      done(null, parse(result));
    });
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
        results[key] = parse(result);
      }
      done(err, results);
    });
  };

  this.set = (key, value, done) => {
    /* jshint maxcomplexity: 5 */
    if(typeof value !== 'object') {
      throw new Error('JsonStore is a JSON store, and youre trying to save a ' + typeof value);
    }
    try {
      let stringValue = JSON.stringify(value);
      client.hset(namespace, key, stringValue, done);
    } catch(ex) {
      done(ex);
    }
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
module.exports = JsonStore;
