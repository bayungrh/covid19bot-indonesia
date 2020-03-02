const redis = require('redis')
const redis_client  = redis.createClient(process.env.REDIS_URI);
const {promisify} = require('util');
const redisGet = promisify(redis_client.get).bind(redis_client);

module.exports = {
    redis_client,
    redisGet
}