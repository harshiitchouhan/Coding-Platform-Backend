const User = require("../Models/user");
const bcrypt = require("bcrypt");
const validate = require("../Utils/validate");
const jwt = require("jsonwebtoken");
const { redisClient , connectRedis } = require("../config/redis");
const Submission = require("../Models/submission");
const Problem = require("../Models/problems")
const cloudinary = require("cloudinary").v2;
const sendEmail = require("../Utils/sendEmail")
const crypto = require("crypto")


// Email Otp Generation
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// 1 otp in 1 min
const checkOtpCooldown = async (email) => {
  const key = `otp_cooldown:${email}`;

  const ttl = await redisClient.ttl(key);

  if (ttl > 0) {
    return ttl;
  }

  await redisClient.set(key, "active", {
    EX: 60,
    NX: true,
  });

  return 0;
};

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const register = async(req,res)=>{
    try {

        validate(req.body); // check formats of all required fields *
        const { name, email, password } = req.body; // They Are Mandatory Fields which must be present

         const userExist = await User.findOne({ email });

          if (userExist) {
            if (!userExist.isVerified) {

              const cooldown = await checkOtpCooldown(userExist.email);

              if (cooldown > 0) {
                return res.status(429).json({
                  success: false,
                  message: `Please wait ${cooldown}s before requesting another OTP`,
                  retryAfter: cooldown,
                });
              }
              const otp = generateOtp();

              
              userExist.emailOtp = await bcrypt.hash(String(otp), 10);
              userExist.emailOtpExpires = Date.now() + 10 * 60 * 1000;

              await userExist.save();

              await sendEmail(
                userExist.email,
                "CodeBit Email Verification",
                `Hi ${userExist.name}, your CodeBit verification code is: ${otp}`,
                `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">

                    <p>Hello ${userExist.name},</p>

                    <p>
                      Welcome to CodeBit! We're excited to have you on board. To complete your
                      registration and verify your email address, please use the one-time code below.
                    </p>

                    <p>
                      We take the security of your account seriously. Our security team has logged
                      this verification request and will monitor your account for any unusual activity.
                    </p>

                    <p>Your email verification code is:</p>

                    <div style="text-align: center; margin: 32px 0;">
                      <div style="
                        display: inline-block;
                        background-color: #f0f9ff;
                        border: 2px dashed #0ea5e9;
                        border-radius: 12px;
                        padding: 20px 48px;
                        font-size: 36px;
                        font-weight: bold;
                        letter-spacing: 12px;
                        color: #0ea5e9;
                      ">
                        ${otp}
                      </div>
                    </div>

                    <p>
                      This code is valid for <strong>10 minutes</strong>. For your security, please
                      do not share this code with anyone. Our support team will never ask you for
                      your password or this code.
                    </p>

                    <p>
                      If you did not create a CodeBit account, please ignore this email. No account
                      will be created and your inbox is safe.
                    </p>

                    <p>
                      If you have any questions or concerns in the meantime, please don't hesitate to
                      reply to this email. Our support team is available 24/7 to assist you.
                    </p>

                    <p>
                      Happy Coding 💻<br/>
                      <strong>CodeBit Support Team</strong>
                    </p>

                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

                    <p style="font-size: 12px; color: #6b7280; text-align: center;">
                      CodeBit, Inc. and affiliates<br/>
                      CodeBit, Inc. is a registered trademark. This message was produced and distributed
                      by CodeBit, Inc. or its affiliates.<br/>
                      © ${new Date().getFullYear()}, CodeBit, Inc. or its affiliates. All rights reserved.
                    </p>

                  </div>
                `
              );

              return res.status(200).json({
                success: true,
                message: "If this email is new, you can register.",
                email: userExist.email,
              });
            }

            return res.status(400).json({
              success: false,
              message: "Email already registered",
            });
        }

         const cooldown = await checkOtpCooldown(email);
          if (cooldown > 0) {
            return res.status(429).json({
              success: false,
              message: `Please wait ${cooldown}s before requesting another OTP`,
              retryAfter: cooldown,
            });
          }

        // Hash the password to maintain integrety saftey
        const hashedPassword = await bcrypt.hash(password,10);

        // otp email
        const otp = generateOtp();

        //admin ho ya user usse user ki tarah register karayenge
        // req.body.role = 'user';

        // creating a user  
        
        const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "user",
        isVerified: false,
        emailOtp: await bcrypt.hash(String(otp), 10),
        emailOtpExpires: Date.now() + 10 * 60 * 1000,
        });

        await sendEmail(
  newUser.email,
  "CodeBit Email Verification",
  `Hi ${newUser.name}, your CodeBit verification code is: ${otp}`,
  `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">

      <p>Hello ${newUser.name},</p>

      <p>
        Welcome to CodeBit! We're excited to have you on board. To complete your
        registration and verify your email address, please use the one-time code below.
      </p>

      <p>
        We take the security of your account seriously. Our security team has logged
        this verification request and will monitor your account for any unusual activity.
      </p>

      <p>Your email verification code is:</p>

      <div style="text-align: center; margin: 32px 0;">
        <div style="
          display: inline-block;
          background-color: #f0f9ff;
          border: 2px dashed #0ea5e9;
          border-radius: 12px;
          padding: 20px 48px;
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 12px;
          color: #0ea5e9;
        ">
          ${otp}
        </div>
      </div>

      <p>
        This code is valid for <strong>10 minutes</strong>. For your security, please
        do not share this code with anyone. Our support team will never ask you for
        your password or this code.
      </p>

      <p>
        If you did not create a CodeBit account, please ignore this email. No account
        will be created and your inbox is safe.
      </p>

      <p>
        If you have any questions or concerns in the meantime, please don't hesitate to
        reply to this email. Our support team is available 24/7 to assist you.
      </p>

      <p>
        Happy Coding 💻<br/>
        <strong>CodeBit Support Team</strong>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="font-size: 12px; color: #6b7280; text-align: center;">
        CodeBit, Inc. and affiliates<br/>
        CodeBit, Inc. is a registered trademark. This message was produced and distributed
        by CodeBit, Inc. or its affiliates.<br/>
        © ${new Date().getFullYear()}, CodeBit, Inc. or its affiliates. All rights reserved.
      </p>

    </div>
  `
        );

        return res.status(201).json({
          success: true,
          message: "Registered successfully. OTP sent to your email.",
          email: newUser.email,
          });

        // token creation
      //  const token = jwt.sign(
      //   { _id: newUser._id, email: newUser.email, role: "user" },
      //   process.env.SECRET_KEY,
      //   { expiresIn: "1d" } // 1 day
      //   );

      //   res.cookie("token", token, {
      //   maxAge: 24 * 60 * 60 * 1000, //1 day 
      //   // secure: true,
      //   // sameSite: "none",
      //   httpOnly: true,
      //   sameSite: "none",
      //   secure: true,
      //   path: "/",
      //   // httpOnly: true,
      //   // sameSite: "lax",
      //   // secure: false, // dev only
      //   // path: "/",
      //   });

        // const reply = {
        //     name : newUser.name,
        //     email : newUser.email,
        //     _id : newUser._id,
        //     profileImage: newUser.profileImage
            

        // }

        // res.status(201).json(
        //     {
        //         user : reply,
        //         message : "Registered Suceesfully"
        //     }
        // )


        
 
    }
    catch (err) {
    console.log("Register Error:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Signup failed",
    });
}

}

const verifyEmail = async (req, res) => {
  try{

    // email aur otp nikala body se 
    const {email,otp} = req.body;

    // db me check kia user kahi hai to nhi
    const user = await User.findOne({email});

    // agar user nhi mila db mei
      if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // agar user mila aur verified hai
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    //agar otp nhi aya db 
    if (!user.emailOtp || !user.emailOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    }

    // Expired Otp
    if (Date.now() > user.emailOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // match db otp and req.body otp
      const isMatch = await bcrypt.compare(String(otp), user.emailOtp);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }
    
    // ye sab pass hogya matlab match user verified and remove otp and expire from db

    user.isVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;

    // update db with isVerified
    await user.save();

    // token after verification
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
      // dev
        // sameSite: "lax",
        // secure: false,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  }

  catch(err){
    // console.log("Verification:", err);
    res.status(400).send({
      success: false,
      message: err.message || "Verification failed",
    })
  }
}

const forgetPassword = async(req,res)=>{
  try{
    const {email} = req.body;

    if(!email){
      res.status(400).json({
        success:"false",
        message:"Email is Required"
      })
    }

    const user = await User.findOne({email});
    if(!user){
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a reset link has been sent.",
      });
    }
    if (user.googleId) {
    return res.status(400).json({
      success: false,
      message:
        "This account uses Google Sign-In. Please continue with Google.",
    });
  }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

        const frontendUrl =
      process.env.NODE_ENV === "production"
        ? "https://codebit-dev.vercel.app"
        : "http://localhost:5173";

    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Reset Your CodeBit Password",
      `Reset your password using this link: ${resetUrl}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">

          <p>Hello there,</p>

          <p>
            We received a request to reset the password associated with your CodeBit account.
            If you made this request, please use the link below to proceed with resetting your password.
          </p>

          <p>
            We take the security of your account seriously. Our security team has logged this
            password reset request and will monitor your account for any unusual activity.
          </p>

          <p style="text-align: center; margin: 32px 0;">
            <a
              href="${resetUrl}"
              style="
                background-color: #0ea5e9;
                color: #ffffff;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                display: inline-block;
              "
            >
              Reset Password
            </a>
          </p>

          <p>
            This link is valid for <strong>10 minutes</strong>. For your security, please do not
            share this link with anyone. Our support team will never ask you for your password
            or this link.
          </p>

          <p>
            If you did not request a password reset, please ignore this email. Your password
            will remain unchanged and your account is safe. We recommend keeping an eye on
            your email inbox for any further updates regarding your account status.
          </p>

          <p>
            If you have any questions or concerns in the meantime, please don't hesitate to
            reply to this email. Our support team is available 24/7 to assist you.
          </p>

          <p>
            Best regards,<br/>
            <strong>CodeBit Support Team</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            CodeBit, Inc. and affiliates<br/>
            CodeBit, Inc. is a registered trademark. This message was produced and distributed
            by CodeBit, Inc. or its affiliates.<br/>
            © ${new Date().getFullYear()}, CodeBit, Inc. or its affiliates. All rights reserved.
          </p>

        </div>
      `
    );

    return res.status(200).json({
      success: true,
      token: resetToken, // temporary for testing
    });


  }
  catch(err)
  {
    console.log("Forgot Password Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

const resetPassword = async (req, res) => {
  try {
    // console.log(req.body);
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });

  } catch (error) {
    console.log("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const login = async(req,res)=>{
    
    try {

        const {email , password} = req.body;
        
        if(!email)
            throw new Error("Invalid Credentials");

        if(!password)
            throw new Error("Invalid Credentials");

        const user = await User.findOne({email});
        //password; user ne jo diya user.pass jo db mei rkha h
         if (!user) {
            throw new Error("Invalid Credentials");
        }

        if (user.isBanned) {
          return res.status(403).json({
            success: false,
            message: "Your account has been banned",
          });
        }

        if (!user.password) {
          return res.status(400).json({
            success: false,
            message: "This account was created with Google. Please login with Google.",
          });
        }
        
        const match = await bcrypt.compare(password , user.password);

        if(!match)
            throw new Error("Invalid Credentials");

        if (!user.isVerified) {
          const cooldown = await checkOtpCooldown(user.email);

          if (cooldown > 0) {
            return res.status(429).json({
              success: false,
              isVerified: false,
              email: user.email,
              message: `Please wait ${cooldown}s before requesting another OTP`,
              retryAfter: cooldown,
            });
          }

          const otp = generateOtp();

          user.emailOtp = await bcrypt.hash(String(otp), 10);
          user.emailOtpExpires = Date.now() + 10 * 60 * 1000;

          await user.save();

          await sendEmail(
            user.email,
            "CodeBit Email Verification",
            `Hi ${user.name}, your CodeBit verification code is: ${otp}`,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">

                <p>Hello ${user.name},</p>

                <p>
                  Welcome back to CodeBit! It looks like your email address hasn't been verified yet.
                  Please use the one-time code below to verify your email and continue to your account.
                </p>

                <p>
                  We take the security of your account seriously. Our security team has logged
                  this verification request and will monitor your account for any unusual activity.
                </p>

                <p>Your email verification code is:</p>

                <div style="text-align: center; margin: 32px 0;">
                  <div style="
                    display: inline-block;
                    background-color: #f0f9ff;
                    border: 2px dashed #0ea5e9;
                    border-radius: 12px;
                    padding: 20px 48px;
                    font-size: 36px;
                    font-weight: bold;
                    letter-spacing: 12px;
                    color: #0ea5e9;
                  ">
                    ${otp}
                  </div>
                </div>

                <p>
                  This code is valid for <strong>10 minutes</strong>. For your security, please
                  do not share this code with anyone. Our support team will never ask you for
                  your password or this code.
                </p>

                <p>
                  If you did not attempt to log in to CodeBit, please ignore this email. Your
                  account will remain unchanged and your inbox is safe.
                </p>

                <p>
                  If you have any questions or concerns in the meantime, please don't hesitate to
                  reply to this email. Our support team is available 24/7 to assist you.
                </p>

                <p>
                  Happy Coding 💻<br/>
                  <strong>CodeBit Support Team</strong>
                </p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

                <p style="font-size: 12px; color: #6b7280; text-align: center;">
                  CodeBit, Inc. and affiliates<br/>
                  CodeBit, Inc. is a registered trademark. This message was produced and distributed
                  by CodeBit, Inc. or its affiliates.<br/>
                  © ${new Date().getFullYear()}, CodeBit, Inc. or its affiliates. All rights reserved.
                </p>

              </div>
            `
          );

          return res.status(403).json({
            success: false,
            isVerified: false,
            email: user.email,
            message: "Email not verified. New OTP sent.",
          });
        }

        //token creation
        // const token = jwt.sign({ _id: user._id, email: user.email , role:user.role} ,process.env.SECRET_KEY, {expiresIn:60*60});
        // res.cookie("token",token,{maxAge: 60*60*1000, httpOnly:true , sameSite: "lax", secure: false,     // REQUIRED (dev only)
        // path: "/" });
         const token = jwt.sign(
        { _id: user._id, email: user.email, role: user.role },
        process.env.SECRET_KEY,
        { expiresIn: "1d" } // 1 day
        );

        res.cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000, //1 day 
        httpOnly: true,
        sameSite: "none", // pro
        secure: true,
        // sameSite: "lax",
        // secure: false, // dev only
        path: "/",
        });


        const reply = {
            name : user.name,
            email : user.email,
            _id : user._id,
            role: user.role,
            profileImage: user.profileImage,

        }

        res.status(201).json(
            {
                user : reply,
                message : "Logged in Suceesfully"
            }
        );

        

    }
    catch(err)
    {
    console.error("Login Error",err);
    res.status(401).json({
      success: false,
      message: err.message
    });
    }
}

// const logout = async (req,res)=>{
   
//     try{
//         // valid token hai ya nhi (validate) = user middleware krega
        
//         const {token} = req.cookies;  // token nikala
//         const payload = jwt.decode(token); // payload nikala 

//         // add token to redis block list 
//         // redis db mei token dala with key value pair
//         await redisClient.set(`token:${token}`,'Blocked');
//         // redis ke ander kab expire hoga token
//         await redisClient.expireAt(`token:${token}`,payload.exp);

//         // cookies clear krdo   
//         res.cookie("token", null, {
//           expires: new Date(Date.now()),
//         });
//         res.send("Logged Out Successfully");
//     }
    
//     catch(err){
//       res.status(400).json({
//       success: false,
//       message: err.message
//     });
//     }
// }

// Vercel

const logout = async (req, res) => {
  try {
    const { token } = req.cookies;

    if (token) {
      const payload = jwt.decode(token);

    if (!redisClient.isOpen) {
      await connectRedis();
    }

      if (payload?.exp) {
        await redisClient.set(`token:${token}`, "Blocked");
        await redisClient.expireAt(`token:${token}`, payload.exp);
      }
    }

    // clear production cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    // clear old local/dev cookie if it exists
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logged Out Successfully",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};


const adminRegister = async(req,res)=>{
    try {

        validate(req.body); // check formats of all required fields *
        const {name , email , password} = req.body; // They Are Mandatory Fields which must be present

        // Hash the password to maintain integrety saftey
        req.body.password = await bcrypt.hash(password,10);

        //admin ho ya user usse user ki tarah register karayenge
        // req.body.role = 'admin'; this is hardcode method // now he can create admin as well as user

        // creating a user  
        const newUser = await User.create(req.body); 

        // token creation                                                  // role:'admin  
        const token = jwt.sign({ _id: newUser._id, email: newUser.email , role:newUser.role} ,process.env.SECRET_KEY, {expiresIn:60*60});
        res.cookie("token",token,{maxAge: 60*60*1000, httpOnly:true , secure: true,sameSite: "none" , path:"/"});
        res.status(201).send("User Registered Succesfully");
        
 
    }
    catch(err)
    {
    res.status(400).json({
      success: false,
      message: err.message
    });
    }

}

const deleteProfile =  async(req,res)=>{
    try{

        const userId = req.result._id;

        // deleted from userSchema
        await User.findByIdAndDelete(userId);

        //deleted from submissionSchem(uske dwara solved kri gayi problems)
        await Submission.deleteMany({userId});

        return res.status(200).json({
        success: true,
        message: "Profile deleted successfully",
      });

    }
    catch(err){
    res.status(500).json({
      success: false,
      message: err.message
    });
    }
}

const getProfile = async (req, res) => {
  try {
    const userId = req.result._id;

    // 1. Get user + solved problems
      const user = await User.findById(userId)
        .select("-password")
        .populate({
            path: "problemSolved",
            select: "title description difficultyLevel category"
        });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    

    // 2. Total solved
    const totalSolved = user.problemSolved.length;

    // 3. Difficulty count
    let easy = 0, medium = 0, hard = 0;

    user.problemSolved.forEach((p) => {
      if (p.difficultyLevel === "easy") easy++;
      else if (p.difficultyLevel === "medium") medium++;
      else if (p.difficultyLevel === "hard") hard++;
    });

    const codebitScore = easy * 1 +medium * 3 + hard * 5;
    // 4. Category count
    const categoryStats = {};

    user.problemSolved.forEach((p) => {
      categoryStats[p.category] =
        (categoryStats[p.category] || 0) + 1;
    });

    // 5. Submission stats
    const submissions = await Submission.find({ userId });

    const totalSubmissions = submissions.length;

    const acceptedSubmissions = submissions.filter(
      (s) => s.status === "accepted"
    ).length;

    const acceptanceRate =
      totalSubmissions === 0
        ? 0
        : ((acceptedSubmissions / totalSubmissions) * 100).toFixed(2);

    // 6. Most used language
    const langCount = {};

    submissions.forEach((s) => {
      if (s.status === "accepted") {
        langCount[s.language] =
          (langCount[s.language] || 0) + 1;
      }
    });

    let mostUsedLanguage = null;
    let max = 0;

    for (let lang in langCount) {
      if (langCount[lang] > max) {
        max = langCount[lang];
        mostUsedLanguage = lang;
      }
    }



    // console.log("PROFILE USER:", req.result);

    // Final response
    res.status(200).json({
      success: true,
      profile: {
        user,
        stats: {
          totalSolved,
          easy,
          medium,
          hard,
          codebitScore,
          totalSubmissions,
          acceptedSubmissions,
          acceptanceRate,
          mostUsedLanguage,
        },
        categoryStats,
      },
    });

  } catch (err) {
    console.error("Profile Error", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const editProfile = async(req,res)=>{
  try{
    const {name,profileImage,bio,github,linkedin} = req.body;

    const id = req.result._id;
    const user = await User.findById(id);

    if(!user){
      return res.status(404).json({
        success: false,
        message: "User not found",
    })
    }

    if (name !== undefined) 
      user.name = name;

    if (bio !== undefined) 
      user.bio = bio;

    if (github !== undefined) 
      user.github = github;

    if (linkedin !== undefined) 
      user.linkedin = linkedin;

    if (profileImage !== undefined)
      user.profileImage = profileImage;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        name: user.name, 
        bio: user.bio,
        github: user.github,
        linkedin: user.linkedin,
        profileImage: user.profileImage,
      },
    });
  }
  catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
}
}

const generateProfileImageSignature = async(req,res)=>{
try {
    const userId = req.result._id;

    const timestamp = Math.round(new Date().getTime()/1000);

    //unique id
    const publicId = `codebit-profile/${userId}/_${timestamp}`;

    // paramaters jinke basis pr digital sign banega
    // dig sign = upload param ka hash nikala then usko encrypt kia using private key
    const uploadParams = {
      timestamp,
      public_id: publicId,
    };


    // generate signature (on basis of timestamp public id and secret apikey)
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      signature,
      timestamp,
      public_id: publicId,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed To Generate Profile Image Credentials",
    });
  }
}

const saveProfileImageMetaData = async (req, res) => {
  try {
    const { cloudinaryPublicId } = req.body;
    const userId = req.result._id;

    if (!cloudinaryPublicId) {
      return res.status(400).json({
        success: false,
        message: "Cloudinary public id is required",
      });
    }

    const cloudinaryResource = await cloudinary.api.resource(
      cloudinaryPublicId,
      {
        resource_type: "image",
      }
    );

    if (!cloudinaryResource) {
      return res.status(400).json({
        success: false,
        message: "Image is not uploaded on Cloudinary",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        profileImage: cloudinaryResource.secure_url,
        profileImagePublicId: cloudinaryResource.public_id,
      },
      { new: true }
    ).select(
      "name email role profileImage profileImagePublicId bio github linkedin createdAt"
    );

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      user,
    });
  } 
  catch (error) {
    console.error("SAVE PROFILE IMAGE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed To Save Profile Image Metadata",
      details: error.message,
    });
  }
};

const removeProfileImage = async (req, res) => {
  try {
    const userId = req.result._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // optional cloudinary delete
     if (user.profileImagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.profileImagePublicId);
      } catch (cloudErr) {
        console.log("Cloudinary image delete failed:", cloudErr.message);
      }
    }

    user.profileImage = "";
    user.profileImagePublicId = "";

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile image removed successfully",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



module.exports = {register,verifyEmail,forgetPassword,resetPassword,login,logout,adminRegister,deleteProfile,getProfile,editProfile,saveProfileImageMetaData,generateProfileImageSignature,removeProfileImage};