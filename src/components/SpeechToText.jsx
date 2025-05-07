import { useState, useEffect, useCallback, useRef } from 'react';

const SpeechToText = ({ onTextChange }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  // Define onTextChange as a callback to avoid issues
  const updateTranscript = useCallback((newTranscript) => {
    setTranscript(newTranscript);
    onTextChange(newTranscript);
  }, [onTextChange]);

  // Initialize speech recognition on component mount
  useEffect(() => {
    return () => {
      // Clean up recognition when component unmounts
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition on unmount:', e);
        }
      }
    };
  }, []);

  // Handle changes to isListening state
  useEffect(() => {
    if (isListening) {
      startListening();
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
  }, [isListening]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Your browser does not support speech recognition.');
      return;
    }

    try {
      // Create a new recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configure for continuous recognition
      recognition.lang = 'en-US';
      recognition.continuous = true; // Essential for continuous listening
      recognition.interimResults = true;
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setError('');
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // Process all results
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        console.log('Speech recognized:', finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          // Only update with final results to avoid flickering
          const newText = transcript ? `${transcript} ${finalTranscript.trim()}` : finalTranscript.trim();
          updateTranscript(newText);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          console.log('No speech detected, continuing to listen...');
        } else {
          setError(`Error: ${event.error}`);
          setIsListening(false);
        }
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        
        // If we're still supposed to be listening but recognition ended
        if (isListening) {
          console.log('Restarting speech recognition');
          
          // Small delay before restarting to avoid rapid restart loops
          setTimeout(() => {
            if (isListening) {
              try {
                recognition.start();
              } catch (e) {
                console.error('Error restarting recognition:', e);
                setIsListening(false);
                setError('Failed to restart listening');
              }
            }
          }, 300);
        }
      };
      
      // Start recognition
      recognition.start();
      recognitionRef.current = recognition;
      
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError(`Failed to start: ${err.message}`);
      setIsListening(false);
    }
  };
  
  const toggleListening = () => {
    setIsListening(!isListening);
  };
  
  const clearTranscript = () => {
    updateTranscript('');
  };

  return (
    <div className="speech-to-text">
      <div className="speech-controls">
        {(!error || error.includes('Error:')) ? (
          <>
            <button 
              className={`speech-button ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
            >
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </button>
            
            {transcript && (
              <button 
                className="clear-button"
                onClick={clearTranscript}
              >
                Clear
              </button>
            )}
          </>
        ) : (
          <div className="error">{error}</div>
        )}
      </div>
      
      <div className="speech-status">
        {isListening && <div className="listening-indicator">Listening...</div>}
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default SpeechToText; 