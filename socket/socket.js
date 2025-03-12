const { v4: uuidv4 } = require('uuid');

// Store active game rooms
const gameRooms = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a game room
    socket.on('joinRoom', ({ roomId, userId, username, avatar }) => {
      // Create room if it doesn't exist
      if (!gameRooms.has(roomId)) {
        gameRooms.set(roomId, {
          id: roomId,
          players: [],
          gameState: 'waiting',
          currentQuestion: null,
          scores: {}
        });
      }

      const room = gameRooms.get(roomId);
      
      // Add player to room
      const player = {
        id: userId,
        socketId: socket.id,
        username,
        avatar,
        ready: false
      };
      
      room.players.push(player);
      room.scores[userId] = 0;
      
      // Join socket room
      socket.join(roomId);
      
      // Notify room of new player
      io.to(roomId).emit('playerJoined', {
        player,
        players: room.players,
        gameState: room.gameState
      });
      
      console.log(`${username} joined room ${roomId}`);
    });

    // Player ready
    socket.on('playerReady', ({ roomId, userId }) => {
      const room = gameRooms.get(roomId);
      if (!room) return;
      
      const player = room.players.find(p => p.id === userId);
      if (player) {
        player.ready = true;
      }
      
      // Check if all players are ready
      const allReady = room.players.every(p => p.ready);
      
      if (allReady && room.players.length >= 2) {
        room.gameState = 'starting';
        io.to(roomId).emit('gameStarting', { countdown: 3 });
        
        // Start game after countdown
        setTimeout(() => {
          room.gameState = 'active';
          io.to(roomId).emit('gameStarted', { gameState: 'active' });
        }, 3000);
      } else {
        io.to(roomId).emit('playerStatusUpdate', {
          players: room.players,
          allReady
        });
      }
    });

    // Submit answer
    socket.on('submitAnswer', ({ roomId, userId, questionId, answer, timeRemaining }) => {
      const room = gameRooms.get(roomId);
      if (!room || room.gameState !== 'active') return;
      
      // Calculate score based on correctness and time
      // This would be replaced with actual logic to check answer correctness
      const isCorrect = Math.random() > 0.5; // Placeholder for actual answer checking
      const basePoints = isCorrect ? 100 : 0;
      const timeBonus = isCorrect ? Math.floor(timeRemaining * 0.5) : 0;
      const points = basePoints + timeBonus;
      
      // Update player score
      room.scores[userId] += points;
      
      // Notify room of answer result
      io.to(roomId).emit('answerResult', {
        userId,
        isCorrect,
        points,
        scores: room.scores
      });
    });

    // End game
    socket.on('endGame', ({ roomId }) => {
      const room = gameRooms.get(roomId);
      if (!room) return;
      
      room.gameState = 'ended';
      
      // Calculate final results
      const results = Object.entries(room.scores).map(([userId, score]) => {
        const player = room.players.find(p => p.id === userId);
        return {
          userId,
          username: player ? player.username : 'Unknown',
          score
        };
      }).sort((a, b) => b.score - a.score);
      
      io.to(roomId).emit('gameEnded', { results });
    });

    // Leave room
    socket.on('leaveRoom', ({ roomId, userId }) => {
      leaveRoom(socket, roomId, userId);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // Find and leave all rooms
      for (const [roomId, room] of gameRooms.entries()) {
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
          leaveRoom(socket, roomId, player.id);
        }
      }
    });
  });

  // Helper function to handle leaving a room
  function leaveRoom(socket, roomId, userId) {
    const room = gameRooms.get(roomId);
    if (!room) return;
    
    // Remove player from room
    room.players = room.players.filter(p => p.id !== userId);
    
    // Delete score
    delete room.scores[userId];
    
    // Leave socket room
    socket.leave(roomId);
    
    // Notify room of player leaving
    io.to(roomId).emit('playerLeft', {
      userId,
      players: room.players
    });
    
    // Delete room if empty
    if (room.players.length === 0) {
      gameRooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    }
    // End game if only one player left and game was active
    else if (room.players.length === 1 && room.gameState === 'active') {
      room.gameState = 'ended';
      io.to(roomId).emit('gameEnded', {
        results: [{
          userId: room.players[0].id,
          username: room.players[0].username,
          score: room.scores[room.players[0].id],
          winner: true
        }],
        reason: 'opponent_left'
      });
    }
  }

  // Create a new game room
  io.createGameRoom = () => {
    const roomId = uuidv4();
    gameRooms.set(roomId, {
      id: roomId,
      players: [],
      gameState: 'waiting',
      currentQuestion: null,
      scores: {}
    });
    return roomId;
  };
}; 