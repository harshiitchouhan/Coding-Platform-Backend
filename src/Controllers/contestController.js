const User = require("../Models/user");
const Problem = require("../Models/problems");
const Contest = require("../Models/contest");
const Submission = require("../Models/submission")
const ContestSubmission = require("../Models/contestSubmission")
const wrapCode = require("../Utils/wrapCode")
const {getLanguageById , submitBatch , submitToken} = require("../Utils/problemUtil")

const decodeBase64 = (str) => {
  if (!str) return null;
  return Buffer.from(str, "base64").toString("utf-8");
};

const createContest = async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      problems,
    } = req.body;

    if (!title || !startTime || !endTime || !problems?.length) {
      return res.status(400).json({
        success: false,
        message: "Title, start time, end time and problems are required",
      });
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    const contest = await Contest.create({
      title,
      description,
      startTime,
      endTime,
      problems,
      createdBy: req.result._id,
    });

    res.status(201).json({
      success: true,
      message: "Contest created successfully",
      contest,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error creating contest",
      error: err.message,
    });
  }
};


const allContest = async (req, res) => {
  try {

    const userId = req.result._id;

    const contests = await Contest.find({
    endTime: { $gt: new Date() }
  })
  .select("title description startTime endTime problems participants")
  .sort({ startTime: 1 });

  const contestsWithStatus = contests.map((contest) => {
      const obj = contest.toObject();

      obj.isRegistered = contest.participants.some(
        (participantId) => participantId.toString() === userId.toString()
      );

      return obj;
    });

    return res.status(200).json({
      success: true,
      contests: contestsWithStatus,
    });


  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error catching contests",
      error: err.message,
    });
  }
};


const singleContest = async(req,res)=>{
  try{

    const {id} =  req.params;
    const contest = await Contest.findById(id)
    .populate({
        path: "problems.problem",
        select:
          "title difficultyLevel category constraints description",
    });

    if(!contest){
       return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    return res.status(200).json({
      success: true,
      contest,
    });

  }
  catch (err) {
    res.status(500).json({
      success: false,
      message: "Error catching contests",
      error: err.message,
    });
  }
}

const registerContest = async (req, res) => {
  try {

    // contest id and userId nikala
    const { id } = req.params;
    const userId = req.result._id;

    const contest = await Contest.findById(id);

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    const now = new Date();

    // registration closed after contest starts
    if (now >= contest.startTime) {
      return res.status(400).json({
        success: false,
        message: "Registration closed",
      });
    }

    // already registered check
    const alreadyRegistered = contest.participants.some(
      (participantId) => participantId.toString() === userId.toString()
    );

    // agar already registered hai
    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: "Already registered",
      });
    }

    // register user
    contest.participants.push(userId);

    await contest.save();

    return res.status(200).json({
      success: true,
      message: "Registered successfully",
      participantsCount: contest.participants.length,
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: err.message,
    });

  }
};

// const getRegistrationStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.result._id;

//     const contest = await Contest.findById(id).select("participants startTime endTime");

//     if (!contest) {
//       return res.status(404).json({
//         success: false,
//         message: "Contest not found",
//       });
//     }

//     const isRegistered = contest.participants.some(
//       (participantId) => participantId.toString() === userId.toString()
//     );

//     return res.status(200).json({
//       success: true,
//       isRegistered,
//       participantsCount: contest.participants.length,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to check registration status",
//       error: err.message,
//     });
//   }
// };

const getContestProblem = async (req, res) => {
  try {
    const { contestId, problemId } = req.params;

    const contest = await Contest.findById(contestId);

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    const isProblemInContest = contest.problems.some(
      (item) => item.problem.toString() === problemId
    );

    if (!isProblemInContest) {
      return res.status(403).json({
        success: false,
        message: "This problem is not part of this contest",
      });
    }

    const problem = await Problem.findById(problemId).select(
      "title description difficultyLevel category constraints visibleTestCases startCode functionSignature functionName inputFields"
    );

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    return res.status(200).json({
      success: true,
      contest: {
        _id: contest._id,
        title: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
      },
      problem,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contest problem",
      error: err.message,
    });
  }
};


const submitContestProblem = async (req, res) => {
  try {
    const userId = req.result._id;

    const { contestId, problemId } = req.params;
    const { code, language } = req.body;

    if (!userId || !contestId || !problemId || !code || !language) {
      return res.status(400).json({
        success: false,
        message: "Some fields are missing",
      });
    }

    const contest = await Contest.findById(contestId);
    // console.log("hei");

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }
        // console.log("hei2");


    const contestProblem = contest.problems.find(
      (item) => item.problem.toString() === problemId
    );

    if (!contestProblem) {
      return res.status(403).json({
        success: false,
        message: "This problem is not part of this contest",
      });
    }

    const problem = await Problem.findById(problemId);
      // console.log("hei3");


    if (!problem || !problem.functionName) {
      return res.status(400).json({
        success: false,
        message: "Problem or functionName missing",
      });
    }

    const submitResult = await Submission.create({
      userId,
      problemId,
      code,
      language,
      testCasesTotal: problem.hiddenTestCases.length,
      status: "pending",
    });

    // console.log("hei4");


    const languageID = getLanguageById(language);

    const submission = problem.hiddenTestCases.map((testcase) => ({
      source_code: Buffer.from(wrapCode(code, language)).toString("base64"),
      language_id: languageID,
      stdin: Buffer.from(testcase.input || "").toString("base64"),
      expected_output: Buffer.from(testcase.output || "").toString("base64"),
    }));

    const submitRes = await submitBatch(submission);

    const resultToken = submitRes.map((value) => value.token);

    const testResult = await submitToken(resultToken);

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = "accepted";
    let errorMsg = null;

    for (const test of testResult) {
      if (test.status_id === 3) {
        testCasesPassed++;
        runtime += parseFloat(test.time || 0);
        memory = Math.max(memory, test.memory || 0);
      } else {
        switch (test.status_id) {
          case 4:
            status = "wrong answer";
            break;
          case 5:
            status = "tle";
            break;
          case 6:
            status = "compile error";
            break;
          default:
            status = "runtime error";
        }

        errorMsg =
          decodeBase64(test.stderr) ||
          decodeBase64(test.compile_output) ||
          test.message ||
          "Execution failed";

        break;
      }
    }

    submitResult.status = status;
    submitResult.testCasesPassed = testCasesPassed;
    submitResult.errorMsg = errorMsg;
    submitResult.runtime = runtime;
    submitResult.memory = memory;

    await submitResult.save();

    const isAccepted = status === "accepted";

    const points = isAccepted ? contestProblem.points || 0 : 0;

    const penalty = isAccepted
      ? Math.floor((new Date() - new Date(contest.startTime)) / 60000)
      : 0;
    
    // console.log("hei5");

    const contestSubmission = await ContestSubmission.create({
      contestId,
      submissionId: submitResult._id,
      problemId,
      userId,
      status,
      language,
      code,
      points,
      penalty,
    });
    // console.log("hei6");

    return res.status(201).json({
      success: true,
      message: "Contest submission successful",
      submission: submitResult,
      contestSubmission,
    });


  } catch (err) {

    // console.log("CONTEST SUBMIT ERROR:");
    // console.log(err);
    return res.status(500).json({
      success: false,
      message: "Contest submission failed",
      error: err.message,
    });
  }
};


const getContestSubmissions = async (req, res) => {
  try {
    const { contestId, problemId } = req.params;

    const submissions = await ContestSubmission.find({
      contestId,
      problemId,
      userId: req.result._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      submissions,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contest submissions",
      error: err.message,
    });
  }
};


const getMyContestStats = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.result._id;

    const contest = await Contest.findById(contestId).select("problems");

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    const solvedProblems = await ContestSubmission.distinct("problemId", {
      contestId,
      userId,
      status: "accepted",
    });

    return res.status(200).json({
      success: true,
      solvedCount: solvedProblems.length,
      solvedProblems,
      totalProblems: contest.problems.length,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contest stats",
      error: err.message,
    });
  }
};

//most important must study
const getContestLeaderboard = async (req, res) => {
  try {
    const { contestId } = req.params;

    // contest info le aaye
    const contest = await Contest.findById(contestId)
      .select("title startTime endTime problems")
      .populate({
        path: "problems.problem",
        select: "title difficultyLevel category",
      });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    // jitne total submissions hai wo isme aayega(all users)
    const submissions = await ContestSubmission.find({ contestId })
      .populate({
        path: "userId",
        select: "name email profileImage",
      })
      .sort({ createdAt: 1 });


    // p1:100points iss format mei convert krne ke liye ye use kia h 
    // point problem to points
    const problemPointsMap = {};

    contest.problems.forEach((item) => {
      problemPointsMap[item.problem._id.toString()] = item.points || 0;
    });

    // isko user and problem dono se map krne ke liye use kra hai 
    const leaderboardMap = {};

    for (const sub of submissions) {
      const userId = sub.userId._id.toString();
      const problemId = sub.problemId.toString();

      // agar kisi user ne submit kia then wo leader board se connect hoga isse
      
      if (!leaderboardMap[userId]) {
        leaderboardMap[userId] = {
          user: {
            _id: sub.userId._id,
            name: sub.userId.name,
            email: sub.userId.email,
            profileImage: sub.userId.profileImage,
          },
          totalPoints: 0,
          totalPenalty: 0,
          solvedCount: 0,
          lastAcceptedAt: null,
          problems: {},
        };
      }

      //leaderboardMap ke andar iss user ka data nikalo
      const userRow = leaderboardMap[userId];

      //Agar iss user ne iss problem par pehli baar submission kiya hai,
      //toh iss problem ka record create karo.
      if (!userRow.problems[problemId]) {
        userRow.problems[problemId] = {
          solved: false,
          wrongAttempts: 0,
          points: 0,
          penalty: 0,
          acceptedAt: null,
        };
      }

      const problemStat = userRow.problems[problemId];

      // ignore all submissions after first accepted
      if (problemStat.solved) continue;

      if (sub.status === "accepted") {
        const acceptedAt = new Date(sub.createdAt);

        const minutesFromStart = Math.floor(
          (acceptedAt - new Date(contest.startTime)) / 60000
        );

        const penalty =
          Math.max(0, minutesFromStart) + problemStat.wrongAttempts * 10;

        const points = problemPointsMap[problemId] || sub.points || 0;

        problemStat.solved = true;
        problemStat.points = points;
        problemStat.penalty = penalty;
        problemStat.acceptedAt = acceptedAt;

        userRow.totalPoints += points;
        userRow.totalPenalty += penalty;
        userRow.solvedCount += 1;
        userRow.lastAcceptedAt = acceptedAt;
      } else {
        problemStat.wrongAttempts += 1;
      }
    }

    // object pr sort thodi kr skte
    //array mei convert kiya then sort
    let leaderboard = Object.values(leaderboardMap);

    leaderboard.sort((a, b) => {

      // pehle points ke basis pr
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      // if tie then penality ke basis pr
      if (a.totalPenalty !== b.totalPenalty) {
        return a.totalPenalty - b.totalPenalty;
      }

      // Jis user ka koi accepted submission nahi hai,
      // wo accepted wale user ke neeche jayega.
      if (!a.lastAcceptedAt && !b.lastAcceptedAt) return 0;
      if (!a.lastAcceptedAt) return 1;
      if (!b.lastAcceptedAt) return -1;

      return new Date(a.lastAcceptedAt) - new Date(b.lastAcceptedAt);
    });

    leaderboard = leaderboard.map((row, index) => ({
      rank: index + 1,
      ...row,
    }));

    return res.status(200).json({
      success: true,
      contest: {
        _id: contest._id,
        title: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
        problems: contest.problems,
      },
      leaderboard,
    });
  } 
  catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
      error: err.message,
    });
  }
};


const contestHistory = async (req, res) => {
  try {
    const userId = req.result._id;

    const contests = await Contest.find({
      endTime: { $lt: new Date() },
    })
      .select("title description startTime endTime problems participants")
      .sort({ endTime: -1 });

    const contestsWithStatus = contests.map((contest) => {
      const obj = contest.toObject();

      obj.isRegistered = contest.participants.some(
        (participantId) => participantId.toString() === userId.toString()
      );

      return obj;
    });

    return res.status(200).json({
      success: true,
      contests: contestsWithStatus,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching contest history",
      error: err.message,
    });
  }
};


module.exports = {createContest,allContest,singleContest,registerContest,contestHistory,getContestProblem,submitContestProblem,getContestSubmissions,getMyContestStats,getContestLeaderboard};