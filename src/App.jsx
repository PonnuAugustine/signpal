import { useState, useEffect, useRef } from 'react'
import './App.css'
import ASLDetector from './components/ASLDetector'
import LandingPage from './components/LandingPage'
import SpeechToText from './components/SpeechToText'

function App() {
  const [result, setResult] = useState('')
  const [history, setHistory] = useState([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [showLandingPage, setShowLandingPage] = useState(true)
  const [responseText, setResponseText] = useState('')
  const lastResultRef = useRef({ letter: '', timestamp: 0 })

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [showLandingPage]);

  // Handle result from ASL detector
  const handleDetectionResult = (detectionResult) => {
    if (isTranslating) {
      // Special handling for delete/backspace
      if (detectionResult.letter === 'del') {
        // Remove the last letter from history
        setHistory(prev => prev.length > 0 ? prev.slice(0, -1) : []);
        setResult("Backspace detected - last letter removed");
        return;
      }
      
      // Prevent duplicate results by checking if this is the same letter within a short time window
      const now = Date.now()
      const timeSinceLastResult = now - lastResultRef.current.timestamp
      const isDuplicate = detectionResult.letter === lastResultRef.current.letter && timeSinceLastResult < 2000

      if (!isDuplicate) {
        // Update the result text
        setResult(`Detected sign: "${detectionResult.letter}" (Confidence: ${(detectionResult.confidence * 100).toFixed(2)}%)`)
        
        // Add to history
        setHistory(prev => [...prev, detectionResult.letter])
        
        // Update the last result reference
        lastResultRef.current = {
          letter: detectionResult.letter,
          timestamp: now
        }
      }
    }
  }

  // Handle speech-to-text result
  const handleSpeechText = (text) => {
    setResponseText(text);
  }

  // Speak the text
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      speechSynthesis.speak(utterance)
    } else {
      alert("Text-to-speech not supported in your browser")
    }
  }

  // Add space to separate words
  const addSpace = () => {
    setHistory(prev => [...prev, ' ']);
    setResult("Space added - start new word");
  }

  // Clear history
  const clearHistory = () => {
    setHistory([])
    lastResultRef.current = { letter: '', timestamp: 0 }
  }

  // Remove last sign from history
  const removeLastSign = () => {
    setHistory(prev => prev.length > 0 ? prev.slice(0, -1) : []);
  }

  // Remove last word from response
  const removeLastWordFromResponse = () => {
    setResponseText(prev => {
      const words = prev.trim().split(' ');
      if (words.length <= 1) return '';
      return words.slice(0, -1).join(' ');
    });
  }

  // Toggle translation state
  const toggleTranslation = () => {
    setIsTranslating(prev => !prev)
    if (!isTranslating) {
      setResult("Translation started. Show a sign to the camera...")
    } else {
      setResult("Translation stopped")
    }
  }

  // Toggle between landing page and app
  const startApp = () => {
    setShowLandingPage(false)
  }

  // Return to landing page
  const returnToLanding = () => {
    setShowLandingPage(true)
    setIsTranslating(false)
    setResult('')
  }

  // Format history for display and speaking
  const formatHistoryText = () => {
    // Join all characters, but treat spaces as word separators
    return history.join('').split(' ').filter(word => word.length > 0).join(' ');
  }

  if (showLandingPage) {
    return <LandingPage onStartApp={startApp} />
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 onClick={returnToLanding} style={{ cursor: 'pointer' }}>SignPal</h1>
        <p>Real-time Sign Language Translation</p>
      </header>

      <main className="main-content">
        <div className="webcam-container">
          <ASLDetector onResult={handleDetectionResult} />
          
          <div className="controls">
            <button 
              className={`control-button ${isTranslating ? 'stop-button' : 'start-button'}`}
              onClick={toggleTranslation}
            >
              {isTranslating ? 'Stop Translation' : 'Start Translation'}
            </button>
          </div>
        </div>

        <div className="result-container">
          <div className="detection-result">
            <h2>Detection Result</h2>
            <p className="result-text">{result || "No sign detected yet"}</p>
            {result && (
              <button 
                className="speak-button" 
                onClick={() => speakText(result)}
              >
                Speak Result
              </button>
            )}
          </div>

          <div className="translation-history">
            <div className="history-header">
              <h2>Translation History</h2>
              <div className="button-group">
                <button 
                  className="backspace-button"
                  onClick={removeLastSign}
                  disabled={history.length === 0}
                  title="Remove last sign"
                >
                  ⌫
                </button>
                <button 
                  className="clear-button"
                  onClick={clearHistory}
                  disabled={history.length === 0}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="history-content">
              {history.length > 0 ? (
                <p>{history.join('')}</p>
              ) : (
                <p className="placeholder-text">No translations yet</p>
              )}
              {history.length > 0 && (
                <div className="history-actions">
                  <button 
                    className="space-button"
                    onClick={addSpace}
                    title="Add space between words"
                  >
                    Space
                  </button>
                  <button 
                    className="speak-button"
                    onClick={() => speakText(formatHistoryText())}
                  >
                    Speak All
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="response-container">
            <div className="response-header">
              <h2>Speak Your Response</h2>
              {responseText && (
                <button 
                  className="backspace-button"
                  onClick={removeLastWordFromResponse}
                  title="Remove last word"
                >
                  ⌫
                </button>
              )}
            </div>
            <p className="response-text">{responseText || "Your spoken response will appear here..."}</p>
            <SpeechToText onTextChange={handleSpeechText} />
          </div>
        </div>
      </main>

      <section className="about-section">
        <h2>About SignPal</h2>
        <p>
          SignPal is a real-time sign language translation tool designed to break down 
          communication barriers between the hearing-impaired community and those 
          unfamiliar with sign language.
        </p>
        <p>
          Using advanced machine learning and computer vision, SignPal translates 
          American Sign Language (ASL) gestures into text and speech, enabling seamless 
          communication without requiring an interpreter.
        </p>
      </section>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} SignPal - Bridging communication gaps with technology</p>
      </footer>
    </div>
  )
}

export default App
