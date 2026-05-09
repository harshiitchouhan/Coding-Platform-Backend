const mongoose = require("mongoose");
const {Schema} = mongoose;


// Frontend → Backend gets signed upload data → Frontend uploads video to Cloudinary → 
// Frontend sends video URL(metadata) to backend → Backend saves URL in DB
const videoSchema = new Schema({

    problemId:{
        type:Schema.Types.ObjectId,
        ref: 'problem',
        required:true
    },

    userId:{
        type:Schema.Types.ObjectId,
        ref: 'user',
        required:true        
    },

    cloudinaryPublicId:{
        type:String,
        required:true
    },

    secureURL:{          // https wala link clounariy url http wala hota h
        type:String,
        required:true
    },

    thumbnailURL:{
        type:String,
        required:true
    },

    duration:{
        type:Number,
        required:true
    },
    editorial: {
      approach: String,        // explanation of idea
      algorithm: String,       // step-by-step logic
      timeComplexity: String,  // O(n)
      spaceComplexity: String, // O(n)
      intuition: String,       // thinking process
    },


}, {timestamps:true})


const VideoSolution = mongoose.model("videoSolution",videoSchema);
module.exports = VideoSolution;