// Define dependencies
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express')
const cors = require('cors')

// Express config
const app = express();
app.use(cors());
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// Connect to MongoDB
mongoose.connect('mongodb://localhost/exercisetracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

// Define Exercise schema
const exerciseSchema = new mongoose.Schema({
  username: {type: String, required: true},
  user_id: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date},
  _id: {type: String, required: true}
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Define User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  _id: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// Define Log schema
const logSchema = new mongoose.Schema({
  username: {type: String, required: true},
  count: {type: Number, required: true},
  _id: {type: String, required: true},
  log: {type: Array, required: true}
});
const Log = mongoose.model('Log', logSchema);

// GET handler for home page
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// POST handler to create new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  
  // Ensure username is provided
  if(!username) return res.status(400).json({ error: 'Username is required' });

  // Create a new user document
  const newUser = new User({
    username: username,
    _id: new mongoose.Types.ObjectId().toString(),
  });

  // Save the new user to the database
  await newUser.save();
  console.log('Created user: '+username);
  res.json(newUser);
});

// GET handler to list all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// POST handler to create new exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;
    

    // Find the user by _id
    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Create a new exercise document
    const exerciseDate = (date ? new Date(date) : new Date());
    const exercise = new Exercise({
      _id: new mongoose.Types.ObjectId().toString(),
      user_id: _id,
      username: user.username,
      description: description,
      duration: duration,
      date: exerciseDate,
    });

    // Save the new exercise to the database
    await exercise.save();

    // Send response
    res.json({
      _id: _id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exerciseDate.toDateString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create exercise: '+err });
  }
});

// GET handler to fetch all user exercise logs
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    // Find the user by _id
    const user = await User.findById(_id);
    if(!user) return res.status(404).json({ error: 'User not found' });

    // Find all exercises for the user
    let userLog = await Exercise.find({ user_id: _id });

    // Filter logs based on from and to dates
    if (from && to) {
      userLog = userLog.filter(log => {
        const logDate = new Date(log.date).toISOString().split('T')[0];
        return logDate >= from && logDate <= to;
      });
    } else if (from) {
      userLog = userLog.filter(log => {
        const logDate = new Date(log.date).toISOString().split('T')[0];
        return logDate >= from;
      });
    } else if (to) {
      userLog = userLog.filter(log => {
        const logDate = new Date(log.date).toISOString().split('T')[0];
        return logDate <= to;
      });
    }

    // Limit the number of logs
    if (limit) userLog = userLog.slice(0, parseInt(limit));

    // Send response
    res.json({
      _id: user._id,
      username: user.username,
      count: userLog.length,
      log: userLog.map((exercise) => ({
        description: exercise.description.toString(),
        duration: parseInt(exercise.duration),
        date: exercise.date.toDateString(),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get exercise logs: '+err });
  }
});


// Start Express
const listener = app.listen(process.env.PORT || 8537, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});