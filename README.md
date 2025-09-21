# Real-time Multiplayer Quiz Application

A real-time multiplayer quiz application built with React, Node.js, Socket.IO, and MongoDB. Admins can create quizzes and players can join using a unique code to compete in real-time.

## 🚀 Features

### 👨‍💻 Admin Features
- **Authentication**: Register/Login with email or Google OAuth
- **Quiz Creation**: Create quizzes with multiple choice questions
- **Question Management**: Set timers, points, and correct answers
- **Real-time Control**: Start/stop quizzes and control game flow
- **Live Monitoring**: View player count and live leaderboard

### 🙋 Player Features
- **Easy Join**: Join quizzes with a 6-digit code
- **Real-time Gameplay**: Answer questions with 10-second timers
- **Live Scoring**: Points awarded for correctness and speed
- **Live Leaderboard**: See rankings update in real-time

### 🏆 Game Flow
1. Admin creates quiz → gets unique 6-digit code
2. Players join using the code (up to 30 players)
3. Admin starts the game
4. Questions appear with countdown timers
5. Players answer and see live scores
6. Final leaderboard displayed

## 🛠️ Tech Stack

- **Frontend**: React 18 with Tailwind CSS
- **Backend**: Node.js + Express
- **Real-time**: Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **Deployment**: MongoDB Atlas, Vercel/Netlify, Render/Railway

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quiz-app
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp server/env.example server/.env
   
   # Edit server/.env with your configuration
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/quiz-app
   JWT_SECRET=your_jwt_secret_here
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   # From root directory
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - React app on http://localhost:3000

## 🌐 Deployment

### Backend Deployment (Render/Railway)

1. **Prepare for deployment**
   ```bash
   # In server directory
   npm install --production
   ```

2. **Environment Variables**
   Set these in your hosting platform:
   - `PORT` (auto-assigned)
   - `MONGODB_URI` (MongoDB Atlas connection string)
   - `JWT_SECRET` (random secret string)
   - `GOOGLE_CLIENT_ID` (optional, for Google OAuth)
   - `GOOGLE_CLIENT_SECRET` (optional, for Google OAuth)
   - `NODE_ENV=production`

3. **Deploy to Render**
   - Connect your GitHub repository
   - Select "Web Service"
   - Build command: `cd server && npm install`
   - Start command: `cd server && npm start`
   - Set environment variables

### Frontend Deployment (Vercel/Netlify)

1. **Build the React app**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository
   - Framework preset: Create React App
   - Build command: `cd client && npm run build`
   - Output directory: `client/build`
   - Set environment variable: `REACT_APP_SERVER_URL=https://your-backend-url.com`

3. **Deploy to Netlify**
   - Connect your GitHub repository
   - Build command: `cd client && npm run build`
   - Publish directory: `client/build`
   - Set environment variable: `REACT_APP_SERVER_URL=https://your-backend-url.com`

### Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas account**
   - Go to https://www.mongodb.com/atlas
   - Create a free cluster

2. **Get connection string**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

3. **Update environment variables**
   - Use the Atlas connection string in your backend deployment

## 🔧 Configuration

### Google OAuth (Optional)

1. **Create Google OAuth credentials**
   - Go to Google Cloud Console
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback` (development)
     - `https://your-backend-url.com/api/auth/google/callback` (production)

2. **Update environment variables**
   - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

## 📱 Usage

### For Admins

1. **Register/Login**
   - Go to `/register` or `/login`
   - Create an account or use Google OAuth

2. **Create Quiz**
   - Go to Admin Dashboard
   - Click "Create New Quiz"
   - Add questions with options, correct answers, points, and timers
   - Get unique 6-digit quiz code

3. **Host Game**
   - Share the quiz code with players
   - Go to game control panel
   - Start the quiz when ready
   - Control game flow (next question, end game)

### For Players

1. **Join Quiz**
   - Go to `/join` or `/join/CODE`
   - Enter the 6-digit quiz code
   - Enter your name

2. **Play Game**
   - Wait for quiz to start
   - Answer questions within the time limit
   - See live leaderboard updates
   - View final results

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current admin
- `GET /api/auth/google` - Google OAuth login

### Quiz Management
- `POST /api/quiz/create` - Create new quiz
- `GET /api/quiz/my-quizzes` - Get admin's quizzes
- `GET /api/quiz/:id` - Get specific quiz
- `PUT /api/quiz/:id` - Update quiz
- `DELETE /api/quiz/:id` - Delete quiz

### Socket.IO Events

#### Client to Server
- `join-quiz` - Player joins quiz
- `submit-answer` - Player submits answer
- `start-quiz` - Admin starts quiz
- `next-question` - Admin goes to next question
- `end-quiz` - Admin ends quiz

#### Server to Client
- `joined-quiz` - Player successfully joined
- `player-joined` - New player joined
- `question-start` - Question begins
- `question-end` - Question time up
- `answer-result` - Answer feedback
- `leaderboard-update` - Leaderboard updated
- `quiz-ended` - Quiz finished

## 🐛 Troubleshooting

### Common Issues

1. **Socket connection failed**
   - Check if backend server is running
   - Verify CORS settings
   - Check environment variables

2. **Database connection failed**
   - Verify MongoDB Atlas connection string
   - Check network access settings
   - Ensure database user has proper permissions

3. **Build errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all environment variables are set

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- React team for the amazing framework
- Socket.IO for real-time communication
- MongoDB for the database
- Tailwind CSS for styling
- All contributors and testers
