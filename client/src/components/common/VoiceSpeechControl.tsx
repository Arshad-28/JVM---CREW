import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceSpeechControlProps {
  onTranscript: (text: string, mode: 'replace' | 'append') => void;
  existingText?: string;
  disabled?: boolean;
}

export const VoiceSpeechControl: React.FC<VoiceSpeechControlProps> = ({
  onTranscript,
  existingText = '',
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcribedChunk, setTranscribedChunk] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API availability
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        const cleaned = currentTranscript.trim();
        if (cleaned) {
          setTranscribedChunk(cleaned);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage("Couldn't access your microphone. You can type your response instead.");
        } else if (event.error === 'no-speech') {
          // Ignored, user was silent
        } else {
          setErrorMessage("Voice transcription isn't available right now. You can type your response.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const handleStartListening = () => {
    setErrorMessage(null);
    setTranscribedChunk(null);

    if (!recognitionRef.current) {
      setErrorMessage("Voice transcription isn't supported in this browser. You can type your response.");
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err: any) {
      // If already started, restart
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current.start();
          setIsListening(true);
        }, 100);
      } catch (e) {
        setErrorMessage("Couldn't start voice recognition. You can type your response instead.");
      }
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);

    if (transcribedChunk) {
      if (existingText.trim()) {
        // Has existing text: show choice or append by default
        onTranscript(transcribedChunk, 'append');
      } else {
        onTranscript(transcribedChunk, 'replace');
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {!isListening ? (
          <button
            type="button"
            onClick={handleStartListening}
            disabled={disabled}
            className="px-3 py-1.5 bg-paper border border-line hover:border-ink hover:bg-paper-dark text-ink font-mono text-xs font-semibold rounded-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Mic className="w-3.5 h-3.5 text-accent" />
            <span>{existingText.trim() ? '🎙 Speak (Add / Replace)' : '🎙 Speak'}</span>
          </button>
        ) : (
          <div className="flex items-center space-x-3 p-2 bg-paper-dark border border-accent/40 rounded-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-attention animate-pulse" />
              <span className="font-mono text-xs font-bold text-ink">● Listening... Speak your answer</span>
            </div>
            <button
              type="button"
              onClick={handleStopListening}
              className="px-3 py-1 bg-ink text-paper font-mono text-xs font-semibold rounded-xs hover:bg-ink-light flex items-center space-x-1"
            >
              <MicOff className="w-3 h-3" />
              <span>Done</span>
            </button>
          </div>
        )}

        {isListening && transcribedChunk && (
          <span className="font-mono text-[11px] text-muted truncate max-w-xs">
            "{transcribedChunk}"
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="p-2.5 bg-paper-dark border border-line text-[11px] text-muted rounded-sm flex items-start space-x-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
