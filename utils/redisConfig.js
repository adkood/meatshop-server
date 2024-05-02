const Redis = require("ioredis");
const redisUri = process.env.REDIS_URL;
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