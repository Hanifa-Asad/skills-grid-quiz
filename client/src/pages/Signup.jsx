import { useState } from 'react'; import { Link, useNavigate } from 'react-router-dom'; import { api } from '../api'; import Credit from '../components/Credit';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export default function Signup() {
  const [f, setF] = useState({ name: '', email: '', studentId: '', password: '', confirmPassword: '' }), [errs, setErrs] = useState({}), [err, setErr] = useState(''), [busy, setB] = useState(false), nav = useNavigate();
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const validate = () => { const x = {};
    if (!f.name.trim()) x.name = 'Full name is required.';
    if (!EMAIL.test(f.email.trim())) x.email = 'Please enter a valid email address.';
    if (f.password.length < 8) x.password = 'Password must be at least 8 characters.';
    if (f.confirmPassword !== f.password) x.confirmPassword = 'Passwords do not match.';
    return x; };
  const go = async e => { e.preventDefault(); setErr(''); const x = validate(); setErrs(x); if (Object.keys(x).length) return;
    setB(true);
    try { const d = await api('/auth/register', { method: 'POST', body: { ...f, email: f.email.trim().toLowerCase() } }); nav('/login', { state: { success: d.message } }); }
    catch (x) { setErrs(x.errors || {}); setErr(x.message); setB(false); } };
  const field = (k, label, type = 'text', extra = {}) => (<><label htmlFor={k}>{label}</label><input id={k} type={type} value={f[k]} onChange={set(k)} aria-invalid={!!errs[k]} {...extra} />{errs[k] && <div className="ferr">{errs[k]}</div>}</>);
  return (<><div className="card center"><img src="/logo.jpg" alt="Skills Grid logo" /><h2>Student Sign Up</h2><p className="muted sm">Create your Skills Grid student account</p>
    <form onSubmit={go} noValidate>{field('name', 'Full Name', 'text', { autoComplete: 'name' })}{field('email', 'Email / Gmail', 'email', { autoComplete: 'email' })}
      {field('studentId', 'Student ID (optional)')}{field('password', 'Password', 'password', { autoComplete: 'new-password' })}{field('confirmPassword', 'Confirm Password', 'password', { autoComplete: 'new-password' })}
      {err && <div className="err" role="alert">{err}</div>}<button className="btn" style={{ width: '100%', marginTop: 16 }} disabled={busy}>{busy ? 'Creating account…' : 'Create Account'}</button></form>
    <p className="muted sm" style={{ marginTop: 14 }}>Already have an account? <Link to="/login">Log in</Link></p></div><Credit className="credit-login" /></>);
}
