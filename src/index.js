// require('dotenv').config();
// const express = require("express");
// const app = express();
// const main = require("./config/database");
// const cookieParser = require("cookie-parser");
// const authRouter = require("./Routes/userAuth");
// const redisClient = require('./config/redis');
// const problemRouter = require("./Routes/problemCreator");
// const submitRouter = require("./Routes/submitCode");
// const aiRouter = require("./Routes/aiAssistant")
// const videoRouter = require("./Routes/videoCreator")
// const adminRouter = require("./Routes/adminUserRoutes")
// const cors = require("cors");

// app.use(cors({
//     origin: "http://localhost:5173",
//     credentials: true
// }))



// app.use(express.json());
// app.use(cookieParser());

// app.use("/user",authRouter);
// app.use("/problem",problemRouter);
// app.use("/submission",submitRouter);
// app.use("/ai",aiRouter)
// app.use("/video",videoRouter);
// app.use("/admin",adminRouter)

// app.get("/", (req, res) => {
//   res.send("CodeBit Backend is running ");
// });

//  const InitializeConnection = async()=>{

//     try{
//         await Promise.all([main(),redisClient.connect()]); // parallel connection of both db
//         console.log("Connected To DB");

//         app.listen(process.env.PORT,()=>{
//         console.log("Listening at Port No " + process.env.PORT)
//     })

//     }
//     catch(err){
//         console.log(err);
//     }
//  }

//  InitializeConnection();



require('dotenv').config();

const express = require("express");
const app = express();

const main = require("./src/config/database");
const cookieParser = require("cookie-parser");
const redisClient = require('./src/config/redis');

const authRouter = require("./src/Routes/userAuth");
const problemRouter = require("./src/Routes/problemCreator");
const submitRouter = require("./src/Routes/submitCode");
const aiRouter = require("./src/Routes/aiAssistant");
const videoRouter = require("./src/Routes/videoCreator");
const adminRouter = require("./src/Routes/adminUserRoutes");

const cors = require("cors");

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://your-frontend.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("CodeBit Backend is running");
});

app.use("/user", authRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);
app.use("/ai", aiRouter);
app.use("/video", videoRouter);
app.use("/admin", adminRouter);

let connected = false;

async function connectDB() {
  if (!connected) {
    await Promise.all([
      main(),
      redisClient.connect()
    ]);

    connected = true;

    console.log("Connected To DB");
  }
}

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};