require("dotenv").config();

const mongoose = require("mongoose");

async function main() {
  try {

    if (!process.env.DB_KEY) {
      throw new Error("DB_KEY is missing");
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.DB_KEY, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("Connected to DB");

  } catch (err) {

    console.log("MongoDB Error");
    console.log("Name:", err.name);
    console.log("Message:", err.message);

    throw err;
  }
}

module.exports = main;