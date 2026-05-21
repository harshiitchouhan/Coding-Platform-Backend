const User = require("../Models/user");
const bcrypt = require("bcrypt");
const validate = require("../Utils/validate");
const jwt = require("jsonwebtoken");
const { redisClient } = require("../config/redis");
const Submission = require("../Models/submission");
const Problem = require("../Models/problems")
const cloudinary = require("cloudinary").v2;

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
        return res.status(400).json({
            success: false,
            message: "Email already registered",
        });
        }
        // Hash the password to maintain integrety saftey
        const hashedPassword = await bcrypt.hash(password,10);

        //admin ho ya user usse user ki tarah register karayenge
        // req.body.role = 'user';

        // creating a user  
        
        const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "user"
        });

        // token creation
       const token = jwt.sign(
        { _id: newUser._id, email: newUser.email, role: "user" },
        process.env.SECRET_KEY,
        { expiresIn: "1d" } // 1 day
        );

        res.cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000, //1 day 
        // secure: true,
        // sameSite: "none",
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/",
        // httpOnly: true,
        // sameSite: "lax",
        // secure: false, // dev only
        // path: "/",
        });

        const reply = {
            name : newUser.name,
            email : newUser.email,
            _id : newUser._id,
            profileImage: newUser.profileImage

        }

        res.status(201).json(
            {
                user : reply,
                message : "Registered Suceesfully"
            }
        )
        
 
    }
    catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Signup failed",
    });
}

}

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

        //token creation
        // const token = jwt.sign({ _id: user._id, email: user.email , role:user.role} ,process.env.SECRET_KEY, {expiresIn:60*60});
        // res.cookie("token",token,{maxAge: 60*60*1000, httpOnly:true , sameSite: "lax", secure: false,     // 🔥 REQUIRED (dev only)
        // path: "/" });
         const token = jwt.sign(
        { _id: user._id, email: user.email, role: user.role },
        process.env.SECRET_KEY,
        { expiresIn: "1d" } // 1 day
        );

        res.cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000, //1 day 
        // secure: true,
        // sameSite: "none",
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/",
        // sameSite: "lax",
        // secure: false, // dev only
        // path: "/",
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



module.exports = {register,login,logout,adminRegister,deleteProfile,getProfile,editProfile,saveProfileImageMetaData,generateProfileImageSignature,removeProfileImage};