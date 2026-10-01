import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setSession } from '../api';
import Credit from '../components/Credit';

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { identifier, password, role: 'admin' }
      });
      setSession(data.token, data.user);
      nav('/admin');
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  };

  return (
    <>
      <div className="card center">
        <img src="/logo.jpg" alt="Skills Grid logo" />
        <h2>Trainer Login</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            required
            autoComplete="username"
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {err && <div className="err" role="alert">{err}</div>}

          <button className="btn" style={{ width: '100%', marginTop: 16 }} disabled={busy}>
            {busy ? 'Signing in…' : 'Login as Admin'}
          </button>
        </form>

        <p className="muted sm" style={{ marginTop: 14 }}>
          <Link to="/login">Student login</Link>
        </p>
      </div>
      <Credit className="credit-login" />
    </>
  );
}
