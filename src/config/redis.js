const {createClient} = require('redis')

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_HOST,
        port: 19031
    }
});

module.exports = redisClient;

