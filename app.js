const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const nanoid = require('nanoid');

// Allow access to variables in .env file
require("dotenv").config();

// Heroku will serve on 443, but locally you can either set in your dotenv or leave as it is to go with 8080
const port = process.env.PORT || process.argv[2] || 8080;
var app = express();

// DATABASE SETUP
const MONGO_URI = process.env.MONGO_URI;
const Poll = require('./models/poll');

// Below per https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true, useUnifiedTopology: true
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error: '));

// Static folder to serve from https://expressjs.com/en/starter/static-files.html
app.use(express.static(__dirname + '/static')); // Tested by http://localhost:8080/img/kitten.jpg

app.get('/', function (req, res) {
    res.send("Hello");
});


process.on('SIGTERM', () => {
    server.close(() => {
        mongoose.connection.close();
        console.log('SIGTERM received. Process terminated.');
    });
});

app.get('/test1', function (req, res) {
    const myPoll = [
        "What's your favorite color out of these?",
        ["red", "green", "purple"],
        [0, 0, 0],
        "XYZ222",
        "GLE888",
        "YEL777",
        null,
        false,
        true,
        false
    ];
    pollCreate(...myPoll);
    res.send("Done");
});
    
// Test of a lookup function
// This find returns result: 
//{ _id: 609c0949da91f28837e3b31b, question: "What's your favorite color out of these?" }
app.get('/test2', function (req, res) {
    console.log("entered test2")
    var id = "GLE888";
    var query = Poll.findOne({ adminID: id });
    query.select('question'); // limit the fields of what is returned
    query.exec(function (err, result) {
        console.log("inside query");
        if (err) {
            console.log(err);
            res.send("err" + err);
        }
        else {
            console.log(result);
            res.send("result: " + result);
        }
    });
});

const server = app.listen(port, function () {
    console.log('app.js running on port: ' + port);
});

function pollCreate(ques, ans, vots, resID, admID, sharID, expirOn, privRes, ipdCheck, cookCheck) {
    pollDetail = {
        question: ques,
        answers: ans,
        votes: vots,
        resultsID: resID,
        adminID: admID,
        shareID: sharID,
        expiresOn: expirOn,
        privateResults: privRes,
        ipDupCheck: ipdCheck,
        cookieCheck: cookCheck
    };

    let apoll = new Poll(pollDetail);

    apoll.save(function (err) {
        if (err) {
            console.log("DB ERROR: " + err);
            return;
        }
        else {
            console.log("Poll written to DB successfully.");
        }
    });
}





