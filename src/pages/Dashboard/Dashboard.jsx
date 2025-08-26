import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../../components/Navbar/Navbar";
import axios from "axios";
import "./Dashboard.css";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MonitorSmartphone,
  ThermometerSun,
  CameraIcon,
  ChartColumnStacked,
  LayoutGrid,
  CircleUserRound,
  ExternalLink,
  UsbIcon,
  CpuIcon,
  ZapIcon,
  HardDriveIcon,
  TerminalIcon,
  Volume2Icon,
  VideoIcon,
  CodeIcon,
} from "lucide-react";

const DeviceCard = ({ device, isActive, onClick, renderIcon, isDarkTheme }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunchClick = (e) => {
    e.stopPropagation();
    setIsLaunching(true);
    onClick();
    setTimeout(() => setIsLaunching(false), 1500);
  };

  const shouldShowButton = !isActive && (isHovered || isLaunching);

  return (
    <div
      className={`Device-card ${isActive ? "active" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="device-icon">
        {renderIcon(device.iconType, isDarkTheme ? "#ff6a00" : "#0971B3")}
      </div>

      <div className="device-name">{device.name }</div>
      <div className="device-status">{isActive ? "Running" : "Ready"}</div>

      {!isActive && (
        <button
          className={`launch-button ${shouldShowButton ? "visible" : ""}`}
          onClick={handleLaunchClick}
          disabled={isLaunching}
        >
          {isLaunching ? (
            <>
              <span className="loading-spinner"></span>
              Opening...
            </>
          ) : (
            <>
              <ExternalLink size={16} style={{ marginRight: "6px" }} />
              Launch Window
            </>
          )}
        </button>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [activeDevices, setActiveDevices] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [deviceIpMapping, setDeviceIpMapping] = useState({});
  const [deviceEndTime, setDeviceEndTime] = useState(null); // Add this line
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupWindows, setPopupWindows] = useState([]);

  const location = useLocation();
  const settingsToggleRef = useRef(null);
  const settingsRef = useRef(null);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true;
  });

  const queryParams = new URLSearchParams(location.search);
  const deviceIdParam = queryParams.get("device");
  const reservationIdParam = queryParams.get("reservation");

  const driverTypes = {
    ct1_ip: { name: "CT", iconType: "ThermoCamIcon" },
    pc_ip: { name: "Virtual Desk", iconType: "MonitorSmartphone" },
    pulse1_ip: { name: "Pulse", iconType: "ChartColumnStacked" },
    usb_ip: { name: "USB File Sharing", iconType: "UsbIcon" },
    system_ip: { name: "System State Control & ATX", iconType: "CpuIcon" },
    bias_ip: { name: "Firm Flashing", iconType: "ZapIcon" },
    os_ip: { name: "OS Flashing", iconType: "HardDriveIcon" },
    cmd_ip: { name: "Command Prompt", iconType: "TerminalIcon" },
    audio_ip: { name: "Audio Transmission", iconType: "Volume2Icon" },
    stream1_ip: { name: "Stream 1", iconType: "VideoIcon" },
    stream2_ip: { name: "Stream 2", iconType: "VideoIcon" },
    postcode_ip: { name: "Post Code Reading", iconType: "CodeIcon" },
    rutomatrix_ip: { name: "Rutomatrix", iconType: "MonitorSmartphone" },
  };

  const [userData, setUserData] = useState({
    name: "",
    avatar: <CircleUserRound size={30} />,
    onLogout: () => console.log("Logging out..."),
  });

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const onMinimize = (deviceId) => {
    console.log(`Minimizing device ${deviceId}`);
  };

  const fetchBookedDevices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://127.0.0.1:5000/api/booked-devices"
      );

      const responseData = response.data;

      if (responseData.success) {
        const booked = responseData.data.booked_devices || [];

        if (deviceIdParam && reservationIdParam) {
          const matchedDevice = booked.find(
            (dev) =>
              dev.device.id === deviceIdParam &&
              String(dev.id) === reservationIdParam
          );

          if (matchedDevice) {
            setDeviceEndTime(new Date(matchedDevice.time.end));
            setUserData((prev) => ({
              ...prev,
              name: matchedDevice.user?.user_name || "Unknown User",
            }));

            // Get all available IP types from the device
            const ipTypes = Object.keys(matchedDevice.device)
              .filter((key) => key.endsWith("_ip") && key !== "rutomatrix_ip")
              .map((key) => key);

            const driverDevices = ipTypes.map((ipType) => {
              const driverInfo = driverTypes[ipType] || {
                name: ipType.replace("_ip", ""),
                iconType: "MonitorSmartphone",
              };

              return {
                id: `${matchedDevice.device.id}_${ipType}`,
                name: `Device ${parseInt(matchedDevice.device.id)} - ${
                  driverInfo.name
                }`,
                iconType: driverInfo.iconType,
                ipType,
                ipAddress: matchedDevice.device[ipType],
                reservationId: matchedDevice.reservation_id,
                deviceName: matchedDevice.device_name,
              };
            });

            // Add Rutomatrix sub-drivers if rutomatrix_ip exists
            if (matchedDevice.device.rutomatrix_ip) {
              const rutomatrixIp = matchedDevice.device.rutomatrix_ip;
              const subDrivers = [
                { name: "Stream 1", endpoint: "stream1", icon: "VideoIcon" },
                { name: "Stream 2", endpoint: "stream2", icon: "VideoIcon" },
                { name: "USB File Sharing", endpoint: "usb", icon: "UsbIcon" },
                {
                  name: "System State Control & ATX",
                  endpoint: "systemstate_atx",
                  icon: "CpuIcon",
                },
                {
                  name: "Firmware Flashing",
                  endpoint: "bias",
                  icon: "ZapIcon",
                },
                { name: "OS Flashing", endpoint: "os", icon: "HardDriveIcon" },
                //{ name: "Command Prompt", endpoint: "cmd", icon: "TerminalIcon" },
                {
                  name: "Audio Transmission",
                  endpoint: "audio",
                  icon: "Volume2Icon",
                },
                {
                  name: "Post Code Reading",
                  endpoint: "post_code",
                  icon: "CodeIcon",
                },
              ];

              subDrivers.forEach((driver) => {
                driverDevices.push({
                  id: `${matchedDevice.device.id}_rutomatrix_${driver.endpoint}`,
                  name: `Device ${parseInt(matchedDevice.device.id)} - ${
                    driver.name
                  }`,
                  iconType: driver.icon,
                  ipType: `${driver.endpoint}`,
                  ipAddress: `${rutomatrixIp}/${driver.endpoint}`,
                  reservationId: matchedDevice.reservation_id,
                  deviceName: matchedDevice.device_name,
                });
              });
            }

            setSelectedDevices(driverDevices);
            setDeviceIpMapping((prev) => {
              const newMapping = { ...prev };
              driverDevices.forEach((driver) => {
                newMapping[driver.id] = {
                  ip_type: driver.ipType,
                  ip_address: driver.ipAddress,
                  reservation_id: driver.reservationId,
                  device_name: driver.deviceName,
                  device_details: matchedDevice.device,
                };
              });
              return newMapping;
            });
          } else {
            setError("No matching booked device found");
          }
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching booked devices:", err);
      setError("Failed to fetch device information");
      setLoading(false);
    }
  }, [deviceIdParam, reservationIdParam]);

  useEffect(() => {
    fetchBookedDevices();
    const intervalId = setInterval(fetchBookedDevices, 10000);
    return () => clearInterval(intervalId);
  }, [fetchBookedDevices]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target) &&
        settingsToggleRef.current &&
        !settingsToggleRef.current.contains(event.target)
      ) {
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === "minimize") {
        onMinimize(event.data.deviceId);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Add this useEffect to check for expired bookings
  useEffect(() => {
    function checkExpiredBookings() {
      const now = new Date();
      setPopupWindows((prev) => {
        return prev.filter((popupInfo) => {
          // Close window if time expired
          if (new Date(popupInfo.endTime) <= now) {
            try {
              if (!popupInfo.window.closed) {
                popupInfo.window.close();
              }
            } catch (e) {
              console.error("Error closing window:", e);
            }
            return false; // Remove from tracking
          }
          return true; // Keep tracking
        });
      });
    }

    const interval = setInterval(checkExpiredBookings, 1000);
    return () => clearInterval(interval);
  }, []);

  const openDeviceWindow = async (deviceId, ipInfo = null) => {
    const device = selectedDevices.find((d) => d.id === deviceId);
    if (!device) {
      console.warn("No matching device found.");
      return;
    }

    // Use the component's deviceEndTime state
    if (!deviceEndTime) {
      console.warn("No end time available for this device");
      return;
    }

    const Timer = ({ end, deviceName, onExpired, isPopup = false }) => {
      const timerRef = useRef(null);
      const alertShownRef = useRef({
        thirtyMinutes: false,
        tenMinutes: false,
        expired: false,
      });

      const playAlertSound = () => {
        try {
          const audio = new Audio(
            "https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3"
          );
          audio.volume = 0.3;
          audio.play().catch((e) => console.log("Audio play failed:", e));
        } catch (e) {
          console.log("Audio error:", e);
        }
      };

      const showAlert = async (message) => {
        return new Promise((resolve) => {
          if (!alertShownRef.current.isAlertActive) {
            alertShownRef.current.isAlertActive = true;
            playAlertSound();
            alert(message);
            alertShownRef.current.isAlertActive = false;
            resolve();
          }
        });
      };

      const startCountdown = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        alertShownRef.current = {
          thirtyMinutes: false,
          tenMinutes: false,
          expired: false,
          isAlertActive: false,
        };

        timerRef.current = setInterval(async () => {
          const now = new Date();
          const difference = end - now;
          const minutesLeft = Math.floor(difference / (1000 * 60));

          if (difference <= 0) {
            clearInterval(timerRef.current);
            if (!alertShownRef.current.expired) {
              await showAlert(`Your booking for ${deviceName} has expired!`);
              alertShownRef.current.expired = true;
              if (onExpired) onExpired();
            }
          } else if (minutesLeft === 10 && !alertShownRef.current.tenMinutes) {
            await showAlert(`Warning: Only 10 minutes left for ${deviceName}`);
            alertShownRef.current.tenMinutes = true;
          } else if (
            minutesLeft === 30 &&
            !alertShownRef.current.thirtyMinutes
          ) {
            await showAlert(`Warning: Only 30 minutes left for ${deviceName}`);
            alertShownRef.current.thirtyMinutes = true;
          }
        }, 1000);
      };

      useEffect(() => {
        if (end) {
          startCountdown();
        }

        return () => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        };
      }, [end]);

      return null; // This component doesn't render anything
    };

    const ipType = ipInfo?.ip_type || "";
    const ipAddress = ipInfo?.ip_address || "";
    const deviceName = ipInfo?.device_name || "";
    const title = `Rutomatrix &#x2022; ${deviceName}  ${ipType}`;
    const isAudio = ["Audio"].some((audio_ip) =>
      device.name.includes(audio_ip)
    );
    const isCT = ["CT"].some((ct) => device.name.includes(ct));
    const isPulse = ["Pulse"].some((pulse) => device.name.includes(pulse));
    const isPC = device.name.includes("Virtual");
    const isFirmware = device.name.includes("Firmware");
    const isOs = device.name.includes("OS");
    const isPostcode = device.name.includes("Post");
    const isSystemInfo = device.name.includes("System");
    const isUsbSharing = device.name.includes("USB");
    const isStream1 = device.name.includes("Stream 1");
    const isStream2 = device.name.includes("Stream 2");

    // Timer script that will receive updates from parent window
    const timerScript = `
      // Function to update timer display
      function updateTimer(timeLeft, isLast10Minutes) {
        const timerElement = document.getElementById('device-timer');
        if (timerElement) {
          timerElement.innerHTML = \`
            <div style="display: flex; align-items: center; gap: 4px;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span style="font-family: monospace; \${isLast10Minutes ? 'color: #ff4444; font-weight: bold;' : ''}">
                \${timeLeft}
              </span>
            </div>
          \`;
        }
      }

      // Listen for timer updates from parent window
      window.addEventListener('message', (event) => {
        if (event.data.type === 'updateTimer') {
          updateTimer(event.data.timeLeft, event.data.isLast10Minutes);
        }
      });
  `;

    const postMessageScript = `
      window.addEventListener('load', () => {
        window.opener.postMessage(
          { type: 'windowTitle', deviceId: "${deviceId}", title: document.title },
          '*'
        );
      });
  `;

    let popupHTML = "";

    if (isCT) {
      let response = await fetch('/templates/thermalCamera.html');
      popupHTML = await response.text();
    } else if (isPulse) {
      let response = await fetch('/templates/pulseView.html');
      popupHTML = await response.text();
    } else if (isPC) {
      let response = await fetch('/templates/virtualDesk.html');
      popupHTML = await response.text();
    } else if (isStream1 || isStream2) {
      let response = await fetch('/templates/stream.html');
      popupHTML = await response.text();
    } else if (isOs) {
      let response = await fetch('/templates/osFlashing.html');
      popupHTML = await response.text();
    } else if (isAudio) {
      let response = await fetch('/templates/audio.html');
      popupHTML = await response.text();
    } else if (isSystemInfo || isUsbSharing || isFirmware) {
      let response = await fetch('/templates/commonTemplate.html');
      popupHTML = await response.text();
    } else if (isPostcode) {
      let response = await fetch('/templates/postCode.html');
      popupHTML = await response.text();
    } else {
      let response = await fetch('/templates/popup.html');
      popupHTML = await response.text();
    }

    const blob = new Blob([popupHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const popup = window.open(
      url,
      `device_${deviceId}`,
      "width=1000,height=700,left=100,top=100,resizable=yes"
    );

    popup.onload = () => {
      popup.postMessage(
        {
          type: "initPopup",
          title,
          device: device,
          ipAddress,
          postMessageScript,
          timerScript
        },
        "*"
      );
    };


    // After creating the popup, add it to tracked windows
    setPopupWindows((prev) => [
      ...prev,
      {
        id: deviceId,
        window: popup,
        endTime: deviceEndTime,
      },
    ]);

    if (!popup) {
      URL.revokeObjectURL(url);
      alert("Please allow popups for this site");
      return;
    }

    // Timer update function to send to popup
    const updatePopupTimer = () => {
      if (!popup.closed && deviceEndTime) {
        const now = new Date();
        const end = new Date(deviceEndTime);

        // Validate the date
        if (isNaN(end.getTime())) {
          console.error("Invalid end time:", deviceEndTime);
          return;
        }

        const difference = end - now;
        const minutesLeft = Math.floor(difference / (1000 * 60));

        // Format time only if difference is positive
        const timeLeft =
          difference > 0
            ? new Date(difference).toISOString().substr(11, 8)
            : "00:00:00";

        const isLast10Minutes = minutesLeft <= 10;

        popup.postMessage(
          {
            type: "updateTimer",
            timeLeft,
            isLast10Minutes,
          },
          "*"
        );
      }
    };

    // Set up timer interval to update popup
    const timerInterval = setInterval(updatePopupTimer, 1000);
    updatePopupTimer(); // Initial update

    const cleanup = () => {
      clearInterval(timerInterval);
      URL.revokeObjectURL(url);
      setActiveDevices((prev) => prev.filter((id) => id !== deviceId));
      setPopupWindows((prev) => prev.filter((p) => p.id !== deviceId));
    };

    popup.onbeforeunload = cleanup;

    const checkPopupClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopupClosed);
        cleanup();
      }
    }, 500);

    setActiveDevices((prev) => [...prev, deviceId]);
  };

  return (
    <div className={`dashboard-container ${isDarkTheme ? "dark-theme" : ""}`}>
      <Navbar
        isDarkTheme={isDarkTheme}
        toggleTheme={toggleTheme}
        userData={{ ...userData, device_id: deviceIdParam }} // Pass the device_id from URL params
      />

      <div className="dashboard-header">
        <button
          className="settings-toggle-btn"
          ref={settingsToggleRef}
          onClick={() => setShowSettings(!showSettings)}
        >
          <LayoutGrid size={24} color="#0971B3" />
        </button>

        {showSettings && (
          <div
            className={`settings-dropdown ${isDarkTheme ? "dark" : "light"}`}
            ref={settingsRef}
          >
            <div className="user-info">
              <div className="user-avatar">{userData.avatar}</div>
              <div className="user-details">
                <div className="user-name">{userData.name}</div>
              </div>
            </div>

            <div className="theme-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={isDarkTheme}
                  onChange={toggleTheme}
                />
                <span className="slider"></span>
                <span className="theme-label">
                  {isDarkTheme ? "Dark Mode" : "Light Mode"}
                </span>
              </label>
            </div>

            <button
              className={`logout-button ${isDarkTheme ? "dark" : ""}`}
              onClick={() => {
                userData.onLogout(); // Call logout
                navigate("/auth"); // Redirect to /auth
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <div className="dashboard-center-wrapper">
        <div className="dashboard-content-wrapper">
          <h1 className="dashboard-title">Device Dashboard</h1>
          <h2 className="dashboard-para">
            Control and monitor your selected devices
          </h2>
          <div className="dashboard-content">
            <div className="devices-grid">
              {selectedDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  isActive={activeDevices.includes(device.id)}
                  onClick={() => {
                    const ipInfo = deviceIpMapping[device.id];
                    openDeviceWindow(device.id, ipInfo);
                  }}
                  renderIcon={(type, color) => {
                    switch (type) {
                      case "MonitorSmartphone":
                        return <MonitorSmartphone size={32} color={color} />;
                      case "ChartColumnStacked":
                        return <ChartColumnStacked size={32} color={color} />;
                      case "ThermoCamIcon":
                        return (
                          <span
                            style={{
                              display: "flex",
                              gap: "2px",
                              alignItems: "center",
                            }}
                          >
                            <ThermometerSun size={30} color={color} />
                            <CameraIcon size={30} color={color} />
                          </span>
                        );
                      case "UsbIcon":
                        return <UsbIcon size={32} color={color} />;
                      case "CpuIcon":
                        return <CpuIcon size={32} color={color} />;
                      case "ZapIcon":
                        return <ZapIcon size={32} color={color} />;
                      case "HardDriveIcon":
                        return <HardDriveIcon size={32} color={color} />;
                      case "TerminalIcon":
                        return <TerminalIcon size={32} color={color} />;
                      case "Volume2Icon":
                        return <Volume2Icon size={32} color={color} />;
                      case "VideoIcon":
                        return <VideoIcon size={32} color={color} />;
                      case "CodeIcon":
                        return <CodeIcon size={32} color={color} />;
                      default:
                        return <MonitorSmartphone size={32} color={color} />;
                    }
                  }}
                  isDarkTheme={isDarkTheme}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
