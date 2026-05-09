const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const User = require("../Models/user");

const adminMiddleware = async(req,res,next)=>{
    try{

        const {token} = req.cookies;
        if(!token){
            throw new Error("Token Doesn't Exist")
        }

        //header+payload ie payload is the one on which token is created
        const payload = jwt.verify(token,process.env.SECRET_KEY);
        const {_id} = payload;

        //if id is null undef etc
        if(!_id){
            throw new Error("id is Not Present / Invalid Token");
        } 

        //finding in db
        const result = await User.findById(_id);

        //check if it is admin or not
        if(payload.role!='admin')
            throw new Error ("Invalid Token");

        if(!result)
            throw new Error("User Doesn't Exist");


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

module.exports = adminMiddleware;