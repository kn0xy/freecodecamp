require('dotenv').config()
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

// App Config
const upload = multer({ dest: 'uploads/' });
const app = express();
app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));


// GET handler for home page
app.get(['/', '/index.html'], function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// POST handler for file upload
app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
  if(!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  // Get file metadata
  const { originalname: filename, mimetype, size, path } = req.file;

  // Send JSON response to client
  res.json({
    name: filename,
    type: mimetype,
    size: size
  });

  // Delete the uploaded file
  fs.unlink(path, (err) => {
    if(err) console.error('Error deleting file: ', err);
  })
});


// Start Express
const port = process.env.PORT || 8536;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});
