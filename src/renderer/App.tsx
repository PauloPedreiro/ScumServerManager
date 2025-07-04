import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Container, Alert, Snackbar } from '@mui/material';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import ServerSettings from './pages/ServerSettings';
import GameSettings from './pages/GameSettings';
import EconomySettings from './pages/EconomySettings';
import RaidSettings from './pages/RaidSettings';
import UserManagement from './pages/UserManagement';
import LootSettings from './pages/LootSettings';
import BackupRestore from './pages/BackupRestore';
import LogsMonitoring from './pages/LogsMonitoring';
import FolderSettings from './pages/FolderSettings';
import Discord from './pages/Discord';
import { ServerConfigProvider } from './contexts/ServerConfigContext';

function App() {
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <ServerConfigProvider>
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Navigation />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Container maxWidth="xl">
              <Routes>
                <Route path="/" element={<Dashboard showNotification={showNotification} />} />
                <Route path="/folder-settings" element={<FolderSettings showNotification={showNotification} />} />
                <Route path="/server-settings" element={<ServerSettings showNotification={showNotification} />} />
                <Route path="/game-settings" element={<GameSettings showNotification={showNotification} />} />
                <Route path="/economy" element={<EconomySettings showNotification={showNotification} />} />
                <Route path="/raid-times" element={<RaidSettings showNotification={showNotification} />} />
                <Route path="/users" element={<UserManagement showNotification={showNotification} />} />
                <Route path="/loot" element={<LootSettings showNotification={showNotification} />} />
                <Route path="/backup" element={<BackupRestore showNotification={showNotification} />} />
                <Route path="/monitoring" element={<LogsMonitoring showNotification={showNotification} />} />
                <Route path="/discord" element={<Discord />} />
              </Routes>
            </Container>
          </Box>
        </Box>
        
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Router>
    </ServerConfigProvider>
  );
}

export default App; 