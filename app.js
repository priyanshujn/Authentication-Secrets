//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const encrypt = require('mongoose-encryption'); // encrypt password in a binary string
const md5 = require('md5');     // generate hased password

const bcrypt = require('bcrypt');   // generate hased password with salting, more secure
const saltRounds = 10;             // no of time, salting needs to perform

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

// creating localstrategy using createstrategy method
passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
    return cb(null, user);
});

passport.deserializeUser(function (user, cb) {
    return cb(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log('profile: ', profile);

        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));
// passport.use(new FacebookStrategy({
//     clientID: process.env.FCLIENT_ID,
//     clientSecret: process.env.FCLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/facebook/secrets"
// },
//     function (accessToken, refreshToken, profile, cb) {
//         console.log(profile);

//         User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//             return cb(err, user);
//         });
//     }
// ));

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
);

// app.get('/auth/facebook',
//     passport.authenticate('facebook', { scope: ['public_profile'] })
// );

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        //on successful authentication, redirect to secrets
        res.redirect('/secrets');
    }
);

// app.get('/auth/facebook/secrets',
//     passport.authenticate('facebook', { failureRedirect: '/login' }),
//     function (req, res) {
//         //on successful authentication, redirect to secrets
//         res.redirect('/secrets');
//     }
// );

app.get('/register', function (req, res) {
    res.render('register');
});

app.get('/secrets', function (req, res) {
    User.find({ 'secret': { $ne: null } })
        .then((users) => {
            res.render('secrets', { foundUsers: users });
        }).catch(err =>
            console.error(err));
});

app.get('/submit', function (req, res) {
    if (req.isAuthenticated())
        res.render('submit');
    else
        res.redirect('/login');
});

app.post('/submit', function (req, res) {
    console.log('req user: ', req.user);

    //Once the user is authenticated and their session gets saved, their user details are saved to req.user.

    User.findByIdAndUpdate(req.user._id, { secret: req.body.secret }, { new: true })
        .then((user) => {
            res.redirect('/secrets');
        }).catch(err =>
            console.error(err));
});

app.get('/logout', function (req, res) {
    req.logout(function (err) {
        if (err)
            console.error(err);
        else
            res.redirect('/');
    });
});

//if server gets restarted, the exisiting session and cookies will get deleted.

app.post('/register', function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.error(err);
            res.redirect('/register');
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/secrets');
            });
        }
    });
});

app.get('/login', function (req, res) {
    res.render('login');
});

app.post('/login', function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err)
            console.error(err);
        else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/secrets');
            })
        }
    })
});


app.listen(3000, function () {
    console.log('Server started on port 3000');
});