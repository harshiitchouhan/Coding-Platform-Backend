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

// // app.use(cors({
// //    origin: [
// //     "http://localhost:5173",
// //     "https://coding-platform-phi.vercel.app"
// //   ],
// //     credentials: true
// // }))

// // const allowedOrigins = [
// //   "http://localhost:5173",
// //   "https://coding-platform-phi.vercel.app",
// // ];

// // app.use(cors({
// //   origin: allowedOrigins,
// //   credentials: true,
// // }));

// // app.options("*", cors({
// //   origin: allowedOrigins,
// //   credentials: true,
// // }));


// // app.get("/", (req, res) => {
// //   res.send("CodeBit Backend is running ");
// // });

// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://coding-platform-phi.vercel.app",
// ];

// app.use((req, res, next) => {
//   const origin = req.headers.origin;

//   if (allowedOrigins.includes(origin)) {
//     res.header("Access-Control-Allow-Origin", origin);
//   }

//   res.header("Access-Control-Allow-Credentials", "true");
//   res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   }

//   next();
// });

// app.use(express.json());
// app.use(cookieParser());

// app.get("/", (req, res) => {
//   res.send("CodeBit Backend is running");
// });

// app.use(express.json());
// app.use(cookieParser());

// app.use("/user",authRouter);
// app.use("/problem",problemRouter);
// app.use("/submission",submitRouter);
// app.use("/ai",aiRouter)
// app.use("/video",videoRouter);
// app.use("/admin",adminRouter)



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
const problemRouter = require("./Routes/problemCreator");
const submitRouter = require("./Routes/submitCode");
const aiRouter = require("./Routes/aiAssistant");
const videoRouter = require("./Routes/videoCreator");
const adminRouter = require("./Routes/adminUserRoutes");

const FRONTEND_URL = "https://coding-platform-phi.vercel.app";

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("CodeBit Backend is running");
});

let isConnected = false;

app.use(async (req, res, next) => {
  try {
    if (!isConnected) {
      await main();
      isConnected = true;
      console.log("MongoDB connected");
    }

    next();
  } catch (err) {
    console.log("DB ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: err.message,
    });
  }
});

app.use("/user", authRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);
app.use("/ai", aiRouter);
app.use("/video", videoRouter);
app.use("/admin", adminRouter);

module.exports = app;