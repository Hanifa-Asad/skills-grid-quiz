import React from 'react'; import ReactDOM from 'react-dom/client'; import { BrowserRouter, Routes, Route, Navigate, Link, NavLink, Outlet } from 'react-router-dom';
import { getUser, logout } from './api'; import Credit from './components/Credit'; import './styles.css';
import Login from './pages/Login'; import AdminLogin from './pages/AdminLogin'; import Signup from './pages/Signup'; import StudentDashboard from './pages/StudentDashboard'; import QuizIntro from './pages/QuizIntro'; import Quiz from './pages/Quiz'; import Result from './pages/Result';
import { AdminDashboard, AdminResults, AdminStudents } from './pages/AdminPages'; import { QuestionBank, QuizSettings } from './pages/AdminBank';

const Brand = () => <Link to="/" className="brand"><img src="/logo.jpg" alt="Skills Grid logo" /><span>Skills Grid</span></Link>;
function Guard({ role, children }) { const u = getUser(); if (!u) return <Navigate to={role === 'admin' ? '/admin-login' : '/login'} replace />; if (role && u.role !== role) return <Navigate to={u.role === 'admin' ? '/admin' : '/dashboard'} replace />; return children; }
function StudentLayout() { const u = getUser(); return (<><header className="top"><Brand /><div className="grow" /><span className="muted">{u.name}</span><button className="btn ghost" onClick={logout}>Logout</button></header><main className="wrap"><Outlet /></main><Credit /></>); }
function AdminLayout() { return (<div className="admin"><aside><Brand /><nav>
  {[['/admin', 'Dashboard'], ['/admin/quizzes', 'Quizzes'], ['/admin/questions', 'Question Bank'], ['/admin/students', 'Students'], ['/admin/results', 'Results']].map(([to, l]) => <NavLink key={to} to={to} end={to === '/admin'}>{l}</NavLink>)}
  <a href="#" onClick={e => { e.preventDefault(); logout(); }}>Logout</a></nav></aside><main className="wrap"><h1 className="muted sm">Admin Dashboard</h1><Outlet /><Credit /></main></div>); }
const Home = () => { const u = getUser(); return <Navigate to={!u ? '/login' : u.role === 'admin' ? '/admin' : '/dashboard'} replace />; };

ReactDOM.createRoot(document.getElementById('root')).render(<BrowserRouter><Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/admin-login" element={<AdminLogin />} />
  <Route path="/signup" element={<Signup />} />
  <Route element={<Guard role="student"><StudentLayout /></Guard>}>
    <Route path="/dashboard" element={<StudentDashboard />} /><Route path="/quiz/:id" element={<QuizIntro />} /><Route path="/quiz/:id/take" element={<Quiz />} /><Route path="/result/:attemptId" element={<Result />} />
  </Route>
  <Route path="/admin" element={<Guard role="admin"><AdminLayout /></Guard>}>
    <Route index element={<AdminDashboard />} /><Route path="results" element={<AdminResults />} /><Route path="results/:attemptId" element={<Result admin />} />
    <Route path="students" element={<AdminStudents />} /><Route path="questions" element={<QuestionBank />} /><Route path="quizzes" element={<QuizSettings />} />
  </Route>
</Routes></BrowserRouter>);
