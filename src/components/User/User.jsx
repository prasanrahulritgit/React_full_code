// User.jsx
import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import './User.css';

const User = () => {
  const [users, setUsers] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    user_name: '',
    user_ip: '',
    password: '',
    role: 'user'
  });
  const [editFormData, setEditFormData] = useState({
    user_name: '',
    user_ip: '',
    password: '',
    role: 'user'
  });

  // Mock current user (in a real app, this would come from authentication context)
  const currentUser = {
    id: 1,
    role: 'admin'
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // This would be your API endpoint to fetch users
      // const response = await axios.get('/api/users');
      // setUsers(response.data);
      
      // For demo purposes, using mock data
      const mockUsers = [
        { id: 1, user_name: 'admin', user_ip: '192.168.1.100', role: 'admin' },
        { id: 2, user_name: 'user1', user_ip: '192.168.1.101', role: 'user' },
        { id: 3, user_name: 'user2', user_ip: '192.168.1.102', role: 'user' },
      ];
      setUsers(mockUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.id.toString().includes(filterText.toLowerCase()) &&
    user.user_name.toLowerCase().includes(usernameFilter.toLowerCase()) &&
    (roleFilter === '' || user.role === roleFilter)
  );

  const handleFilter = e => {
    setFilterText(e.target.value);
  };

  const handleUsernameFilter = e => {
    setUsernameFilter(e.target.value);
  };

  const handleRoleFilter = e => {
    setRoleFilter(e.target.value);
  };

  const handleEditUser = user => {
    setSelectedUser(user);
    setEditFormData({
      user_name: user.user_name,
      user_ip: user.user_ip || '',
      password: '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = user => {
    if (window.confirm(`Are you sure you want to delete user ${user.user_name}?`)) {
      // API call to delete user would go here
      setUsers(users.filter(u => u.id !== user.id));
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = e => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddUser = async e => {
    e.preventDefault();
    // API call to add user would go here
    const newUser = {
      id: Math.max(...users.map(u => u.id)) + 1,
      ...formData
    };
    setUsers([...users, newUser]);
    setShowAddModal(false);
    setFormData({
      user_name: '',
      user_ip: '',
      password: '',
      role: 'user'
    });
  };

  const handleUpdateUser = async e => {
    e.preventDefault();
    // API call to update user would go here
    setUsers(users.map(user => 
      user.id === selectedUser.id ? { ...user, ...editFormData } : user
    ));
    setShowEditModal(false);
  };

  const columns = [
    {
      name: 'ID',
      selector: row => row.id,
      sortable: true,
    },
    {
      name: 'Username',
      selector: row => row.user_name,
      sortable: true,
    },
    {
      name: 'User IP',
      selector: row => row.user_ip || '-',
      sortable: true,
    },
    {
      name: 'Role',
      cell: row => (
        <span className={`badge role-badge badge-${row.role}`}>
          {row.role}
        </span>
      ),
      sortable: true,
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="action-buttons">
          {(currentUser.role === 'admin' || currentUser.id === row.id) && (
            <button 
              className="Userbtn Userbtn-sm edit-user blue-btn"
              onClick={() => handleEditUser(row)}
            >
              Edit
            </button>
          )}
          {currentUser.role === 'admin' && row.role !== 'admin' && (
            <button 
              className="Userbtn Userbtn-sm delete-user orange-btn"
              onClick={() => handleDeleteUser(row)}
            >
              Delete
            </button>
          )}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '200px'
    },
  ];

  const customStyles = {
    rows: {
      style: {
        minHeight: '60px',
        backgroundColor: '#2b2b2b',
        color: 'white',
      },
    },
    headCells: {
      style: {
        backgroundColor: '#ff6a00',
        color: '#000',
        fontWeight: 'bold',
      },
    },
    cells: {
      style: {
        borderRight: '1px solid #333',
        borderBottom: '1px solid #333',
      },
    },
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">User Management</h1>
        {currentUser.role === 'admin' && (
          <div>
            <button 
              className="Userbtn btn-primary" 
              onClick={() => setShowAddModal(true)}
            >
              + Add New User
            </button>
          </div>
        )}
      </div>

      <div className="filter-container">
        <form className="Userrow g-3">
          <div className="col-md-4">
            <label htmlFor="userIdFilter" className="form-label">User ID</label>
            <input 
              type="text" 
              className="form-control" 
              id="userIdFilter" 
              placeholder="Filter by user ID"
              value={filterText}
              onChange={handleFilter}
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="usernameFilter" className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control" 
              id="usernameFilter" 
              placeholder="Filter by username"
              value={usernameFilter}
              onChange={handleUsernameFilter}
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="roleFilter" className="form-label">Role</label>
            <select 
              id="roleFilter" 
              className="form-select"
              value={roleFilter}
              onChange={handleRoleFilter}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </form>
      </div>

      <div className="Usercard">
        <div className="Usercard-body">
          <div className="table-responsive">
            <DataTable
              columns={columns}
              data={filteredUsers}
              customStyles={customStyles}
              pagination
              paginationPerPage={25}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              progressPending={loading}
            />
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New User</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="user_name" className="form-label">Username</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="user_name" 
                      name="user_name" 
                      value={formData.user_name}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="user_ip" className="form-label">User IP (optional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="user_ip" 
                      name="user_ip" 
                      value={formData.user_ip}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      id="password" 
                      name="password" 
                      value={formData.password}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="role" className="form-label">Role</label>
                    <select 
                      className="form-select" 
                      id="role" 
                      name="role" 
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="Userbtn btn-secondary" 
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="Userbtn btn-primary">Add User</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <form onSubmit={handleUpdateUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="edit_user_name" className="form-label">Username</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="edit_user_name"
                      name="user_name" 
                      value={editFormData.user_name}
                      onChange={handleEditInputChange}
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit_user_ip" className="form-label">User IP (optional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="edit_user_ip"
                      name="user_ip" 
                      value={editFormData.user_ip}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit_password" className="form-label">New Password (leave blank to keep current)</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      id="edit_password" 
                      name="password" 
                      value={editFormData.password}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  {currentUser.role === 'admin' && (
                    <div className="mb-3">
                      <label htmlFor="edit_role" className="form-label">Role</label>
                      <select 
                        className="form-select" 
                        id="edit_role" 
                        name="role" 
                        value={editFormData.role}
                        onChange={handleEditInputChange}
                        required
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="Userbtn btn-secondary" 
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="Userbtn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal backdrop */}
      {(showAddModal || showEditModal) && (
        <div className="modal-backdrop show"></div>
      )}
    </div>
  );
};

export default User;