const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Category = require('../../models/Category');
const User = require('../../models/User');

// @route   GET api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    
    res.json(category);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Category not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/categories
// @desc    Create a category
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      
      if (user.role !== 'admin' && user.role !== 'moderator') {
        return res.status(403).json({ msg: 'Not authorized' });
      }
      
      const { name, description, icon, color, parent } = req.body;
      
      // Check if category already exists
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ msg: 'Category already exists' });
      }
      
      const newCategory = new Category({
        name,
        description,
        icon,
        color,
        parent,
        createdBy: req.user.id
      });
      
      const category = await newCategory.save();
      
      res.json(category);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/categories/:id
// @desc    Update a category
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const { name, description, icon, color, parent, isActive } = req.body;
    
    // Build category object
    const categoryFields = {};
    if (name) categoryFields.name = name;
    if (description) categoryFields.description = description;
    if (icon) categoryFields.icon = icon;
    if (color) categoryFields.color = color;
    if (parent) categoryFields.parent = parent;
    if (isActive !== undefined) categoryFields.isActive = isActive;
    
    let category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    
    // Update
    category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: categoryFields },
      { new: true }
    );
    
    res.json(category);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Category not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/categories/:id
// @desc    Delete a category
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    
    await category.remove();
    
    res.json({ msg: 'Category removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Category not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/categories/parent/:parent_id
// @desc    Get subcategories by parent ID
// @access  Public
router.get('/parent/:parent_id', async (req, res) => {
  try {
    const categories = await Category.find({ parent: req.params.parent_id }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/categories/top-level
// @desc    Get all top-level categories (no parent)
// @access  Public
router.get('/top-level', async (req, res) => {
  try {
    const categories = await Category.find({ parent: { $exists: false } }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 