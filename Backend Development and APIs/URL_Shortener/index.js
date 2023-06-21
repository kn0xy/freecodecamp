require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');


// Basic Configuration
const port = process.env.PORT || 8587;
const app = express();
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: true}));
app.use(cors());


// Connect to MongoDB
mongoose.connect('mongodb://localhost/shorturl', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

// Define a schema for ShortURL documents
const shortUrlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

// Create a ShortURL model based on the schema
const ShortURL = mongoose.model('ShortURL', shortUrlSchema);


// Display home page
app.get(['/', '/index.html'], function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Route handler for the POST request
app.post('/api/shorturl', async (req, res) => {
  const originalUrl = req.body.url;
  console.log('POST: ' + req.body.url || 'no url specified');

  // Validate URL format
  let urlValid = true;
  const urlRegex = /^(https?:\/\/)([A-Za-z0-9-]+\.)+[A-Za-z0-9]+(:\d{1,5})?(\/.*)?$/;
  if (!urlRegex.test(originalUrl)) {
    urlValid = false;
  } else {
    // Format is valid, now verify the URL
    dns.lookup(originalUrl, (err, addr, fam) => {
      if(err) urlValid = false;
    });
  }
  if(!urlValid) {
    return res.json({ error: 'invalid url' });
  } else {
    // Posted URL is valid
    try {
      // Lookup URL in the db
      let shortUrl;
      const existingUrl = await ShortURL.findOne({ original_url: originalUrl });
      if(existingUrl) {
        shortUrl = existingUrl;
      } else {
        // Save the URL
        const urlCount = await ShortURL.countDocuments();
        const newUrl = new ShortURL({
          original_url: originalUrl,
          short_url: urlCount + 1
        });
        await newUrl.save();
        shortUrl = newUrl;
      }
      // Respond to client
      res.json({
        original_url: shortUrl.original_url,
        short_url: shortUrl.short_url
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Route handler for the GET request
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = req.params.short_url;

  // shortUrl should be a number
  if(!parseInt(shortUrl)) {
    return res.json({error: 'Short URL must be a number'});
  }
  try {
    // Find the original_url mapping based on the short_url
    const urlMapping = await ShortURL.findOne({ short_url: shortUrl });
    if (urlMapping) {
      // Redirect to the original URL
      console.log('GET: redirect to '+urlMapping.original_url);
      res.redirect(urlMapping.original_url);
    } else {
      // Return error if the short_url is not found
      res.json({ error: 'Invalid short URL' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
