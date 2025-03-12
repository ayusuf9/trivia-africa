const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const Game = require('../../models/Game');
const User = require('../../models/User');
const Quiz = require('../../models/Quiz');
const Category = require('../../models/Category');

// @route   GET api/games
// @desc    Get all active games
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { gameType, status, isPrivate } = req.query;
    
    // Build query
    const query = { status: 'waiting' };
    
    if (gameType) query.gameType = gameType;
    if (status) query.status = status;
    if (isPrivate !== undefined) query.isPrivate = isPrivate === 'true';
    
    const games = await Game.find(query)
      .sort({ date: -1 })
      .populate('createdBy', ['name', 'avatar'])
      .populate('category', ['name'])
      .populate('quiz', ['title', 'description'])
      .populate('players.user', ['name', 'avatar']);
    
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/games/:id
// @desc    Get game by ID
// @access  Public/Private
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('createdBy', ['name', 'avatar'])
      .populate('category', ['name'])
      .populate('quiz', ['title', 'description', 'questions'])
      .populate('players.user', ['name', 'avatar'])
      .populate('winner', ['name', 'avatar']);
    
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }
    
    // If game is private, check password
    if (game.isPrivate && req.query.password !== game.password) {
      // Remove sensitive data
      const sanitizedGame = {
        _id: game._id,
        roomId: game.roomId,
        gameType: game.gameType,
        status: game.status,
        createdBy: game.createdBy,
        category: game.category,
        difficulty: game.difficulty,
        maxPlayers: game.maxPlayers,
        isPrivate: game.isPrivate,
        date: game.date,
        playerCount: game.players.length
      };
      
      return res.json({
        game: sanitizedGame,
        isPasswordProtected: true
      });
    }
    
    res.json(game);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/games
// @desc    Create a game
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('gameType', 'Game type is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        gameType,
        quiz,
        category,
        difficulty,
        maxPlayers,
        isPrivate,
        password,
        teams
      } = req.body;
      
      // Generate unique room ID
      const roomId = uuidv4();
      
      // Create game
      const newGame = new Game({
        roomId,
        gameType,
        status: 'waiting',
        quiz,
        category,
        difficulty,
        createdBy: req.user.id,
        maxPlayers: maxPlayers || 2,
        isPrivate: isPrivate || false,
        password,
        teams: teams || []
      });
      
      // Add creator as first player
      const user = await User.findById(req.user.id).select('name avatar');
      
      newGame.players.push({
        user: req.user.id,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        timeSpent: 0,
        isActive: true
      });
      
      const game = await newGame.save();
      
      // Populate player data
      const populatedGame = await Game.findById(game._id)
        .populate('createdBy', ['name', 'avatar'])
        .populate('category', ['name'])
        .populate('quiz', ['title', 'description'])
        .populate('players.user', ['name', 'avatar']);
      
      res.json(populatedGame);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/games/join/:id
// @desc    Join a game
// @access  Private
router.put('/join/:id', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }
    
    // Check if game is waiting for players
    if (game.status !== 'waiting') {
      return res.status(400).json({ msg: 'Game has already started or ended' });
    }
    
    // Check if game is full
    if (game.players.length >= game.maxPlayers) {
      return res.status(400).json({ msg: 'Game is full' });
    }
    
    // Check if user is already in the game
    if (game.players.some(player => player.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'You are already in this game' });
    }
    
    // Check password for private games
    if (game.isPrivate && req.body.password !== game.password) {
      return res.status(401).json({ msg: 'Invalid password' });
    }
    
    // Add user to game
    game.players.push({
      user: req.user.id,
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      timeSpent: 0,
      isActive: true
    });
    
    // If team game, add to specified team
    if (game.gameType === 'team' && req.body.teamName) {
      const teamIndex = game.teams.findIndex(team => team.name === req.body.teamName);
      
      if (teamIndex !== -1) {
        game.teams[teamIndex].players.push(req.user.id);
      } else {
        return res.status(400).json({ msg: 'Team not found' });
      }
    }
    
    await game.save();
    
    // Populate player data
    const populatedGame = await Game.findById(game._id)
      .populate('createdBy', ['name', 'avatar'])
      .populate('category', ['name'])
      .populate('quiz', ['title', 'description'])
      .populate('players.user', ['name', 'avatar']);
    
    res.json(populatedGame);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/games/leave/:id
// @desc    Leave a game
// @access  Private
router.put('/leave/:id', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }
    
    // Check if user is in the game
    const playerIndex = game.players.findIndex(
      player => player.user.toString() === req.user.id
    );
    
    if (playerIndex === -1) {
      return res.status(400).json({ msg: 'You are not in this game' });
    }
    
    // Remove user from game
    game.players.splice(playerIndex, 1);
    
    // If team game, remove from team
    if (game.gameType === 'team') {
      for (let i = 0; i < game.teams.length; i++) {
        const playerTeamIndex = game.teams[i].players.findIndex(
          player => player.toString() === req.user.id
        );
        
        if (playerTeamIndex !== -1) {
          game.teams[i].players.splice(playerTeamIndex, 1);
          break;
        }
      }
    }
    
    // If game is empty, delete it
    if (game.players.length === 0) {
      await game.remove();
      return res.json({ msg: 'Game deleted (empty)' });
    }
    
    // If creator left, assign new creator
    if (game.createdBy.toString() === req.user.id) {
      game.createdBy = game.players[0].user;
    }
    
    await game.save();
    
    res.json({ msg: 'Left game successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/games/start/:id
// @desc    Start a game
// @access  Private
router.put('/start/:id', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }
    
    // Check if user is the creator
    if (game.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only the creator can start the game' });
    }
    
    // Check if game is waiting
    if (game.status !== 'waiting') {
      return res.status(400).json({ msg: 'Game has already started or ended' });
    }
    
    // Check if there are enough players
    if (game.players.length < 2) {
      return res.status(400).json({ msg: 'Need at least 2 players to start' });
    }
    
    // Update game status
    game.status = 'active';
    game.startTime = Date.now();
    
    await game.save();
    
    // Populate player data
    const populatedGame = await Game.findById(game._id)
      .populate('createdBy', ['name', 'avatar'])
      .populate('category', ['name'])
      .populate('quiz', ['title', 'description', 'questions'])
      .populate('players.user', ['name', 'avatar']);
    
    res.json(populatedGame);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/games/end/:id
// @desc    End a game
// @access  Private
router.put('/end/:id', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }
    
    // Check if user is the creator
    if (game.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only the creator can end the game' });
    }
    
    // Check if game is active
    if (game.status !== 'active') {
      return res.status(400).json({ msg: 'Game is not active' });
    }
    
    // Update game status
    game.status = 'completed';
    game.endTime = Date.now();
    
    // Determine winner
    if (game.gameType === 'team') {
      // Find winning team
      let highestScore = -1;
      let winningTeam = null;
      
      for (const team of game.teams) {
        if (team.score > highestScore) {
          highestScore = team.score;
          winningTeam = team.name;
        }
      }
      
      game.winningTeam = winningTeam;
    } else {
      // Find winning player
      let highestScore = -1;
      let winner = null;
      
      for (const player of game.players) {
        if (player.score > highestScore) {
          highestScore = player.score;
          winner = player.user;
        }
      }
      
      game.winner = winner;
    }
    
    await game.save();
    
    // Populate player data
    const populatedGame = await Game.findById(game._id)
      .populate('createdBy', ['name', 'avatar'])
      .populate('category', ['name'])
      .populate('quiz', ['title', 'description'])
      .populate('players.user', ['name', 'avatar'])
      .populate('winner', ['name', 'avatar']);
    
    res.json(populatedGame);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/games/answer/:id
// @desc    Submit answer for a game
// @access  Private
router.put('/answer/:id', auth, async (req, res) => {
  try {
    const { questionId, answer, timeSpent, isCorrect } = req.body;
    
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }
    
    // Check if game is active
    if (game.status !== 'active') {
      return res.status(400).json({ msg: 'Game is not active' });
    }
    
    // Check if user is in the game
    const playerIndex = game.players.findIndex(
      player => player.user.toString() === req.user.id
    );
    
    if (playerIndex === -1) {
      return res.status(400).json({ msg: 'You are not in this game' });
    }
    
    // Update player stats
    if (isCorrect) {
      game.players[playerIndex].correctAnswers += 1;
      game.players[playerIndex].score += 10; // Base score
      
      // Bonus for fast answers
      const timeBonus = Math.max(0, 5 - Math.floor(timeSpent / 1000));
      game.players[playerIndex].score += timeBonus;
    } else {
      game.players[playerIndex].wrongAnswers += 1;
    }
    
    game.players[playerIndex].timeSpent += timeSpent;
    
    // Update team score if team game
    if (game.gameType === 'team') {
      for (let i = 0; i < game.teams.length; i++) {
        if (game.teams[i].players.includes(req.user.id)) {
          if (isCorrect) {
            game.teams[i].score += 10 + Math.max(0, 5 - Math.floor(timeSpent / 1000));
          }
          break;
        }
      }
    }
    
    await game.save();
    
    res.json({
      playerId: req.user.id,
      score: game.players[playerIndex].score,
      correctAnswers: game.players[playerIndex].correctAnswers,
      wrongAnswers: game.players[playerIndex].wrongAnswers
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/games/user/:user_id
// @desc    Get games for a user
// @access  Private
router.get('/user/:user_id', auth, async (req, res) => {
  try {
    const games = await Game.find({
      'players.user': req.params.user_id
    })
      .sort({ date: -1 })
      .populate('createdBy', ['name', 'avatar'])
      .populate('category', ['name'])
      .populate('quiz', ['title'])
      .populate('winner', ['name', 'avatar']);
    
    res.json(games);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router; 