import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'datatables.net-bs5/css/dataTables.bootstrap5.css';
import 'font-awesome/css/font-awesome.min.css';
import 'flatpickr/dist/flatpickr.min.css';
import './UserReservation.css';
import '@fortawesome/fontawesome-free';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { 
  FaSignOutAlt, 
  FaCalendarPlus, 
  FaClock, 
  FaCalendarCheck, 
  FaInfoCircle, 
  FaCalendarAlt, 
  FaSearch, 
  FaSort, 
  FaRocket, 
  FaSpinner, 
  FaTimes,
  FaCheck,
  FaBan
} from 'react-icons/fa';

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
  const [reservationdetails, setreservationdetails] = useState(null)
  const [availableDevices, setAvailableDevices] = useState([]);
  const [bookedDevices, setBookedDevices] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const [startTimePicker, setStartTimePicker] = useState(null);
  const [endTimePicker, setEndTimePicker] = useState(null);

  // API base URL
  const API_BASE = 'http://localhost:5000'; // Update with your Flask server URL

    useEffect(() => {
    if (startTimeRef.current && endTimeRef.current) {
      // Start Time Picker
      const startPicker = flatpickr(startTimeRef.current, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today",
        time_24hr: true,
        minuteIncrement: 30,
        onChange: function(selectedDates, dateStr) {
          setStartTime(dateStr.replace(' ', 'T'));
        }
      });

      // End Time Picker
      const endPicker = flatpickr(endTimeRef.current, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today",
        time_24hr: true,
        minuteIncrement: 30,
        onChange: function(selectedDates, dateStr) {
          setEndTime(dateStr.replace(' ', 'T'));
        }
      });

      setStartTimePicker(startPicker);
      setEndTimePicker(endPicker);

      return () => {
        startPicker.destroy();
        endPicker.destroy();
      };
    }
  }, []);


  useEffect(() => {
    document.title = "Device Reservation";
    fetchUserReservations();
    
    // Update current time every minute
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);


// Fetch user reservations
const fetchUserReservations = async () => {
  try {
    setReservationLoading(true);
    const response = await fetch(`${API_BASE}/api/user-reservations`, {
      credentials: 'include' // Include cookies for authentication
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        // Transform the data to match your frontend structure
        const transformedReservations = data.reservations.map(res => ({
          id: res.reservation_id,
          device_id: res.device_id,
          device_name: res.device_name,
          start_time: new Date(res.start_time),
          end_time: new Date(res.end_time),
          status: res.status,
          device_ips: res.device_ips, // Now contains all IP addresses
          user_name: res.user_name,
          user_ip: res.user_ip,
          is_active: res.is_active,
          can_manage: res.can_manage
        }));
        
        // Filter out expired reservations
        const currentTime = new Date();
        const activeReservations = transformedReservations.filter(
          reservation => new Date(reservation.end_time) >= currentTime
        );
        
        setUserReservations(activeReservations);
      } else {
        setMessages([{ text: data.message, category: 'danger' }]);
      }
    } else {
      setMessages([{ text: 'Failed to fetch reservations', category: 'danger' }]);
    }
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    setMessages([{ text: 'Network error while fetching reservations', category: 'danger' }]);
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
        // Store both available and booked devices for the time range
        setAvailableDevices(data.devices || []);
      } else {
        setMessages([{ text: data.message, category: 'danger' }]);
      }
    } else {
      setMessages([{ text: 'Failed to fetch available devices', category: 'danger' }]);
    }
  } catch (error) {
    console.error('Error fetching available devices:', error);
    setMessages([{ text: 'Network error while fetching devices', category: 'danger' }]);
  } finally {
    setLoading(false);
  }
};


const fetchBookedDevices = async () => {
  try {
    setLoading(true);
    console.log('Fetching booked devices...');
    
    const response = await fetch(`${API_BASE}/api/booked-devices`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Booked devices response:', data);
      
      if (data.success) {
        // Handle different possible response structures
        let devices = [];
        
        if (Array.isArray(data.booked_devices)) {
          devices = data.booked_devices;
        } else if (Array.isArray(data.reservations)) {
          devices = data.reservations;
        } else if (Array.isArray(data.data)) {
          devices = data.data;
        } else if (data.data && Array.isArray(data.data.booked_devices)) {
          devices = data.data.booked_devices;
        } else if (Array.isArray(data)) {
          devices = data; // Direct array response
        }
        
        console.log('Processed booked devices:', devices);
        setBookedDevices(devices);
      } else {
        setMessages([{ text: data.message || 'Failed to fetch booked devices', category: 'danger' }]);
      }
    } else {
      setMessages([{ text: `Server error: ${response.status}`, category: 'danger' }]);
    }
  } catch (error) {
    console.error('Error fetching booked devices:', error);
    setMessages([{ text: 'Network error while fetching booked devices', category: 'danger' }]);
  } finally {
    setLoading(false);
  }
};

  // Handle device selection modal opening
  const handleBookReservation = () => {
    if (!startTime || !endTime) {
      setMessages([{ text: 'Please select both start and end times', category: 'warning' }]);
      return;
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      setMessages([{ text: 'End time must be after start time', category: 'warning' }]);
      return;
    }
    
    if (start < new Date()) {
      setMessages([{ text: 'Start time cannot be in the past', category: 'warning' }]);
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


// Update your handleConfirmDevice function
const handleConfirmDevice = async () => {
  if (!selectedDevice) {
    setMessages([{ text: 'Please select a device', category: 'warning' }]);
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
      setMessages([{ text: 'Session expired. Please login again', category: 'warning' }]);
      window.location.href = '/login';
      return;
    }
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setMessages([{ text: 'Reservation created successfully', category: 'success' }]);
        fetchUserReservations();
      } else {
        setMessages([{ text: data.message, category: 'danger' }]);
      }
    } else {
      setMessages([{ text: 'Failed to create reservation', category: 'danger' }]);
    }
  } catch (error) {
    console.error('Error creating reservation:', error);
    setMessages([{ text: 'Network error while creating reservation', category: 'danger' }]);
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
          setMessages([{ text: 'Reservation cancelled successfully', category: 'success' }]);
          fetchUserReservations(); // Refresh the reservations list
        } else {
          setMessages([{ text: data.message, category: 'danger' }]);
        }
      } else {
        setMessages([{ text: 'Failed to cancel reservation', category: 'danger' }]);
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      setMessages([{ text: 'Network error while cancelling reservation', category: 'danger' }]);
    } finally {
      setReservationLoading(false);
    }
  };

// Launch device - redirect to dashboard
const handleLaunchDevice = (deviceId, reservationId) => {
  // Find the reservation to get the device details
  const reservation = userReservations.find(r => r.id === reservationId);
  
  if (reservation) {
    // Determine which IP type to use (prioritize PC_IP if available)
    let ipType = '';
    if (reservation.device_ips && reservation.device_ips.pc_ip) {
      ipType = 'pc_ip';
    } else if (reservation.device_ips && reservation.device_ips.rutomatrix_ip) {
      ipType = 'rutomatrix_ip';
    } else if (reservation.device_ips && reservation.device_ips.pulse1_ip) {
      ipType = 'pulse1_ip';
    } else if (reservation.device_ips && reservation.device_ips.ct1_ip) {
      ipType = 'ct1_ip';
    }
    
    // If we found an IP type, navigate to dashboard
    if (ipType) {
      const baseUrl = 'http://localhost:3000/dashboard';
      const params = new URLSearchParams({
        device: deviceId,
        ip_type: ipType,
        reservation: reservationId
      });
      
      const fullUrl = `${baseUrl}?${params.toString()}`;
      console.log(`Navigating to: ${fullUrl}`);
      window.location.href = fullUrl;
    } else {
      setMessages([{ text: 'No valid IP address found for this device', category: 'warning' }]);
    }
  } else {
    setMessages([{ text: 'Reservation not found', category: 'warning' }]);
  }
};

  // Show device details

const handleShowDeviceDetails = (device) => {
  // Extract device information consistently
  const deviceDetails = {
    device_id: device.device?.id || device.device_id || 'Unknown',
    device_name: device.device?.name || 'Unknown',
    pc_ip: device.device?.pc_ip,
    rutomatrix_ip: device.device?.rutomatrix_ip,
    pulse1_ip: device.device?.pulse1_ip,
    ct1_ip: device.device?.ct1_ip,
    start_time: device.start_time || device.time?.start,
    end_time: device.end_time || device.time?.end,
    user_name: device.user?.name || device.user_name,
    user_id: device.user?.id || device.user_id,
    status: device.status,
    purpose: device.purpose
  };
  
  setDeviceDetails(deviceDetails);
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

  const handleQuickSelectTime = (field, minutes) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    
    const formattedDate = flatpickr.formatDate(date, "Y-m-d H:i");
    const formattedValue = formattedDate.replace(' ', 'T');
    
    if (field === 'start_time') {
      setStartTime(formattedValue);
      if (startTimePicker) {
        startTimePicker.setDate(date);
      }
    } else if (field === 'end_time') {
      setEndTime(formattedValue);
      if (endTimePicker) {
        endPicker.setDate(date);
      }
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
        // Determine status for sorting
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
  
useEffect(() => {
  const interval = setInterval(() => {
    // Only refresh user reservations if we're NOT in device selection mode
    // or if we're looking at booked devices tab (to keep reservation list updated)
    if (!showDeviceSelection || activeTab === "booked") {
      fetchUserReservations();
    }
    
    // Refresh the appropriate tab content only when device selection is open
    if (showDeviceSelection) {
      if (activeTab === "booked") {
        fetchBookedDevices();
      } else if (activeTab === "available" && startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        fetchAvailableDevices(start, end);
      }
    }
    
    // Always clean up expired reservations
    cleanupExpiredReservations();
  }, 30000);

  return () => clearInterval(interval);
}, [showDeviceSelection, activeTab, startTime, endTime]);


const cleanupExpiredReservations = () => {
  const currentTime = new Date();
  setUserReservations(prevReservations => 
    prevReservations.filter(reservation => new Date(reservation.end_time) >= currentTime)
  );
};

// Then call this function in your polling interval:
useEffect(() => {
  const interval = setInterval(() => {
    // Always refresh user reservations
    fetchUserReservations();
    
    // Also clean up any expired reservations in the local state
    cleanupExpiredReservations();
    
    // Refresh the appropriate tab content
    if (showDeviceSelection) {
      if (activeTab === "booked") {
        fetchBookedDevices();
      } else if (activeTab === "available" && startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        fetchAvailableDevices(start, end);
      }
    }
  }, 30000);

  return () => clearInterval(interval);
}, [showDeviceSelection, activeTab, startTime, endTime]);

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

const filteredBookedDevices = bookedDevices
  ? bookedDevices.filter(device => {
      const deviceId = device.device?.id || device.device_id || '';
      return deviceId.toLowerCase().includes(bookedDeviceFilter.toLowerCase());
    })
  : [];

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">User Device Reservation</h1>
        {currentUser.is_authenticated && (
          <a href="http://localhost:3000/auth" className="btn btn-outline-danger">
            <FaSignOutAlt className="me-2" /> Logout
          </a>
        )}
      </div>

      {messages.length > 0 && (
        <div className="alert-messages">
          {messages.map((message, index) => (
            <div key={index} className={`alert alert-${message.category} alert-dismissible fade show`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessages(messages.filter((_, i) => i !== index))}></button>
            </div>
          ))}
        </div>
      )}
 <div className="card reservation-card mb-4">
        <div className="card-header reservation-header">
          <h5 className="mb-0"><FaCalendarPlus className="me-2" />Create New Reservation</h5>
        </div>
        <div className="card-body">
          <form id="reservationForm" className="reservation-form">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="start_time" className="form-label">Start Time</label>
                <div className="input-icon-group">
                  <FaClock className="input-icon" />
                  <input 
                    ref={startTimeRef}
                    type="text" 
                    className="form-control form-control-lg" 
                    id="start_time" 
                    name="start_time" 
                    placeholder="Select start time" 
                    required
                    value={startTime ? startTime.replace('T', ' ') : ''}
                    readOnly // Make it readOnly so Flatpickr handles the input
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
                  <FaClock className="input-icon" />
                  <input 
                    ref={endTimeRef}
                    type="text" 
                    className="form-control form-control-lg" 
                    id="end_time" 
                    name="end_time" 
                    placeholder="Select end time" 
                    required
                    value={endTime ? endTime.replace('T', ' ') : ''}
                    readOnly // Make it readOnly so Flatpickr handles the input
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
                disabled={loading || !startTime || !endTime}
              >
                {loading ? (
                  <>
                    <FaSpinner className="me-2" />Loading...
                  </>
                ) : (
                  <>
                    <FaCalendarCheck className="me-2" />Book Reservation
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
              onClick={() => {
                setActiveTab('booked');
                if (bookedDevices.length === 0) {
                  fetchBookedDevices();
                }
              }}
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
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="server-rack-container">
                  {loading ? (
                    <div className="loading-message">
                      <FaSpinner className="fa-spin" /> Loading devices...
                    </div>
                  ) : availableDevices.length > 0 ? (
                    <div className="row">
                      {availableDevices
                        .filter(device => 
                          device.device_id.toLowerCase().includes(deviceFilter.toLowerCase())
                        )
                        .map(device => (
                          <div key={device.device_id} className="col-md-4 mb-3">
                            <div 
                              className={`card device-card ${selectedDevice?.device_id === device.device_id ? 'border-primary' : ''} ${
                                device.status === 'booked' ? 'booked-device' : 'available-device'
                              }`}
                              onClick={() => {
                                if (device.status !== 'booked') {
                                  handleDeviceSelection(device);
                                }
                              }}
                              style={{ 
                                cursor: device.status === 'booked' ? 'not-allowed' : 'pointer',
                                opacity: device.status === 'booked' ? 0.7 : 1
                              }}
                            >
                              <div className="card-body">
                                <h5 className="card-title">{device.device_id}</h5>
                                <p className="card-text">
                                  <span className={`badge ${
                                    device.status === 'available' ? 'bg-success' : 
                                    device.status === 'booked' ? 'bg-danger' : 
                                    'bg-secondary'
                                  }`}>
                                    {device.status === 'available' ? 'Available' : 
                                    device.status === 'booked' ? 'Booked' : 'Unknown'}
                                  </span>
                                </p>
                                {device.status === 'booked' && (
                                  <p className="card-text small text-muted">
                                    Already booked for this time slot
                                  </p>
                                )}
                                <button 
                                  className={`btn btn-sm ${
                                    device.status === 'available' ? 'btn-info' : 'btn-secondary'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowDeviceDetails(device);
                                  }}
                                  disabled={device.status === 'booked'}
                                >
                                  <FaInfoCircle className="me-1" /> Details
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <FaCalendarAlt className="fa-2x mb-2" /><br />
                      No devices found
                    </div>
                  )}
                </div>
              </div>
            )}
                                    
            {activeTab === 'booked' && (
              <div id="booked-devices" className="tab-pane active">
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
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                    <div className="col-md-6 d-flex align-items-end">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={fetchBookedDevices}
                        disabled={loading}
                      >
                        {loading ? <FaSpinner className="fa-spin" /> : <FaSearch />}
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>

                <div className="server-rack-container">
                  {loading ? (
                    <div className="text-center py-4">
                      <FaSpinner className="fa-spin fa-2x mb-2" />
                      <p>Loading booked devices...</p>
                    </div>
                  ) : bookedDevices.length > 0 ? (
                    <div className="row">
                      {bookedDevices
                        .filter(device => {
                          const deviceId = device.device_id || device.device?.id || device.id || '';
                          const deviceName = device.device_name || device.device?.name || '';
                          return deviceId.toLowerCase().includes(bookedDeviceFilter.toLowerCase()) ||
                                deviceName.toLowerCase().includes(bookedDeviceFilter.toLowerCase());
                        })
                        .map((device, index) => {
                          // Extract all possible data fields with fallbacks
                          const deviceId = device.device_id || device.device?.id || device.id || `device-${index}`;
                          const deviceName = device.device_name || device.device?.name || deviceId;
                          const startTime = device.start_time || device.reservation_start || device.time?.start;
                          const endTime = device.end_time || device.reservation_end || device.time?.end;
                          const userName = device.user_name || device.user?.name || device.reserved_by || 'Unknown User';
                          const status = device.status || 'booked';
                          const purpose = device.purpose || 'Not specified';

                          return (
                            <div key={`${deviceId}-${index}`} className="col-md-6 col-lg-4 mb-3">
                              <div className="card device-card booked-device h-100">
                                <div className="card-header bg-secondary text-white">
                                  <h6 className="mb-0">{deviceName}</h6>
                                  <small>ID: {deviceId}</small>
                                </div>
                                <div className="card-body">
                                  <div className="mb-2">
                                    <span className={`badge ${
                                      status === 'active' ? 'bg-success' : 
                                      status === 'upcoming' ? 'bg-warning' : 
                                      status === 'completed' ? 'bg-info' : 
                                      'bg-primary'
                                    }`}>
                                      {status.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="card-footer bg-light">
                                  <button 
                                    className="btn btn-sm btn-info w-100"
                                    onClick={() => handleShowDeviceDetails(device)}
                                  >
                                    <FaInfoCircle className="me-1" /> View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <FaCalendarAlt className="fa-3x mb-3" />
                      <h5>No Booked Devices Found</h5>
                      <p className="mb-3">There are currently no active or upcoming reservations.</p>
                      <button 
                        className="btn btn-primary"
                        onClick={fetchBookedDevices}
                      >
                        <FaSearch className="me-2" /> Check Again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
            
            {activeTab === 'available' && (
              <div className="confirm-selection mt-3">
                <button 
                  id="confirmDeviceSelectionBtn" 
                  className="btn btn-reserve" 
                  onClick={handleConfirmDevice}
                  disabled={!selectedDevice || loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="fa-spin me-2" />Processing...  
                    </>
                  ) : (
                    <>
                      <FaCheck className="me-2" />Confirm Device Selection
                    </>
                  )}
                </button>
                {selectedDevice && (
                  <div className="mt-2">
                    <strong>Selected Device:</strong> {selectedDevice.device_id}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

        {showDeviceDetails && deviceDetails && (
          <>
            <div id="deviceDetailsContainer" className="device-details-container">
              <div className="device-details-header">
                <h4 id="deviceDetailsTitle">Device Details - {deviceDetails.device_id}</h4>
                <span className="close-details" onClick={() => setShowDeviceDetails(false)}>&times;</span>
              </div>
              <div className="device-details-content" id="deviceDetailsContent">
                <div className="row">
                  <div className="col-md-6">
                    <h5>Basic Information</h5>
                    <p><strong>Device ID:</strong> {deviceDetails.device_id}</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge ${
                        deviceDetails.status === 'active' ? 'bg-success' : 
                        deviceDetails.status === 'upcoming' ? 'bg-warning' : 
                        'bg-secondary'
                      } ms-2`}>
                        {deviceDetails.status?.charAt(0).toUpperCase() + deviceDetails.status?.slice(1)}
                      </span>
                    </p>
                    
                    {deviceDetails.pc_ip && <p><strong>PC IP:</strong> {deviceDetails.pc_ip}</p>}
                    {deviceDetails.rutomatrix_ip && <p><strong>Rutomatrix IP:</strong> {deviceDetails.rutomatrix_ip}</p>}
                    {deviceDetails.pulse1_ip && <p><strong>Pulse1 IP:</strong> {deviceDetails.pulse1_ip}</p>}
                    {deviceDetails.ct1_ip && <p><strong>CT1 IP:</strong> {deviceDetails.ct1_ip}</p>}
                  </div>
                  
                  <div className="col-md-6">
                    <h5>Reservation Details</h5>
                    {deviceDetails.start_time && (
                      <p><strong>Start Time:</strong> {new Date(deviceDetails.start_time).toLocaleString()}</p>
                    )}
                    {deviceDetails.end_time && (
                      <p><strong>End Time:</strong> {new Date(deviceDetails.end_time).toLocaleString()}</p>
                    )}
                    {deviceDetails.purpose && (
                      <p><strong>Purpose:</strong> {deviceDetails.purpose}</p>
                    )}
                    {deviceDetails.user_id && (
                      <p><strong>Booked_by:</strong> {deviceDetails.user_id}</p>
                    ) }
                  </div>
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
               <h5 className="mb-0"><FaCalendarAlt className="me-2" />Your Reservations</h5>
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
                    <FaSearch />
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {reservationLoading ? (
                <div className="text-center py-4">
                  <FaSpinner className="fa-spin fa-2x" />
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
                            Device <FaSort className="float-end mt-1" />
                          </th>
                          <th 
                            className={`sortable ${sortConfig.key === 'startTime' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} 
                            onClick={() => handleSort('startTime')}
                            data-sort="startTime"
                          >
                            Start <FaSort className="float-end mt-1" />
                          </th>
                          <th 
                            className={`sortable ${sortConfig.key === 'endTime' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} 
                            onClick={() => handleSort('endTime')}
                            data-sort="endTime"
                          >
                            End <FaSort className="float-end mt-1" />
                          </th>
                          <th 
                            className={`sortable ${sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} 
                            onClick={() => handleSort('status')}
                            data-sort="status"
                          >
                            Status <FaSort className="float-end mt-1" />
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
                            
                            if (isExpired) return null;

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
                                      <FaRocket className="me-1" /> Launch
                                    </button>

                                    <button 
                                      type="button" 
                                      className="btn btn-sm btn-danger cancel-btn"
                                      onClick={() => handleCancelReservation(res.id)}
                                      disabled={reservationLoading}
                                    >
                                      {reservationLoading ? (
                                        <FaSpinner className="fa-spin" />
                                      ) : (
                                        <>
                                          <FaBan className="me-1" /> Cancel
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }).filter(Boolean)
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-4 text-muted">
                              <FaCalendarAlt className="fa-2x mb-2" /><br />
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
                          <button
                            type="button"
                            className="page-link"
                            tabIndex={currentPage === 1 ? -1 : 0}
                            disabled={currentPage === 1}
                            onClick={() => {
                              if (currentPage > 1) setCurrentPage(currentPage - 1);
                            }}
                          >
                            Previous
                          </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                            <button
                              type="button"
                              className="page-link"
                              onClick={() => setCurrentPage(page)}
                              aria-current={currentPage === page ? "page" : undefined}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`} id="nextPage">
                          <button
                            type="button"
                            className="page-link"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => {
                              if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                            }}
                          >
                            Next
                          </button>
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