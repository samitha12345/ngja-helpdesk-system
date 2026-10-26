import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    
    try {
      // Laravel API එකට රෙජිස්ටර් වෙන්න රික්වෙස්ට් එක යවනවා
      const response = await fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
          password_confirmation: confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        // 🎯 සාර්ථක වුනාම Alert එකක් දීලා Login පිටුවට යවනවා
        alert('Registration Successful! Please login with your new account.');
        navigate('/login'); 
      } else {
        setError(data.message || 'Registration failed. Please check your details.');
      }
    } catch {
      setError('Network error. Please make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <img
          className="login-support-image"
          src="/helpdesk-support.jpg"
          alt="Customer support agents wearing headsets at work"
        />
        <div className="login-left-content">
          <h1>Join NGJA Helpdesk</h1>
          <p>Create your account to submit and track your helpdesk requests.</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card register-card">
          <h2>Create Account</h2>
          <p className="subtitle">Sign up to get started with the Helpdesk.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="register-name">Full Name</label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-email">Email Address</label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@ngja.lk"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-confirm-password">Confirm Password</label>
              <input
                id="register-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                minLength="6"
              />
            </div>

            {error && <div className="error-msg" role="alert">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          <p className="register-login-link">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;