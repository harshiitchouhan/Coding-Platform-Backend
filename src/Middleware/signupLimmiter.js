const rateLimit = require("express-rate-limit");

const signupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 min

  max: 5,

  message: {
    success: false,
    message:
      "Too many signup attempts. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  signupLimiter,
};

//verify limit
const verifyOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // matches OTP expiry window
  max: 5,                    // 5 attempts per 10 min per IP
  message: {
    success: false,
    message: "Too many OTP attempts. Please request a new OTP.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { signupLimiter, verifyOtpLimiter };