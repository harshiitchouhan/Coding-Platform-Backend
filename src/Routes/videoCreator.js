const express = require("express");
const videoRouter = express.Router();
const adminMiddleware = require("../Middleware/adminMiddleware");
const {generateUploadSignature,saveVideoMetaData,deleteVideo} = require("../Controllers/videoSection")

videoRouter.get("/create/:problemId",adminMiddleware,generateUploadSignature);
videoRouter.post("/save",adminMiddleware,saveVideoMetaData);
videoRouter.delete("/delete/:problemId",adminMiddleware,deleteVideo);





module.exports = videoRouter;