"use strict";

var S3 = require("aws-sdk/clients/s3");
var Polly = require("aws-sdk/clients/polly");
var JSSoup = require("jssoup").default;
var MD5 = require("md5");
var he = require("he");

function requiredParam(param) {
  const requiredParamError = new Error(
    `Required parameter, "${param}" is missing.`
  );

  // preserve original stack trace
  if (typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(requiredParamError, requiredParam);
  }

  throw requiredParamError;
}

class Parrot {
  cleanHtml({ html, ...rest } = {}) {
    var soup = new JSSoup(html);
    var text = he.decode(soup.text);
    return {
      html,
      text,
      ...rest
    };
  }

  MD5fromText({ text, ...rest } = {}) {
    var md5 = MD5(text);
    return {
      md5,
      text,
      ...rest
    };
  }

  // findFromMD5({ md5, ...rest } = {}) {
  //   //TODO
  //   return {
  //     md5,
  //     hasS3,
  //     s3Object,
  //     ...rest
  //   };
  // }

  splitText({ text, limit = 1000, ...rest } = {}) {
    var regex = new RegExp("^[^]{" + limit + "}[^\\.]+\\.");
    var parts = [];
    var crt = text;
    while (crt.length > limit) {
      var res = crt.match(regex);
      if (res) {
        parts.push(res[0]);
        crt = crt.replace(regex, "");
      }
    }
    if (crt !== "") {
      parts.push(crt);
    }
    return {
      text,
      parts,
      ...rest
    };
  }

  textToSpeech({ text, ...rest } = {}) {
    return Promise.resolve({ text })
      .then(obj => this.splitText(obj))
      .then(obj => Promise.all(obj.parts.map(part => this.partToSpeech({ part }))))
      .then(objs => objs.reduce((mp3s, obj) => mp3s.push(obj.mp3), []))
      .then(mp3 => Buffer.concat(mp3s))
      .then(mp3 => ({ text, mp3, ...rest }));
  }

  partToSpeech({ part, speaker = "Celine", ...rest } = {}) {
    var polly = new Polly({
      apiVersion: "2016-06-10",
      region: "eu-west-1"
    });
    var params = {
      OutputFormat: "mp3",
      Text: part,
      VoiceId: speaker
    };
    return new Promise((resolve, reject) => {
      polly.synthesizeSpeech(params, function (error, speech) {
        if (error) {
          return reject(error);
        }
        return resolve({
          part,
          mp3: speech.AudioStream,
          ...rest
        });
      });
    });
  }

  listBucket({ bucket = "test-jchery", ...rest } = {}) {
    var s3Bucket = new S3({
      params: { Bucket: bucket },
      apiVersion: "2006-03-01",
      region: "eu-west-1"
    });

    return new Promise((resolve, reject) => {
      s3Bucket.listObjects({ Delimiter: "/" }, function (error, s3Objects) {
        if (error) {
          return reject(error);
        }
        return resolve({
          bucket,
          s3Objects,
          ...rest
        });
      });
    });
  }

  mergeMP3({ mp3List, ...rest } = {}) {
    var mp3 = "e";
    return {
      mp3List,
      mp3,
      ...rest
    };
  }
}

module.exports = new Parrot();
