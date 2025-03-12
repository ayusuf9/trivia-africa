const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'all-time', 'category', 'quiz'],
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category'
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'quiz'
  },
  entries: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
      },
      score: {
        type: Number,
        required: true
      },
      rank: {
        type: Number
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
LeaderboardSchema.index({ type: 1, startDate: 1, endDate: 1 });
LeaderboardSchema.index({ 'entries.user': 1, 'entries.score': -1 });

module.exports = mongoose.model('leaderboard', LeaderboardSchema); 