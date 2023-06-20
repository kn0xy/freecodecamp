// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static(__dirname + '/public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get(['/', '/index.html'], function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// your first API endpoint...
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// satisfy FCC user stories
app.get('/api/whoami', function (req, res) {
  const userIp = req.headers['cf-connecting-ip'];
  const userLang = req.headers['accept-language'];
  const userAgent = req.headers['user-agent'];
  res.json({
    ipaddress: userIp,
    language: userLang,
    software: userAgent
  });

  console.log("\n"+userIp+"\n"+userLang+"\n"+userAgent+"\n");
});

// listen for requests :)
var listener = app.listen(8574, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
