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

function requiredParam(param) {
  var requiredParamError = new Error("Required parameter, \"" + param + "\" is missing.");

  // preserve original stack trace
  if (typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(requiredParamError, requiredParam);
  }

  throw requiredParamError;
}

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

      var soup = new JSSoup(html);
      var text = he.decode(soup.text);
      var md5 = MD5(text);
      return _extends({
        html: html,
        text: text,
        md5: md5
      }, rest);
    }
  }, {
    key: "splitText",
    value: function splitText() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var text = _ref2.text,
          _ref2$limit = _ref2.limit,
          limit = _ref2$limit === undefined ? 1000 : _ref2$limit,
          rest = _objectWithoutProperties(_ref2, ["text", "limit"]);

      var regex = new RegExp("^[^]{" + limit + "}[^\\.]+\\.");
      var parts = [];
      var crt = text;
      while (crt.length > limit) {
        var res = crt.match(regex);
        if (res) {
          parts.push(res[0]);
          crt = crt.replace(regex, "");
        } else {
          part.push(crt);
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
    key: "textToSpeech",
    value: function textToSpeech() {
      var _this = this;

      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var text = _ref3.text,
          _ref3$speaker = _ref3.speaker,
          speaker = _ref3$speaker === undefined ? "Celine" : _ref3$speaker,
          rest = _objectWithoutProperties(_ref3, ["text", "speaker"]);

      return Promise.resolve({ text: text }).then(function (obj) {
        return console.log("Split") || _this.splitText(obj);
      }).then(function (obj) {
        return console.log("Speech") || Promise.all(obj.parts.map(function (part) {
          return _this.partToSpeech({ part: part, speaker: speaker });
        }));
      }).then(function (objs) {
        return console.log("Reduce") || objs.reduce(function (mp3s, obj) {
          mp3s.push(obj.mp3);
          return mp3s;
        }, []);
      }).then(function (mp3s) {
        return console.log("Concat") || Buffer.concat(mp3s);
      }).then(function (mp3) {
        return console.log("Ret") || _extends({ text: text, mp3: mp3 }, rest);
      });
    }
  }, {
    key: "partToSpeech",
    value: function partToSpeech() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var part = _ref4.part,
          _ref4$speaker = _ref4.speaker,
          speaker = _ref4$speaker === undefined ? "Celine" : _ref4$speaker,
          rest = _objectWithoutProperties(_ref4, ["part", "speaker"]);

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
    key: "listBucket",
    value: function listBucket() {
      var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref5$bucket = _ref5.bucket,
          bucket = _ref5$bucket === undefined ? "test-jchery" : _ref5$bucket,
          rest = _objectWithoutProperties(_ref5, ["bucket"]);

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

