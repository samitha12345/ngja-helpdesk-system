import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminTickets.css';

const ticketStatuses = ['Open', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Closed'];
const ticketPriorities = ['Low', 'Medium', 'High', 'Urgent'];
const officerOptions = ['Nimal Perera', 'Sunil Fernando', 'Anusha Jayawardena', 'Kasun Silva'];

const ticketSeeds = [
  ['NGJA-001', 'Email access not working', 'Kamal Silva', 'IT', 'Account Access', 'High', 'Nimal Perera', '2026-10-26', 'In Progress', '2026-10-28'],
  ['NGJA-002', 'Printer not responding', 'Dilani Perera', 'Finance', 'Hardware', 'Medium', 'Sunil Fernando', '2026-10-25', 'Assigned', '2026-10-30'],
  ['NGJA-003', 'Request for leave system access', 'Tharindu Jayasuriya', 'HR', 'Account Access', 'Low', 'Anusha Jayawardena', '2026-10-24', 'Pending', '2026-10-27'],
  ['NGJA-004', 'Shared drive connection issue', 'Nadeesha Fernando', 'Finance', 'Network', 'Urgent', 'Nimal Perera', '2026-10-23', 'Open', '2026-10-24'],
  ['NGJA-005', 'Workstation software update', 'Ruwan Kumara', 'IT', 'Software', 'Medium', 'Kasun Silva', '2026-10-22', 'Resolved', '2026-10-25'],
  ['NGJA-006', 'Meeting room display issue', 'Sachini de Silva', 'Administration', 'Hardware', 'High', 'Sunil Fernando', '2026-10-21', 'In Progress', '2026-10-23'],
  ['NGJA-007', 'Payroll portal sign-in issue', 'Amila Rathnayake', 'HR', 'Account Access', 'High', 'Anusha Jayawardena', '2026-10-20', 'Pending', '2026-10-22'],
  ['NGJA-008', 'New employee workstation setup', 'Ishara Bandara', 'HR', 'Hardware', 'Medium', 'Kasun Silva', '2026-10-19', 'Closed', '2026-10-25'],
  ['NGJA-009', 'Slow network connection', 'Chamara Silva', 'Gem Testing', 'Network', 'Urgent', 'Nimal Perera', '2026-10-18', 'Open', '2026-10-19'],
  ['NGJA-010', 'Document management app error', 'Piumi Perera', 'Legal', 'Software', 'Low', 'Sunil Fernando', '2026-10-17', 'Resolved', '2026-10-21'],
  ['NGJA-011', 'Request access to shared folder', 'Kasun Jayawardena', 'Finance', 'Account Access', 'Medium', 'Unassigned', '2026-10-16', 'Open', '2026-10-20'],
  ['NGJA-012', 'Laptop battery replacement', 'Madhavi Silva', 'Gem Testing', 'Hardware', 'High', 'Anusha Jayawardena', '2026-10-15', 'Assigned', '2026-10-18'],
].map(([id, subject, employee, department, category, priority, assignedOfficer, createdAt, status, dueDate], index) => ({
  id,
  subject,
  employee,
  email: `${employee.toLowerCase().replaceAll(' ', '.')}@ngja.lk`,
  department,
  category,
  priority,
  assignedOfficer,
  createdAt,
  status,
  dueDate,
  description: `${subject}. The employee has reported that this issue is affecting their regular work. Please review the request and provide an update.`,
  attachments: index === 0 ? ['error-screenshot.png'] : [],
  comments: [{ author: assignedOfficer === 'Unassigned' ? employee : assignedOfficer, date: createdAt, text: 'Ticket received and added to the helpdesk queue.' }],
  history: [{ author: employee, date: createdAt, action: 'created this ticket' }],
  resolutionNotes: '',
}));

const formatTicketDate = (date) => new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}).format(new Date(`${date}T00:00:00`));

const isOverdueTicket = (ticket) => (
  !['Resolved', 'Closed'].includes(ticket.status)
  && ticket.dueDate < new Date().toISOString().slice(0, 10)
);

const TicketManagementSection = ({ adminName }) => {
  const [tickets, setTickets] = useState(ticketSeeds);
  const [filters, setFilters] = useState({
    ticketId: '',
    employee: '',
    department: '',
    category: '',
    priority: '',
    status: '',
    date: '',
    officer: '',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDraft, setTicketDraft] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [notice, setNotice] = useState('');

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId);
  const filteredTickets = tickets.filter((ticket) => (
    ticket.id.toLowerCase().includes(filters.ticketId.trim().toLowerCase())
    && ticket.employee.toLowerCase().includes(filters.employee.trim().toLowerCase())
    && (!filters.department || ticket.department === filters.department)
    && (!filters.category || ticket.category === filters.category)
    && (!filters.priority || ticket.priority === filters.priority)
    && (!filters.status || ticket.status === filters.status)
    && (!filters.date || ticket.createdAt === filters.date)
    && (!filters.officer || ticket.assignedOfficer === filters.officer)
  ));
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const visibleTickets = filteredTickets.slice((page - 1) * pageSize, page * pageSize);
  const openCount = tickets.filter((ticket) => ticket.status === 'Open').length;
  const inProgressCount = tickets.filter((ticket) => ticket.status === 'In Progress').length;
  const pendingCount = tickets.filter((ticket) => ticket.status === 'Pending').length;
  const resolvedCount = tickets.filter((ticket) => ticket.status === 'Resolved').length;
  const overdueCount = tickets.filter(isOverdueTicket).length;

  const updateFilter = (key, value) => {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
    setPage(1);
    setNotice('');
  };

  const clearFilters = () => {
    setFilters({ ticketId: '', employee: '', department: '', category: '', priority: '', status: '', date: '', officer: '' });
    setPage(1);
    setNotice('');
  };

  const openTicket = (ticket, mode = 'view') => {
    setSelectedTicketId(ticket.id);
    setTicketDraft({ ...ticket });
    setNewComment('');
    setNotice('');
    if (mode === 'assign') {
      setTicketDraft((currentDraft) => ({ ...currentDraft, status: currentDraft.status === 'Open' ? 'Assigned' : currentDraft.status }));
    }
  };

  const closeTicketDetails = () => {
    setSelectedTicketId(null);
    setTicketDraft(null);
    setNewComment('');
  };

  const saveTicket = (nextStatus = ticketDraft.status) => {
    const changes = [];
    if (ticketDraft.status !== nextStatus) changes.push(`changed status to ${nextStatus}`);
    if (ticketDraft.priority !== selectedTicket.priority) changes.push(`changed priority to ${ticketDraft.priority}`);
    if (ticketDraft.assignedOfficer !== selectedTicket.assignedOfficer) {
      changes.push(`assigned ticket to ${ticketDraft.assignedOfficer}`);
    }
    if (ticketDraft.subject !== selectedTicket.subject) changes.push('updated the subject');
    if (ticketDraft.description !== selectedTicket.description) changes.push('updated the description');
    if (ticketDraft.resolutionNotes !== selectedTicket.resolutionNotes && ticketDraft.resolutionNotes.trim()) {
      changes.push('added resolution notes');
    }
    const today = new Date().toISOString().slice(0, 10);
    const updatedTicket = {
      ...ticketDraft,
      status: nextStatus,
      comments: newComment.trim()
        ? [...selectedTicket.comments, { author: adminName, date: today, text: newComment.trim() }]
        : selectedTicket.comments,
      history: changes.length
        ? [...selectedTicket.history, { author: adminName, date: today, action: changes.join(', ') }]
        : selectedTicket.history,
    };
    setTickets((currentTickets) => currentTickets.map((ticket) => (
      ticket.id === updatedTicket.id ? updatedTicket : ticket
    )));
    setTicketDraft(updatedTicket);
    setNewComment('');
    setNotice(`${updatedTicket.id} updated in this demo session. Connect the backend to save changes permanently.`);
  };

  const summaryCards = [
    { label: 'Total Tickets', value: tickets.length, icon: '▤', tone: 'blue' },
    { label: 'Open Tickets', value: openCount, icon: '◷', tone: 'amber' },
    { label: 'In Progress', value: inProgressCount, icon: '↻', tone: 'violet' },
    { label: 'Pending', value: pendingCount, icon: '…', tone: 'orange' },
    { label: 'Resolved', value: resolvedCount, icon: '✓', tone: 'green' },
    { label: 'Overdue', value: overdueCount, icon: '!', tone: 'red' },
  ];

  return (
    <section className="admin-content ticket-management" aria-label="All tickets">
      <div className="ticket-page-heading">
        <div className="admin-section-intro">
          <span className="admin-eyebrow">HELPDESK WORKSPACE</span>
          <h2>All Tickets</h2>
          <p>Review, assign and track employee support requests.</p>
        </div>
        <span className="ticket-demo-badge"><span /> Demo data · backend not connected</span>
      </div>

      <div className="ticket-summary-grid">
        {summaryCards.map((card) => (
          <article className={`ticket-summary-card tone-${card.tone}`} key={card.label}>
            <span className="ticket-summary-icon" aria-hidden="true">{card.icon}</span>
            <span className="ticket-summary-label">{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <section className="ticket-workflow-card" aria-label="Ticket workflow">
        <div className="ticket-workflow-heading">
          <div>
            <h3>Ticket workflow</h3>
            <p>Track each request from submission to completion.</p>
          </div>
        </div>
        <ol className="ticket-workflow">
          {[
            ['New Ticket', 'Employee submits a request'],
            ['Review & Assign', 'Admin reviews and assigns'],
            ['In Progress', 'Officer works on the issue'],
            ['Resolved', 'Solution and notes recorded'],
            ['Closed', 'Request is completed'],
          ].map(([label, description], index) => (
            <li className="ticket-workflow-step" key={label}>
              <span className="ticket-workflow-number">{index + 1}</span>
              <span><strong>{label}</strong><small>{description}</small></span>
            </li>
          ))}
        </ol>
      </section>

      <div className="ticket-privacy-notice" role="note">
        <span aria-hidden="true">i</span>
        Demo records only. Confidential employee data must be protected by role-based permissions in the backend before production use.
      </div>

      <section className="ticket-filter-card" aria-label="Search and filter tickets">
        <div className="ticket-filter-heading">
          <div><h3>Search &amp; filters</h3><p>Narrow down the ticket list using any combination of filters.</p></div>
          <button type="button" className="ticket-clear-button" onClick={clearFilters}>Clear Filters</button>
        </div>
        <div className="ticket-filter-grid">
          <label className="ticket-filter-field">
            <span>Ticket ID</span>
            <input value={filters.ticketId} onChange={(event) => updateFilter('ticketId', event.target.value)} placeholder="Search NGJA-001" />
          </label>
          <label className="ticket-filter-field">
            <span>Employee Name</span>
            <input value={filters.employee} onChange={(event) => updateFilter('employee', event.target.value)} placeholder="Search employee" />
          </label>
          <label className="ticket-filter-field">
            <span>Department</span>
            <select value={filters.department} onChange={(event) => updateFilter('department', event.target.value)}>
              <option value="">All departments</option>
              {[...new Set(tickets.map((ticket) => ticket.department))].sort().map((department) => <option key={department}>{department}</option>)}
            </select>
          </label>
          <label className="ticket-filter-field">
            <span>Category</span>
            <select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
              <option value="">All categories</option>
              {[...new Set(tickets.map((ticket) => ticket.category))].sort().map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="ticket-filter-field">
            <span>Priority</span>
            <select value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value)}>
              <option value="">All priorities</option>
              {ticketPriorities.map((priority) => <option key={priority}>{priority}</option>)}
            </select>
          </label>
          <label className="ticket-filter-field">
            <span>Status</span>
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              {ticketStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label className="ticket-filter-field">
            <span>Created Date</span>
            <input type="date" value={filters.date} onChange={(event) => updateFilter('date', event.target.value)} />
          </label>
          <label className="ticket-filter-field">
            <span>Assigned Officer</span>
            <select value={filters.officer} onChange={(event) => updateFilter('officer', event.target.value)}>
              <option value="">All officers</option>
              {[...new Set(tickets.map((ticket) => ticket.assignedOfficer))].sort().map((officer) => <option key={officer}>{officer}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="ticket-table-card" aria-label="Ticket results">
        <div className="ticket-table-heading">
          <div><h3>All tickets <span>{filteredTickets.length}</span></h3><p>Review ticket details and update assignments.</p></div>
          <label className="ticket-page-size">Rows per page
            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
              <option value={10}>10</option><option value={20}>20</option>
            </select>
          </label>
        </div>
        <div className="ticket-table-scroll">
          <table className="ticket-table">
            <thead><tr>
              <th>Ticket ID</th><th>Subject</th><th>Employee</th><th>Department</th><th>Category</th>
              <th>Priority</th><th>Assigned Officer</th><th>Created Date</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {visibleTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td><strong className="ticket-id">{ticket.id}</strong></td>
                  <td><span className="ticket-subject">{ticket.subject}</span></td>
                  <td>{ticket.employee}</td><td>{ticket.department}</td><td>{ticket.category}</td>
                  <td><span className={`ticket-priority priority-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span></td>
                  <td>{ticket.assignedOfficer}</td><td>{formatTicketDate(ticket.createdAt)}</td>
                  <td><span className={`ticket-status status-${ticket.status.toLowerCase().replaceAll(' ', '-')}`}>{ticket.status}</span></td>
                  <td><div className="ticket-row-actions">
                    <button type="button" onClick={() => openTicket(ticket, 'view')}>View</button>
                    <button type="button" onClick={() => openTicket(ticket, 'assign')}>Assign</button>
                    <button type="button" onClick={() => openTicket(ticket, 'edit')}>Edit</button>
                  </div></td>
                </tr>
              ))}
              {visibleTickets.length === 0 && <tr><td className="ticket-no-results" colSpan="10">No tickets match those filters. Try changing or clearing your search.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="ticket-pagination">
          <span>Showing {filteredTickets.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredTickets.length)} of {filteredTickets.length} tickets</span>
          <div>
            <button type="button" disabled={page === 1} onClick={() => setPage((currentPage) => currentPage - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>Next</button>
          </div>
        </div>
      </section>

      {selectedTicket && ticketDraft && (
        <div className="ticket-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeTicketDetails(); }}>
          <aside className="ticket-drawer" role="dialog" aria-modal="true" aria-labelledby="ticket-drawer-title">
            <header className="ticket-drawer-header">
              <div><span className="admin-eyebrow">TICKET DETAILS</span><h2 id="ticket-drawer-title">{selectedTicket.id}</h2></div>
              <button type="button" className="ticket-drawer-close" aria-label="Close ticket details" onClick={closeTicketDetails}>×</button>
            </header>
            <div className="ticket-drawer-content">
              {notice && <div className="ticket-save-notice" role="status">{notice}</div>}
              <div className="ticket-drawer-title-row">
                <label className="ticket-detail-field ticket-detail-subject"><span>Subject</span>
                  <input value={ticketDraft.subject} onChange={(event) => setTicketDraft({ ...ticketDraft, subject: event.target.value })} />
                </label>
                <span className={`ticket-status status-${ticketDraft.status.toLowerCase().replaceAll(' ', '-')}`}>{ticketDraft.status}</span>
              </div>

              <section className="ticket-detail-section">
                <h3>Employee details</h3>
                <div className="ticket-employee-details">
                  <span><small>Employee</small><strong>{selectedTicket.employee}</strong></span>
                  <span><small>Email</small><strong>{selectedTicket.email}</strong></span>
                  <span><small>Department</small><strong>{selectedTicket.department}</strong></span>
                  <span><small>Created</small><strong>{formatTicketDate(selectedTicket.createdAt)}</strong></span>
                </div>
              </section>

              <section className="ticket-detail-section">
                <h3>Issue description</h3>
                <label className="ticket-detail-field"><span>Description</span>
                  <textarea rows="3" value={ticketDraft.description} onChange={(event) => setTicketDraft({ ...ticketDraft, description: event.target.value })} />
                </label>
              </section>

              <section className="ticket-detail-section">
                <h3>Attachments</h3>
                {selectedTicket.attachments.length
                  ? <ul className="ticket-attachment-list">{selectedTicket.attachments.map((attachment) => <li key={attachment}>▧ {attachment} <small>Demo attachment</small></li>)}</ul>
                  : <p className="ticket-muted-copy">No attachments uploaded.</p>}
              </section>

              <section className="ticket-detail-section ticket-edit-controls">
                <h3>Update ticket</h3>
                <label className="ticket-detail-field"><span>Priority</span>
                  <select value={ticketDraft.priority} onChange={(event) => setTicketDraft({ ...ticketDraft, priority: event.target.value })}>
                    {ticketPriorities.map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                </label>
                <label className="ticket-detail-field"><span>Assigned officer</span>
                  <select value={ticketDraft.assignedOfficer} onChange={(event) => setTicketDraft({
                    ...ticketDraft,
                    assignedOfficer: event.target.value,
                    status: ticketDraft.status === 'Open' ? 'Assigned' : ticketDraft.status,
                  })}>
                    <option>Unassigned</option>
                    {officerOptions.map((officer) => <option key={officer}>{officer}</option>)}
                  </select>
                </label>
                <label className="ticket-detail-field"><span>Status</span>
                  <select value={ticketDraft.status} onChange={(event) => setTicketDraft({ ...ticketDraft, status: event.target.value })}>
                    {ticketStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <label className="ticket-detail-field"><span>Resolution notes</span>
                  <textarea rows="2" value={ticketDraft.resolutionNotes} onChange={(event) => setTicketDraft({ ...ticketDraft, resolutionNotes: event.target.value })} placeholder="Add resolution details..." />
                </label>
              </section>

              <section className="ticket-detail-section">
                <h3>Comments</h3>
                <ul className="ticket-timeline">
                  {selectedTicket.comments.map((comment, index) => (
                    <li key={`${comment.date}-${index}`}><strong>{comment.author}</strong><time>{formatTicketDate(comment.date)}</time><p>{comment.text}</p></li>
                  ))}
                </ul>
                <label className="ticket-detail-field"><span>Add comment</span>
                  <textarea rows="2" value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Write an update for the ticket..." />
                </label>
              </section>

              <section className="ticket-detail-section">
                <h3>Ticket history</h3>
                <ul className="ticket-history-list">
                  {selectedTicket.history.map((entry, index) => (
                    <li key={`${entry.date}-${index}`}><span className="ticket-history-dot" /><p><strong>{entry.author}</strong> {entry.action}<time>{formatTicketDate(entry.date)}</time></p></li>
                  ))}
                </ul>
              </section>
            </div>
            <footer className="ticket-drawer-footer">
              {ticketDraft.status !== 'Closed' && <button type="button" className="ticket-close-action" onClick={() => saveTicket('Closed')}>Close Ticket</button>}
              <button type="button" className="ticket-save-action" onClick={() => saveTicket()}>Save Changes</button>
            </footer>
          </aside>
        </div>
      )}
    </section>
  );
};

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦', description: 'System overview and key activity' },
  { id: 'tickets', label: 'Tickets', icon: '▤', description: 'Review and manage all helpdesk tickets' },
  { id: 'users', label: 'Users / Employees', icon: '♙', description: 'Manage employee accounts and access' },
  { id: 'departments', label: 'Departments', icon: '▥', description: 'Manage organizational departments' },
  { id: 'categories', label: 'Categories', icon: '◈', description: 'Manage helpdesk issue categories' },
  { id: 'assign-officers', label: 'Assign Officers', icon: '⇄', description: 'Assign tickets to the right officers' },
  { id: 'reports', label: 'Reports & Analytics', icon: '▥', description: 'Review helpdesk reports and trends' },
  { id: 'notifications', label: 'Notifications', icon: '♧', description: 'Manage important system alerts' },
  { id: 'settings', label: 'Settings', icon: '⚙', description: 'Manage system and access settings' },
  { id: 'audit-logs', label: 'Audit Logs', icon: '◷', description: 'Review changes made across the system' },
];

const emptyMessages = {
  users: 'Employee accounts will appear here when user management is connected.',
  departments: 'No departments are available yet.',
  categories: 'No issue categories are available yet.',
  'assign-officers': 'Ticket assignment options will appear when tickets and officers are connected.',
  reports: 'Reports will be available when helpdesk data is connected.',
  notifications: 'There are no system notifications to display.',
  settings: 'System and access settings will be available here.',
  'audit-logs': 'Audit activity will appear here when system logging is connected.',
};

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user } = useAuth();
  const activeItem = menuItems.find((item) => item.id === activeSection);
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Admin';

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar-heading">
          <span className="admin-sidebar-kicker">NGJA HELPDESK</span>
          <h2>Administration</h2>
        </div>

        <nav className="admin-menu">
          <span className="admin-menu-label">WORKSPACE</span>
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-menu-item${activeSection === item.id ? ' is-active' : ''}`}
              aria-current={activeSection === item.id ? 'page' : undefined}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="admin-menu-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <span className="admin-status-dot" />
          <span>Administrator access</span>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-breadcrumb">Admin / {activeItem.label}</span>
            <h1>{activeItem.label}</h1>
          </div>
          <div className="admin-profile">
            <span className="admin-avatar" aria-hidden="true">
              {firstName.charAt(0).toUpperCase()}
            </span>
            <span className="admin-profile-details">
              <strong>{user?.name || 'Administrator'}</strong>
              <small>System Administrator</small>
            </span>
          </div>
        </header>

        {activeSection === 'dashboard' ? (
          <section className="admin-content" aria-label="Dashboard overview">
            <div className="admin-welcome">
              <div>
                <span className="admin-eyebrow">SYSTEM OVERVIEW</span>
                <h2>Welcome back, {firstName}</h2>
                <p>Here is an overview of your helpdesk administration workspace.</p>
              </div>
            </div>

            <div className="admin-stat-grid">
              {[
                { label: 'Total Tickets', icon: '▤' },
                { label: 'Open Issues', icon: '◷' },
                { label: 'Employees', icon: '♙' },
                { label: 'Active Officers', icon: '♧' },
              ].map((stat) => (
                <article className="admin-stat-card" key={stat.label}>
                  <span className="admin-stat-icon" aria-hidden="true">{stat.icon}</span>
                  <span className="admin-stat-label">{stat.label}</span>
                  <strong className="admin-stat-value">—</strong>
                  <span className="admin-stat-note">Waiting for system data</span>
                </article>
              ))}
            </div>

            <div className="admin-panel-grid">
              <section className="admin-panel-card admin-activity-card">
                <div className="admin-card-heading">
                  <div>
                    <h3>Recent Tickets</h3>
                    <p>Latest helpdesk activity</p>
                  </div>
                  <button type="button" className="admin-text-button" onClick={() => setActiveSection('tickets')}>
                    View tickets
                  </button>
                </div>
                <div className="admin-empty-state">
                  <span className="admin-empty-icon" aria-hidden="true">▤</span>
                  <strong>No ticket data yet</strong>
                  <p>Connect the helpdesk API to see tickets and activity here.</p>
                </div>
              </section>

              <section className="admin-panel-card admin-system-card">
                <div className="admin-card-heading">
                  <div>
                    <h3>System Status</h3>
                    <p>Helpdesk service connection</p>
                  </div>
                  <span className="admin-status-pill">Not connected</span>
                </div>
                <p className="admin-system-message">
                  The admin dashboard is ready. Connect it to the helpdesk backend to load live tickets,
                  users, reports, and audit activity.
                </p>
                <div className="admin-system-footer">
                  <span className="admin-status-dot is-muted" />
                  <span>Live data is not available</span>
                </div>
              </section>
            </div>

            <section className="admin-panel-card admin-quick-links">
              <div className="admin-card-heading">
                <div>
                  <h3>Administration</h3>
                  <p>Choose an area to manage</p>
                </div>
              </div>
              <div className="admin-quick-link-grid">
                {menuItems.slice(1, 5).map((item) => (
                  <button
                    className="admin-quick-link"
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                  >
                    <span className="admin-quick-link-icon" aria-hidden="true">{item.icon}</span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    <span className="admin-quick-arrow" aria-hidden="true">›</span>
                  </button>
                ))}
              </div>
            </section>
          </section>
        ) : activeSection === 'tickets' ? (
          <TicketManagementSection adminName={user?.name || 'Admin'} />
        ) : (
          <section className="admin-content" aria-label={activeItem.label}>
            <div className="admin-section-intro">
              <span className="admin-eyebrow">ADMINISTRATION</span>
              <h2>{activeItem.label}</h2>
              <p>{activeItem.description}</p>
            </div>
            <section className="admin-panel-card admin-section-card">
              <div className="admin-card-heading">
                <div>
                  <h3>{activeItem.label}</h3>
                  <p>{activeItem.description}</p>
                </div>
                <span className="admin-status-pill">Backend required</span>
              </div>
              <div className="admin-empty-state">
                <span className="admin-empty-icon" aria-hidden="true">{activeItem.icon}</span>
                <strong>{emptyMessages[activeSection]}</strong>
                <p>This section is ready for live data and management actions once the backend is available.</p>
              </div>
            </section>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
