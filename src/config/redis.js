const { createClient } = require("redis");

const redisClient = createClient({
  username: "default",
  password: process.env.REDIS_PASS,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 19031,
  },
});

redisClient.on("error", (err) => {
  console.log("Redis Client Error:", err.message);
});

const connectRedis = async () => {
  try{
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis connected");
  }
  }
  catch(err){
     console.log("Redis connection failed:", err.message);
  }
};

module.exports = {
  redisClient,
  connectRedis,
};