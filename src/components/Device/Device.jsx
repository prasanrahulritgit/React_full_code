// Device.jsx
import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'datatables.net-bs5/css/dataTables.bootstrap5.css';
import 'font-awesome/css/font-awesome.min.css';
import 'flatpickr/dist/flatpickr.min.css';
import './Device.css';

const Device = () => {
  const [devices, setDevices] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIpModal, setShowIpModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    device_id: '',
    PC_IP: '',
    Rutomatrix_ip: '',
    Pulse1_Ip: '',
    CT1_ip: ''
  });

  // Fetch devices on component mount
  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      // This would be your API endpoint to fetch devices
      // const response = await axios.get('/api/devices');
      // setDevices(response.data);
      
      // For demo purposes, using mock data
      const mockDevices = [
        { device_id: 'DEV001', PC_IP: '192.168.1.10', Rutomatrix_ip: '192.168.1.11', Pulse1_Ip: '192.168.1.12', CT1_ip: '192.168.1.13' },
        { device_id: 'DEV002', PC_IP: '192.168.1.20', Rutomatrix_ip: '192.168.1.21', Pulse1_Ip: '192.168.1.22', CT1_ip: '192.168.1.23' },
        { device_id: 'DEV003', PC_IP: '192.168.1.30', Rutomatrix_ip: '192.168.1.31', Pulse1_Ip: '192.168.1.32', CT1_ip: '192.168.1.33' },
      ];
      setDevices(mockDevices);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter(device => 
    device.device_id.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleFilter = e => {
    setFilterText(e.target.value);
  };

  const handleViewIps = device => {
    setSelectedDevice(device);
    setShowIpModal(true);
  };

  const handleEditDevice = device => {
    setSelectedDevice(device);
    setFormData({
      device_id: device.device_id,
      PC_IP: device.PC_IP || '',
      Rutomatrix_ip: device.Rutomatrix_ip || '',
      Pulse1_Ip: device.Pulse1_Ip || '',
      CT1_ip: device.CT1_ip || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteDevice = device => {
    if (window.confirm(`Are you sure you want to delete device ${device.device_id}?`)) {
      // API call to delete device would go here
      setDevices(devices.filter(d => d.device_id !== device.device_id));
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddDevice = async e => {
    e.preventDefault();
    // API call to add device would go here
    setDevices([...devices, formData]);
    setShowAddModal(false);
    setFormData({
      device_id: '',
      PC_IP: '',
      Rutomatrix_ip: '',
      Pulse1_Ip: '',
      CT1_ip: ''
    });
  };

  const handleUpdateDevice = async e => {
    e.preventDefault();
    // API call to update device would go here
    setDevices(devices.map(device => 
      device.device_id === selectedDevice.device_id ? { ...device, ...formData } : device
    ));
    setShowEditModal(false);
  };

  const columns = [
    {
      name: 'Device ID',
      selector: row => row.device_id,
      sortable: true,
    },
    {
      name: 'PC IP',
      selector: row => row.PC_IP || '-',
      sortable: true,
    },
    {
      name: 'Rutomatrix IP',
      selector: row => row.Rutomatrix_ip || '-',
      sortable: true,
    },
    {
      name: 'Pulse1 IP',
      selector: row => row.Pulse1_Ip || '-',
      sortable: true,
    },
    {
      name: 'CT1 IP',
      selector: row => row.CT1_ip || '-',
      sortable: true,
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="action-buttons">
          <button 
            className="btn btn-sm view-ip orange-btn"
            onClick={() => handleViewIps(row)}
          >
            View IPs
          </button>
          <button 
            className="btn btn-sm edit-device blue-btn"
            onClick={() => handleEditDevice(row)}
          >
            Edit
          </button>
          <button 
            className="btn btn-sm delete-device orange-btn"
            onClick={() => handleDeleteDevice(row)}
          >
            Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '200px',
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
        <h1 className="h3 mb-0">Device Management</h1>
        <div>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddModal(true)}
          >
            + Add New Device
          </button>
        </div>
      </div>

      <div className="filter-container">
        <form className="row g-3">
          <div className="col-md-4">
            <label htmlFor="deviceIdFilter" className="form-label">Device ID</label>
            <input 
              type="text" 
              className="form-control" 
              id="deviceIdFilter" 
              placeholder="Filter by device ID"
              value={filterText}
              onChange={handleFilter}
            />
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <DataTable
              columns={columns}
              data={filteredDevices}
              customStyles={customStyles}
              pagination
              paginationPerPage={25}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              progressPending={loading}
            />
          </div>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Device</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddDevice}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label htmlFor="device_id" className="form-label">Device ID</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="device_id" 
                        name="device_id" 
                        value={formData.device_id}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="PC_IP" className="form-label">PC IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="PC_IP" 
                        name="PC_IP" 
                        value={formData.PC_IP}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="Rutomatrix_ip" className="form-label">Rutomatrix IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="Rutomatrix_ip" 
                        name="Rutomatrix_ip" 
                        value={formData.Rutomatrix_ip}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="Pulse1_Ip" className="form-label">Pulse1 IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="Pulse1_Ip" 
                        name="Pulse1_Ip" 
                        value={formData.Pulse1_Ip}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="CT1_ip" className="form-label">CT1 IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="CT1_ip" 
                        name="CT1_ip" 
                        value={formData.CT1_ip}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add Device</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      {showEditModal && selectedDevice && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Device</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <form onSubmit={handleUpdateDevice}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label htmlFor="edit_device_id" className="form-label">Device ID</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="edit_device_id"
                        name="device_id" 
                        value={formData.device_id}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="edit_PC_IP" className="form-label">PC IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="edit_PC_IP"
                        name="PC_IP" 
                        value={formData.PC_IP}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="edit_Rutomatrix_ip" className="form-label">Rutomatrix IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="edit_Rutomatrix_ip"
                        name="Rutomatrix_ip" 
                        value={formData.Rutomatrix_ip}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="edit_Pulse1_Ip" className="form-label">Pulse1 IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="edit_Pulse1_Ip"
                        name="Pulse1_Ip" 
                        value={formData.Pulse1_Ip}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="edit_CT1_ip" className="form-label">CT1 IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="edit_CT1_ip"
                        name="CT1_ip" 
                        value={formData.CT1_ip}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* IP Access Modal */}
      {showIpModal && selectedDevice && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">IP Addresses for <span>{selectedDevice.device_id}</span></h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowIpModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="list-group">
                  <div className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>PC IP</strong>
                      <span className="ip-display">{selectedDevice.PC_IP || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>Rutomatrix IP</strong>
                      <span className="ip-display">{selectedDevice.Rutomatrix_ip || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>Pulse1 IP</strong>
                      <span className="ip-display">{selectedDevice.Pulse1_Ip || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>CT1 IP</strong>
                      <span className="ip-display">{selectedDevice.CT1_ip || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowIpModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal backdrop */}
      {(showAddModal || showEditModal || showIpModal) && (
        <div className="modal-backdrop show"></div>
      )}
    </div>
  );
};

export default Device;