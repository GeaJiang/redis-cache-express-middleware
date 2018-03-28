class record {
  constructor(options) {
    this.client = options.client;
    this.structure = options.structure;
    this.limit = options.limit;
    this.listKey = 'rc_rc_list';
  }

  update(key, subkey) {
    let k;
    k = key + (subkey ? subkey : '');
    switch (this.structure) {
      case 'FIFO':
        return this.client.lrangeAsync(this.listKey, 0, -1)
        .then(list => {
          if (!list.length) {
            this.client.lpushAsync(this.listKey, k);
          } else if (list.length < this.limit) {
            let check = list.some(item => item == k);
            if (!check) {
              this.client.lpushAsync(this.listKey, k);
            }
          } else if (list.length == this.limit) {
            let check = list.some(item => item == k);
            if (!check) {
              this.client.rpopAsync(this.listKey)
              .then(deletedKey => {
                this.client.delAsync(deletedKey);
                this.client.lpushAsync(this.listKey, k);
              });
            }
          }
        });
      case 'LRU':
        return this.client.llenAsync(this.listKey)
        .then(count => {
          if (count <= this.limit) {
            this.client.lremAsync(this.listKey, 0, k)
            .then(() => {
              this.client.lpush(this.listKey, k);
            });
          } else {
            this.client.lremAsync(this.listKey, 0, k)
            .then(deleted => {
              if (deleted) {
                this.client.lpushAsync(this.listKey, k);
              } else {
                this.client.rpopAsync(this.listKey)
                .then(deletedKey => {
                  this.client.delAsync(deletedKey);
                  this.client.lpushAsync(this.listKey, k);
                });
              }
            });
          }
        });
      case 'LFU':
        return this.client.zcardAsync(this.listKey)
        .then(length => {
          if (length <= this.limit) {
            this.client.zincrbyAsync(this.listKey, 1, k);
          } else {
            this.client.zscoreAsync(this.listKey, k)
            .then(score => {
              if (score) {
                this.client.zincrbyAsync(this.listKey, 1, k);
              } else {
                this.client.zremrangebyrankAsync(this.listKey, 0, length-this.limit)
                .then(() => {
                  this.client.zincrbyAsync(this.listKey, 1, k);
                });
              }
            });
          }
        });
      default:
        return Promise.resolve();
    }
  }
}

module.exports = record;
