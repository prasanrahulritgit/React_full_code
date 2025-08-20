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
      className={`device-card ${isActive ? "active" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="device-icon">
        {renderIcon(device.iconType, isDarkTheme ? "#ff6a00" : "#0971B3")}
      </div>

      <div className="device-name">{device.name}</div>
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
    <script>
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
    </script>
  `;

    const postMessageScript = `
    <script>
      window.addEventListener('load', () => {
        window.opener.postMessage(
          { type: 'windowTitle', deviceId: "${deviceId}", title: document.title },
          '*'
        );
      });
    </script>
  `;

    let popupHTML = "";

    if (isCT) {
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
  ${timerScript}
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #121212;
      color: #FFFFFF;
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }

    .app-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 12px;
      box-sizing: border-box;
      gap: 16px;
      margin: 0 auto;
      overflow-y: auto; /* Enable vertical scrolling */
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #1E1E1E;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .device-info {
      display: flex;
      flex-direction: column;
    }

     .device-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    #device-timer {
      margin-left: 10px;
    }

  .device-name {
    font-size: 18px;
    font-weight: 600;
    color: #FF6A00;
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
    word-break: break-word;
    line-height: 1.2;
    text-align: center;
  }

    .controls {
      display: flex;
      gap: 12px;
    }

    .control-btn {
      background: #2A2A2A;
      border: none;
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      transition: background 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
      backdrop-filter: blur(4px);
    }

    .control-btn:hover {
      background: linear-gradient(135deg, #FF6A00, #ff812b);
      transform: translateY(-2px);
    }

    .control-btn:active {
      background: #FF6A00;
      transform: scale(0.96) translateY(1px);
      box-shadow: 0 2px 6px rgba(255, 106, 0, 0.3);
    }

    .feed-container {
      position: relative;
      background: #1E1E1E;
      border-right: groove 1px #7c7c7c;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .feed-header {
      padding: 8px 12px;
      background: rgba(0,0,0,0.3);
      font-size: 14px;
    }

    .feed-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .feed-Placeholder {
      color: #BBBBBB;
      font-size: 16px;
    }

    .feed-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      max-width: 100%;
      max-height: 100%;
      display: block;
    }

    .video-layout-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .video-section {
      display: flex;
      gap: 16px;
    }

    .feed-controls {
      position: absolute;
      bottom: 16px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .feed-btn {
      background: rgba(0,0,0,0.7);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .feed-btn:hover {
      background: #FF6A00;
      transform: scale(1.1);
    }
    
  .servo-control-panel {
    position: absolute;
    bottom: 70px;
    right: 64px;
    width: 100px;
    height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
    z-index: 1000;
    }

  /* Servo Control Button State */
  .control-btn.active {
    background: #FF6A00 !important;
    color: white !important;
  }

  .arrow-group {
    display: flex;
    justify-content: space-between;
    width: 95%;
  }

  .arrow {
    width: 0;
    height: 0;
    border-style: solid;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
  }

/* Click effect (brief push-in animation) */
/* Active class for keyboard-triggered highlight */
.arrow.active {
  transform: scale(0.95);
  opacity: 1;
  filter: brightness(1.4);
  transition: transform 0.2s ease, filter 0.2s ease;
}

  /* Click effect (brief push-in animation) */
  .arrow:active {
    transform: scale(0.9);
  }

  .arrow.up {
    border-width: 0 20px 20px 20px;
    border-color: transparent transparent #FF6A00 transparent;
  }

  .arrow.down {
    border-width: 20px 20px 0 20px;
    border-color: #FF6A00 transparent transparent transparent;
  }

  .arrow.left {
    border-width: 20px 20px 20px 0;
    border-color: transparent #FF6A00 transparent transparent;
  }

  .arrow.right {
    border-width: 20px 0 20px 20px;
    border-color: transparent transparent transparent #FF6A00;
  }

  /* Center dot enhancements */
  .arrow.center {
    width: 20px;
    height: 20px;
    background-color: #FF6A00;
    border-radius: 50%;
    margin: auto;
    transition: transform 0.2s ease, background-color 0.2s ease;
  }

  .arrow.center:hover {
    transform: scale(1.2);
    background-color: #ffa347;
  }

  .arrow.center:active {
    transform: scale(0.9);
  }

  .angle-display {
  position: absolute;
  bottom: 120px; /* adjust as needed to place near panel */
  right: 50px;   /* match panel's right offset */
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 14px;
  white-space: nowrap;
}

  .hidden {
    display: none;
  }

  .toggle-btn {
    color: white;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px 0 0 4px;
    font-weight: bold;
    opacity: 0.5;
    flex-shrink: 0; /* Prevents button from shrinking */
}
    .toggle-btn:hover {
    background-color: rgb(147 140 135 / 20%);
    opacity: 1;
  }

 /* Base responsive adjustments */
.app-container {
  width: 100%;
  min-height: 100vh;
  padding: 8px;
  gap: 12px;
}

.header {
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 12px;
}

.controls {
  flex-wrap: wrap;
  justify-content: center;
}

/* Video feeds responsive layout */
.video-feeds-container {
  flex-direction: column;
  height: auto;
}

.video-section {
  flex-direction: column;
}

.feed-container {
  min-height: 300px;
}

/* Media queries for different screen sizes */
@media (min-width: 768px) {
  .video-feeds-container {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .feed-container {
    min-width: calc(50% - 8px);
    flex: 1 1 45%;
  }
}

@media (min-width: 1024px) {
  .app-container {
    max-width: 1400px;
  }
  
  .video-feeds-container {
    flex-wrap: nowrap;
  }
  
  .feed-container {
    min-width: auto;
  }

}

/* Small screens adjustments */
@media (max-width: 480px) {
  .device-info {
    width: 100%;
    text-align: center;
  }
  
  .controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .control-btn {
    padding: 6px 10px;
    font-size: 14px;
  }
}

.video-feeds-container {
  display: flex;
  border-radius: 14px;
  border: groove 1px #7c7c7c;
  height: 580px; /* Default height */
  width: 100%;
  overflow-y: auto; /* Enable vertical scrolling */
  overflow-x: hidden; /* Prevent horizontal scrolling */
}

/* Child elements should not exceed container */
.feed-container {
  min-width: 0; /* Critical for flex children */
  flex-shrink: 0; /* Prevent unwanted shrinkage */
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .video-feeds-container {
    height: 550px;
  }
}

@media (max-width: 992px) {
  .video-feeds-container {
    height: 500px;
    flex-wrap: wrap;
    align-content: flex-start; /* Proper wrap alignment */
    overflow-y: auto;
  }
  
  .feed-container {
    min-width: calc(50% - 8px); /* Two columns */
    flex: 1 1 45%;
  }
}

@media (max-width: 768px) {
  .video-feeds-container {
    height: auto;
    min-height: 450px;
    gap: 12px;
    flex-direction: column;
  }
  
  .feed-container {
    min-width: 100%;
    height: 300px;
  }
}

@media (max-width: 576px) {
  .video-feeds-container {
    min-height: 350px;
  }
  
  .feed-container {
    min-width: 100%;
    height: 300px;
  }
}

@media (max-width: 576px) {
  .video-feeds-container {
    min-height: 350px;
  }
  
  .feed-container {
    height: 250px;
  }
}
  .feed-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #2A2A2A;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #FF6A00;
}

.refresh-btn.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

  .refresh-spinner, .loading-spinner {
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 3px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
  }
  
  .loading-spinner {
    margin: 20px auto;
    display: block;
    width: 40px;
    height: 40px;
    border-width: 4px;
  }

  .feed-Placeholder {
    color: #aaa;
    text-align: center;
    font-size: 14px;
  }

  .alert {
    position: fixed;
    top: 80px;
    right: 30px;
    padding: 12px 16px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    z-index: 1000;
    max-width: 300px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }

  .alert-success {
    background-color: #4CAF50;
    color: white;
  }

  .alert-error {
    background-color: #F44336;
    color: white;
  }

  .alert-info {
    background-color: #2196F3;
    color: white;
  }

  .alert-warning {
    background-color: #FF9800;
    color: white;
  }

  .alert-icon {
    margin-right: 8px;
    font-weight: bold;
  }

  .fade-out {
    opacity: 0;
    transition: opacity 0.5s;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

</style>
</head>
<body>
  <div class="app-container">
    <div class="header">
      <div class="device-info">
        <div class="device-name-row">
          <div class="device-name">${device.name}</div>
          <div id="device-timer"></div>
        </div>
        <div class="ip-display">
          IP: ${ipAddress || "Not available"}
        </div>
        <div class="cors-notice" style="color: #FF6A00; font-size: 14px; margin-top: 8px;">
        </div>
      </div>
      <div class="controls">
        <button class="refresh-btn" id="refresh-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
          </svg>
        </button>
        <button class="control-btn" id="stream-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M16 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4m4-4v16" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
          Start Stream
        </button>
        <button class="control-btn hidden" id="reset-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.3-.42 2.5-1.13 3.46l1.48 1.48A7.963 7.963 0 0 0 20 12c0-4.42-3.58-8-8-8zm-6.87.54L3.65 6.35A7.963 7.963 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6 0-1.3.42-2.5 1.13-3.46z" fill="currentColor"/>
          </svg>
          Reset
        </button>
        <button class="control-btn" id="servo-toggle-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" fill="none" />
          </svg>
          Control
        </button>
      </div>
    </div>

  <div class="video-layout-wrapper">
    <div class="video-section">
      <div class="video-feeds-container">
        <!-- Camera Feed -->
        <div class="feed-container">
          <div class="feed-header">
            <span>Camera Feed</span>
          </div>
          <div class="feed-content">
            <div class="feed-Placeholder" id="camera-feed">Camera feed not started</div>
            <div class="error-message" id="camera-error"></div>
            </div>
        </div>

        <!-- Thermal Feed -->
        <div class="feed-container">
          <div class="feed-header">
            <span>Thermal Feed</span>
          </div>
          <div class="feed-content">
            <div class="feed-Placeholder" id="thermal-feed">Thermal feed not started</div>
            <div class="error-message" id="thermal-error"></div>
          </div>
        </div>

    <div class="servo-control-panel draggable hidden" id="servo-panel">
      <div id="angle-display" class="angle-display">V: 90° | H: 90°</div>
      <div class="arrow up"></div>
      <div class="arrow-group">
        <div class="arrow left"></div>
        <div class="arrow center"></div>
        <div class="arrow right"></div>
      </div>
      <div class="arrow down"></div>
    </div>
  </div>
  </div>

<script>
    document.addEventListener('DOMContentLoaded', () => {
      // API Endpoints
      const startCameraAPI = "http://100.124.235.42:8000/start-camera";
      const stopCameraAPI = "http://100.124.235.42:8000/stop-camera";
      const startThermalAPI = "http://100.124.235.42:8000/start-thermal";
      const stopThermalAPI = "http://100.124.235.42:8000/stop-thermal";
      const cameraFeedAPI = "http://100.124.235.42:8001/camera.mjpg";
      const thermalFeedAPI = "http://100.124.235.42:8002/thermal";
      const cameraVerifiedAPI = "http://100.124.235.42:8001/camera_verified";
      const thermalVerifiedAPI = "http://100.124.235.42:8002/thermal_verified";
      const startServoAPI = "http://100.124.235.42:8000/start-servo";
      const stopServoAPI = "http://100.124.235.42:8000/stop-servo";
      const panel = document.getElementById('servo-panel');
      const angleDisplay = document.getElementById('angle-display');

      // DOM elements
      const cameraFeed = document.getElementById('camera-feed');
      const thermalFeed = document.getElementById('thermal-feed');
      const cameraError = document.getElementById('camera-error');
      const thermalError = document.getElementById('thermal-error');
      const refreshBtn = document.getElementById('refresh-btn');
      const streamBtn = document.getElementById('stream-btn');
      const resetBtn = document.getElementById('reset-btn');
      const toggleBtn = document.getElementById('servo-toggle-btn');


      // State variables
      let isCorsVerified = false;
      let isStreaming = false;
      let isFirstClick = true;

      // Initialize UI
      streamBtn.style.backgroundColor = '#ff4444';
      streamBtn.disabled = false;

      refreshBtn.disabled = true;
      refreshBtn.style.backgroundColor = '#ff4444';


      toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('hidden');
        toggleBtn.classList.toggle('active');
      });
      
      function hideLoadingState() {
        const cameraFeed = document.getElementById('camera-feed');
        const thermalFeed = document.getElementById('thermal-feed');
        
        if (cameraFeed) cameraFeed.innerHTML = '<div class="feed-Placeholder">Camera feed not available</div>';
        if (thermalFeed) thermalFeed.innerHTML = '<div class="feed-Placeholder">Thermal feed not available</div>';
      }

      // Stream button click handler
      streamBtn.addEventListener('click', async () => {
        if (isFirstClick) {
          isFirstClick = false;
          await initializeServices();
          return;
        }
        
        if (!isCorsVerified && !isStreaming) {
          showAlert('warning', 'Please verify connection first');
          return;
        }
        
        if (!isStreaming) {
          await startStream();
        } else {
          await stopStream();
        }
      });

      async function initializeServices() {
        try {
          showLoadingState();

          // Disable refresh button & set red background
          refreshBtn.disabled = true;
          refreshBtn.style.backgroundColor = '#ff4444';

          // Wait for 3.5 seconds (or 3000 ms)
          setTimeout(() => {
            refreshBtn.disabled = false;
            refreshBtn.style.backgroundColor = '';  // Reset to default
          }, 3000);

          // Start both camera and thermal services
          const servicesStarted = await Promise.all([
            fetch(startCameraAPI, { 
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            }),
            fetch(startThermalAPI, { 
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            })
          ]);
          
          const [cameraRes, thermalRes] = servicesStarted;

          // Check if either service failed
          if (!cameraRes.ok && !thermalRes.ok) {
            throw new Error(
              'Services failed to start: ' +
              'Camera: ' + cameraRes.status + ', ' +
              'Thermal: ' + thermalRes.status
            );
          }
          showAlert('info', 'Services initialized. Please verify connection');

        streamBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4m4-4v16" fill="none" stroke="currentColor" stroke-width="2"/></svg> Ready to Stream';
        hideLoadingState(); // Stop spinner after successful init

        } catch (error) {
          console.error('Initialization error:', error);
          showAlert('error', 'Failed to initialize services');

          hideLoadingState(); // Stop spinner on failure too
          resetStreamButton();
        }
      }

      // CORS verification
      refreshBtn.addEventListener('click', async () => {
        try {
          refreshBtn.disabled = true;
          refreshBtn.innerHTML = '<span class="refresh-spinner"></span> Verifying...';
          
          // First check if servers are reachable
          const [cameraReachable, thermalReachable] = await Promise.all([
            testConnection(cameraVerifiedAPI),
            testConnection(thermalVerifiedAPI)
          ]);

resetBtn.addEventListener('click', async () => {
  resetBtn.disabled = true;
  resetBtn.textContent = 'Resetting...';

  try {
    const [stopCameraRes, stopThermalRes] = await Promise.all([
      fetch(stopCameraAPI, { method: 'GET' }),
      fetch(stopThermalAPI, { method: 'GET' })
    ]);

        if (stopCameraRes.ok && stopThermalRes.ok) {
          showAlert('success', 'Reset completed successfully.');
          resetBtn.classList.add('hidden'); // Hide button after successful reset
          
          // Reset the stream button to initial state
          resetStreamButton();
          
          // Also reset verification state
          isCorsVerified = false;
          refreshBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>';
          refreshBtn.disabled = false;
          streamBtn.style.backgroundColor = '#ff4444';
        } else {
          showAlert('error', 'Reset failed. Please check server.');
        }
      } catch (error) {
        console.error('Reset failed:', error);
        showAlert('error', 'Reset failed due to network error.');
      } finally {
        resetBtn.disabled = false;
        resetBtn.textContent = 'Reset';
      }
    });
          
        // Show resetBtn only if either is unreachable
        if (!cameraReachable || !thermalReachable) {
          resetBtn.classList.remove('hidden'); // Show Reset button
        } else {
          resetBtn.classList.add('hidden'); // Hide Reset button
        }
  
          // Then verify endpoints
          const [cameraResponse, thermalResponse] = await Promise.all([
            fetch(cameraVerifiedAPI, { 
              headers: { 'Accept': 'application/json' }
            }).catch(e => ({ ok: false })),
            fetch(thermalVerifiedAPI, { 
              headers: { 'Accept': 'application/json' }
            }).catch(e => ({ ok: false }))
          ]);
          
          if (!cameraResponse.ok || !thermalResponse.ok) {
            throw new Error('Verification failed - check server logs');
          }
          
          isCorsVerified = true;
          streamBtn.style.backgroundColor = '#4CAF50';
          refreshBtn.innerHTML = '&#10003; Verified'; // ✓ (&#10003;) - Check 
          showAlert('success', 'Connection verified successfully!');

        const refresh = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg> Refresh';

        } catch (error) {
          console.error('Verification error:', error);
          refreshBtn.innerHTML = '&#10005; Failed';
          showAlert('error', error.message);
        } finally {
          setTimeout(() => {
            refreshBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>';
            refreshBtn.disabled = false;
          }, 2000);
        }
      });

      // Test server connection using GET instead of HEAD
      async function testConnection(url) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store'
          });
          return response.ok;
        } catch (error) {
          console.error('Connection failed for ' + url + ':', error);
          return false;
        }
      }
      
      async function startStream() {
      try {

        showLoadingState();
         // Show loading spinner while stopping services
          cameraFeed.innerHTML = '<div class="loading-spinner"></div>';
          thermalFeed.innerHTML = '<div class="loading-spinner"></div>';

        // Start the services again in case they were stopped
        const servicesStarted = await Promise.all([
          fetch(startCameraAPI, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          }),
          fetch(startThermalAPI, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          })
        ]);

        const [cameraRes, thermalRes] = servicesStarted;

          // Check if either service failed
          if (!cameraRes.ok && !thermalRes.ok) {
            throw new Error(
              'Services failed to start: ' +
              'Camera: ' + cameraRes.status + ', ' +
              'Thermal: ' + thermalRes.status
            );
          }

        // Clear previous error states
        cameraFeed.innerHTML = '';
        thermalFeed.innerHTML = '';

        const cameraImg = new Image();
        cameraImg.src = cameraFeedAPI + '?t=' + Date.now();
        cameraImg.className = 'feed-image';

        cameraImg.onload = () => {
          const width = cameraImg.naturalWidth;
          const height = cameraImg.naturalHeight;
          console.log("Camera Feed Size: " + width + "x" + height);

          cameraFeed.innerHTML = '';
          cameraFeed.appendChild(cameraImg);
        };
        cameraImg.onerror = () => {
          //cameraFeed.innerHTML = '<div class="feed-Placeholder">Camera feed error</div>';
          // Show loading spinner while retry to start services
          cameraFeed.innerHTML = '<div class="loading-spinner"></div>';
          console.error('Camera stream error - retrying in 1s...');
          setTimeout(() => {
            cameraImg.src = cameraFeedAPI + '?t=' + Date.now();
          }, 2000);
        };

        const thermalImg = new Image();
        thermalImg.src = thermalFeedAPI + '?t=' + Date.now();
        thermalImg.className = 'feed-image';

        thermalImg.onload = () => {
          thermalFeed.innerHTML = '';
          thermalFeed.appendChild(thermalImg);
        };
        thermalImg.onerror = () => {
          //thermalFeed.innerHTML = '<div class="feed-Placeholder">Thermal feed error</div>';
          // Show loading spinner while retry to start services
          thermalFeed.innerHTML = '<div class="loading-spinner"></div>';
          console.error('Thermal stream error - retrying in 1s...');
          setTimeout(() => {
            thermalImg.src = thermalFeedAPI + '?t=' + Date.now();
          }, 2000);
        };

        streamBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2"/></svg> Stop Stream';
        isStreaming = true;

      } catch (error) {
        console.error('Stream start error:', error);
        showAlert('error', 'Failed to start stream');
      }
    }

      async function stopStream() {
        try {

          // Show loading spinner while stopping services
          cameraFeed.innerHTML = '<div class="loading-spinner"></div>';
          thermalFeed.innerHTML = '<div class="loading-spinner"></div>';
          
          // Attempt to stop services
          const servicesStopped = await stopServices();

          // Update UI regardless
          cameraFeed.innerHTML = '<div class="feed-Placeholder">Camera feed stopped</div>';
          thermalFeed.innerHTML = '<div class="feed-Placeholder">Thermal feed stopped</div>';
          streamBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4m4-4v16" fill="none" stroke="currentColor" stroke-width="2"/></svg> Start Stream';
          isStreaming = false;       

        // Show alert depending on result
          if (servicesStopped) {
            showAlert('success', 'Stream stopped successfully');
          } else {
            showAlert('warning', 'Stream stopped.');
          }
          
        } catch (error) {
          console.error('Stream stop error:', error);
          showAlert('error', 'Error stopping stream');
        }
      }

      async function stopServices() {
        const [cameraStopRes, thermalStopRes] = await Promise.all([
          fetch(stopCameraAPI, { method: 'GET' }).catch(e => ({ ok: false })),
          fetch(stopThermalAPI, { method: 'GET' }).catch(e => ({ ok: false }))
        ]);

        if (!cameraStopRes.ok || !thermalStopRes.ok) {
          throw new Error('Failed to stop services');
        }
      }

      function showLoadingState() {
        cameraFeed.innerHTML = '<div class="loading-spinner"></div>';
        thermalFeed.innerHTML = '<div class="loading-spinner"></div>';
        cameraError.textContent = '';
        thermalError.textContent = '';
      }

      function resetStreamButton() {
        streamBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4m4-4v16" fill="none" stroke="currentColor" stroke-width="2"/></svg> Start Stream';
        streamBtn.style.backgroundColor = '#ff4444';
        isFirstClick = true;
        isStreaming = false;
      }

      function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-' + type;
        alertDiv.innerHTML = [
          '<div class="alert-icon">',
          type === 'success' ? '&#10003;' : 
          type === 'error' ? '&#10005; ' : 
          type === 'info' ? '&#9432;' :
          type === 'warning' ? '&#9888;' : '',
          '</div>',
          '<div class="alert-message">', message, '</div>'
        ].join('');

        document.body.appendChild(alertDiv);

        setTimeout(() => {
          alertDiv.classList.add('fade-out');
          setTimeout(() => document.body.removeChild(alertDiv), 500);
        }, 3000);
      }
      
    
    //Servo Control Script
    const SERVER = "http://100.124.235.42:8003";  //RPi backend URL

    let servoRunning = false;  // Track state

    const controlBtn = document.getElementById('servo-toggle-btn');

    controlBtn.addEventListener('click', () => {
      const apiUrl = servoRunning ? stopServoAPI : startServoAPI;

      fetch(apiUrl, { method: 'GET' })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          // Toggle state after successful API call
          servoRunning = !servoRunning;

          // Optional: Change button text or style based on state
          controlBtn.innerHTML = servoRunning ? '&#10006; Exit' : 'Control';
        })
        .catch(error => {
          console.error('Error calling API:', error);
        });
    });

    let verticalAngle = 90;
    let horizontalAngle = 90;
    const maxAngle = 180;
    const minAngle = 0;
    const step = 10;

    updateAngleDisplay();

    let isDragging = false;
    let offset = { x: 0, y: 0 };

    panel.addEventListener('mousedown', (e) => {
      isDragging = true;
      offset.x = e.clientX - panel.offsetLeft;
      offset.y = e.clientY - panel.offsetTop;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        panel.style.left = (e.clientX - offset.x) + 'px';
        panel.style.top = (e.clientY - offset.y) + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    const arrows = document.querySelectorAll('.arrow');

    arrows.forEach(arrow => {
      arrow.addEventListener('click', () => {
        const direction = arrow.classList.contains('up') ? 'up' :
                          arrow.classList.contains('down') ? 'down' :
                          arrow.classList.contains('left') ? 'left' :
                          arrow.classList.contains('right') ? 'right' : 'center';

        if (direction === 'up') {
          verticalAngle = Math.max(minAngle, verticalAngle - step);
          sendServoCommand('vertical', verticalAngle);
        } else if (direction === 'down') {
          verticalAngle = Math.min(maxAngle, verticalAngle + step);
          sendServoCommand('vertical', verticalAngle);
        } else if (direction === 'left') {
          horizontalAngle = Math.max(minAngle, horizontalAngle - step);
          sendServoCommand('horizontal', horizontalAngle);
        } else if (direction === 'right') {
          horizontalAngle = Math.min(maxAngle, horizontalAngle + step);
          sendServoCommand('horizontal', horizontalAngle);
        } else if (direction === 'center') {
          verticalAngle = 90;
          horizontalAngle = 90;
          sendServoCommand('vertical', verticalAngle);  
          sendServoCommand('horizontal', horizontalAngle);
        }

        updateAngleDisplay();
        highlightArrow(arrow);
      });
    });

     document.addEventListener('keydown', (event) => {
  if (!servoRunning) return;

  let arrow = null;

  switch (event.key) {
    case 'ArrowUp':
      verticalAngle = Math.max(minAngle, verticalAngle - step);
      sendServoCommand('vertical', verticalAngle);
      arrow = document.querySelector('.arrow.up');
      break;

    case 'ArrowDown':
      verticalAngle = Math.min(maxAngle, verticalAngle + step);
      sendServoCommand('vertical', verticalAngle);
      arrow = document.querySelector('.arrow.down');
      break;

    case 'ArrowLeft':
      horizontalAngle = Math.max(minAngle, horizontalAngle - step);
      sendServoCommand('horizontal', horizontalAngle);
      arrow = document.querySelector('.arrow.left');
      break;

    case 'ArrowRight':
      horizontalAngle = Math.min(maxAngle, horizontalAngle + step);
      sendServoCommand('horizontal', horizontalAngle);
      arrow = document.querySelector('.arrow.right');
      break;

    case '0':
    case 'c':
    case 'C':
      verticalAngle = 90;
      horizontalAngle = 90;
      sendServoCommand('vertical', verticalAngle);
      sendServoCommand('horizontal', horizontalAngle);
      arrow = document.querySelector('.arrow.center');
      break;

    default:
      return; // Don't proceed if key not handled
  }

  event.preventDefault(); // Prevent page scrolling
  updateAngleDisplay();

  if (arrow) highlightArrow(arrow);
});

    function sendServoCommand(axis, angle) {
      fetch(SERVER + "/servo?axis=" + axis + "&angle=" + angle)
        .then(response => response.text())
        .then(data => console.log("Backend response:", data))
        .catch(error =>  console.error("Error:", error)
        );
    }

    function updateAngleDisplay() {
      angleDisplay.textContent = "V: " + verticalAngle + "° | H: " + horizontalAngle + "°";
    }

    function highlightArrow(arrow) {
      arrows.forEach(a => a.classList.remove('active'));
      arrow.classList.add('active');
      setTimeout(() => arrow.classList.remove('active'), 300);
    }    
});

</script>`;
    } else if (isPulse) {
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
  ${timerScript}
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #121212;
      color: #FFFFFF;
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }
    
    .pulse-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px;
      box-sizing: border-box;
      gap: 16px;
      max-width: 2000px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #1E1E1E;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .controls {
      display: flex;
      gap: 12px;
    }
 
    .device-info {
      display: flex;
      flex-direction: column;
    }
 
     .device-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
 
    #device-timer {
      margin-left: 10px;
    }
 
    .device-name {
      font-size: 18px;
      font-weight: 600;
      color: #FF6A00;
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      word-break: break-word;
      line-height: 1.2;
      text-align: center;
    }
    
    .control-btn {
      background: #2A2A2A;
      border: none;
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    
    .control-btn:hover {
      background: #FF6A00;
    }
    
    .control-btn.active {
      background: #FF6A00;
    }
    
    .pulse-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .pulse-viewer-container {
      flex: 1;
      background: #1E1E1E;
      border: groove 1px #7c7c7c;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    .pulse-viewer-header {
      padding: 8px 12px;
      background: rgba(0,0,0,0.3);
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .pulse-viewer-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .pulse-viewer-placeholder {
      color: #BBBBBB;
      font-size: 16px;
    }
    
    .pulse-viewer-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    .viewer-actions {
      display: flex;
      gap: 8px;
    }
    
    .viewer-action-btn {
      background: transparent;
      border: none;
      color: #BBBBBB;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .viewer-action-btn:hover {
      color: #FFFFFF;
      background: rgba(255,255,255,0.1);
    }
    
    .fullscreen-icon {
      width: 16px;
      height: 16px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
 
    .alert {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background: #2A2A2A;
      color: white;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
    }
 
    .alert-success {
      border-left: 4px solid #4CAF50;
    }
 
    .alert-error {
      border-left: 4px solid #F44336;
    }
 
    .alert-info {
      border-left: 4px solid #2196F3;
    }
 
    .fade-out {
      opacity: 0;
      transition: opacity 0.5s;
    }
    
    /* Fullscreen styles */
    .pulse-viewer-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      border-radius: 0;
      margin: 0;
      padding: 0;
    }
    
    .pulse-viewer-container.fullscreen .pulse-viewer-content {
      height: calc(100% - 36px); /* Account for header height */
    }
  </style>
</head>
<body>
  <div class="pulse-container">
    <div class="header">
      <div class="device-info">
        <div class="device-name-row">
          <div class="device-name">${device.name}</div>
          <div id="device-timer">--:--:--</div>
        </div>
      </div>
      <div class="controls">
        <button class="control-btn" id="launch-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Launch PulseView
        </button>
      </div>
    </div>
 
    <div class="pulse-content">
      <div class="pulse-viewer-container" id="pulse-viewer-container">
        <div class="pulse-viewer-header">
          <span>PulseView</span>
          <div class="viewer-actions">
            <button class="viewer-action-btn" id="fullscreen-btn" title="Toggle fullscreen">
              <svg class="fullscreen-icon" viewBox="0 0 24 24" id="fullscreen-icon">
                <path d="M7 7h4V5H5v6h2V7zm10 0h-4V5h6v6h-2V7zm-10 10h4v2H5v-6h2v4zm10 0h-4v2h6v-6h-2v4z" 
                      stroke="currentColor" fill="none" stroke-width="1.5"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="pulse-viewer-content">
          <div class="pulse-viewer-placeholder" id="pulse-viewer-feed">PulseView not launched</div>
          <iframe
            id="pulse-viewer-iframe"
            class="pulse-viewer-iframe"
            allow="fullscreen"
            style="display: none;"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const launchBtn = document.getElementById('launch-btn');
      const pulseViewerFeed = document.getElementById('pulse-viewer-feed');
      const pulseViewerIframe = document.getElementById('pulse-viewer-iframe');
      const fullscreenBtn = document.getElementById('fullscreen-btn');
      const fullscreenIcon = document.getElementById('fullscreen-icon');
      const pulseViewerContainer = document.getElementById('pulse-viewer-container');
      const ipAddress = "${ipAddress}";
 
      function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = \`alert alert-\${type}\`;
        alertDiv.innerHTML = \`
          <div>\${message}</div>
        \`;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
          alertDiv.classList.add('fade-out');
          setTimeout(() => document.body.removeChild(alertDiv), 500);
        }, 3000);
      }
      
      // Fullscreen functionality
      function toggleFullscreen() {
        if (!document.fullscreenElement) {
          pulseViewerContainer.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
            showAlert('error', 'Fullscreen failed: ' + err.message);
          });
        } else {
          document.exitFullscreen();
        }
      }
      
      // Update fullscreen button icon based on state
      function updateFullscreenButton() {
        if (document.fullscreenElement) {
          fullscreenIcon.innerHTML = '<path d="M5 16h4v4h2v-6H5v2zm10-10h-4V2h-2v6h6V6zm-10 8h4v4h2v-6H5v2zm10-8h-4V2h-2v6h6V6z" stroke="currentColor" fill="none" stroke-width="1.5"/>';
          fullscreenBtn.setAttribute('title', 'Exit fullscreen');
        } else {
          fullscreenIcon.innerHTML = '<path d="M7 7h4V5H5v6h2V7zm10 0h-4V5h6v6h-2V7zm-10 10h4v2H5v-6h2v4zm10 0h-4v2h6v-6h-2v4z" stroke="currentColor" fill="none" stroke-width="1.5"/>';
          fullscreenBtn.setAttribute('title', 'Enter fullscreen');
        }
      }
      
      // Event listeners for fullscreen changes
      document.addEventListener('fullscreenchange', updateFullscreenButton);
      fullscreenBtn.addEventListener('click', toggleFullscreen);

      // Launch PulseView control
      launchBtn.addEventListener('click', async () => {
        if (launchBtn.textContent.includes('Launch')) {
          // Show loading state
          pulseViewerFeed.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">' +
            '<div style="border: 4px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top: 4px solid #FF6A00; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>' +
            '<p style="margin-top: 10px;">Launching PulseView...</p>' +
            '</div>';
          
          try {
             const response = await fetch(\`http://\${ipAddress}:7417/launch_pulseview\`, {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Accept': 'application/json'
              }
            });
 
            const data = await response.json();

            if (!response.ok || !data.success) {
              throw new Error(data.message || 'Failed to launch PulseView');
            }
            
            showAlert('success', 'PulseView launched successfully');
            
            // Then load the PulseView interface after a short delay to ensure it's ready
            setTimeout(() => {
              pulseViewerIframe.src = \`http://\${ipAddress}:7417/\`;
              pulseViewerIframe.onload = () => {
                pulseViewerFeed.style.display = 'none';
                pulseViewerIframe.style.display = 'block';
                launchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Close PulseView';
                launchBtn.classList.add('active');
              };
              
              pulseViewerIframe.onerror = () => {
                pulseViewerFeed.innerHTML = '<div style="color: #ff4d4d;">Failed to load PulseView interface</div>';
                launchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Retry';
                launchBtn.classList.remove('active');
              };
            }, 1000);
            
          } catch (error) {
            console.error('PulseView launch error:', error);
            pulseViewerFeed.innerHTML = \`<div style="color: #ff4d4d;">\${error.message || 'Failed to launch PulseView'}</div>\`;
            launchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Retry';
            showAlert('error', error.message || 'Failed to launch PulseView');
          }
        } else {
          // Close PulseView
          pulseViewerIframe.src = '';
          pulseViewerIframe.style.display = 'none';
          pulseViewerFeed.style.display = 'block';
          pulseViewerFeed.innerHTML = '<div class="pulse-viewer-placeholder">PulseView not launched</div>';
          launchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Launch PulseView';
          launchBtn.classList.remove('active');
        }
      });
    });
  </script>
</body>
</html>`;
    } else if (isPC) {
      const ip_add = "100.109.50.57";
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
  ${timerScript}
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #121212;
      color: #FFFFFF;
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }
   
    .pc-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px;
      box-sizing: border-box;
      gap: 16px;
      max-width: 2000px;
      margin: 0 auto;
    }
   
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #1E1E1E;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
   
    .controls {
      display: flex;
      gap: 12px;
    }
   
    .control-btn {
      background: #2A2A2A;
      border: none;
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }


    .device-info {
      display: flex;
      flex-direction: column;
    }


     .device-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }


    #device-timer {
      margin-left: 10px;
    }


    .device-name {
      font-size: 18px;
      font-weight: 600;
      color: #FF6A00;
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      word-break: break-word;
      line-height: 1.2;
      text-align: center;
    }
   
    .control-btn:hover {
      background: #FF6A00;
    }
   
    .control-btn.active {
      background: #FF6A00;
    }
   
    .pc-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
   
    .remote-desktop-container {
      flex: 1;
      background: #1E1E1E;
      border: groove 1px #7c7c7c;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }
   
    .remote-desktop-header {
      padding: 8px 12px;
      background: rgba(0,0,0,0.3);
      font-size: 14px;
    }
   
    .remote-desktop-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
   
    .remote-desktop-placeholder {
      color: #BBBBBB;
      font-size: 16px;
    }
   
    .remote-desktop-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
   
    .remote-desktop-controls {
      position: absolute;
      bottom: 16px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: 8px;
    }
   
    .remote-desktop-btn {
      background: rgba(0,0,0,0.7);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
   
    .remote-desktop-btn:hover {
      background: #FF6A00;
      transform: scale(1.1);
    }


    /* Fullscreen button styling */
    .fullscreen-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0,0,0,0.7);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 6px;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      z-index: 1000;
    }


    .fullscreen-btn:hover {
      background: #FF6A00;
    }


    .fullscreen-btn.show {
      display: flex;
    }


    /* Fullscreen styles */
    .remote-desktop-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      border-radius: 0;
    }


    .remote-desktop-container.fullscreen .remote-desktop-header {
      display: none;
    }

    #unLockBtn {
      background: #0971b3;
    }

    /* Spinning animation for loading */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
   
    .pc-info {
      background: #1E1E1E;
      border-radius: 8px;
      padding: 16px;
    }
   
    .pc-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
   
    .pc-box {
      background: #2A2A2A;
      padding: 12px;
      border-radius: 8px;
    }
   
    .pc-label {
      font-size: 12px;
      color: #BBBBBB;
      margin-bottom: 4px;
    }
   
    .pc-value {
      font-size: 14px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="pc-container">
    <div class="header">
      <div class="device-info">
        <div class="device-name-row">
          <div class="device-name">${device.name}</div>
          <div id="device-timer"></div>
        </div>
      </div>
      <div class="controls">
        <button class="control-btn" id="connect-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Connect
        </button>
        <button class="control-btn" onclick="unlock()" id="unLockBtn">Crtl + Alt + Del</button>
      </div>
    </div>


    <div class="pc-content">
      <div class="remote-desktop-container" id="remote-desktop-container">
        <!-- Fullscreen button -->
        <button class="fullscreen-btn" id="fullscreen-btn">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
       
        <div class="remote-desktop-header">
          <span>Remote Desktop</span>
        </div>
        <div class="remote-desktop-content">
          <div class="remote-desktop-placeholder" id="remote-desktop-feed">Not connected</div>
          <iframe
            id="remote-desktop-iframe"
            class="remote-desktop-iframe"
            allow="fullscreen"
            style="display: none;"
          ></iframe>
        </div>
      </div>
    </div>
  </div>


  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const connectBtn = document.getElementById('connect-btn');
      const remoteDesktopFeed = document.getElementById('remote-desktop-feed');
      const remoteDesktopIframe = document.getElementById('remote-desktop-iframe');
      const remoteDesktopContainer = document.getElementById('remote-desktop-container');
      const fullscreenBtn = document.getElementById('fullscreen-btn');
      let isConnected = false;
     
      // Connect/Disconnect control
      connectBtn.addEventListener('click', async () => {
        if (!isConnected) {
          // Connect
          // Show loading state
          remoteDesktopFeed.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">' +
            '<div style="border: 4px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top: 4px solid #FF6A00; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>' +
            '<p style="margin-top: 10px;">Connecting to ${ip_add}...</p>' +
            '</div>';
         
          remoteDesktopFeed.style.display = 'block';


          try {
            const data = await testConnection('http://${ip_add}:8000/start_stream')
            const data1 = await testConnection1('http://${ip_add}:5000/start_stream')
            if (data.status === 'already running' || data.status === 'started') {
              remoteDesktopFeed.innerHTML = "<img id='remoteDesktopImg' src='http://${ip_add}:9000/stream?advance_headers=1&dual_final_frames=1' style='width: 100%; height: 100%; object-fit: contain;' />";
             
              // Update button to disconnect
              connectBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Disconnect';
              connectBtn.classList.add('active');
              isConnected = true;

              // Show fullscreen button
              fullscreenBtn.classList.add('show');
             
              setupMouseAndKeyboard();
            } else {
              throw new Error('Stream failed to start');
            }
          } catch (error) {
            console.error(error.message);
            remoteDesktopFeed.innerHTML = '<div class="remote-desktop-placeholder">Connection failed</div>';
          }
        } else {
          // Disconnect
          await disconnect();
        }
      });


      // Fullscreen control
      fullscreenBtn.addEventListener('click', toggleFullscreen);

      // ESC key to exit fullscreen
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && remoteDesktopContainer.classList.contains('fullscreen')) {
          exitFullscreen();
        }
      });


      // Fullscreen change event
      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
          remoteDesktopContainer.classList.remove('fullscreen');
          updateFullscreenButton(false);
        }
      });


      async function disconnect() {
       
        // Reset UI
        remoteDesktopIframe.src = '';
        remoteDesktopIframe.style.display = 'none';
        remoteDesktopFeed.style.display = 'block';
        remoteDesktopFeed.innerHTML = '<div class="remote-desktop-placeholder">Not connected</div>';
        connectBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Connect';
        connectBtn.classList.remove('active');
        isConnected = false;
       
        // Hide fullscreen button
        fullscreenBtn.classList.remove('show');
       
        // Exit fullscreen if active
        if (remoteDesktopContainer.classList.contains('fullscreen')) {
          exitFullscreen();
        }
      }

      function toggleFullscreen() {
        if (remoteDesktopContainer.classList.contains('fullscreen')) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
      }


      function enterFullscreen() {
        remoteDesktopContainer.classList.add('fullscreen');
        remoteDesktopContainer.requestFullscreen().catch(err => {
          console.error('Error entering fullscreen:', err);
        });
        updateFullscreenButton(true);
      }


      function exitFullscreen() {
        remoteDesktopContainer.classList.remove('fullscreen');
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => {
            console.error('Error exiting fullscreen:', err);
          });
        }
        updateFullscreenButton(false);
      }


      function updateFullscreenButton(isFullscreen) {
        if (isFullscreen) {
          fullscreenBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        } else {
          fullscreenBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        }
      }


      function setupMouseAndKeyboard() {
        const video = document.getElementById("remoteDesktopImg");


        video.addEventListener("click", () => {
          console.log('clicked');
          video.requestPointerLock = video.requestPointerLock || video.mozRequestPointerLock || video.webkitRequestPointerLock;
          video.requestPointerLock();
        });


        document.addEventListener("keydown", function (e) {
          if (document.pointerLockElement === video) {
            const jsCodes = [];
            if (e.ctrlKey) jsCodes.push(17);
            if (e.shiftKey) jsCodes.push(16);
            if (e.altKey) jsCodes.push(18);
            if (e.metaKey || e.key === "Meta") jsCodes.push(91);
            const isModifier = [16, 17, 18, 91].includes(e.keyCode);
            if (!isModifier) jsCodes.push(e.keyCode);


            fetch("http://${ip_add}:5000/keyboard", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ keycodes: jsCodes })
            });


            e.preventDefault();
          }
        });


        function smoothMouseDelta(dx, dy, threshold = 1) {
          dx = Math.abs(dx) >= threshold ? dx : 0;
          dy = Math.abs(dy) >= threshold ? dy : 0;
          return [dx, dy];
        }


        document.addEventListener("mousemove", (e) => {
          if (document.pointerLockElement === video) {
            let [dx, dy] = smoothMouseDelta(e.movementX, e.movementY);
            fetch("http://${ip_add}:5000/mouse", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ x: dx, y: dy, buttons: e.buttons, wheel: 0 })
            });
          }
        });


        document.addEventListener("mousedown", (e) => {
          if (document.pointerLockElement === video) {
            fetch("http://${ip_add}:5000/mouse", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ x: 0, y: 0, buttons: (1 << e.button), wheel: 0 })
            });
          }
        });


        document.addEventListener("mouseup", (e) => {
          if (document.pointerLockElement === video) {
            fetch("http://${ip_add}:5000/mouse", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ x: 0, y: 0, buttons: 0, wheel: 0 })
            });
          }
        });


        document.addEventListener("wheel", (e) => {
          if (document.pointerLockElement === video) {
            fetch("http://${ip_add}:5000/mouse", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ x: 0, y: 0, buttons: 0, wheel: e.deltaY > 0 ? 0xFF : 0x01 })
            });
          }
        });
      }
    });

    async function testConnection(url) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            cache: 'no-store'
          });
          const data = await response.json();
          console.log('Parsed data:', data);
          return data;
        } catch (error) {
          console.error('Connection failed for ' + url + ':', error);
          return {
            ok: false,
            status: 0,
            statusText: error.message
          };
        }
      }

      async function testConnection1(url) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store'
          });
          const data = await response.json();
          console.log('Parsed data:', data);
          return data;
        } catch (error) {
          console.error('Connection failed for ' + url + ':', error);
          return {
            ok: false,
            status: 0,
            statusText: error.message
          };
        }
      }

      function unlock(){
        console.log('inside unlock function')
        try{
          testConnection('http://${ip_add}:5000/ctrl_alt_del')
        }catch(error){
          console.log(error.message)
        };
      }
  </script>
</body>
</html>`;
    } else if (isStream1 || isStream2) {
      const ip_add = "100.109.50.57";
      const streamPort = isStream1 ? "9003" : "8888";
      const streamHost = isStream1 ? "9002" : "8080";

      const port = `${ip_add}:${streamPort}`;
      const portAlt = `${ip_add}:${streamHost}`;
      const testConnection = isStream1
        ? `http://${port}/start_stream1`
        : `http://${port}/start_stream2`;
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
  ${timerScript}
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #121212;
      color: #FFFFFF;
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }
   
    .pc-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px;
      box-sizing: border-box;
      gap: 16px;
      max-width: 2000px;
      margin: 0 auto;
    }
   
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #1E1E1E;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
   
    .controls {
      display: flex;
      gap: 12px;
    }
   
    .control-btn {
      background: #2A2A2A;
      border: none;
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }


    .device-info {
      display: flex;
      flex-direction: column;
    }


     .device-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }


    #device-timer {
      margin-left: 10px;
    }


    .device-name {
      font-size: 18px;
      font-weight: 600;
      color: #FF6A00;
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      word-break: break-word;
      line-height: 1.2;
      text-align: center;
    }
   
    .control-btn:hover {
      background: #FF6A00;
    }
   
    .control-btn.active {
      background: #FF6A00;
    }
   
    .pc-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
   
    .remote-desktop-container {
      flex: 1;
      background: #1E1E1E;
      border: groove 1px #7c7c7c;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }
   
    .remote-desktop-header {
      padding: 8px 12px;
      background: rgba(0,0,0,0.3);
      font-size: 14px;
    }
   
    .remote-desktop-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
   
    .remote-desktop-placeholder {
      color: #BBBBBB;
      font-size: 16px;
    }
   
    .remote-desktop-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
   
    .remote-desktop-controls {
      position: absolute;
      bottom: 16px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: 8px;
    }
   
    .remote-desktop-btn {
      background: rgba(0,0,0,0.7);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
   
    .remote-desktop-btn:hover {
      background: #FF6A00;
      transform: scale(1.1);
    }


    /* Fullscreen button styling */
    .fullscreen-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0,0,0,0.7);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 6px;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      z-index: 1000;
    }


    .fullscreen-btn:hover {
      background: #FF6A00;
    }


    .fullscreen-btn.show {
      display: flex;
    }


    /* Fullscreen styles */
    .remote-desktop-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      border-radius: 0;
    }


    .remote-desktop-container.fullscreen .remote-desktop-header {
      display: none;
    }


    /* Spinning animation for loading */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
   
    .pc-info {
      background: #1E1E1E;
      border-radius: 8px;
      padding: 16px;
    }
   
    .pc-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
   
    .pc-box {
      background: #2A2A2A;
      padding: 12px;
      border-radius: 8px;
    }
   
    .pc-label {
      font-size: 12px;
      color: #BBBBBB;
      margin-bottom: 4px;
    }
   
    .pc-value {
      font-size: 14px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="pc-container">
    <div class="header">
      <div class="device-info">
        <div class="device-name-row">
          <div class="device-name">${device.name}</div>
          <div id="device-timer"></div>
        </div>
      </div>
      <div class="controls">
        <button class="control-btn" id="connect-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Connect
        </button>
      </div>
    </div>


    <div class="pc-content">
      <div class="remote-desktop-container" id="remote-desktop-container">
        <!-- Fullscreen button -->
        <button class="fullscreen-btn" id="fullscreen-btn">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
       
        <div class="remote-desktop-header">
          <span>Remote Desktop</span>
        </div>
        <div class="remote-desktop-content">
          <div class="remote-desktop-placeholder" id="remote-desktop-feed">Not connected</div>
          <iframe
            id="remote-desktop-iframe"
            class="remote-desktop-iframe"
            allow="fullscreen"
            style="display: none;"
          ></iframe>
        </div>
      </div>
    </div>
  </div>


  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const connectBtn = document.getElementById('connect-btn');
      const remoteDesktopFeed = document.getElementById('remote-desktop-feed');
      const remoteDesktopIframe = document.getElementById('remote-desktop-iframe');
      const remoteDesktopContainer = document.getElementById('remote-desktop-container');
      const fullscreenBtn = document.getElementById('fullscreen-btn');
      let isConnected = false;
     
      // Connect/Disconnect control
      connectBtn.addEventListener('click', async () => {
        if (!isConnected) {
          // Connect
          // Show loading state
          remoteDesktopFeed.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">' +
            '<div style="border: 4px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top: 4px solid #FF6A00; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>' +
            '<p style="margin-top: 10px;">Connecting to ${ip_add}...</p>' +
            '</div>';
         
          remoteDesktopFeed.style.display = 'block';


          try {
            const data = await testConnection1('${testConnection}')
            console.log('data', data)
            if (data.status !== 'failed') {
              remoteDesktopFeed.innerHTML = "<img id='remoteDesktopImg' src='http://${portAlt}/stream?advance_headers=1&dual_final_frames=1' style='width: 100%; height: 100%; object-fit: contain;' />";
             
              // Update button to disconnect
              connectBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Disconnect';
              connectBtn.classList.add('active');
              isConnected = true;
             
              // Show fullscreen button
              fullscreenBtn.classList.add('show');
            } else {
              throw new Error('Stream failed to start');
            }
          } catch (error) {
            console.error(error.message);
            remoteDesktopFeed.innerHTML = '<div class="remote-desktop-placeholder">Connection failed</div>';
          }
        } else {
          // Disconnect
          await disconnect();
        }
      });


      // Fullscreen control
      fullscreenBtn.addEventListener('click', toggleFullscreen);


      // ESC key to exit fullscreen
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && remoteDesktopContainer.classList.contains('fullscreen')) {
          exitFullscreen();
        }
      });


      // Fullscreen change event
      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
          remoteDesktopContainer.classList.remove('fullscreen');
          updateFullscreenButton(false);
        }
      });


      async function disconnect() {
       
        // Reset UI
        remoteDesktopIframe.src = '';
        remoteDesktopIframe.style.display = 'none';
        remoteDesktopFeed.style.display = 'block';
        remoteDesktopFeed.innerHTML = '<div class="remote-desktop-placeholder">Not connected</div>';
        connectBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Connect';
        connectBtn.classList.remove('active');
        isConnected = false;
       
        // Hide fullscreen button
        fullscreenBtn.classList.remove('show');
       
        // Exit fullscreen if active
        if (remoteDesktopContainer.classList.contains('fullscreen')) {
          exitFullscreen();
        }
      }


      function toggleFullscreen() {
        if (remoteDesktopContainer.classList.contains('fullscreen')) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
      }


      function enterFullscreen() {
        remoteDesktopContainer.classList.add('fullscreen');
        remoteDesktopContainer.requestFullscreen().catch(err => {
          console.error('Error entering fullscreen:', err);
        });
        updateFullscreenButton(true);
      }


      function exitFullscreen() {
        remoteDesktopContainer.classList.remove('fullscreen');
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => {
            console.error('Error exiting fullscreen:', err);
          });
        }
        updateFullscreenButton(false);
      }


      function updateFullscreenButton(isFullscreen) {
        if (isFullscreen) {
          fullscreenBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        } else {
          fullscreenBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        }
      }

      async function testConnection(url) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            cache: 'no-store',
            headers: { 'Accept': 'application/json' }
          });
          const data = await response.json();
          console.log('Parsed data:', data);
          return data;
        } catch (error) {
          console.error('Connection failed for ' + url + ':', error);
          return {
            ok: false,
            status: 0,
            statusText: error.message
          };
        }
      }


      async function testConnection1(url) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            headers: { 'Accept': 'application/json' }
          });
          const data = await response.json();
          console.log('Parsed data:', data);
          return data;
        } catch (error) {
          console.error('Connection failed for ' + url + ':', error);
          return {
            ok: false,
            status: 0,
            statusText: error.message
          };
        }
      }
    });
  </script>
</body>
</html>`;
    } else if (isOs) {
      const ip_add = "100.109.50.57";
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
  ${timerScript}
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #121212;
      color: #FFFFFF;
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }

    .os-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px;
      box-sizing: border-box;
      gap: 16px;
      max-width: 2000px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #1E1E1E;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .device-info {
      display: flex;
      flex-direction: column;
    }

    .device-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .device-name {
      font-size: 18px;
      font-weight: 600;
      color: #FF6A00;
      word-break: break-word;
      text-align: center;
    }

    #device-timer {
      margin-left: 10px;
    }

    .controls {
      display: flex;
      gap: 12px;
    }

    .control-btn {
      background: #2A2A2A;
      border: none;
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .control-btn:hover {
      background: #FF6A00;
    }

    .control-btn.active {
      background: #FF6A00;
    }

    .os-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .container {
      background: #1E1E1E;
      border: 2px solid #0971b3;
      border-radius: 12px;
      padding: 0px 40px 40px 40px;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      text-align: center;
      margin: 40px auto;
    }

    h1 {
      color: #FFFFFF;
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 30px;
      border-bottom: 2px solid #0971b3;
      padding-bottom: 15px;
    }

    h2 {
      color: #FFFFFF;
      font-size: 20px;
      font-weight: 500;
      margin: 30px 0 20px 0;
    }

    .button-group {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    button {
      background: #ff6a00;
      border: none;
      color: #FFFFFF;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.3s ease;
      min-width: 100px;
    }

    button:hover:not(:disabled) {
      background: #e55a00;
    }

    button:disabled {
      background: #666;
      cursor: not-allowed;
      opacity: 0.6;
    }

    #unmountBtn {
      background: #0971b3;
    }

    #unmountBtn:hover {
      background: #085a94;
    }

    .iso-container {
      background: #2A2A2A;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      min-height: 200px;
      max-height: 300px;
      overflow-y: auto;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    li {
      cursor: pointer;
      padding: 12px 16px;
      border: 1px solid #444;
      margin: 8px 0;
      border-radius: 6px;
      background: #1A1A1A;
      transition: all 0.3s ease;
      text-align: left;
    }

    li:hover {
      border-color: #ff6a00;
      background: #333;
    }

    li.selected {
      background: #0971b3;
      border-color: #0971b3;
      color: #FFFFFF;
      font-weight: bold;
    }

    .status {
      background: #2A2A2A;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 15px;
      margin-top: 20px;
      min-height: 20px;
      color: #ff6a00;
      font-weight: 500;
    }

    .empty-state {
      color: #888;
      font-style: italic;
      padding: 40px 20px;
    }
  </style>
</head>
<body>
  <div class="os-container">
    <div class="header">
      <div class="device-info">
        <div class="device-name-row">
          <div class="device-name">${device.name}</div>
          <div id="device-timer"></div>
        </div>
      </div>
      <div class="controls">
        <button class="control-btn" onclick="fetchList()">List OS</button>
        <button class="control-btn" onclick="mountSelected()" id="mountBtn" disabled>Mount</button>
        <button class="control-btn" onclick="unmount()" id="unmountBtn" disabled>Unmount</button>
      </div>
    </div>

    <div class="os-content">
      <div class="container">
        <h2>Available ISO files:</h2>
        <div class="iso-container">
          <ul id="isoList">
            <div class="empty-state">Click "List OS" to load available ISO files</div>
          </ul>
        </div>
        <div class="status" id="status">Ready</div>
      </div>
    </div>
  </div>

  <script>
    let selectedFile = null;

    function fetchList() {
      document.getElementById("status").textContent = "Loading ISO files...";
      fetch("http://${ip_add}:9001/list")
        .then(res => res.json())
        .then(data => {
          const ul = document.getElementById("isoList");
          ul.innerHTML = "";
          selectedFile = null;
          document.getElementById("mountBtn").disabled = true;

          if (data.available_isos && data.available_isos.length > 0) {
            data.available_isos.forEach(file => {
              const li = document.createElement("li");
              li.textContent = file;
              li.onclick = () => {
                [...ul.children].forEach(child => child.classList.remove("selected"));
                li.classList.add("selected");
                selectedFile = file;
                document.getElementById("mountBtn").disabled = false;
                document.getElementById("status").textContent = \`Selected: \${file}\`;
              };
              ul.appendChild(li);
            });
            document.getElementById("status").textContent = \`Found \${data.available_isos.length} ISO files\`;
          } else {
            ul.innerHTML = '<div class="empty-state">No ISO files found</div>';
            document.getElementById("status").textContent = "No ISO files available";
          }
        })
        .catch(err => {
          document.getElementById("status").textContent = "Failed to fetch list";
          document.getElementById("isoList").innerHTML = '<div class="empty-state">Error loading ISO files</div>';
          console.error(err);
        });
    }

    function mountSelected() {
      if (!selectedFile) {
        document.getElementById("status").textContent = "No file selected";
        return;
      }

      document.getElementById("status").textContent = \`Mounting \${selectedFile}...\`;

      fetch(\`http://${ip_add}:9001/mount?filename=\${encodeURIComponent(selectedFile)}\`, {
        method: "POST"
      })
      .then(res => res.json())
      .then(data => {
        document.getElementById("status").textContent = \`Successfully mounted: \${data.iso}\`;
        document.getElementById("unmountBtn").disabled = false;
      })
      .catch(err => {
        document.getElementById("status").textContent = "Mount operation failed";
        console.error(err);
      });
    }

    function unmount() {
      document.getElementById("status").textContent = "Unmounting...";

      fetch("http://${ip_add}:9001/stop", {
        method: "POST"
      })
      .then(res => res.json())
      .then(data => {
        document.getElementById("status").textContent = "Successfully unmounted";
        selectedFile = null;
        document.getElementById("mountBtn").disabled = true;
        document.getElementById("unmountBtn").disabled = true;
        [...document.getElementById("isoList").children].forEach(child => {
          child.classList.remove("selected");
        });
      })
      .catch(err => {
        document.getElementById("status").textContent = "Unmount operation failed";
        console.error(err);
      });
    }
  </script>
</body>
</html>`;
    } else if (isAudio) {
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
  ${timerScript}
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #121212;
      color: #FFFFFF;
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }

    .audio-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px;
      box-sizing: border-box;
      gap: 16px;
      max-width: 2000px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #1E1E1E;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .device-info {
      display: flex;
      flex-direction: column;
    }

    .device-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    #device-timer {
      margin-left: 10px;
    }

    .device-name {
      font-size: 18px;
      font-weight: 600;
      color: #FF6A00;
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      word-break: break-word;
      line-height: 1.2;
      text-align: center;
    }

    .no-feed {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #BBBBBB; 
    font-size: 16px;
    text-align: center;
    }

    .no-feed p {
      margin-bottom: 20px;
    }

    .connect-btn1 {
      padding: 10px 20px;
      background-color: #ff6a00;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s;
    }

    .connect-btn1:hover {
      background-color: #2980b9;
    }

    .audio-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .audio-viewer-container {
      flex: 1;
      background: #1E1E1E;
      border: groove 1px #7c7c7c;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .audio-viewer-header {
      padding: 8px 12px;
      background: rgba(0,0,0,0.3);
      font-size: 14px;
    }

    .audio-viewer-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .audio-visualization {
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 10px;
    }

    .audio-visualization canvas {
      width: 100%;
      height: 150px;
      display: block;
    }

    .progress-container {
      width: 100%;
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      cursor: pointer;
      margin-bottom: 15px;
      position: relative;
    }

    .progress-bar {
      height: 100%;
      background: #0074c2;
      border-radius: 2px;
      transition: width 0.1s linear;
    }

    .time-display {
      display: flex;
      justify-content: space-between;
      margin-top: 5px;
      font-size: 12px;
      color: #777;
    }

    .audio-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 10px;
    }

    .play-button {
      background: none;
      border: none;
      font-size: 20px;
      color: #0074c2;
      cursor: pointer;
      padding: 8px;
    }

    .volume-container {
      display: flex;
      align-items: center;
      position: relative;
      margin-right: 90px;
    }

    .volume-icon {
      background: none;
      border: none;
      font-size: 20px;
      color: #0074c2;
      cursor: pointer;
      padding: 8px;
    }

    .volume-slider {
      position: absolute;
      flex-grow: 1;
      bottom: 17px;
      left: 40px;
      width: 100px;
      height: 6px;
      transform-origin: right bottom;
      background: #e0e0e0;
      border-radius: 3px;
      -webkit-appearance: none;
    }

    .volume-text {
      position: absolute;
      top: 35px;
      right: 0;
      font-size: 12px;
      color: #0074c2;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .volume-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #0074c2;
      cursor: pointer;
    }

    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #audio-source-select {
      padding: 6px;
      font-size: 14px;
      border-radius: 4px;
      border: 1px solid #ccc;
      background-color: #1E1E1E;
      color: #fff;
    }
    #header-connect-btn[disabled] {
      background-color: #555;
      cursor: not-allowed;
    }

  </style>
  <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
</head>

<body>
 <div class="audio-container">
  <div class="header">
    <div class="device-info">
      <div class="device-name-row">
        <div class="device-name">${device.name}</div>
        <div id="device-timer">--:--:--</div>
      </div>
    </div>
    <div class="header-controls">
      <select id="audio-source-select">
        <option value="">Select Source</option>
        <option value="HDMI">HDMI</option>
        <option value="Bluetooth">Bluetooth</option>
      </select>
      <button id="header-connect-btn" class="connect-btn1" disabled>Connect to Stream</button>
    </div>
  </div>

  <div class="audio-content">
    <div class="audio-viewer-container">
      <div class="audio-viewer-header">
        <span>Audio Stream</span>
      </div>
      <div class="audio-viewer-content">
        <div id="root"></div>
      </div>
    </div>
  </div>
</div>

<script type="text/babel">
const { useState, useRef, useEffect } = React;

const AudioStreamPage = () => {
  const [selectedSource, setSelectedSource] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [streamUrl, setStreamUrl] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const progressRef = useRef(null);

  const formatTime = time => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return \`\${minutes}:\${seconds < 10 ? '0' : ''}\${seconds}\`;
  };

  const handleConnect = async () => {
    const sourceDropdown = document.getElementById('audio-source-select');
    const selected = sourceDropdown && sourceDropdown.value || '';

    if (!selected) return;

    setSelectedSource(selected);
    setConnectionStatus("Connecting...");

    try {
      let apiUrl;
      if (selected === "HDMI") {
        apiUrl = "http://100.68.107.103:7123/audio";
      } else if (selected === "Bluetooth") {
        apiUrl = "YOUR_BLUETOOTH_ENDPOINT";
      }

      // Test connection
      const response = await fetch(apiUrl, { method: 'GET' });
      if (!response.ok) throw new Error("Connection failed");

      setStreamUrl(apiUrl);
      setIsConnected(true);
      setConnectionStatus("Connected");

      // Auto-play after short delay
      setTimeout(() => {
        setIsPlaying(true);
        if (audioRef.current) {
          audioRef.current.src = apiUrl;
          audioRef.current.volume = volume / 100;
          audioRef.current.play().catch(e => {
            console.error("Audio play failed:", e);
            setConnectionStatus("Playback Error");
          });
        }
      }, 500);

    } catch (error) {
      console.error("Connection failed:", error);
      setConnectionStatus("Connection Failed");
      setIsConnected(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Play error:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
      setIsMuted(newVolume == 0);
    }
    setTimeout(() => setShowVolumeSlider(false), 5000);
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * duration;
  };

  const simulateAudioData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const barWidth = 4;
    const gap = 2;
    const totalBars = Math.floor(width / (barWidth + gap));

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < totalBars; i++) {
      const isPlayed = (i / totalBars) < (currentTime / duration);
      const barHeight = (Math.sin(i + Date.now() / 200) + 1) / 2 * (height * 0.8);

      const x = i * (barWidth + gap);
      const y = (height - barHeight) / 2;
      ctx.fillStyle = isPlayed ? '#3498db' : '#ecf0f1';
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(simulateAudioData);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      simulateAudioData();
    } else {
      cancelAnimationFrame(animationRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () => setDuration(audio.duration || 1);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

    useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Ensure canvas width is set based on rendered DOM
      canvas.width = canvas.offsetWidth || 600;
    }
    }, []);

    useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 0.5;
        return next < duration ? next : duration;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, duration]);


  return (
    <div className="stream-container1">
      <button id="react-connect-btn" style={{ display: 'none' }} onClick={handleConnect}>React Connect</button>

      {!isConnected ? (
        <div className="no-feed">
          <p>{connectionStatus}</p>
        </div>
      ) : (
        <div className="audio-feed">
          <div className="connection-status">
            <span>Connected to: {selectedSource}</span>
            <span>Status: {connectionStatus}</span>
          </div>
          
          <div className="audio-visualization">
            <canvas ref={canvasRef} width="600" height="150" />
          </div>

          <div className="progress-container" ref={progressRef} onClick={handleProgressClick}>
            <div className="progress-bar" style={{ width: \`\${(currentTime / duration) * 100}%\` }}></div>
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="audio-controls">
            <button className="play-button" onClick={handlePlayPause}>
              {isPlaying ? <i className="fas fa-pause" /> : <i className="fas fa-play" />}
            </button>

            <div className="volume-container">
              <button
                className="volume-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVolumeSlider(!showVolumeSlider);
                }}
              >
                {isMuted ? <i className="fas fa-volume-mute" /> : <i className="fas fa-volume-up" />}
              </button>

              {showVolumeSlider && (
                <div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                  <div className="volume-text">{volume}%</div>
                </div>
              )}
            </div>
          </div>

          <audio ref={audioRef} loop src={streamUrl} />
        </div>
      )}
    </div>
  );
};

ReactDOM.render(<AudioStreamPage />, document.getElementById("root"));
</script>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('audio-source-select');
  const btn = document.getElementById('header-connect-btn');

  select.addEventListener('change', () => {
    btn.disabled = select.value === '';
  });

  btn.addEventListener('click', () => {
    const connectBtn = document.getElementById('react-connect-btn');
    if (connectBtn) {
      connectBtn.click();
      const streamContainer = document.querySelector('.stream-container1');
      if (streamContainer) {
        streamContainer.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});
</script>
</body>
</html>`;
    } else if (isSystemInfo || isUsbSharing || isFirmware) {
      let deviceIp = device.ipAddress.split("/")[0];
      let iframeURL = "";

      if (isSystemInfo) {
        iframeURL = `http://${deviceIp}:8001/`;
      } else if (isUsbSharing) {
        iframeURL = `http://100.112.10.66:8081/`;
      } else if (isFirmware) {
        iframeURL = `http://${deviceIp}:5002/`;
      }
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
  ${timerScript}
  <style>
      body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #121212;
      color: #FFFFFF;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    .three-drivers-container {
      display: flex;
      flex-direction: column;
      padding: 16px;
      box-sizing: border-box;
      max-width: 2000px;
      margin: 80px auto 0 auto; /* adds top margin to push content below fixed header */
      align-items: center;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #1E1E1E;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      position: fixed;
      top: 15px;
      left: 15px;
      right: 15px;
    }

    .device-info {
      display: flex;
      flex-direction: column;
    }

     .device-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    #device-timer {
      margin-left: 10px;
    }

    .device-name {
      font-size: 18px;
      font-weight: 600;
      color: #FF6A00;
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      word-break: break-word;
      line-height: 1.2;
      text-align: center;
    }

    .message {
      font-size: 1.5rem;
      color: #f44336;
    }
    iframe {
      width: 100%;
      height: calc(105vh - 150px);
      border: none;
      max-width: 2000px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

  </style>
</head>
<body>
<div class="three-drivers-container">
      <div class="header">
        <div class="device-info">
          <div class="device-name-row">
            <div class="device-name">${device.name}</div>
            <div id="device-timer">--:--:--</div>
          </div>
        </div>
      </div>
    <div id="message" class="message"></div>
    <iframe id="content-frame" src=""></iframe>
</div>

<script>
  const iframe = document.getElementById('content-frame');
  const messageDiv = document.getElementById('message');
  const url = '${iframeURL}';

  if (!url) {
    messageDiv.textContent = 'Unable to get response from the API';
  } else {
    iframe.src = url;

    let timeout = setTimeout(() => {
      messageDiv.textContent = 'No response';
      iframe.style.display = 'none';
    }, 5000); // wait 5 seconds for content to load

    iframe.onload = () => {
      clearTimeout(timeout);
      iframe.style.display = 'block';
      messageDiv.style.display = 'none';
    };

    iframe.onerror = () => {
      clearTimeout(timeout);
      messageDiv.textContent = 'No response';
    };
  }
</script>

</body>
</html>`;
    } else if (isPostcode) {
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
  ${timerScript}
  <style>
body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #121212;
      color: #FFFFFF;
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }

    .postcode-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px;
      box-sizing: border-box;
      gap: 16px;
      max-width: 2000px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #1E1E1E;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .device-info {
      display: flex;
      flex-direction: column;
    }

     .device-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    #device-timer {
      margin-left: 10px;
    }

    .device-name {
      font-size: 18px;
      font-weight: 600;
      color: #FF6A00;
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      word-break: break-word;
      line-height: 1.2;
      text-align: center;
    }

    .title {
      font-size: 24px;
      font-weight: 600;
      color: #FFFFFF;
    }

    .launch-btn {
      background: #ff6a00;
      border: none;
      color: #FFFFFF;
      padding: 12px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.3s ease;
    }

    .launch-btn:hover {
      background: #e55a00;
    }

    .launch-btn:disabled {
      background: #666;
      cursor: not-allowed;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      margin-top: 80px;
      width: 100%;
    }

    .postcode-display {
      background: #1E1E1E;
      border: 2px solid #0971b3;
      border-radius: 12px;
      padding: 40px;
      margin: 20px;
      min-width: 300px;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .postcode-label {
      font-size: 18px;
      color: #BBBBBB;
      margin-bottom: 15px;
    }

    .postcode-value {
      font-size: 36px;
      font-weight: bold;
      color: #ff6a00;
      letter-spacing: 2px;
      font-family: 'Courier New', monospace;
    }

    .status-message {
      font-size: 16px;
      color: #BBBBBB;
      margin-top: 20px;
    }

    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #ff6a00;
      animation: spin 1s ease-in-out infinite;
      margin-right: 10px;
    }
    
    .controls {
      display: flex;
      gap: 12px;
    }

  .refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #2A2A2A;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #FF6A00;
}

.refresh-btn.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

.refresh-spinner, .loading-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

.loading-spinner {
  margin: 20px auto;
  display: block;
  width: 40px;
  height: 40px;
  border-width: 4px;
}

.feed-Placeholder {
  color: #aaa;
  text-align: center;
  font-size: 14px;
}

.alert {
  position: fixed;
  top: 80px;
  right: 30px;
  padding: 12px 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  z-index: 1000;
  max-width: 300px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.alert-success {
  background-color: #4CAF50;
  color: white;
}

.alert-error {
  background-color: #F44336;
  color: white;
}

.alert-info {
  background-color: #2196F3;
  color: white;
}

.alert-warning {
  background-color: #FF9800;
  color: white;
}

.alert-icon {
  margin-right: 8px;
  font-weight: bold;
}

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .hidden {
      display: none;
    }

    @media (max-width: 768px) {
      .header {
        padding: 15px 20px;
      }
      
      .title {
        font-size: 20px;
      }
      
      .launch-btn {
        padding: 10px 20px;
        font-size: 14px;
      }
      
      .postcode-display {
        margin: 10px;
        padding: 30px;
        min-width: 250px;
      }
      
      .postcode-value {
        font-size: 28px;
      }
    }
  </style>
</head>
<body>
  <div class="postcode-container">
    <div class="header">
        <div class="device-info">
          <div class="device-name-row">
            <div class="device-name">${device.name}</div>
            <div id="device-timer">--:--:--</div>
          </div>
        </div>
        <div class="controls">
        <button class="refresh-btn" id="refresh-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
          </svg>
        </button>
        <button class="launch-btn" id="launch-btn">Launch</button>
        </div>
      </div>

  <div class="main-content">
    <div class="postcode-display">
      <div class="postcode-label">Post Code</div>
      <div class="postcode-value" id="postcode-value">---</div>
      <div class="status-message" id="status-message">Click Launch to read post code</div>
    </div>
  </div>
 </div> 

  <script>
  document.addEventListener('DOMContentLoaded', () => {
    const launchBtn = document.getElementById('launch-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const postcodeValue = document.getElementById('postcode-value');
    const statusMessage = document.getElementById('status-message');

    // LAUNCH BUTTON FUNCTIONALITY
    launchBtn.addEventListener('click', async () => {
      launchBtn.disabled = true;
      launchBtn.innerHTML = '<span class="loading"></span>Reading...';
      statusMessage.textContent = 'Reading post code...';
      postcodeValue.textContent = '---';

      try {
        const response = await fetch('http://100.109.50.57:5010/get_data', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error("HTTP error! Status: " + response.status);
        }

        const data = await response.text(); // Assuming it returns raw text like 'SW1A 1AA'
        postcodeValue.textContent = data || 'N/A';
        statusMessage.textContent = 'Post code read successfully';
      } catch (error) {
        console.error('Error reading post code:', error);
        postcodeValue.textContent = 'ERROR';
        statusMessage.textContent = 'Failed to read post code';
      } finally {
        launchBtn.disabled = false;
        launchBtn.textContent = 'Launch';
      }
    });

    // REFRESH BUTTON FUNCTIONALITY
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.classList.add('loading');

      try {
        const response = await fetch('http://100.109.50.57:8001/power/reset', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error("HTTP error! Status: " + response.status);
        }

        // Optionally show confirmation message
        showAlert('Device power reset successfully.', 'success');
      } catch (error) {
        console.error('Error refreshing device:', error);
        showAlert('Failed to reset power.', 'error');
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.classList.remove('loading');
      }
    });

    // Alert helper function
    function showAlert(message, type = 'info') {
      const alertBox = document.createElement('div');
      alertBox.className = "alert alert-" + type;
      alertBox.innerHTML = '<span class="alert-icon">!</span>' + message;

      document.body.appendChild(alertBox);

      setTimeout(function() {
        alertBox.remove();
      }, 4000);
    }
  });
</script>

</body>
</html>`;
    } else {
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
  ${timerScript}
  <style>
    body {
      font-family: sans-serif;
      padding: 40px;
      background: #f0f0f0;
      color: #333;
    }
  </style>
</head>
<body>
  <h2>Welcome to ${device.name}</h2>
  <div id="device-timer">--:--:--</div>
  <div class="ip-container">
    <h3>Device IP Address:</h3>
    <div>
    <div class="ip-item">
      <span class="ip-type">${device.ipType}:</span> 
      <span>${ipAddress || "Not available"}</span>
    </div>
  </div>
</body>
</html>`;
    }

    const blob = new Blob([popupHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const popup = window.open(
      url,
      `device_${deviceId}`,
      "width=1000,height=700,left=100,top=100,resizable=yes"
    );

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
