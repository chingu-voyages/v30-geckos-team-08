var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// See https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose
// See: https://mongoosejs.com/docs/guide.html
// or https://masteringjs.io/tutorials/mongoose/schema

// Each schema maps to a MongoDB collection and 
// defines the shape of documents in that collection
const PollSchema = new Schema({
    question: String,
    answers: [String], // ex: ["Yes", "No", "Maybe"]
    votes: [Number], // corresponds with answers array. ex: [3, 7, 0]
    pollID: String,
    //adminID: String, // no longer needed
    //shareID: String, // no longer needed
    createdOn: { type: Date, default: Date.now },
    //expiresOn: Date, // no longer needed unless we add feature later
    //privateResults: Boolean, // no longer needed unless we add feature later
    ipCheck: Boolean,
    cookieCheck: Boolean,
    ipAddresses: [String]
});

// Convert PollSchema into a Model we can work with
module.exports = mongoose.model('Poll', PollSchema);
