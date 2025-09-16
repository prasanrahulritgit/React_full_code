import React, { useState, useEffect, useRef } from "react";
import "./LandingPage.css";
import ThreeDModel from "./ThreeDModel";
import {
  ArrowRight,
  SquareArrowOutUpRight,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  MonitorCog,
  HandCoins,
  ChartNoAxesCombined,
  Split,
  X,
  LassoSelect,
  Rotate3d,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import rutomatrix from "../../assets/RUTOMATRIX-bg1.png";
import sl1 from "../../assets/Sl1.png";
import sl2 from "../../assets/Sl2.png";
import sl3 from "../../assets/bg3_.png";
import sl4 from "../../assets/Sl4.png";
import sl5 from "../../assets/Sl5.jpg";
import logo from "../../assets/RutoMatrix_Nonbackground.png";
import tes_logo from "../../assets/images/tessolve.png";
import view1 from "../../assets/images/Top1.png";
import view2 from "../../assets/images/Fan1.png";
import view3 from "../../assets/images/Ports1.png";
import view5 from "../../assets/images/Sideview1.png";

const LandingPage = ({ setIsAuthenticated }) => {
  const [activeSection, setActiveSection] = useState("hero");
  const [view, setView] = useState("isometric");
  const [scrolled, setScrolled] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef();
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [show3DModel, setShow3DModel] = useState(false);
  const [dragHintVisible, setDragHintVisible] = useState(true);
  const featureSlides = [
    {
      title: "Virtual Desk",
      description:
        "Experience crystal-clear video with our advanced streaming technology.",
      image: sl1,
    },
    {
      title: "Audio Analysis",
      description:
        "Real-time audio processing with detailed visualization tools.",
      image: sl2,
    },
    {
      title: "Rutoscope",
      description:
        "Built-in digital oscilloscope for signal monitoring and measurement",
      image: sl3,
    },
    {
      title: "GUI Architecture",
      description:
        "Modern, intuitive interface with customizable dashboards and controls.",
      image: sl4,
    },
    {
      title: "Rutocam",
      description:
        "Real-time thermal imaging with precision sensors for diagnostics, safety, monitoring, and seamless Rutomatrix integration.",
      image: sl5,
    },
  ];

  const heroRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const hero = heroRef.current;
      if (!hero) return;

      const heroBottom = hero.offsetTop + hero.offsetHeight;
      const scrollY = window.scrollY;

      // Show button only after scrolling below hero section
      setShowScrollTop(scrollY > heroBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToHero = () => {
    if (heroRef.current) {
      heroRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleClick = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setAtTop(scrollTop < 50); // show only when near top
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [rotate, setRotate] = useState(false);
  const toggleRotate = () => setRotate((prev) => !prev);
  const [zoomDirection, setZoomDirection] = useState(0);

  const handleZoom = (direction) => {
    setZoomDirection(direction);
    setTimeout(() => setZoomDirection(0), 200); // Reset zoom after short delay
  };

  // drag event in modal-content default hidden
  useEffect(() => {
    if (!show3DModel) return;

    // Show the drag hint every time the modal opens
    setDragHintVisible(true);

    const handleInteraction = () => {
      setDragHintVisible(false);
      window.removeEventListener("mousedown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };

    window.addEventListener("mousedown", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("mousedown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [show3DModel]);

  const handleLaunchDashboard = () => {
    // Redirect to external login URL
    window.location.href = "http://127.0.0.1:5000/login";
  };

  useEffect(() => {
    const handleScroll = () => {
      // Check if user has scrolled
      setScrolled(window.scrollY > 50);

      // Section detection
      const sections = document.querySelectorAll("section");
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (
          window.scrollY >= sectionTop - 300 &&
          window.scrollY < sectionTop + sectionHeight - 300
        ) {
          setActiveSection(section.id);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [showcaseState, setShowcaseState] = useState("");
  const showcaseRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const showcaseSection = showcaseRef.current;
      if (!showcaseSection) return;

      const sectionTop = showcaseSection.offsetTop;
      const sectionHeight = showcaseSection.offsetHeight;
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;

      // Calculate visibility thresholds
      const enterThreshold = sectionTop - windowHeight * 0.2;
      const exitThreshold = sectionTop + sectionHeight - windowHeight * 0.8;

      if (scrollPosition < enterThreshold) {
        // Before entering the section (default 96%)
        setShowcaseState("");
      } else if (scrollPosition > exitThreshold) {
        // After scrolling past the section (back to 96%)
        setShowcaseState("scrolled-past");
      } else {
        // While section is in view (100%)
        setShowcaseState("entered");
      }
    };

    // Run on mount and add scroll listener
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    window.scrollTo({
      top: section.offsetTop - 80,
      behavior: "smooth",
    });
  };

  const handleNext = () => {
    setCurrentSlide((prev) =>
      prev === featureSlides.length - 1 ? 0 : prev + 1
    );
    resetInterval();
  };

  const handlePrev = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? featureSlides.length - 1 : prev - 1
    );
    resetInterval();
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    resetInterval();
  };

  const handle360Click = () => {
    setShow3DModel(true);
  };

  const close3DModel = () => {
    setShow3DModel(false);
  };

  const resetInterval = () => {
    clearInterval(slideInterval.current);
    slideInterval.current = setInterval(handleNext, 4000);
  };

  useEffect(() => {
    slideInterval.current = setInterval(handleNext, 4000);
    return () => clearInterval(slideInterval.current);
  }, []);

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Set a timeout to trigger the animation after component mounts
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = heroRef.current;
      if (!heroSection) return;

      const heroHeight = heroSection.offsetHeight;
      const scrollPosition = window.scrollY;

      // Activate narrow mode when scrolled past 25% of hero section height
      setIsScrolled(scrollPosition > heroHeight * 0.25);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (show3DModel) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [show3DModel]);

  useEffect(() => {
    if (showLoginOverlay) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [showLoginOverlay]);

  return (
    <div className="app">
      {/* Navigation */}
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="container">
          <img className="logo_r" src={logo} alt="Rutomatrix Logo" />
          <ul className="nav-links">
            <li
              className={activeSection === "hero" ? "active" : ""}
              onClick={() => scrollToSection("hero")}
            >
              Home
            </li>
            <li
              className={activeSection === "features" ? "active" : ""}
              onClick={() => scrollToSection("features")}
            >
              Features
            </li>
            <li
              className={activeSection === "distinctive-edge" ? "active" : ""}
              onClick={() => scrollToSection("distinctive-edge")}
            >
              Distinctive Edge
            </li>
            <li
              className={activeSection === "showcase" ? "active" : ""}
              onClick={() => scrollToSection("showcase")}
            >
              Showcase
            </li>
            {
              <li
                className={activeSection === "contact" ? "active" : ""}
                onClick={() => scrollToSection("contact")}
              >
                Contact us
              </li>
            }
            {/* <li className="user-login"> <button className="user-icon-btn" onClick={() => setShowLoginOverlay(true)} > <User size={24} /> </button> </li>  360°*/}
            <li className="3D-login">
              {" "}
              <button className="threeD-icon-btn" onClick={handle360Click}>
                <Rotate3d size={24} />
                360°
              </button>{" "}
            </li>
          </ul>
        </div>
      </nav>

      {show3DModel && (
        <div className="model-modal">
          <button className="close-btn" onClick={close3DModel}>
            <X size={24} />
          </button>

          {/* View Buttons */}
          <div className="view-buttons">
            <button onClick={() => setView("front")}>Front</button>
            <button onClick={() => setView("back")}>Back</button>
            <button onClick={() => setView("top")}>Top</button>
            <button onClick={() => setView("left")}>Left</button>
            <button onClick={() => setView("right")}>Right</button>
            <button onClick={() => setView("isometric")}>Isometric</button>
            <button onClick={toggleRotate}>
              {rotate ? "Stop Rotation" : "Rotate"}
            </button>
            <button onClick={() => handleZoom(1)}>Zoom +</button>
            <button onClick={() => handleZoom(-1)}>Zoom -</button>
          </div>

          {/* 3D Model + Drag Hint */}
          <div className="model-modal-content">
            <ThreeDModel
              url="/models/RUTOMATRIX_Final1.glb"
              view={view}
              rotate={rotate}
              zoomDirection={zoomDirection}
            />

            {dragHintVisible && (
              <div className="drag-indicator">
                <LassoSelect size={68} color="#ffffff" className="pulse-icon" />
                <span className="drag-text">Grab & Drag to Rotate</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section
        id="hero"
        ref={heroRef}
        className={`hero-section ${isScrolled ? "scrolled" : ""}`}
      >
        <div className="container">
          <div className="hero-content">
            <h1>
              <span style={{ color: "#ff6a00" }}>Next-Gen Auto</span>
              <span style={{ color: "#1281d6" }}>mated Test Companion</span>
            </h1>
            <p className="subtitle">
              Stream. Analyze. Control - Your intelligent ally for any digital
              need.
            </p>
            <div className="cta-buttons">
              <button
                className="primary-btn"
                onClick={() => scrollToSection("features")}
              >
                Explore Features
              </button>
              <button className="secondary-btn" onClick={handleLaunchDashboard}>
                Launch Dashboard{" "}
                <SquareArrowOutUpRight
                  size={18}
                  marginLeft={16}
                  className="button-icon"
                />
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div
              className={`device-mockup ${hasAnimated ? "visible" : ""} ${
                !hasAnimated ? "initial-animation" : ""
              }`}
            >
              <img
                src={rutomatrix}
                alt="rutomatrix-img"
                className="mockup-screen"
              />
            </div>
          </div>
        </div>

        <div
          className={`scroll-indicator ${atTop ? "visible" : "hidden"}`}
          onClick={handleClick}
        >
          <div className="arrow"></div>
          <span>Scroll Down</span>
        </div>
      </section>

      {/* scroll-to-top */}
      {!show3DModel && (
        <button
          className={`scroll-to-top ${showScrollTop ? "visible" : ""}`}
          onClick={scrollToHero}
        >
          <ChevronUp className="top-icon" size={20} />
          <span className="ghost-arrow">
            <ChevronUp size={20} />
          </span>
        </button>
      )}

      {/* New Overview Section */}
      <section id="overview" className="overview-section">
        <div className="container">
          <div className="overview-content">
            <h2 className="section-title">Overview</h2>
            <div className="overview-grid">
              <div className="overview-card">
                <h3>Your ultimate solution for remote test management</h3>
                <p>
                  Discover how Rutomatrix revolutionizes test management with
                  advanced remote control and monitoring. Our platform combines
                  state-of-the-art hardware and software to deliver unparalleled
                  efficiency and flexibility in operations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-description">
            Designed to meet the most demanding technical requirements
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎥</div>
              <h3>Virtual Desk</h3>
              <p>
                Ultra-high-definition streaming with low latency and adaptive
                bitrate technology.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔊</div>
              <h3>Audio Streaming & Analysis</h3>
              <p>
                High-fidelity real-time audio streaming with open-source
                analysis tools via Bluetooth, HDMI, USB, and 3.5mm
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Rutoscope</h3>
              <p>
                Rutoscope is a powerful logic analyzer for modern digital systems.
Supports all major protocols with deep visibility and precision.
Monitor, decode, and analyze communication seamlessly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📷</div>
              <h3>Rutocam</h3>
              <p>
                Real-time thermal imaging with precision sensors—detect heat signatures for diagnostics,
                 safety, and monitoring, seamlessly integrated with Rutomatrix.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🖥️</div>
              <h3>GUI Architecture</h3>
              <p>
                Custom-built standalone GUI supporting legacy tools with
                efficient documentation and workflow.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔌</div>
              <h3>Multi-Protocol Support</h3>
              <p>
                Compatible with various industry-standard protocols and
                interfaces.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Slideshow Section */}
      <section id="feature-showcase" className="feature-slideshow-section">
        <div className="container">
          <h2 className="section-title">Feature Highlights</h2>
          <p className="section-description">
            See our powerful features in action
          </p>

          <div className="slideshow-container">
            {/* Slides */}
            <div
              className="slideshow-track"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {featureSlides.map((slide, index) => (
                <div key={index} className="slide">
                  <div className="slide-image">
                    <img src={slide.image} alt={slide.title} />
                    <div className="slide-overlay">
                      <h3>{slide.title}</h3>
                      <p>{slide.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Dots */}
            <div className="slideshow-dots">
              {featureSlides.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentSlide ? "active" : ""}`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="slideshow-arrows">
              <button className="slideshow-arrow prev" onClick={handlePrev}>
                <ChevronLeft size={24} />
              </button>
              <button className="slideshow-arrow next" onClick={handleNext}>
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Slideshow Section */}

      <section id="distinctive-edge" className="distinctive-edge-section">
        <div className="container">
          <h2 className="section-title">
            Advantages of remote test management
          </h2>
          <p className="section-subtitle">
            Discover why Rutomatrix stands out from the competition with these
            core benefits
          </p>

          <div className="advantages-grid">
            <div className="advantage-card">
              <div className="advantage-icon">
                <HandCoins size={40} color="#0033ff" />
              </div>
              <h3>Affordability</h3>
              <p>
                Unlock significant savings without sacrificing quality with our
                affordable, cost-effective product solutions.
              </p>
            </div>

            <div className="advantage-card">
              <div className="advantage-icon">
                <MonitorCog size={40} color="#0033ff" />
              </div>
              <h3>Ease of Setup</h3>
              <p>
                Enjoy a hassle-free experience with our product's
                straightforward and quick setup process.
              </p>
            </div>

            <div className="advantage-card">
              <div className="advantage-icon">
                <ChartNoAxesCombined size={40} color="#0033ff" />
              </div>
              <h3>Efficiency Boost</h3>
              <p>
                Boost your productivity with our product's streamlined design
                for maximum output with minimal effort.
              </p>
            </div>

            <div className="advantage-card">
              <div className="advantage-icon">
                <Split size={40} color="#0033ff" />
              </div>
              <h3>Flexibility</h3>
              <p>
                Experience unmatched adaptability that seamlessly adjusts to
                your changing requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section */}

      <section
        id="showcase"
        className={`showcase-section ${showcaseState}`}
        ref={showcaseRef}
      >
        <div className="container">
          <h2 className="section-title">In Action</h2>
          <p className="section-description">
            See how Rutomatrix performs in real-world scenarios
          </p>

          {/* First Showcase Item - Image Left */}
          <div className="showcase-item left-layout">
            <div className="showcase-image">
              <img src={view1} alt="Rutomatrix Hardware Front View" />
            </div>
            <div className="showcase-content">
              <h3>Precision Engineering</h3>
              <p>
                Every Rutomatrix unit undergoes quality testing to ensure
                reliability in demanding environments. Our precision
                manufacturing guarantees consistent performance.
              </p>
              <ul className="feature-list">
                <li> High durability components</li>
                <li>Vibration-resistant mounting</li>
                <li>EMI-shielded circuitry</li>
              </ul>
            </div>
          </div>

          {/* Second Showcase Item - Image Right */}
          <div className="showcase-item right-layout">
            <div className="showcase-content">
              <h3>Robust Software & Hardware Integration</h3>
              <p>
                Rutomatrix offers seamless integration between hardware and
                software, ensuring efficient development, deployment, and
                diagnostics across critical interfaces.
              </p>
              <ul className="feature-list">
                <li>Serial driver compatibility with modern OS environments</li>
                <li>
                  Remote debugging via Python 3.8+ on Linux Debian using PVL and
                  Quick OS flashing and backup using USB with Ventoy &
                  Clonezilla
                </li>
                <li>BIOS/Firmware flashing through SPI and GPIO interfaces</li>
                <li>
                  Comprehensive BMC testing using Redfish API, redfishtool, and
                  Postman
                </li>
              </ul>
            </div>
            <div className="showcase-image">
              <img src={view2} alt="Rutomatrix Internal Components" />
            </div>
          </div>

          {/* Third Showcase Item - Image Left */}
          <div className="showcase-item left-layout">
            <div className="showcase-image">
              <img src={view3} alt="Rutomatrix Connectivity Options" />
            </div>
            <div className="showcase-content">
              <h3>Comprehensive Connectivity</h3>
              <p>
                With multiple interface options, Rutomatrix seamlessly
                integrates with your existing infrastructure. The rear panel
                provides easy access to all connections.
              </p>
              <ul className="feature-list">
                <li>Ethernet port</li>
                <li>USB 3.0 Gen 2×2</li>
                <li>USB 2.0 Gen 2x2</li>
              </ul>
            </div>
          </div>

          {/* fourth Showcase Item - Image Right */}
          <div className="showcase-item right-layout">
            <div className="showcase-content">
              <h3>Precision I/O & Thermal Design</h3>
              <p>
                Rutomatrix is engineered with versatile I/O options and
                efficient thermal solutions, ensuring reliable performance
                across diverse applications and environments.
              </p>
              <ul className="feature-list">
                <li>Dual USB Type-C ports for high-speed data and power</li>
                <li>12V axial-pin power input</li>
                <li>Mini HDMI 2.0</li>
                <li>3.5mm audio jack</li>
                <li>Delta cooling fan</li>
              </ul>
            </div>

            <div className="showcase-image">
              <img src={view5} alt="Rutomatrix Internal Components" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container" style={{ marginRight: '215px' }}>
          <div className="contact-content">
            <h2>Ready to Transform Your Workflow?</h2>
            <p>
              Contact our team to discuss how Rutomatrix can meet your specific
              requirements.
            </p>
            <button
              className="contact-btn"
              onClick={() => scrollToSection("hero")}
            >
              Contact us <ArrowRight color="#ffffff" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo"> </div>
            <img src={tes_logo} className="footer-logo-img" />
          </div>
          <div className="footer-links">
            <h4>Product Engineering Services</h4>
            <ul>
              <li
                onClick={() =>
                  window.open(
                    "https://embedded.tessolve.com/embedded-hardware/",
                    "_blank"
                  )
                }
              >
                {" "}
                Embedded Hardware{" "}
              </li>
              <li
                onClick={() =>
                  window.open(
                    "https://embedded.tessolve.com/industries/",
                    "_blank"
                  )
                }
              >
                Industries
              </li>
              <li
                onClick={() =>
                  window.open(
                    "https://embedded.tessolve.com/system-on-module/",
                    "_blank"
                  )
                }
              >
                System on Module
              </li>
              <li>Documentation</li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Labs</h4>
            <ul>
              <li
                onClick={() =>
                  window.open(
                    "https://embedded.tessolve.com/product-validation-lab/",
                    "_blank"
                  )
                }
              >
                Product Validation Lab
              </li>
              <li
                onClick={() =>
                  window.open(
                    "https://embedded.tessolve.com/automotive-software-lab/",
                    "_blank"
                  )
                }
              >
                Automotive Software Lab
              </li>
              <li
                onClick={() =>
                  window.open(
                    "https://embedded.tessolve.com/post-silicon-validation-lab/",
                    "_blank"
                  )
                }
              >
                Post-silicon Validation Lab
              </li>
              <li
                onClick={() =>
                  window.open(
                    "https://embedded.tessolve.com/wireless-testing-lab/",
                    "_blank"
                  )
                }
              >
                Wireless Testing Lab
              </li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li
                onClick={() =>
                  window.open(
                    "https://embedded.tessolve.com/about-us/",
                    "_blank"
                  )
                }
              >
                About Us
              </li>
              <li
                onClick={() =>
                  window.open(
                    "https://embedded.tessolve.com/system-and-software-partners/",
                    "_blank"
                  )
                }
              >
                System & Software Partners
              </li>
            </ul>
          </div>
        </div>

        <div className="copyright">
          <p>
            © {new Date().getFullYear()} Copyright © 2025 Tessolve | Privacy
            Policy | Cookies Policy
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
