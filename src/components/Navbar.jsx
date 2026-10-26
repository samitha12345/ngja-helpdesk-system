import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src="/ngja-logo.png" alt="NGJA emblem" />
        <img src="/sri-lanka-government-logo.png" alt="Sri Lanka government emblem" />
        <span>NGJA Helpdesk</span>
      </div>
      {user && (
        <div className="navbar-right">
          <span className="user-badge">
            {user.name} <small>({user.role.replace('_', ' ')})</small>
          </span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
