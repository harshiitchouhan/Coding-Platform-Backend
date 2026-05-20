const express = require("express");
const googleRouter = express.Router();
const passport = require("passport")

const User = require("../Models/user")
const jwt = require("jsonwebtoken");

googleRouter.get("/google",passport.authenticate("google",{scope:["profile","email"]}));

googleRouter.get("/google/callback",
    passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),

  (req,res)=>{
    try{
        
        const user = req.user;
        const token = jwt.sign(
        {
          _id: user._id,
          email: user.email,
          role: user.role,
        },

        process.env.SECRET_KEY,

        {
          expiresIn: "1d",
        }
      );

      // console.log("REQ USER:", req.user);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
            process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
        });

      return res.redirect(
        process.env.NODE_ENV === "production"
          ?  "https://coding-platform-khaki.vercel.app"
          : "http://localhost:5173"
      );
    }
    
    catch(err){
        console.error("Google Login Error:", err);
         return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

);

module.exports = googleRouter;
