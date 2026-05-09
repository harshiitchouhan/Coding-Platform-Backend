const express = require("express");
const userMiddleware = require("../Middleware/userMiddleware");
const aiRouter = express.Router();
const solveDoubt = require("../Controllers/solveDoubt")

aiRouter.post("/chat", userMiddleware ,solveDoubt);

module.exports = aiRouter;
