const express = require("express");
const authRouter = express.Router();

const {register,verifyEmail,login,logout,adminRegister,deleteProfile,getProfile,editProfile,saveProfileImageMetaData,generateProfileImageSignature,removeProfileImage} = require("../Controllers/userAuthenticate");
const userMiddleware = require ("../Middleware/userMiddleware");
const adminMiddleware = require("../Middleware/adminMiddleware");
const {signupLimiter,verifyOtpLimiter} = require('../Middleware/signupLimmiter');
const User = require("../Models/user")
const jwt = require("jsonwebtoken");
const sendEmail = require("../Utils/sendEmail");


// Register
authRouter.post("/register" ,signupLimiter, register);

//verify-otp
authRouter.post("/verify-email" ,verifyOtpLimiter, verifyEmail);

// Login
authRouter.post("/login" , login);

// Logout
authRouter.post("/logout", logout);

//register admin
authRouter.post("/admin/register" , adminMiddleware, adminRegister);

// GetProfile
authRouter.get("/profile", userMiddleware, getProfile);

//Delete Profile
authRouter.delete("/deleteProfile" , userMiddleware , deleteProfile);

//edit profile
authRouter.put("/editProfile",userMiddleware, editProfile);

//get the signature verification from backend
authRouter.get("/profileSignature",userMiddleware,generateProfileImageSignature);

//save links of image in db
authRouter.post("/save",userMiddleware,saveProfileImageMetaData);

// remove profile image
authRouter.delete("/deleteImage",userMiddleware,removeProfileImage);

//Check-Auth :- Called Automatically whenever someone comes to our website(get info from tokens which is handled by web rowser)
authRouter.get("/check",userMiddleware,(req,res)=>{
    const reply ={
        name : req.result.name,
        emailId : req.result.emailId,
        _id : req.result._id,
        role: user.role

    }

    res.status(200).json({
        user : reply,
        message:"Valid User"
    })
    // console.log(req.cookies);
})

//refresh :- to have user details even after resfresh
authRouter.get("/me", async (req, res) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ message: "Token doesn't exist" });
    }
    console.log("Token:", token);

    const payload = jwt.verify(token, process.env.SECRET_KEY);
    const { _id } = payload;
    console.log("Payload:", payload);

    if (!_id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(_id).select("-password"); 
    

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user }); //
    // console.log("ME USER:", user);
    // console.log(req.cookies);
  } catch (err) {
    // console.log(err.message); 
    res.status(401).json({ message: "Invalid token" });
  }
});
 

module.exports = authRouter;
