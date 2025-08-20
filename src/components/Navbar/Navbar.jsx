import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import rutomatrixLogo from "../../assets/images/rutomatrix.png";
import tessolveLogo from "../../assets/images/tessolve.png";
import "./Navbar.css";
import { ChevronLeft, TimerIcon } from 'lucide-react'; 

const Navbar = ({ isDarkTheme, toggleTheme, userData }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [deviceName, setDeviceName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLast10Minutes, setIsLast10Minutes] = useState(false);
  const timerRef = useRef(null);
  const alertShownRef = useRef({
    thirtyMinutes: false,
    tenMinutes: false,
    expired: false
  });

  // Navigate back to reservations 
  const handleBackToReservations = () => {
    window.location.href = "https://3nv6k49z-5000.inc1.devtunnels.ms/reservations";
  };

  // Navigate to reservations after showing alert
  const navigateToReservations = () => {
    window.location.href = "https://3nv6k49z-5000.inc1.devtunnels.ms/reservations";
  };

  const fetchDeviceData = async (deviceId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!deviceId) {
        throw new Error('No device ID provided');
      }

      const response = await axios.get('https://3nv6k49z-5000.inc1.devtunnels.ms/api/booked-devices');
      
      if (response.data && Array.isArray(response.data.booked_devices)) {
        const device = response.data.booked_devices.find(d => 
          d.device_id === deviceId
        );
        
        if (device) {
          return {
            name: device.device_name,
            endTime: new Date(device.end_time)
          };
        }
      }
      throw new Error('Booked device not found');
    } catch (error) {
      console.error('Device data fetch error:', error);
      setError(error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const playAlertSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  const showAlert = (message) => {
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

  const startCountdown = (endTime, deviceName) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Reset alert flags and timer state
    alertShownRef.current = {
      thirtyMinutes: false,
      tenMinutes: false,
      expired: false,
      isAlertActive: false
    };
    setIsLast10Minutes(false);

    timerRef.current = setInterval(async () => {
      const now = new Date();
      const difference = endTime - now;
      const minutesLeft = Math.floor(difference / (1000 * 60));

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

      // Update last 10 minutes state for styling
      if (minutesLeft <= 10 && !isLast10Minutes) {
        setIsLast10Minutes(true);
      }

      if (difference <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft('00:00:00');
        if (!alertShownRef.current.expired) {
          await showAlert(`Your booking for ${deviceName} has expired!`);
          alertShownRef.current.expired = true;
          // Navigate to reservations after showing alert
          setTimeout(navigateToReservations, 1000);
        }
      } else if (minutesLeft === 10 && !alertShownRef.current.tenMinutes) {
        await showAlert(`Warning: Only 10 minutes left for ${deviceName}`);
        alertShownRef.current.tenMinutes = true;
      } else if (minutesLeft === 30 && !alertShownRef.current.thirtyMinutes) {
        await showAlert(`Warning: Only 30 minutes left for ${deviceName}`);
        alertShownRef.current.thirtyMinutes = true;
      }
    }, 1000);
  };

  useEffect(() => {
    if (!userData?.device_id) {
      setError('No device selected');
      setIsLoading(false);
      return;
    }

    const initializeTimer = async () => {
      const deviceData = await fetchDeviceData(userData.device_id);
      if (deviceData) {
        setDeviceName(deviceData.name);
        startCountdown(deviceData.endTime, deviceData.name);
      }
    };

    initializeTimer();

    // Refresh every minute
    const refreshInterval = setInterval(initializeTimer, 60000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(refreshInterval);
    };
  }, [userData?.device_id]);

  return (
    <div className={`navbar-container ${isDarkTheme ? "dark" : ""}`}>
      <header className="navbar1">
        <div className="navbar-left">
          <img src={rutomatrixLogo} alt="Rutomatrix Logo" className="logo" />
        </div>
        <div className="navbar-right">
          <button 
            className="back-button" 
            onClick={handleBackToReservations}
          >
            <ChevronLeft 
              size={24} 
              className="back-icon"
            />
            <span className="back-text">Back</span>
          </button>

          {isLoading ? (
            <div className="timer-loading">Loading...</div>
          ) : error ? (
            <div className="timer-error">{error}</div>
          ) : timeLeft ? (
            <div className={`device-timer `}>
              <span className="Device-name" title={deviceName}>
                {deviceName.length > 12 ? `${deviceName.substring(0, 10)}...` : deviceName} -
              </span>
               <span className={`timer ${isLast10Minutes ? 'last-10-minutes' : ''}`}> 
                <TimerIcon size={20} style={{ marginRight: '4px'}} /> {timeLeft} 
              </span>
            </div>
          ) : (
            <div className="timer-error">No active booking</div>
          )}
          <img src={tessolveLogo} alt="Tessolve Logo" className="logo" />
        </div>
      </header>
    </div>
  );
};

export default Navbar;