var P = require("./parrot.js");

exports.handler = (event, context, callback) => {
  return Promise.resolve(event)
    .then(obj => P.cleanHtml(obj))
    .then(obj => P.mkMD5(obj))
    .then(obj => P.checkInBucket(obj))
    .then(
      obj => obj.found
          ? obj
          : Promise.resolve(obj)
              .then(obj => P.textToSSMLSpeech(obj))
              .then(obj => P.saveToBucket(obj))
    )
    .then(obj => callback(null, obj))
    .catch(err => callback(err));
};
