const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_URL
});

client.on("error", (error) => {
    console.error('Error connecting to Redis:', error);
});

client.on("connect", () => {
    console.log('Redis client connected');
});

client.on("end", () => {
    console.log('Redis client disconnected');
});

module.exports = client;
