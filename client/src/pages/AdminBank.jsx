import { useEffect, useState } from 'react'; import { api } from '../api';
const blank = { questionText: '', category: 'HTML', options: [0, 1, 2, 3].map(i => ({ text: '', isCorrect: i === 0 })) };
export function QuestionBank() {
  const [quiz, setQuiz] = useState(null), [list, setList] = useState([]), [form, setForm] = useState(null), [view, setView] = useState(null), [err, setErr] = useState('');
  const load = async () => { try { const [q] = await api('/quizzes'); if (!q) { setErr('No quiz is configured. Run the server seed command first.'); return; } setQuiz(q); setList(await api(`/quizzes/${q._id}/questions`)); } catch (e) { setErr(e.message); } };
  useEffect(() => { load(); }, []);
  const save = async e => { e.preventDefault(); setErr(''); try { form._id ? await api('/questions/' + form._id, { method: 'PUT', body: form }) : await api(`/quizzes/${quiz._id}/questions`, { method: 'POST', body: form }); setForm(null); load(); } catch (x) { setErr(x.message); } };
  const del = async q => { if (confirm('Delete this question? Past results are not affected.')) { await api('/questions/' + q._id, { method: 'DELETE' }); load(); } };
  const setOpt = (i, p) => setForm(f => ({ ...f, options: f.options.map((o, k) => k === i ? { ...o, ...p } : p.isCorrect ? { ...o, isCorrect: false } : o) }));
  if (!quiz) return <div className="card">{err || 'Loading question bank…'}</div>;
  if (form) return (<form className="card" onSubmit={save}><h2>{form._id ? 'Edit' : 'Add'} Question</h2><label htmlFor="qt">Question</label><textarea id="qt" rows="3" required value={form.questionText} onChange={e => setForm({ ...form, questionText: e.target.value })} />
    {form.options.map((o, i) => <div key={i} className="qhead" style={{ marginTop: 8 }}><input type="radio" name="c" style={{ width: 20 }} checked={o.isCorrect} onChange={() => setOpt(i, { isCorrect: true })} aria-label={`Option ${i + 1} is correct`} /><input required placeholder={`Option ${i + 1}`} value={o.text} onChange={e => setOpt(i, { text: e.target.value })} style={{ flex: 1 }} /></div>)}
    <p className="muted sm">Select the radio button next to the correct option.</p>{err && <div className="err">{err}</div>}<div className="row"><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn">Save</button></div></form>);
  return (<div className="card"><div className="qhead"><h2>Question Bank</h2><div className="grow" /><b>Total Questions: {list.length}</b><button className="btn" onClick={() => setForm(structuredClone(blank))}>Add Question</button></div>{err && <div className="err">{err}</div>}
    {view && <div className="info"><b>{view.questionText}</b>{view.options.map((o, i) => <div key={i}>{o.isCorrect ? '✔' : '•'} {o.text}</div>)}<button className="btn ghost sm2" onClick={() => setView(null)}>Close</button></div>}
    <div className="scroll"><table><thead><tr><th>#</th><th>Question</th><th>Category</th><th>Correct Answer</th><th>Actions</th></tr></thead><tbody>{list.map((q, i) => <tr key={q._id}><td>{i + 1}</td><td>{q.questionText}</td><td>{q.category}</td><td>{q.options.find(o => o.isCorrect)?.text}</td>
      <td style={{ whiteSpace: 'nowrap' }}><button className="btn ghost sm2" onClick={() => setView(q)}>View</button> <button className="btn ghost sm2" onClick={() => setForm(structuredClone({ _id: q._id, questionText: q.questionText, category: q.category, options: q.options.map(({ text, isCorrect }) => ({ text, isCorrect })) }))}>Edit</button> <button className="btn danger sm2" onClick={() => del(q)}>Delete</button></td></tr>)}</tbody></table></div></div>);
}
const F = [['title', 'Quiz Name', 'text'], ['courseName', 'Course', 'text'], ['timeLimit', 'Time Limit (minutes)', 'number']];
const T = [['randomOptions', 'Random Options'], ['isActive', 'Quiz Active']];
export function QuizSettings() {
  const [q, setQ] = useState(null), [msg, setMsg] = useState('');
  useEffect(() => { api('/quizzes').then(l => l[0] ? setQ(l[0]) : setMsg('No quiz is configured. Run the server seed command first.')).catch(e => setMsg(e.message)); }, []);
  if (!q) return <div className="card">{msg || 'Loading…'}</div>;
  const save = async () => { try { setQ({ ...q, ...(await api('/quizzes/' + q._id, { method: 'PUT', body: q })) }); setMsg('Saved.'); } catch (e) { setMsg(e.message); } };
  return (<div className="card"><h2>Quiz Settings</h2><p className="muted">Question Bank: {q.questionBankSize} · Questions per attempt: 20 · Attempt Limit: 1 · Allow Retake: OFF</p>
    {F.map(([k, l, t]) => <div key={k}><label htmlFor={k}>{l}</label><input id={k} type={t} min={t === 'number' ? 1 : undefined} max={t === 'number' ? 180 : undefined} value={q[k]} onChange={e => setQ({ ...q, [k]: t === 'number' ? +e.target.value : e.target.value })} /></div>)}
    {T.map(([k, l]) => <label key={k} className="opt"><input type="checkbox" checked={q[k]} onChange={e => setQ({ ...q, [k]: e.target.checked })} />{l}</label>)}
    <h2 className="sm">Grading Scale</h2><p className="muted">90–100 A+ · 80–89 A · 70–79 B · 60–69 C · 50–59 D · Below 50 F</p>
    {msg && <div className="info">{msg}</div>}<button className="btn" onClick={save}>Save Settings</button></div>);
}
