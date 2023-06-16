// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static(__dirname + '/public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get(["/", "/index.html"], function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// Satisfy all FCC tests
function getResponse(dateObj) {
  return {
    unix: dateObj.getTime(), 
    utc: dateObj.toUTCString()
  }
}
app.get(new RegExp("\/api\/?(.*)"), function(req, res) {
  const ogPath = req.originalUrl;
  const apiVal = ogPath.substring(5, ogPath.length);
  let date = (apiVal ? (apiVal.match(/[^\d]/) ? new Date(apiVal) : new Date(parseInt(apiVal))) : new Date());
  let response = getResponse(date);
  if(apiVal && response.utc === "Invalid Date") {
    // try decode url
    date = new Date(decodeURIComponent(apiVal));
    utcStr = date.toUTCString();
    response = getResponse(date);
    if(response.utc === 'Invalid Date') {
      response = {error: response.utc}
    }
  }
  res.json(response);
  console.log('Request:  '+apiVal);
});


// listen for requests :)
var listener = app.listen(8577, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
