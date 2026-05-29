const mongoose = require("mongoose");

const mongoose = require("mongoose");

async function main() {
  if (mongoose.connection.readyState >= 1) {
    return; // reuse existing connection
  }

  await mongoose.connect(process.env.DB_KEY, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    bufferCommands: false,
  });

  console.log("MongoDB connected successfully");
}

module.exports = main;

