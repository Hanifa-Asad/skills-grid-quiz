import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

export default function QuizIntro() {
  const { id } = useParams();
  const [q, setQ] = useState(null), [att, setAtt] = useState(), [err, setErr] = useState('');

  useEffect(() => {
    api('/quizzes/' + id).then(setQ).catch(e => setErr(e.message));
    api(`/quizzes/${id}/my-attempt`).then(setAtt).catch(() => {});
  }, [id]);

  if (err) return <div className="err">{err}</div>;
  if (!q) return <p>Loading…</p>;

  return (
    <div className="card center" style={{ maxWidth: 620 }}>
      <img src="/logo.jpg" alt="Skills Grid logo" />
      <div className="muted">{q.courseName}</div>
      <h1>{q.title}</h1>

      <table>
        <tbody>
          <tr><td>Quiz Name</td><td>{q.title}</td></tr>
          <tr><td>Course</td><td>{q.courseName}</td></tr>
          <tr><td>Total Questions</td><td>{q.questionsPerAttempt}</td></tr>
          <tr><td>Question Bank</td><td>{q.questionBankSize} questions</td></tr>
          <tr><td>Time Limit</td><td>{q.timeLimit ? q.timeLimit + ' minutes' : 'No timer'}</td></tr>
          <tr><td>Attempt Limit</td><td>One attempt only</td></tr>
          <tr><td>Question Selection</td><td>{q.randomQuestions ? 'Randomized' : 'Fixed set'}</td></tr>
          <tr><td>Option Order</td><td>{q.randomOptions ? 'Randomized' : 'Fixed order'}</td></tr>
        </tbody>
      </table>

      <div className="info" style={{ textAlign: 'left' }}>
        <ul style={{ margin: '10px 0 0 18px', padding: 0 }}>
          <li>Questions are randomly selected from the question bank.</li>
          <li>Options are shuffled for each attempt and remain fixed while the quiz is in progress.</li>
          <li>Answers are saved automatically.</li>
          <li>Refreshing the page resumes the same ongoing attempt.</li>
          <li>Your result is shown immediately after submission.</li>
        </ul>
      </div>

      {att?.status === 'completed' ? (
        <>
          <div className="info">You have already attempted this quiz.</div>
          <Link className="btn" to={`/result/${att._id}`}>View Result</Link>
        </>
      ) : (
        <>
          <div className="info">You can attempt this quiz only once.</div>
          <Link className="btn" to={`/quiz/${id}/take`}>Start Quiz</Link>
        </>
      )}
    </div>
  );
}

