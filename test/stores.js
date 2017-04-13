'use strict';
let Stores = require('../lib/stores');
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
      if(store instanceof Stores.PrimativeStore) {
        sample = 'test';
      } else {
        sample = Object.freeze({
          name: 'bob'
        });
      }
      store.set('key', sample, done);
    },
    checkKeyAdded: (done) => {
      store.get('key', (err, value) => {
        should.ifError(err);
        if(store instanceof Stores.PrimativeStore) {
          should(value).eql('test');
        } else {
          should(value).eql(sample);
        }
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

  let testSuite = (type) => {
    describe(type, () => {
      before(done => {
        client = new RedisClient(config.redis);
        client.once('ready', () => {
          store = new Stores[type]('store:normal:test', client);
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

    describe('Encrypted: ' + type, () => {
      before(done => {
        client = new EncryptedRedisClient(config.redis, 'password');
        client.once('ready', () => {
          store = new Stores[type]('store:encrypted:test', client);
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


  };

  Object.keys(Stores).forEach(testSuite);
});
