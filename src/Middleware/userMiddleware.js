const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const User = require("../Models/user");

const userMiddleware = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    console.log("1. COOKIE TOKEN EXISTS:", !!token);

    if (!token) {
      throw new Error("Token Doesn't Exist");
    }

    console.log("2. SECRET_KEY EXISTS:", !!process.env.SECRET_KEY);

    const payload = jwt.verify(token, process.env.SECRET_KEY);

    console.log("3. PAYLOAD:", payload);

    const { _id } = payload;

    console.log("4. USER ID FROM TOKEN:", _id);

    if (!_id) {
      throw new Error("id is Not Present / Invalid Token");
    }

    const result = await User.findById(_id);

    console.log("5. USER FOUND:", !!result);
    console.log("6. USER EMAIL:", result?.email);

    if (!result) {
      throw new Error("User Doesn't Exist");
    }

    if (result.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned",
      });
    }

    const isBlocked = await redisClient.exists(`token:${token}`);

    console.log("7. IS TOKEN BLOCKED:", isBlocked);

    if (isBlocked) {
      throw new Error("Invalid Token");
    }

    req.result = result;
    next();

  } catch (err) {
    console.log("8. USER MIDDLEWARE ERROR:", err.message);

    res.status(401).send("Error " + err.message);
  }
};

module.exports = userMiddleware;