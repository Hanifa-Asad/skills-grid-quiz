import { useEffect, useState } from 'react'; import { Link, useParams } from 'react-router-dom'; import { api } from '../api';
export default function Result({ admin }) {
  const { attemptId } = useParams(); const [r, setR] = useState(null), [err, setErr] = useState('');
  useEffect(() => { api((admin ? '/admin' : '') + '/results/' + attemptId).then(setR).catch(e => setErr(e.message)); }, [attemptId]);
  if (err) return <div className="err">{err}</div>; if (!r) return <p>Loading…</p>;
  const when = r.submittedAt && new Date(r.submittedAt).toLocaleString();
  return (<>{admin && <Link to="/admin/results">← Back to results</Link>}
    <div className="card"><div className="qhead"><img src="/logo.jpg" alt="" height="56" /><div><div className="muted sm">Skills Grid</div><h1 style={{ margin: 0 }}>{r.quizId?.title} Result</h1></div></div>
      <p><b>{r.studentId?.name}</b> · {r.quizId?.courseName} – {r.quizId?.title}</p>
      <div className="grid">{[['Score', `${r.score} / ${r.totalQuestions}`], ['Percentage', r.percentage + '%'], ['Grade', r.grade], ['Correct', r.correctAnswers], ['Wrong', r.wrongAnswers], ['Attempt', r.attemptNumber]].map(([k, v]) => <div key={k} className="card stat" style={{ margin: 0 }}><span className="muted sm">{k}</span><b>{v}</b></div>)}</div>
      <p>Status: <span className="badge ok">Completed</span> · Submitted: {when}</p></div>
    <h2>Question Review</h2>
    {r.review.map(q => <div key={q.number} className={'card rev ' + (q.isCorrect ? 'ok' : 'bad')}><b>Question {q.number}</b><p>{q.questionText}</p>
      <p><span className="muted">{admin ? 'Student Answer' : 'Your Answer'}:</span> {q.yourAnswer ?? <i>Not answered</i>}</p>
      {q.correctAnswer !== undefined && <p><span className="muted">Correct Answer:</span> {q.correctAnswer}</p>}
      <span className={'badge ' + (q.isCorrect ? 'ok' : 'bad')}>{q.isCorrect ? 'Correct' : 'Wrong'}</span></div>)}
    {!admin && <Link className="btn" to="/dashboard">Back to Dashboard</Link>}</>);
}
