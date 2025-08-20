import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import axios from 'axios';
import './Dashboard.css';
import { useLocation } from 'react-router-dom';
import {
  MonitorSmartphone,
  ThermometerSun,
  CameraIcon,
  ChartColumnStacked,
  LayoutGrid,
  CircleUserRound,
  ExternalLink,
  Airplay,
  Maximize2,
  Minimize2,
  Camera
} from 'lucide-react';

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
      className={`device-card ${isActive ? 'active' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="device-icon">
        {renderIcon(device.iconType, isDarkTheme ? '#ff6a00' : '#0971B3')}
      </div>

      <div className="device-name">{device.name}</div>
      <div className="device-status">
        {isActive ? 'Running' : 'Ready'}
      </div>

      {!isActive && (
        <button
          className={`launch-button ${shouldShowButton ? 'visible' : ''}`}
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
              <ExternalLink size={16} style={{ marginRight: '6px' }} />
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamingDevice, setStreamingDevice] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamLoading, setStreamLoading] = useState(false);
  
  const location = useLocation();
  const settingsToggleRef = useRef(null);
  const settingsRef = useRef(null);
  const videoContainerRef = useRef(null);
  
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });
  
  const queryParams = new URLSearchParams(location.search);
  const deviceIdParam = queryParams.get('device');
  const ipTypesParam = queryParams.get('ip_type');
  const reservationIdParam = queryParams.get('reservation');

  const driverTypes = {
    ct1_ip: { name: 'CT1', iconType: 'ThermoCamIcon' },
    ct2_ip: { name: 'CT2', iconType: 'ThermoCamIcon' },
    ct3_ip: { name: 'CT3', iconType: 'ThermoCamIcon' },
    pc_ip: { name: 'PC', iconType: 'MonitorSmartphone' },
    pulse1_ip: { name: 'Pulse1', iconType: 'ChartColumnStacked' },
    pulse2_ip: { name: 'Pulse2', iconType: 'ChartColumnStacked' },
    pulse3_ip: { name: 'Pulse3', iconType: 'ChartColumnStacked' },
    rutomatrix_ip: { name: 'Rutomatrix', iconType: 'MonitorSmartphone' }
  };

  const userData = {
    name: 'Admin User',
    email: 'admin@rutomatrix.com',
    avatar: <CircleUserRound size={30} />,
    onLogout: () => console.log('Logging out...')
  };

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const onMinimize = (deviceId) => {
    console.log(`Minimizing device ${deviceId}`);
  };

  const fetchBookedDevices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://3nv6k49z-5000.inc1.devtunnels.ms/api/booked-devices');
      
      if (response.data.success) {
        const booked = response.data.booked_devices || [];
        
        if (deviceIdParam && reservationIdParam) {
          const matchedDevice = booked.find(dev => 
            dev.device_id === deviceIdParam && 
            String(dev.reservation_id) === reservationIdParam
          );
          
          if (matchedDevice) {
            const ipTypes = ipTypesParam ? 
              ipTypesParam.split(',') : 
              matchedDevice.ip_type.split(',');
            
            const driverDevices = ipTypes.map(ipType => {
              const driverInfo = driverTypes[ipType];
              return {
                id: `${matchedDevice.device_id}_${ipType}`,
                name: `${matchedDevice.device_name} - ${driverInfo.name}`,
                iconType: driverInfo.iconType,
                ipType,
                ipAddress: matchedDevice.device_details[ipType],
                reservationId: matchedDevice.reservation_id,
                deviceName: matchedDevice.device_name
              };
            });
            
            setSelectedDevices(driverDevices);
            setDeviceIpMapping(prev => {
              const newMapping = {...prev};
              driverDevices.forEach(driver => {
                newMapping[driver.id] = {
                  ip_type: driver.ipType,
                  ip_address: driver.ipAddress,
                  reservation_id: driver.reservationId,
                  device_name: driver.deviceName,
                  device_details: matchedDevice.device_details
                };
              });
              return newMapping;
            });
          } else {
            setError('No matching booked device found');
          }
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching booked devices:', err);
      setError('Failed to fetch device information');
      setLoading(false);
    }
  }, [deviceIdParam, reservationIdParam, ipTypesParam]);

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'minimize') {
        onMinimize(event.data.deviceId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleStartStreaming = () => {
    setStreamLoading(true);
    setTimeout(() => {
      setIsStreaming(true);
      setStreamLoading(false);
    }, 2000);
  };

  const handleStopStreaming = () => {
    setIsStreaming(false);
    setStreamingDevice(null);
    setActiveDevices(prev => prev.filter(id => id !== streamingDevice?.id));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const openDeviceWindow = (deviceId, ipInfo = null) => {
    const device = selectedDevices.find(d => d.id === deviceId);
    if (!device) {
      console.warn("No matching device found.");
      return;
    }

    const ipType = ipInfo?.ip_type || '';
    const ipAddress = ipInfo?.ip_address || '';
    const reservationId = ipInfo?.reservation_id || '';
    const deviceName = ipInfo?.device_name || '';
    const title = `Rutomatrix • ${deviceName} - ${ipType}`;

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
    
    let popupHTML = '';
    
    if (device.name.includes('CT')) {
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
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
      padding: 16px;
      box-sizing: border-box;
      gap: 16px;
      max-width: 1200px;
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

    .device-name {
      font-size: 18px;
      font-weight: 600;
      color: #FF6A00;
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

    .video-feeds-container {
      display: flex;
      flex: 1;
      gap: 16px;
    }

    .feed-container {
      position: relative;
      background: #1E1E1E;
      border-radius: 8px;
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

    .feed-placeholder {
      color: #BBBBBB;
      font-size: 16px;
    }

    .feed-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .thermal-controls {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .thermal-controls label {
      color: #BBBBBB;
      font-size: 12px;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
    }

    .thermal-controls input[type="range"] {
      width: 6px;
      height: 150px;
      -webkit-appearance: slider-vertical;
    }

    .thermal-controls .slider-value {
      color: #0971B3;
      font-weight: bold;
    }

    .horizontal-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: #1E1E1E;
      border-radius: 8px;
      margin-top: 8px;
    }

    .horizontal-controls label {
      color: #BBBBBB;
      font-size: 14px;
    }

    .horizontal-controls input[type="range"] {
      width: 100%;
      height: 6px;
    }

    .horizontal-controls .slider-value {
      color: #0971B3;
      font-weight: bold;
      text-align: right;
    }

    .temp-analysis {
      background: #1E1E1E;
      border-radius: 8px;
      padding: 16px;
    }

    .temp-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .temp-box {
      background: #2A2A2A;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }

    .temp-label {
      font-size: 12px;
      color: #BBBBBB;
      margin-bottom: 4px;
    }

    .temp-value {
      font-size: 18px;
      font-weight: bold;
    }

    .high-temp { color: #FF4D4D; }
    .low-temp { color: #4D8CFF; }
    .avg-temp { color: #4DFF4D; }
    .center-temp { color: #FFB84D; }

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
  </style>
</head>
<body>
  <div class="app-container">
    <div class="header">
      <div class="device-info">
        <div class="device-name">${device.name}</div>
      </div>
      <div class="controls">
        <button class="control-btn" id="record-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="12" r="5" fill="currentColor"/>
          </svg>
          Record
        </button>
        <button class="control-btn" id="stream-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M16 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4m4-4v16" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
          Start Stream
        </button>
      </div>
    </div>

    <div class="video-feeds-container">
      <div class="feed-container">
        <div class="feed-header">
          <span>Camera Feed</span>
        </div>
        <div class="feed-content">
          <div class="feed-placeholder" id="camera-feed">Camera feed not started</div>
          <div class="feed-controls">
            <button class="feed-btn" title="Zoom In">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="feed-btn" title="Zoom Out">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="feed-btn" title="Fullscreen">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="feed-container">
        <div class="feed-header">
          <span>Thermal Feed</span>
        </div>
        <div class="feed-content">
          <div class="feed-placeholder" id="thermal-feed">Thermal feed not started</div>
          <div class="thermal-controls">
            <label>Vertical</label>
            <input type="range" min="0" max="180" value="90" id="vertical-slider">
            <span class="slider-value" id="vertical-value">90°</span>
          </div>
          <div class="feed-controls">
            <button class="feed-btn" title="Toggle Palette">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" stroke="currentColor" stroke-width="2"/>
                <path d="M12 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" fill="currentColor"/>
                <path d="M18 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" fill="currentColor"/>
                <path d="M8 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" fill="currentColor"/>
                <path d="M12 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" fill="currentColor"/>
              </svg>
            </button>
            <button class="feed-btn" title="Spot Meter">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                <path d="M12 5v2M12 17v2M5 12h2M17 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="horizontal-controls">
      <label>Horizontal Position</label>
      <input type="range" min="0" max="180" value="90" id="horizontal-slider">
      <span class="slider-value" id="horizontal-value">90°</span>
    </div>

    <div class="temp-analysis">
      <div class="temp-grid">
        <div class="temp-box">
          <div class="temp-label">Maximum</div>
          <div class="temp-value high-temp" id="max-temp">78.7°F</div>
        </div>
        <div class="temp-box">
          <div class="temp-label">Minimum</div>
          <div class="temp-value low-temp" id="min-temp">78.7°F</div>
        </div>
        <div class="temp-box">
          <div class="temp-label">Average</div>
          <div class="temp-value avg-temp" id="avg-temp">78.7°F</div>
        </div>
        <div class="temp-box">
          <div class="temp-label">Center</div>
          <div class="temp-value center-temp" id="center-temp">78.7°F</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const cameraFeed = document.getElementById('camera-feed');
      const thermalFeed = document.getElementById('thermal-feed');
      const streamBtn = document.getElementById('stream-btn');
      
      // Stream control
      streamBtn.addEventListener('click', () => {
        if (streamBtn.textContent.includes('Start')) {
          cameraFeed.innerHTML = '<img src="https://via.placeholder.com/800x600?text=Visible+Spectrum+Feed" class="feed-image">';
          thermalFeed.innerHTML = '<img src="https://via.placeholder.com/800x600?text=Thermal+Imaging+Feed" class="feed-image">';
          streamBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2"/></svg>Stop Stream';
          streamBtn.classList.add('active');
        } else {
          cameraFeed.innerHTML = '<div class="feed-placeholder">Camera feed not started</div>';
          thermalFeed.innerHTML = '<div class="feed-placeholder">Thermal feed not started</div>';
          streamBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4m4-4v16" fill="none" stroke="currentColor" stroke-width="2"/></svg>Start Stream';
          streamBtn.classList.remove('active');
        }
      });

      const hSlider = document.getElementById('horizontal-slider');
      const vSlider = document.getElementById('vertical-slider');
      const hValue = document.getElementById('horizontal-value');
      const vValue = document.getElementById('vertical-value');

      hSlider.addEventListener('input', e => hValue.textContent = e.target.value + '°');
      vSlider.addEventListener('input', e => vValue.textContent = e.target.value + '°');

      const recordBtn = document.getElementById('record-btn');
      recordBtn.addEventListener('click', () => {
        recordBtn.classList.toggle('active');
      });

      function updateTemps() {
        const base = 78.7;
        const varF = () => (Math.random() * 2 - 1).toFixed(1);
        document.getElementById('max-temp').textContent = (base + 0.5).toFixed(1) + '°F';
        document.getElementById('min-temp').textContent = (base - 0.3).toFixed(1) + '°F';
        document.getElementById('avg-temp').textContent = base.toFixed(1) + '°F';
        document.getElementById('center-temp').textContent = (base + Number(varF())).toFixed(1) + '°F';
      }
      updateTemps();
      setInterval(updateTemps, 3000);
    });
  </script>
</body>
</html>`;
 } else if (device.name.includes('PC')) {
  popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
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
    
    .device-name {
      font-size: 18px;
      font-weight: 600;
      color: #FF6A00;
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
    
    .pc-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .remote-desktop-container {
      flex: 1;
      background: #1E1E1E;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
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
        <div class="device-name">${device.name}</div>
      </div>
      <div class="controls">
        <button class="control-btn" id="connect-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Connect
        </button>
        <!--<button class="control-btn" id="fullscreen-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Fullscreen
        </button> -->
      </div>
    </div>

    <div class="pc-content">
      <div class="remote-desktop-container">
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

      <!--<div class="pc-info">
        <div class="pc-grid">
          <div class="pc-box">
            <div class="pc-label">IP Address</div>
            <div class="pc-value">${ipAddress}</div>
          </div>
          <div class="pc-box">
            <div class="pc-label">Connection Type</div>
            <div class="pc-value">Remote Desktop</div>
          </div>
          <div class="pc-box">
            <div class="pc-label">Status</div>
            <div class="pc-value" id="status-value">Disconnected</div>
          </div>
          <div class="pc-box">
            <div class="pc-label">Last Connected</div>
            <div class="pc-value" id="last-connected">Never</div>
          </div>
        </div>
      </div>-->
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const connectBtn = document.getElementById('connect-btn');
      const remoteDesktopFeed = document.getElementById('remote-desktop-feed');
      const remoteDesktopIframe = document.getElementById('remote-desktop-iframe');
      const statusValue = document.getElementById('status-value');
      const lastConnected = document.getElementById('last-connected');
      const fullscreenBtn = document.getElementById('fullscreen-btn');
      
      // Connect control
      connectBtn.addEventListener('click', () => {
        if (connectBtn.textContent.includes('Connect')) {
          // Show loading state
          remoteDesktopFeed.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">' +
            '<div style="border: 4px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top: 4px solid #FF6A00; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>' +
            '<p style="margin-top: 10px;">Connecting to ${ipAddress}...</p>' +
            '</div>';
          
          // Set up the iframe with the actual streaming URL
          remoteDesktopIframe.src = 'http://${ipAddress}/';
          remoteDesktopIframe.onload = () => {
            remoteDesktopFeed.style.display = 'none';
            remoteDesktopIframe.style.display = 'block';
            connectBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Disconnect';
            connectBtn.classList.add('active');
            statusValue.textContent = 'Connected';
            lastConnected.textContent = new Date().toLocaleString();
          };
          
          remoteDesktopIframe.onerror = () => {
            remoteDesktopFeed.innerHTML = '<div style="color: #ff4d4d;">Connection failed. Please check the IP address and try again.</div>';
          };
        } else {
          // Disconnect
          remoteDesktopIframe.src = '';
          remoteDesktopIframe.style.display = 'none';
          remoteDesktopFeed.style.display = 'block';
          remoteDesktopFeed.innerHTML = '<div class="remote-desktop-placeholder">Not connected</div>';
          connectBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Connect';
          connectBtn.classList.remove('active');
          statusValue.textContent = 'Disconnected';
        }
      });

      // Fullscreen control
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      });
    });
  </script>
</body>
</html>`;
    }

    const blob = new Blob([popupHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const popup = window.open(
      url,
      `device_${deviceId}`,
      'width=1000,height=700,left=100,top=100,resizable=yes'
    );

    if (!popup) {
      URL.revokeObjectURL(url);
      alert('Please allow popups for this site');
      return;
    }

    const cleanup = () => {
      URL.revokeObjectURL(url);
      setActiveDevices(prev => prev.filter(id => id !== deviceId));
    };

    popup.onbeforeunload = cleanup;

    const intervalId = setInterval(() => {
      if (popup.closed) {
        clearInterval(intervalId);
        cleanup();
      }
    }, 500);

    setActiveDevices(prev => [...prev, deviceId]);
  };

  return (
    <div className={`dashboard-container ${isDarkTheme ? 'dark-theme' : ''}`}>
      <Navbar
        isDarkTheme={isDarkTheme}
        toggleTheme={toggleTheme}
        userData={userData}
      />

      <div className="dashboard-header">
        <button
          className="settings-toggle-btn"
          ref={settingsToggleRef}
          onClick={() => setShowSettings(!showSettings)}
        >
          <LayoutGrid size={24} color={isDarkTheme ? '#ff6a00' : '#0971B3'} />
        </button>

        {showSettings && (
          <div className={`settings-dropdown ${isDarkTheme ? 'dark' : ''}`} ref={settingsRef}>
            <div className="user-info">
              <div className="user-avatar">{userData.avatar}</div>
              <div className="user-details">
                <div className="user-name">{userData.name}</div>
                <div className="user-email">{userData.email}</div>
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
                  {isDarkTheme ? 'Dark Mode' : 'Light Mode'}
                </span>
              </label>
            </div>

            <button
              className={`logout-button ${isDarkTheme ? 'dark' : ''}`}
              onClick={userData.onLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <div className="dashboard-center-wrapper">
        <div className="dashboard-content-wrapper">
          <h1 className="dashboard-title">Device Dashboard</h1>
          <h2 className="dashboard-para">Control and monitor your selected devices</h2>
          
          {streamingDevice ? (
            <div className="video-stream-container">
              <div className="video-stream-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: isDarkTheme ? '#1E1E1E' : '#f0f0f0',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                color: isDarkTheme ? '#FFFFFF' : '#333',
                marginBottom: '16px'
              }}>
                <h2>VirtualDesk - {streamingDevice.name}</h2>
                <div>
                  <button
                    className="stream-control-btn"
                    style={{
                      background: isStreaming 
                        ? isDarkTheme ? '#ff6a00' : '#0971B3' 
                        : isDarkTheme ? '#2A2A2A' : '#e0e0e0',
                      border: 'none',
                      color: isStreaming ? 'white' : isDarkTheme ? 'white' : '#333',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onClick={isStreaming ? handleStopStreaming : handleStartStreaming}
                    disabled={streamLoading}
                  >
                    <Airplay size={20} />
                    {streamLoading ? 'Connecting...' : isStreaming ? 'Stop Streaming' : 'Start Streaming'}
                  </button>
                </div>
              </div>

              <div 
                className="video-container" 
                ref={videoContainerRef}
                style={{
                  position: 'relative',
                  flexGrow: '1',
                  backgroundColor: '#000',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  height: '500px'
                }}
              >
                <button
                  className="fullscreen-toggle"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '5px',
                    cursor: 'pointer',
                    zIndex: '10'
                  }}
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>

                {streamLoading ? (
                  <div className="video-spinner-overlay" style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    zIndex: '5'
                  }}>
                    <div className="mini-spinner" style={{
                      border: '4px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '50%',
                      borderTop: `4px solid ${isDarkTheme ? '#ff6a00' : '#0971B3'}`,
                      width: '40px',
                      height: '40px',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ color: 'white', marginTop: '10px' }}>Connecting...</p>
                  </div>
                ) : isStreaming ? (
                  <iframe
                    title="TinyPilot Stream"
                    className="video-feed"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="fullscreen"
                    frameBorder="0"
                  />
                ) : (
                  <div className="no-signal" style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    backgroundColor: '#333'
                  }}>
                    <p>
                      <Camera size={20} style={{ marginRight: '5px' }} />
                      No video signal
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="dashboard-content">
              <div className="devices-grid">
                {selectedDevices.map(device => (
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
                        case 'MonitorSmartphone':
                          return <MonitorSmartphone size={32} color={color} />;
                        case 'ChartColumnStacked':
                          return <ChartColumnStacked size={32} color={color} />;
                        case 'ThermoCamIcon':
                          return (
                            <span style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                              <ThermometerSun size={30} color={color} />
                              <CameraIcon size={30} color={color} />
                            </span>
                          );
                        default:
                          return <MonitorSmartphone size={32} color={color} />;
                      }
                    }}
                    isDarkTheme={isDarkTheme}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
