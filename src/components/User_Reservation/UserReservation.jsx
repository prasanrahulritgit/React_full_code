import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'datatables.net-bs5/css/dataTables.bootstrap5.css';
import 'font-awesome/css/font-awesome.min.css';
import 'flatpickr/dist/flatpickr.min.css';
import './Reservation.css';

const UserReservation = () => {
  const [currentUser, setCurrentUser] = useState({ is_authenticated: true });
  const [messages, setMessages] = useState([]);
  const [userReservations, setUserReservations] = useState([]);
  const [now, setNow] = useState(new Date());
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
  const [availableDevices, setAvailableDevices] = useState([]);
  const [bookedDevices, setBookedDevices] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [bookedDevicesData, setBookedDevicesData] = useState([]);
  const [deviceReservationMap, setDeviceReservationMap] = useState({});

  // API base URL
  const API_BASE = 'http://localhost:5000'; // Update with your Flask server URL

  useEffect(() => {
    document.title = "Device Reservation";
    fetchUserReservations();
    
    // Update current time every minute
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Show toast notification
  const showToast = (text, category = 'info') => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, text, category }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== id));
    }, 5000);
  };

  // Fetch user reservations
  const fetchUserReservations = async () => {
    try {
      setReservationLoading(true);
      const response = await fetch(`${API_BASE}/api/user-reservations`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const transformedReservations = data.reservations.map(res => ({
            id: res.reservation_id,
            device_id: res.device_id,
            device_name: res.device_name,
            start_time: new Date(res.start_time),
            end_time: new Date(res.end_time),
            status: res.status,
            device_ips: res.device_ips,
            user_name: res.user_name,
            user_ip: res.user_ip,
            is_active: res.is_active,
            can_manage: res.can_manage
          }));
          setUserReservations(transformedReservations);
        } else {
          showToast(data.message, 'danger');
        }
      } else {
        showToast('Failed to fetch reservations', 'danger');
      }
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      showToast('Network error while fetching reservations', 'danger');
    } finally {
      setReservationLoading(false);
    }
  };

  // Fetch available devices based on selected time range
  const fetchAvailableDevices = async (start, end) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/api/devices/availability?start_time=${start.toISOString()}&end_time=${end.toISOString()}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableDevices(data.devices.filter(device => device.status === 'available'));
        } else {
          showToast(data.message, 'danger');
        }
      } else {
        showToast('Failed to fetch available devices', 'danger');
      }
    } catch (error) {
      console.error('Error fetching available devices:', error);
      showToast('Network error while fetching devices', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Fetch booked devices
  const fetchBookedDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/api/booked-devices`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookedDevices(data.data.booked_devices);
          
          // Create device reservation map
          const reservationMap = {};
          data.data.booked_devices.forEach(booking => {
            if (!booking.device || !booking.device.id || !booking.id) return;
            
            const deviceId = booking.device.id;
            const reservationId = booking.id;
            
            if (!reservationMap[deviceId]) {
              reservationMap[deviceId] = {};
            }
            
            if (!reservationMap[deviceId][reservationId]) {
              reservationMap[deviceId][reservationId] = {
                ...booking,
                drivers: [
                  { ip_type: 'CT1', ip_address: booking.device.ct1_ip || 'N/A' },
                  { ip_type: 'PC', ip_address: booking.device.pc_ip || 'N/A' },
                  { ip_type: 'Pulse1', ip_address: booking.device.pulse1_ip || 'N/A' },
                  { ip_type: 'Rutomatrix', ip_address: booking.device.rutomatrix_ip || 'N/A' }
                ]
              };
            }
          });
          
          setDeviceReservationMap(reservationMap);
          setBookedDevicesData(data.data.booked_devices);
        } else {
          showToast(data.message, 'danger');
        }
      } else {
        showToast('Failed to fetch booked devices', 'danger');
      }
    } catch (error) {
      console.error('Error fetching booked devices:', error);
      showToast('Network error while fetching booked devices', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Handle device selection modal opening
  const handleBookReservation = () => {
    if (!startTime || !endTime) {
      showToast('Please select both start and end times', 'warning');
      return;
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      showToast('End time must be after start time', 'warning');
      return;
    }
    
    if (start < new Date()) {
      showToast('Start time cannot be in the past', 'warning');
      return;
    }
    
    setShowDeviceSelection(true);
    fetchAvailableDevices(start, end);
    fetchBookedDevices();
  };

  // Handle device selection
  const handleDeviceSelection = (device) => {
    setSelectedDevice(device);
  };

  // Handle confirm device selection
  const handleConfirmDevice = async () => {
    if (!selectedDevice) {
      showToast('Please select a device', 'warning');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          device_id: selectedDevice.device_id,
          start_time: startTime,
          end_time: endTime,
          purpose: 'Device reservation'
        })
      });
      
      if (response.status === 401) {
        showToast('Session expired. Please login again', 'warning');
        window.location.href = '/login';
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast('Reservation created successfully', 'success');
          fetchUserReservations();
        } else {
          showToast(data.message, 'danger');
        }
      } else {
        showToast('Failed to create reservation', 'danger');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      showToast('Network error while creating reservation', 'danger');
    } finally {
      setLoading(false);
      setShowDeviceSelection(false);
      setSelectedDevice(null);
    }
  };

  // Cancel a reservation
  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }
    
    try {
      setReservationLoading(true);
      const response = await fetch(`${API_BASE}/reservation/cancel/${reservationId}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast('Reservation cancelled successfully', 'success');
          fetchUserReservations();
        } else {
          showToast(data.message, 'danger');
        }
      } else {
        showToast('Failed to cancel reservation', 'danger');
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      showToast('Network error while cancelling reservation', 'danger');
    } finally {
      setReservationLoading(false);
    }
  };

  // Launch device
  const handleLaunchDevice = (deviceId, reservationId) => {
    const reservation = userReservations.find(r => r.id === reservationId);
    if (reservation && reservation.device_ips) {
      const ipList = Object.entries(reservation.device_ips)
        .map(([type, ip]) => `${type}: ${ip}`)
        .join('\n');
      
      // Show IPs to user and let them choose
      alert(`Available IP addresses for this device:\n${ipList}`);
      
      // Connect to PC_IP by default if available
      if (reservation.device_ips.pc_ip) {
        window.open(`http://${reservation.device_ips.pc_ip}`, '_blank');
      } else if (reservation.device_ips.rutomatrix_ip) {
        window.open(`http://${reservation.device_ips.rutomatrix_ip}`, '_blank');
      }
    } else {
      showToast('Device IP addresses not available', 'warning');
    }
  };

  // Show device details
  const handleShowDeviceDetails = (device) => {
    setDeviceDetails(device);
    setShowDeviceDetails(true);
  };

  // Handle time input changes
  const handleTimeChange = (field, value) => {
    if (field === 'start_time') {
      setStartTime(value);
    } else if (field === 'end_time') {
      setEndTime(value);
    }
  };

  // Handle quick select time buttons
  const handleQuickSelectTime = (field, minutes) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    const formattedTime = date.toISOString().slice(0, 16);
    
    if (field === 'start_time') {
      setStartTime(formattedTime);
    } else if (field === 'end_time') {
      setEndTime(formattedTime);
    }
  };

  // Sort function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get device icon class
  const getDeviceIconClass = (deviceType) => {
    const type = (deviceType || '').toLowerCase();
    if (type.includes('rutomatrix')) return 'fas fa-microchip rutomatrix-icon';
    if (type.includes('pulse')) return 'fas fa-heartbeat pulse-icon';
    if (type.includes('ct')) return 'fas fa-camera ct-icon';
    if (type.includes('pc')) return 'fas fa-desktop pc-icon';
    return 'fas fa-server other-icon';
  };

  // Format date time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if time overlaps
  const isTimeOverlap = (start1, end1, start2, end2) => {
    const startDate1 = new Date(start1);
    const endDate1 = new Date(end1);
    const startDate2 = new Date(start2);
    const endDate2 = new Date(end2);
    
    return startDate1 < endDate2 && endDate1 > startDate2;
  };

  // Filter booked devices by ID
  const filterBookedDevicesById = (filterValue) => {
    return bookedDevicesData.filter(device => 
      device.device.id.toLowerCase().includes(filterValue.toLowerCase())
    );
  };

  // Calculate pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  
  // Sort reservations based on sortConfig
  const sortedReservations = [...userReservations].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue, bValue;
    
    switch (sortConfig.key) {
      case 'device':
        aValue = a.device_id;
        bValue = b.device_id;
        break;
      case 'startTime':
        aValue = a.start_time;
        bValue = b.start_time;
        break;
      case 'endTime':
        aValue = a.end_time;
        bValue = b.end_time;
        break;
      case 'status':
        const isExpiredA = a.end_time < now;
        const isActiveA = a.start_time <= now && now <= a.end_time;
        aValue = isExpiredA ? 'expired' : isActiveA ? 'active' : 'upcoming';
        
        const isExpiredB = b.end_time < now;
        const isActiveB = b.start_time <= now && now <= b.end_time;
        bValue = isExpiredB ? 'expired' : isActiveB ? 'active' : 'upcoming';
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  // Filter reservations based on search term
  const filteredReservations = sortedReservations.filter(reservation => 
    reservation.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.start_time.toLocaleString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.end_time.toLocaleString().toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const currentEntries = filteredReservations.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredReservations.length / entriesPerPage);

  // Filter available and booked devices based on search terms
  const filteredAvailableDevices = availableDevices.filter(device => 
    device.device_id.toLowerCase().includes(deviceFilter.toLowerCase())
  );

  const filteredBookedDevices = filterBookedDevicesById(bookedDeviceFilter);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Device Reservation</h1>
        {currentUser.is_authenticated && (
          <a href="http://localhost:3000/auth" className="btn btn-outline-danger">
            <i className="fas fa-sign-out-alt me-2"></i> Logout
          </a>
        )}
      </div>

      {messages.length > 0 && (
        <div className="alert-messages">
          {messages.map((message) => (
            <div key={message.id} className={`alert alert-${message.category} alert-dismissible fade show`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessages(messages.filter(m => m.id !== message.id))}></button>
            </div>
          ))}
        </div>
      )}

      <div className="card reservation-card mb-4">
        <div className="card-header reservation-header">
          <h5 className="mb-0"><i className="fas fa-calendar-plus me-2"></i>Create New Reservation</h5>
        </div>
        <div className="card-body">
          <form id="reservationForm" className="reservation-form">
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
                    placeholder="Select start time" 
                    required
                    value={startTime}
                    onChange={(e) => handleTimeChange('start_time', e.target.value)}
                    min={now.toISOString().slice(0, 16)}
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
                    placeholder="Select end time" 
                    required
                    value={endTime}
                    onChange={(e) => handleTimeChange('end_time', e.target.value)}
                    min={now.toISOString().slice(0, 16)}
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
                id="bookReservationBtn" 
                className="btn btn-reserve" 
                onClick={handleBookReservation}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>Loading...
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
        <div id="deviceSelectionOverlay" className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h3>Select a Device for Your Reservation</h3>
              <span className="close-overlay" onClick={() => setShowDeviceSelection(false)}>&times;</span>
            </div>
            
            <div className="device-tabs d-flex">
              <div 
                className={`device-tab ${activeTab === 'available' ? 'active' : ''}`} 
                onClick={() => setActiveTab('available')}
                data-tab="available"
              >
                Available Devices
              </div>
              <div 
                className={`device-tab ${activeTab === 'booked' ? 'active' : ''}`} 
                onClick={() => setActiveTab('booked')}
                data-tab="booked"
              >
                Booked Devices
              </div>
            </div>
            
            <div className="tab-content">
              {activeTab === 'available' && (
                <div id="available-devices" className="tab-pane active">
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
                    {loading ? (
                      <div className="loading-message">
                        <i className="fas fa-spinner fa-spin"></i> Loading devices...
                      </div>
                    ) : filteredAvailableDevices.length > 0 ? (
                      <div className="row">
                        {filteredAvailableDevices.map(device => (
                          <div key={device.device_id} className="col-md-4 mb-3">
                            <div 
                              className={`card device-card ${selectedDevice?.device_id === device.device_id ? 'border-primary selected' : ''}`}
                              onClick={() => handleDeviceSelection(device)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="card-body">
                                <div className="device-icon">
                                  <i className={getDeviceIconClass(device.type)}></i>
                                </div>
                                <h5 className="card-title">{device.device_id}</h5>
                                <p className="card-text">
                                  <span className="badge bg-success">Available</span>
                                </p>
                                <button 
                                  className="btn btn-sm btn-info"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowDeviceDetails(device);
                                  }}
                                >
                                  <i className="fas fa-info-circle"></i> Details
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted">
                        <i className="far fa-calendar-times fa-2x mb-2"></i><br />
                        No available devices found
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'booked' && (
                <div id="booked-devices" className="tab-pane">
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
                    {loading ? (
                      <div className="loading-message">
                        <i className="fas fa-spinner fa-spin"></i> Loading booked devices...
                      </div>
                    ) : filteredBookedDevices.length > 0 ? (
                      <div className="row">
                        {filteredBookedDevices.map(device => {
                          const now = new Date();
                          const startTime = new Date(device.time.start);
                          const endTime = new Date(device.time.end);
                          
                          const status = endTime < now ? 'Expired' :
                                      startTime <= now && now <= endTime ? 'Active' : 'Upcoming';
                          
                          const statusClass = endTime < now ? 'bg-secondary' :
                                          startTime <= now && now <= endTime ? 'bg-success' : 'bg-primary';
                          
                          const iconClass = 'fas fa-desktop';
                          
                          return (
                            <div key={device.id} className="col-md-6 mb-3">
                              <div className="card device-card booked-device-card">
                                <div className="card-body">
                                  <div className="booked-device-card-header">
                                    <div className="d-flex align-items-center">
                                      <i className={`${iconClass} me-2`}></i>
                                      <h5 className="booked-device-card-title mb-0">Device {device.device.id}</h5>
                                    </div>
                                    <span className={`badge ${statusClass} booked-device-card-status`}>{status}</span>
                                  </div>
                                  <div className="booked-device-card-body">
                                    <div className="booked-device-card-row">
                                      <span className="booked-device-card-label">Device ID:</span>
                                      <span className="booked-device-card-value">{device.device.id}</span>
                                    </div>
                                    <div className="booked-device-card-row">
                                      <span className="booked-device-card-label">User ID:</span>
                                      <span className="booked-device-card-value">{device.user.id || 'N/A'}</span>
                                    </div>
                                    <div className="booked-device-card-row">
                                      <span className="booked-device-card-label">Start:</span>
                                      <span className="booked-device-card-value">{formatDateTime(device.time.start)}</span>
                                    </div>
                                    <div className="booked-device-card-row">
                                      <span className="booked-device-card-label">End:</span>
                                      <span className="booked-device-card-value">{formatDateTime(device.time.end)}</span>
                                    </div>
                                    <div className="booked-device-card-row">
                                      <span className="booked-device-card-label">Duration:</span>
                                      <span className="booked-device-card-value">{device.time.duration_minutes} minutes</span>
                                    </div>
                                  </div>
                                  {device.user.role === 'admin' && (
                                    <div className="booked-device-card-footer">
                                      <button className="btn btn-sm btn-outline-danger cancel-btn"
                                        title="Cancel Reservation"
                                        onClick={() => handleCancelReservation(device.id)}>
                                        <i className="fas fa-times"></i> Cancel
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted">
                        <i className="far fa-calendar-times fa-2x mb-2"></i><br />
                        No booked devices found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="confirm-selection mt-3">
              <button 
                id="confirmDeviceSelectionBtn" 
                className="btn btn-reserve" 
                onClick={handleConfirmDevice}
                disabled={!selectedDevice || loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check me-2"></i>Confirm Device Selection
                  </>
                )}
              </button>
              {selectedDevice && (
                <div className="mt-2">
                  <strong>Selected Device:</strong> {selectedDevice.device_id}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeviceDetails && deviceDetails && (
        <>
          <div id="deviceDetailsContainer" className="device-details-container">
            <div className="device-details-header">
              <h4 id="deviceDetailsTitle">Device Details - {deviceDetails.device_id || deviceDetails.device?.id}</h4>
              <span className="close-details" onClick={() => setShowDeviceDetails(false)}>&times;</span>
            </div>
            <div className="device-details-content" id="deviceDetailsContent">
              <div className="row">
                <div className="col-md-6">
                  <h5>Basic Information</h5>
                  <p><strong>Device ID:</strong> {deviceDetails.device_id || deviceDetails.device?.id}</p>
                  <p><strong>Status:</strong> {deviceDetails.status || 'N/A'}</p>
                  
                  {deviceDetails.pc_ip && <p><strong>PC IP:</strong> {deviceDetails.pc_ip}</p>}
                  {deviceDetails.rutomatrix_ip && <p><strong>Rutomatrix IP:</strong> {deviceDetails.rutomatrix_ip}</p>}
                  {deviceDetails.pulse1_ip && <p><strong>Pulse1 IP:</strong> {deviceDetails.pulse1_ip}</p>}
                  {deviceDetails.ct1_ip && <p><strong>CT1 IP:</strong> {deviceDetails.ct1_ip}</p>}
                  
                  {deviceDetails.device && (
                    <>
                      {deviceDetails.device.pc_ip && <p><strong>PC IP:</strong> {deviceDetails.device.pc_ip}</p>}
                      {deviceDetails.device.rutomatrix_ip && <p><strong>Rutomatrix IP:</strong> {deviceDetails.device.rutomatrix_ip}</p>}
                      {deviceDetails.device.pulse1_ip && <p><strong>Pulse1 IP:</strong> {deviceDetails.device.pulse1_ip}</p>}
                      {deviceDetails.device.ct1_ip && <p><strong>CT1 IP:</strong> {deviceDetails.device.ct1_ip}</p>}
                    </>
                  )}
                </div>
                
                {deviceDetails.time && (
                  <div className="col-md-6">
                    <h5>Reservation Details</h5>
                    <p><strong>Start Time:</strong> {new Date(deviceDetails.time.start).toLocaleString()}</p>
                    <p><strong>End Time:</strong> {new Date(deviceDetails.time.end).toLocaleString()}</p>
                    <p><strong>Duration:</strong> {deviceDetails.time.duration_minutes} minutes</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div id="detailsOverlay" className="details-overlay" onClick={() => setShowDeviceDetails(false)}></div>
        </>
      )}

      <div className="row">
        <div className="col-lg-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: '#1e1e1e', color: '#1281d6' }}>
              <h5 className="mb-0"><i className="fas fa-calendar-alt me-2"></i>Your Reservations</h5>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <select 
                    id="entriesPerPage" 
                    className="form-select form-select-sm"
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
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
                    id="reservationSearch" 
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
              {reservationLoading ? (
                <div className="text-center py-4">
                  <i className="fas fa-spinner fa-spin fa-2x"></i>
                  <p>Loading reservations...</p>
                </div>
              ) : (
                <>
                  <div className="scrollable-table">
                    <table id="reservationsTable" className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th 
                            className={`sortable ${sortConfig.key === 'device' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} 
                            onClick={() => handleSort('device')}
                            data-sort="device"
                          >
                            Device <i className="fas fa-sort float-end mt-1"></i>
                          </th>
                          <th 
                            className={`sortable ${sortConfig.key === 'startTime' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} 
                            onClick={() => handleSort('startTime')}
                            data-sort="startTime"
                          >
                            Start <i className="fas fa-sort float-end mt-1"></i>
                          </th>
                          <th 
                            className={`sortable ${sortConfig.key === 'endTime' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} 
                            onClick={() => handleSort('endTime')}
                            data-sort="endTime"
                          >
                            End <i className="fas fa-sort float-end mt-1"></i>
                          </th>
                          <th 
                            className={`sortable ${sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} 
                            onClick={() => handleSort('status')}
                            data-sort="status"
                          >
                            Status <i className="fas fa-sort float-end mt-1"></i>
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody id="reservationsBody">
                        {currentEntries.length > 0 ? (
                          currentEntries.map((res) => {
                            const isExpired = res.end_time < now;
                            const isActive = res.start_time <= now && now <= res.end_time;
                            const statusClass = isExpired ? 'table-secondary' : isActive ? 'table-success' : '';
                            const status = isExpired ? 'expired' : isActive ? 'active' : 'upcoming';
                            
                            return (
                              <tr 
                                key={res.id}
                                className={statusClass}
                                data-device={res.device_id.toLowerCase()}
                                data-start-time={Math.floor(res.start_time.getTime() / 1000)}
                                data-end-time={Math.floor(res.end_time.getTime() / 1000)}
                                data-status={status}
                              >
                                <td>{res.device_id}</td>
                                <td>{res.start_time.toLocaleString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                                <td>{res.end_time.toLocaleString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
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
                                      data-device-id={res.device_id}
                                      data-reservation-id={res.id}
                                    >
                                      <i className="fas fa-rocket"></i> Launch
                                    </button>

                                    <button 
                                      type="button" 
                                      className="btn btn-sm btn-danger cancel-btn"
                                      onClick={() => handleCancelReservation(res.id)}
                                      disabled={reservationLoading}
                                    >
                                      {reservationLoading ? (
                                        <i className="fas fa-spinner fa-spin"></i>
                                      ) : (
                                        <>
                                          <i className="bi bi-x-circle"></i> Cancel
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-4 text-muted">
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
                      Showing <span id="showingFrom">{indexOfFirstEntry + 1}</span> to <span id="showingTo">
                        {Math.min(indexOfLastEntry, filteredReservations.length)}
                      </span> of <span id="totalEntries">{filteredReservations.length}</span> entries
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`} id="prevPage">
                          <a 
                            className="page-link" 
                            href="#" 
                            tabIndex={currentPage === 1 ? -1 : 0}
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) setCurrentPage(currentPage - 1);
                            }}
                          >
                            Previous
                          </a>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                            <a 
                              className="page-link" 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                            >
                              {page}
                            </a>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`} id="nextPage">
                          <a 
                            className="page-link" 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                            }}
                          >
                            Next
                          </a>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserReservation;