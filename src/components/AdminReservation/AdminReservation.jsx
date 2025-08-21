import React, { useState, useEffect } from 'react';
import './AdminReservation.css';

const AdminReservation = () => {
  const [currentUser, setCurrentUser] = useState({ is_authenticated: true, role: 'admin' });
  const [messages, setMessages] = useState([]);
  const [userReservations, setUserReservations] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [now, setNow] = useState(new Date());
  const [csrfToken, setCsrfToken] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceSelection, setShowDeviceSelection] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [bookedDeviceFilter, setBookedDeviceFilter] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  const [deviceDetails, setDeviceDetails] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [devices, setDevices] = useState([]);
  const [bookedDevices, setBookedDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize data
  useEffect(() => {
    document.title = "Admin Device Reservation";
    
    // Mock data - replace with API calls
    const mockReservations = [
      {
        id: 1,
        device_id: "DEV001",
        user_id: "user123",
        user_name: "John Doe",
        start_time: new Date(Date.now() + 2*60*60*1000),
        end_time: new Date(Date.now() + 4*60*60*1000),
      },
      {
        id: 2,
        device_id: "DEV002",
        user_id: "user456",
        user_name: "Jane Smith",
        start_time: new Date(Date.now() - 1*60*60*1000),
        end_time: new Date(Date.now() + 1*60*60*1000),
      }
    ];
    
    const mockDevices = [
      { device_id: "DEV001", name: "Device 1", type: "CT", status: "available" },
      { device_id: "DEV002", name: "Device 2", type: "PC", status: "booked" },
      { device_id: "DEV003", name: "Device 3", type: "Pulse", status: "available" },
    ];
    
    setAllReservations(mockReservations);
    setDevices(mockDevices);
    setCsrfToken('mock-csrf-token');
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleQuickSelectTime = (field, minutes) => {
    const baseDate = field === 'end_time' && startTime ? new Date(startTime) : new Date();
    const newDate = new Date(baseDate.getTime() + minutes * 60 * 1000);
    
    if (field === 'start_time') {
      setStartTime(newDate.toISOString().slice(0, 16).replace('T', ' '));
    } else {
      setEndTime(newDate.toISOString().slice(0, 16).replace('T', ' '));
    }
  };

  const handleBookReservation = () => {
    if (!startTime || !endTime) {
      showToast('Please select both start and end times', 'warning');
      return;
    }
    
    const selectedStart = new Date(startTime);
    if (selectedStart < new Date()) {
      showToast('Cannot book in past time. Please select future time slots.', 'warning');
      return;
    }
    
    if (new Date(endTime) <= selectedStart) {
      showToast('End time must be after start time', 'warning');
      return;
    }
    
    setShowDeviceSelection(true);
    // Load devices and booked devices would go here
  };

  const handleDeviceSelection = (device) => {
    if (device.status === 'available') {
      setSelectedDevice(device);
    } else {
      showToast('This device is already booked for the selected time', 'warning');
    }
  };

  const handleConfirmDevice = async () => {
    if (!selectedDevice) {
      showToast('Please select a device first', 'warning');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // API call to create reservation
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
          device_id: selectedDevice.device_id,
          start_time: startTime,
          end_time: endTime,
          csrf_token: csrfToken
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create reservation');
      }
      
      showToast('Device booked successfully!', 'success');
      setShowDeviceSelection(false);
      setSelectedDevice(null);
      
      // Refresh the reservations table
      // You would typically fetch updated data here
      
    } catch (error) {
      console.error('Booking error:', error);
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    
    try {
      const response = await fetch(`/reservation/cancel/${reservationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ csrf_token: csrfToken })
      });

      if (!response.ok) throw new Error('Failed to cancel reservation');

      showToast('Reservation cancelled successfully!', 'success');
      
      // Refresh data
      // You would typically fetch updated data here
      
    } catch (error) {
      console.error('Cancellation error:', error);
      showToast(error.message, 'error');
    }
  };

  const handleLaunchDevice = (deviceId, reservationId) => {
    const baseUrl = 'http://localhost:3000/dashboard';
    const params = new URLSearchParams({
      device: deviceId,
      reservation: reservationId
    });
    
    const fullUrl = `${baseUrl}?${params.toString()}`;
    window.open(fullUrl, '_blank');
  };

  const showToast = (message, type = 'info') => {
    // Create a toast notification
    const toast = {
      id: Date.now(),
      message,
      type
    };
    
    setMessages(prev => [...prev, toast]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setMessages(prev => prev.filter(t => t.id !== toast.id));
    }, 5000);
  };

  // Filter and sort reservations
  const filteredReservations = allReservations.filter(res => {
    const searchLower = searchTerm.toLowerCase();
    return (
      res.device_id.toLowerCase().includes(searchLower) ||
      res.user_id.toLowerCase().includes(searchLower) ||
      res.user_name.toLowerCase().includes(searchLower)
    );
  });

  const sortedReservations = [...filteredReservations].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (sortConfig.key === 'start_time' || sortConfig.key === 'end_time') {
      return sortConfig.direction === 'asc' 
        ? new Date(aValue) - new Date(bValue)
        : new Date(bValue) - new Date(aValue);
    } else {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
  });

  // Calculate pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = sortedReservations.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(sortedReservations.length / entriesPerPage);

  // Filter devices based on tab and search
  const filteredDevices = devices.filter(device => {
    const matchesFilter = device.device_id.toLowerCase().includes(deviceFilter.toLowerCase());
    
    if (activeTab === 'available') {
      return matchesFilter && device.status === 'available';
    } else {
      return matchesFilter && device.status === 'booked';
    }
  });

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Admin Device Reservation</h1>
      </div>

      {messages.length > 0 && (
        <div className="toast-container">
          {messages.map((toast) => (
            <div key={toast.id} className={`toast ${toast.type}`}>
              <div className="toast-icon">
                {toast.type === 'success' && <i className="fas fa-check-circle"></i>}
                {toast.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                {toast.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                {toast.type === 'info' && <i className="fas fa-info-circle"></i>}
              </div>
              <div className="toast-message">{toast.message}</div>
              <button 
                className="toast-close" 
                onClick={() => setMessages(prev => prev.filter(t => t.id !== toast.id))}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card reservation-card mb-4">
        <div className="card-header reservation-header">
          <h5 className="mb-0"><i className="fas fa-calendar-plus me-2"></i>Create New Reservation</h5>
        </div>
        <div className="card-body">
          <form className="reservation-form">
            <input type="hidden" name="csrf_token" value={csrfToken} />
            
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="start_time" className="form-label">Start Time</label>
                <div className="input-icon-group">
                  <i className="fas fa-clock input-icon"></i>
                  <input 
                    type="datetime-local" 
                    className="form-control form-control-lg" 
                    id="start_time" 
                    name="start_time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="quick-select-buttons mt-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary quick-select-btn" onClick={() => handleQuickSelectTime('start_time', 30)}>+30 min</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary quick-select-btn" onClick={() => handleQuickSelectTime('start_time', 60)}>+1 hour</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary quick-select-btn" onClick={() => handleQuickSelectTime('start_time', 120)}>+2 hours</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary quick-select-btn" onClick={() => handleQuickSelectTime('start_time', 180)}>+3 hours</button>
                </div>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="end_time" className="form-label">End Time</label>
                <div className="input-icon-group">
                  <i className="fas fa-clock input-icon"></i>
                  <input 
                    type="datetime-local" 
                    className="form-control form-control-lg" 
                    id="end_time" 
                    name="end_time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
                <div className="quick-select-buttons mt-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary quick-select-btn" onClick={() => handleQuickSelectTime('end_time', 30)}>+30 min</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary quick-select-btn" onClick={() => handleQuickSelectTime('end_time', 60)}>+1 hour</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary quick-select-btn" onClick={() => handleQuickSelectTime('end_time', 120)}>+2 hours</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary quick-select-btn" onClick={() => handleQuickSelectTime('end_time', 180)}>+3 hours</button>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <button 
                type="button" 
                className="btn btn-reserve" 
                onClick={handleBookReservation}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-calendar-check me-2"></i>Book Reservation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showDeviceSelection && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h3>Select a Device for Your Reservation</h3>
              <span className="close-overlay" onClick={() => setShowDeviceSelection(false)}>&times;</span>
            </div>
            
            <div className="device-tabs d-flex">
              <div 
                className={`device-tab ${activeTab === 'available' ? 'active' : ''}`} 
                onClick={() => setActiveTab('available')}
              >
                Available Devices
              </div>
              <div 
                className={`device-tab ${activeTab === 'booked' ? 'active' : ''}`} 
                onClick={() => setActiveTab('booked')}
              >
                Booked Devices
              </div>
            </div>
            
            <div className="tab-content">
              {activeTab === 'available' && (
                <div className="tab-pane active">
                  <div className="filter-container mb-3">
                    <div className="row">
                      <div className="col-md-6">
                        <label htmlFor="deviceFilter" className="form-label">Filter by Device ID</label>
                        <div className="input-group">
                          <input 
                            type="text" 
                            className="form-control" 
                            id="deviceFilter" 
                            placeholder="Enter device ID..." 
                            value={deviceFilter}
                            onChange={(e) => setDeviceFilter(e.target.value)}
                          />
                          <button className="btn btn-outline-secondary" type="button" onClick={() => setDeviceFilter('')}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="server-rack-container">
                    <div className="device-grid">
                      {filteredDevices.length > 0 ? (
                        filteredDevices.map(device => (
                          <div 
                            key={device.device_id}
                            className={`device-card ${device.status} ${selectedDevice?.device_id === device.device_id ? 'selected' : ''}`}
                            onClick={() => handleDeviceSelection(device)}
                          >
                            <div className="device-icon">
                              <i className={getDeviceIconClass(device.type)}></i>
                            </div>
                            <div className="device-name">{device.name || `Device ${device.device_id}`}</div>
                            <div className="device-status">
                              {device.status === 'available' ? 
                                <span className="badge bg-success">Available</span> : 
                                <span className="badge bg-danger">Booked</span>
                              }
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-devices">No devices found</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'booked' && (
                <div className="tab-pane">
                  <div className="filter-container mb-3">
                    <div className="row">
                      <div className="col-md-6">
                        <label htmlFor="bookedDeviceFilter" className="form-label">Filter by Device ID</label>
                        <div className="input-group">
                          <input 
                            type="text" 
                            className="form-control" 
                            id="bookedDeviceFilter" 
                            placeholder="Enter device ID..." 
                            value={bookedDeviceFilter}
                            onChange={(e) => setBookedDeviceFilter(e.target.value)}
                          />
                          <button className="btn btn-outline-secondary" type="button" onClick={() => setBookedDeviceFilter('')}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="server-rack-container">
                    <div className="booked-devices-cards">
                      {filteredDevices.length > 0 ? (
                        filteredDevices.map(device => (
                          <div key={device.device_id} className="booked-device-card">
                            <div className="booked-device-card-header">
                              <div className="d-flex align-items-center">
                                <i className={getDeviceIconClass(device.type) + " me-2"}></i>
                                <h5 className="booked-device-card-title mb-0">Device {device.device_id}</h5>
                              </div>
                              <span className="badge bg-danger booked-device-card-status">Booked</span>
                            </div>
                            <div className="booked-device-card-body">
                              <div className="booked-device-card-row">
                                <span className="booked-device-card-label">Device ID:</span>
                                <span className="booked-device-card-value">{device.device_id}</span>
                              </div>
                              {/* More device details would go here */}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-devices">No booked devices found</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="confirm-selection">
              <button 
                className="btn btn-reserve" 
                onClick={handleConfirmDevice}
                disabled={!selectedDevice || isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check me-2"></i>Confirm Device Selection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: '#1e1e1e', color: '#1281d6' }}>
              <h5 className="mb-0"><i className="fas fa-calendar-alt me-2"></i>All Reservations</h5>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <select 
                    className="form-select form-select-sm"
                    value={entriesPerPage}
                    onChange={(e) => setEntriesPerPage(parseInt(e.target.value))}
                  >
                    <option value={5}>5 entries</option>
                    <option value={10}>10 entries</option>
                    <option value={25}>25 entries</option>
                    <option value={50}>50 entries</option>
                  </select>
                </div>
                <div className="input-group input-group-sm" style={{ width: '200px' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-outline-light" type="button">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="scrollable-table">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th 
                        className={`sortable ${sortConfig.key === 'device_id' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} 
                        onClick={() => handleSort('device_id')}
                      >
                        Device <i className="fas fa-sort float-end mt-1"></i>
                      </th>
                      <th 
                        className={`sortable ${sortConfig.key === 'user_name' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} 
                        onClick={() => handleSort('user_name')}
                      >
                        User <i className="fas fa-sort float-end mt-1"></i>
                      </th>
                      <th 
                        className={`sortable ${sortConfig.key === 'start_time' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} 
                        onClick={() => handleSort('start_time')}
                      >
                        Start <i className="fas fa-sort float-end mt-1"></i>
                      </th>
                      <th 
                        className={`sortable ${sortConfig.key === 'end_time' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} 
                        onClick={() => handleSort('end_time')}
                      >
                        End <i className="fas fa-sort float-end mt-1"></i>
                      </th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEntries.length > 0 ? (
                      currentEntries.map((res) => {
                        const isExpired = new Date(res.end_time) < now;
                        const isActive = new Date(res.start_time) <= now && now <= new Date(res.end_time);
                        const statusClass = isExpired ? 'table-secondary' : isActive ? 'table-success' : '';
                        
                        return (
                          <tr key={res.id} className={statusClass}>
                            <td>{res.device_id}</td>
                            <td>{res.user_name} ({res.user_id})</td>
                            <td>{new Date(res.start_time).toLocaleString()}</td>
                            <td>{new Date(res.end_time).toLocaleString()}</td>
                            <td>
                              {isExpired ? (
                                <span className="badge status-badge badge-expired">Expired</span>
                              ) : isActive ? (
                                <span className="badge status-badge badge-active">Active</span>
                              ) : (
                                <span className="badge status-badge badge-upcoming">Upcoming</span>
                              )}
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <button 
                                  className="btn btn-sm btn-outline-primary launch-btn me-2"
                                  title="Launch Dashboard"
                                  disabled={!isActive}
                                  onClick={() => handleLaunchDevice(res.device_id, res.id)}
                                >
                                  <i className="fas fa-rocket"></i> Launch
                                </button>

                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleCancelReservation(res.id)}
                                >
                                  <i className="fas fa-times"></i> Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          <i className="far fa-calendar-times fa-2x mb-2"></i><br />
                          No reservations found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="card-footer d-flex justify-content-between align-items-center">
                <div className="text-muted small">
                  Showing <span>{indexOfFirstEntry + 1}</span> to <span>
                    {Math.min(indexOfLastEntry, sortedReservations.length)}
                  </span> of <span>{sortedReservations.length}</span> entries
                </div>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get device icon class
const getDeviceIconClass = (deviceType) => {
  const type = (deviceType || '').toLowerCase();
  if (type.includes('rutomatrix')) return 'fas fa-microchip rutomatrix-icon';
  if (type.includes('pulse')) return 'fas fa-bolt pulse-icon';
  if (type.includes('ct')) return 'fas fa-camera ct-icon';
  if (type.includes('pc')) return 'fas fa-desktop pc-icon';
  return 'fas fa-server other-icon';
};

export default AdminReservation;