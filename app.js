const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { nanoid } = require('nanoid'); // Generaotes unique pollIDs
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const path = require('path');

const captcha = require('svg-captcha-express').create({
    cookie: 'captcha',
    size: 4,
    height: 175,
    width: 245
});
//load custom font (optional)
captcha.loadFont(path.join(__dirname, '/static/Comismsh.ttf'));

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

// Below per https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true, useUnifiedTopology: true
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error: '));

// puts cookies in req.headers.cookie - SUPPOSED to put them in req.cookies
app.use(cookieParser()); 

// Static folder to serve from https://expressjs.com/en/starter/static-files.html
app.use(express.static(__dirname + '/static')); // Tested by http://localhost:8080/img/kitten.jpg

//app.use(express.json());

// using body parser to parse the body of incoming post requests
app.use(bodyParser.urlencoded({
    extended: true, // must give a value for extended
  })
);

//app.use(express.urlencoded()); //Parse URL-encoded bodies

// Middleware that reads cookie from requests to obtain list of polls user has taken already.
// Decodes the JWT and saves the list as array in req.userPolls
app.use(function (req, res, next) {
    if (!req.cookies.jwt) {
        console.log("app.js:80 no req.cookies.jwt!");
        req.userPolls = [];
        next();
    }
    else {
        let decoded = {};
        try {
            decoded = jwt.verify(req.cookies.jwt, JWTKEY);
        }
        catch (err) {
            console.log("error app.js:89 - " + err);
            req.userPolls = [];
            res.cookie('jwt', "", {
                expires: new Date(Date.now() - (100 * 24 * 60 * 60 * 1000)), httpOnly: true, sameSite: 'Strict'
            });
            next();
            // May want to set to expire here!
        }
        req.userPolls = decoded.polls;
        console.log("app.js:95 req.userPolls: " + req.userPolls);
        next();
    }
})


// https://www.digitalocean.com/community/tutorials/how-to-use-ejs-to-template-your-node-application
//  We can use res.render to load up an ejs view file
app.set("views", __dirname + "/views");
app.set('view engine', "ejs");
// serves ./views/pages/index.ejs, passes aVariable to page

process.on('SIGTERM', () => {
    server.close(() => {
        mongoose.connection.close();
        console.log('SIGTERM received. Process terminated.');
    });
});

const server = app.listen(port, function () {
    console.log('app.js running on port: ' + port);
});

app.get('/captcha.jpg', captcha.image());
//app.get(captchaMathUrl, captcha.math());


// Home page and poll creation
app.get('/', function (req, res) {
    res.render('pages/index',
        {
            aVariable: "hello",
            pageTitle: "PollCall - Create a poll & share it with friends!",
        });
});

// POST to / will create a poll when "poll form" is "submitted"
app.post('/', function (req, res) {
    const { question, answers, ipCheck, cookieCheck, captchaInput } = req.body;
    console.log("app.js:125 captchaInput: " + captchaInput);
    const validCaptcha = captcha.check(req, captchaInput);
    if (!validCaptcha) {
        console.log("Invalid captcha");
        return res.send({ "captchaPass": false });
    }

    const votes = new Array(answers.length);
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
            ipAddresses: []
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
            console.log("Error on creating poll: " + err);
            res.status(500).send(err);
        }
    })();
});

/*
// POST to / will create a poll when "poll form" is "submitted"
app.post('/', function (req, res) {
    const { question, answers, ipCheck, cookieCheck } = req.body;

    const votes = new Array(answers.length);
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
            ipAddresses: []
        });
        try {
            let resultPoll = await newPoll.save();
            const url = '/pollCreated/' + newPollId;
            //res.redirect(url); this sends the actual html of url page
            res.status(200).send({ result: 'redirect', url: url })
        }
        catch (err) {
            console.log("Error on creating poll: " + err);
            res.status(500).send(err);
        }
    })();
});
*/
app.post('/checkCaptcha', function (req, res) {
    console.log("app.js:166 req.data: " + req.data);
    
    console.log("app.js:165 req.body.data: " + req.body.data);
    console.log("app.js:169 req.body: " + req.body);
    console.dir(req.body);
    const input = req.body.one;
    console.log("input: " + input);

    const validCaptcha = captcha.check(req, input);
    if (!validCaptcha) {
        console.log("Invalid captcha");
        return res.send(false);
        //return res.end('Invalid Captcha!');
    }
    else {
        console.log("Valid capture");
        return res.send(true);
    }
});

app.get("/pollCreated/:pollId", function (req, res) {
    const pollID = req.params.pollId;
    // Construct the query
    var query = Poll.findOne({ pollID: pollID });
    // Run the query
    query.exec(function (err, result) {
        if (err) {
            const errString = "Error looking up poll of with id of " + pollID + ": " + err;
            console.log(errString);
            res.send(errString);
        }
        else {
            console.log("app.js:106 question is: " + result.question);
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

app.get('/about.html', function (req, res) {
    res.render('pages/about',
        {
            aVariable: 'About page',
            pageTitle: "Poll Call - About"
        });
});

// Route to take a poll
// Example: http://localhost:8080/poll/Xh-lEJ
app.get('/poll/:id', function (req, res) {
    console.log("app.js:168 getpoll and req.userPolls: " + req.userPolls);

    // Lookup the poll
    const paramPollID = req.params.id;
    var query = Poll.findOne({ pollID: paramPollID });
    query.exec(function (err, result) {
        if (err) {
            res.send("Error during poll lookup: " + err);
        }
        else {
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


// The results page
// Example: http://localhost:8080/results/Xh-lEJ
app.get('/results/:id', function (req, res) {
    console.log("app.js:192 req.userPolls: " + req.userPolls);

    // Lookup the poll
    const paramPollID = req.params.id;
    var query = Poll.findOne({ pollID: paramPollID });
    query.exec(function (err, result) {
        if (err) {
            res.send("Error during poll results lookup: " + err);
        }
        else {
            const thePoll = new Poll(result);

            res.render("pages/results", {
                pageTitle: "PollCall - Results: " + thePoll.question,
                question: thePoll.question,
                answers: thePoll.answers,
                pollID: thePoll.pollID,
                votes: thePoll.votes,
                voted: false,
                voteIndex: -1,
                dupVote: false
            })
        }
    });
});

app.post('/results/:pollId', function (req, res) {

    console.log('app.js:230 entering post to results & req.userPolls: ' + req.userPolls);
    const paramPollID = req.params.pollId;

    // Easiest to always set 
    if (!req.userPolls) {
        console.log("app.js:235 !req.userPolls");
        req.userPolls = [];
    }
    
    const voteIndex = req.body.voteIndex;
    let dupVote = false;

    var query = Poll.findOne({ pollID: paramPollID });
    query.exec(function (err, result) {
        if (err) {
            res.send("Error during poll results lookup: " + err);
        }
        else {
            const thePoll = new Poll(result);

            // never voted on this poll before so set cookie
            if (!req.userPolls.includes(paramPollID)) {
                console.log('app.js:231 pushing to userPolls paramPollID: ' + paramPollID);
                req.userPolls.push(paramPollID);
                console.log('req.userPolls is: ' + req.userPolls);
                var token = jwt.sign({ polls: req.userPolls }, JWTKEY);
                res.cookie('jwt', token, { expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), httpOnly: true, sameSite: 'Strict' });
            }
            // Below is the ip check or cookie check based rejection
            else if ((req.userPolls.includes(paramPollID) && thePoll.cookieCheck) ||
                (thePoll.ipAddresses.includes(getClientIp(req)) && thePoll.ipCheck == true))
            {
                console.log("app.js:255 Duplicate votes protection triggered!");
                return res.render("pages/results", {
                    pageTitle: "You've already voted once before!",
                    question: thePoll.question,
                    answers: thePoll.answers,
                    pollID: thePoll.pollID,
                    votes: thePoll.votes,
                    voted: false,
                    voteIndex: -1,
                    dupVote: true
                })
            }
            const ip = getClientIp(req);
            if (!thePoll.ipAddresses.includes(ip)) {
                thePoll.ipAddresses.push(ip);
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
                        voteIndex: voteIndex
                    }); // end render
                })(); // end iife
            } // end try
            catch (err) {
                console.log("Error saving poll: " + err);
                res.status(500).send(err);
            }
        }
    });
});

app.get('/results/img/:resultsImg', function (req, res) {
    const oImg = req.params.resultsImg;
    const rImg = oImg.slice(0, -4);
    var query = Poll.findOne({ pollID: rImg }); // FIX
    query.exec(function (err, result) {
        if (err) {
            res.send("Error during database lookup of poll with id " + rImg + ":" + err);
        }
        else {
            if (result == null) { // lookup didn't find that pollId
                res.status(404).send("Poll " + rImg + " not found!");
            }
            // else
            const thePoll = new Poll(result);
            const chartConf = {
                type: 'pie',                                // Show a bar chart
                data: {
                    labels: thePoll.answers,   // Set X-axis labels
                    datasets: [{
                        label: 'Answers',                         // Create the 'Users' dataset
                        data: thePoll.votes           // Add data to the chart
                    }]
                },
                options: {
                    title: {
                        display: true,
                        text: thePoll.question
                    }
                }
            } // end chartConf

            const chartConfigString = encodeURIComponent(JSON.stringify(chartConf));
            let url = 'https://quickchart.io/chart?c=' + chartConfigString;

            (async function getChart() {
                let response = await fetch(url);
                if (response.ok) { // if HTTP status is 200-299
                    const imgBlob = await response.blob(); 
                    res.type(imgBlob.type); // set response type
                    imgBlob.arrayBuffer().then(buf => {
                        res.send(Buffer.from(buf)) // displays in browser                        
                    })
                }
                else {
                    console.log("app.js:227 HTTP Error - QuickChart server responded: " + response.status);
                    res.send("HTTP Error - QuickChart server responded: " + response.status);
                }
            })();
        } // end else
    }); // end query.exec()
});

async function genPollId() {
    const candidate = nanoid(6);
    const searchResult = await Poll.findOne({ pollID: candidate });
    if (searchResult) {
        return genPollId();
    }
    else return candidate;
}

function getClientIp(req) {
  var ipAddress;
  // Amazon EC2 / Heroku workaround to get real client IP
  var forwardedIpsStr = req.header('x-forwarded-for'); 
  if (forwardedIpsStr) {
    // 'x-forwarded-for' header may return multiple IP addresses in
    // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
    // the first one
    var forwardedIps = forwardedIpsStr.split(',');
    ipAddress = forwardedIps[0];
  }
  if (!ipAddress) {
    // Ensure getting client IP address still works in
    // development environment
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
};