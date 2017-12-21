var Promise = require('bluebird');
var rc = require('../index')({});

Promise.all([
  rc.store('character', 'a', '1'),
  rc.store('character', 'b', '1'),
  rc.store('character', 'c', '1'),
  rc.store('character', 'd', '1'),
  rc.store('phrase', 'abandon', '1'),
  rc.store('phrase', 'brilliant', '1'),
  rc.store('phrase', 'comfort', '1')
])
.then(() => {
  Promise.all([
    rc.get('character'),
    rc.get('phrase', 'brilliant')
  ])
  .then(([a,b]) => {
    console.log(a,b);
    process.exit();
  });
});
