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

// Define static functions to find by IDs
// NOT TESTED YET - they're new to me
PollSchema.statics.findByAdminID = function (adminID) {
    return this.find({ adminID: adminID });
}
PollSchema.statics.findByShareID = function (adminID) {
    return this.find({ shareID: shareID });
}
PollSchema.statics.findByResID = function (adminID) {
    return this.find({ resultsID: resultsID });
}
// STILL NEED TO TEST OUT ABOVE functions
// let found = await Poll.findByAdminID('XYZ'); 


// Convert PollSchema into a Model we can work with
module.exports = mongoose.model('Poll', PollSchema);
