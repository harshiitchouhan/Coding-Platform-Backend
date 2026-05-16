const mongoose = require("mongoose");

async function main() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.DB_KEY) {
    throw new Error("DB_KEY is missing");
  }

  await mongoose.connect(process.env.DB_KEY, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("MongoDB connected");
}

module.exports = main;