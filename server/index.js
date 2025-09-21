// index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const { generateQuizCode } = require('./utils/quizCode');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Socket.IO connection handling
const activeQuizzes = new Map();
const playerSessions = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Player joins quiz
  socket.on('join-quiz', async ({ quizCode, playerName }) => {
    const code = quizCode.toUpperCase();
    console.log('Player trying to join quiz:', { quizCode: code, playerName });
    
    if (!activeQuizzes.has(code)) {
      console.log('Quiz not in active quizzes, checking database...');
      try {
        const Quiz = require('./models/Quiz');
        const quiz = await Quiz.findOne({ quizCode: code }); // ✅ FIXED

        if (!quiz) {
          console.log('Quiz not found in database');
          socket.emit('quiz-error', { message: 'Quiz not found' }); // ✅ FIXED
          return;
        }
        
        console.log('Quiz found in database, creating active session');
        global.createQuiz(quiz.toObject(), quiz.adminId, code);
      } catch (dbError) {
        console.error('Database error:', dbError);
        socket.emit('quiz-error', { message: 'Quiz not found' }); // ✅ FIXED
        return;
      }
    }

    const quiz = activeQuizzes.get(code);
    console.log('Active quiz found:', quiz ? 'Yes' : 'No');
    
    if (quiz.players.length >= 30) {
      socket.emit('quiz-error', { message: 'Quiz is full (max 30 players)' }); // ✅ FIXED
      return;
    }

    // Add player to quiz
    if (!quiz.players.some(p => p.name === playerName)) {
      quiz.players.push({
        name: playerName,
        id: socket.id,         // Use id for consistency
        score: 0,              // Always start with score 0
        answers: []            // Track answers for leaderboard
      });
    }

    playerSessions.set(socket.id, { quizCode: code, playerName });

    socket.join(code);
    console.log('Player added to quiz, emitting joined-quiz event');
    socket.emit('joined-quiz', { quiz: quiz.quizData, playerId: socket.id });
    
    // Notify all players
    io.to(code).emit('player-joined', {
      playerName,
      totalPlayers: quiz.players.length
    });

    // Send leaderboard
    const leaderboard = [...quiz.players] // ✅ FIXED
      .sort((a, b) => b.score - a.score)
      .map(p => ({ name: p.name, score: p.score }));
    
    io.to(code).emit('leaderboard-update', leaderboard);

    // Emit full player list to all clients in the room
    io.to(code).emit('player-list', quiz.players);

  });

  // Admin requests current player list
  socket.on('get-player-list', ({ quizCode }) => {
    const code = quizCode.toUpperCase();
    const quiz = activeQuizzes.get(code);
    if (quiz) {
      socket.emit('player-list', quiz.players);
    }
  });

  // Player submits answer
  socket.on('submit-answer', (data) => {
    try {
      const { answer, timeLeft } = data;
      const session = playerSessions.get(socket.id);
      
      if (!session) return;

      const quiz = activeQuizzes.get(session.quizCode);
      if (!quiz || !quiz.isActive) return;

      const currentQuestion = quiz.quizData.questions[quiz.currentQuestionIndex];
      if (!currentQuestion) return;

      const player = quiz.players.find(p => p.id === socket.id);
      if (!player) return;

      if (player.answers[quiz.currentQuestionIndex] !== undefined) return;

      const isCorrect = answer === currentQuestion.correctAnswer;
      const timeBonus = Math.max(0, timeLeft / 10);
      const points = isCorrect ? Math.floor(currentQuestion.points * (0.5 + timeBonus)) : 0;

      player.answers[quiz.currentQuestionIndex] = { answer, isCorrect, points, timeLeft };
      player.score += points;

      socket.emit('answer-result', {
        isCorrect,
        points,
        correctAnswer: currentQuestion.correctAnswer
      });

      const leaderboard = [...quiz.players] // ✅ FIXED
        .sort((a, b) => b.score - a.score)
        .map(p => ({ name: p.name, score: p.score }));
      
      io.to(session.quizCode).emit('leaderboard-update', leaderboard);

    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  });

  // Admin starts quiz
  socket.on('start-quiz', (data) => {
    const { quizCode } = data;
    const quiz = activeQuizzes.get(quizCode);
    
    if (quiz && quiz.adminId === socket.id && !quiz.isActive) { // ✅ Admin check
      quiz.isActive = true;
      quiz.currentQuestionIndex = 0;
      startQuestion(quizCode);
    }
  });

  // Admin next question
  socket.on('next-question', (data) => {
    const { quizCode } = data;
    const quiz = activeQuizzes.get(quizCode);
    
    if (quiz && quiz.adminId === socket.id && quiz.isActive) { // ✅ Admin check
      quiz.currentQuestionIndex++;
      
      if (quiz.currentQuestionIndex < quiz.quizData.questions.length) {
        startQuestion(quizCode);
      } else {
        endQuiz(quizCode);
      }
    }
  });

  // Admin end quiz
  socket.on('end-quiz', (data) => {
    const { quizCode } = data;
    const quiz = activeQuizzes.get(quizCode);

    if (quiz && quiz.adminId === socket.id) { // ✅ Admin check
      endQuiz(quizCode);
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    const session = playerSessions.get(socket.id);
    if (session) {
      const quiz = activeQuizzes.get(session.quizCode);
      if (quiz) {
        quiz.players = quiz.players.filter(p => p.id !== socket.id);
        
        const leaderboard = [...quiz.players] // ✅ FIXED
          .sort((a, b) => b.score - a.score)
          .map(p => ({ name: p.name, score: p.score }));
        
        io.to(session.quizCode).emit('leaderboard-update', leaderboard);
      }
      playerSessions.delete(socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

// Helper functions
function startQuestion(quizCode) {
  const quiz = activeQuizzes.get(quizCode);
  if (!quiz) return;

  const question = quiz.quizData.questions[quiz.currentQuestionIndex];
  const questionData = {
    questionIndex: quiz.currentQuestionIndex,
    totalQuestions: quiz.quizData.questions.length,
    question: question.question,
    options: question.options,
    points: question.points,
    timer: question.timer || 10
  };

  io.to(quizCode).emit('question-start', questionData);

  quiz.timer = setTimeout(() => {
    io.to(quizCode).emit('question-end', {
      questionIndex: quiz.currentQuestionIndex,
      correctAnswer: question.correctAnswer
    });
  }, (question.timer || 10) * 1000);
}

function endQuiz(quizCode) {
  const quiz = activeQuizzes.get(quizCode);
  if (!quiz) return;

  quiz.isActive = false;
  if (quiz.timer) clearTimeout(quiz.timer);

  const finalLeaderboard = [...quiz.players] // ✅ FIXED
    .sort((a, b) => b.score - a.score)
    .map((p, index) => ({
      position: index + 1,
      name: p.name,
      score: p.score
    }));

  io.to(quizCode).emit('quiz-ended', {
    finalLeaderboard,
    totalQuestions: quiz.quizData.questions.length
  });

  setTimeout(() => activeQuizzes.delete(quizCode), 5 * 60 * 1000);
}

// Create quiz (admin function)
function createQuiz(quizData, adminId, quizId) {
  const quiz = {
    quizData,
    adminId,
    players: [],
    isActive: false,
    currentQuestionIndex: 0,
    createdAt: new Date()
  };
  
  activeQuizzes.set(quizId, quiz);
  return quizId;
}
global.createQuiz = createQuiz;

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
