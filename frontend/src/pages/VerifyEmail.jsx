import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios.js';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }
    api.get(`/auth/verify-email?token=${token}`)
      .then(({ data }) => { setStatus('success'); setMessage(data.message); })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.error || 'Verification failed.'); });
  }, [params]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 40 }}>{status === 'success' ? '✅' : status === 'error' ? '⚠️' : '⏳'}</div>
      <h2>{status === 'verifying' ? 'Verifying your email...' : status === 'success' ? 'Email verified!' : 'Verification failed'}</h2>
      <p style={{ color: '#64748b', maxWidth: 400, textAlign: 'center' }}>{message}</p>
      <Link to="/login" className="link-blue">Go to login</Link>
    </div>
  );
}
