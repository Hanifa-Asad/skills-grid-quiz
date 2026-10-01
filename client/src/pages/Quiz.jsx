import { useEffect, useRef, useState } from 'react'; import { useNavigate, useParams } from 'react-router-dom'; import { api } from '../api';
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
export default function Quiz() {
  const { id } = useParams(), nav = useNavigate(); const [d, setD] = useState(null), [ans, setAns] = useState({}), [i, setI] = useState(0), [err, setErr] = useState(''), [left, setLeft] = useState(null), [confirm, setC] = useState(false), [busy, setBusy] = useState(false);
  const sub = useRef(false), ansRef = useRef({}), saveQueue = useRef(Promise.resolve()); ansRef.current = ans;
  useEffect(() => { api(`/quizzes/${id}/start`, { method: 'POST' }).then(r => { setD(r); setAns(Object.fromEntries(r.answers.map(a => [a.questionId, a.optionId])));
    if (r.endsAt) { const off = Date.now() - r.serverNow; r._end = new Date(r.endsAt).getTime() - off; setLeft(Math.max(0, Math.round((r._end - Date.now()) / 1000))); } })
    .catch(e => e.attemptId ? nav(`/result/${e.attemptId}`, { replace: true }) : setErr(e.message || 'Unable to load the quiz. Please try again.')); }, [id]);
  const submit = async (expired = false) => { if (sub.current) return; sub.current = true; setBusy(true); setC(false); setErr('');
    try {
      await saveQueue.current.catch(() => {});
      const body = expired ? undefined : { answers: Object.entries(ansRef.current).map(([questionId, optionId]) => ({ questionId, optionId })) };
      const r = await api(`/quizzes/${id}/submit`, { method: 'POST', body }); nav(`/result/${r.attemptId}`, { replace: true });
    }
    catch (e) { sub.current = false; setBusy(false); setErr(e.message); } };
  useEffect(() => { if (left === null) return; if (left <= 0) { submit(true); return; } const t = setTimeout(() => setLeft(d?._end ? Math.max(0, Math.ceil((d._end - Date.now()) / 1000)) : l => l - 1), 1000); return () => clearTimeout(t); }, [left]);
  const pick = (q, o) => {
    if (busy) return;
    setErr('');
    setAns(a => ({ ...a, [q]: o }));
    saveQueue.current = saveQueue.current.catch(() => {}).then(() => api(`/quizzes/${id}/answer`, { method: 'PUT', body: { questionId: q, optionId: o } }));
    saveQueue.current.catch(e => setErr(e.message || 'Unable to save this answer.'));
  };
  if (err && !d) return <div className="err">{err}</div>; if (!d) return <p>Loading…</p>;
  const qs = d.questions, q = qs[i], n = qs.length, answered = Object.keys(ans).length;
  return (<>
    <div className="card"><div className="qhead"><div><div className="muted sm">Modern Web Application Development</div><b>HTML Quiz</b></div><div className="grow" />
      {left !== null && <div className={'timer' + (left < 60 ? ' low' : '')} aria-label="Time remaining">⏱ {fmt(left)}</div>}</div>
      <div className="qhead" style={{ marginTop: 8 }}><span>Question {i + 1} of {n}</span><div className="grow" /><span className="muted">{answered} / {n} answered</span></div>
      <div className="bar"><i style={{ width: ((i + 1) / n) * 100 + '%' }} /></div></div>
    {err && <div className="err" role="alert">{err}</div>}
    <div className="card"><fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Q{i + 1}. {q.text}</legend>
      {q.options.map(o => <label key={o._id} className={'opt' + (ans[q._id] === o._id ? ' sel' : '')}><input type="radio" name={q._id} disabled={busy} checked={ans[q._id] === o._id} onChange={() => pick(q._id, o._id)} />{o.text}</label>)}</fieldset>
      <div className="row"><button className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button>
        {i < n - 1 ? <button className="btn" onClick={() => setI(i + 1)}>Next</button> : <button className="btn" disabled={busy} onClick={() => setC(true)}>Submit Quiz</button>}</div></div>
    <div className="card"><div className="nav" role="navigation" aria-label="Question navigation">{qs.map((x, k) => <button key={x._id} className={k === i ? 'cur' : ans[x._id] ? 'ans' : ''} onClick={() => setI(k)} aria-label={`Question ${k + 1}${ans[x._id] ? ', answered' : ''}`}>{k + 1}</button>)}</div>
      <p className="muted sm" style={{ marginTop: 12 }}><button className="btn ghost sm2" onClick={() => setC(true)} disabled={busy}>Submit Quiz</button></p></div>
    {confirm && <div className="modal" role="dialog" aria-modal="true"><div className="card"><h2>Are you sure you want to submit your quiz?</h2><p className="muted">{n - answered ? `${n - answered} question(s) unanswered. ` : ''}You cannot retake this quiz.</p>
      <div className="row"><button className="btn ghost" onClick={() => setC(false)}>Cancel</button><button className="btn" onClick={submit}>Submit Quiz</button></div></div></div>}</>);
}
