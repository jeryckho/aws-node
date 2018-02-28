"use strict";

var S3 = require("aws-sdk/clients/s3");
var Polly = require("aws-sdk/clients/polly");
var JSSoup = require("jssoup").default;
var MD5 = require("md5");
var he = require("he");

class Parrot {
  cleanHtml({ html, ...rest } = {}) {
    let text, md5;
    if (Array.isArray(html)) {
      text = html.map(htm => {
        let soup = new JSSoup(htm);
        return he.decode(soup.text);
      });
    } else {
      let soup = new JSSoup(html);
      text = he.decode(soup.text);
    }
    return {
      html,
      text,
      ...rest
    };
  }

  mkMD5({ text, title, chapo, ...rest } = {}) {
    let list, md5;
    if (Array.isArray(text)) {
      list = text.slice(0);
    } else {
      list = [text];
    }
    if (chapo) {
      list.unshift(chapo);
    }
    if (title) {
      list.unshift(title);
    }
    md5 = MD5(list.join("\n"));
    return {
      title,
      text,
      chapo,
      md5,
      ...rest
    };
  }

  splitSSML({ text, title, chapo, limit = 1500, ...rest } = {}) {
    let list;
    if (Array.isArray(text)) {
      list = text.slice(0);
    } else {
      list = [text];
    }
    if (chapo) {
      list.unshift(chapo);
    }
    if (title) {
      list.unshift(title);
    }

    //TODO

    // list.reduce((acc, crt, idx, arr) => {
    //   let len = crt.length;
    //   if (acc.size + len >= limit) {
    //     acc.size = 0;
    //     acc.res.push(acc.stack)
    //     acc.stack = '';
    //   }
    // }, { stack :'', size: 0, res: [] });

    // // for(let i = 0, len = list.length; i < len; ++i) {

    // // }

    return {
      title,
      text,
      chapo,
      ...rest
    };   
  }

  splitText({ text, limit = 1000, ...rest } = {}) {
    var regex = new RegExp("^[^]{" + limit + "}[^\\.]+\\.");
    let parts = [];
    let crt = Array.isArray(text) ? text.join("\n") : text;
    while (crt.length > limit) {
      let res = crt.match(regex);
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
          Promise.all(
            obj.parts.map(part => this.partToSpeech({ part, speaker }))
          )
      )
      .then(mp3Array => console.log("Merge") || this.mergeMp3s(mp3Array))
      .then(mp3 => console.log("Ret") || { text, mp3, ...rest });
  }

  partToSpeech({ part, speaker = "Celine", ...rest } = {}) {
    let polly = new Polly({
      apiVersion: "2016-06-10",
      region: "eu-west-1"
    });
    let params = {
      OutputFormat: "mp3",
      Text: part,
      VoiceId: speaker
    };
    return new Promise((resolve, reject) => {
      polly.synthesizeSpeech(params, (error, speech) => {
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
    let name = uid ? uid : md5;
    let link = `http://${bucket}.s3-website.eu-west-1.amazonaws.com/${name}.mp3`;

    return new Promise((resolve, reject) => {
      s3Bucket.headObject({ Key: name + ".mp3" }, (error, s3Object) => {
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

    let name = uid ? uid : md5;
    let link = `http://${bucket}.s3-website.eu-west-1.amazonaws.com/${name}.mp3`;

    return new Promise((resolve, reject) => {
      s3Bucket.putObject(
        { Key: name + ".mp3", Body: mp3 },
        (error, s3Object) => {
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
        }
      );
    });
  }

  listBucket({ bucket = "test-jchery", ...rest } = {}) {
    var s3Bucket = new S3({
      params: { Bucket: bucket },
      apiVersion: "2006-03-01",
      region: "eu-west-1"
    });

    return new Promise((resolve, reject) => {
      s3Bucket.listObjects({ Delimiter: "/" }, (error, s3Objects) => {
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
