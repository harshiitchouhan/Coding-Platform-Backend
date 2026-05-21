const Contest = require("../Models/contest");

const checkContestAccess = async (req, res, next) => {
  try {
    const contestId = req.params.id || req.params.contestId;

    const contest = await Contest.findById(contestId);

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    const now = new Date();

    if (now < new Date(contest.startTime)) {
      return res.status(403).json({
        success: false,
        message: "Contest has not started yet",
      });
    }

    if (now > new Date(contest.endTime)) {
      return res.status(403).json({
        success: false,
        message: "Contest has ended",
      });
    }

    req.contest = contest;
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Contest access check failed",
      error: err.message,
    });
  }
};

module.exports = checkContestAccess;