import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Terminal, RefreshCw, AlertCircle, CheckCircle, Info, XCircle, Bug } from 'lucide-react-native';
import { ScreenLayout } from '../ScreenLayout';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { BASE_URL } from '../../constants/pdfParserApi';

// Timeout for logs fetch (should be quick)
const LOGS_FETCH_TIMEOUT_MS = 10 * 1000; // 10 seconds

interface BackendLog {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'success';
  message: string;
  source?: string;
}

interface TroubleshootingScreenProps {
  onOpenMappingDebug?: () => void;
}

export const TroubleshootingScreen: React.FC<TroubleshootingScreenProps> = ({ onOpenMappingDebug }) => {
  const [logs, setLogs] = useState<BackendLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveErrorsRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch logs from backend
  const fetchLogs = async (silent: boolean = false) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, LOGS_FETCH_TIMEOUT_MS);
      
      const response = await fetch(`${BASE_URL}/api/logs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal as any,
      });
      
      clearTimeout(timeoutId);
      abortControllerRef.current = null;

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status}`);
      }

      const data = await response.json();
      // Backend returns { success: true, logs: [...] } or { logs: [...] }
      const logsArray = data.logs || [];
      setLogs(logsArray);
      consecutiveErrorsRef.current = 0; // Reset error count on success
      setConsecutiveErrors(0);
    } catch (err: any) {
      // Don't process errors if request was intentionally aborted (cleanup)
      if (err.name === 'AbortError' && abortControllerRef.current === null) {
        return; // This was a cleanup abort, ignore it
      }

      consecutiveErrorsRef.current += 1;
      const newErrorCount = consecutiveErrorsRef.current;
      setConsecutiveErrors(newErrorCount);
      
      // Only show error message, don't spam console
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        setError('Request timed out. Backend may be slow or unreachable.');
        // Don't log timeout errors to console - they're expected if backend isn't running
      } else if (err.message?.includes('Network request failed') || err.message?.includes('Network request timed out')) {
        setError('Cannot connect to backend. Make sure the server is running.');
        // Only log network errors on first occurrence
        if (newErrorCount === 1 && !silent) {
          console.warn('[TroubleshootingScreen] Cannot connect to backend:', BASE_URL);
        }
      } else {
        setError(err.message || 'Failed to fetch logs');
        // Only log unexpected errors
        if (newErrorCount === 1 && !silent) {
          console.error('[TroubleshootingScreen] Error fetching logs:', err.message);
        }
      }
      
      // Auto-disable refresh after 5 consecutive errors
      if (newErrorCount >= 5 && autoRefresh) {
        setAutoRefresh(false);
        setError('Auto-refresh disabled after multiple connection failures. Please check your backend server.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      abortControllerRef.current = null;
    }
  };

  // Auto-refresh logs every 2 seconds
  useEffect(() => {
    if (autoRefresh) {
      // Don't call fetchLogs here - let the initial load effect handle it
      refreshIntervalRef.current = setInterval(() => {
        fetchLogs(true); // Silent refresh to avoid loading spinner
      }, 2000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  // Initial load and cleanup
  useEffect(() => {
    fetchLogs();
    
    return () => {
      // Cleanup: abort any pending requests and clear intervals
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logs.length > 0 && autoRefresh) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [logs.length, autoRefresh]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLogs();
  };

  const getLogIcon = (level: BackendLog['level']) => {
    switch (level) {
      case 'error':
        return <XCircle size={16} color={COLORS.status.error} />;
      case 'warn':
        return <AlertCircle size={16} color={COLORS.status.warning} />;
      case 'success':
        return <CheckCircle size={16} color={COLORS.status.success} />;
      default:
        return <Info size={16} color={COLORS.primary.light} />;
    }
  };

  const getLogColor = (level: BackendLog['level']) => {
    switch (level) {
      case 'error':
        return COLORS.status.error;
      case 'warn':
        return COLORS.status.warning;
      case 'success':
        return COLORS.status.success;
      default:
        return COLORS.text.primary;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <ScreenLayout>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary.light}
          />
        }
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Terminal size={24} color={COLORS.primary.light} />
              <Typography variant="h3" style={{ marginLeft: SPACING.s }}>
                Backend Logs
              </Typography>
            </View>
            <View style={styles.headerControls}>
              {onOpenMappingDebug && (
                <TouchableOpacity
                  onPress={onOpenMappingDebug}
                  style={[styles.controlButton, styles.mappingDebugButton]}
                >
                  <Bug size={20} color={COLORS.primary.light} />
                  <Typography
                    variant="caption"
                    style={{
                      marginLeft: SPACING.xs,
                      color: COLORS.primary.light,
                    }}
                  >
                    Mapping Debug
                  </Typography>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setAutoRefresh(!autoRefresh)}
                style={[
                  styles.controlButton,
                  autoRefresh && styles.controlButtonActive,
                ]}
              >
                <RefreshCw
                  size={20}
                  color={autoRefresh ? COLORS.primary.light : COLORS.text.secondary}
                />
                <Typography
                  variant="caption"
                  style={{
                    marginLeft: SPACING.xs,
                    color: autoRefresh ? COLORS.primary.light : COLORS.text.secondary,
                  }}
                >
                  Auto
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRefresh}
                style={styles.controlButton}
              >
                <RefreshCw size={20} color={COLORS.primary.light} />
              </TouchableOpacity>
            </View>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color={COLORS.status.error} />
              <View style={{ flex: 1, marginLeft: SPACING.xs }}>
                <Typography variant="caption" color={COLORS.status.error}>
                  {error}
                </Typography>
                {consecutiveErrors > 0 && (
                  <Typography variant="caption" color={COLORS.text.secondary} style={{ marginTop: SPACING.xs }}>
                    Connection attempts: {consecutiveErrors}
                  </Typography>
                )}
                {BASE_URL && (
                  <Typography variant="caption" color={COLORS.text.secondary} style={{ marginTop: SPACING.xs, fontSize: 10 }}>
                    Backend URL: {BASE_URL}
                  </Typography>
                )}
              </View>
            </View>
          )}

          <View style={styles.statsContainer}>
            <Typography variant="caption" color={COLORS.text.secondary}>
              Total Logs: {logs.length}
            </Typography>
            <Typography variant="caption" color={COLORS.text.secondary}>
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
            </Typography>
          </View>
        </Card>

        {/* Loading Indicator */}
        {isLoading && logs.length === 0 && (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="small" color={COLORS.primary.light} />
            <Typography variant="body" style={{ marginLeft: SPACING.s }}>
              Loading logs...
            </Typography>
          </Card>
        )}

        {/* Logs List */}
        {logs.length === 0 && !isLoading && (
          <Card style={styles.emptyCard}>
            <Typography variant="body" color={COLORS.text.secondary} style={{ textAlign: 'center' }}>
              No logs available yet. Logs will appear here as the backend processes requests.
            </Typography>
          </Card>
        )}

        {logs.map((log, index) => (
          <Card key={index} style={styles.logCard}>
            <View style={styles.logHeader}>
              <View style={styles.logHeaderLeft}>
                {getLogIcon(log.level)}
                <Typography
                  variant="caption"
                  style={{
                    marginLeft: SPACING.xs,
                    color: getLogColor(log.level),
                    fontWeight: '600',
                  }}
                >
                  {log.level.toUpperCase()}
                </Typography>
                {log.source && (
                  <Typography
                    variant="caption"
                    color={COLORS.text.secondary}
                    style={{ marginLeft: SPACING.xs }}
                  >
                    [{log.source}]
                  </Typography>
                )}
              </View>
              <Typography variant="caption" color={COLORS.text.secondary}>
                {formatTimestamp(log.timestamp)}
              </Typography>
            </View>
            <Typography
              variant="body"
              style={{
                marginTop: SPACING.xs,
                fontFamily: 'monospace',
                fontSize: 12,
                color: COLORS.text.primary,
              }}
            >
              {log.message}
            </Typography>
          </Card>
        ))}

        {/* Bottom spacing */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  content: {
    padding: SPACING.m,
  },
  headerCard: {
    marginBottom: SPACING.m,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.s,
    backgroundColor: COLORS.background.tertiary,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  mappingDebugButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.s,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BORDER_RADIUS.s,
    marginBottom: SPACING.s,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.s,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.tertiary,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.l,
    marginBottom: SPACING.m,
  },
  emptyCard: {
    padding: SPACING.l,
    marginBottom: SPACING.m,
  },
  logCard: {
    marginBottom: SPACING.s,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  logHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});

