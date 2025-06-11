import React, { useState } from 'react';
import axios from 'axios';

interface AuthProps {
  onLogin: (user: { id: string; username: string; email: string; role: string }, token: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const endpoint = isSignUp ? '/api/users/register' : '/api/users/login';
    const payload = isSignUp ? { username, email, password } : { email, password };

    try {
      console.log('Sending request to:', endpoint, payload); // Debug log
      const response = await axios.post(`http://localhost:3000${endpoint}`, payload);
      console.log('Response:', response.data); // Debug log

      if (isSignUp) {
        setSuccess('Registration successful! Please log in.');
        setIsSignUp(false);
        setUsername('');
        setEmail('');
        setPassword('');
      } else {
        const { token, user } = response.data;
        onLogin(user, token);
        localStorage.setItem('token', token);
        setSuccess('Login successful!');
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      console.error('Auth error:', err); // Debug log
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    }
  };

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: '5rem auto',
        padding: '2.5rem',
        backgroundColor: '#1e1e1e',
        borderRadius: '12px',
        boxShadow: '0 0 15px rgba(0,0,0,0.5)',
      }}
    >
      <h2 style={{ textAlign: 'center', color: '#f5c78c' }}>
        {isSignUp ? 'Sign Up' : 'Login'}
      </h2>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {success && <p style={{ color: 'lightgreen', textAlign: 'center' }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              style={inputStyle}
            />
          </div>
        )}
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={inputStyle}
          />
        </div>

        <button type="submit" style={buttonStyle}>
          {isSignUp ? 'Sign Up' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center', color: '#ccc' }}>
        {isSignUp ? 'Already have an account?' : 'Need an account?'}{' '}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            setSuccess('');
            setUsername('');
            setEmail('');
            setPassword('');
          }}
          style={{
            background: 'none',
            color: '#3498db',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: '1rem',
          }}
        >
          {isSignUp ? 'Login' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem',
  borderRadius: '5px',
  border: '1px solid #444',
  backgroundColor: '#2b2b2b',
  color: 'white',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem',
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

export default Auth;
