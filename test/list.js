'use strict';
const List = require('../lib/stores/list');
const Redis = require('../lib/redis');
const should = require('should');

describe('FIFO List', () => {
  let list, redis;
  before(done => {
    redis = new Redis();
    redis.once('ready', done);
  });
  beforeEach(done => {
    list = new List({ id: 'scan-list:test', redis: redis });
    redis.flushall(done);
  });
  afterEach(done => {
    redis.flushall(done);
  });

  it('should handle no results', done => {
    list.pop((err, data) => {
      should.ifError(err);
      should(data).eql(null);
      done();
    });
  });
  it('should flush a list', done => {
    list.push({ id: 1 }, () => {
      list.flush(err => {
        should.ifError(err);
        list.pop((err, data) => {
          should.ifError(err);
          should(data).eql(null);
          done();
        });
      });
    });
  });
  it('should push an item to the back of the list', done => {
    const item1 = { id: 1 };
    const item2 = { id: 2 };
    const firstInList = (err, result) => {
      should(item1).eql(result);
      done();
    };
    list.push(item1, err => {
      should.ifError(err);
      list.push(item2, err => {
        should.ifError(err);
        list.pop(firstInList);
      });
    });
  });
  it('should return all items in order', done => {
    const item1 = { id: 1 };
    const item2 = { id: 2 };
    const resultHandler = (err, results) => {
      should.ifError(err);
      should(results[0].id).eql(1);
      should(results.length).eql(2);
      done();
    };
    list.push(item1, () => {
      list.push(item2, () => {
        list.all(resultHandler);
      });
    });
  });
  it('should let me return items from the start', done => {
    const item1 = { id: 1 };
    const item2 = { id: 2 };
    const resultHandler = (err, results) => {
      should.ifError(err);
      should(results.length).eql(1);
      should(results[0].id).eql(1);
      done();
    };
    list.push(item1, () => {
      list.push(item2, () => {
        list.fromStart(1, resultHandler);
      });
    });
  });
  it('should let me return items from the end', done => {
    const item1 = { id: 1 };
    const item2 = { id: 2 };
    const resultHandler = (err, results) => {
      should.ifError(err);
      should(results.length).eql(1);
      should(results[0].id).eql(2);
      done();
    };
    list.push(item1, () => {
      list.push(item2, () => {
        list.fromEnd(1, resultHandler);
      });
    });
  });
});
