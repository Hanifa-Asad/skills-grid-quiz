import { useState } from 'react'; import { useNavigate, useLocation, Link } from 'react-router-dom'; import { api, setSession } from '../api'; import Credit from '../components/Credit';
export default function Login() {
  const [identifier, setI] = useState(''), [password, setP] = useState(''), [err, setErr] = useState(''), [busy, setB] = useState(false), nav = useNavigate(), ok = useLocation().state?.success;
  const go = async e => { e.preventDefault(); setB(true); setErr(''); try {
    const d = await api('/auth/login', { method: 'POST', body: { identifier, password, role: 'student' } });
    setSession(d.token, d.user);
    nav('/');
  } catch (x) { setErr(x.message); setB(false); } };
  return (<><div className="card center"><img src="/logo.jpg" alt="Skills Grid logo" /><h2>Student Login</h2>{ok && <div className="okmsg" role="status">{ok}</div>}
    <form onSubmit={go}><label htmlFor="i">Email / Student ID</label><input id="i" value={identifier} onChange={e => setI(e.target.value)} required autoComplete="username" />
      <label htmlFor="p">Password</label><input id="p" type="password" value={password} onChange={e => setP(e.target.value)} required autoComplete="current-password" />
      {err && <div className="err" role="alert">{err}</div>}<button className="btn" style={{ width: '100%', marginTop: 16 }} disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button></form>
    <p className="muted sm" style={{ marginTop: 14 }}>New student? <Link to="/signup">Create an account</Link> · <Link to="/admin-login">Trainer login</Link></p>
  </div><Credit className="credit-login" /></>);
}
