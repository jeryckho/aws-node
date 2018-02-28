"use strict";

var S3 = require("aws-sdk/clients/s3");
var Polly = require("aws-sdk/clients/polly");
var JSSoup = require("jssoup").default;
var MD5 = require("md5");
var he = require("he");

class Parrot {
  cleanHtml({ html, ...rest } = {}) {
    var soup = new JSSoup(html);
    var text = he.decode(soup.text);
    var md5 = MD5(text);
    return {
      html,
      text,
      md5,
      ...rest
    };
  }

  splitText({ text, limit = 1000, ...rest } = {}) {
    var regex = new RegExp("^[^]{" + limit + "}[^\\.]+\\.");
    var parts = [];
    var crt = text;
    while (crt.length > limit) {
      var res = crt.match(regex);
      if (res) {
        parts.push(res[0]);
        crt = crt.replace(regex, "");
      } else {
        parts.push(crt);
        crt = "";
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

  mergeMp3s(mp3Array) {
    objs.reduce((mp3s, obj) => {
      mp3s.push(obj.mp3);
      return mp3s;
    }, []);
    return Buffer.concat(mp3s);
  }

  textToSpeech({ text, speaker = "Celine", ...rest } = {}) {
    return Promise.resolve({ text })
      .then(obj => console.log("Split") || this.splitText(obj))
      .then(
        obj =>
          console.log("Speech") ||
          Promise.all(obj.parts.map(part => this.partToSpeech({ part, speaker })))
      )
      .then(mp3Array => console.log("Merge") || this.mergeMp3s(mp3Array))
      .then(mp3 => console.log("Ret") || { text, mp3, ...rest });
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

  checkInBucket({ bucket = "test-jchery", md5, uid, ...rest } = {}) {
    var s3Bucket = new S3({
      params: { Bucket: bucket },
      apiVersion: "2006-03-01",
      region: "eu-west-1"
    });
    var name = uid ? uid : md5;
    var link = `http://${bucket}.s3-website.eu-west-1.amazonaws.com/${name}.mp3`;

    return new Promise((resolve, reject) => {
      s3Bucket.headObject({ Key: name + ".mp3" }, function (
        error,
        s3Object
      ) {
        if (!error) {
          return resolve({
            found: true,
            bucket,
            link,
            md5,
            uid,
            ...rest
          });
        }
        if (error.code === "NotFound") {
          return resolve({
            found: false,
            bucket,
            md5,
            uid,
            ...rest
          });
        }
        return reject(error);
      });
    });
  }

  saveToBucket({ bucket = "test-jchery", mp3, md5, uid, ...rest } = {}) {
    var s3Bucket = new S3({
      params: { Bucket: bucket },
      apiVersion: "2006-03-01",
      region: "eu-west-1"
    });

    var name = uid ? uid : md5;
    var link = `http://${bucket}.s3-website.eu-west-1.amazonaws.com/${name}.mp3`;

    return new Promise((resolve, reject) => {
      s3Bucket.putObject({ Key: name + ".mp3", Body: mp3 }, function (
        error,
        s3Object
      ) {
        if (error) {
          return reject(error);
        }
        return resolve({
          bucket,
          s3Object,
          link,
          md5,
          uid,
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
}

module.exports = new Parrot();
