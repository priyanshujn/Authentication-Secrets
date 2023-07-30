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

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB').then(() =>
    console.log('connected successfully'));

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);

// creating localstrategy using createstrategy method
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/register', function (req, res) {
    res.render('register');
});

app.get('/secrets', function (req, res) {
    if (req.isAuthenticated())
        res.render('secrets');
    else
        res.redirect('/login');
})

app.get('/logout', function(req, res){
    req.logout(function(err){
        if(err)
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
            passport.authenticate('local')(req, res, function(){
                res.redirect('/secrets');
            })
        }
    })
});


app.listen(3000, function () {
    console.log('Server started on port 3000');
});