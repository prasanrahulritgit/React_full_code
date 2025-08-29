// Device.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import "./Device.css";

const Device = () => {
  const [devices, setDevices] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIpModal, setShowIpModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    device_id: "",
    pc_ip: "",
    rutomatrix_ip: "",
    pulse1_ip: "",
    ct1_ip: "",
  });

  // Fetch devices on component mount
  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/devices");

      if (response.data.success) {
        // The backend returns lowercase field names, so we need to map them
        const devicesWithCorrectFields = response.data.devices.map(
          (device) => ({
            device_id: device.device_id,
            pc_ip: device.pc_ip,
            rutomatrix_ip: device.rutomatrix_ip,
            pulse1_ip: device.pulse1_ip,
            ct1_ip: device.ct1_ip,
            status: device.status,
          })
        );
        setDevices(devicesWithCorrectFields);
      } else {
        console.error("Failed to fetch devices:", response.data.message);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching devices:", error);
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter((device) =>
    device.device_id.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleFilter = (e) => {
    setFilterText(e.target.value);
  };

  // Prevent form submission on Enter key in filter
  const handleFilterKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleViewIps = (device) => {
    setSelectedDevice(device);
    setShowIpModal(true);
  };

  const handleEditDevice = (device) => {
    setSelectedDevice(device);
    setFormData({
      device_id: device.device_id,
      pc_ip: device.pc_ip || "",
      rutomatrix_ip: device.rutomatrix_ip || "",
      pulse1_ip: device.pulse1_ip || "",
      ct1_ip: device.ct1_ip || "",
    });
    setShowEditModal(true);
  };

  const handleDeleteDevice = async (device) => {
    if (
      window.confirm(
        `Are you sure you want to delete device ${device.device_id}?`
      )
    ) {
      try {
        const response = await axios.delete(`/delete/${device.device_id}`);
        if (response.data.status === "success") {
          setDevices(devices.filter((d) => d.device_id !== device.device_id));
          alert("Device deleted successfully");
        } else {
          console.error("Failed to delete device:", response.data.message);
          alert("Failed to delete device: " + response.data.message);
        }
      } catch (error) {
        console.error("Error deleting device:", error);
        if (error.response?.status === 403) {
          alert("Unauthorized: You need admin privileges to delete devices");
        } else {
          alert(
            "Error deleting device: " +
              (error.response?.data?.message || error.message)
          );
        }
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
      // Map frontend field names to backend field names
      const formDataToSend = new FormData();
      formDataToSend.append("device_id", formData.device_id);
      formDataToSend.append("PC_IP", formData.pc_ip);
      formDataToSend.append("Rutomatrix_ip", formData.rutomatrix_ip);
      formDataToSend.append("Pulse1_Ip", formData.pulse1_ip);
      formDataToSend.append("CT1_ip", formData.ct1_ip);

      const response = await axios.post("/api/devices/add", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        fetchDevices();
        setShowAddModal(false);
        setFormData({
          device_id: "",
          pc_ip: "",
          rutomatrix_ip: "",
          pulse1_ip: "",
          ct1_ip: "",
        });
        alert("Device added successfully");
      } else {
        console.error("Failed to add device:", response.data.message);
        alert("Failed to add device: " + response.data.message);
      }
    } catch (error) {
      console.error("Error adding device:", error);
      if (error.response?.status === 403) {
        alert("Unauthorized: You need admin privileges to add devices");
      } else {
        alert(
          "Error adding device: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const handleUpdateDevice = async (e) => {
    e.preventDefault();
    try {
      // Map frontend field names to backend field names
      const formDataToSend = new FormData();
      formDataToSend.append("device_id", formData.device_id);
      formDataToSend.append("PC_IP", formData.pc_ip);
      formDataToSend.append("Rutomatrix_ip", formData.rutomatrix_ip);
      formDataToSend.append("Pulse1_Ip", formData.pulse1_ip);
      formDataToSend.append("CT1_ip", formData.ct1_ip);

      const response = await axios.post(
        `/edit/${selectedDevice.device_id}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.status === "success") {
        fetchDevices();
        setShowEditModal(false);
        alert("Device updated successfully");
      } else {
        console.error("Failed to update device:", response.data.message);
        alert("Failed to update device: " + response.data.message);
      }
    } catch (error) {
      console.error("Error updating device:", error);
      if (error.response?.status === 403) {
        alert("Unauthorized: You need admin privileges to edit devices");
      } else {
        alert(
          "Error updating device: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const columns = [
    {
      name: "Device ID",
      selector: (row) => row.device_id,
      sortable: true,
    },
    {
      name: "PC IP",
      selector: (row) => row.pc_ip || "-",
      sortable: true,
    },
    {
      name: "Rutomatrix IP",
      selector: (row) => row.rutomatrix_ip || "-",
      sortable: true,
    },
    {
      name: "Pulse1 IP",
      selector: (row) => row.pulse1_ip || "-",
      sortable: true,
    },
    {
      name: "CT1 IP",
      selector: (row) => row.ct1_ip || "-",
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="action-buttons">
          <button
            className="D-btn Devicebtn view-ip Action-btn"
            onClick={() => handleViewIps(row)}
          >
            View IPs
          </button>
          <button
            className="D-btn Devicebtn edit-device Edit-btn"
            onClick={() => handleEditDevice(row)}
          >
            Edit
          </button>
          <button 
            className="D-btn Devicebtn delete-device delete-device-btn"
            onClick={() => handleDeleteDevice(row)}
          >
            Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
      width: "300px",
    },
  ];

  const customStyles = {
    rows: {
      style: {
        minHeight: "60px",
        backgroundColor: "#2b2b2b",
        color: "white",
      },
    },
    headCells: {
      style: {
        backgroundColor: "#ff6a00",
        color: "#000",
        fontWeight: "bold",
      },
    },
    cells: {
      style: {
        borderRight: "1px solid #333",
        borderBottom: "1px solid #333",
      },
    },
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Device Management</h1>
        <div>
          <button
            className="D-btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            + Add New Device
          </button>
        </div>
      </div>
      {/* REMOVED THE FORM WRAPPER AROUND FILTER - This was causing the refresh */}
      <div className="filter-container">
        <div className="Device-row g-3">
          <div className="col-md-4">
            <label htmlFor="deviceIdFilter" className="form-label-device-device">Device ID</label>
            <input 
              type="text" 
              className="form-control" 
              id="deviceIdFilter" 
              placeholder="Filter by device ID"
              value={filterText}
              onChange={handleFilter}
              onKeyDown={handleFilterKeyDown} // Prevent Enter key submission
            />
          </div>
        </div>
      </div>

      <div className="Device-details">
        <div className="Device-card-body">
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
                  <div className="Device-row">
                    <div className="col-md-12 mb-3">
                      <label htmlFor="device_id" className="form-label-device">Device ID</label>
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
                  <div className="Device-row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="pc_ip" className="form-label-device">PC IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="pc_ip" 
                        name="pc_ip" 
                        value={formData.pc_ip}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="rutomatrix_ip" className="form-label-device">Rutomatrix IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="rutomatrix_ip" 
                        name="rutomatrix_ip" 
                        value={formData.rutomatrix_ip}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="Device-row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="pulse1_ip" className="form-label-device">Pulse1 IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="pulse1_ip" 
                        name="pulse1_ip" 
                        value={formData.pulse1_ip}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="ct1_ip" className="form-label-device">CT1 IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="ct1_ip" 
                        name="ct1_ip" 
                        value={formData.ct1_ip}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="D-btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="D-btn btn-primary">
                    Add Device
                  </button>
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
                  <div className="Device-row">
                    <div className="col-md-12 mb-3">
                      <label htmlFor="edit_device_id" className="form-label-device">Device ID</label>
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
                  <div className="Device-row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="edit_pc_ip" className="form-label-device">PC IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="edit_pc_ip"
                        name="pc_ip"
                        value={formData.pc_ip}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="edit_rutomatrix_ip" className="form-label-device">Rutomatrix IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="edit_rutomatrix_ip"
                        name="rutomatrix_ip"
                        value={formData.rutomatrix_ip}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="Device-row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="edit_pulse1_ip" className="form-label-device">Pulse1 IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="edit_pulse1_ip"
                        name="pulse1_ip"
                        value={formData.pulse1_ip}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="edit_ct1_ip" className="form-label-device">CT1 IP Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="edit_ct1_ip"
                        name="ct1_ip"
                        value={formData.ct1_ip}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="D-btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="D-btn btn-primary">
                    Save Changes
                  </button>
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
                <h5 className="modal-title">
                  IP Addresses for <span>{selectedDevice.device_id}</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowIpModal(false)}
                ></button>
              </div>
              <div className="modal-body-device">
                <div className="list-group">
                  <div className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>PC IP</strong>
                      <span className="ip-display">
                        {selectedDevice.pc_ip || "Not set"}
                      </span>
                    </div>
                  </div>
                  <div className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>Rutomatrix IP</strong>
                      <span className="ip-display">
                        {selectedDevice.rutomatrix_ip || "Not set"}
                      </span>
                    </div>
                  </div>
                  <div className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>Pulse1 IP</strong>
                      <span className="ip-display">
                        {selectedDevice.pulse1_ip || "Not set"}
                      </span>
                    </div>
                  </div>
                  <div className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>CT1 IP</strong>
                      <span className="ip-display">
                        {selectedDevice.ct1_ip || "Not set"}
                      </span>
                    </div>
                  </div>
                  <div className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>Status</strong>
                      <span
                        className={`status-display ${selectedDevice.status}`}
                      >
                        {selectedDevice.status || "unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="D-btn btn-secondary"
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
