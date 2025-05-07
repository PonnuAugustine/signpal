import { useState, useEffect } from 'react';
import '../styles/LandingPage.css';

const LandingPage = ({ onStartApp }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Handle smooth scrolling for anchor links
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const target = e.target;
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetId = target.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          // Account for fixed header height
          const headerHeight = document.querySelector('.landing-header').offsetHeight;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Close mobile menu if open
          setIsOpen(false);
        }
      }
    };

    document.querySelector('.landing-container').addEventListener('click', handleAnchorClick);
    
    return () => {
      document.querySelector('.landing-container')?.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo-container">
          <h1 className="landing-logo">SignPal</h1>
        </div>
        <nav className="landing-nav">
          <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
            <span className="menu-icon"></span>
          </button>
          <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#about">About</a></li>
            <li><button className="nav-cta-btn" onClick={onStartApp}>Start Translating</button></li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-content">
            <h1>Breaking communication barriers with AI</h1>
            <p>
              SignPal translates American Sign Language to text and speech in 
              real-time, making communication accessible for everyone.
            </p>
            <button className="hero-cta-btn" onClick={onStartApp}>
              Try SignPal Now
            </button>
          </div>
          <div className="hero-image">
            <div className="image-placeholder">
              <div className="animation-hand"></div>
            </div>
          </div>
        </section>

        <section id="features" className="features-section">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Real-Time Detection</h3>
              <p>Instantly recognizes ASL alphabet signs through your webcam</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔊</div>
              <h3>Text-to-Speech</h3>
              <p>Converts detected signs into spoken words for two-way communication</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>No Installation</h3>
              <p>Works directly in your browser, no downloads or installations needed</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Privacy Focused</h3>
              <p>All processing happens locally - your videos never leave your device</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="how-it-works-section">
          <h2>How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Grant Camera Access</h3>
              <p>Allow SignPal to use your webcam for sign detection</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Position Your Hand</h3>
              <p>Make sure your hand is visible in the camera frame</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Show ASL Signs</h3>
              <p>Perform American Sign Language gestures</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Get Instant Translation</h3>
              <p>See the translated text and hear it spoken aloud</p>
            </div>
          </div>
          <button className="start-btn" onClick={onStartApp}>
            Start Using SignPal
          </button>
        </section>

        <section id="about" className="about-section-landing">
          <h2>About the Project</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                SignPal was developed to break down communication barriers between the 
                hearing-impaired community and those unfamiliar with sign language. 
              </p>
              <p>
                Using advanced machine learning and computer vision technologies, 
                SignPal can recognize American Sign Language (ASL) gestures in real-time 
                and translate them into text and speech.
              </p>
              <p>
                This project aims to promote inclusivity by providing a tool that 
                facilitates seamless communication without the need for an interpreter, 
                making interaction more accessible in various settings such as educational 
                institutions, workplaces, and public services.
              </p>
            </div>
            <div className="tech-stack">
              <h3>Technology Stack</h3>
              <ul>
                <li>React.js + Vite</li>
                <li>TensorFlow.js</li>
                <li>Handpose model</li>
                <li>Web Speech API</li>
                <li>Custom CNN model</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h2>SignPal</h2>
            <p>Bridging communication gaps with technology</p>
          </div>
          <div className="footer-links">
            <div className="footer-links-section">
              <h3>Navigate</h3>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#about">About</a></li>
              </ul>
            </div>
            <div className="footer-links-section">
              <h3>Resources</h3>
              <ul>
                <li><a href="https://www.handspeak.com/" target="_blank" rel="noopener noreferrer">Learn ASL</a></li>
                <li><a href="https://www.nad.org/" target="_blank" rel="noopener noreferrer">National Association of the Deaf</a></li>
                <li><a href="https://www.tensorflow.org/js" target="_blank" rel="noopener noreferrer">TensorFlow.js</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} SignPal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 