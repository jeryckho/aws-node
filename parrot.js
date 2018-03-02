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

      var text = void 0;
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
    key: "addSentence",
    value: function addSentence(_ref3) {
      var txt = _ref3.txt,
          bTitre = _ref3.bTitre,
          bBreak = _ref3.bBreak,
          stack = _ref3.stack,
          _ref3$limit = _ref3.limit,
          limit = _ref3$limit === undefined ? 1500 : _ref3$limit,
          rest = _objectWithoutProperties(_ref3, ["txt", "bTitre", "bBreak", "stack", "limit"]);

      if (txt.length + stack.size >= limit) {
        stack.res.push(stack.acc);
        stack.size = txt.length;
        stack.acc = "";
      } else {
        stack.size += txt.length;
      }
      if (bTitre) {
        txt = "<emphasis>" + txt + "</emphasis>";
      }
      if (bBreak) {
        txt = txt + "<break time=\"500ms\"/>";
      }
      stack.acc += txt;
      return _extends({ stack: stack }, rest);
    }
  }, {
    key: "splitSSML",
    value: function splitSSML() {
      var _this = this;

      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var text = _ref4.text,
          title = _ref4.title,
          chapo = _ref4.chapo,
          _ref4$limit = _ref4.limit,
          limit = _ref4$limit === undefined ? 1500 : _ref4$limit,
          rest = _objectWithoutProperties(_ref4, ["text", "title", "chapo", "limit"]);

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

      var phrase = /^([^]*?[.?!;:]+['")]*)/;
      var ssmlLines = list.reduce(function (stack, txt, idx, arr) {
        var obj = { stack: stack };
        var len = txt.length;
        if (len < 80) {
          obj = _this.addSentence({
            txt: txt,
            limit: limit,
            stack: obj.stack,
            bTitre: true,
            bBreak: true
          });
        } else {
          while (phrase.test(txt)) {
            var trouve = txt.match(phrase);
            obj = _this.addSentence({
              txt: trouve[0],
              limit: limit,
              stack: obj.stack
            });
            txt = txt.replace(phrase, "");
          }
          if (txt.length > 0) {
            obj = _this.addSentence({
              txt: txt,
              limit: limit,
              stack: obj.stack,
              bBreak: true
            });
          }
        }
        return obj.stack;
      }, { acc: "", size: 0, res: [] });

      if (ssmlLines.size > 0) {
        ssmlLines.res.push(ssmlLines.acc);
      }

      return _extends({
        title: title,
        text: text,
        chapo: chapo,
        parts: ssmlLines.res.map(function (elm) {
          return "<speak>" + elm + "</speak>";
        })
      }, rest);
    }
  }, {
    key: "splitText",
    value: function splitText() {
      var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var text = _ref5.text,
          _ref5$limit = _ref5.limit,
          limit = _ref5$limit === undefined ? 1000 : _ref5$limit,
          rest = _objectWithoutProperties(_ref5, ["text", "limit"]);

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
      var mp3List = mp3Array.reduce(function (mp3s, obj) {
        mp3s.push(obj.mp3);
        return mp3s;
      }, []);
      return Buffer.concat(mp3List);
    }
  }, {
    key: "textToSSMLSpeech",
    value: function textToSSMLSpeech() {
      var _this2 = this;

      var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var text = _ref6.text,
          title = _ref6.title,
          chapo = _ref6.chapo,
          _ref6$speaker = _ref6.speaker,
          speaker = _ref6$speaker === undefined ? "Celine" : _ref6$speaker,
          rest = _objectWithoutProperties(_ref6, ["text", "title", "chapo", "speaker"]);

      return Promise.resolve({ text: text, title: title, chapo: chapo }).then(function (obj) {
        return console.log("Split") || _this2.splitSSML(obj);
      }).then(function (obj) {
        return console.log("Speech") || Promise.all(obj.parts.map(function (part) {
          return _this2.partToSpeech({ part: part, speaker: speaker, type: "ssml" });
        }));
      }).then(function (mp3Array) {
        return console.log("Merge") || _this2.mergeMp3s(mp3Array);
      }).then(function (mp3) {
        return console.log("Ret") || _extends({ text: text, mp3: mp3 }, rest);
      });
    }
  }, {
    key: "textToSpeech",
    value: function textToSpeech() {
      var _this3 = this;

      var _ref7 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var text = _ref7.text,
          _ref7$speaker = _ref7.speaker,
          speaker = _ref7$speaker === undefined ? "Celine" : _ref7$speaker,
          rest = _objectWithoutProperties(_ref7, ["text", "speaker"]);

      return Promise.resolve({ text: text }).then(function (obj) {
        return console.log("Split") || _this3.splitText(obj);
      }).then(function (obj) {
        return console.log("Speech") || Promise.all(obj.parts.map(function (part) {
          return _this3.partToSpeech({ part: part, speaker: speaker });
        }));
      }).then(function (mp3Array) {
        return console.log("Merge") || _this3.mergeMp3s(mp3Array);
      }).then(function (mp3) {
        return console.log("Ret") || _extends({ text: text, mp3: mp3 }, rest);
      });
    }
  }, {
    key: "partToSpeech",
    value: function partToSpeech() {
      var _ref8 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var part = _ref8.part,
          _ref8$speaker = _ref8.speaker,
          speaker = _ref8$speaker === undefined ? "Celine" : _ref8$speaker,
          _ref8$type = _ref8.type,
          type = _ref8$type === undefined ? "text" : _ref8$type,
          rest = _objectWithoutProperties(_ref8, ["part", "speaker", "type"]);

      var polly = new Polly({
        apiVersion: "2016-06-10",
        region: "eu-west-1"
      });
      var params = {
        OutputFormat: "mp3",
        Text: part,
        TextType: type,
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
      var _ref9 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref9$bucket = _ref9.bucket,
          bucket = _ref9$bucket === undefined ? "test-jchery" : _ref9$bucket,
          md5 = _ref9.md5,
          uid = _ref9.uid,
          rest = _objectWithoutProperties(_ref9, ["bucket", "md5", "uid"]);

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
      var _ref10 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref10$bucket = _ref10.bucket,
          bucket = _ref10$bucket === undefined ? "test-jchery" : _ref10$bucket,
          mp3 = _ref10.mp3,
          md5 = _ref10.md5,
          uid = _ref10.uid,
          rest = _objectWithoutProperties(_ref10, ["bucket", "mp3", "md5", "uid"]);

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
      var _ref11 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref11$bucket = _ref11.bucket,
          bucket = _ref11$bucket === undefined ? "test-jchery" : _ref11$bucket,
          rest = _objectWithoutProperties(_ref11, ["bucket"]);

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

