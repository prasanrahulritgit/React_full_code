import { useState, useEffect, useRef } from "react";
import axios from "axios";
import rutomatrixLogo from "../../assets/images/rutomatrix.png";
import tessolveLogo from "../../assets/images/tessolve.png";
import "./Navbar.css";
import { ChevronLeft, TimerIcon } from "lucide-react";

const Navbar = ({ isDarkTheme, toggleTheme, userData }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLast10Minutes, setIsLast10Minutes] = useState(false);
  const timerRef = useRef(null);
  const alertShownRef = useRef({
    thirtyMinutes: false,
    tenMinutes: false,
    expired: false,
  });
  const [role, setRole] = useState(null);

  const navigateToReservations = () => {
    if (role === "admin") {
      window.location.href =
        "http://localhost:3000/admin_dashboard/reservation";
    } else {
      window.location.href = "http://localhost:3000/user_reservation";
    }
  };

  const fetchDeviceData = async (deviceId) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!deviceId) {
        throw new Error("No device ID provided");
      }

      const response = await axios.get(
        "http://127.0.0.1:5000/api/booked-devices",
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          // Ensure axios doesn't try to parse HTML as JSON
          transformResponse: [
            (data) => {
              if (
                typeof data === "string" &&
                data.trim().startsWith("<!DOCTYPE html>")
              ) {
                throw new Error("Received HTML response when expecting JSON");
              }
              return data;
            },
          ],
        }
      );

      // Force JSON parsing if needed
      const responseData =
        typeof response.data === "string"
          ? JSON.parse(response.data)
          : response.data;

      // Always set role if present
      if (responseData?.data?.role) {
        console.log("Fetched role:", responseData.data.role);
        setRole(responseData.data.role.trim().toLowerCase());
      }

      // Skip device lookup if none provided
      if (!deviceId) {
        return null;
      }

      if (!responseData?.data?.booked_devices) {
        throw new Error("API returned invalid data structure");
      }

      const device = responseData.data.booked_devices.find(
        (d) =>
          d.device?.id === deviceId ||
          d.id === deviceId.toString() ||
          d.device_id === deviceId
      );

      if (device && device.user?.role) {
        setRole(device.user.role.trim().toLowerCase());
      }

      if (!device) {
        throw new Error(`Device ${deviceId} not found in bookings`);
      }

      return {
        name: `Device ${parseInt(
          device.device?.id || device.id || "Unknown Device"
        )}`,
        endTime: new Date(device.time?.end || device.end_time),
      };
    } catch (error) {
      console.error("API request failed:", error);

      // Handle specific error cases
      if (error.message.includes("Received HTML response")) {
        console.warn("Authentication required - redirecting to login");
        window.location.href = `/auth/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        return null;
      }

      if (error.response?.status === 401) {
        window.location.href = "/auth/login";
        return null;
      }

      setError(error.message || "Failed to load device data");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

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

    alertShownRef.current = {
      thirtyMinutes: false,
      tenMinutes: false,
      expired: false,
      isAlertActive: false,
    };
    setIsLast10Minutes(false);

    timerRef.current = setInterval(async () => {
      const now = new Date();
      const difference = endTime - now;
      const minutesLeft = Math.floor(difference / (1000 * 60));

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );

      if (minutesLeft <= 10 && !isLast10Minutes) {
        setIsLast10Minutes(true);
      }

      if (difference <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft("00:00:00");
        if (!alertShownRef.current.expired) {
          await showAlert(`Your booking for ${deviceName} has expired!`);
          alertShownRef.current.expired = true;
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
      setError("No device selected");
      setIsLoading(false);
      return;
    }

    const initializeData = async () => {
      const deviceData = await fetchDeviceData(userData.device_id);
      if (deviceData) {
        setDeviceName(deviceData.name);
        startCountdown(deviceData.endTime, deviceData.name);
      } else {
        setTimeLeft(null);
      }
    };

    initializeData();

    const refreshInterval = setInterval(initializeData, 60000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <div className={`navbar-container ${isDarkTheme ? "dark" : ""}`}>
      <header className="navbar1">
        <div className="navbar-left">
          <img src={rutomatrixLogo} alt="Rutomatrix Logo" className="logo" />
        </div>
        <div className="navbar-right">
          {role !== null ? (
            <button className="back-button" onClick={navigateToReservations}>
              <ChevronLeft size={24} className="back-icon" />
              <span className="back-text">Back</span>
            </button>
          ) : (
            <div style={{ color: "gray" }}>
              {" "}
              {userData?.role ? userData.role : "role not loaded"}{" "}
            </div>
          )}

          {isLoading ? (
            <div className="timer-loading">Loading...</div>
          ) : error ? (
            <div className="timer-error">{error}</div>
          ) : timeLeft ? (
            <div className="device-timer">
              <span className="Device-name" title={deviceName}>
                {deviceName.length > 12
                  ? `${deviceName.substring(0, 10)}...`
                  : deviceName}{" "}
                -
              </span>
              <span
                className={`timer ${isLast10Minutes ? "last-10-minutes" : ""}`}
              >
                <TimerIcon size={20} style={{ marginRight: "4px" }} />{" "}
                {timeLeft}
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
