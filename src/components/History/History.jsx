import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import './History.css';

const History = () => {
  const [historyRecords, setHistoryRecords] = useState([]);
  const [devices, setDevices] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 50,
    total: 0,
    pages: 1
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchHistoryData();
    fetchDevices();
  }, []);

  // Refetch data when pagination changes
  useEffect(() => {
    fetchHistoryData();
  }, [pagination.current_page, pagination.per_page]);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      
      // Build query string with pagination only (filters handled client-side)
      const params = new URLSearchParams();
      params.append('page', pagination.current_page);
      params.append('per_page', pagination.per_page);
      
      const response = await fetch(`/history/all-records?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch history');
      
      const data = await response.json();
      
      // Update records and pagination
      setHistoryRecords(data.records);
      setPagination(data.pagination);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching history:', error);
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      // You'll need to add a devices endpoint to your backend
      // For now, we'll use a placeholder
      const response = await fetch('/devices', { // This endpoint doesn't exist yet
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  // Client-side filtering similar to Device.jsx
  const filteredRecords = historyRecords.filter(record => {
    const matchesDeviceFilter = !deviceFilter || 
      (record.device && record.device.id && record.device.id.toString().toLowerCase().includes(deviceFilter.toLowerCase()));
    const matchesUserFilter = !userFilter || 
      (record.user && record.user.id && record.user.id.toString().includes(userFilter));
    const matchesStatusFilter = !statusFilter || record.status === statusFilter;
    
    return matchesDeviceFilter && matchesUserFilter && matchesStatusFilter;
  });

  const handleFilter = e => {
    setDeviceFilter(e.target.value);
  };

  // Prevent form submission on Enter key in filter
  const handleFilterKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleViewDetails = async (recordId) => {
    try {
      const response = await fetch(`/history/get-usage-record/${recordId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const recordDetails = await response.json();
        setSelectedRecord(recordDetails);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching record details:', error);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const response = await fetch(`/history/delete-usage-record/${recordId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          // Refresh the data
          fetchHistoryData();
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to delete record');
        }
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Failed to delete record');
      }
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Delete all records older than 6 months?')) {
      try {
        const response = await fetch('/history/clear-old', {
          method: 'POST',
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          alert(result.message || 'Old records cleared successfully');
          fetchHistoryData(); // Refresh data
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to clear old records');
        }
      } catch (error) {
        console.error('Error clearing old records:', error);
        alert('Failed to clear old records');
      }
    }
  };

  const handlePageChange = (page) => {
    setPagination({...pagination, current_page: page});
  };

  const handlePerRowsChange = (newPerPage, page) => {
    setPagination({...pagination, per_page: newPerPage, current_page: page});
  };

  // Clear all filters
  const handleClearFilters = () => {
    setDeviceFilter('');
    setUserFilter('');
    setStatusFilter('');
    setFilterText('');
  };

  const columns = [
    {
      name: 'Device ID',
      selector: row => row.device.id,
      sortable: true,
    },
    {
      name: 'User ID',
      selector: row => row.user.id,
      sortable: true,
    },
    {
      name: 'Reservation ID',
      selector: row => row.reservation.id || 'N/A',
      sortable: true,
    },
    {
      name: 'Start Time',
      selector: row => row.timing.start_time ? new Date(row.timing.start_time).toLocaleString() : 'N/A',
      sortable: true,
    },
    {
      name: 'End Time',
      selector: row => row.timing.end_time ? new Date(row.timing.end_time).toLocaleString() : <em>In Progress</em>,
      sortable: true,
    },
    {
      name: 'Duration',
      selector: row => row.timing.duration_formatted || '-',
      sortable: true,
    },
    {
      name: 'Status',
      selector: row => {
        let badgeClass = '';
        if (row.status === 'active') badgeClass = 'active-badge';
        else if (row.status === 'completed') badgeClass = 'completed-badge';
        else if (row.status === 'upcoming') badgeClass = 'upcoming-badge';
        else badgeClass = 'terminated-badge';
        
        return <span className={`badge ${badgeClass} status-badge`}>{row.status}</span>;
      },
      sortable: true,
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="action-buttons">
          <button 
            className="btn btn-sm view-details Action-btn" 
            onClick={() => handleViewDetails(row.id)}
          >
            Details
          </button>
          <button 
            className="btn btn-sm delete-record Delete-btn" 
            onClick={() => handleDeleteRecord(row.id)}
          >
            Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      minWidth: '200px',
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
    <div className="history-container">
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0">Device Usage History</h1>
          <div>
            <a href="/admin_dashboard/reservation" className="btn blue-btn me-2">
              View Reservations
            </a>
            <button className="btn orange-btn" onClick={handleClearHistory}>
              Clear Old Records
            </button>
          </div>
        </div>

        <div className="filter-container">
          <div className="row g-3">
            <div className="col-md-3">
              <label htmlFor="deviceFilter" className="form-label">Device ID</label>
              <input
                type="text"
                id="deviceFilter"
                className="form-control"
                placeholder="Filter by device ID"
                value={deviceFilter}
                onChange={handleFilter}
                onKeyDown={handleFilterKeyDown}
              />
            </div>
            <div className="col-md-2">
              <label htmlFor="statusFilter" className="form-label">Status</label>
              <select 
                id="statusFilter" 
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="userFilter" className="form-label">User ID</label>
              <input
                type="number"
                id="userFilter"
                className="form-control"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Filter by User ID"
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <DataTable
                columns={columns}
                data={filteredRecords}
                customStyles={customStyles}
                pagination
                paginationPerPage={25}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                progressPending={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRecord && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Usage Record Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h5 className="border-bottom pb-2">Device Information</h5>
                    <p><strong>Device ID:</strong> {selectedRecord.device_id}</p>
                  </div>
                  <div className="col-md-6">
                    <h5 className="border-bottom pb-2">User Information</h5>
                    <p><strong>User ID:</strong> {selectedRecord.user_info.user_id}</p>
                    <p><strong>User Name:</strong> {selectedRecord.user_info.user_name}</p>
                    <p><strong>User IP:</strong> {selectedRecord.user_info.user_ip}</p>
                  </div>
                </div>
                
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h5 className="border-bottom pb-2">Timing Information</h5>
                    <p><strong>Start Time:</strong> {selectedRecord.timing.start_time ? new Date(selectedRecord.timing.start_time).toLocaleString() : 'N/A'}</p>
                    <p><strong>End Time:</strong> {selectedRecord.timing.end_time ? new Date(selectedRecord.timing.end_time).toLocaleString() : 'N/A'}</p>
                    <p><strong>Duration:</strong> {selectedRecord.timing.duration || 'N/A'} seconds</p>
                  </div>
                  <div className="col-md-6">
                    <h5 className="border-bottom pb-2">Network Information</h5>
                    <p><strong>IP Address:</strong> {selectedRecord.network_info.ip_address || 'N/A'}</p>
                    <p><strong>IP Type:</strong> {selectedRecord.network_info.ip_type || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <h5 className="border-bottom pb-2">Status Information</h5>
                    <p><strong>Status:</strong> 
                      <span className={`badge ${selectedRecord.status_info.status === 'active' ? 'active-badge' : selectedRecord.status_info.status === 'completed' ? 'completed-badge' : 'terminated-badge'} status-badge ms-2`}>
                        {selectedRecord.status_info.status}
                      </span>
                    </p>
                    <p><strong>Termination Reason:</strong> {selectedRecord.status_info.termination_reason || 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <h5 className="border-bottom pb-2">Reservation Information</h5>
                    <p><strong>Reservation ID:</strong> {selectedRecord.reservation_info.reservation_id || 'N/A'}</p>
                    <p><strong>IP Type:</strong> {selectedRecord.reservation_info.ip_type || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal backdrop */}
      {showDetailsModal && (
        <div className="modal-backdrop show"></div>
      )}
    </div>
  );
};

export default History;