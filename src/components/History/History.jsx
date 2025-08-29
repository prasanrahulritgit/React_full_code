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

  // Function to determine the current status based on timing
  const determineCurrentStatus = (record) => {
    const now = new Date();
    const startTime = record.timing.start_time ? new Date(record.timing.start_time) : null;
    const endTime = record.timing.end_time ? new Date(record.timing.end_time) : null;
    
    // If the record is terminated, always keep it as terminated
    if (record.status === 'terminated') {
      return 'terminated';
    }

    // If there's no start time, return the original status
    if (!startTime) {
      return record.status;
    }

    // If current time is before start time, it's upcoming (only if not terminated)
    if (now < startTime) {
      return 'upcoming';
    }

    // If current time is between start time and end time (or no end time), it's active
    if (now >= startTime && (!endTime || now <= endTime)) {
      return 'active';
    }

    // For all other cases, return the original status from the database
    // This preserves active, completed, and any other statuses as determined by the backend
    return record.status;
  };

  // Function to get badge class based on status
  const getBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'active-badge';
      case 'completed':
        return 'completed-badge';
      case 'upcoming':
        return 'upcoming-badge';
      case 'terminated':
        return 'terminated-badge';
      default:
        return 'terminated-badge';
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchHistoryData();
    fetchDevices();
  }, []);

  // Refetch data when pagination changes
  useEffect(() => {
    fetchHistoryData();
  }, [pagination.current_page, pagination.per_page]);

  // Set up interval to update status and auto refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let shouldRefresh = false;

      // Check if any record's start time or end time matches current time (within 1 minute)
      historyRecords.forEach(record => {
        const startTime = record.timing.start_time ? new Date(record.timing.start_time) : null;
        const endTime = record.timing.end_time ? new Date(record.timing.end_time) : null;

        // Check if current time is within 1 minute of start time or end time
        if (startTime) {
          const timeDiffStart = Math.abs(now - startTime);
          if (timeDiffStart <= 60000) { // Within 1 minute (60000 ms)
            shouldRefresh = true;
          }
        }

        if (endTime) {
          const timeDiffEnd = Math.abs(now - endTime);
          if (timeDiffEnd <= 60000) { // Within 1 minute (60000 ms)
            shouldRefresh = true;
          }
        }
      });

      if (shouldRefresh) {
        console.log('Auto refreshing data due to start/end time match');
        fetchHistoryData(); // Refresh data from server
      } else {
        // Just force re-render for status updates
        setHistoryRecords(prev => [...prev]);
      }
    }, 30000); // Check every 30 seconds for more responsive updates

    return () => clearInterval(interval);
  }, [historyRecords]); // Dependency on historyRecords to check against latest data

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
    const currentStatus = determineCurrentStatus(record);
    
    const matchesDeviceFilter = !deviceFilter || 
      (record.device && record.device.id && record.device.id.toString().toLowerCase().includes(deviceFilter.toLowerCase()));
    const matchesUserFilter = !userFilter || 
      (record.user && record.user.id && record.user.id.toString().includes(userFilter));
    const matchesStatusFilter = !statusFilter || currentStatus === statusFilter;
    
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

  // Updated handleViewDetails with fallback functionality
  const handleViewDetails = async (record) => {
    try {
      console.log('Fetching details for record ID:', record.id);
      
      const response = await fetch(`/history/get-usage-record/${record.id}`, {
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const recordDetails = await response.json();
        console.log('Record details received:', recordDetails);
        
        if (recordDetails) {
          setSelectedRecord(recordDetails);
          setShowDetailsModal(true);
          return;
        }
      }
      
      // Fallback: Use the data we already have from the main list
      console.log('Using fallback data for record:', record);
      const fallbackRecord = {
        device_id: record.device?.id || 'N/A',
        user_info: {
          user_id: record.user?.id || 'N/A',
          user_name: record.user?.name || 'N/A',
          user_ip: record.user?.ip || 'N/A'
        },
        timing: {
          start_time: record.timing?.start_time || null,
          end_time: record.timing?.end_time || null,
          duration: record.timing?.duration || null
        },
        network_info: {
          ip_address: record.network_info?.ip_address || 'N/A',
          ip_type: record.network_info?.ip_type || 'N/A'
        },
        status_info: {
          status: determineCurrentStatus(record),
          termination_reason: record.termination_reason || 'N/A'
        },
        reservation_info: {
          reservation_id: record.reservation?.id || 'N/A',
          ip_type: record.reservation?.ip_type || 'N/A'
        }
      };
      
      setSelectedRecord(fallbackRecord);
      setShowDetailsModal(true);
      
    } catch (error) {
      console.error('Error fetching record details:', error);
      alert('Failed to fetch record details');
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
        const currentStatus = determineCurrentStatus(row);
        const badgeClass = getBadgeClass(currentStatus);
        
        return <span className={`badge ${badgeClass} status-badge`}>{currentStatus}</span>;
      },
      sortable: true,
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="action-buttons">
          <button 
            className="btn btn-sm view-details Action-btn" 
            onClick={() => handleViewDetails(row)}
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
                <option value="upcoming">Upcoming</option>
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
                      <span className={`badge ${getBadgeClass(selectedRecord.status_info.status)} status-badge ms-2`}>
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