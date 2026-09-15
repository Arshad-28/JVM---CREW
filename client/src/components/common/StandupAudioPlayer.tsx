import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface StandupAudioPlayerProps {
  audioUrl?: string; // Pre-loaded URL or blob URL (e.g. for preview before submission)
  standupId?: number; // Backend standup ID (fetches authenticated blob URL)
  initialDurationSeconds?: number;
  filename?: string;
  title?: string;
  compact?: boolean;
  showDownload?: boolean;
  autoPlay?: boolean;
  onPlay?: () => void;
  onRerecord?: () => void;
  className?: string;
}

export const StandupAudioPlayer: React.FC<StandupAudioPlayerProps> = ({
  audioUrl,
  standupId,
  initialDurationSeconds,
  filename,
  title = 'Voice Standup Recording',
  compact = false,
  showDownload = true,
  autoPlay = false,
  onPlay,
  onRerecord,
  className = '',
}) => {
  const [srcUrl, setSrcUrl] = useState<string | null>(audioUrl || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(!audioUrl && !!standupId);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(initialDurationSeconds || 0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlCreatedRef = useRef<string | null>(null);

  useEffect(() => {
    if (audioUrl && audioUrl.startsWith('blob:')) {
      setSrcUrl(audioUrl);
      setIsLoading(false);
      setError(null);
      return;
    }

    const effectiveStandupId = standupId || (audioUrl && audioUrl.match(/\/standups\/(\d+)/)?.[1] ? parseInt(audioUrl.match(/\/standups\/(\d+)/)![1], 10) : null);

    if (effectiveStandupId) {
      let isMounted = true;
      setIsLoading(true);
      setError(null);

      api.getVoiceRecordingBlobUrl(effectiveStandupId)
        .then((blobUrl) => {
          if (isMounted) {
            blobUrlCreatedRef.current = blobUrl;
            setSrcUrl(blobUrl);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.error('Failed to load standup voice recording:', err);
            setError(err.message || 'Unable to load this recording.');
            setIsLoading(false);
          }
        });

      return () => {
        isMounted = false;
        if (blobUrlCreatedRef.current) {
          window.URL.revokeObjectURL(blobUrlCreatedRef.current);
          blobUrlCreatedRef.current = null;
        }
      };
    } else if (audioUrl) {
      setSrcUrl(audioUrl);
      setIsLoading(false);
      setError(null);
    } else {
      setSrcUrl(null);
      setIsLoading(false);
    }
  }, [audioUrl, standupId]);

  useEffect(() => {
    if (audioRef.current && srcUrl) {
      try {
        audioRef.current.load();
      } catch (e) {
        console.warn('Audio load error:', e);
      }
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [srcUrl]);

  useEffect(() => {
    if (srcUrl && autoPlay && audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          onPlay?.();
        })
        .catch((err) => {
          console.warn('AutoPlay prevented or failed:', err);
        });
    }
  }, [srcUrl, autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current || !srcUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          onPlay?.();
        })
        .catch((err) => {
          console.error('Playback failed:', err);
          setError('Unable to play this recording. Please re-record it.');
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      if (audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const handleDownload = () => {
    if (standupId) {
      api.downloadVoiceRecording(standupId, filename);
    } else if (srcUrl) {
      const link = document.createElement('a');
      link.href = srcUrl;
      link.setAttribute('download', filename || 'standup_recording.webm');
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className={`p-3 bg-paper-dark border border-line rounded-xs flex items-center justify-center space-x-2 text-xs font-mono text-muted ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
        <span>Loading recording...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-3 bg-attention/10 border border-attention text-attention rounded-xs flex items-center justify-between text-xs font-mono ${className}`}>
        <div className="flex items-center space-x-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
        <div className="flex items-center space-x-2">
          {onRerecord && (
            <button
              onClick={onRerecord}
              className="px-2.5 py-1 bg-attention text-paper font-bold hover:bg-attention-dark rounded-xs transition-colors"
            >
              Re-record
            </button>
          )}
          {standupId && !onRerecord && (
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                api.getVoiceRecordingBlobUrl(standupId)
                  .then((blobUrl) => {
                    setSrcUrl(blobUrl);
                    setIsLoading(false);
                  })
                  .catch((e) => {
                    setError(e.message || 'Unable to play this recording. Please re-record it.');
                    setIsLoading(false);
                  });
              }}
              className="px-2 py-0.5 border border-attention hover:bg-attention hover:text-white rounded-xs transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 font-mono text-xs ${className}`}>
        <audio
          ref={audioRef}
          src={srcUrl || undefined}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={(e) => {
            console.error('Audio element error:', e);
            setError('Unable to play this recording. Please re-record it.');
          }}
          onPlay={() => {
            setIsPlaying(true);
            onPlay?.();
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          preload="metadata"
        />
        <button
          type="button"
          onClick={togglePlay}
          className="px-2.5 py-1 bg-ink text-paper hover:bg-ink-light rounded-xs transition-colors flex items-center space-x-1.5 font-bold text-xs"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current text-accent" />
              <span>Play</span>
            </>
          )}
        </button>
        <span className="text-[11px] text-muted">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    );
  }

  return (
    <div className={`p-3.5 bg-paper border border-line rounded-xs space-y-3 font-mono text-xs shadow-2xs ${className}`}>
      <audio
        ref={audioRef}
        src={srcUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={(e) => {
          console.error('Audio element error:', e);
          setError('Unable to play this recording. Please re-record it.');
        }}
        onPlay={() => {
          setIsPlaying(true);
          onPlay?.();
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        preload="metadata"
      />

      {/* Top bar: Title & Audio meta */}
      <div className="flex items-center justify-between border-b border-line pb-2">
        <span className="font-bold text-ink truncate text-[11px] flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}`} />
          <span>{title}</span>
        </span>
        <div className="flex items-center space-x-2 text-[10px] text-muted">
          <button
            type="button"
            onClick={cyclePlaybackRate}
            className="px-1.5 py-0.5 border border-line rounded-xs hover:border-ink hover:text-ink font-bold transition-colors"
            title="Change playback speed"
          >
            {playbackRate}x
          </button>
          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              className="p-1 text-muted hover:text-ink transition-colors"
              title="Download voice recording"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Scrubber */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={duration > 0 ? duration : 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-paper-dark rounded-xs accent-ink cursor-pointer"
        />
        <div className="flex items-center justify-between text-[10px] text-muted">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between pt-1">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="px-3 py-1.5 bg-ink text-paper hover:bg-ink-light rounded-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-accent" />
              <span>Play</span>
            </>
          )}
        </button>

        {/* Volume Control */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1 text-muted hover:text-ink transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-attention" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-paper-dark rounded-xs accent-ink cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
