
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
    let { limit, structure, host, port, db } = options;
    this.limit = limit || 2000;
    this.structure = ~default_structure.indexOf(structure) ? structure : 'LFU';
    let config = {
      host: host || '127.0.0.1',
      post: port || 6379,
      db: db || 1,
      prefix: 'rc_'
    };
    let client = redis.createClient(config);
    this.client = client;
  }

  store(key, subkey, data) {
    this.client.hsetAsync(key, subkey, data);
  }

  get(key, subkey) {
    if (!key) {
      return null;
    }
    if (!subkey) {
      return this.client.hgetallAsync(key);
    }
    return this.client.hgetAsync(key, subkey);
  }
}

module.exports = function(config) {
  return new RedisCache(config);
};
