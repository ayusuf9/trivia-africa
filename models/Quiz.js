const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    required: true
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'question'
    }
  ],
  timeLimit: {
    type: Number, // in minutes, 0 means no limit
    default: 0
  },
  passingScore: {
    type: Number, // percentage
    default: 60
  },
  coverImage: {
    type: String
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  tags: {
    type: [String]
  },
  totalPlays: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  ratings: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      review: {
        type: String
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  averageRating: {
    type: Number,
    default: 0
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

module.exports = mongoose.model('quiz', QuizSchema); 