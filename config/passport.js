// config/passport.js

// load all the things we need
var FacebookStrategy = require('passport-facebook').Strategy;

// load up the user model
var DB = require('../app/models/DB');

// load the auth variables
var config = require('./config');
/**
 * Description
 * @method exports
 * @param {} passport
 * @return 
 */
module.exports = function(passport) {
    // used to serialize the user for the session
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    DB.User.findById(id, function(err, user) {
        done(err, user);
    });
});    
  /* Facebook Strategy */
    
    passport.use(new FacebookStrategy({
        // pull in our app id and secret from our auth.js file
        clientID        : config.fb_auth.clientID,
        clientSecret    : config.fb_auth.clientSecret,
        callbackURL     : config.fb_auth.callBackUrl,
    },
    // facebook will send back the token and profile
    function(accessToken, refreshToken, profile, done) {
        // asynchronously
        process.nextTick(function() {
            // find the user in the database based on their facebook id
            DB.User
            .findOne({ 'facebook.id' : profile.id })
            .exec(function(err, user) {
                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err) return done(err);
                // if the user is found, then log them in
                if (user) return done(null, user); // user found, return that user
                else 
                {
                    // if there is no user found with that facebook id, create them
                    var newUser            = new DB.User();
                    // set all of the facebook information in our user model
                    newUser.facebook.id    = profile.id; // set the users facebook id                   
                    newUser.facebook.token = accessToken; // we will save the accessToken that facebook provides to the user                    
                    newUser.facebook.name  = profile.displayName; // look at the passport user profile to see how names are returned
                    
                    // save our user to the database
                    newUser.save(function(err) {
                        if (err) return next(err);  //here do NEXT()
                        // if successful, return the new user
                        return done(null, newUser); 
                    });
                }

            });
        });

    }));

};
