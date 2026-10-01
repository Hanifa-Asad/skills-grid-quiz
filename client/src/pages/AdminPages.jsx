import { useEffect, useState } from 'react'; import { Link } from 'react-router-dom'; import { api } from '../api';
const useLoad = p => { const [d, setD] = useState(null), [e, setE] = useState(''); useEffect(() => { api(p).then(setD).catch(x => setE(x.message)); }, [p]); return [d, e]; };
export function AdminDashboard() { const [d, e] = useLoad('/admin/dashboard'); if (e) return <div className="err">{e}</div>; if (!d) return <p>Loading…</p>;
  return <div className="grid">{[['Total Students', d.totalStudents], ['Total Quiz Attempts', d.totalAttempts], ['Completed Attempts', d.completedAttempts], ['Average Score', d.averageScore + '%']].map(([k, v]) => <div key={k} className="card stat"><span className="muted sm">{k}</span><b>{v}</b></div>)}</div>; }
export function AdminResults() {
  const [q, setQ] = useState(''), [g, setG] = useState(''); const [d, e] = useLoad(`/admin/results?q=${encodeURIComponent(q)}&grade=${encodeURIComponent(g)}`);
  return (<div className="card"><h2>Quiz Results</h2><div className="filters"><input placeholder="Search students…" aria-label="Search students" value={q} onChange={x => setQ(x.target.value)} />
    <select aria-label="Filter by grade" value={g} onChange={x => setG(x.target.value)}><option value="">All grades</option>{['A+', 'A', 'B', 'C', 'D', 'F'].map(x => <option key={x}>{x}</option>)}</select></div>
    {e && <div className="err">{e}</div>}<div className="scroll"><table><thead><tr>{['Student Name', 'Quiz', 'Score', 'Percentage', 'Grade', 'Attempt', 'Status', 'Submitted At', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>
      {d?.map(a => <tr key={a._id}><td>{a.studentId?.name}</td><td>{a.quizId?.title}</td><td>{a.status === 'completed' ? `${a.score}/${a.totalQuestions}` : '—'}</td><td>{a.percentage != null ? a.percentage + '%' : '—'}</td><td>{a.grade || '—'}</td><td>{a.attemptNumber}</td>
        <td><span className={'badge ' + (a.status === 'completed' ? 'ok' : '')}>{a.status === 'completed' ? 'Completed' : 'In Progress'}</span></td><td>{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
        <td>{a.status === 'completed' && <Link className="btn sm2" to={a._id}>View Details</Link>}</td></tr>)}</tbody></table></div></div>);
}
export function AdminStudents() { const [d, e] = useLoad('/admin/students'); return (<div className="card"><h2>Students</h2>{e && <div className="err">{e}</div>}<div className="scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Student ID</th></tr></thead><tbody>{d?.map(s => <tr key={s._id}><td>{s.name}</td><td>{s.email}</td><td>{s.studentId || '—'}</td></tr>)}</tbody></table></div></div>); }
