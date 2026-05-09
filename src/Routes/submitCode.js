const express = require("express");
const userMiddleware = require("../Middleware/userMiddleware");
const submitRouter = express.Router();
const {submitCode,runCode} = require("../Controllers/userSubmission");
const submitLimiter =  require("../Middleware/submitLimiter")


submitRouter.post("/submit/:id",userMiddleware, submitLimiter ,submitCode);
submitRouter.post("/run/:id", userMiddleware, runCode)

module.exports = submitRouter;