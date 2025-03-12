const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const Leaderboard = require('../../models/Leaderboard');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/leaderboard
// @desc    Get leaderboard by type
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type = 'all-time', category, quiz, limit = 10 } = req.query;
    
    // Build query
    const query = { type };
    
    if (category) query.category = category;
    if (quiz) query.quiz = quiz;
    
    // Find active leaderboard
    let leaderboard = await Leaderboard.findOne({
      ...query,
      isActive: true
    }).populate('entries.user', ['name', 'avatar']);
    
    if (!leaderboard) {
      return res.status(404).json({ msg: 'Leaderboard not found' });
    }
    
    // Sort entries by score and limit
    const entries = leaderboard.entries
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit));
    
    // Add rank to entries
    const rankedEntries = entries.map((entry, index) => ({
      ...entry.toObject(),
      rank: index + 1
    }));
    
    res.json(rankedEntries);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/leaderboard/profile
// @desc    Get leaderboard position for current user
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const { type = 'all-time', category, quiz } = req.query;
    
    // Build query
    const query = { type };
    
    if (category) query.category = category;
    if (quiz) query.quiz = quiz;
    
    // Find active leaderboard
    let leaderboard = await Leaderboard.findOne({
      ...query,
      isActive: true
    });
    
    if (!leaderboard) {
      return res.status(404).json({ msg: 'Leaderboard not found' });
    }
    
    // Sort entries by score
    const sortedEntries = leaderboard.entries.sort((a, b) => b.score - a.score);
    
    // Find user's position
    const userIndex = sortedEntries.findIndex(
      entry => entry.user.toString() === req.user.id
    );
    
    if (userIndex === -1) {
      return res.json({ rank: null, score: 0, message: 'Not ranked yet' });
    }
    
    const userEntry = sortedEntries[userIndex];
    
    res.json({
      rank: userIndex + 1,
      score: userEntry.score,
      total: sortedEntries.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/leaderboard
// @desc    Create or update leaderboard entry
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { type, category, quiz, score } = req.body;
    
    if (!type) {
      return res.status(400).json({ msg: 'Leaderboard type is required' });
    }
    
    if (!score) {
      return res.status(400).json({ msg: 'Score is required' });
    }
    
    // Build query
    const query = { type, isActive: true };
    
    if (category) query.category = category;
    if (quiz) query.quiz = quiz;
    
    // Find or create leaderboard
    let leaderboard = await Leaderboard.findOne(query);
    
    if (!leaderboard) {
      // Create new leaderboard
      const newLeaderboard = new Leaderboard({
        type,
        category,
        quiz,
        startDate: new Date(),
        entries: [{
          user: req.user.id,
          score,
          date: new Date()
        }]
      });
      
      leaderboard = await newLeaderboard.save();
    } else {
      // Check if user already has an entry
      const entryIndex = leaderboard.entries.findIndex(
        entry => entry.user.toString() === req.user.id
      );
      
      if (entryIndex !== -1) {
        // Update if new score is higher
        if (score > leaderboard.entries[entryIndex].score) {
          leaderboard.entries[entryIndex].score = score;
          leaderboard.entries[entryIndex].date = new Date();
        }
      } else {
        // Add new entry
        leaderboard.entries.push({
          user: req.user.id,
          score,
          date: new Date()
        });
      }
      
      await leaderboard.save();
    }
    
    // Sort entries by score
    const sortedEntries = leaderboard.entries.sort((a, b) => b.score - a.score);
    
    // Find user's position
    const userIndex = sortedEntries.findIndex(
      entry => entry.user.toString() === req.user.id
    );
    
    res.json({
      rank: userIndex + 1,
      score,
      total: sortedEntries.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/leaderboard/admin
// @desc    Get all leaderboards (admin only)
// @access  Private/Admin
router.get('/admin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const leaderboards = await Leaderboard.find()
      .sort({ date: -1 })
      .populate('category', ['name'])
      .populate('quiz', ['title']);
    
    res.json(leaderboards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/leaderboard/admin
// @desc    Create a new leaderboard period (admin only)
// @access  Private/Admin
router.post('/admin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const { type, category, quiz, startDate, endDate } = req.body;
    
    if (!type) {
      return res.status(400).json({ msg: 'Leaderboard type is required' });
    }
    
    // Deactivate current active leaderboard of same type
    if (type === 'daily' || type === 'weekly' || type === 'monthly') {
      const query = { type, isActive: true };
      
      if (category) query.category = category;
      if (quiz) query.quiz = quiz;
      
      await Leaderboard.updateMany(query, { isActive: false });
    }
    
    // Create new leaderboard
    const newLeaderboard = new Leaderboard({
      type,
      category,
      quiz,
      startDate: startDate || new Date(),
      endDate,
      entries: []
    });
    
    const leaderboard = await newLeaderboard.save();
    
    res.json(leaderboard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 