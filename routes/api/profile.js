const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })
      .populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private
router.post('/', auth, async (req, res) => {
  const {
    bio,
    location,
    interests,
    preferredCategories,
    twitter,
    facebook,
    instagram
  } = req.body;

  // Build profile object
  const profileFields = {};
  profileFields.user = req.user.id;
  if (bio) profileFields.bio = bio;
  if (location) profileFields.location = location;
  if (interests) {
    profileFields.interests = interests.split(',').map(interest => interest.trim());
  }
  if (preferredCategories) {
    profileFields.preferredCategories = preferredCategories.split(',').map(category => category.trim());
  }

  // Build social object
  profileFields.social = {};
  if (twitter) profileFields.social.twitter = twitter;
  if (facebook) profileFields.social.facebook = facebook;
  if (instagram) profileFields.social.instagram = instagram;

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      // Update
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );

      return res.json(profile);
    }

    // Create
    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

    if (!profile) return res.status(400).json({ msg: 'Profile not found' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put('/quiz-history', auth, async (req, res) => {
  const {
    quiz,
    score,
    totalQuestions,
    correctAnswers,
    timeTaken
  } = req.body;

  const newQuiz = {
    quiz,
    score,
    totalQuestions,
    correctAnswers,
    timeTaken
  };

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    profile.quizHistory.unshift(newQuiz);
    
    // Update total points
    profile.totalPoints += score;
    
    // Update experience (simple calculation, can be more complex)
    const experienceGained = Math.floor(score * (correctAnswers / totalQuestions));
    profile.experience += experienceGained;
    
    // Check if level up (simple level calculation)
    const newLevel = Math.floor(profile.experience / 1000) + 1;
    if (newLevel > profile.level) {
      profile.level = newLevel;
    }

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/profile/badges
// @desc    Add badge to profile
// @access  Private
router.put('/badges', auth, async (req, res) => {
  const { name, description, image } = req.body;

  const newBadge = {
    name,
    description,
    image
  };

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Check if badge already exists
    if (profile.badges.some(badge => badge.name === name)) {
      return res.status(400).json({ msg: 'Badge already earned' });
    }

    profile.badges.unshift(newBadge);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/profile/achievements
// @desc    Add achievement to profile
// @access  Private
router.put('/achievements', auth, async (req, res) => {
  const { name, description, points } = req.body;

  const newAchievement = {
    name,
    description,
    points
  };

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Check if achievement already exists
    if (profile.achievements.some(achievement => achievement.name === name)) {
      return res.status(400).json({ msg: 'Achievement already earned' });
    }

    profile.achievements.unshift(newAchievement);
    
    // Add points from achievement
    if (points) {
      profile.totalPoints += points;
    }
    
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/profile/friends/:user_id
// @desc    Add friend to profile
// @access  Private
router.put('/friends/:user_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const friendProfile = await Profile.findOne({ user: req.params.user_id });

    if (!friendProfile) {
      return res.status(404).json({ msg: 'Friend profile not found' });
    }

    // Check if already friends
    if (profile.friends.some(friend => friend.user.toString() === req.params.user_id)) {
      return res.status(400).json({ msg: 'Already friends with this user' });
    }

    profile.friends.unshift({ user: req.params.user_id });
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/profile/friends/:user_id
// @desc    Remove friend from profile
// @access  Private
router.delete('/friends/:user_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index
    const removeIndex = profile.friends.map(friend => friend.user.toString()).indexOf(req.params.user_id);

    if (removeIndex === -1) {
      return res.status(400).json({ msg: 'Friend not found' });
    }

    profile.friends.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/leaderboard
// @desc    Get top profiles by points
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const profiles = await Profile.find()
      .sort({ totalPoints: -1 })
      .limit(10)
      .populate('user', ['name', 'avatar']);
      
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 