const redisClient = require("../config/redis");

const submitLimiter = async(req,res,next)=>{
    const userId = req.result._id;
    const redisKey = `submit_cooldown:${userId}`;

    try{
        // const exist = await redisClient.exists(redisKey);
        // if(exist){
        //     return res.status(429).send("Wait For 10 seconds before submitting again!")
        // }

        //set Cooldown Period
        const result = await redisClient.set(redisKey , "cooldown_active",{
            EX:10,  // expire in 10 sec
            NX:true // only set if it not exist
        })

         if (result === null) {
            const ttl = await redisClient.ttl(redisKey);

            // console.log("rukja")
            return res.status(429).json({
                success: false,
                message: "Wait before submitting again",
                retryAfter: ttl
            });
        }

        next();

    }
    catch(err){
    
    return res.status(500).send("Rate limiter error: " + err.message);
}

}
module.exports = submitLimiter;