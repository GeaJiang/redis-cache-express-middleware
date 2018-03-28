class record {
  constructor(options) {
    this.client = options.client;
    this.structure = options.structure;
    this.listKey = 'rc_rc_list';
  }

  update(key, subkey) {
    let k;
    k = key + (subkey ? subkey : '');
    switch (this.structure) {
      case 'FIFO':
        this.client.lrangeAsync(this.listKey, 0, -1)
        .then(list => {
          if (!list) {
            this.client.lpushAsync(this.listKey, k);
          } else if (list.length == 200) {
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
        break;
      case 'LRU':
        this.client.llenAsync(this.listKey)
        .then(count => {
          if (count < 201) {
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
        break;
      case 'LFU':
        this.client.zcardAsync(this.listKey)
        .then(length => {
          if (length < 201) {
            this.client.zincrbyAsync(this.listKey, 1, k);
          } else {
            this.client.zscoreAsync(this.listKey, k)
            .then(score => {
              if (score) {
                this.client.zincrbyAsync(this.listKey, 1, k);
              } else {
                this.client.zremrangebyrankAsync(this.listKey, 0, length-200)
                .then(() => {
                  this.client.zincrbyAsync(this.listKey, 1, k);
                });
              }
            });
          }
        });
        break;
      default:
        return;
    }
  }
}

module.exports = record;
