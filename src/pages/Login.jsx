import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginUser, user } = useAuth();
  const navigate = useNavigate();

  // ඔයා දැනටමත් login වෙලා නම් අදාළ dashboard එකට යවන්න
  useEffect(() => {
    if (user) {
      const roleMap = {
        admin: '/admin',
        helpdesk_officer: '/helpdesk',
        officer: '/officer',
        employee: '/employee',
      };
      navigate(roleMap[user.role] || '/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      loginUser(data.user, data.token);
      const roleMap = {
        admin: '/admin',
        helpdesk_officer: '/helpdesk',
        officer: '/officer',
        employee: '/employee',
      };
      navigate(roleMap[data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* වම් පැත්ත - Branding */}
      <div className="login-left">
        <img
          className="login-support-image"
          src="/helpdesk-support.jpg"
          alt="Customer support agents wearing headsets at work"
        />
        <div className="login-left-content">
          {/* මෙතන ඔයාට NGJA ලෝගෝ එක PNG එකක් විදිහට දාන්න පුළුවන් */}
          <h1>💎 NGJA Helpdesk</h1>
          <p>National Gem and Jewellery Authority<br/>Employee Helpdesk System</p>
        </div>
      </div>

      {/* දකුණු පැත්ත - Form */}
      <div className="login-right">
        <div className="login-card">
          <h2>Welcome Back</h2>
          <p className="subtitle">Please sign in to your account</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="your.name@ngja.lk" 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
              />
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="demo-info">
            <strong>Demo Accounts (Test only):</strong>
            <p>👑 Admin: admin@ngja.lk / admin123</p>
            <p>👤 Employee: employee@ngja.lk / emp123</p>
            <p>🎯 Helpdesk: helpdesk@ngja.lk / hd123</p>
            <p>🔧 Officer: officer@ngja.lk / off123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;