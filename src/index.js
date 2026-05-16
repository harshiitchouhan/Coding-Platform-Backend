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
// const contestRouter = require("./Routes/contestRoutes");
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
// app.use("/admin",adminRouter);
// app.use("/contest",contestRouter);

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


require("dotenv").config();

const express = require("express");
const app = express();

const main = require("./config/database");
const cookieParser = require("cookie-parser");
const authRouter = require("./Routes/userAuth");
const redisClient = require("./config/redis");
const problemRouter = require("./Routes/problemCreator");
const submitRouter = require("./Routes/submitCode");
const aiRouter = require("./Routes/aiAssistant");
const videoRouter = require("./Routes/videoCreator");
const adminRouter = require("./Routes/adminUserRoutes");
const contestRouter = require("./Routes/contestRoutes");

const cors = require("cors");


const allowedOrigins = [
  "http://localhost:5173",
  "https://coding-platform-khaki.vercel.app",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());


app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CodeBit backend is running 🚀",
  });
});

app.use("/user", authRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);
app.use("/ai", aiRouter);
app.use("/video", videoRouter);
app.use("/admin", adminRouter);
app.use("/contest", contestRouter);

const InitializeConnection = async () => {
  try {
    await Promise.all([
      main(),
      redisClient.connect(),
    ]);

    console.log("Connected To DB");

    if (process.env.NODE_ENV !== "production") {
      app.listen(process.env.PORT || 4000, () => {
        console.log(
          "Listening at Port No " +
            (process.env.PORT || 4000)
        );
      });
    }

  } catch (err) {
    console.log(err);
  }
};

InitializeConnection();

module.exports = app;
