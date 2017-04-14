'use strict';
let JsonStore = require('../lib/stores/jsonStore');
let should = require('should');
let async = require('async');
let config = require('../config');
let RedisClient = require('../lib/redis');
let EncryptedRedisClient = require('../lib/encryptedRedis');

describe('Stores', () => {
  let store, client;
  let sample;
  let helpers = {
    addKey: (done) => {
      sample = Object.freeze({
        name: 'bob'
      });
      store.set('key', sample, done);
    },
    checkKeyAdded: (done) => {
      store.get('key', (err, value) => {
        should.ifError(err);
        should(value).eql(sample);
        done();
      });
    },
    removeKey: (done) => {
      store.remove('key', done);
    },
    checkKeyRemoved: (done) => {
      store.get('key', (err, value) => {
        should.ifError(err);
        should(value).eql(null);
        done();
      });
    }
  };

  describe('JsonStore', () => {
    before(done => {
      client = new RedisClient(config.redis);
      client.once('ready', () => {
        store = new JsonStore('store:normal:test', client);
        done();
      });
    });
    beforeEach(done => {
      store.flush(done);
    });
    afterEach(done => {
      store.flush(done);
    });

    it('Should add keys', (done) => {
      async.series([
        helpers.addKey,
        helpers.checkKeyAdded
      ], done);
    });

    it('Should remove keys', (done) => {
      async.series([
        helpers.addKey,
        helpers.checkKeyAdded,
        helpers.removeKey,
        helpers.checkKeyRemoved
      ], done);
    });
  });

  describe('Encrypted: JsonStore', () => {
    before(done => {
      client = new EncryptedRedisClient(config.redis, 'password');
      client.once('ready', () => {
        store = new JsonStore('store:encrypted:test', client);
        done();
      });
    });
    beforeEach(done => {
      store.flush(done);
    });

    it('Should add keys', (done) => {
      async.series([
        helpers.addKey,
        helpers.checkKeyAdded
      ], done);
    });

    it('Should remove keys', (done) => {
      async.series([
        helpers.addKey,
        helpers.checkKeyAdded,
        helpers.removeKey,
        helpers.checkKeyRemoved
      ], done);
    });
  });
});
