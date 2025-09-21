const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(options) {
        return options.length === 4;
      },
      message: 'Each question must have exactly 4 options'
    }
  },
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  points: {
    type: Number,
    required: true,
    min: 1
  },
  timer: {
    type: Number,
    default: 10,
    min: 5,
    max: 60
  }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  questions: { type: [questionSchema], required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  isActive: { type: Boolean, default: false },
  quizCode: { type: String, unique: true, required: true },  // 👈 new field
  createdAt: { type: Date, default: Date.now },
  totalPoints: { type: Number, default: 0 }
});


quizSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((total, q) => total + q.points, 0);
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);
