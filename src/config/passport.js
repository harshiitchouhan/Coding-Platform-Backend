const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const User = require("../Models/user.js");

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? "https://coding-platform-backend.vercel.app/auth/google/callback"
          : "http://localhost:4000/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        // console.log(profile);
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profileImage:
              profile.photos?.[0]?.value || profile._json?.picture || "",
            isVerified: true,
          });
        } else if (!user.googleId) {
          // existing email-password user — link their google account
          user.googleId = profile.id;
          user.isVerified = true;
          await user.save();
        }

        return cb(null, user);
      } catch (err) {
        return cb(err, null);
      }
    }
  )
);

module.exports = passport;