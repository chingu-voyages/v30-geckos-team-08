const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { nanoid } = require('nanoid'); // Generaotes unique pollIDs
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const path = require('path');
const getColors = require('./color-helper');
//const CC = require("cookieconsent");



// Dumped svg-captcha-express in favor of its fork, ppfun-captcha with security bugfix
const svgCaptcha = require('ppfun-captcha');

// Allow access to variables in .env file
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;
const JWTKEY = process.env.JWTKEY;

// Heroku will serve on 443, but locally you can either set in your dotenv or leave as it is to go with 8080
const port = process.env.PORT || process.argv[2] || 8080;

var app = express();
app.use(
    session({
        secret: JWTKEY,
        resave: false,
        saveUninitialized: true
    })
);

const Poll = require('./models/poll');
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true, useUnifiedTopology: true
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error: '));

app.use(cookieParser()); // puts cookies in req.body
app.use(express.static(__dirname + '/static')); // serve static files from this directory


// Message about deprecation - tried switching to use express.urlencoded (see below) but variables not populated?
app.use(bodyParser.urlencoded({
    extended: true, // Use body parser to parse body and populate req variables
  })
);
//app.use(express.urlencoded()); // Parse URL-encoded bodies - Suggested alternative to deprecated bodyParser above

// Middleware - reads cookie from requests to obtain list of polls user has taken already.
// Decodes the JWT and saves the list of polls taken as array in req.userPolls
app.use(function (req, res, next) {
    if (!req.cookies.jwt) {
        //console.log("app.js:80 no req.cookies.jwt!");
        req.userPolls = [];
        next();
    }
    else {
        let decoded = {};
        try {
            decoded = jwt.verify(req.cookies.jwt, JWTKEY);
        }
        catch (err) {
            console.log("Error decoding cookie jwt in app.js:89 - " + err);
            req.userPolls = [];
            res.cookie('jwt', "", {
                expires: new Date(Date.now() - (100 * 24 * 60 * 60 * 1000)), httpOnly: true, sameSite: 'Strict'
            });
            next(); // May want to set to expire here!
        }
        req.userPolls = decoded.polls;
        next();
    }
})

app.set("views", __dirname + "/views");
app.set('view engine', "ejs"); //  res.render to load up an ejs view file (serve ./views/pages/index.ejs)

process.on('SIGTERM', () => { // Maybe unnecessary or maybe better way to close connection
    server.close(() => {
        mongoose.connection.close();
        console.log('SIGTERM received. Process terminated.');
    });
});

const server = app.listen(port, function () { console.log('app.js running on port: ' + port) });

// TODO: Cleanup and change to svg extension - but saved "Incorrect captcha" image must be svg'd
app.get('/captcha.jpg', function (req, res) {
    var captcha = svgCaptcha.create(
        {
            height: 175,
            fontSize: 150,
            ignoreChars: '0Oo1il', 
            width: 245,
            background: '#ebbdb0'
        });
    req.session.captcha = captcha.text;
    res.type('svg');
    res.status(200).send(captcha.data);
});

// Home page and poll creation
app.get('/', function (req, res) {
    res.render('pages/index',
        {
            pageTitle: "PollCall - Create a poll & share it with friends!",
        });
});

// POST to / creates a poll when "poll form" is "submitted"
app.post('/', function (req, res) {
    const { question, answers, ipCheck, cookieCheck, captchaInput } = req.body;
    const validCaptcha = (captchaInput == req.session.captcha);
    
    if (!validCaptcha) {
        return res.send({ "captchaPass": false });
    }

    let votes = new Array(answers.length);
    votes.fill(0);
    (async function postPoll() {
        const newPollId = await genPollId();
        const newPoll = new Poll({
            question: question,
            answers: answers,
            votes: votes,
            pollID: newPollId,
            ipCheck: ipCheck,
            cookieCheck: cookieCheck,
            ipAddresses: [],
            startColor: Math.floor(Math.random() * 7),
        });
        try {
            let resultPoll = await newPoll.save();
            const url = '/pollCreated/' + newPollId;
            //res.redirect(url); this sends the actual html of url page
            res.status(200).send({
                captchaPass: true,
                result: 'redirect',
                url: url
            })
        }
        catch (err) {
            console.log("Error on creating poll in app.js:191: " + err);
            return res.render("pages/not-found.ejs", {
                pageTitle: "Error creating new poll: " + err
            });
        }
    })();
});

// TODO: this may not be used any more?!!
/*
app.post('/checkCaptcha', function (req, res) {

    const validCaptcha = captcha.check(req, req.body.one);
    if (!validCaptcha) {
        return res.send(false);
    }
    else {
        return res.send(true);
    }
}); */

app.get("/pollCreated/:pollId", function (req, res) {
    //const pollID = req.params.pollId;
    // Construct the query
    var query = Poll.findOne({ pollID: req.params.pollId });
    // Run the query
    query.exec(function (err, result) {
        if (err) {
            const errString = "Error looking up poll of with id of " + req.params.pollId + ": " + err;
            console.log("Error in lookup of poll " + req.params.pollId + ": " + errString);
            return res.render("pages/not-found.ejs", {
                pageTitle: errString
            });
        }
        else {
            if (!result) {
                //console.log("No poll with this id found: " + pollID);
                return res.render("pages/not-found.ejs", {
                    pageTitle: "Poll not found!"
                })
            }
            res.render('pages/pollCreated', {
                pageTitle: "Poll Created - " + result.question,
                poll: result,
                pollId: result.pollID,
                question: result.question,
                answers: result.answers,

            });
        }
    });
});

app.get('/about', function (req, res) {
    res.render('pages/about',
        {
            aVariable: 'About page',
            pageTitle: "Poll Call - About"
        });
});


app.get('/poll/:id', function (req, res) { // Take a poll route
    const paramPollID = req.params.id;
    var query = Poll.findOne({ pollID: paramPollID });
    query.exec(function (err, result) {
        if (err) {
            console.error("app.js:213 Error in poll lookup: " + err);
            return res.render("pages/not-found.ejs", {
                pageTitle: "Error accessing poll: " + err
            
            });
        }
        else {
            if (!result) {
                return res.render("pages/not-found.ejs", {
                    pageTitle: "Poll " + paramPollID + " not found!"
                });
                
            }
            const thePoll = new Poll(result);
            res.render("pages/poll", {
                pageTitle: "PollCall - Poll: " + thePoll.question,
                question: thePoll.question,
                answers: thePoll.answers,
                pollID: thePoll.pollID,
                ipCheck: thePoll.ipCheck,
                cookieCheck: thePoll.cookieCheck,
            })
        }
    });
});

app.get('/results/:id', function (req, res) { // results page route
    const paramPollID = req.params.id;
    var query = Poll.findOne({ pollID: paramPollID });
    query.exec(function (err, result) {
        if (err) {
            return res.render("pages/not-found.ejs", {
                pageTitle: "Error accessing poll " + paramPollID + ": " + err
            });
        }
        else {
            if (!result) {
                return res.render('pages/not-found.ejs', {
                    pageTitle: "Poll " + paramPollID + " not found"
                });
            }
            const thePoll = new Poll(result);

            res.render("pages/results", {
                pageTitle: "PollCall - Results: " + thePoll.question,
                question: thePoll.question,
                answers: thePoll.answers,
                pollID: thePoll.pollID,
                votes: thePoll.votes,
                voted: false,
                voteIndex: -1,
                dupVote: false,
                answerColors: getColors(thePoll.startColor, thePoll.answers.length),
                round: round,
                totalVotes: thePoll.votes.reduce((a, b) => a + b, 0),
            })
        }
    });
});

app.post('/results/:pollId', function (req, res) {
    const paramPollID = req.params.pollId;
    if (!req.userPolls) {
        req.userPolls = [];
    }
    
    const voteIndex = req.body.voteIndex;
    let dupVote = false;

    var query = Poll.findOne({ pollID: paramPollID });
    query.exec(function (err, result) {
        if (err) {
            return res.render("pages/not-found.ejs", {
                pageTitle: "Error accessing poll " + paramPollID + ": " + err
            });
        }
        else {
            const thePoll = new Poll(result);
            if (!req.userPolls.includes(paramPollID)) { // never voted on this poll before so set cookie
                req.userPolls.push(paramPollID);
                var token = jwt.sign({ polls: req.userPolls }, JWTKEY);
                res.cookie('jwt', token, { expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), httpOnly: true, sameSite: 'Strict' });
            }
            // Below is the ip check or cookie check based rejection
            else if ((req.userPolls.includes(paramPollID) && thePoll.cookieCheck) ||
                (thePoll.ipAddresses.includes(getClientIp(req)) && thePoll.ipCheck == true))
            {
                //console.log("app.js:255 Duplicate votes protection triggered!");
                return res.render("pages/results", {
                    pageTitle: "You've already voted once before!",
                    question: thePoll.question,
                    answers: thePoll.answers,
                    pollID: thePoll.pollID,
                    votes: thePoll.votes,
                    voted: false,
                    voteIndex: -1,
                    dupVote: true,
                    answerColors: getColors(thePoll.startColor, thePoll.answers.length),
                    round: round,
                    totalVotes: votes.reduce((a, b) => a + b, 0)
                })
            }
            if (thePoll.ipCheck) {
                const ip = getClientIp(req);
                if (!thePoll.ipAddresses.includes(ip)) {
                    thePoll.ipAddresses.push(ip);
                }
            }
            
            thePoll.votes[voteIndex] = thePoll.votes[voteIndex] + 1;
            try {
                (async function savePoll() {
                    let resultPoll = await thePoll.save();
                    
                    return res.render("pages/results", {
                        pageTitle: "PollCall - Results: " + resultPoll.question,
                        question: resultPoll.question,
                        answers: resultPoll.answers,
                        pollID: resultPoll.pollID,
                        ipCheck: resultPoll.ipCheck,
                        cookieCheck: resultPoll.cookieCheck,
                        votes: resultPoll.votes,
                        voted: true,
                        voteIndex: voteIndex,
                        answerColors: getColors(thePoll.startColor, thePoll.answers.length),
                        round: round,
                        totalVotes: thePoll.votes.reduce((a, b) => a + b, 0),
                    }); // end render
                })(); // end iife
            } // end try
            catch (err) {
                console.log("Error saving poll " + paramPollID + ": " + err);
                return res.render("pages/not-found.ejs", {
                    pageTitle: "Error saving poll " + paramPollID + ": " + err
                });
            }
        }
    });
});

// TODO: this can be consolidated with for .../img/:resultsImg
app.get('/results/bar-img/:resultsImg', function (req, res) { // Generate bar graph route
    const pollID = req.params.resultsImg.slice(0, -4);

    const query = Poll.findOne({ pollID: pollID });

    query.exec(function (err, result) {
        if (err) {
            return res.status(500).send("Error during database lookup of poll with id " + pollID + ":" + err);
        }
        else {
            if (result == null) { // lookup didn't find that pollId
                return res.status(404).send("Poll " + pollID + " not found!");
            } // else
            const thePoll = new Poll(result);

            if (!thePoll.startColor)
                thePoll.startColor = 0;

            const chartConf = {
                type: "bar",
                data: {
                    labels: getCharacters(thePoll.answers.length),   // Set X-axis labels
                    datasets: [{
                        label: 'Answers',                         // Create the 'Users' dataset
                        data: thePoll.votes,           // Add data to the chart
                        backgroundColor: getColors(thePoll.startColor, thePoll.answers.length)
                    }]
                },
                options: {
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                    scales: {
                        x: {
                            title: {
                                display: false,
                                text: "Votes"
                            },
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                } // end options
            };

            const chartConfigString = encodeURIComponent(JSON.stringify(chartConf));
            let url = 'https://quickchart.io/chart?c=' + chartConfigString + "&version=3";

            (async function getChart() {
                let response = await fetch(url);
                if (response.ok) { // if HTTP status is 200-299
                    const imgBlob = await response.blob(); 
                    res.type(imgBlob.type); // set response type
                    imgBlob.arrayBuffer().then(buf => {
                        return res.send(Buffer.from(buf)) // displays in browser                        
                    })
                }
                else {
                    console.log("app.js:227 HTTP Error - QuickChart server responded: " + response.status);
                    return res.status(500).send("HTTP Error - QuickChart server responded: " + response.status);
                }
            })();
        } // end else
    }); // end query.exec()
})
app.get('/results/img/:resultsImg', function (req, res) {
    const pollID = req.params.resultsImg.slice(0, -4);
    var query = Poll.findOne({ pollID: pollID }); // FIX

    query.exec(function (err, result) {
        if (err) {
            return res.status(500).send("Error during database lookup of poll with id " + pollID + ":" + err);
        }
        else {
            if (result == null) { // lookup didn't find that pollId
                return res.status(404).send("Poll " + pollID + " not found!");
            }
            // else
            const thePoll = new Poll(result);
            if (!thePoll.startColor)
                thePoll.startColor = 0;

            const chartConf = {
                type: 'pie',
                data: {
                    labels: getCharacters(thePoll.answers.length),   // Set X-axis labels
                    datasets: [{
                        label: 'Answers',
                        data: thePoll.votes,
                        backgroundColor: getColors(thePoll.startColor, thePoll.answers.length)
                    }]
                },
                options: {
                    title: {
                        display: false,
                        text: thePoll.question
                    }
                }
            } // end chartConf

            
            let url = 'https://quickchart.io/chart?c=' +
                encodeURIComponent(JSON.stringify(chartConf));

            (async function getChart() {
                let response = await fetch(url);
                if (response.ok) { // if HTTP status is 200-299
                    const imgBlob = await response.blob(); 
                    res.type(imgBlob.type); // set response type
                    imgBlob.arrayBuffer().then(buf => {
                        return res.send(Buffer.from(buf)) // displays in browser                        
                    })
                }
                else {
                    console.log("app.js:227 QuickChart server responded: " + response.status);
                    return res.status(500).send("HTTP Error - QuickChart server responded: " + response.status);
                }
            })();
        } // end else
    }); // end query.exec()
});

async function genPollId() { // Genrate random string for pollID
    const candidate = nanoid(6);
    const searchResult = await Poll.findOne({ pollID: candidate });

    return (searchResult ? genPollId() : candidate);
    
    /*
    if (searchResult) {
        return genPollId();
    }
    else return candidate; */
}

function getClientIp(req) { // Amazon EC2 / Heroku workaround to get real client IP
  var ipAddress;
  var forwardedIpsStr = req.header('x-forwarded-for'); 
  if (forwardedIpsStr) { // 'x-forwarded-for' header may return multiple IP addresses in format: 
    var forwardedIps = forwardedIpsStr.split(','); //  "client IP, proxy 1 IP, proxy 2 IP..." Take the the first one.
    ipAddress = forwardedIps[0];
  }
  if (!ipAddress) {
    ipAddress = req.connection.remoteAddress; // normal method of getting client IP address
  }
  return ipAddress;
}
// TODO: unused
/*
function transparentize(value, opacity) {
  var alpha = opacity === undefined ? 0.5 : 1 - opacity;
  return colorLib(value).alpha(alpha).rgbString();
} */

// Return array of letter characters, ['A', 'B', 'C', ...], one for each answer of numAnswers
function getCharacters(numAnswers){
    let rv = [];
    for (let i = 0; i < numAnswers; i++){
        let char = i + 65;
        if (char >= 91 && char <= 96) {
            char += 6;
        }
        rv.push(String.fromCharCode(char));
    }
    return rv;
}

const round = (number, decimalPlaces) => Number(Math.round(number + "e" + decimalPlaces) + "e-" + decimalPlaces);
