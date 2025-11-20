import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UploadScreen } from '../components/screens/UploadScreen';
import { DomainsScreen } from '../components/screens/DomainsScreen';
import { FitnessPlanScreen } from '../components/screens/FitnessPlanScreen';
import { SettingsScreen } from '../components/screens/SettingsScreen';
import { COLORS } from '../constants/theme';
import { UniversalFitnessPlan, UploadResponse } from '../constants/fitnessTypes';
import { BottomNavigation, Tab } from '../components/ui/BottomNavigation';
import { LogEntry } from '../components/ui/LogViewer';

// Constants
const BACKEND_API_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL ?? "http://localhost:4000";
const STORAGE_KEY_PREFIX = "parsed_doc_";

type Screen = 'domains' | 'upload' | 'fitness' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('upload'); // Default to upload (Home)
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePlan, setActivePlan] = useState<UniversalFitnessPlan | null>(null);

  // Logging State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const addLog = (message: string, type: LogEntry['type'] = 'info', data?: any) => {
    setLogs(prev => [...prev, { timestamp: Date.now(), message, type, data }]);
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
    setDocuments([]);
    setActivePlan(null);
    setLogs([]);
    await loadAllDocuments(); // Should be empty now
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
    setShowLogs(true); // Auto-show logs on start

    addLog("Starting upload process...", 'info');

    const formData = new FormData();
    formData.append('pdf', {
      uri: selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.mimeType || 'application/pdf',
    } as any);

    try {
      addLog(`Uploading to ${BACKEND_API_URL}/api/parse...`, 'info');

      const response = await fetch(`${BACKEND_API_URL}/api/parse`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      // Always show logs if they exist, regardless of success/failure
      if (data.logs && Array.isArray(data.logs)) {
        data.logs.forEach((logMsg: string) => {
          addLog(logMsg, response.ok ? 'info' : 'error');
        });
      }

      if (response.ok && (data.status === 'success' || data.status === 'parsed')) {
        addLog("Upload and parsing successful!", 'success');
        setActivePlan(data.fitnessPlan);

        // Save to local storage
        const docEntry = {
          id: data.planId,
          name: selectedFile.name,
          timestamp: Date.now(),
          plan: data.fitnessPlan
        };

        await AsyncStorage.setItem(
          `${STORAGE_KEY_PREFIX}${data.planId}`,
          JSON.stringify(docEntry)
        );

        await loadAllDocuments();
        setCurrentScreen('fitness');
      } else {
        throw new Error(data.error || data.message || "Unknown error during parsing");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Upload failed";
      setError(errorMessage);
      addLog(`Error: ${errorMessage}`, 'error');
      console.error("Upload error:", err);
    } finally {
      setIsLoading(false);
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
            error={error}
            logs={logs}
            showLogs={showLogs}
            onToggleLogs={() => setShowLogs(!showLogs)}
          />
        );
      case 'domains':
        return (
          <DomainsScreen
            documents={documents}
            onSelectDocument={(doc) => {
              setActivePlan(doc.plan);
              setCurrentScreen('fitness');
            }}
            onReset={handleReset}
          />
        );
      case 'fitness':
        return activePlan ? (
          <FitnessPlanScreen
            plan={activePlan}
            onBack={() => setCurrentScreen('domains')}
          />
        ) : null;
      case 'settings':
        return <SettingsScreen />;
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

        {currentScreen !== 'fitness' && (
          <BottomNavigation
            activeTab={currentScreen as Tab}
            onTabChange={(tab) => setCurrentScreen(tab as Screen)}
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
