const User = require("../Models/user");
const Submission = require("../Models/submission");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .populate({
        path: "problemSolved",
        select: "title difficultyLevel category",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("-password")
      .populate({
        path: "problemSolved",
        select: "title difficultyLevel category",
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const submissions = await Submission.find({ userId: id })
      .populate({
        path: "problemId",
        select: "title difficultyLevel category",
      })
      .sort({ createdAt: -1 });

    const validSubmissions = submissions.filter(
      (sub) => sub.problemId !== null
    );

    res.status(200).json({
      success: true,
      user,
      submissions: validSubmissions,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const toggleBanUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.result._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "Admin cannot ban their own account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBanned
        ? "User banned successfully"
        : "User unbanned successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBanned: user.isBanned,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    if (req.result._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "Admin cannot change their own role",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.result._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "Admin cannot delete their own account",
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await Submission.deleteMany({ userId: id });

    res.status(200).json({
      success: true,
      message: "User and related submissions deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getSingleUser,
  toggleBanUser,
  changeUserRole,
  deleteUserByAdmin,
};