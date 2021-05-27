/*  From poll form - colors 

light grey background of poll form
background-color: #ebedf0;
rgb(235, 237, 240)

reddish of question field
rgba(236, 188, 174, 0.97)
#ecbcaef7

light aqua of answer inputs
rgb(189, 235, 228)
background-color: hsl(172, 53%, 83%);

green of buttons
rgb(99, 189, 126)
background-color: #63bd7e;
*/
/* SOCIAL SHARING NOTES
Zenhub issue: 
Create reusable component for sharing poll link, (and also link for home page?)
-Url to copy/send and also social media options (Facebook, Twitter, Reddit, LinkedIn)

https://www.lcn.com/blog/complete-guide-social-media-markup/
http://www.sharelinkgenerator.com/

Need to properly embed OG OpenGraph metatags for respective poll, maybe a picture of a generic pie graph

https://www.reddit.com/submit?url=https://strawpoll.com/dg9kp6ser&title=What%20is%20the%20best%20color%20out%20of%20these%20options?

I found two different ones suggested....
http://www.twitter.com/share?text=What%20is%20the%20best%20color%20out%20of%20these%20options?&url=https://strawpoll.com/dg9kp6ser
https://twitter.com/intent/tweet?url=https%3A%2F%2Fpoll-call.herokuapp.com%2Fpoll%2Fxyz&text=PollCall%20Poll%20-%20Poll%20Title%20Here
https://twitter.com/intent/tweet
?url=http%3A%2F%2Fcss-tricks.com%2F
&text=Tips%2C+Tricks%2C+and+Techniques+on+using+Cascading+Style+Sheets.
&hashtags=css,html


https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fpoll-call.herokuapp.com%2Fpoll%2Fxyz
https://www.facebook.com/sharer/sharer.php?u=https://strawpoll.com/dg9kp6ser

http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fpoll-call.herokuapp.com%2Fpoll%2Fxyz&title=PollCall%20Poll%20-%20Poll%20Title%20Here
https://www.linkedin.com/shareArticle
?mini=true
&url=https%3A%2F%2Fwww.css-tricks.com%2F
&title=CSS-Tricks
&summary=Tips%2C+Tricks%2C+and+Techniques+on+using+Cascading+Style+Sheets.
&source=CSS-Tricks
linkedin will grab title from og:title and summary from og:description 

HOW to pass variables to partial
<%-include("partials/profile", {fullName:fullName}) %>

HOW to access ejs variable in client JS
<% if (gameState) { %>
     <h2>I have a game state!</h2>
     <script>
        var clientGameState = <%= gameState %>            
     </script>
<% } %>


Because the page is just string when rendered, you have to turn the data in a string, then parse it again in js. In my case my data was a JSON array, so:

<script>
  var test = '<%- JSON.stringify(sampleJsonData) %>'; // test is now a valid js object
</script>

*/


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


/******************* */

$('table').on('input', function() {
  var url = encodeURIComponent($('#url').val());
  var tweet = encodeURIComponent($('#tweet').val());
  var title = encodeURIComponent($('#title').val());
  var summary = encodeURIComponent($('#summary').val());
  
  var hashtags = $('#hashtags').val();
  hashtags = hashtags.replace(/\s+/g, '');
  hashtags = hashtags.replace(/#/g, '');
  hashtags = encodeURIComponent(hashtags);
  hashtags = hashtags.replace(/%2C/g, ',');
  
  facebook = '<li><a href="https://www.facebook.com/sharer.php?u=' + url + '">Share on Facebook</a></li>';
  
  twitter = '<li><a href="https://twitter.com/intent/tweet?url=' + url;
  if (tweet != "") { twitter += '&text=' + tweet };
  if (hashtags != "") { twitter += '&hashtags=' + hashtags };
  twitter += '">Share on Twitter</a></li>';

  linkedin = '<li><a href="https://www.linkedin.com/shareArticle?mini=true&url=' + url + '&title=' + title + '&summary=' + summary + '">Share on LinkedIn</a></li>';
  linkedin = '<li><a href="https://www.linkedin.com/shareArticle?mini=true&url=' + url;
  if (title != "") { linkedin += '&title=' + title };
  if (summary != "") { linkedin += '&summary=' + summary };
  linkedin += '">Share on LinkedIn</a></li>';

  $('textarea').text(facebook + '\n' + twitter + '\n' + linkedin);
});

$('button').on('click', function() {
  document.querySelector("#share-links").select();
  document.execCommand('copy');
});