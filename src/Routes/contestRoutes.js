const express = require("express");
const contestRouter = express.Router();
const userMiddleware = require("../Middleware/userMiddleware");
const adminMiddleware = require("../Middleware/adminMiddleware");
const checkContestAccess = require("../Middleware/checkContestAccess")
const {createContest,allContest,singleContest,registerContest,getContestProblem,contestHistory,getMyContestStats,submitContestProblem,getContestSubmissions,getContestLeaderboard} = require("../Controllers/contestController");


// create a contest 
contestRouter.post("/create" , adminMiddleware , createContest);

// get all contest
contestRouter.get("/allContest" ,userMiddleware, allContest);

// get contest based on id(add checkContestAccess)
contestRouter.get("/singleContest/:id",userMiddleware,checkContestAccess, singleContest);

//registerContestbyId
contestRouter.post("/registerContest/:id",userMiddleware, registerContest)

//contest problempage
contestRouter.get(
  "/:contestId/problem/:problemId",
  userMiddleware,
  checkContestAccess,
  getContestProblem
);

//submit Contest
contestRouter.post(
  "/:contestId/submit/:problemId",
  userMiddleware,
  checkContestAccess,
  submitContestProblem
);

// stats
contestRouter.get(
  "/:contestId/myStats",
  userMiddleware,
  getMyContestStats
);

//submission history
contestRouter.get(
  "/:contestId/submissions/:problemId",
  userMiddleware,
  getContestSubmissions
);

//leaderboard
contestRouter.get(
  "/:contestId/leaderboard",
  userMiddleware,
  getContestLeaderboard
);

//contest history
contestRouter.get("/history", userMiddleware, contestHistory);


module.exports = contestRouter;
