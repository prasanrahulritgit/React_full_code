import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import './History.css';

const History = () => {
  const [historyRecords, setHistoryRecords] = useState([]);
  const [devices, setDevices] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    fetchHistoryData();
    fetchDevices();
  }, []);

  // Refetch data when filters change
  useEffect(() => {
    fetchHistoryData();
  }, [filterText, statusFilter, dateFrom, dateTo]);

  const fetchHistoryData = async () => {
    try {
      // Build query string with filters
      const params = new URLSearchParams();
      if (filterText) params.append('device', filterText);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const response = await fetch(`/history/api/records?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch history');
      
      const data = await response.json();
      
      // Convert ISO strings to Date objects
      const formattedData = data.map(record => ({
        ...record,
        actual_start_time: record.actual_start_time ? new Date(record.actual_start_time) : null,
        actual_end_time: record.actual_end_time ? new Date(record.actual_end_time) : null
      }));
      
      setHistoryRecords(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching history:', error);
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await fetch('/history/api/devices', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch devices');
      
      const data = await response.json();
      setDevices(data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowDetailsModal(true);
  };

  const handleDeleteRecord = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const response = await fetch(`/history/api/record/${recordId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          setHistoryRecords(historyRecords.filter(record => record.id !== recordId));
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
        const response = await fetch('/history/api/clear-old', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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

  const columns = [
    {
      name: 'Device',
      selector: row => (
        <div>
          <strong>{row.device.device_name}</strong>
          <div className="text-muted small">{row.device.device_id}</div>
        </div>
      ),
      sortable: true,
    },
    {
      name: 'Start Time',
      selector: row => row.actual_start_time ? row.actual_start_time.toLocaleString() : 'N/A',
      sortable: true,
    },
    {
      name: 'End Time',
      selector: row => row.actual_end_time ? row.actual_end_time.toLocaleString() : <em>In Progress</em>,
      sortable: true,
    },
    {
      name: 'Duration',
      selector: row => {
        if (row.duration) {
          const hours = Math.floor(row.duration / 3600);
          const minutes = Math.floor((row.duration % 3600) / 60);
          return `${hours}h ${minutes}m`;
        }
        return '-';
      },
      sortable: true,
      cell: row => <span className="duration-cell">{
        row.duration ? 
        `${Math.floor(row.duration / 3600)}h ${Math.floor((row.duration % 3600) / 60)}m` : 
        '-'
      }</span>,
    },
    {
      name: 'Status',
      selector: row => {
        let badgeClass = '';
        if (row.status === 'active') badgeClass = 'active-badge';
        else if (row.status === 'completed') badgeClass = 'completed-badge';
        else badgeClass = 'terminated-badge';
        
        return <span className={`badge ${badgeClass} status-badge`}>{row.status}</span>;
      },
      sortable: true,
    },
    {
      name: 'IP Type',
      selector: row => row.ip_type,
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
          <form className="row g-3">
            <div className="col-md-3">
              <label htmlFor="deviceFilter" className="form-label">Device</label>
              <select 
                id="deviceFilter" 
                className="form-select"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              >
                <option value="">All Devices</option>
                {devices.map(device => (
                  <option key={device.device_id} value={device.device_id}>
                    {device.device_name} ({device.device_id})
                  </option>
                ))}
              </select>
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
              <label htmlFor="dateFrom" className="form-label">From Date</label>
              <input 
                type="date" 
                className="form-control" 
                id="dateFrom"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label htmlFor="dateTo" className="form-label">To Date</label>
              <input 
                type="date" 
                className="form-control" 
                id="dateTo"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <DataTable
                columns={columns}
                data={historyRecords}
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
                    <p><strong>Device ID:</strong> {selectedRecord.device.device_id}</p>
                    <p><strong>Device Name:</strong> {selectedRecord.device.device_name}</p>
                  </div>
                  <div className="col-md-6">
                    <h5 className="border-bottom pb-2">Timing Information</h5>
                    <p><strong>Start Time:</strong> {selectedRecord.actual_start_time ? selectedRecord.actual_start_time.toLocaleString() : 'N/A'}</p>
                    <p><strong>End Time:</strong> {selectedRecord.actual_end_time ? selectedRecord.actual_end_time.toLocaleString() : 'N/A'}</p>
                    <p><strong>Duration:</strong> {
                      selectedRecord.duration ? 
                      `${Math.floor(selectedRecord.duration / 3600)}h ${Math.floor((selectedRecord.duration % 3600) / 60)}m` : 
                      'N/A'
                    }</p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <h5 className="border-bottom pb-2">Status Information</h5>
                    <p><strong>Status:</strong> 
                      <span className={`badge ${selectedRecord.status === 'active' ? 'active-badge' : selectedRecord.status === 'completed' ? 'completed-badge' : 'terminated-badge'} status-badge ms-2`}>
                        {selectedRecord.status}
                      </span>
                    </p>
                    <p><strong>IP Type:</strong> {selectedRecord.ip_type}</p>
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
