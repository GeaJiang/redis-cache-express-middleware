# redis-cache-middleware
a middleware for express to store same request by redis

there are some configuration for redis
```javascript
let config = {
  db: 1,
  host: '127.0.0.1',
  post: 6379,
  limit: 200,
  structure: 'LFU',
  password: '1234',
  clearTime: '12:00',
  interval: 60 * 60 * 24
}
```
db is select redis db

host is redis host

port is redis port

limit is to limit store total apis data

structure is i provide three algorithm to store data

password is redis password

clearTime and interval is clear all cache data automatically, for example if we set clearTime is '12:00' ,interval is 60 * 60 * 24  , redisCache will clear data at 12:00 everyday

we can use cache() as a middleware to get data from redis instead of database , don't need to calculate data again if we have done before;
example:

```javascript

const RedisCache = require('../index');

const redisCache = new RedisCache();

app.get('/foo', redisCache.cache('foo', 'blah'), (req, res) => res.json({a:1}));
app.get('/bar', redisCache.cache('bar'), (req, res) => res.json({b:1}));
app.get('/', redisCache.cache('foo', 'bar'), (req, res) => res.send('aaaa'));

```

if there are some operations make data in redis stale, we can use method update() to update data or just tell redis the data is stale, then we will get fresh data from redis or recaculate data or get data from database.
```javascript
app.put('/foo', (req, res) => {
  redisCache.update('foo', 'blah', {a:2});
})

app.put('/bar', (req, res) => {
  redisCache.update('foo', null, {b:2});
})

app.put('/', (req, res) => {
  redisCache.update('foo', 'bar');
})
```
