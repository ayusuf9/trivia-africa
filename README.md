# African Trivia Platform

A comprehensive, engaging, and gamified trivia platform centered around African-themed content. This application features user authentication, diverse quiz types, multiplayer functionality, and a rich content library focused on African history, culture, geography, and more.

## Features

- **User Authentication and Profiles**: Social sign-in, customizable profiles, and performance analytics
- **Quiz & Trivia Games**: Multiple question types, diverse categories, and difficulty levels
- **Puzzles and Interactive Games**: Word puzzles, crosswords, and timed challenges
- **Multiplayer Features**: Real-time contests, tournaments, and team battles
- **Game Creation Tool**: Create and share custom quizzes and puzzles
- **Gamification**: Points, badges, levels, and achievements
- **AI Integration**: Adaptive learning and personalized recommendations
- **Social Interaction**: Community forums and social media integration
- **Rich Content Library**: Curated African-themed content
- **Mobile-First Design**: Responsive across all devices

## Tech Stack

- **Frontend**: React.js with Redux for state management
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Real-time Communication**: Socket.io
- **Authentication**: JWT, Passport.js
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/african-trivia-platform.git
   cd african-trivia-platform
   ```

2. Install server dependencies
   ```
   npm install
   ```

3. Install client dependencies
   ```
   npm run install-client
   ```

4. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### Running the Application

#### Development Mode
```
npm run dev
```
This will start both the server and client in development mode.

#### Production Build
```
npm run build
npm start
```

## Project Structure

```
african-trivia-platform/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # React source files
│       ├── components/     # UI components
│       ├── pages/          # Page components
│       ├── redux/          # Redux state management
│       ├── services/       # API services
│       └── utils/          # Utility functions
├── config/                 # Configuration files
├── controllers/            # Request handlers
├── middleware/             # Express middleware
├── models/                 # Mongoose models
├── routes/                 # API routes
├── utils/                  # Utility functions
└── server.js              # Express server entry point
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 