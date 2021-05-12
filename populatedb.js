require('dotenv').config();
const mongoDB = process.env.MONGO_URI;

const async = require('async');
const Poll = require('./models/poll');

const mongoose = require('mongoose');
mongoose.connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error: '));

var polls = [];


function pollCreate(ques, ans, vots, resID, admID, sharID, expirOn, privRes, ipdCheck, cookCheck, cb) {
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
            cb(err, null);
            return;
        }
        console.log("New poll: " + apoll);
        polls.push(apoll);
        cb(null, apoll);
    });
}

function createPolls(cb) {
    async.series([
        function (callback) {
            pollCreate(
                "Is Node a good app server?",
                ["Yes", "No", "Maybe"],
                [0, 0, 0],
                "XYZ444",
                "UPE877",
                "QMO993",
                null,
                false,
                true,
                false,
                callback
            )
        },
        function (callback) {
            pollCreate(
                "Is React a good frontend framework?",
                ["Yes", "No", "Maybe"],
                [0, 0, 0],
                "PYZ782",
                "XPE822",
                "NMO949",
                null,
                false,
                true,
                false,
                callback
            )
        },
    ],
        // optional callback
        cb);
    
} // end createPolls()

async.series([
    createPolls,
    ],
    // Optional callback
    function (err, results) {
        if (err) {
            console.log('FINAL ERR: ' + err);
        }
        else {
            console.log('Polls: ' + polls);
        }
        // All done, disconnect from DB
        mongoose.connection.close();
    }
);

