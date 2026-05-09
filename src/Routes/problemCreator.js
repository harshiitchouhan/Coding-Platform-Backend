const express = require("express");
const problemRouter = express.Router();
const adminMiddleware = require("../Middleware/adminMiddleware")
const {createProblem,updateProblem,deleteProblem,fetchProblemByID,fetchAllProblem,solvedProblemByUser,submittedProblem} = require("../Controllers/userProblem")
const userMidlleware = require("../Middleware/userMiddleware")


//create problem //admin
problemRouter.post("/create", adminMiddleware ,createProblem);

// fetch problem // user
problemRouter.get("/problemById/:id", userMidlleware ,fetchProblemByID);
problemRouter.get("/allProblem",fetchAllProblem);

// //fetch solved problem by user
problemRouter.get("/problemSolved", userMidlleware ,solvedProblemByUser);

// //update problem //admin
problemRouter.put("/update/:id", adminMiddleware ,updateProblem);

// //delete problem //admin
problemRouter.delete("/delete/:id", adminMiddleware ,deleteProblem);

//particular user ke particular problem ka total submission
problemRouter.get("/submittedProblem/:pid", userMidlleware ,submittedProblem);

module.exports = problemRouter;
