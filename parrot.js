"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var S3 = require("aws-sdk/clients/s3");
var Polly = require("aws-sdk/clients/polly");
var JSSoup = require("jssoup").default;
var MD5 = require("md5");
var he = require("he");

var Parrot = function () {
  function Parrot() {
    _classCallCheck(this, Parrot);
  }

  _createClass(Parrot, [{
    key: "cleanHtml",
    value: function cleanHtml() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var html = _ref.html,
          rest = _objectWithoutProperties(_ref, ["html"]);

      var text = void 0,
          md5 = void 0;
      if (Array.isArray(html)) {
        text = html.map(function (htm) {
          var soup = new JSSoup(htm);
          return he.decode(soup.text);
        });
      } else {
        var soup = new JSSoup(html);
        text = he.decode(soup.text);
      }
      return _extends({
        html: html,
        text: text
      }, rest);
    }
  }, {
    key: "mkMD5",
    value: function mkMD5() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var text = _ref2.text,
          title = _ref2.title,
          chapo = _ref2.chapo,
          rest = _objectWithoutProperties(_ref2, ["text", "title", "chapo"]);

      var list = void 0,
          md5 = void 0;
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
      return _extends({
        title: title,
        text: text,
        chapo: chapo,
        md5: md5
      }, rest);
    }
  }, {
    key: "splitSSML",
    value: function splitSSML() {
      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var text = _ref3.text,
          title = _ref3.title,
          chapo = _ref3.chapo,
          _ref3$limit = _ref3.limit,
          limit = _ref3$limit === undefined ? 1500 : _ref3$limit,
          rest = _objectWithoutProperties(_ref3, ["text", "title", "chapo", "limit"]);

      var list = void 0;
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

      return _extends({
        title: title,
        text: text,
        chapo: chapo
      }, rest);
    }
  }, {
    key: "splitText",
    value: function splitText() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var text = _ref4.text,
          _ref4$limit = _ref4.limit,
          limit = _ref4$limit === undefined ? 1000 : _ref4$limit,
          rest = _objectWithoutProperties(_ref4, ["text", "limit"]);

      var regex = new RegExp("^[^]{" + limit + "}[^\\.]+\\.");
      var parts = [];
      var crt = Array.isArray(text) ? text.join("\n") : text;
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
      return _extends({
        text: text,
        parts: parts
      }, rest);
    }
  }, {
    key: "mergeMp3s",
    value: function mergeMp3s(mp3Array) {
      objs.reduce(function (mp3s, obj) {
        mp3s.push(obj.mp3);
        return mp3s;
      }, []);
      return Buffer.concat(mp3s);
    }
  }, {
    key: "textToSpeech",
    value: function textToSpeech() {
      var _this = this;

      var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var text = _ref5.text,
          _ref5$speaker = _ref5.speaker,
          speaker = _ref5$speaker === undefined ? "Celine" : _ref5$speaker,
          rest = _objectWithoutProperties(_ref5, ["text", "speaker"]);

      return Promise.resolve({ text: text }).then(function (obj) {
        return console.log("Split") || _this.splitText(obj);
      }).then(function (obj) {
        return console.log("Speech") || Promise.all(obj.parts.map(function (part) {
          return _this.partToSpeech({ part: part, speaker: speaker });
        }));
      }).then(function (mp3Array) {
        return console.log("Merge") || _this.mergeMp3s(mp3Array);
      }).then(function (mp3) {
        return console.log("Ret") || _extends({ text: text, mp3: mp3 }, rest);
      });
    }
  }, {
    key: "partToSpeech",
    value: function partToSpeech() {
      var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var part = _ref6.part,
          _ref6$speaker = _ref6.speaker,
          speaker = _ref6$speaker === undefined ? "Celine" : _ref6$speaker,
          rest = _objectWithoutProperties(_ref6, ["part", "speaker"]);

      var polly = new Polly({
        apiVersion: "2016-06-10",
        region: "eu-west-1"
      });
      var params = {
        OutputFormat: "mp3",
        Text: part,
        VoiceId: speaker
      };
      return new Promise(function (resolve, reject) {
        polly.synthesizeSpeech(params, function (error, speech) {
          if (error) {
            return reject(error);
          }
          return resolve(_extends({
            part: part,
            mp3: speech.AudioStream
          }, rest));
        });
      });
    }
  }, {
    key: "checkInBucket",
    value: function checkInBucket() {
      var _ref7 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref7$bucket = _ref7.bucket,
          bucket = _ref7$bucket === undefined ? "test-jchery" : _ref7$bucket,
          md5 = _ref7.md5,
          uid = _ref7.uid,
          rest = _objectWithoutProperties(_ref7, ["bucket", "md5", "uid"]);

      var s3Bucket = new S3({
        params: { Bucket: bucket },
        apiVersion: "2006-03-01",
        region: "eu-west-1"
      });
      var name = uid ? uid : md5;
      var link = "http://" + bucket + ".s3-website.eu-west-1.amazonaws.com/" + name + ".mp3";

      return new Promise(function (resolve, reject) {
        s3Bucket.headObject({ Key: name + ".mp3" }, function (error, s3Object) {
          if (!error) {
            return resolve(_extends({
              found: true,
              bucket: bucket,
              link: link,
              md5: md5,
              uid: uid
            }, rest));
          }
          if (error.code === "NotFound") {
            return resolve(_extends({
              found: false,
              bucket: bucket,
              md5: md5,
              uid: uid
            }, rest));
          }
          return reject(error);
        });
      });
    }
  }, {
    key: "saveToBucket",
    value: function saveToBucket() {
      var _ref8 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref8$bucket = _ref8.bucket,
          bucket = _ref8$bucket === undefined ? "test-jchery" : _ref8$bucket,
          mp3 = _ref8.mp3,
          md5 = _ref8.md5,
          uid = _ref8.uid,
          rest = _objectWithoutProperties(_ref8, ["bucket", "mp3", "md5", "uid"]);

      var s3Bucket = new S3({
        params: { Bucket: bucket },
        apiVersion: "2006-03-01",
        region: "eu-west-1"
      });

      var name = uid ? uid : md5;
      var link = "http://" + bucket + ".s3-website.eu-west-1.amazonaws.com/" + name + ".mp3";

      return new Promise(function (resolve, reject) {
        s3Bucket.putObject({ Key: name + ".mp3", Body: mp3 }, function (error, s3Object) {
          if (error) {
            return reject(error);
          }
          return resolve(_extends({
            bucket: bucket,
            s3Object: s3Object,
            link: link,
            md5: md5,
            uid: uid
          }, rest));
        });
      });
    }
  }, {
    key: "listBucket",
    value: function listBucket() {
      var _ref9 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref9$bucket = _ref9.bucket,
          bucket = _ref9$bucket === undefined ? "test-jchery" : _ref9$bucket,
          rest = _objectWithoutProperties(_ref9, ["bucket"]);

      var s3Bucket = new S3({
        params: { Bucket: bucket },
        apiVersion: "2006-03-01",
        region: "eu-west-1"
      });

      return new Promise(function (resolve, reject) {
        s3Bucket.listObjects({ Delimiter: "/" }, function (error, s3Objects) {
          if (error) {
            return reject(error);
          }
          return resolve(_extends({
            bucket: bucket,
            s3Objects: s3Objects
          }, rest));
        });
      });
    }
  }]);

  return Parrot;
}();

module.exports = new Parrot();

