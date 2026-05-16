const mongoose = require("mongoose");
const {Schema} = mongoose;

const contestSchema = new Schema({
    title:{
        type:String,
        required:true

    },

    description:{
        type:String,
        required:true
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    problems: [
      {
        problem: {
          type: Schema.Types.ObjectId,
          ref: "problem",
          required: true,
        },

        points: {
          type: Number,
          default: 100,
        },

        order: {
          type: Number,
          default: 1,
        },
      },
    ],

    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },



},{timestamps:true});


const Contest = mongoose.model("contest",contestSchema);
module.exports = Contest