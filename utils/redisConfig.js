const Redis = require("ioredis");
const redisUri = "rediss://default:AVNS_s8Wp453bSMyZLrFM7vv@meatshop-cache-meatshop-cache.c.aivencloud.com:10672"
const redis = new Redis(redisUri);


redis.on('connect', () => {
  console.log('redis connected');
})
// redis.set("key", "hello world");

// redis.get("key").then(function (result) {
//     console.log(`The value of key is: ${result}`);
//     redis.disconnect();
// });

module.exports = redis;