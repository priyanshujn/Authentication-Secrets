//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption'); // encrypt password in a binary string
const md5 = require('md5');     // generate hased password
const bcrypt = require('bcrypt');   // generate hased password with salting, more secure
const saltRounds = 10;

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/userDB').then(() =>
    console.log('connected successfully'));

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = new mongoose.model('User', userSchema);

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/register', function (req, res) {
    res.render('register');
});

app.post('/register', function (req, res) {

    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        if (!err) {
            const user = new User({
                email: req.body.username,
                password: hash
            });

            user.save()
                .then(() =>
                    console.log('User added successfully'))
                .catch(err =>
                    console.error(err));
        } else
            console.error(err);
    })

    res.render('secrets');
});

app.get('/login', function (req, res) {
    res.render('login');
});

app.post('/login', function (req, res) {

    console.log(req.body);
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({
        email: username
    })
        .then(user => {
            console.log(user);
            bcrypt.compare(password, user.password, function (err, result) {
                console.log('password matched: ', result);

                if (result)
                    res.render('secrets');
                else {
                    console.log('Incorrect email/password');
                    res.render('login');
                }
            });
        })
        .catch(err => console.error(err));
});


app.listen(3000, function () {
    console.log('Server started on port 3000');
});