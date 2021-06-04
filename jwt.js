const jwt = require('jsonwebtoken');

const JWTKEY = 'Z9je9kxoW8XKLUyi5h7tP7yhpgk9';

let polls = ['guigiua', 'gg8ale'];

let blankPolls = [];

const cookieConf = { expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) };

let token = jwt.sign({ blankPolls }, JWTKEY);

let decodedBlank = jwt.verify(token, JWTKEY);

console.log("decodedBlank: " + decodedBlank);
console.dir(decodedBlank);

//decodedBlank.blankPolls is[];