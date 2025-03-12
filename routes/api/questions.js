const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Question = require('../../models/Question');
const User = require('../../models/User');

// @route   GET api/questions
// @desc    Get all questions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    // Filter options
    const { category, difficulty, type, limit = 20, page = 1, approved } = req.query;
    
    // Build query
    const query = {};
    
    // Only admins and moderators can see unapproved questions
    if (user.role !== 'admin' && user.role !== 'moderator') {
      query.isApproved = true;
    } else if (approved !== undefined) {
      query.isApproved = approved === 'true';
    }
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const questions = await Question.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('category', ['name'])
      .populate('createdBy', ['name']);
      
    const total = await Question.countDocuments(query);
    
    res.json({
      questions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/questions/:id
// @desc    Get question by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('category', ['name'])
      .populate('createdBy', ['name'])
      .populate('approvedBy', ['name']);
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    
    // Check if user has permission to view
    const user = await User.findById(req.user.id).select('-password');
    if (!question.isApproved && user.role !== 'admin' && user.role !== 'moderator' && 
        question.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to view this question' });
    }
    
    res.json(question);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/questions
// @desc    Create a question
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Question text is required').not().isEmpty(),
      check('type', 'Question type is required').not().isEmpty(),
      check('difficulty', 'Difficulty level is required').not().isEmpty(),
      check('category', 'Category is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        text,
        type,
        difficulty,
        category,
        options,
        correctAnswer,
        explanation,
        mediaUrl,
        mediaType,
        points,
        timeLimit,
        tags
      } = req.body;
      
      // Validate options based on question type
      if (type === 'multiple-choice' && (!options || options.length < 2)) {
        return res.status(400).json({ msg: 'Multiple choice questions require at least 2 options' });
      }
      
      if (type === 'true-false' && (!options || options.length !== 2)) {
        return res.status(400).json({ msg: 'True/False questions require exactly 2 options' });
      }
      
      // Create question
      const newQuestion = new Question({
        text,
        type,
        difficulty,
        category,
        options: options || [],
        correctAnswer,
        explanation,
        mediaUrl,
        mediaType: mediaUrl ? (mediaType || 'image') : 'none',
        points: points || 10,
        timeLimit: timeLimit || 30,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        createdBy: req.user.id,
        isApproved: false
      });
      
      // Auto-approve if user is admin or moderator
      const user = await User.findById(req.user.id).select('-password');
      if (user.role === 'admin' || user.role === 'moderator') {
        newQuestion.isApproved = true;
        newQuestion.approvedBy = req.user.id;
      }
      
      const question = await newQuestion.save();
      
      res.json(question);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/questions/:id
// @desc    Update a question
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    
    // Check if user has permission to update
    const user = await User.findById(req.user.id).select('-password');
    if (question.createdBy.toString() !== req.user.id && 
        user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({ msg: 'Not authorized to update this question' });
    }
    
    const {
      text,
      type,
      difficulty,
      category,
      options,
      correctAnswer,
      explanation,
      mediaUrl,
      mediaType,
      points,
      timeLimit,
      tags,
      isActive
    } = req.body;
    
    // Build question object
    const questionFields = {};
    if (text) questionFields.text = text;
    if (type) questionFields.type = type;
    if (difficulty) questionFields.difficulty = difficulty;
    if (category) questionFields.category = category;
    if (options) questionFields.options = options;
    if (correctAnswer) questionFields.correctAnswer = correctAnswer;
    if (explanation) questionFields.explanation = explanation;
    if (mediaUrl) {
      questionFields.mediaUrl = mediaUrl;
      questionFields.mediaType = mediaType || 'image';
    } else if (mediaUrl === '') {
      questionFields.mediaUrl = '';
      questionFields.mediaType = 'none';
    }
    if (points) questionFields.points = points;
    if (timeLimit) questionFields.timeLimit = timeLimit;
    if (tags) questionFields.tags = tags.split(',').map(tag => tag.trim());
    if (isActive !== undefined) questionFields.isActive = isActive;
    
    // If not admin/moderator, set isApproved to false when updating
    if (user.role !== 'admin' && user.role !== 'moderator') {
      questionFields.isApproved = false;
      questionFields.approvedBy = null;
    }
    
    // Update
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      { $set: questionFields },
      { new: true }
    );
    
    res.json(updatedQuestion);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/questions/approve/:id
// @desc    Approve a question
// @access  Private/Admin/Moderator
router.put('/approve/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    
    question.isApproved = true;
    question.approvedBy = req.user.id;
    
    await question.save();
    
    res.json(question);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/questions/:id
// @desc    Delete a question
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    
    // Check if user has permission to delete
    const user = await User.findById(req.user.id).select('-password');
    if (question.createdBy.toString() !== req.user.id && 
        user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({ msg: 'Not authorized to delete this question' });
    }
    
    await question.remove();
    
    res.json({ msg: 'Question removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/questions/random
// @desc    Get random questions
// @access  Private
router.get('/random/:count', auth, async (req, res) => {
  try {
    const { category, difficulty, type } = req.query;
    const count = parseInt(req.params.count) || 10;
    
    // Build query
    const query = { isApproved: true, isActive: true };
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;
    
    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: count } }
    ]);
    
    res.json(questions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 