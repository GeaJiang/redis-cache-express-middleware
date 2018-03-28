
const redis = require('redis');
const bluebird = require('bluebird');
let child_process = require('child_process');

let store = require('./lib/store');
const util = require('./lib/util');


bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const default_structure = ['FIFO', 'LFU', 'LRU'];

class RedisCache {

  constructor(options) {

    let that = this;

    options = Object.assign({
      db: 1,
      host: '127.0.0.1',
      post: 6379,
      limit: 200,
      structure: 'FIFO'
    }, options || {});

    let { limit, structure, host, port, db, password, time_interval } = options;

    structure = ~default_structure.indexOf(structure) ? structure : 'FIFO';

    child_process.execSync('redis-cli config set notify-keyspace-events Ex');

    let config = {
      host: host,
      post: port,
      db: db,
      prefix: 'rc_'
    };

    const client = redis.createClient(config);

    that.client = client;

    that.store = new store({ client: that.client, structure, limit });

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

    that.scheduleClient.psubscribe(`__keyevent@${db||1}__:expired`, (e) => {
      e && console.error(e);
    });

    that.scheduleClient.on('pmessage', (channel, listen, key) => {
      if (listen == `__keyevent@${config.db}__:expired` && key == 'rc_flush_db_interval') {
        child_process.execSync('redis-cli eval \"return redis.call(\'del\',unpack(redis.call(\'keys\',ARGV[1])))\" 0 \'rc_*\'');
        that.client.setexAsync('flush_db_interval', time_interval, '');
      }
    });
  }

  cache(key, subkey) {
    let that = this;
    return function(req, res, next) {
      if (typeof key != 'string' || typeof key != 'string') {
        next();
      }
      // console.log(that);
      return that.store.get(key, subkey)
      .then(data => {
        if (!data) {
          let _send = res.send;
          res.send = function(str) {
            that.store.set(str, key, subkey);
            _send.call(this, str);
          };

          let _json = res.json;
          res.json = function(obj) {
            that.store.set(obj, key, subkey);
            _json.call(this, obj);
          };

          next();
        } else {
          let result = util.type(data);
          that.store.update(key, subkey);
          if (result.type == 'object') {
            res.json(result.data);
          } else {
            res.send(result.data);
          }
        }
      });
    };
  }

  update(key, subkey, data) {
    if (typeof key != 'string') {
      return;
    }
    if (!subkey && data) {
      let type = Object.prototype.toString.call(data).replace(/^\[\w+\s|\]$/g,'').toLowerCase();
      data = type == 'string' ? data : JSON.stringify(data);
      this.client.setAsync(key, data);
    } else if (subkey && !data) {
      this.client.hdelAsync(key, subkey);
    } else if (!subkey && !data) {
      this.client.delAsync(key);
    } else if (subkey && data) {
      let type = Object.prototype.toString.call(data).replace(/^\[\w+\s|\]$/g,'').toLowerCase();
      data = type == 'string' ? data : JSON.stringify(data);
      this.client.hsetAsync(key, subkey, data);
    }
  }
}

module.exports = RedisCache;
