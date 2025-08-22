import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'datatables.net-bs5/css/dataTables.bootstrap5.css';
import 'font-awesome/css/font-awesome.min.css';
import 'flatpickr/dist/flatpickr.min.css';
import './EditDevice.css';

const EditDevice = () => {
  const { deviceId, field } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [newValue, setNewValue] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Map field names to display names
  const fieldDisplayNames = {
    'PC_IP': 'PC IP Address',
    'Rutomatrix_ip': 'Rutomatrix IP Address',
    'Pulse1_Ip': 'Pulse1 IP Address',
    'CT1_ip': 'CT1 IP Address',
    'device_id': 'Device ID'
  };

  useEffect(() => {
    // Fetch device data
    const fetchDevice = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch(`/api/devices/${deviceId}`);
        const data = await response.json();
        setDevice(data);
        setNewValue(data[field] || '');
        setFieldName(fieldDisplayNames[field] || field);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching device:', error);
        setLoading(false);
      }
    };

    fetchDevice();
  }, [deviceId, field]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/devices/${deviceId}/${field}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify({ new_value: newValue })
      });

      if (response.ok) {
        alert('Device updated successfully');
        navigate('/device'); // Redirect to device list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update device');
      }
    } catch (error) {
      console.error('Error updating device:', error);
      alert('Failed to update device');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/device');
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading device details...</p>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          Device not found
        </div>
        <button onClick={handleCancel} className="btn btn-secondary">
          Back to Devices
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="card">
        <div className="card-body">
          <h2 className="h4 mb-4">Edit {fieldName} for Device {device.device_id}</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="new_value" className="form-label">
                New {fieldName}:
              </label>
              <input
                type="text"
                className="form-control"
                id="new_value"
                name="new_value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                required
              />
            </div>
            
            <div className="d-flex gap-2">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Updating...' : 'Update'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditDevice;