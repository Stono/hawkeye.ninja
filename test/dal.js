'use strict';
const Dal = require('../lib/dal');
const should = require('should');
const async = require('async');
const Crypto = require('node-crypt');
const config = require('../config');
describe('Data Access Layer', () => {
  let dal, udal, crypto;
  before(() => {
    dal = new Dal();
    udal = new Dal({
      redis: {}
    });
    crypto = new Crypto({ key: config.dal.encryptionKey });
  });
  beforeEach(done => {
    dal.flushall(done);
  });
  afterEach(done => {
    dal.flushall(done);
  });

  describe('Counter', () => {
    let counter;
    before(() => {
      counter = dal.counter('some:key');
    });
    it('should increment the value', done => {
      counter.inc(1, (err, newValue) => {
        should.ifError(err);
        should(newValue).eql(1);
        counter.get((err, data) => {
          should.ifError(err);
          should(data).eql(1);
          done();
        });
      });
    });
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
    it('should handle objects', done => {
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
          should(data).startWith('crypto:');
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

    it('should let me get all items', done => {
      let validateResponse = next => {
        collection.all((err, data) => {
          should.ifError(err);
          should(data).eql({ key1: 'value1', key2: 'value2' });
          next();
        });
      };
      async.series([
        next => { collection.set('key1', 'value1', next); },
          next => { collection.set('key2', 'value2', next); },
          validateResponse
      ], done);
    });

    it('should store values encrypted', done => {
      const key = 'somekey';
      const value = 'somevalue';
      collection.set(key, value, err => {
        should.ifError(err);
        ucollection.get(key, (err, data) => {
          should.ifError(err);
          should(data).startWith('crypto:');
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
          should(data).startWith('crypto:');
          done();
        });
      });
    });
  });

  describe('Pub Sub', () => {
    let sub;
    it('should publish and subscribe to messages', done => {
      const msg = { test: 'message' };
      sub = dal.subscribe('some:channel', data => {
        should(data).eql(msg);
        sub.unsubscribe(done);
      }, () => {
        dal.publish('some:channel', msg, () => {});
      });
    });
  });
});
