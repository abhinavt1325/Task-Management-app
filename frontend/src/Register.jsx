import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Loader2, AtSign } from 'lucide-react';
import api from './api';
import './Auth.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/user/register', formData);
      navigate('/login');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(', '));
      } else {
        setError(detail || 'Failed to register. Please try again.');
      }
    } finally {
      setLoading(false);
    }

  };

  return (<div className="auth-container"> <div className="auth-card animate-fade-in"> <div className="auth-header"> <h1>Create Account</h1> <p>Join us and start managing your tasks</p> </div>

    {error && <div className="auth-error">{error}</div>}

    <form onSubmit={handleRegister} className="auth-form">
      <div className="input-group">
        <label htmlFor="name">Full Name</label>
        <div className="input-wrapper">
          <User className="input-icon" size={20} />
          <input
            id="name"
            type="text"
            className="auth-input"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="username">Username</label>
        <div className="input-wrapper">
          <AtSign className="input-icon" size={20} />
          <input
            id="username"
            type="text"
            className="auth-input"
            placeholder="johndoe"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="email">Email Address</label>
        <div className="input-wrapper">
          <Mail className="input-icon" size={20} />
          <input
            id="email"
            type="email"
            className="auth-input"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="password">Password</label>
        <div className="input-wrapper">
          <Lock className="input-icon" size={20} />
          <input
            id="password"
            type="password"
            className="auth-input"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>
      </div>

      <button type="submit" className="auth-button" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
      </button>
    </form>

    <div className="auth-footer">
      Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
    </div>
  </div>
  </div>
);
}
