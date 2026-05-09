const Problem = require("../Models/problems");
const Submission = require("../Models/submission")
const User = require("../Models/user");
const {getLanguageById , submitBatch , submitToken} = require("../Utils/problemUtil")
const wrapCode = require("../Utils/wrapCode")
const VideoSolution = require("../Models/videoSolution")

const createProblem = async (req,res)=>{
   
const {title,description,difficultyLevel,category,
  visibleTestCases,hiddenTestCases,startCode,refSolution,inputFields,functionSignature,functionName} = req.body;
        
            // VALIDATE FUNCTION SIGNATURE 
                if (
                    !functionSignature ||
                    !functionSignature.cpp ||
                    !functionSignature.javascript ||
                    !functionSignature.java
                ) {
                    return res.status(400).send("Function signature missing for all languages");
                }

    
// console.log("BODY RECEIVED:", req.body);
// console.log("REF SOLUTION:", req.body.refSolution);
// console.log("VISIBLE TEST CASES:", req.body.visibleTestCases);

    try{

        const statusMap = {    // they are prebuilt status code in judge0
                3: "Accepted",
                4: "Wrong Answer",
                5: "TLE",
                6: "Compilation Error",
                7: "RTE",
                8: "RTE",
                9: "RTE",
                10: "RTE",
                11: "RTE",
                12: "RTE",
                13: "Internal Error",
                14: "Exec Error"
            }

        for(const {language,completeCode} of refSolution){

            // src code (actual code)
            //lang id : c++(52)
            // stdin : input
            //expexted output : output

            const languageID = getLanguageById(language);
     
            // flow: batch create krenge then response mei token milega
            // iss token ko again judge0 ko denge to verify status_code if it is 3
            // our code is accepted

            //creating a submission batch(firsttestcase+code , secondtestcase+code)
            // console.log("refSolution:", refSolution);
            // console.log("visibleTestCases:", visibleTestCases);

            // console.log("hihdsadhdsjhs")
            const submission = visibleTestCases.map((testcase) => ({
                source_code: Buffer.from(
                    wrapCode(completeCode, language)
                ).toString("base64"),

                language_id: languageID,

                stdin: Buffer.from(testcase.input || "").toString("base64"),

                expected_output: Buffer.from(testcase.output || "").toString("base64"),
            }));
            


            // console.log("hehhhehee")
            const submitResult = await submitBatch(submission);

            //submitResult ke pass tokens hai
            const resultToken = submitResult.map((value) => value.token);
            // [token1 , token2 , token3]
            

            //submiting token to judge0
            const testResult = await submitToken(resultToken);
            // console.log(testResult);
            // console.log("TOKENS:", resultToken);
            // console.log("TEST RESULT:", testResult);
            // console.log("hehe2hehe2");
            let failed = null;

            for (const test of testResult) {
                if (test.status_id !== 3) {
                    failed = test;
                    break;
                }
            }
        
        // console.log("heheheh3")
        // console.log(failed);

            if (failed) {
                return res.status(400).json({
                    success: false,
                    message: statusMap[failed.status_id]
                });
            }

    }

    // after for loop works all the task
    // now store in db
    // console.log("dbhogya")
    
    const savedProblem = await Problem.create({
        ...req.body,
        problemCreator: req.result._id,  // result brings details of the user(userMidlleware wala result)
        constraints: req.body.constraints || "",
        companies: req.body.companies || [],
        hints: req.body.hints || [],
        inputFields: req.body.inputFields || [],
    })

    // console.log("DB SAVED:", savedProblem);
    res.status(201).send("Problem Created Succesfully")
    // console.log(req.body);

}
    catch(err){
        console.log("DB ERROR:", err);
        res.send("Error : " + err);
    }
}

const updateProblem = async(req,res)=>{
    const {id}  = req.params;
    const {title,description,difficultyLevel,category,
        visibleTestCases,hiddenTestCases,startCode,refSolution,inputFields,functionSignature,functionName} = req.body;

    try{

        const statusMap = {    // they are prebuilt status code in judge0
                3: "Accepted",
                4: "Wrong Answer",
                5: "TLE",
                6: "Compilation Error",
                7: "RTE",
                8: "RTE",
                9: "RTE",
                10: "RTE",
                11: "RTE",
                12: "RTE",
                13: "Internal Error",
                14: "Exec Error"
            }

        if(!id){
           return res.status(400).send("Id is Missing");
        }

        const ID = await Problem.findById(id);
        if(!ID){
            res.status(404).send("ID is Not Present In Server");
        }
        

        for(const {language,completeCode} of refSolution){

            // src code (actual code)
            //lang id : c++(52)
            // stdin : input
            //expexted output : output

            const languageID = getLanguageById(language);
     
            // flow: batch create krenge then response mei token milega
            // iss token ko again judge0 ko denge to verify status_code if it is 3
            // our code is accepted

            //creating a submission batch(firsttestcase+code , secondtestcase+code)
            const submission = visibleTestCases.map((testcase) => ({
                    source_code: Buffer.from(wrapCode(completeCode, language)).toString("base64"),
                    language_id: languageID,
                    stdin: Buffer.from(testcase.input || "").toString("base64"),
                    expected_output: Buffer.from(testcase.output || "").toString("base64"),
                    }));

            const submitResult = await submitBatch(submission);

            //submitResult ke pass tokens ka array hai
            const resultToken = submitResult.map((value)=>value.token);
            // [token1 , token2 , token3]

            //submiting token to judge0
            const testResult = await submitToken(resultToken);
            
            for(const test of testResult){
                if(test.status_id!=3){
                    return res.status(400).send(statusMap[test.status_id] || "Error Occured");
                }
            }

    }

    // after for loop works all the task
    // now store in db
    
    //update all field           konsi id, update , validator true(type:sting etc) , return new document after update
    const updatedProblem = await Problem.findByIdAndUpdate(id ,
        {
        ...req.body,constraints: req.body.constraints || "",
        companies: req.body.companies || [],
        hints: req.body.hints || [],
        inputFields: req.body.inputFields || []
    } , 
    {runValidators:true , new:true});

    res.status(201).send(updatedProblem);
    // console.log(req.body);

}
    catch(err){
        res.send("Error :" + err);
    }
}

const deleteProblem = async(req,res)=>{
    const {id} = req.params;

    try{
        if(!id){
           return res.status(400).send("Id is Missing");
        }
        
        const deletedProblem = await Problem.findByIdAndDelete(id);
        if(!deletedProblem){
            return res.status(400).send("Problem is Missing");
        }
        res.status(200).send("Successfully Deleted")
    }
    catch(err){
        res.status(500).send("Error "+err);
    }

}

const fetchProblemByID = async(req,res)=>{

    const {id} = req.params;

    try{

        if(!id){
        return res.status(400).send("Incorrect Id ");
    }

        // const data = await Problem.findById(id).select('_id title description difficultyLevel category visibleTestCases functionSignature startCode functionName refSolution' );
        const data = await Problem.findById(id).select(
        '_id title description difficultyLevel category visibleTestCases functionSignature startCode functionName refSolution inputFields constraints companies hints'
        );

        if(!data)
            return res.status(400).send("Id is not present");

        // console.log("FETCHED DATA:", data);
        // console.log("INPUT FIELDS FROM BACKEND:", data.inputFields);
        // video ka url wagera 

        const videos = await VideoSolution.findOne({problemId:id});
        if(videos)
        {

            const responseData = {
                ...data.toObject(),
                problemId : videos.problemId,
                // data.cloudinaryPublicId = videos.cloudinaryPublicId,
                secureURL : videos.secureURL,
                thumbnailURL : videos.thumbnailURL,
                duration : videos.duration,
                editorial : videos.editorial
            }
            

            return res.status(200).send(responseData);

        }

        return res.status(200).send(data);

    }
    catch(err){
        res.status(500).send("Error "+err);
    }

}

const fetchAllProblem = async(req,res)=>{

    try{

        const data = await Problem.find({}).select('_id title difficultyLevel category ');
        if(data.length==0)
            return res.status(400).send("Id is not present");


        res.status(200).send(data);
    }
    catch(err){
        res.status(500).send("Error "+err);
    }


}

const solvedProblemByUser = async(req,res)=>{
    try{
        // result ke ander user ka poora document hoga (usermiddleware)
        // const count = req.result.problemSolved.length;  // count bhej kr kya krunga 

        const userId = req.result._id;
        const user = await User.findById(userId).populate({
            path: 'problemSolved',
            select:"_id title description difficultyLevel"
    })
        res.status(200).send(user.problemSolved);
    }
    catch(err){
        res.status(500).send("Error "+err);
    }

}

const submittedProblem = async(req,res)=>{
    try{
        const userId = req.result._id;
        const problemId  = req.params.pid;

        const submission = await Submission.find({userId,problemId});

        if(submission.length==0){
           return res.status(200).send([]);
        }

        return res.status(200).send(submission);
    }
    catch(err){
         return res.status(500).send("Error "+err);
    }
}



module.exports = {createProblem,updateProblem,deleteProblem,fetchProblemByID,fetchAllProblem,solvedProblemByUser,submittedProblem};