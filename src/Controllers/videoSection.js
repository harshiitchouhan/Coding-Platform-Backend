const cloudinary = require('cloudinary').v2
const Problem = require("../Models/problems");
const VideoSolution = require("../Models/videoSolution");

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const generateUploadSignature = async(req,res)=>{
    try{

        const {problemId} = req.params;
        const userId = req.result._id;  // admin middleware se 
        //verify user == already done in admin middleware
        //verify problem exist
        const problem = await Problem.findById(problemId);
        if(!problem){
            return res.status(404).json({error:"Problem Doesn't Exist"})
        }

        // generate unique public_id for video

        const timestamp = Math.round(new Date().getTime()/1000);  // current time in seconds
        const publicId = `codebit-solutions/${problemId}/${userId}/_${timestamp}`; // generate unique public id 

        // paramaters jinke basis pr digital sign banega
        // dig sign = upload param ka hash nikala then usko encrypt kia using private key
        const uploadParams  = {
            timestamp: timestamp,
            public_id: publicId

        }

        // generate signature (on basis of timestamp public id and secret apikey)
        const signature = cloudinary.utils.api_sign_request(
            uploadParams,
            process.env.CLOUDINARY_API_SECRET
        
        );

        // send paramaters to frontend to match the signature
        // inhi param se pata chalega signature sahi h ya nhi
        res.json({
            signature,
            timestamp,
            public_id:publicId,
            api_key : process.env.CLOUDINARY_API_KEY,
            cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
            upload_url : `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`

        })

    }
    catch(err){
        console.error('Error:', err)
        res.status(500).json({error:"Failed To Generate Credentials"});

    }
}

const saveVideoMetaData = async(req,res)=>{
    try{
        const {problemId , cloudinaryPublicId , secureURL , duration , editorial} = req.body;
        const userId = req.result._id;  // admin middleware se 

        //backend verify the upload with cloudinary 
        // console.log("BODY:", req.body);
        // console.log("cloudinaryPublicId:", cloudinaryPublicId);
        const cloudinaryResource = await cloudinary.api.resource(
            cloudinaryPublicId,
            {
                resource_type: "video",
            }
        );

        if(!cloudinaryResource){
            return res.status(400).json({error:"Video Is Not Uploaded On Cloudinary"})
        }

        // check kro kahi pehle se ye video db mei store hai ya nhi
        const existingVideo = await VideoSolution.findOne({
            problemId,
            userId,
            cloudinaryPublicId
        });

        if(existingVideo){
            return res.status(409).json({error:'Video already Exists'})
        }

        const thumbnailUrl = cloudinary.url(cloudinaryResource.public_id, {
            resource_type: "video",
                format: "jpg",
                transformation: [
                    { start_offset: "1" },   // video ke 1 sec pr jo frame hai use image mei convert kro and use it as thumbnail
                    { width: 400, height: 250, crop: "fill" },
                    { quality: "auto" },
                ],
            });

        const vidSol = new VideoSolution({
            problemId,
            userId,
            cloudinaryPublicId:cloudinaryResource.public_id,
            secureURL:cloudinaryResource.secure_url ,
            duration:cloudinaryResource.duration || duration,
            thumbnailURL: thumbnailUrl,
            editorial

        })

        await vidSol.save();

        res.status(201).json({
            message:"Video Solution Saved Succesfully",
            vidSol: {
                id: vidSol._id,
                thumbnailURL: vidSol.thumbnailURL,
                duration: vidSol.duration,
                uploadedAt: vidSol.createdAt,
            },
        })

    }
    catch(error){
    console.error("SAVE VIDEO ERROR:", error);
    res.status(500).json({
        error: "Failed To Save Video Metadata",
        details: error.message
    });
    }
}


// Cloudinary uses CDN cache
// Cloudinary storage = original file
// CDN cache = copied file near users for fast loading

// Cloudinary removes it from main storage 
// But CDN may still have cached copy for some time.

// So old URL may still work temporarily.
// "Cloudinary, also clear CDN cached copies of this file." {invalidate True};

const deleteVideo = async (req, res) => {
  try {
    const { problemId } = req.params;

    // 1. Find video first
    const video = await VideoSolution.findOne({ problemId });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "No video uploaded for this problem yet.",
      });
    }

    // 2. Delete from Cloudinary
    const cloudinaryRes = await cloudinary.uploader.destroy(
      video.cloudinaryPublicId,
      {
        resource_type: "video",
        invalidate: true,
      }
    );

    if (cloudinaryRes.result !== "ok" && cloudinaryRes.result !== "not found") {
      return res.status(500).json({
        success: false,
        message: "Failed to delete video from Cloudinary",
      });
    }

    // 3. Delete from MongoDB
    await VideoSolution.findByIdAndDelete(video._id);

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Video Cannot Delete", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete video",
    });
  }
};

module.exports = {generateUploadSignature,saveVideoMetaData,deleteVideo};