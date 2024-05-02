const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => {
  console.log('redis connected');
})

module.exports = redis;