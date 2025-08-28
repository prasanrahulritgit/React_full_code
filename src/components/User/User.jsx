// User.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  const [currentUser, setCurrentUser] = useState({
    id: null,
    role: ''
  });
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

  // Fetch users and current user info on component mount
  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      // This would typically come from your authentication context or an API endpoint
      // For now, we'll simulate getting the current user
      const response = await axios.get('/api/current-user');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Fallback to a default user for demo purposes
      setCurrentUser({
        id: 1,
        role: 'admin'
      });
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 403) {
        alert('Unauthorized: You need admin privileges to view users');
      } else {
        alert('Error fetching users: ' + (error.response?.data?.error || error.message));
      }
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

  // Prevent form submission on Enter key in filter
  const handleFilterKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

const handleEditUser = async user => {
  try {
    const response = await axios.get(`/users/update/${user.id}`);
    setSelectedUser(user);
    setEditFormData({
      user_name: response.data.user_name,
      user_ip: response.data.user_ip || '',
      password: '',
      role: response.data.role
    });
    setShowEditModal(true);
  } catch (error) {
    console.error('Error fetching user details:', error);
    if (error.response?.status === 403) {
      alert('Unauthorized: You do not have permission to edit this user');
    } else {
      alert('Error fetching user details: ' + (error.response?.data?.error || error.message));
    }
  }
};

  const handleDeleteUser = async user => {
    if (window.confirm(`Are you sure you want to delete user ${user.user_name}?`)) {
      try {
        const response = await axios.post(`/users/delete/${user.id}`);
        if (response.data.message) {
          setUsers(users.filter(u => u.id !== user.id));
          alert('User deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        if (error.response?.status === 403) {
          alert('Unauthorized: You need admin privileges to delete users');
        } else {
          alert('Error deleting user: ' + (error.response?.data?.error || error.message));
        }
      }
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
    try {
      const response = await axios.post('/users/add', formData);
      if (response.data.message) {
        setUsers([...users, response.data.user]);
        setShowAddModal(false);
        setFormData({
          user_name: '',
          user_ip: '',
          password: '',
          role: 'user'
        });
        alert('User added successfully');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      if (error.response?.status === 403) {
        alert('Unauthorized: You need admin privileges to add users');
      } else if (error.response?.status === 400) {
        alert('Error: ' + error.response.data.error);
      } else {
        alert('Error adding user: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleUpdateUser = async e => {
    e.preventDefault();
    try {
      const response = await axios.post(`/users/update/${selectedUser.id}`, editFormData);
      if (response.data.message) {
        setUsers(users.map(user => 
          user.id === selectedUser.id ? response.data.user : user
        ));
        setShowEditModal(false);
        alert('User updated successfully');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.response?.status === 403) {
        alert('Unauthorized: You do not have permission to update this user');
      } else {
        alert('Error updating user: ' + (error.response?.data?.error || error.message));
      }
    }
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

      {/* REMOVED THE FORM WRAPPER AROUND FILTERS - This was causing refresh issues */}
      <div className="filter-container">
        <div className="Userrow g-3">
          <div className="col-md-4">
            <label htmlFor="userIdFilter" className="form-label">User ID</label>
            <input 
              type="text" 
              className="form-control" 
              id="userIdFilter" 
              placeholder="Filter by user ID"
              value={filterText}
              onChange={handleFilter}
              onKeyDown={handleFilterKeyDown}
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
              onKeyDown={handleFilterKeyDown}
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
            <div>
            </div>
        </div>
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