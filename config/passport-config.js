const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const waterfall = require('async-waterfall');
const config = require('./config');
const passwordHash = require('password-hash');
const RememberStrategy = require('passport-remember-me').Strategy;
const tokenGenerate = require('rand-token');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const tokenModel = require('../models/token');
const userModel = require('../models/user');


passport.serializeUser( (user, done) => {
    done(null, {_id: user._id, name: user.name, urlImage: user.urlImage, type: user.type});
});

passport.deserializeUser(function(user, done){
    done(null, user);
});

passport.use('local.register', new LocalStrategy({passReqToCallback: true}, (req, username, password, done) => {
    waterfall([
        //  Check if Username is exist
        cb => {
            userModel.findOne({username: req.body.username}, (err, user) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                if(user) return cb("Username đã tồn tại!!")
                cb(null);
            });
        },
        // Check if email is exist
        cb => {
            userModel.findOne({email: req.body.email}, (err, user) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                if(user) return cb("Email đã tồn tại!!")
                cb(null);
            });
        },
        // Hash password
        cb => {
            const passwordCrypt = passwordHash.generate(req.body.password);
            cb(null, passwordCrypt);
        },
        //  Create new user type 'web'
        (passwordCrypt, cb) =>{
            userModel.create({
                username: req.body.username,
                password: passwordCrypt,
                name: req.body.name,
                email: req.body.email,
                idFacebook: null,
                type: 'web'
            }, (err, user) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                cb(null, user);
            });
        }
    ], function(err, user){
        if(err) return done(null, false, err);
        done(null, user);
    })
}))

passport.use('local.login', new LocalStrategy({passReqToCallback: true}, (req, username, password, done) => {
    //  Login user type 'web'
    userModel.findOne({username: username}, (err, user) => {
        if(err) return done(null, false, "Có lỗi xảy ra, vui lòng thử lại sau")
        if(!user) return done(null, false, "Sai tên đăng nhập hoặc mật khẩu")
        if(!passwordHash.verify(password, user.password))
            return done(null, false, "Sai tên đăng nhập hoặc mật khẩu")
        done(null, user);
    });
}));

/* Login With Facebook */
passport.use(new FacebookStrategy({
    clientID: config.facebookDEV.clientID,
    clientSecret: config.facebookDEV.clientSecret,
    callbackURL: config.facebookDEV.urlCallBack,
    profileFields: ['emails', 'displayName']
  },
  function(accessToken, refreshToken, profile, done) {
    // Checking field 
    if(typeof profile.id === 'undefined')
        return done(null, false, "Không tìm thấy ID")
    if(typeof profile.displayName === 'undefined')
        profile.displayName = '^Unknow';
    if(typeof profile.emails !== 'undefined' && profile.emails.length > 0)
        profile.email = profile.emails[0].value;

    waterfall([
        //  Check if user is exist by id Facebook
        cb => {
            userModel.findOne({idFacebook: profile.id}, (err, user) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                if(user) return cb(null, user)
                cb(null, false)
            });
        },
        (user, cb) => {
            if(user === false) return cb(null, false)
            userModel.findOneAndUpdate({_id: user._id}, {name: profile.displayName}, err => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                cb(null, user)
            })
        },
        // If exist continue with user variable, otherwise create new one
        (user, cb) => {
            if(user !== false) return cb(null, user); 
            userModel.create({
                name: profile.displayName, 
                idFacebook: profile.id, 
                email: profile.email, 
                type: 'facebook'
                }, (err, newUser) => {
                    if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    cb(null, newUser);
            });
            
        }
    ], function(err, user){
        if(err) return done(null, false, err);
        user.urlImage = 'http://graph.facebook.com/' + profile.id +'/picture?type=square';
        user.name = profile.displayName;
        done(null, user);
    });
  }
));

/* Login By Google */
passport.use(new GoogleStrategy({
    clientID: config.googleDEV.clientID,
    clientSecret: config.googleDEV.clientSecret,
    callbackURL: config.googleDEV.urlCallBack,
    profileFields: ['email']
  },
  function(accessToken, refreshToken, profile, done) {
    // Checking field 
    if(typeof profile.id === 'undefined')
        return done(null, false, "Không tìm thấy ID")
    if(typeof profile.displayName === 'undefined')
        profile.displayName = '^Unknow';
    if(typeof profile.emails !== 'undefined' && profile.emails.length > 0)
        profile.email = profile.emails[0].value;
    if(typeof profile.photos !== 'undefined' && profile.photos.length > 0)
        profile.photo = profile.photos[0].value;

    waterfall([
        //  Check if exist Google ID
        cb => {
            userModel.findOne({idGoogle: profile.id}, (err, user) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                if(user) return cb(null, user)
                cb(null, false)
            });
        },
        // If exist, update url avatar image and name
        (user, cb) => {
            if(user === false) return cb(null, false)
            userModel.findOneAndUpdate({_id: user._id}, {urlImage: profile.photo, name: profile.displayName}, err => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                cb(null, user)
            })
        },
        // Create new one if not exist
        (user, cb) => {
            if(user !== false) return cb(null, user)
            userModel.create({
                    name: profile.displayName, 
                    email: profile.email, 
                    idGoogle: profile.id, 
                    urlImage: profile.photo,
                    type: 'google'
                }, (err, newUser) => {
                    if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    cb(null, newUser);
            });
        }
    ],function(err, user){
        if(err) return done(err);
        user.urlImage = profile.photo;
        user.name = profile.displayName;
        done(null, user);
    })
  }
));



