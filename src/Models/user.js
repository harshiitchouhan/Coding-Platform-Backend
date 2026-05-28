const mongoose = require("mongoose");
const {Schema} = mongoose;

const userSchema = new Schema({
    name : {
        type : String,
        required : true,
        minLength : 3,
        maxLength : 20
    },

    LastName: {
        type : String,
        maxLength : 15
    },

    email:{
        type : String,
        required : true,
        unique :  true,
        trim : true ,
        lowercase : true,
        immutable:true
    },
    
    age:{
        type : Number,
        min:14,
        max:80,
    },

    profileImage: {
        type: String,
        default: "",
        },

    profileImagePublicId: {
        type: String,
        default: "",
    },

    bio: {
        type: String,
        default: "",
        },

    github: {
        type: String,
        default: "",
        },

    linkedin: {
        type: String,
        default: "",
        },

    googleId: {
      type: String,
      default: null,
    },

    password: {
      type: String,

      // required only for normal signup
      required: function () {
        return !this.googleId;
      },
    },

    isVerified:{
        type:Boolean,
        default:false
    },

    emailOtp: {
        type: String,
    },

    emailOtpExpires: {
        type: Date,
    },
    
    role:{
        type:String,
        enum : ["user", "admin"],
        default:"user"

    },
    isBanned: {
        type: Boolean,
        default: false,
    },

    problemSolved:{   // might store ids of problem solved by user in an array 
        type : [{
            type : Schema.Types.ObjectId,
            ref : "problem",
            // unique:true

        }]
          // ek problem ko ek baar hi solved mark kiya jayega

    },

},{ timestamps: true });

    const User = mongoose.model("user",userSchema);
    module.exports = User;