const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'matching', 'fill-in-blank', 'image', 'audio', 'video'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',
    required: true
  },
  options: [
    {
      text: {
        type: String,
        required: true
      },
      isCorrect: {
        type: Boolean,
        required: true
      }
    }
  ],
  correctAnswer: {
    type: String
  },
  explanation: {
    type: String
  },
  mediaUrl: {
    type: String
  },
  mediaType: {
    type: String,
    enum: ['image', 'audio', 'video', 'none'],
    default: 'none'
  },
  points: {
    type: Number,
    default: 10
  },
  timeLimit: {
    type: Number, // in seconds
    default: 30
  },
  tags: {
    type: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
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

module.exports = mongoose.model('question', QuestionSchema); 