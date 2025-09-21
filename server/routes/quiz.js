const express = require('express');
const Quiz = require('../models/Quiz');
const { verifyToken } = require('../middleware/auth');
const { generateQuizCode } = require('../utils/quizCode');
const router = express.Router();

// Create a new quiz
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    // Validate quiz data
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Title and questions are required' });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || !q.options || q.options.length !== 4 || 
          q.correctAnswer === undefined || !q.points) {
        return res.status(400).json({ 
          message: `Question ${i + 1} is missing required fields` 
        });
      }
    }

    // Generate a unique quiz code (always uppercase)
    const quizCode = generateQuizCode().toUpperCase();

    const quiz = new Quiz({
      title,
      description,
      questions,
      adminId: req.adminId,
      quizCode,
      isActive: true 
    });

    await quiz.save();

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        questionsCount: quiz.questions.length,
        totalPoints: quiz.totalPoints
      },
      quizCode // return code to players
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Server error creating quiz' });
  }
});

// Get all quizzes for admin
router.get('/my-quizzes', verifyToken, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ adminId: req.adminId })
      .select('title description questionsCount totalPoints createdAt isActive quizCode')
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Server error fetching quizzes' });
  }
});

// Get specific quiz
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ 
      _id: req.params.id, 
      adminId: req.adminId 
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Server error fetching quiz' });
  }
});

// Update quiz
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    const quiz = await Quiz.findOne({ 
      _id: req.params.id, 
      adminId: req.adminId 
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Update quiz fields
    if (title) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions) {
      // Validate questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question || !q.options || q.options.length !== 4 || 
            q.correctAnswer === undefined || !q.points) {
          return res.status(400).json({ 
            message: `Question ${i + 1} is missing required fields` 
          });
        }
      }
      quiz.questions = questions;
    }

    await quiz.save();

    res.json({
      message: 'Quiz updated successfully',
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        questionsCount: quiz.questions.length,
        totalPoints: quiz.totalPoints,
        quizCode: quiz.quizCode
      }
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Server error updating quiz' });
  }
});

// Delete quiz
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ 
      _id: req.params.id, 
      adminId: req.adminId 
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error deleting quiz' });
  }
});

// Join quiz by code (always normalize to uppercase)
router.get('/join/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();

    // Find quiz by code (uppercase only)
    const quiz = await Quiz.findOne({
      quizCode: code
    });

    if (!quiz) {
      return res.status(404).json({ 
        message: 'Quiz not found',
        canJoin: false
      });
    }

    res.json({ 
      message: 'Quiz found',
      quizCode: quiz.quizCode,
      canJoin: true,
      title: quiz.title,
      description: quiz.description,
      questionsCount: quiz.questions.length
    });
  } catch (error) {
    console.error('Join quiz error:', error);
    res.status(500).json({ message: 'Server error joining quiz' });
  }
});

module.exports = router;
