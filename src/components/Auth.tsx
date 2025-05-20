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
      const response = await axios.post(`http://localhost:3000${endpoint}`, payload);
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
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="container mt-4">
      <div className="auth-form" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2 className="text-center">{isSignUp ? 'Sign Up' : 'Login'}</h2>
        {error && <p className="text-center" style={{ color: 'red' }}>{error}</p>}
        {success && <p className="text-center" style={{ color: 'green' }}>{success}</p>}
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group mt-2">
              <label>Username</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
          )}
          <div className="form-group mt-2">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              required
            />
          </div>
          <div className="form-group mt-2">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="btn mt-3 w-100">
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>
        <p className="text-center mt-2">
          {isSignUp ? 'Already have an account?' : 'Need an account?'}
          <button
            className="btn btn-link"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccess('');
              setUsername('');
              setEmail('');
              setPassword('');
            }}
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;