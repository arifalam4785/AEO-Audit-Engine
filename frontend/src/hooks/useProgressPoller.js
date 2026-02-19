import { useState, useEffect, useRef, useCallback } from 'react';
import { getSessionProgress } from '../lib/api';

const POLL_INTERVAL = 1500; // Poll every 1.5 seconds

/**
 * Custom hook that polls the Express backend for session progress.
 * Automatically stops polling when the session reaches a terminal state
 * (completed, cancelled, or error).
 *
 * Resilient: tolerates up to 5 consecutive poll failures before giving up.
 *
 * Usage:
 *   const poller = useProgressPoller(sessionId);
 *   // poller.data — latest session data from backend
 *   // poller.overallPercent — 0-100 overall completion
 *   // poller.isCompleted — true when all 120 calls are done
 */
export function useProgressPoller(sessionId) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const errCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Don't poll if no sessionId
    if (!sessionId) {
      setData(null);
      return;
    }

    errCountRef.current = 0;
    const MAX_ERRORS = 5;

    const poll = async () => {
      try {
        const result = await getSessionProgress(sessionId);
        setData(result);
        setError(null);
        errCountRef.current = 0; // Reset on success

        // Stop polling when session reaches a terminal state
        if (['completed', 'cancelled', 'error'].includes(result.status)) {
          stopPolling();
        }
      } catch (err) {
        errCountRef.current += 1;
        console.warn(
          `Poll error (${errCountRef.current}/${MAX_ERRORS}):`,
          err.message
        );

        // Only stop after multiple consecutive failures
        if (errCountRef.current >= MAX_ERRORS) {
          setError(err.message);
          stopPolling();
        }
        // Otherwise keep polling — transient errors are normal
      }
    };

    // Fetch immediately on mount
    poll();

    // Then poll at interval
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    // Cleanup on unmount or sessionId change
    return () => stopPolling();
  }, [sessionId, stopPolling]);

  // Calculate overall percentage across all 3 platforms
  const overallPercent =
    data && data.questionCount > 0
      ? ((data.progress.claude + data.progress.chatgpt + data.progress.gemini) /
          (data.questionCount * 3)) *
        100
      : 0;

  return {
    data,
    error,
    overallPercent,
    isRunning: data?.status === 'running',
    isCompleted: data?.status === 'completed',
    isCancelled: data?.status === 'cancelled',
    isError: data?.status === 'error',
    stopPolling,
  };
}