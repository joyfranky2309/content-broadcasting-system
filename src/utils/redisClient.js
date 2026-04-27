const redis = require('redis');

const redisClient = redis.createClient({
    url: 'redis://localhost:6379'
});

redisClient.connect().catch(console.error);

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

module.exports = redisClient;
