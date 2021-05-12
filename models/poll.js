var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// See https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose
// See: https://mongoosejs.com/docs/guide.html
// or https://masteringjs.io/tutorials/mongoose/schema

// Each schema maps to a MongoDB collection and 
// defines the shape of documents in that collection
const PollSchema = new Schema({
    question: String,
    answers: [String],
    votes: [Number],
    resultsID: String,
    adminID: String,
    shareID: String,
    createdOn: { type: Date, default: Date.now },
    expiresOn: Date,
    privateResults: Boolean,
    ipDupCheck: Boolean,
    cookieCheck: Boolean,
    ipAddresses: [String]
});

// Convert PollSchema into a Model we can work with
module.exports = mongoose.model('Poll', PollSchema);
