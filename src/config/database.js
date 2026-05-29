const mongoose = require("mongoose");

async function main() {

  console.log("Connecting MongoDB...");

  if (isConnected) {
    console.log("Already connected");
    return;
  }

  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    console.log("Ready state connected");
    return;
  }

  await mongoose.connect(process.env.DB_KEY, {
    serverSelectionTimeoutMS: 10000,
  });

  isConnected = true;

  console.log("MongoDB connected successfully");
}

module.exports = main;