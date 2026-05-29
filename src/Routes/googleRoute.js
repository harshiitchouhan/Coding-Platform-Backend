// const express = require("express");
// const googleRouter = express.Router();
// const passport = require("passport");
// const jwt = require("jsonwebtoken");

// const FRONTEND_URL =
//   process.env.NODE_ENV === "production"
//     ? "https://codebit-dev.vercel.app"
//     : "http://localhost:5173";

// googleRouter.get(
//   "/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// googleRouter.get(
//   "/google/callback",
//   passport.authenticate("google", {
//     session: false,
//     failureRedirect: `${FRONTEND_URL}/login?error=google_failed`,
//   }),
//   (req, res) => {
//     try {
//       const user = req.user;

//       const token = jwt.sign(
//         { _id: user._id, email: user.email, role: user.role },
//         process.env.SECRET_KEY,
//         { expiresIn: "1d" }
//       );

//       // set httpOnly cookie then redirect
//       res.cookie("token", token, {
//         httpOnly: true,
//         secure: true,
//         sameSite: "none",
//         maxAge: 24 * 60 * 60 * 1000,
//       });

//       return res.redirect(FRONTEND_URL);

//     } catch (err) {
//       console.error("Google Login Error:", err);
//       return res.redirect(`${FRONTEND_URL}/login?error=server_error`);
//     }
//   }
// );

// module.exports = googleRouter;



// token approach
const express = require("express");
const googleRouter = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? "https://codebit-dev.vercel.app"
    : "http://localhost:5173";

googleRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

googleRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=google_failed`,
  }),
  (req, res) => {
    try {
      const user = req.user;

      const token = jwt.sign(
        { _id: user._id, email: user.email, role: user.role },
        process.env.SECRET_KEY,
        { expiresIn: "1d" }
      );

      return res.redirect(`${FRONTEND_URL}?token=${token}`);

    } catch (err) {
      console.error("Google Login Error:", err);
      return res.redirect(`${FRONTEND_URL}/login?error=server_error`);
    }
  }
);

module.exports = googleRouter;


