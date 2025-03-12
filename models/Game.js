const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  gameType: {
    type: String,
    enum: ['duel', 'tournament', 'team'],
    default: 'duel'
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled'],
    default: 'waiting'
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'quiz'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  players: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
      },
      score: {
        type: Number,
        default: 0
      },
      correctAnswers: {
        type: Number,
        default: 0
      },
      wrongAnswers: {
        type: Number,
        default: 0
      },
      timeSpent: {
        type: Number,
        default: 0
      },
      isActive: {
        type: Boolean,
        default: true
      },
      finishedAt: {
        type: Date
      }
    }
  ],
  teams: [
    {
      name: {
        type: String
      },
      score: {
        type: Number,
        default: 0
      },
      players: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'user'
        }
      ]
    }
  ],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  winningTeam: {
    type: String
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  maxPlayers: {
    type: Number,
    default: 2
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('game', GameSchema); 