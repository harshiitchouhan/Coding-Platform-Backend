const mongoose = require("mongoose");
const {Schema} = mongoose;

const submissionSchema = new Schema({
 
    problemId:{       // konsi problem no hai   
        type: Schema.Types.ObjectId,
        ref: "problem",   // small letter
        required:true
    },

    userId:{         // konse user ne solve ki h
        type: Schema.Types.ObjectId,
        ref: "user", // small letter
        required:true
    },
    
    code:{
        type:String,
        required:true
    },

    language:{
        type:String,
        enum: ["cpp","javascript","java"],
        required:true
        
    },

    status:{
        type:String,
        enum:["pending" , "accepted" , "wrong answer" , "error"],
        default:"pending"
    },

    runtime:{    // in ms milisecond
        type:Number,
        default:0
    },

    memory:{    // in kb
        type:Number,
        default:0
    },

    errorMsg:{
        type:String,
        default:" "
    },

    testCasesPassed:{
        type:Number,
        default:0
    },
    
    testCasesTotal:{
        type:Number,
        default:0
    }

} , {timestamps:true});

submissionSchema.index({userId:1,problemId:1});

const Submission = mongoose.model("submission",submissionSchema);
module.exports = Submission;
