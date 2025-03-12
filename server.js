const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const http = require('http');
const socketio = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Initialize middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/quizzes', require('./routes/api/quizzes'));
app.use('/api/questions', require('./routes/api/questions'));
app.use('/api/categories', require('./routes/api/categories'));
app.use('/api/games', require('./routes/api/games'));
app.use('/api/leaderboard', require('./routes/api/leaderboard'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketio(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connection
require('./socket/socket')(io);

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 