
const express = require('express');
const app = express();

const RedisCache = require('../index');

const redisCache = new RedisCache();

app.listen(3000, () => console.log('Example app listening on port 3000!'));
app.get('/', redisCache.cache('a'), (req, res) => res.json({a:1}));
