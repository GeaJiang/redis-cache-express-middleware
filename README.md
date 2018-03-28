# redis-cache-middleware
a middleware for express to store same request by redis


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
