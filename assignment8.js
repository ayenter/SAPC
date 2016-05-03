#!/usr/bin/env node

"use strict";

var http = require("http"), querystring = require("querystring"), express = require("express"), path = require("path");

var sw = require('sentiword');

var abs = require('mollusk').abs;

var val = require('mollusk').val;

var Twitter = require('twitter');
 
var client = new Twitter({
  consumer_key: '1M2thX1eWefH2VYj6qGBZc1u2',
  consumer_secret: 'EIvocFmex8hU6anJKRXXWKUpq9i4dei9t4mVhONgfNqVwTkNrh',
  access_token_key: '384927050-vFQjnabFttcLFlRGBwygX3lIdpvCr7wzPd9HM2gC',
  access_token_secret: '2gbKYfL3pOW12BRZVi4ZYaVN2IOf0hVxNzRN2jVaxbZq8'
});

var forEach = require('async-foreach').forEach;

var params = {screen_name: 'nodejs'};

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var bodyParser = require('body-parser');
var app = express();

var router = express.Router();
app.use(express.static('public'));
app.set('view engine', 'jade');
app.set('views', path.join(__dirname, '/views'));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to the db
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
});

global.INIT_KEY = 10 * Math.pow(36, 3);

var linkSchema = mongoose.Schema({
    "candidate" : String,
    "pro" : Number,
    "con" : Number,
    "neu_c" : Number,
    "pro_c" : Number,
    "con_c" : Number,
    "count" : Number
});
var Link = mongoose.model("sapc", linkSchema);

var trump_pro_c = 0;
var trump_con_c = 0;
var trump_neu_c = 0;
var trump_pro = 0;
var trump_con = 0;
var trump_count = 0;

var clinton_pro_c = 0;
var clinton_con_c = 0;
var clinton_neu_c = 0;
var clinton_pro = 0;
var clinton_con = 0;
var clinton_count = 0;

Link.findOne({"candidate" : "trump"}, function(err, reply) {
    if(reply!=null && reply.length!=0 && err==null){
        trump_pro_c = reply.pro_c;
        trump_con_c = reply.con_c;
        trump_neu_c = reply.neu_c;
        trump_pro = reply.pro;
        trump_con = reply.con;
        trump_count = reply.count;
        client.stream('statuses/filter', {track: 'trump'}, function(stream) {
            stream.on('data', function(tweet) {
                var score = val(tweet.text);
                trump_count = trump_count + 1;
                if(score > 0){
                    trump_pro = trump_pro + score;
                    trump_pro_c = trump_pro_c + 1;
                } else if (score < 0){
                    trump_con = trump_con + score;
                    trump_con_c = trump_con_c + 1;
                } else {
                    trump_neu_c = trump_neu_c + 1;
                }
            });
            stream.on('error', function(error) {
                console.log(error);
            });
        });
    } else {
        console.log("trump disapeared");
    }
});
Link.findOne({"candidate" : "clinton"}, function(err, reply) {
    if(reply!=null && reply.length!=0 && err==null){
        clinton_pro_c = reply.pro_c;
        clinton_con_c = reply.con_c;
        clinton_neu_c = reply.neu_c;
        clinton_pro = reply.pro;
        clinton_con = reply.con;
        clinton_count = reply.count;
        client.stream('statuses/filter', {track: 'clinton'}, function(stream) {
            stream.on('data', function(tweet) {
                var score = val(tweet.text);
                clinton_count = clinton_count + 1;
                if(score > 0){
                    clinton_pro = clinton_pro + score;
                    clinton_pro_c = clinton_pro_c + 1;
                } else if (score < 0){
                    clinton_con = clinton_con + score;
                    clinton_con_c = clinton_con_c + 1;
                } else {
                    clinton_neu_c = clinton_neu_c + 1;
                }
            });
            stream.on('error', function(error) {
                console.log(error);
            });
        });
    } else {
        console.log("clinton disapeared");
    }
});

var intervalID = setInterval(function(){
    console.log("TRUMP");
    console.log("t_count: " + trump_count);
    console.log("t_pro: " + trump_pro);
    console.log("t_con: " + trump_con);
    console.log("t_neu_c: " + trump_neu_c);
    console.log("t_pro_c: " + trump_pro_c);
    console.log("t_con_c: " + trump_con_c);
    console.log("calc: " + ((trump_pro/trump_pro_c)+(trump_con/trump_con_c)));
    console.log("-------------------------\n");
    console.log("CLINTON");
    console.log("c_count: " + clinton_count);
    console.log("c_pro: " + clinton_pro);
    console.log("c_con: " + clinton_con);
    console.log("c_neu_c: " + clinton_neu_c);
    console.log("c_pro_c: " + clinton_pro_c);
    console.log("c_con_c: " + clinton_con_c);
    console.log("calc: " + ((clinton_pro/clinton_pro_c)+(clinton_con/clinton_con_c)));
    console.log("-------------------------\n");
    Link.findOne({"candidate" : "trump"}, function(err, reply) {
        if(reply!=null && reply.length!=0 && err==null){
            reply.pro_c = trump_pro_c;
            reply.con_c = trump_con_c;
            reply.neu_c = trump_neu_c;
            reply.pro = trump_pro;
            reply.con = trump_con;
            reply.count = trump_count;
            reply.save();
        } else {
            console.log("trump disapeared");
        }
    });
    Link.findOne({"candidate" : "clinton"}, function(err, reply) {
        if(reply!=null && reply.length!=0 && err==null){
            reply.pro_c = clinton_pro_c;
            reply.con_c = clinton_con_c;
            reply.neu_c = clinton_neu_c;
            reply.pro = clinton_pro;
            reply.con = clinton_con;
            reply.count = clinton_count;
            reply.save();
        } else {
            console.log("clinton disapeared");
        }
    });
}, 5000);

app.on("error", function (err) {
    console.log("ERROR");
    console.log("error - " + err);
});

app.get('/', function(req, res) {
    "use strict";
    var trump_p = trump_pro_c-trump_con_c;
    var trump_c = (trump_pro-trump_con);
    var clinton_p = (clinton_pro_c-clinton_con_c);
    var clinton_c = (clinton_pro-clinton_con);
    var max = Math.max(trump_p, trump_c, clinton_p, clinton_c);
    var trump_per = (trump_pro/trump_count)*max;
    var clinton_per = (clinton_pro/clinton_count)*max;
    res.render('index2', {trump_p: trump_p, trump_c: trump_c, trump_per: trump_per, clinton_p: clinton_p, clinton_c: clinton_c, clinton_per: clinton_per});
});

var server = app.listen(3000);
var address = server.address();
console.log("nudge is listening at http://localhost:" + address.port + "/");
