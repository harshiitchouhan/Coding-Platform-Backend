const mongoose = require("mongoose");
const { Schema } = mongoose;

// our existing Submission model will still do the main work: batch banana judge 0 se run krwana etc etc
// ContestSubmission will only store contest ranking info
const contestSubmissionSchema = new Schema(
  {
    contestId: {
      type: Schema.Types.ObjectId,
      ref: "contest",
      required: true,
    },

    submissionId: {
    type: Schema.Types.ObjectId,
    ref: "submission",
    required: true,
    },

    problemId: {
      type: Schema.Types.ObjectId,
      ref: "problem",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    status: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      required: true,
    },

    code: {
      type: String,
      required: true,
    },

    points: {
      type: Number,
      default: 0,
    },

    penalty: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);


const ContestSubmission =  mongoose.model("contestSubmission" , contestSubmissionSchema);
module.exports = ContestSubmission;