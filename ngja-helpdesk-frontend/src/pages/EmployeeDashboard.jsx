import { useAuth } from '../context/AuthContext';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  return (
    <div>
      <h2>Hello, {user.name}</h2>
      <p>Your submitted tickets will appear here.</p>
      <div className="placeholder-card">
        <h3>My Tickets</h3>
        <p>Coming in Phase B...</p>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
