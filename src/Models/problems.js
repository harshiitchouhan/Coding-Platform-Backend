//schema for creating dsa problem
const mongoose = require("mongoose");
const {Schema} = mongoose;

const problemSchema = new Schema({
    title:{
        type:String,
        required:true

    },

    description:{
        type:String,
        required:true
    },

    difficultyLevel:{
        type:String,
        enum:["easy", "medium", "hard"],
        required:true

    },

    category:{
        type:String,
        enum:["array" ,"linkedList" ,"graph" ,"dp" ,"string" , "tree", "math","stack" ,"queue","matrix" , "recursion" , "greedy" , "binary-search" , "hashing" ],
        required:true
    },

    inputFields: {
        type: [String],
        default: []
    },

    constraints: {
        type: String,
        default: ""
        },

    companies: [
        {
            type: String
        }
        ],
    
    hints: [
        {
            type: String
        }
    ],

    visibleTestCases:[
        {
            input:{
                type:String,
                required:true
            },
            output:{
                type:String,
                required:true
            },
            explanation:{
                type:String,
                required:true
            }
        }
    ],

    hiddenTestCases:[
        {
            input:{
                type:String,
                required:true
            },
            output:{
                type:String,
                required:true
            }
        }
    ],

    startCode:[
        {
            language:{
                type:String,
                required:true
            },
            boilerCode:{
                type:String,
                required:true
            }
        }
    ],

    refSolution:[       // actual solution(jo maine likh h shyd ye h wo)
        {
            language:{  // c++,java
                type:String,
                required:true
            },
            completeCode:{ //correct code
                type:String,
                required:true
            }
        }
    ],

    // to have functions shown to user so that they only complete function
    functionSignature: {
        cpp: {
            type: String,
            required: true
        },
        javascript: {
            type: String,
            required: true
        },
        java: {
            type: String,
            required: true
        }
        },

    
    functionName: {
        type: String,
        required: true
    },


    problemCreator:{
        type:Schema.Types.ObjectId,
        ref:'user',
        required:true
    }


}, {timestamps:true})

const Problem =  mongoose.model("problem" , problemSchema);
module.exports = Problem;

