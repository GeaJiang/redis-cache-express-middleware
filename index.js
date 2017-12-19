'use strict';

var redis = require('redis');
var bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

//TODO: store quantity limit
//TODO: different user
//TODO: before res store override express responselancic
//TODO: FIFO LRU LFU

var default_structure = ['FIFO', 'LFU', 'LRU'];

class RedisCache {

  constructor(options) {
    let { limit, structure, redis_db } = options;
    this.limit = limit || 2000;
    this.structure = ~default_structure.indexOf(structure) ? structure : 'LFU';
    this.redis_db = redis_db || 1;
  }

  store(key, subkey) {
    
  }
}
