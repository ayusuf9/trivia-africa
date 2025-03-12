const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  bio: {
    type: String
  },
  location: {
    type: String
  },
  interests: {
    type: [String]
  },
  preferredCategories: {
    type: [String]
  },
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  badges: [
    {
      name: {
        type: String,
        required: true
      },
      description: {
        type: String
      },
      image: {
        type: String
      },
      dateEarned: {
        type: Date,
        default: Date.now
      }
    }
  ],
  achievements: [
    {
      name: {
        type: String,
        required: true
      },
      description: {
        type: String
      },
      points: {
        type: Number,
        default: 0
      },
      dateEarned: {
        type: Date,
        default: Date.now
      }
    }
  ],
  quizHistory: [
    {
      quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'quiz'
      },
      score: {
        type: Number
      },
      totalQuestions: {
        type: Number
      },
      correctAnswers: {
        type: Number
      },
      timeTaken: {
        type: Number // in seconds
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  friends: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      }
    }
  ],
  social: {
    twitter: {
      type: String
    },
    facebook: {
      type: String
    },
    instagram: {
      type: String
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('profile', ProfileSchema); 