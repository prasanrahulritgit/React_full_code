import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "datatables.net-bs5/css/dataTables.bootstrap5.css";
import "font-awesome/css/font-awesome.min.css";
import "flatpickr/dist/flatpickr.min.css";
import "./AdminReservation.css";
import "@fortawesome/fontawesome-free";
import flatpickr from "flatpickr";
import {
  FaCalendarPlus,
  FaClock,
  FaCalendarCheck,
  FaCalendarAlt,
  FaSearch,
  FaSort,
  FaRocket,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaBan,
  FaServer,
} from "react-icons/fa";

const AdminReservation = () => {
  const [messages, setMessages] = useState([]);
  const [userReservations, setUserReservations] = useState([]);
  const [now, setNow] = useState(new Date());
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceSelection, setShowDeviceSelection] = useState(false);
  const [activeTab, setActiveTab] = useState("available");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [bookedDeviceFilter, setBookedDeviceFilter] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  const [deviceDetails, setDeviceDetails] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [bookedDevices, setBookedDevices] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const [startTimePicker, setStartTimePicker] = useState(null);
  const [endTimePicker, setEndTimePicker] = useState(null);
  const [cancellingDeviceId, setCancellingDeviceId] = useState(null);
  const itemsPerPage = 10;
  const [current_Page, setCurrent_Page] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);

  // API base URL
  const API_BASE = "http://localhost:5000"; // Update with your Flask server URL

  useEffect(() => {
    if (startTimeRef.current && endTimeRef.current) {
      // Start Time Picker
      const startPicker = flatpickr(startTimeRef.current, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today",
        time_24hr: true,
        minuteIncrement: 30,
        onChange: function (selectedDates, dateStr) {
          setStartTime(dateStr.replace(" ", "T"));
        },
      });

      // End Time Picker
      const endPicker = flatpickr(endTimeRef.current, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today",
        time_24hr: true,
        minuteIncrement: 30,
        onChange: function (selectedDates, dateStr) {
          setEndTime(dateStr.replace(" ", "T"));
        },
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
    fetchCurrentUser(); 
    fetchUserReservations();

    // Update current time every minute
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch user reservations - only for the current user
  const fetchUserReservations = async () => {
    try {
      setReservationLoading(true);
      const response = await fetch(`${API_BASE}/api/user-reservations`, {
        credentials: "include", // Include cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Transform the data to match your frontend structure
          const transformedReservations = data.reservations.map((res) => ({
            id: res.reservation_id,
            device_id: res.device_id,
            device_name: res.device_name,
            start_time: new Date(res.start_time),
            end_time: new Date(res.end_time),
            status: res.status,
            device_ips: res.device_ips,
            user_name: res.user_name,
            user_id: res.user_id, // Add user_id to check ownership
            user_ip: res.user_ip,
            is_active: res.is_active,
            can_manage: res.can_manage,
          }));

          // Filter out expired reservations
          const currentTime = new Date();
          const activeReservations = transformedReservations.filter(
            (reservation) => new Date(reservation.end_time) >= currentTime
          );

          setUserReservations(activeReservations);
        } else {
          setMessages([{ text: data.message, category: "danger" }]);
        }
      } else {
        setMessages([
          { text: "Failed to fetch reservations", category: "danger" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching user reservations:", error);
      setMessages([
        {
          text: "Network error while fetching reservations",
          category: "danger",
        },
      ]);
    } finally {
      setReservationLoading(false);
    }
  };

// Fetch current user info
const fetchCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/current-user`, {
      credentials: "include",
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setCurrentUser({
          is_authenticated: true,
          id: data.user.id,
          name: data.user.name,
          role: data.user.role || 'user'
        });
      }
    } else {
      // If we can't get user info, set a default
      setCurrentUser({
        is_authenticated: true,
        id: null,
        name: 'Current User',
        role: 'user'
      });
    }
  } catch (error) {
    console.error("Error fetching current user:", error);
    // Set default user info on error
    setCurrentUser({
      is_authenticated: true,
      id: null,
      name: 'Current User',
      role: 'user'
    });
  }
};

  // Fetch available devices based on selected time range
  const fetchAvailableDevices = async (start, end) => {
    try {
      setLoading(true);

      // Format dates consistently for backend
      const formatForBackend = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${year}-${month}-${day} ${hours}:${minutes}`;
      };

      const startFormatted = formatForBackend(start);
      const endFormatted = formatForBackend(end);

      console.log("Sending to backend:", {
        start: startFormatted,
        end: endFormatted,
      });

      const response = await fetch(
        `${API_BASE}/api/devices/availability?start_time=${encodeURIComponent(
          startFormatted
        )}&end_time=${encodeURIComponent(endFormatted)}`,
        {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableDevices(data.devices || []);
          console.log("Received devices:", data.devices);
        } else {
          setMessages([{ text: data.message, category: "danger" }]);
          console.error("Backend success false:", data.message);
        }
      } else {
        try {
          const errorData = await response.json();
          setMessages([
            {
              text: errorData.message || `Server error: ${response.status}`,
              category: "danger",
            },
          ]);
          console.error("Backend error response:", errorData);
        } catch (jsonError) {
          const errorText = await response.text();
          setMessages([
            {
              text: `Server error: ${response.status} - ${errorText}`,
              category: "danger",
            },
          ]);
          console.error("Backend text response:", errorText);
        }
      }
    } catch (error) {
      console.error("Network error fetching available devices:", error);
      setMessages([
        { text: `Network error: ${error.message}`, category: "danger" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filter devices first
  const filteredDevices = availableDevices.filter((device) =>
    device.device_id.toLowerCase().includes(deviceFilter.toLowerCase())
  );

  // Pagination logic
  const indexOfLastDevice = current_Page * itemsPerPage;
  const indexOfFirstDevice = indexOfLastDevice - itemsPerPage;
  const current_Devices = filteredDevices.slice(
    indexOfFirstDevice,
    indexOfLastDevice
  );

  // Total pages
  const totalDevicePages = Math.ceil(filteredDevices.length / itemsPerPage);

  const fetchBookedDevices = async () => {
    try {
      setLoading(true);
      console.log("Fetching booked devices...");

      const response = await fetch(`${API_BASE}/api/booked-devices`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Booked devices response:", data);

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
          // Calculate statuses based on current time
          const devicesWithStatus = updateDeviceStatuses(devices);
          console.log(
            "Processed booked devices with status:",
            devicesWithStatus
          );
          setBookedDevices(devicesWithStatus);
        } else {
          setMessages([
            {
              text: data.message || "Failed to fetch booked devices",
              category: "danger",
            },
          ]);
        }
      } else {
        setMessages([
          { text: `Server error: ${response.status}`, category: "danger" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching booked devices:", error);
      setMessages([
        {
          text: "Network error while fetching booked devices",
          category: "danger",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle device selection modal opening
  const handleBookReservation = () => {
    if (!startTime || !endTime) {
      setMessages([
        { text: "Please select both start and end times", category: "warning" },
      ]);
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      setMessages([
        { text: "End time must be after start time", category: "warning" },
      ]);
      return;
    }

    if (start < new Date()) {
      setMessages([
        { text: "Start time cannot be in the past", category: "warning" },
      ]);
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
      setMessages([{ text: "Please select a device", category: "warning" }]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          device_id: selectedDevice.device_id,
          start_time: startTime,
          end_time: endTime,
        }),
      });

      if (response.status === 401) {
        setMessages([
          { text: "Session expired. Please login again", category: "warning" },
        ]);
        window.location.href = "/api/login";
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages([
            { text: "Reservation created successfully", category: "success" },
          ]);
          fetchUserReservations();
        } else {
          setMessages([{ text: data.message, category: "danger" }]);
        }
      } else {
        setMessages([
          { text: "Failed to create reservation", category: "danger" },
        ]);
      }
    } catch (error) {
      console.error("Error creating reservation:", error);
      setMessages([
        {
          text: "Network error while creating reservation",
          category: "danger",
        },
      ]);
    } finally {
      setLoading(false);
      setShowDeviceSelection(false);
      setSelectedDevice(null);
    }
  };

  // Cancel a reservation
  const handleCancelReservation = async (deviceId, reservationId) => {
    // Handle case where only reservationId is passed (from reservations table)
    if (reservationId === undefined && typeof deviceId === "string") {
      reservationId = deviceId;
      deviceId = null; // deviceId might not be available from reservations table
    }

    if (!window.confirm("Are you sure you want to cancel this reservation?")) {
      return;
    }

    try {
      if (deviceId) {
        setCancellingDeviceId(deviceId); // Set the device ID that's being cancelled (for booked devices)
      }
      setReservationLoading(true);

      const response = await fetch(
        `${API_BASE}/reservation/cancel/${reservationId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages([
            { text: "Reservation cancelled successfully", category: "success" },
          ]);

          // Refresh both reservations and booked devices
          fetchUserReservations();

          // If we have a deviceId, remove it from booked devices
          if (deviceId) {
            setBookedDevices((prevDevices) =>
              prevDevices.filter((device) => {
                const id = device.device_id || device.device?.id || device.id;
                return id !== deviceId;
              })
            );
          } else {
            // If no deviceId, refetch booked devices to ensure consistency
            fetchBookedDevices();
          }

          // Refresh available devices if we're in the device selection modal
          if (showDeviceSelection && startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            fetchAvailableDevices(start, end);
          }
        } else {
          setMessages([{ text: data.message, category: "danger" }]);
        }
      } else {
        // Try to get more detailed error information
        let errorMessage = "Failed to cancel reservation";
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If we can't parse JSON, use the status text
          errorMessage = `${response.status} ${response.statusText}`;
        }

        setMessages([{ text: errorMessage, category: "danger" }]);
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      setMessages([
        {
          text: `Network error: ${error.message}`,
          category: "danger",
        },
      ]);
    } finally {
      setReservationLoading(false);
      setCancellingDeviceId(null);
    }
  };

  // Launch device - redirect to dashboard
  const handleLaunchDevice = (deviceId, reservationId) => {
    // Find the reservation to get the device details
    const reservation = userReservations.find((r) => r.id === reservationId);

    if (reservation) {
      // Determine which IP type to use (prioritize PC_IP if available)
      let ipType = "";
      if (reservation.device_ips && reservation.device_ips.pc_ip) {
        ipType = "pc_ip";
      } else if (
        reservation.device_ips &&
        reservation.device_ips.rutomatrix_ip
      ) {
        ipType = "rutomatrix_ip";
      } else if (reservation.device_ips && reservation.device_ips.pulse1_ip) {
        ipType = "pulse1_ip";
      } else if (reservation.device_ips && reservation.device_ips.ct1_ip) {
        ipType = "ct1_ip";
      }

      // If we found an IP type, navigate to dashboard
      if (ipType) {
        const baseUrl = "http://localhost:3000/dashboard";
        const params = new URLSearchParams({
          device: deviceId,
          ip_type: ipType,
          reservation: reservationId,
        });

        const fullUrl = `${baseUrl}?${params.toString()}`;
        console.log(`Navigating to: ${fullUrl}`);
        window.location.href = fullUrl;
      } else {
        setMessages([
          {
            text: "No valid IP address found for this device",
            category: "warning",
          },
        ]);
      }
    } else {
      setMessages([{ text: "Reservation not found", category: "warning" }]);
    }
  };

  const handleQuickSelectTime = (field, minutes) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);

    const formattedDate = flatpickr.formatDate(date, "Y-m-d H:i");
    const formattedValue = formattedDate.replace(" ", "T");

    if (field === "start_time") {
      setStartTime(formattedValue);
      if (startTimePicker) {
        startTimePicker.setDate(date);
      }
    } else if (field === "end_time") {
      setEndTime(formattedValue);
      if (endTimePicker) {
        endTimePicker.setDate(date);
      }
    }
  };

  // Sort function
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
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
      case "device":
        aValue = a.device_id;
        bValue = b.device_id;
        break;
      case "startTime":
        aValue = a.start_time;
        bValue = b.start_time;
        break;
      case "endTime":
        aValue = a.end_time;
        bValue = b.end_time;
        break;
      case "status":
        // Determine status for sorting
        const isExpiredA = a.end_time < now;
        const isActiveA = a.start_time <= now && now <= a.end_time;
        aValue = isExpiredA ? "expired" : isActiveA ? "active" : "upcoming";

        const isExpiredB = b.end_time < now;
        const isActiveB = b.start_time <= now && now <= b.end_time;
        bValue = isExpiredB ? "expired" : isActiveB ? "active" : "upcoming";
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
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

  // Auto-refresh devices when time range changes and modal is open
  useEffect(() => {
    if (showDeviceSelection && startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      // Only refresh if we have valid dates
      if (
        start instanceof Date &&
        !isNaN(start) &&
        end instanceof Date &&
        !isNaN(end)
      ) {
        fetchAvailableDevices(start, end);
        fetchBookedDevices();
      }
    }
  }, [startTime, endTime, showDeviceSelection]);

  const cleanupExpiredReservations = () => {
    const currentTime = new Date();
    setUserReservations((prevReservations) =>
      prevReservations.filter(
        (reservation) => new Date(reservation.end_time) >= currentTime
      )
    );
  };

  // Set up interval to update statuses every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setBookedDevices((prevDevices) => updateDeviceStatuses(prevDevices));
      setUserReservations((prevReservations) =>
        updateDeviceStatuses(prevReservations)
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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


  // Filter reservations based on search term - show all for admin, only user's for regular users
  const filteredReservations = sortedReservations.filter((reservation) => {
    // Admin users see all reservations, regular users only see their own
    let belongsToCurrentUser = true;
    
    if (currentUser && currentUser.role !== 'admin') {
      // For non-admin users, filter to only show their reservations
      belongsToCurrentUser = reservation.user_id == currentUser.id;
      
      // If that doesn't work, check by user name (fallback)
      if (!belongsToCurrentUser && reservation.user_name && currentUser.name) {
        belongsToCurrentUser = reservation.user_name === currentUser.name;
      }
    }
    // For admin users, belongsToCurrentUser remains true (show all reservations)
    
    const matchesSearch = 
      reservation.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.start_time.toLocaleString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.end_time.toLocaleString().toLowerCase().includes(searchTerm.toLowerCase());
    
    return belongsToCurrentUser && matchesSearch;
  });


  const currentEntries = filteredReservations.slice(
    indexOfFirstEntry,
    indexOfLastEntry
  );
  const totalPages = Math.ceil(filteredReservations.length / entriesPerPage);

  // Function to calculate device status based on current time
  const calculateDeviceStatus = (device) => {
    const now = new Date();
    const startTime = new Date(
      device.start_time || device.reservation_start || device.time?.start
    );
    const endTime = new Date(
      device.end_time || device.reservation_end || device.time?.end
    );

    if (now < startTime) {
      return "upcoming";
    } else if (now >= startTime && now <= endTime) {
      return "active";
    } else {
      return "completed";
    }
  };

  // Function to update all device statuses
  const updateDeviceStatuses = (devices) => {
    return devices.map((device) => ({
      ...device,
      status: calculateDeviceStatus(device),
    }));
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Admin Device Reservation</h1>
      </div>

      {messages.length > 0 && (
        <div className="alert-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`alert alert-${message.category} alert-dismissible fade show`}
              role="alert"
            >
              {message.text}
              <button
                type="button"
                className="btn-close"
                onClick={() =>
                  setMessages(messages.filter((_, i) => i !== index))
                }
              ></button>
            </div>
          ))}
        </div>
      )}
      <div className="card reservation-card mb-4">
        <div className="card-header reservation-header">
          <h5 className="mb-0">
            <FaCalendarPlus className="me-2" />
            Create New Reservation
          </h5>
        </div>
        <div className="card-body">
          <form id="reservationForm" className="reservation-form">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="start_time" className="form-label">
                  Start Time
                </label>
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
                    value={startTime ? startTime.replace("T", " ") : ""}
                    readOnly // Make it readOnly so Flatpickr handles the input
                  />
                </div>
                <div className="quick-select-buttons mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary quick-select-btn"
                    onClick={() => handleQuickSelectTime("start_time", 30)}
                  >
                    +30 min
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary quick-select-btn"
                    onClick={() => handleQuickSelectTime("start_time", 60)}
                  >
                    +1 hour
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary quick-select-btn"
                    onClick={() => handleQuickSelectTime("start_time", 120)}
                  >
                    +2 hours
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary quick-select-btn"
                    onClick={() => handleQuickSelectTime("start_time", 180)}
                  >
                    +3 hours
                  </button>
                </div>
              </div>

              <div className="col-md-6">
                <label htmlFor="end_time" className="form-label">
                  End Time
                </label>
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
                    value={endTime ? endTime.replace("T", " ") : ""}
                    readOnly // Make it readOnly so Flatpickr handles the input
                  />
                </div>
                <div className="quick-select-buttons mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary quick-select-btn"
                    onClick={() => handleQuickSelectTime("end_time", 30)}
                  >
                    +30 min
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary quick-select-btn"
                    onClick={() => handleQuickSelectTime("end_time", 60)}
                  >
                    +1 hour
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary quick-select-btn"
                    onClick={() => handleQuickSelectTime("end_time", 120)}
                  >
                    +2 hours
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary quick-select-btn"
                    onClick={() => handleQuickSelectTime("end_time", 180)}
                  >
                    +3 hours
                  </button>
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
                    <FaSpinner className="me-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FaCalendarCheck className="me-2" />
                    Book Reservation
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
              <span
                className="close-overlay"
                onClick={() => setShowDeviceSelection(false)}
              >
                &times;
              </span>
            </div>

            <div className="device-tabs d-flex">
              <div
                className={`device-tab ${
                  activeTab === "available" ? "active" : ""
                }`}
                onClick={() => setActiveTab("available")}
                data-tab="available"
              >
                Available Devices
              </div>
              <div
                className={`device-tab ${
                  activeTab === "booked" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("booked");
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
              {activeTab === "available" && (
                <div id="available-devices" className="tab-pane active">
                  <div className="filter-container mb-3">
                    <div className="row">
                      <div className="col-md-6">
                        <label htmlFor="deviceFilter" className="form-label">
                          Filter by Device ID
                        </label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            id="deviceFilter"
                            placeholder="Enter device ID..."
                            value={deviceFilter}
                            onChange={(e) => setDeviceFilter(e.target.value)}
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setDeviceFilter("")}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="server-rack-container">
                    <div className="pagination-container">
                      <ul className="pagination">
                        <li
                          className={`page-item ${
                            current_Page === 1 ? "disabled" : ""
                          }`}
                        >
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => setCurrent_Page(current_Page - 1)}
                            disabled={current_Page === 1}
                          >
                            «
                          </button>
                        </li>

                        {[...Array(totalDevicePages)].map((_, index) => (
                          <li
                            key={index}
                            className={`page-item ${
                              current_Page === index + 1 ? "active" : ""
                            }`}
                          >
                            <button
                              type="button"
                              className="page-link"
                              onClick={() => setCurrent_Page(index + 1)}
                            >
                              {index + 1}
                            </button>
                          </li>
                        ))}

                        <li
                          className={`page-item ${
                            current_Page === totalDevicePages ? "disabled" : ""
                          }`}
                        >
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => setCurrent_Page(current_Page + 1)}
                            disabled={current_Page === totalDevicePages}
                          >
                            »
                          </button>
                        </li>
                      </ul>
                    </div>
                    {loading ? (
                      <div className="loading-message">
                        <FaSpinner className="fa-spin" /> Loading devices...
                      </div>
                    ) : availableDevices.length > 0 ? (
                      <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-3">
                        {current_Devices.map((device) => (
                          <div key={device.device_id} className="col">
                            <div
                              className={`card device-card h-100 ${
                                selectedDevice?.device_id === device.device_id
                                  ? "selected-device"
                                  : ""
                              } ${
                                device.status === "booked"
                                  ? "booked-device"
                                  : "available-device"
                              }`}
                              onClick={() => {
                                if (device.status !== "booked") {
                                  handleDeviceSelection(device);
                                }
                              }}
                              style={{
                                cursor:
                                  device.status === "booked"
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: device.status === "booked" ? 0.7 : 1,
                              }}
                            >
                              <div className="card-body text-center p-2">
                                <FaServer className="fa-2x d-block mx-auto mb-2" />
                                <h5 className="card-title mb-2">
                                  {device.device_id}
                                </h5>
                                <p className="card-text mb-2">
                                  <span
                                    className={`badge ${
                                      device.status === "available"
                                        ? "bg-success"
                                        : device.status === "booked"
                                        ? "bg-danger"
                                        : "bg-secondary"
                                    }`}
                                  >
                                    {device.status === "available"
                                      ? "Available"
                                      : device.status === "booked"
                                      ? "Booked"
                                      : "Unknown"}
                                  </span>
                                </p>
                                {device.status === "booked" && (
                                  <p className="card-text small text-muted mb-0">
                                    Already booked
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted">
                        <FaCalendarAlt className="fa-2x mb-2" />
                        <br />
                        No devices found
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === "booked" && (
                <div id="booked-devices" className="tab-pane active">
                  <div className="filter-container mb-3">
                    <div className="row">
                      <div className="col-md-6">
                        <label
                          htmlFor="bookedDeviceFilter"
                          className="form-label"
                        >
                          Filter by Device ID
                        </label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            id="bookedDeviceFilter"
                            placeholder="Enter device ID..."
                            value={bookedDeviceFilter}
                            onChange={(e) =>
                              setBookedDeviceFilter(e.target.value)
                            }
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setBookedDeviceFilter("")}
                          >
                            <FaTimes />
                          </button>
                        </div>
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
                      <div className="booked-devices-cards">
                        {bookedDevices
                          .filter((device) => {
                            const deviceId =
                              device.device_id ||
                              device.device?.id ||
                              device.id ||
                              "";
                            const deviceName =
                              device.device_name || device.device?.name || "";
                            return (
                              deviceId
                                .toLowerCase()
                                .includes(bookedDeviceFilter.toLowerCase()) ||
                              deviceName
                                .toLowerCase()
                                .includes(bookedDeviceFilter.toLowerCase())
                            );
                          })
                          .map((device, index) => {
                            // Extract all possible data fields with fallbacks
                            const deviceId =
                              device.device_id ||
                              device.device?.id ||
                              device.id ||
                              `device-${index}`;
                            const deviceName =
                              device.device_name ||
                              device.device?.name ||
                              deviceId;
                            const startTime =
                              device.start_time ||
                              device.reservation_start ||
                              device.time?.start;
                            const endTime =
                              device.end_time ||
                              device.reservation_end ||
                              device.time?.end;
                            const userName =
                              device.user_name ||
                              device.user?.name ||
                              device.reserved_by ||
                              "Unknown User";
                            const userId =
                              device.user_id || device.user?.id || "N/A";
                            const reservationId =
                              device.reservation_id || device.id; // Get reservation ID
                            const status = device.status || "booked";

                            // Calculate duration if not provided
                            let duration = device.duration;
                            if (!duration && startTime && endTime) {
                              const start = new Date(startTime);
                              const end = new Date(endTime);
                              const diffMs = Math.abs(end - start);
                              const minutes = Math.floor(diffMs / 60000);
                              duration = `${minutes} minutes`;
                            }

                            // Check if this device is currently being cancelled
                            const isCancelling =
                              cancellingDeviceId === deviceId;

                            return (
                              <div
                                key={`${deviceId}-${index}`}
                                className="booked-device-card"
                              >
                                {isCancelling && (
                                  <div className="cancelling-overlay">
                                    <div className="cancelling-spinner">
                                      <FaSpinner className="fa-spin fa-2x" />
                                      <p>Cancelling...</p>
                                    </div>
                                  </div>
                                )}

                                <div className="booked-device-card-header">
                                  <h5 className="booked-device-card-title">
                                    {deviceName}
                                  </h5>
                                  <span
                                    className={`badge ${
                                      status === "active"
                                        ? "badge-active"
                                        : status === "upcoming"
                                        ? "badge-upcoming"
                                        : status === "completed"
                                        ? "badge-expired"
                                        : "bg-primary"
                                    }`}
                                  >
                                    {status.toUpperCase()}
                                  </span>
                                </div>

                                <div className="booked-device-card-body">
                                  <div className="booked-device-card-row">
                                    <div className="booked-device-card-label">
                                      Device ID:
                                    </div>
                                    <div className="booked-device-card-value">
                                      {deviceId}
                                    </div>
                                  </div>

                                  <div className="booked-device-card-row">
                                    <div className="booked-device-card-label">
                                      User ID:
                                    </div>
                                    <div className="booked-device-card-value">
                                      {userId}
                                    </div>
                                  </div>

                                  <div className="booked-device-card-row">
                                    <div className="booked-device-card-label">
                                      Start:
                                    </div>
                                    <div className="booked-device-card-value">
                                      {startTime
                                        ? new Date(startTime).toLocaleString()
                                        : "N/A"}
                                    </div>
                                  </div>

                                  <div className="booked-device-card-row">
                                    <div className="booked-device-card-label">
                                      End:
                                    </div>
                                    <div className="booked-device-card-value">
                                      {endTime
                                        ? new Date(endTime).toLocaleString()
                                        : "N/A"}
                                    </div>
                                  </div>

                                  <div className="booked-device-card-row">
                                    <div className="booked-device-card-label">
                                      Duration:
                                    </div>
                                    <div className="booked-device-card-value">
                                      {duration || "N/A"}
                                    </div>
                                  </div>
                                </div>

                                <div className="booked-device-card-footer">
                                  <button
                                    className="btn btn-sm btn-danger btn-cancel"
                                    onClick={() =>
                                      handleCancelReservation(
                                        deviceId,
                                        reservationId
                                      )
                                    }
                                    disabled={isCancelling}
                                  >
                                    {isCancelling ? (
                                      <>
                                        <FaSpinner className="fa-spin me-1" />{" "}
                                        Cancelling...
                                      </>
                                    ) : (
                                      <>
                                        <FaTimes className="me-1" /> Cancel
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-5 text-muted">
                        <FaCalendarAlt className="fa-3x mb-3" />
                        <h5>No Booked Devices Found</h5>
                        <p className="mb-3">
                          There are currently no active or upcoming
                          reservations.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {activeTab === "available" && (
              <div className="confirm-selection mt-3">
                <button
                  id="confirmDeviceSelectionBtn"
                  className="btn btn-reserve"
                  onClick={handleConfirmDevice}
                  disabled={!selectedDevice || loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="fa-spin me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheck className="me-2" />
                      Confirm Device Selection
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
              <h4 id="deviceDetailsTitle">
                Device Details - {deviceDetails.device_id}
              </h4>
              <span
                className="close-details"
                onClick={() => setShowDeviceDetails(false)}
              >
                &times;
              </span>
            </div>
            <div className="device-details-content" id="deviceDetailsContent">
              <div className="row">
                <div className="col-md-6">
                  <h5>Basic Information</h5>
                  <p>
                    <strong>Device ID:</strong> {deviceDetails.device_id}
                  </p>
                  <p>
                    <strong>Status:</strong>
                    <span
                      className={`badge ${
                        deviceDetails.status === "active"
                          ? "bg-success"
                          : deviceDetails.status === "upcoming"
                          ? "bg-warning"
                          : "bg-secondary"
                      } ms-2`}
                    >
                      {deviceDetails.status?.charAt(0).toUpperCase() +
                        deviceDetails.status?.slice(1)}
                    </span>
                  </p>

                  {deviceDetails.pc_ip && (
                    <p>
                      <strong>PC IP:</strong> {deviceDetails.pc_ip}
                    </p>
                  )}
                  {deviceDetails.rutomatrix_ip && (
                    <p>
                      <strong>Rutomatrix IP:</strong>{" "}
                      {deviceDetails.rutomatrix_ip}
                    </p>
                  )}
                  {deviceDetails.pulse1_ip && (
                    <p>
                      <strong>Pulse1 IP:</strong> {deviceDetails.pulse1_ip}
                    </p>
                  )}
                  {deviceDetails.ct1_ip && (
                    <p>
                      <strong>CT1 IP:</strong> {deviceDetails.ct1_ip}
                    </p>
                  )}
                </div>

                <div className="col-md-6">
                  <h5>Reservation Details</h5>
                  {deviceDetails.start_time && (
                    <p>
                      <strong>Start Time:</strong>{" "}
                      {new Date(deviceDetails.start_time).toLocaleString()}
                    </p>
                  )}
                  {deviceDetails.end_time && (
                    <p>
                      <strong>End Time:</strong>{" "}
                      {new Date(deviceDetails.end_time).toLocaleString()}
                    </p>
                  )}
                  {deviceDetails.user_id && (
                    <p>
                      <strong>Booked_by:</strong> {deviceDetails.user_id}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div
            id="detailsOverlay"
            className="details-overlay"
            onClick={() => setShowDeviceDetails(false)}
          ></div>
        </>
      )}

      <div className="row">
        <div className="col-lg-12 mb-4">
          <div className="card shadow-sm">
            <div
              className="card-header d-flex justify-content-between align-items-center"
              style={{ backgroundColor: "#1e1e1e", color: "#1281d6" }}
            >
              <h5 className="mb-0">
                <FaCalendarAlt className="me-2" />
                {currentUser && currentUser.role === 'admin' ? 'All Reservations' : 'Your Reservations'}
              </h5>
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
                <div
                  className="input-group input-group-sm"
                  style={{ width: "200px" }}
                >
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
                    <table
                      id="reservationsTable"
                      className="table table-hover mb-0"
                    >
                    <thead>
                        <tr>
                          {/* Show user column only for admin */}
                          {currentUser && currentUser.role === 'admin' && (
                            <th
                              className={`sortable ${
                                sortConfig.key === "user"
                                  ? sortConfig.direction === "asc"
                                    ? "sorted-asc"
                                    : "sorted-desc"
                                  : ""
                              }`}
                              onClick={() => handleSort("user")}
                              data-sort="user"
                            >
                              User <FaSort className="float-end mt-1" />
                            </th>
                          )}
                          <th
                            className={`sortable ${
                              sortConfig.key === "device"
                                ? sortConfig.direction === "asc"
                                  ? "sorted-asc"
                                  : "sorted-desc"
                                : ""
                            }`}
                            onClick={() => handleSort("device")}
                            data-sort="device"
                          >
                            Device <FaSort className="float-end mt-1" />
                          </th>
                          <th
                            className={`sortable ${
                              sortConfig.key === "startTime"
                                ? sortConfig.direction === "asc"
                                  ? "sorted-asc"
                                  : "sorted-desc"
                                : ""
                            }`}
                            onClick={() => handleSort("startTime")}
                            data-sort="startTime"
                          >
                            Start <FaSort className="float-end mt-1" />
                          </th>
                          <th
                            className={`sortable ${
                              sortConfig.key === "endTime"
                                ? sortConfig.direction === "asc"
                                  ? "sorted-asc"
                                  : "sorted-desc"
                                : ""
                            }`}
                            onClick={() => handleSort("endTime")}
                            data-sort="endTime"
                          >
                            End <FaSort className="float-end mt-1" />
                          </th>
                          <th
                            className={`sortable ${
                              sortConfig.key === "status"
                                ? sortConfig.direction === "asc"
                                  ? "sorted-asc"
                                  : "sorted-desc"
                                : ""
                            }`}
                            onClick={() => handleSort("status")}
                            data-sort="status"
                          >
                            Status <FaSort className="float-end mt-1" />
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody id="reservationsBody">
                      {currentEntries.length > 0 ? (
                        currentEntries
                          .map((res) => {
                            const isExpired = res.end_time < now;
                            const isActive = res.start_time <= now && now <= res.end_time;
                            const statusClass = isExpired
                              ? "table-secondary"
                              : isActive
                              ? "table-success"
                              : "";
                            const status = isExpired
                              ? "expired"
                              : isActive
                              ? "active"
                              : "upcoming";

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
                                {/* Show user info only for admin */}
                                {currentUser && currentUser.role === 'admin' && (
                                  <td>{res.user_name || `User ${res.user_id}`}</td>
                                )}
                                <td>{res.device_id}</td>
                                <td>
                                  {res.start_time.toLocaleString("en-US", {
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </td>
                                <td>
                                  {res.end_time.toLocaleString("en-US", {
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </td>
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
                                      onClick={() => handleCancelReservation(res.device_id, res.id)}
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
                          })
                          .filter(Boolean)
                      ) : (
                        <tr>
                          <td 
                            colSpan={currentUser && currentUser.role === 'admin' ? "6" : "5"} 
                            className="text-center py-4 text-muted"
                          >
                            <FaCalendarAlt className="fa-2x mb-2" />
                            <br />
                            No reservations found
                          </td>
                        </tr>
                      )}
                    </tbody>
                    </table>
                  </div>
                  <div className="card-footer d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                      Showing{" "}
                      <span id="showingFrom">{indexOfFirstEntry + 1}</span> to{" "}
                      <span id="showingTo">
                        {Math.min(
                          indexOfLastEntry,
                          filteredReservations.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span id="totalEntries">
                        {filteredReservations.length}
                      </span>{" "}
                      entries
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li
                          className={`page-item ${
                            currentPage === 1 ? "disabled" : ""
                          }`}
                          id="prevPage"
                        >
                          <button
                            type="button"
                            className="page-link"
                            tabIndex={currentPage === 1 ? -1 : 0}
                            disabled={currentPage === 1}
                            onClick={() => {
                              if (currentPage > 1)
                                setCurrentPage(currentPage - 1);
                            }}
                          >
                            Previous
                          </button>
                        </li>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <li
                            key={page}
                            className={`page-item ${
                              currentPage === page ? "active" : ""
                            }`}
                          >
                            <button
                              type="button"
                              className="page-link"
                              onClick={() => setCurrentPage(page)}
                              aria-current={
                                currentPage === page ? "page" : undefined
                              }
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                        <li
                          className={`page-item ${
                            currentPage === totalPages || totalPages === 0
                              ? "disabled"
                              : ""
                          }`}
                          id="nextPage"
                        >
                          <button
                            type="button"
                            className="page-link"
                            disabled={
                              currentPage === totalPages || totalPages === 0
                            }
                            onClick={() => {
                              if (currentPage < totalPages)
                                setCurrentPage(currentPage + 1);
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

export default AdminReservation;
