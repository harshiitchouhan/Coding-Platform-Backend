# CodeBit — Backend

The API server for **CodeBit**, a full-stack competitive coding platform. Handles auth (local + Google OAuth), problems, code execution/submission, contests, an AI doubt-solver, and admin management.

## Tech Stack

- **Node.js** + **Express 5**
- **MongoDB** + **Mongoose 9**
- **Redis** — caching / session-adjacent storage
- **Passport.js** (`passport-google-oauth20`) — Google OAuth 2.0
- **JWT** (`jsonwebtoken`) + **bcrypt** — auth
- **express-rate-limit** — rate limiting on signup/OTP and code submission
- **Judge0 (via RapidAPI)** — code execution engine (run/submit)
- **Google Gemini** (`@google/genai`) — BitMentor AI doubt-solving
- **Cloudinary** — profile images & video editorial uploads
- **Nodemailer** — OTP / password-reset emails
- Deployed on **Vercel** (serverless)

## Folder Structure

```
backend/
├── src
│   ├── Controllers
│   │   ├── adminController.js       # User management (list/ban/role/delete)
│   │   ├── contestController.js     # Contest CRUD, register, submit, leaderboard
│   │   ├── solveDoubt.js            # BitMentor AI chat (Gemini)
│   │   ├── userAuthenticate.js      # Register/login/OTP/reset/profile
│   │   ├── userProblem.js           # Problem CRUD + fetch
│   │   ├── userSubmission.js        # Run / submit code (Judge0)
│   │   └── videoSection.js          # Editorial video upload (Cloudinary)
│   ├── Middleware
│   │   ├── adminMiddleware.js       # Verifies JWT + role === "admin"
│   │   ├── checkContestAccess.js    # Verifies contest registration/window
│   │   ├── signupLimmiter.js        # Rate limiters: signup, OTP verify
│   │   ├── submitLimiter.js         # Rate limiter: code submission
│   │   └── userMiddleware.js        # Verifies JWT, attaches req.result
│   ├── Models
│   │   ├── contest.js               # title, description, startTime, endTime, problems, participants, createdBy
│   │   ├── contestSubmission.js     # contestId, problemId, userId, status, language, code, points, penalty
│   │   ├── problems.js              # title, description, difficultyLevel, category, testCases, startCode, refSolution, functionSignature...
│   │   ├── submission.js            # problemId, userId, code, language, status, runtime, memory, testCasesPassed/Total
│   │   ├── user.js                  # name, email, password, googleId, role, isBanned, isVerified, problemSolved...
│   │   └── videoSolution.js         # problemId, userId, cloudinaryPublicId, secureURL, thumbnailURL, duration
│   ├── Routes
│   │   ├── adminUserRoutes.js       # /admin/*
│   │   ├── aiAssistant.js           # /ai/*
│   │   ├── contestRoutes.js         # /contest/*
│   │   ├── googleRoute.js           # /auth/*  (Google OAuth)
│   │   ├── problemCreator.js        # /problem/*
│   │   ├── submitCode.js            # /submission/*
│   │   ├── userAuth.js              # /user/*
│   │   └── videoCreator.js          # /video/*
│   ├── Utils
│   │   ├── problemUtil.js           # Judge0 payload helpers
│   │   ├── sendEmail.js             # Nodemailer wrapper (OTP, reset link)
│   │   ├── validate.js              # Input validation (validator.js)
│   │   └── wrapCode.js              # Wraps user code for Judge0 execution
│   ├── config
│   │   ├── database.js              # Mongoose connection
│   │   ├── passport.js              # Google OAuth strategy
│   │   └── redis.js                 # Redis client + connectRedis()
│   └── index.js                     # App entry — CORS, middleware, route mounting
├── .env.example
├── package.json
└── vercel.json
```

## API Routes

Mounted in `src/index.js`:

```js
app.use("/user", authRouter);       // userAuth.js
app.use("/problem", problemRouter); // problemCreator.js
app.use("/submission", submitRouter); // submitCode.js
app.use("/ai", aiRouter);           // aiAssistant.js
app.use("/video", videoRouter);     // videoCreator.js
app.use("/admin", adminRouter);     // adminUserRoutes.js
app.use("/contest", contestRouter); // contestRoutes.js
app.use("/auth", googleRouter);     // googleRoute.js
```

### `/user` — Auth & Profile

| Method | Route | Middleware | Description |
|---|---|---|---|
| POST | `/register` | `signupLimiter` | Register + send OTP |
| POST | `/verify-email` | `verifyOtpLimiter` | Verify OTP |
| POST | `/forget-password` | — | Send reset link |
| POST | `/reset-password/:token` | — | Reset password |
| POST | `/login` | — | Login |
| POST | `/logout` | — | Logout |
| POST | `/admin/register` | `adminMiddleware` | Register a new admin |
| GET | `/profile` | `userMiddleware` | Get own profile |
| DELETE | `/deleteProfile` | `userMiddleware` | Delete account |
| PUT | `/editProfile` | `userMiddleware` | Edit profile |
| GET | `/profileSignature` | `userMiddleware` | Cloudinary signed upload signature |
| POST | `/save` | `userMiddleware` | Save uploaded profile image metadata |
| DELETE | `/deleteImage` | `userMiddleware` | Remove profile image |
| GET | `/check` | `userMiddleware` | Lightweight auth check |
| GET | `/me` | — (reads JWT from cookie/header) | Get current user, used to restore session on refresh |

### `/auth` — Google OAuth

| Method | Route | Description |
|---|---|---|
| GET | `/google` | Start Google OAuth flow |
| GET | `/google/callback` | OAuth callback → issues JWT → redirects to frontend with `?token=` |

### `/problem`

| Method | Route | Middleware | Description |
|---|---|---|---|
| POST | `/create` | `adminMiddleware` | Create problem |
| GET | `/problemById/:id` | `userMiddleware` | Fetch single problem |
| GET | `/allProblem` | — | List all problems |
| GET | `/problemSolved` | `userMiddleware` | Problems solved by current user |
| PUT | `/update/:id` | `adminMiddleware` | Update problem |
| DELETE | `/delete/:id` | `adminMiddleware` | Delete problem |
| GET | `/submittedProblem/:pid` | `userMiddleware` | User's submissions for a problem |

### `/submission`

| Method | Route | Middleware | Description |
|---|---|---|---|
| POST | `/submit/:id` | `userMiddleware`, `submitLimiter` | Submit solution (Judge0) |
| POST | `/run/:id` | `userMiddleware` | Run code against visible test cases |

### `/ai`

| Method | Route | Middleware | Description |
|---|---|---|---|
| POST | `/chat` | `userMiddleware` | Ask BitMentor (Gemini-powered doubt solver) |

### `/contest`

| Method | Route | Middleware | Description |
|---|---|---|---|
| POST | `/create` | `adminMiddleware` | Create contest |
| GET | `/allContest` | `userMiddleware` | List contests |
| GET | `/singleContest/:id` | `userMiddleware`, `checkContestAccess` | Contest detail |
| POST | `/registerContest/:id` | `userMiddleware` | Register for contest |
| GET | `/:contestId/problem/:problemId` | `userMiddleware`, `checkContestAccess` | Contest problem page |
| POST | `/:contestId/submit/:problemId` | `userMiddleware`, `checkContestAccess` | Submit contest solution |
| GET | `/:contestId/myStats` | `userMiddleware` | Own contest stats |
| GET | `/:contestId/submissions/:problemId` | `userMiddleware` | Submission history for a contest problem |
| GET | `/:contestId/leaderboard` | `userMiddleware` | Contest leaderboard |
| GET | `/history` | `userMiddleware` | User's contest history |

### `/admin`

| Method | Route | Middleware | Description |
|---|---|---|---|
| GET | `/users` | `adminMiddleware` | List all users |
| GET | `/users/:id` | `adminMiddleware` | Get single user |
| PATCH | `/users/:id/ban` | `adminMiddleware` | Toggle ban |
| PATCH | `/users/:id/role` | `adminMiddleware` | Change role |
| DELETE | `/users/:id` | `adminMiddleware` | Delete user |

### `/video`

| Method | Route | Middleware | Description |
|---|---|---|---|
| GET | `/create/:problemId` | `adminMiddleware` | Get Cloudinary upload signature |
| POST | `/save` | `adminMiddleware` | Save uploaded editorial video metadata |
| DELETE | `/delete/:problemId` | `adminMiddleware` | Delete editorial video |

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB instance (local or Atlas)
- Redis instance (local or hosted)
- Judge0 RapidAPI key
- Google Gemini API key
- Google OAuth credentials
- Cloudinary account

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
PORT=4000

DB_KEY=your_mongodb_connection_string

SECRET_KEY=your_jwt_secret_key

REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password

RAPID_API_KEY=your_judge0_rapidapi_key
RAPID_API_HOST=judge0-ce.p.rapidapi.com

GEMINI_API_KEY=your_gemini_api_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Also required for Google OAuth (used in `config/passport.js` / `googleRoute.js` but not currently in `.env.example` — add these):
```env
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
NODE_ENV=development
```

### Run locally

```bash
npm run dev
# or
npm start
```
*(check `package.json` scripts — `nodemon` is a dependency, wire it up as `"dev": "nodemon src/index.js"` if not already)*

Server runs at `http://localhost:4000` by default. `GET /` returns a health check: `{ success: true, message: "CodeBit backend is running 🚀" }`.

### CORS

Allowed origins are hardcoded in `src/index.js`:
```js
[
  "http://localhost:5173",
  "https://coding-platform-khaki.vercel.app",
  "https://codebit-dev.vercel.app"
]
```
Update this list when adding new frontend deployment URLs.

### Deployment

Deployed on Vercel as a serverless function (`vercel.json` routes everything to `src/index.js`). Note: `app.listen()` is skipped when `NODE_ENV === "production"` since Vercel handles the HTTP server itself.

## Auth Flow Notes

- On login/register, JWT is signed with `SECRET_KEY` and set as an `httpOnly` cookie (`SameSite=None; Secure` in production for cross-origin).
- **Google OAuth** takes a token-in-URL approach instead of cookie-only: after `passport.authenticate`, the callback signs a JWT and redirects to `${FRONTEND_URL}?token=<jwt>` — the frontend reads this and stores it in `localStorage` for the `Authorization: Bearer` header (see frontend `axiosClient.js`).
- `GET /user/me` reads the token from either the cookie or the `Authorization` header — used by the frontend to restore session on page refresh.

## Known Gotchas

- **MongoDB connects per-request** via a middleware (`app.use(async (req,res,next) => { await main(); next(); })`) rather than once at boot — this handles serverless cold starts on Vercel but means every request pays a (cached) connection check.
- **Cross-origin cookies** need `SameSite=None; Secure` and the frontend origin present in the hardcoded `allowedOrigins` array, or requests get silently rejected by CORS.
- `Content-Length`/rate-limit headers rely on `app.set("trust proxy", 1)` — required for `express-rate-limit` to correctly read client IPs behind Vercel's proxy.
