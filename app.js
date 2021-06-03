const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { nanoid } = require('nanoid'); // Generaotes unique pollIDs
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const JWTKEY = 'Z9je9kxoW8XKLUyi5h7tP7yhpgk9';

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

app.use(cookieParser()); // puts cookies in req.headers.cookie

// Middleware that reads cookie from requests to obtain list of polls user has taken already.
// Decodes the JWT and saves the list as array in req.userPolls
app.use(function (req, res, next) {
    if (!req.headers.cookie) {
        req.userPolls = [];
        next();
    }
    else {
        const rawCookies = req.headers.cookie.split(';');
        //console.log("rawCookies: " + rawCookies);

        const parsedCookies = {};
        rawCookies.forEach(rc => {
            const parsedCookie = rc.split('=');
            //console.log("app.js:44 parsedCookie: " + parsedCookie);

            parsedCookies[parsedCookie[0].trim()] = parsedCookie[1];
            //console.log('app.js:41 parsedCookies: ' + parsedCookies);
        });
        //console.log('app.js:42 parsedCookies: ' + parsedCookies);
        
        //console.log('app.js:45 parsedCookies.jwt: ' + parsedCookies.jwt);
        var decoded = jwt.verify(parsedCookies.jwt, JWTKEY);
        //console.dir(decoded);
        //console.log("app.js:55 decoded.polls: " + decoded.polls);
      
        req.userPolls = decoded.polls;
        next();
    }
});

// Static folder to serve from https://expressjs.com/en/starter/static-files.html
app.use(express.static(__dirname + '/static')); // Tested by http://localhost:8080/img/kitten.jpg

//app.use(express.json());

// using body parser to parse the body of incoming post requests
app.use(bodyParser.urlencoded({
    extended: true, // must give a value for extended
  })
);

//app.use(express.urlencoded()); //Parse URL-encoded bodies

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


// Home page and poll creation
app.get('/', function (req, res) {
    // index should have the "poll form"
    res.render('pages/index',
        {
            aVariable: "hello",
            pageTitle: "PollCall - Create a poll & share it with friends!"
        });
});

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
                res.cookie('jwt', token, { expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) });
            }
            //****************** THESE TWO NEED FINISHED  */
            else if ((req.userPolls.includes(paramPollID) && thePoll.cookieCheck) ||
                (thePoll.ipAddresses.includes(req.ip) && thePoll.ipCheck == true))
            {
                console.log("dupe vote cookie check bounce");
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
            if (!thePoll.ipAddresses.includes(req.ip)) {
                thePoll.ipAddresses.push(req.ip);
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
