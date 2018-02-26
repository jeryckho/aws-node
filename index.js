var P = require("./lib/parrot");

exports.handler = (event, context, callback) => {
  return Promise.resolve(event)
    .then(obj => console.log(obj) || P.cleanHtml(obj))
    .then(obj => console.log(obj) || P.textToSpeech(obj))
    .then(obj => callback(null, obj))
    .catch(err => callback(err));
};
