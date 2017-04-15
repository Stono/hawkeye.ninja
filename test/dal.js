'use strict';
const Dal = require('../lib/dal');
const Redis = require('../lib/redis');
const should = require('should');
const async = require('async');
const Crypto = require('node-crypt');

describe.only('Data Access Layer', () => {
  let dal, udal, redis, crypto;
  before(done => {
    redis = new Redis();
    dal = new Dal({
      redis: redis
    });
    dal.use(new dal.middleware.Crypto('some-key'));

    udal = new Dal({
      redis: redis
    });

    crypto = new Crypto({ key: 'some-key' });
    redis.once('ready', done);
  });
  beforeEach(done => {
    redis.flushall(done);
  });
  afterEach(done => {
    redis.flushall(done);
  });

  describe('Key Value Pair', () => {
    let kvp, ukvp;
    before(() => {
      kvp = dal.kvp('some:key');
      ukvp = udal.kvp('some:key');
    });
    it('should set and get keys', done => {
      const value = 'some value';
      kvp.set(value, err => {
        should.ifError(err);
        kvp.get((err, data) => {
          should.ifError(err);
          should(data).eql(value);
          done();
        });
      });
    });
    it('should store values encrypted', done => {
      const value = 'some value';
      kvp.set(value, err => {
        should.ifError(err);
        ukvp.get((err, data) => {
          should.ifError(err);
          should(data).eql(crypto.encrypt(value));
          done();
        });
      });
    });
  });

  describe('Collections', () => {
    let collection, ucollection;
    before(() => {
      collection = dal.collection('some:collection');
      ucollection = udal.collection('some:collection');
    });

    it('should set and get keys in the collection', done => {
      const key = 'somekey';
      const value = 'somevalue';
      collection.set(key, value, err => {
        should.ifError(err);
        collection.get(key, (err, data) => {
          should.ifError(err);
          should(data).eql(value);
          done();
        });
      });
    });
    it('should store values encrypted', done => {
      const key = 'somekey';
      const value = 'somevalue';
      collection.set(key, value, err => {
        should.ifError(err);
        ucollection.get(key, (err, data) => {
          should.ifError(err);
          should(data).eql(crypto.encrypt(value));
          done();
        });
      });
    });
  });

  describe('FIFO Lists', () => {
    let list, ulist;
    before(() => {
      list = dal.fifoList('some:list');
      ulist = udal.fifoList('some:list');
    });

    it('should let me push and pop items', done => {
      const value = 'somevalue';
      list.push(value, err => {
        should.ifError(err);
        list.pop((err, data) => {
          should.ifError(err);
          should(data).eql(value);
          done();
        });
      });
    });

    it('should return all items in order', done => {
      let validateList = next => {
        list.all((err, data) => {
          should.ifError(err);
          should(data).eql(['value1', 'value2']);
          next();
        });
      };
      async.series([
        next => { list.push('value1', next); },
          next => { list.push('value2', next); },
          validateList
      ], done);
    });

    it('should let me get items from the end of the list', done => {
      let validateList = next => {
        list.fromEnd(2, (err, data) => {
          should.ifError(err);
          should(data).eql(['value2', 'value3']);
          next();
        });
      };
      async.series([
        next => { list.push('value1', next); },
          next => { list.push('value2', next); },
          next => { list.push('value3', next); },
          validateList
      ], done);
    });
    it('should store values encrypted', done => {
      const value = 'somevalue';
      list.push(value, err => {
        should.ifError(err);
        ulist.pop((err, data) => {
          should.ifError(err);
          should(data).eql(crypto.encrypt(value));
          done();
        });
      });
    });
  });
});
