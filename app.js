const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { nanoid } = require('nanoid'); // Generaotes unique pollIDs
const fetch = require('node-fetch');

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

//app.use(express.json());

// using body parser to parse the body of incoming post requests
app.use(
  require("body-parser").urlencoded({
    extended: true, // must give a value for extended
  })
);

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
    console.log(req.body);
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
            ipDupCheck: ipCheck,
            cookieCheck: cookieCheck,
            ipAddresses: []
        });
        try {
            let resultPoll = await newPoll.save();
            console.log("Poll created successfully.");
            console.log(resultPoll);
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
            console.log("Successful lookup with result: " + result);
            res.render('pages/pollCreated', {
                pageTitle: "Poll Created - " + result.question,
                poll: result,
                pollId: result.pollID
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
    // Lookup the poll
    const paramPollID = req.params.id;
    var query = Poll.findOne({ pollID: paramPollID });
    query.exec(function (err, result) {
        if (err) {
            console.log("Error looking up poll: " + err);
            res.send("Error during poll lookup: " + err);
        }
        else {
            console.log("Successful lookup: " + result);
            
            const thePoll = new Poll(result);
            // Check IP/Cookie options from result, do accordingly
            // forward to results with res.redirect &  a "Already voted message" 
            // Otherwise, display the poll for voting
            // http://expressjs.com/en/resources/middleware/cookie-parser.html
            // https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie

            res.render("pages/poll", {
                pageTitle: "PollCall - Poll: " + thePoll.question,
                question: thePoll.question,
                answers: thePoll.answers,
                pollID: thePoll.pollID,
            })
        }
    });
});

// The results page
// Example: http://localhost:8080/results/Xh-lEJ
app.get('/results/:id', function (req, res) {
    // Lookup the poll
    const paramPollID = req.params.id;
    var query = Poll.findOne({ pollID: paramPollID });
    query.exec(function (err, result) {
        if (err) {
            console.log("Error looking up poll results: " + err);
            res.send("Error during poll results lookup: " + err);
        }
        else {
            console.log("Successful lookup of results: " + result);
            
            const thePoll = new Poll(result);

            res.render("pages/results", {
                pageTitle: "PollCall - Results: " + thePoll.question,
                question: thePoll.question,
                answers: thePoll.answers,
                pollID: thePoll.pollID,
                votes: thePoll.votes,
            })
        }
    });
});

app.get('/results/img/:resultsImg', function (req, res) {
    console.log("results/img/:resultsImg route entered");
    const oImg = req.params.resultsImg;
    const rImg = oImg.slice(0, -4);
    var query = Poll.findOne({ pollID: rImg }); // FIX
    query.exec(function (err, result) {
        if (err) {
            console.log("Error looking up poll results: " + err);
            //res.send("Error during poll results lookup: " + err);
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
            console.log("url: " + url);

            (async function getChart() {
                let response = await fetch(url);
                if (response.ok) { // if HTTP status is 200-299
                    const imgBlob = await response.blob();
                    console.log("blob type: " + typeof imgBlob);
                    console.dir(imgBlob);
                    //res.send(imgBlob); //ok but shows in browser and no rename
                    //res.download(imgBlob, rImg + ".png"); No because 1st arg must be file path
                    /*
                    res.setHeader('Content-Disposition', 'attachment; filename=' + rImg + ".png");
                    res.setHeader('Content-Transfer-Encoding', 'binary');
                    res.setHeader('Content-Type', 'application/octet-stream');
                    res.sendFile(imgBlob);
                    */
                    
                    res.type(imgBlob.type);
                    imgBlob.arrayBuffer().then(buf => {
                        res.send(Buffer.from(buf)) // displays in browser
                        
                    })
                }
                else {
                    console.log("HTTP Error: " + response.status);
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
