import React, { useState, useEffect } from 'react';
import './UserReservation.css';

const UserReservation = () => {
  const [currentUser, setCurrentUser] = useState({ is_authenticated: true });
  const [messages, setMessages] = useState([]);
  const [userReservations, setUserReservations] = useState([]);
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

  useEffect(() => {

    document.title = "Device Reservation";

    const mockReservations = [
      {
        id: 1,
        device_id: "DEV001",
        start_time: new Date(Date.now() + 2*60*60*1000), // 2 hours from now
        end_time: new Date(Date.now() + 4*60*60*1000),  // 4 hours from now
      },
      {
        id: 2,
        device_id: "DEV002",
        start_time: new Date(Date.now() - 1*60*60*1000), // 1 hour ago
        end_time: new Date(Date.now() + 1*60*60*1000),   // 1 hour from now
      }
    ];
    
    setUserReservations(mockReservations);
    setCsrfToken('mock-csrf-token'); // In a real app, this would come from your backend
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleQuickSelectTime = (field, minutes) => {
    console.log(`Quick select ${minutes} minutes for ${field}`);
  };

  const handleBookReservation = () => {
    setShowDeviceSelection(true);
  };

  const handleDeviceSelection = (device) => {
    setSelectedDevice(device);
  };

  const handleConfirmDevice = () => {
    setShowDeviceSelection(false);
    setSelectedDevice(null);
  };

  const handleCancelReservation = (reservationId) => {
    console.log(`Cancel reservation ${reservationId}`);
  };

  const handleLaunchDevice = (deviceId, reservationId) => {
    // Launch device logic would go here
    console.log(`Launch device ${deviceId} for reservation ${reservationId}`);
  };

  const handleShowDeviceDetails = (device) => {
    setDeviceDetails(device);
    setShowDeviceDetails(true);
  };

  // Calculate pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = userReservations.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(userReservations.length / entriesPerPage);

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
          {messages.map((message, index) => (
            <div key={index} className={`alert alert-${message.category} alert-dismissible fade show`} role="alert">
              {message.text}
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
          ))}
        </div>
      )}

      <div className="card reservation-card mb-4">
        <div className="reservation-header">
          <h5 className="mb-0"><i className="fas fa-calendar-plus me-2"></i>Create New Reservation</h5>
        </div>
        <div className="card-body">
          <form id="reservationForm" className="reservation-form">
            <input type="hidden" name="csrf_token" value={csrfToken} />
            
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="start_time" className="form-label">Start Time</label>
                <div className="input-icon-group">
                  <i className="fas fa-clock input-icon"></i>
                  <input 
                    type="text" 
                    className="form-control form-control-lg flatpickr-input" 
                    id="start_time" 
                    name="start_time" 
                    placeholder="Select start time" 
                    required
                    data-min-date={now.toISOString().slice(0, 16).replace('T', ' ')}
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
                    type="text" 
                    className="form-control form-control-lg flatpickr-input" 
                    id="end_time" 
                    name="end_time" 
                    placeholder="Select end time" 
                    required
                    data-min-date={now.toISOString().slice(0, 16).replace('T', ' ')}
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
              <button type="button" id="bookReservationBtn" className="btn btn-reserve" onClick={handleBookReservation}>
                <i className="fas fa-calendar-check me-2"></i>Book Reservation
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
                    <div className="loading-message">
                      <i className="fas fa-spinner fa-spin"></i> Loading devices...
                    </div>
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
                    <div className="booked-devices-cards" id="bookedDevicesCards">
                      <div className="loading-message">
                        <i className="fas fa-spinner fa-spin"></i> Loading booked devices...
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="confirm-selection">
              <button id="confirmDeviceSelectionBtn" className="btn btn-reserve" onClick={handleConfirmDevice}>
                <i className="fas fa-check me-2"></i>Confirm Device Selection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11 }}>
        <div id="cancelToast" className="toast" role="alert" aria-live="assertive" aria-atomic="true">
          <div className="toast-header bg-success text-white">
            <strong className="me-auto">Success</strong>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div className="toast-body" id="toastMessage"></div>
        </div>
      </div>

      {showDeviceDetails && (
        <>
          <div id="deviceDetailsContainer" className="device-details-container">
            <div className="device-details-header">
              <h4 id="deviceDetailsTitle">Device Details</h4>
              <span className="close-details" onClick={() => setShowDeviceDetails(false)}>&times;</span>
            </div>
            <div className="device-details-content" id="deviceDetailsContent">
              {/* Device details would be populated here */}
            </div>
          </div>
          <div id="detailsOverlay" className="details-overlay" onClick={() => setShowDeviceDetails(false)}></div>
        </>
      )}

      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: '#1e1e1e', color: '#1281d6' }}>
              <h5 className="mb-0"><i className="fas fa-calendar-alt me-2"></i>Your Reservations</h5>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <select 
                    id="entriesPerPage" 
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

                                <form className="m-0 cancel-form" data-reservation-id={res.id}>
                                  <input type="hidden" name="csrf_token" value={csrfToken} />
                                  <button 
                                    type="button" 
                                    className="btn btn-danger cancel-btn"
                                    onClick={() => handleCancelReservation(res.id)}
                                  >
                                    <i className="bi bi-x-circle"></i> Cancel
                                  </button>
                                </form>
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
                    {Math.min(indexOfLastEntry, userReservations.length)}
                  </span> of <span id="totalEntries">{userReservations.length}</span> entries
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
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`} id="nextPage">
                      <button
                        type="button"
                        className="page-link"
                        disabled={currentPage === totalPages}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserReservation;