import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UploadScreen } from '../components/screens/UploadScreen';
import { DomainsScreen } from '../components/screens/DomainsScreen';
// FitnessPlanScreen removed - using PlanViewerScreen instead
import { PlanViewerScreen } from '../components/screens/PlanViewerScreen';
import { JourneyScreen } from '../components/screens/JourneyScreen';
import { ProgressScreen } from '../components/screens/ProgressScreen';
import { SettingsScreen } from '../components/screens/SettingsScreen';
import { TroubleshootingScreen } from '../components/screens/TroubleshootingScreen';
import { MappingDebugScreen } from '../components/screens/MappingDebugScreen';
import { COLORS } from '../constants/theme';
import { UniversalFitnessPlan } from '../constants/fitnessTypes';
import { ProgramForTracking } from '../shared/programTrackingSchema';
import { createParseJob, pollJobStatus, JobStatus, BASE_URL } from '../constants/pdfParserApi';
import { BottomNavigation, Tab } from '../components/ui/BottomNavigation';
import { LogEntry } from '../components/ui/LogViewer';
import { Typography } from '../components/ui/Typography';

// Constants
const STORAGE_KEY_PREFIX = "parsed_doc_";

type Screen = 'domains' | 'upload' | 'fitness' | 'journey' | 'progress' | 'troubleshooting' | 'mappingDebug' | 'help';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('upload'); // Default to upload (Home)
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePlan, setActivePlan] = useState<UniversalFitnessPlan | null>(null);
  const [activeNormalizedPlan, setActiveNormalizedPlan] = useState<ProgramForTracking | null>(null);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [parsingStartTime, setParsingStartTime] = useState<number | null>(null);

  // Logging State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [backendLogs, setBackendLogs] = useState<Array<{ timestamp: string; level: 'info' | 'error' | 'warn' | 'success'; message: string; source?: string }>>([]);

  const addLog = (message: string, type: LogEntry['type'] = 'info', data?: any) => {
    setLogs(prev => [...prev, { timestamp: Date.now(), message, type, data }]);
  };

  // Fetch backend logs from the API
  const fetchBackendLogs = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/logs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns { success: true, logs: [...] } or { logs: [...] }
        const logsArray = data.logs || [];
        setBackendLogs(logsArray);
      }
    } catch (err) {
      // Silently fail - backend logs are optional
      console.debug('[App] Failed to fetch backend logs:', err);
    }
  };

  // Load documents on mount
  useEffect(() => {
    loadAllDocuments();
  }, []);

  const loadAllDocuments = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const docKeys = keys.filter(k => k.startsWith(STORAGE_KEY_PREFIX));
      const docs = await AsyncStorage.multiGet(docKeys);

      const parsedDocs = docs.map(([key, value]) => {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch (e) {
          return null;
        }
      }).filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);

      setDocuments(parsedDocs);
    } catch (e) {
      console.error("Failed to load documents", e);
    }
  };

  const handleReset = async () => {
    try {
      // Clear all documents from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const docKeys = keys.filter(k => k.startsWith(STORAGE_KEY_PREFIX));
      if (docKeys.length > 0) {
        await AsyncStorage.multiRemove(docKeys);
      }
      
      // Clear state
      setDocuments([]);
      setActivePlan(null);
      setLogs([]);
      setSelectedFile(null);
      setError("");
      
      // Reload to confirm everything is cleared
      await loadAllDocuments();
    } catch (error) {
      console.error("Error clearing data:", error);
      // Still clear state even if AsyncStorage fails
      setDocuments([]);
      setActivePlan(null);
      setLogs([]);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setError("");
        addLog(`Selected file: ${result.assets[0].name}`, 'info', { size: result.assets[0].size });
      }
    } catch (err) {
      setError("Error picking file");
      addLog("Error picking file", 'error', err);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file first");
      return;
    }

    setIsLoading(true);
    setError("");
    setLogs([]); // Clear previous logs
    setBackendLogs([]); // Clear previous backend logs
    setShowLogs(true); // Auto-show logs on start
    setJobStatus(null);
    setIsPolling(false);
    setParsingStartTime(Date.now()); // Start timer immediately when button is pressed

    addLog("Starting upload process...", 'info');
    addLog('Creating async job...', 'info');

    try {
      // Create async job
      const jobResponse = await createParseJob({
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/pdf',
      });

      const { jobId } = jobResponse;
      addLog(`Job created: ${jobId}`, 'info');
      addLog('Processing PDF in background...', 'info');
      setIsPolling(true);
      // parsingStartTime already set when button was pressed
      
      // Set initial job status immediately so progress displays right away
      // Use progress from response if available, otherwise defaults
      const initialStatus: JobStatus = {
        jobId,
        status: 'pending',
        progress: jobResponse.progress || {
          processedPages: 0,
          totalPages: 0, // Will be updated on first poll
          processedChunks: 0,
          totalChunks: 0
        }
      };
      setJobStatus(initialStatus);

      // Fetch initial backend logs
      await fetchBackendLogs();

      // Set up interval to fetch backend logs during polling
      const logsIntervalId = setInterval(() => {
        fetchBackendLogs();
      }, 3000); // Fetch logs every 3 seconds (same as poll interval)

      try {
        // Poll job status with progress updates
        let normalizedPlan: any = null;
        const fitnessPlan = await pollJobStatus(
          jobId,
          (status) => {
            // Store normalized plan if available
            if (status.normalizedPlan) {
              normalizedPlan = status.normalizedPlan;
            }
            // Update job status for UI
            setJobStatus(status);
            
            // Log status for debugging
            console.log('[UploadScreen] Job status:', {
              status: status.status,
              progress: status.progress,
              hasError: !!status.error
            });
            
            // Update logs
            const progress = status.progress;
            const percent = progress.totalPages > 0 
              ? Math.round((progress.processedPages / progress.totalPages) * 100)
              : 0;
            
            addLog(
              `Processing: ${progress.processedPages}/${progress.totalPages} pages (${percent}%) - Chunks: ${progress.processedChunks}/${progress.totalChunks}`,
              'info'
            );

            // Fetch backend logs on each status update
            fetchBackendLogs();
          }
          // Uses default timeout (40 minutes) and poll interval (3 seconds) from pdfParserApi
        );

        // Clear logs interval when polling completes successfully
        clearInterval(logsIntervalId);
        
        // Final fetch of backend logs after completion
        await fetchBackendLogs();

        addLog("Upload and parsing successful!", 'success');
        setActivePlan(fitnessPlan);
        
        // Set normalized plan and program ID if available
        if (normalizedPlan) {
          setActiveNormalizedPlan(normalizedPlan);
          setActiveProgramId(jobId);
        }

        // Save to local storage (with normalized plan if available)
        const docEntry = {
          id: jobId,
          name: selectedFile.name,
          timestamp: Date.now(),
          plan: fitnessPlan,
          normalizedPlan: normalizedPlan || null
        };

        await AsyncStorage.setItem(
          `${STORAGE_KEY_PREFIX}${jobId}`,
          JSON.stringify(docEntry)
        );

        await loadAllDocuments();
        setCurrentScreen('fitness');
      } catch (pollError: any) {
        // Clear logs interval on error
        clearInterval(logsIntervalId);
        // Final fetch of backend logs even on error
        await fetchBackendLogs();
        throw pollError; // Re-throw to be caught by outer catch
      }
    } catch (err: any) {
      let errorMessage = "Something went wrong while parsing your PDF.";
      let userFriendlyMessage = "The PDF upload or parsing failed. You can try again or check the Logs tab for more details.";
      
      console.log('[App] Error caught:', err);
      
      // Log jobId if available for debugging
      if (err.jobId) {
        console.log('[App] Job ID:', err.jobId);
        addLog(`Job ID: ${err.jobId}`, 'error');
      }
      
      // Extract error message with better handling for network timeouts
      if (err.message) {
        errorMessage = err.message;
        // Check for timeout errors and add helpful context
        if (err.message.includes('timed out') || err.message.includes('timeout')) {
          userFriendlyMessage = "The upload took too long. This may happen with large files or slow connections. Please try again or check your internet connection.";
          addLog('Network timeout detected. This may happen with large files or slow connections.', 'error');
        } else if (err.message.includes('Failed to upload PDF')) {
          userFriendlyMessage = "Failed to upload the PDF to storage. Please check your connection and try again.";
        } else if (err.message.includes('Network request')) {
          userFriendlyMessage = "Network error. Please check your internet connection and try again.";
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(userFriendlyMessage);
      addLog(`Error: ${errorMessage}`, 'error');
      console.error("Upload error:", err);
      
      // Stop timer on error - keep it set so user can see how long it took before error
      // Timer will be cleared when user starts a new upload
      
    } finally {
      setIsLoading(false);
      setIsPolling(false);
      // Keep parsingStartTime set so counter shows final time even after error/completion
      // Timer will be cleared when user starts a new upload (in handleUpload)
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'upload':
        return (
          <UploadScreen
            onPickDocument={handlePickDocument}
            onUpload={handleUpload}
            selectedFile={selectedFile}
            isLoading={isLoading}
            isPolling={isPolling}
            jobStatus={jobStatus}
            parsingStartTime={parsingStartTime}
            error={error}
            logs={logs}
            showLogs={showLogs}
            onToggleLogs={() => setShowLogs(!showLogs)}
            backendLogs={backendLogs}
          />
        );
      case 'domains':
        return (
          <DomainsScreen
            documents={documents}
            onSelectDocument={(doc) => {
              setActivePlan(doc.plan);
              setActiveProgramId(doc.id);
              if ((doc as any).normalizedPlan) {
                setActiveNormalizedPlan((doc as any).normalizedPlan);
              } else {
                setActiveNormalizedPlan(null);
              }
              setCurrentScreen('fitness');
            }}
            onDeleteDocument={async (docId) => {
              const key = `${STORAGE_KEY_PREFIX}${docId}`;
              await AsyncStorage.removeItem(key);
              await loadAllDocuments();
            }}
            onSelectDomain={(domainId) => {
              console.log('Selected domain:', domainId);
            }}
            onOpenHelp={() => setCurrentScreen('help')}
          />
        );
      case 'fitness':
        if (!activePlan) return null;
        // Find the document that contains this plan to get normalized plan
        const doc = documents.find(d => {
          // Match by plan reference or by ID if plan has an id
          return d.plan === activePlan || (d.id && (activePlan as any).id === d.id);
        });
        const normalizedPlan = doc && (doc as any).normalizedPlan ? (doc as any).normalizedPlan : null;
        
        return (
          <PlanViewerScreen
            plan={activePlan}
            normalizedPlan={normalizedPlan}
            onBack={() => setCurrentScreen('domains')}
          />
        );
      case 'journey':
        if (!activeNormalizedPlan || !activeProgramId) {
          return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Typography variant="h3" style={{ marginBottom: 10, textAlign: 'center' }}>
                No Journey Available
              </Typography>
              <Typography variant="body" color={COLORS.text.secondary} style={{ textAlign: 'center', marginBottom: 20 }}>
                Please select a program with a normalized plan to view the journey.
              </Typography>
              <TouchableOpacity
                onPress={() => setCurrentScreen('domains')}
                style={{ padding: 10, backgroundColor: COLORS.primary.main + '20', borderRadius: 8 }}
              >
                <Typography variant="body" color={COLORS.primary.light}>
                  Go to Domains
                </Typography>
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <JourneyScreen
            program={activeNormalizedPlan}
            programId={activeProgramId}
            onBack={() => setCurrentScreen('domains')}
          />
        );
      case 'progress':
        return (
          <ProgressScreen
            program={activeNormalizedPlan}
            programId={activeProgramId}
            onBack={() => setCurrentScreen('domains')}
          />
        );
      case 'help':
        return (
          <HelpScreen
            onBack={() => setCurrentScreen('domains')}
          />
        );
      case 'troubleshooting':
        return (
          <TroubleshootingScreen
            onOpenMappingDebug={() => {
              // Find the document with normalized plan to get Worker JSON
              const doc = documents.find(d => {
                return d.id === activeProgramId || ((d as any).normalizedPlan && d.id);
              });
              const workerJson = doc ? (doc as any).plan : null;
              if (workerJson && activeProgramId) {
                setCurrentScreen('mappingDebug');
              } else {
                // Show alert if no program available
                Alert.alert(
                  'No Program Available',
                  'Please select a program with a parsed plan to view mapping debug information.',
                  [{ text: 'OK' }]
                );
              }
            }}
          />
        );
      case 'mappingDebug':
        // Find the document to get Worker JSON
        const docForDebug = documents.find(d => d.id === activeProgramId);
        const workerJsonForDebug = docForDebug ? (docForDebug as any).plan : null;
        return (
          <MappingDebugScreen
            program={activeNormalizedPlan}
            programId={activeProgramId}
            workerJson={workerJsonForDebug}
            onBack={async () => {
              // Reload documents in case they were cleared by reset all
              await loadAllDocuments();
              setCurrentScreen('troubleshooting');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background.primary} />

        <View style={styles.content}>
          {renderScreen()}
        </View>

        {currentScreen !== 'fitness' && currentScreen !== 'mappingDebug' && currentScreen !== 'help' && (
          <BottomNavigation
            activeTab={currentScreen === 'journey' ? 'journey' : currentScreen === 'progress' ? 'progress' : (currentScreen as Tab)}
            onTabChange={(tab) => {
              if (tab === 'journey') {
                // If journey tab clicked, check if we have a normalized plan
                if (activeNormalizedPlan && activeProgramId) {
                  setCurrentScreen('journey');
                } else {
                  // Try to find a document with normalized plan
                  const docWithNormalized = documents.find(d => (d as any).normalizedPlan);
                  if (docWithNormalized) {
                    setActivePlan(docWithNormalized.plan);
                    setActiveNormalizedPlan((docWithNormalized as any).normalizedPlan);
                    setActiveProgramId(docWithNormalized.id);
                    setCurrentScreen('journey');
                  } else {
                    // No normalized plan available, go to domains
                    setCurrentScreen('domains');
                  }
                }
              } else if (tab === 'progress') {
                // If progress tab clicked, check if we have a normalized plan
                if (activeNormalizedPlan && activeProgramId) {
                  setCurrentScreen('progress');
                } else {
                  // Try to find a document with normalized plan
                  const docWithNormalized = documents.find(d => (d as any).normalizedPlan);
                  if (docWithNormalized) {
                    setActivePlan(docWithNormalized.plan);
                    setActiveNormalizedPlan((docWithNormalized as any).normalizedPlan);
                    setActiveProgramId(docWithNormalized.id);
                    setCurrentScreen('progress');
                  } else {
                    // No normalized plan available, go to domains
                    setCurrentScreen('domains');
                  }
                }
              } else {
                setCurrentScreen(tab as Screen);
              }
            }}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  content: {
    flex: 1,
  },
});
