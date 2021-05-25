
// An example of poll creation
app.get('/test1', function (req, res) {

    /* For votes array during actual poll creation, use 
    let votes = new Array(answers.length);
    votes.fill(0);
    */
    (async function getID() {
        //const aPollID = getPollID2();
        const aPollID = await generatePollId();
        console.log("aPollID: " + aPollID);

        const apoll = new Poll({
            question: "Which color out of these is the best?",
            answers: ["Red", "Green", "Blue"], votes: [0, 0, 0],
            //pollID: 'XXXXXX', ipDupCheck: false,
            pollID: aPollID, ipDupCheck: false,
            cookieCheck: false, ipAdresses: []
        });
        apoll.save(function (err, poll) {
            if (err) {
                console.log("Error saving poll: " + err);
                res.send("Error saving poll: " + err);
            }
            console.log("Poll created: " + poll);
            res.json({ message: "Poll created", data: poll });

        });
    })();
});

// An example of poll creation using generatePollId
app.get('/test3', function (req, res) {

    /* For votes array during actual poll creation, use 
    let votes = new Array(answers.length);
    votes.fill(0);
    */
    const aPollID = generatePollId();
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

// Poll lookup test/example 
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


// Poll lookup. Returns a poll if one found with that ID. 
// Otherwise returns null.
function getPollById(pollID){
    return Poll.findOne({ pollID: pollID })
        .then(function (poll) {
            console.log("getPollById:224 Looked up: " + pollID + " Found: " + poll);
            return poll;		
        })
        .catch(function(err){
            console.log(err)
        });
} // end function getPoll

// Generates a new pollID. Uses getPollById
// Recursively calls itself if it finds a collision.
async function generatePollId() {
    const candidate = nanoid(6);
    var myRes = undefined;
    getPollById(candidate)
        .then(function (foundPoll) {
            console.log("foundPoll: " + foundPoll);
            if (foundPoll) {
                console.log("generatePollId:240 Found collision, so returning generatePollId()");
                return generatePollId();
            }
            else if(foundPoll === null){
                console.log("generatePollId:245 No collision found so returning candidate: " + candidate);
                myRes = candidate;
                return candidate; // WORKS & PRINTS CORRECTLY
            }
        })
    console.log('generatePollId:251 myRes is: ' + myRes);
    return myRes;
}

app.get('/test5', function (req, res) {
    let result = undefined;
    (async () => {
        const result = await generatePollId();
        console.log("test5 route app.js:259 result is: " + result); // 
        res.send("Result: " + result);
    })();
})

/************ END TEST5 **********/

// Generates a new pollID. 
// Appends timestamp to pollId returned if it finds a collision
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

