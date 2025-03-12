import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch } from 'react-redux';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/routing/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import QuizList from './pages/QuizList';
import QuizDetail from './pages/QuizDetail';
import PlayQuiz from './pages/PlayQuiz';
import CreateQuiz from './pages/CreateQuiz';
import EditQuiz from './pages/EditQuiz';
import Leaderboard from './pages/Leaderboard';
import Multiplayer from './pages/Multiplayer';
import GameRoom from './pages/GameRoom';
import NotFound from './pages/NotFound';

// Redux actions
import { loadUser } from './redux/slices/authSlice';
import { setAuthToken } from './utils/setAuthToken';

// Check for token in localStorage
if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute component={Dashboard} />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/quizzes" element={<QuizList />} />
          <Route path="/quizzes/:id" element={<QuizDetail />} />
          <Route path="/play/:id" element={<PrivateRoute component={PlayQuiz} />} />
          <Route path="/create-quiz" element={<PrivateRoute component={CreateQuiz} />} />
          <Route path="/edit-quiz/:id" element={<PrivateRoute component={EditQuiz} />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/multiplayer" element={<PrivateRoute component={Multiplayer} />} />
          <Route path="/game/:id" element={<PrivateRoute component={GameRoom} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ToastContainer position="bottom-right" />
    </>
  );
};

export default App; 