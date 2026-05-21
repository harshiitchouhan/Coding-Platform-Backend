const jwt = require("jsonwebtoken");
const { redisClient } = require("../config/redis");
const User = require("../Models/user");

const userMiddleware = async(req,res,next)=>{
    try{

        console.log("ORIGIN:", req.headers.origin);
    console.log("COOKIES:", req.cookies);
    console.log("TOKEN:", req.cookies?.token);

        // token nikala req. cookies se
        const {token} = req.cookies;
        // token nhi mila
        if(!token){
            throw new Error("Token Doesn't Exist")
        }

        // header+payload hota hai jwt.verify payload return krta h
        const payload = jwt.verify(token,process.env.SECRET_KEY);
        //payload se id nikal di (id and email humne dala tha payload mei)
        const {_id} = payload;

        if(!_id){
            throw new Error("id is Not Present / Invalid Token");
        }

        // find kra user ko uss id se
        const result = await User.findById(_id);

        if(!result)
            throw new Error("User Doesn't Exist");

        if (result.isBanned) {
        return res.status(403).json({
            success: false,
            message: "Your account has been banned",
        });
        }

//         if (user.isBanned) {
//         return res.status(403).json({
//             success: false,
//             message: "Your account has been banned",
//         });
// }

        // while logging out usko block list mei dala taaki koi jwt token save bhi kra ho to login na krpaye // check logout feature
        const isBlocked = await redisClient.exists(`token:${token}`);

        if(isBlocked)
            throw new Error("Invalid Token");

        req.result = result;

        next();


    }
    catch(err){
        res.status(401).send("Error "+ err)
    }
}

module.exports = userMiddleware;