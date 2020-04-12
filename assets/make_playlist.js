#!/usr/bin/env node

"use strict";

/***
 *
 * Create a playlist file for the videowall.
 *
 * Usage:
 * node make_playlist.js
 *
 */

let root_dir = "../..";
let rel_path = true;
let extensions = ["mp4", "webm"];
let excludes = ["novideowall", "404.mp4", "empty.mp4"];

var fs = require("fs");
var path = require("path");
var walk = function (dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file) return done(null, results);
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    let do_it = true;
                    for (let index = 0; index < excludes.length; index++) {
                        if (file.includes(excludes[index])) { do_it = false; break; }
                    }
                    if (do_it) {
                        results.push(file);
                    }
                    next();
                }
            });
        })();
    });
};

walk(root_dir, function (err, results) {
    if (err) throw err;
    let playlist = "playlist = [\n";
    let nb = 0;
    results.forEach(
        element => {
            if (typeof element == "string") {
                let parts = element.split(".");
                let ext = parts[parts.length - 1];
                if (extensions.includes(ext)) {
                    let _path = rel_path ? path.relative(__dirname + "/..", element) : element;
                    playlist += `    "${_path}",\n`;
                    nb += 1;
                }
            }
        }
    );

    if (nb > 0) {
        playlist = playlist.slice(0, -2);
        playlist += "\n]\n";
    } else {
        playlist = playlist.slice(0, -1);
        playlist += "]\n";
    }

    fs.writeFile("playlist.js", playlist, (err) => {
        if (err) throw err;
    });
});
