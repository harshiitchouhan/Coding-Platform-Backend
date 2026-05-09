require('dotenv').config({path: "../.env"});
const mongoose =  require('mongoose');
async function main() {
    await mongoose.connect(process.env.DB_KEY);
    console.log("Connected to DB");
}

module.exports = main;