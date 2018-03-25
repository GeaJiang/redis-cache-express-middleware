
const redis = require('redis');
const bluebird = require('bluebird');
let child_process = require('child_process');

let store = require('./lib/store');
const util = require('./lib/util');


bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

//TODO: store quantity limit
//TODO: different user
//TODO: before res store override express responselancic
//TODO: FIFO LRU LFU

const default_structure = ['FIFO', 'LFU', 'LRU'];

class RedisCache {

  constructor(options) {

    let that = this;
    let { limit, structure, host, port, db, password, time_interval } = options;

    that.limit = limit || 2000;
    structure = ~default_structure.indexOf(structure) ? structure : 'FIFO';

    child_process.execSync('redis-cli config set notify-keyspace-events Ex');

    let config = {
      host: host || '127.0.0.1',
      post: port || 6379,
      db: db || 1,
      prefix: 'rc_'
    };

    const client = redis.createClient(config);

    that.client = client;

    that.store = new store({ client: that.client, structure });

    const scheduleClient = redis.createClient(config);

    that.scheduleClient = scheduleClient;

    if (time_interval) {
      that.time_interval = time_interval;
      that.client.setexAsync('flush_db_interval', time_interval, '');
    }

    if (password) {
      that.client.auth(password);
      that.scheduleClient.auth(password);
    }

    that.scheduledRedis.psubscribe(`__keyevent@${db||1}__:expired`, (e) => {
      e && console.error(e);
    });

    that.scheduledRedis.on('pmessage', (channel, listen, key) => {
      if (listen == `__keyevent@${config.db}__:expired` && key == 'rc_flush_db_interval') {
        child_process.execSync('redis-cli eval \"return redis.call(\'del\',unpack(redis.call(\'keys\',ARGV[1])))\" 0 \'rc_*\'');
        that.client.setexAsync('flush_db_interval', time_interval, '');
      }
    });
  }

  cache() {
    return function(req, res, next) {
      return store.get(...arguments)
      .then(data => {
        if (!data) {
          let _send = res.send;
          res.send = function(str) {
            store.set(str, ...arguments);
            _send.call(this, str);
          };

          let _json = res.json;
          res.json = function(obj) {
            store.set(obj, ...arguments);
            _json.call(this, obj);
          };

          next();
        } else {
          let result = util.isObject(data);
          if (result.type == 'object') {
            res.json(result.data);
          } else {
            res.send(result.data);
          }
        }
      });
    };
  }

  update() {

  }
}

module.exports = function(config) {
  return new RedisCache(config);
};
