const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Quiz = require('../../models/Quiz');
const User = require('../../models/User');
const Question = require('../../models/Question');

// @route   GET api/quizzes
// @desc    Get all quizzes
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Filter options
    const { category, difficulty, limit = 20, page = 1, approved, createdBy } = req.query;
    
    // Build query
    const query = { isPublic: true, isApproved: true };
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (createdBy) query.createdBy = createdBy;
    
    // If user is authenticated and admin/moderator, allow filtering by approval status
    if (req.header('x-auth-token')) {
      try {
        const token = req.header('x-auth-token');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).select('-password');
        
        if (user && (user.role === 'admin' || user.role === 'moderator')) {
          if (approved !== undefined) {
            query.isApproved = approved === 'true';
          } else {
            delete query.isApproved; // Show all quizzes for admins/moderators
          }
        }
      } catch (err) {
        // Token verification failed, continue with default query
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const quizzes = await Quiz.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('category', ['name'])
      .populate('createdBy', ['name', 'avatar']);
      
    const total = await Quiz.countDocuments(query);
    
    res.json({
      quizzes,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/quizzes/:id
// @desc    Get quiz by ID
// @access  Public/Private
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('category', ['name'])
      .populate('createdBy', ['name', 'avatar'])
      .populate('approvedBy', ['name'])
      .populate('questions');
    
    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    
    // Check if quiz is public or user is authorized
    if (!quiz.isPublic) {
      // If not public, check if user is authenticated
      if (!req.header('x-auth-token')) {
        return res.status(403).json({ msg: 'Not authorized to view this quiz' });
      }
      
      try {
        const token = req.header('x-auth-token');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).select('-password');
        
        // Allow access if user is creator, admin, or moderator
        if (!user || (user.id !== quiz.createdBy._id.toString() && 
            user.role !== 'admin' && user.role !== 'moderator')) {
          return res.status(403).json({ msg: 'Not authorized to view this quiz' });
        }
      } catch (err) {
        return res.status(403).json({ msg: 'Not authorized to view this quiz' });
      }
    }
    
    // If not approved, check if user is authorized
    if (!quiz.isApproved) {
      // If not approved, check if user is authenticated
      if (!req.header('x-auth-token')) {
        return res.status(403).json({ msg: 'Not authorized to view this quiz' });
      }
      
      try {
        const token = req.header('x-auth-token');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).select('-password');
        
        // Allow access if user is creator, admin, or moderator
        if (!user || (user.id !== quiz.createdBy._id.toString() && 
            user.role !== 'admin' && user.role !== 'moderator')) {
          return res.status(403).json({ msg: 'Not authorized to view this quiz' });
        }
      } catch (err) {
        return res.status(403).json({ msg: 'Not authorized to view this quiz' });
      }
    }
    
    res.json(quiz);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/quizzes
// @desc    Create a quiz
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('category', 'Category is required').not().isEmpty(),
      check('difficulty', 'Difficulty level is required').not().isEmpty(),
      check('questions', 'At least one question is required').isArray({ min: 1 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        title,
        description,
        category,
        difficulty,
        questions,
        timeLimit,
        passingScore,
        coverImage,
        isPublic,
        tags
      } = req.body;
      
      // Validate questions exist
      for (const questionId of questions) {
        const questionExists = await Question.findById(questionId);
        if (!questionExists) {
          return res.status(400).json({ msg: `Question with ID ${questionId} not found` });
        }
      }
      
      // Create quiz
      const newQuiz = new Quiz({
        title,
        description,
        category,
        difficulty,
        questions,
        timeLimit: timeLimit || 0,
        passingScore: passingScore || 60,
        coverImage,
        isPublic: isPublic !== undefined ? isPublic : true,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        createdBy: req.user.id,
        isApproved: false
      });
      
      // Auto-approve if user is admin or moderator
      const user = await User.findById(req.user.id).select('-password');
      if (user.role === 'admin' || user.role === 'moderator') {
        newQuiz.isApproved = true;
        newQuiz.approvedBy = req.user.id;
      }
      
      const quiz = await newQuiz.save();
      
      res.json(quiz);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/quizzes/:id
// @desc    Update a quiz
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    
    // Check if user has permission to update
    const user = await User.findById(req.user.id).select('-password');
    if (quiz.createdBy.toString() !== req.user.id && 
        user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({ msg: 'Not authorized to update this quiz' });
    }
    
    const {
      title,
      description,
      category,
      difficulty,
      questions,
      timeLimit,
      passingScore,
      coverImage,
      isPublic,
      tags,
      isActive
    } = req.body;
    
    // Build quiz object
    const quizFields = {};
    if (title) quizFields.title = title;
    if (description) quizFields.description = description;
    if (category) quizFields.category = category;
    if (difficulty) quizFields.difficulty = difficulty;
    if (questions) {
      // Validate questions exist
      for (const questionId of questions) {
        const questionExists = await Question.findById(questionId);
        if (!questionExists) {
          return res.status(400).json({ msg: `Question with ID ${questionId} not found` });
        }
      }
      quizFields.questions = questions;
    }
    if (timeLimit !== undefined) quizFields.timeLimit = timeLimit;
    if (passingScore !== undefined) quizFields.passingScore = passingScore;
    if (coverImage) quizFields.coverImage = coverImage;
    if (isPublic !== undefined) quizFields.isPublic = isPublic;
    if (tags) quizFields.tags = tags.split(',').map(tag => tag.trim());
    if (isActive !== undefined) quizFields.isActive = isActive;
    
    // If not admin/moderator, set isApproved to false when updating
    if (user.role !== 'admin' && user.role !== 'moderator') {
      quizFields.isApproved = false;
      quizFields.approvedBy = null;
    }
    
    // Update
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { $set: quizFields },
      { new: true }
    );
    
    res.json(updatedQuiz);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/quizzes/approve/:id
// @desc    Approve a quiz
// @access  Private/Admin/Moderator
router.put('/approve/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    
    quiz.isApproved = true;
    quiz.approvedBy = req.user.id;
    
    await quiz.save();
    
    res.json(quiz);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/quizzes/:id
// @desc    Delete a quiz
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    
    // Check if user has permission to delete
    const user = await User.findById(req.user.id).select('-password');
    if (quiz.createdBy.toString() !== req.user.id && 
        user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({ msg: 'Not authorized to delete this quiz' });
    }
    
    await quiz.remove();
    
    res.json({ msg: 'Quiz removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/quizzes/rate/:id
// @desc    Rate a quiz
// @access  Private
router.put('/rate/:id', [
  auth,
  [
    check('rating', 'Rating is required and must be between 1 and 5').isInt({ min: 1, max: 5 })
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { rating, review } = req.body;
    
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    
    // Check if user has already rated
    const ratingIndex = quiz.ratings.findIndex(
      r => r.user.toString() === req.user.id
    );
    
    if (ratingIndex !== -1) {
      // Update existing rating
      quiz.ratings[ratingIndex].rating = rating;
      if (review) quiz.ratings[ratingIndex].review = review;
      quiz.ratings[ratingIndex].date = Date.now();
    } else {
      // Add new rating
      quiz.ratings.push({
        user: req.user.id,
        rating,
        review,
        date: Date.now()
      });
    }
    
    // Calculate average rating
    const totalRating = quiz.ratings.reduce((sum, item) => sum + item.rating, 0);
    quiz.averageRating = totalRating / quiz.ratings.length;
    
    await quiz.save();
    
    res.json(quiz);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/quizzes/play/:id
// @desc    Increment play count for a quiz
// @access  Public
router.put('/play/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    
    quiz.totalPlays += 1;
    await quiz.save();
    
    res.json({ totalPlays: quiz.totalPlays });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Quiz not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/quizzes/popular
// @desc    Get popular quizzes
// @access  Public
router.get('/popular/:limit', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    
    const quizzes = await Quiz.find({ isPublic: true, isApproved: true })
      .sort({ totalPlays: -1, averageRating: -1 })
      .limit(limit)
      .populate('category', ['name'])
      .populate('createdBy', ['name', 'avatar']);
    
    res.json(quizzes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/quizzes/user/:user_id
// @desc    Get quizzes created by a user
// @access  Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ 
      createdBy: req.params.user_id,
      isPublic: true,
      isApproved: true
    })
      .sort({ date: -1 })
      .populate('category', ['name']);
    
    res.json(quizzes);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router; 