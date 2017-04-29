'use strict';
const KeyValuePair = require('../types/keyValuePair');
const Collection = require('../types/collection');
const List = require('../types/list');
const Counter = require('../types/counter');
const Subscription = require('../types/subscription');

const RedisCommand = require('./command');
const RedisPubSub = require('./pubsub');

module.exports = function RedisDal(redis, subscriber, wrapper) {
  let self = {};

  let getRedisCommand = () => {
    return new RedisCommand(redis, wrapper);
  };
  let getRedisPubSub = () => {
    return new RedisPubSub(redis, subscriber, wrapper);
  };
  self.kvp = function(key) {
    return new KeyValuePair(key, getRedisCommand());
  };
  self.collection = function(namespace) {
    return new Collection(namespace, getRedisCommand());
  };
  self.fifoList = function(key) {
    return new List(key, getRedisCommand());
  };
  self.counter = function(key) {
    return new Counter(key, getRedisCommand());
  };
  self.subscribe = function(pattern, handler, done) {
    return new Subscription(pattern, handler, getRedisPubSub(), done);
  };
  self.publish = function(channel, msg, done) {
    getRedisPubSub().publish(channel, msg, done);
  };
  self.flushall = function(done) {
    getRedisCommand().flushall(done);
  };
  self.expire = function(key, time, done) {
    getRedisCommand().expire(key, time, done);
  };
  self.batch = function() {
    const pipeline = redis.pipeline();
    let batched = new RedisDal(pipeline, subscriber, wrapper);
    batched.exec = function(done) {
      pipeline.exec(err => { done(err); });
    };
    return batched;
  };
  return self;
};
