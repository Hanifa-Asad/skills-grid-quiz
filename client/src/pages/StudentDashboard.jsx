import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getUser } from '../api';

export default function StudentDashboard() {
  const [quizzes, setQ] = useState(null), [err, setErr] = useState('');
  const user = getUser();

  useEffect(() => { api('/quizzes').then(setQ).catch(e => setErr(e.message)); }, []);

  return (
    <>
      <div className="card">
        <h1>Welcome, {user.name}</h1>
        <p className="muted">Student ID: {user.studentId || 'Not assigned'} · Course: Modern Web Application Development</p>
      </div>

      <h2 className="sm muted">Available Quizzes</h2>
      {err && <div className="err">{err}</div>}
      {!quizzes && !err && <p>Loading…</p>}

      {quizzes?.map(q => {
        const a = q.attempt, done = a?.status === 'completed';
        return (
          <div className="card" key={q._id}>
            <div className="muted sm">{q.courseName}</div>
            <h2>{q.title}</h2>
            <p>
              {q.questionsPerAttempt} questions · {q.timeLimit || 0} minute timer · {q.randomQuestions ? 'Random questions' : 'Fixed questions'} · {q.randomOptions ? 'Randomized options' : 'Fixed options'}
            </p>
            <p>
              Status: <span className={'badge ' + (done ? 'ok' : '')}>{done ? 'Completed' : a ? 'In Progress' : 'Not Attempted'}</span>
              {done && <> · Score: <b>{a.score}/{a.totalQuestions}</b></>}
            </p>
            {done ? (
              <Link className="btn" to={`/result/${a._id}`}>View Result</Link>
            ) : (
              <Link className="btn" to={`/quiz/${q._id}`}>{a ? 'Resume Quiz' : 'Start Quiz'}</Link>
            )}
          </div>
        );
      })}
    </>
  );
}

