const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem('sg_user') || 'null'); }
  catch { localStorage.removeItem('sg_user'); localStorage.removeItem('sg_token'); return null; }
};
export const setSession = (t, u) => { localStorage.setItem('sg_token', t); localStorage.setItem('sg_user', JSON.stringify(u)); };
export const logout = () => { const target = getUser()?.role === 'admin' ? '/admin-login' : '/login'; localStorage.removeItem('sg_token'); localStorage.removeItem('sg_user'); location.href = target; };
export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try { res = await fetch(BASE + (path.startsWith('/') ? path : '/' + path), { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('sg_token') }, body: body && JSON.stringify(body) }); }
  catch { throw { message: 'Network error. Please check your connection and try again.' }; }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.startsWith('/auth')) { alert(data.message); logout(); }
  if (!res.ok) throw { status: res.status, ...data, message: data.message || 'Something went wrong.' };
  return data;
}
