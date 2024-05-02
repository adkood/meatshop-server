const Redis = require("ioredis");
const redisUri = process.env.REDIS_URL;
const redis = new Redis(redisUri);


redis.on('connect', () => {
  console.log('redis connected');
})

module.exports = redis;