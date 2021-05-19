const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { nanoid } = require('nanoid'); // Generaotes unique pollIDs

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
    
    // Create poll in database
    // If successful display share poll link and link to results, etc
    // See ./test1 for example of poll creation
})

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

// An example of poll creation
app.get('/test1', function (req, res) {

    /* For votes array during actual poll creation, use 
    let votes = new Array(answers.length);
    votes.fill(0);
    */
    (async function getID() {
        const aPollID = getPollID2();
        console.log("aPollID: " + aPollID);

        const apoll = new Poll({
            question: "Which color out of these is the best?",
            answers: ["Red", "Green", "Blue"], votes: [0, 0, 0],
            pollID: 'XXXXXX', ipDupCheck: false,
            cookieCheck: false, ipAdresses: []
        });
        apoll.save(function (err, poll) {
            if (err) {
                console.err("Error saving poll: " + err);
                res.send("Error saving poll: " + err);
            }
            res.json({ message: "Poll created", data: poll });
        });
    })();
});

// An example of poll creation using getPollID2
app.get('/test3', function (req, res) {

    /* For votes array during actual poll creation, use 
    let votes = new Array(answers.length);
    votes.fill(0);
    */
    const aPollID = getPollID2();
    aPollID.then(value => {
        console.log("aPollID returned: " + value);
        const apoll = new Poll({
            question: "Which color out of these is the best?",
            answers: ["Red", "Green", "Blue"], votes: [0, 0, 0],
            pollID: value, ipDupCheck: false,
            cookieCheck: false, ipAdresses: []
        });
        apoll.save(function (err, poll) {
            if (err) {
                console.err("Error saving poll: " + err);
                res.send("Error saving poll: " + err);
            }
            res.json({ message: "Poll created", data: poll });
        });
    })         
});


app.get('/test4', function (req, res) {
    function getPoll(pollID){
	    return Poll.findOne({ pollID: pollID })
		    .then(function(poll){
			    return poll;		
		    })
		    .catch(function(err){
			    console.log(err)
            });
        
    } // end function getPoll

    getPoll('XXXXXa')
	    .then(function(poll){
		    console.log(poll);
		    res.send(poll);
	    });

}); // cool - outputs the found poll json or null


/************************** NEXT THREE IS TEST5 ************/
// Test four above checks for existing poll with a given pollID
// Test five (this) attempts to build on that to generate a new pollID

function getPollExt(pollID){
    return Poll.findOne({ pollID: pollID })
        .then(function (poll) {
            console.log("getPollExt:207 either null or a poll. Returning: " + poll);
            return poll;		
        })
        .catch(function(err){
            console.log(err)
        });
} // end function getPoll

async function getPollIDExt() {
    const candidate = nanoid(6);
    var myRes = undefined;
    getPollExt(candidate)
        .then(function (foundPoll) {
            console.log("foundPoll: " + foundPoll);
            if (foundPoll) {
                console.log("getPollIDExt:219 Found, so returning getPollIDExt()");
                myRes = getPollIDExt();
                return getPollIDExt();
            }
            else if(foundPoll === null){
                console.log("getPollIDExt:227 Not found so returning candidate: " + candidate);
                myRes = candidate;
                return candidate; // WORKS & PRINTS CORRECTLY
            }

        })
    console.log('getPollIDExt:235 myRes is: ' + myRes);
    return myRes;
}
app.get('/test5', function (req, res) {
    let result = undefined;
    (async () => {
        const result = await getPollIDExt();
        console.log("test5 route:231 result is: " + result); // 
        res.send("Result: " + result);
    })();
})

/************ END TEST5 **********/

function getPollID2(){
    let candidate = nanoid(6);
    // let candidate = "XXXXXX"; // used for testing of duplicate catching

    return new Promise((resolve, reject) => {
        Poll.findOne({ pollID: candidate }, function (err, result) {
            if (err) {
                console.err("Error in findOne during getPollID2(): " + err);
                reject(err);
            }
            else {
                if (result === null) {
                    console.log("getPollID2 result was null so no dupes found, resolving: " + candidate);
                    resolve(candidate);
                }
                else { // THIS IS A TERRIBLE HACK BECAUSE I COULDN'T RECURSIVELY CALL TO GENERATE A NEW NANOID
                    console.log("getPollID2 dupe found, appending timestamp"); 
                    const newCandidate = Date.now().toString() + "-" + candidate;
                    resolve(newCandidate); // example: 1621443230717-XXXXXX
                }
            }
        });
    });
}

