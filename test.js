"use strict";

var lambda = require("./index.js");
var fs = require("fs");

var test = function (state, res) {
    if (state) {
        console.log(state);
    }
    console.log(res);
};

fs.readFile("./test.html", function read(err, html) {
    if (err) {
        throw err;
    }
    lambda.handler({html}, null, test);
    // console.log({html:html.toString()});
});
