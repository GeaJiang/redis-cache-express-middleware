let record = require('./record');
class store {
  constructor(options) {
    this.client = options.client;
    this.record = new record(options);
  }

  set(target, key, subkey) {
    //TODO: according to structure, record data by FIFO LFU LRU
    let type = Object.prototype.toString.call(target).replace(/^\[\w+\s|\]$/g,'').toLowerCase();
    let data = type == 'string' ? target : JSON.stringify(target);
    if (subkey) {
      return this.record.update(key, subkey)
      .then(() => {
        return this.client.hsetAsync(key, subkey, data);
      });
    } else {
      return this.record.update(key)
      .then(() => {
        return this.client.setAsync(key, data);
      });
    }
  }

  get(key, subkey) {
    if (subkey) {
      return this.client.hgetAsync(key, subkey);
    } else {
      return this.client.getAsync(key);
    }
  }

  update(key, subkey) {
    return this.record.update(key, subkey);
  }
}




module.exports = store;
