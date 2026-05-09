const Submission = require("../Models/submission");
const Problem = require("../Models/problems");
const {getLanguageById , submitBatch , submitToken} = require("../Utils/problemUtil")
const wrapCode = require("../Utils/wrapCode");

const decodeBase64 = (str) => {
  if (!str) return null;
  return Buffer.from(str, "base64").toString("utf-8");
};


const submitCode = async(req,res)=>{

    // const {id} = req.params;
    try{
        //user id chaiye (usermiddleware mei se result wale se nikalenge);
        const userId = req.result._id;  // cookie se user id nikal lenge usko nhi bhejna h post req mei
        // problem id chaiye ()
        const problemId = req.params.id;

        //code and lang chaiye
        const {code,language} = req.body;

        if(!userId||!code||!problemId||!language){
            return res.status(404).send("Some Fields Are Missing")
        }

        //fetch the problem from db to get hidden testcase of particular problem(submit ke tem pr hidden test case run hote h)
        const problem = await Problem.findById(problemId);
        // now i have hidden testcases of that problem
        if (!problem || !problem.functionName) {
            return res.status(400).send("Problem or functionName missing");
        }

        //storing submission of user in db  
        const submitResult = await Submission.create({
            userId,
            problemId,
            code,
            language,
            testCasesTotal:problem.hiddenTestCases.length,
            status: "pending"
        })

        // now submit code Judge0

        //first need language id (kis lang mei likha h?)
        const languageID = getLanguageById(language);

        //creating a submission batch(firsttestcase+code , secondtestcase+code)
            const submission = problem.hiddenTestCases.map((testcase) => ({
                source_code: Buffer.from(wrapCode(code, language)).toString("base64"),
                language_id: languageID,
                stdin: Buffer.from(testcase.input || "").toString("base64"),
                expected_output: Buffer.from(testcase.output || "").toString("base64"),
            }));
        

        // submitting this to judge 0 now
        const submitRes = await submitBatch(submission);                            

        //submitRes ke pass tokens hai
        const resultToken = submitRes.map((value)=>value.token);
        // [token1 , token2 , token3]

        //submiting token to judge0
        const testResult = await submitToken(resultToken);

        // testresult ke ander bohot kuch hota h
        // runtime,memory, langage id , error,status etc

        //submitResult Ko Update Krne ke liye info gather
            let testCasesPassed = 0;
            let runtime = 0;
            let memory = 0;
            let status = "accepted";
            let errorMsg = null;

            for (const test of testResult) {

            if (test.status_id === 3) {

                testCasesPassed++;
                runtime += parseFloat(test.time || 0);
                memory = Math.max(memory, test.memory || 0);
            } else {

                switch (test.status_id) {
                    case 4:
                        status = "wrong answer";
                        break;
                    case 5:
                        status = "tle"; // Time Limit Exceeded
                        break;
                    case 6:
                        status = "compile error";
                        break;
                    default:
                        status = "runtime error";
                }

                //  capture best possible error message
                errorMsg =
                    decodeBase64(test.stderr) ||
                    decodeBase64(test.compile_output) ||
                    test.message ||
                    "Execution failed";

                break; // stop on first failed testcase
            }
        }
            // now store the final result in the db
            submitResult.status = status;
            submitResult.testCasesPassed = testCasesPassed;
            submitResult.errorMsg = errorMsg;
            submitResult.runtime = runtime;
            submitResult.memory = memory;

        //save updated changes in the db
        await submitResult.save();

        // problem id ko insert krenge in userSchema ke Problem Solved Mei
        // req result ke ander user ki sari details h

        if(status === "accepted" && !req.result.problemSolved.includes(problemId)){
            req.result.problemSolved.push(problemId);
            await req.result.save(); //save DB
        }

        res.status(201).send(submitResult);
                
    }
    catch(err){
        res.status(500).send("Error " + err);
    }
}

const runCode = async(req,res)=>{

    // const {id} = req.params;
    try{
        //user id chaiye (usermiddleware mei se result wale se nikalenge);
        const userId = req.result._id;  // cookie se user id nikal lenge usko nhi bhejna h post req mei
        // problem id chaiye ()
        const problemId = req.params.id;
        // console.log("RUN API HIT")

        //code and lang chaiye
        const {code,language} = req.body;

        if(!userId||!code||!problemId||!language){
            return res.status(404).send("Some Fields Are Missing")
        }

        //fetch the problem from db to get hidden testcase of particular problem(submit ke tem pr hidden test case run hote h)
        const problem = await Problem.findById(problemId);
        // now i have hidden testcases of that problem

        if (!problem || !problem.functionName) {
            return res.status(400).send("Problem or functionName missing");
        }

        //first need language id (kis lang mei likha h?)
        const languageID = getLanguageById(language);

        //creating a submission batch(firsttestcase+code , secondtestcase+code)
        const submission = problem.visibleTestCases.map((testcase) => ({
                source_code: Buffer.from(
                    wrapCode(code, language)
                ).toString("base64"),

                language_id: languageID,

                stdin: Buffer.from(testcase.input || "").toString("base64"),

                expected_output: Buffer.from(testcase.output || "").toString("base64"),
            }));
        

        // submitting this to judge 0 now
        const submitRes = await submitBatch(submission);                            

        //submitRes ke pass tokens hai
        const resultToken = submitRes.map((value)=>value.token);
        // [token1 , token2 , token3]

        //submiting token to judge0
        const testResult = await submitToken(resultToken);

        // dubugg kra
        // testResult.forEach((test, i) => {
        //   console.log(`Test ${i + 1} raw stdout:`, test.stdout);
        //   console.log(`Test ${i + 1} decoded stdout:`, decodeBase64(test.stdout));
        // });


        // testresult ke ander bohot kuch hota h
        // testresult ke ander bohot kuch hota h

        const finalResults = testResult.map((test) => ({
        ...test,
        stdout: decodeBase64(test.stdout),
        stderr: decodeBase64(test.stderr),
        compile_output: decodeBase64(test.compile_output),
        expected_output: decodeBase64(test.expected_output),
        }));

        res.status(201).send(finalResults);
                        
            }
    catch(err){
        res.status(500).send("Error " + err);
    }
}


module.exports = {submitCode,runCode};