const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../Models/user.js");
const passport = require("passport")

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

        // your logic here
        // console.log(profile);
        let user = await User.findOne({
          email: profile.emails[0].value,
        });

        if(!user){
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email:profile.emails[0].value,
            profileImage:profile.photos[0].value || profile._json?.picture,
          })
        }

        return cb(null,user);
        

      } catch (err) {
        return cb(err,null);
      }
    }
  )
);

module.exports = passport;