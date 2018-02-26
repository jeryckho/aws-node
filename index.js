var P = require("./lib/parrot");

exports.handler = (event, context, callback) => {
  return Promise.resolve(event)
    .then(obj => console.log(obj) || P.cleanHtml(obj))
    .then(obj => console.log(obj) || P.MD5fromText(obj))
    .then(obj => console.log(obj) || P.splitText(obj))
    .then(obj => {
      console.log(obj);
      obj.part = obj.parts[0];
      return P.vocalize(obj);
    })
    .then(obj => callback(null, { text: obj.text, md5: obj.md5, mp3: obj.mp3 }))
    .catch(err => callback(err));
};
