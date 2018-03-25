let record = require('./record');
class store {
  constructor(options) {
    this.client = options.client;
    this.record = new record(options);
  }

  set() {
    //TODO: according to structure, record data by FIFO LFU LRU
    let type = Object.prototype.toString.call(arguments[0]).replace(/^\[\w+\s|\]$/g,'').toLowerCase();
    let data = type == 'string' ? arguments[0] : JSON.stringify(arguments[0]);
    if (arguments[2]) {
      return this.client.hsetAsync(arguments[1], arguments[2], data);
    } else {
      return this.client.setAsync(arguments[1], data);
    }
  }

  get() {
    if (arguments[1]) {
      return this.client.hgetAsync(arguments[0], arguments[1]);
    } else {
      return this.client.getAsync(arguments[0]);
    }
  }
}




module.exports = store;
