import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  RestartAlt as RestartIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon,
  Monitor as MonitorIcon,
  BugReport as LogIcon,
  Memory as MemoryIcon,
  Speed as CpuIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon
} from '@mui/icons-material';
import { useServerConfig } from '../contexts/ServerConfigContext';

interface LogsMonitoringProps {
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface ServerStatus {
  running: boolean;
  uptime: string;
  players: number;
  maxPlayers: number;
  cpu: number;
  memory: number;
  network: {
    in: number;
    out: number;
  };
}

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
  source: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`monitoring-tabpanel-${index}`}
      aria-labelledby={`monitoring-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LogsMonitoring: React.FC<LogsMonitoringProps> = ({ showNotification }) => {
  const { serverPath } = useServerConfig();
  const [tabValue, setTabValue] = useState(0);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [logLevel, setLogLevel] = useState('ALL');
  const [logFilter, setLogFilter] = useState('');
  const [serverAction, setServerAction] = useState<'idle' | 'starting' | 'stopping' | 'restarting'>('idle');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const logLevels = [
    { value: 'ALL', label: 'Todos', color: 'default' },
    { value: 'INFO', label: 'Info', color: 'info' },
    { value: 'WARNING', label: 'Aviso', color: 'warning' },
    { value: 'ERROR', label: 'Erro', color: 'error' },
    { value: 'DEBUG', label: 'Debug', color: 'primary' }
  ];

  useEffect(() => {
    if (serverPath && autoRefresh) {
      const interval = setInterval(() => {
        loadServerStatus();
        loadLogs();
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [serverPath, autoRefresh, refreshInterval]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const loadServerStatus = async () => {
    if (!serverPath) return;
    
    try {
      const status = await window.electronAPI.getServerStatus(serverPath);
      setServerStatus(status);
    } catch (error) {
      console.error('Erro ao carregar status do servidor:', error);
    }
  };

  const loadLogs = async () => {
    if (!serverPath) return;
    
    try {
      const logEntries = await window.electronAPI.getServerLogs(serverPath, {
        level: logLevel,
        filter: logFilter,
        limit: 100
      });
      setLogs(logEntries || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  };

  const handleServerAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!serverPath) return;
    
    try {
      setServerAction(action === 'start' ? 'starting' : action === 'stop' ? 'stopping' : 'restarting');
      
      let success = false;
      switch (action) {
        case 'start':
          success = await window.electronAPI.startServer(serverPath);
          break;
        case 'stop':
          success = await window.electronAPI.stopServer(serverPath);
          break;
        case 'restart':
          success = await window.electronAPI.restartServer(serverPath);
          break;
      }
      
      if (success) {
        showNotification(`Servidor ${action === 'start' ? 'iniciado' : action === 'stop' ? 'parado' : 'reiniciado'} com sucesso!`, 'success');
        setTimeout(() => {
          loadServerStatus();
          setServerAction('idle');
        }, 2000);
      }
    } catch (error) {
      showNotification(`Erro ao ${action === 'start' ? 'iniciar' : action === 'stop' ? 'parar' : 'reiniciar'} servidor`, 'error');
      setServerAction('idle');
    }
  };

  const downloadLogs = async () => {
    if (!serverPath) return;
    
    try {
      await window.electronAPI.downloadLogs(serverPath);
      showNotification('Logs baixados com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao baixar logs', 'error');
    }
  };

  const clearLogs = async () => {
    if (!serverPath) return;
    
    try {
      await window.electronAPI.clearLogs(serverPath);
      setLogs([]);
      showNotification('Logs limpos com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao limpar logs', 'error');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: ServerStatus | null) => {
    if (!status) return 'error';
    return status.running ? 'success' : 'error';
  };

  const getStatusText = (status: ServerStatus | null) => {
    if (!status) return 'Desconhecido';
    return status.running ? 'Online' : 'Offline';
  };

  if (!serverPath) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Selecione um servidor para monitorar logs e status
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          <MonitorIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Logs e Monitoramento
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadServerStatus();
              loadLogs();
            }}
            sx={{ mr: 2 }}
          >
            Atualizar
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadLogs}
            sx={{ mr: 2 }}
          >
            Baixar Logs
          </Button>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={clearLogs}
            color="warning"
          >
            Limpar Logs
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Monitore o status do seu servidor SCUM em tempo real e visualize logs para diagnóstico e troubleshooting.
      </Alert>

      {/* Server Status Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CpuIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Status do Servidor</Typography>
              <Chip
                label={getStatusText(serverStatus)}
                color={getStatusColor(serverStatus) as any}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MemoryIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6">Jogadores</Typography>
              <Typography variant="h4">
                {serverStatus?.players || 0}/{serverStatus?.maxPlayers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <StorageIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6">Uptime</Typography>
              <Typography variant="h6">
                {serverStatus?.uptime || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <NetworkIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6">CPU/Memória</Typography>
              <Typography variant="body2">
                {serverStatus?.cpu || 0}% / {serverStatus?.memory || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Server Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Controles do Servidor
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={serverAction === 'starting' ? <CircularProgress size={20} /> : <StartIcon />}
              onClick={() => handleServerAction('start')}
              disabled={serverStatus?.running || serverAction !== 'idle'}
            >
              {serverAction === 'starting' ? 'Iniciando...' : 'Iniciar Servidor'}
            </Button>
            
            <Button
              variant="contained"
              color="error"
              startIcon={serverAction === 'stopping' ? <CircularProgress size={20} /> : <StopIcon />}
              onClick={() => handleServerAction('stop')}
              disabled={!serverStatus?.running || serverAction !== 'idle'}
            >
              {serverAction === 'stopping' ? 'Parando...' : 'Parar Servidor'}
            </Button>
            
            <Button
              variant="contained"
              color="warning"
              startIcon={serverAction === 'restarting' ? <CircularProgress size={20} /> : <RestartIcon />}
              onClick={() => handleServerAction('restart')}
              disabled={!serverStatus?.running || serverAction !== 'idle'}
            >
              {serverAction === 'restarting' ? 'Reiniciando...' : 'Reiniciar Servidor'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs for Logs and Monitoring */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="monitoring tabs">
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LogIcon />
                Logs do Servidor
              </Box>
            }
            {...a11yProps(0)}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MonitorIcon />
                Monitoramento
              </Box>
            }
            {...a11yProps(1)}
          />
        </Tabs>
      </Box>

      {/* Logs Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Nível de Log</InputLabel>
                <Select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value)}
                >
                  {logLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      <Chip
                        label={level.label}
                        size="small"
                        color={level.color as any}
                        variant="outlined"
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Filtrar logs"
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                placeholder="Digite para filtrar..."
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                }
                label="Atualização Automática"
              />
            </Grid>
          </Grid>
        </Box>

        <Paper sx={{ height: 500, overflow: 'auto' }}>
          <List>
            {logs.map((log, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={log.level}
                          size="small"
                          color={
                            log.level === 'ERROR' ? 'error' :
                            log.level === 'WARNING' ? 'warning' :
                            log.level === 'INFO' ? 'info' : 'primary'
                          }
                        />
                        <Typography variant="body2" color="text.secondary">
                          {log.timestamp}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          [{log.source}]
                        </Typography>
                      </Box>
                    }
                    secondary={log.message}
                  />
                </ListItem>
                {index < logs.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            <div ref={logsEndRef} />
          </List>
        </Paper>
      </TabPanel>

      {/* Monitoring Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurações de Monitoramento
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                  }
                  label="Monitoramento Automático"
                />
                
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Intervalo de Atualização</InputLabel>
                  <Select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(e.target.value as number)}
                    disabled={!autoRefresh}
                  >
                    <MenuItem value={1}>1 segundo</MenuItem>
                    <MenuItem value={5}>5 segundos</MenuItem>
                    <MenuItem value={10}>10 segundos</MenuItem>
                    <MenuItem value={30}>30 segundos</MenuItem>
                    <MenuItem value={60}>1 minuto</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estatísticas do Servidor
                </Typography>
                
                {serverStatus ? (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      <strong>CPU:</strong> {serverStatus.cpu}%
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Memória:</strong> {serverStatus.memory}%
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Rede (Entrada):</strong> {serverStatus.network.in} MB/s
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Rede (Saída):</strong> {serverStatus.network.out} MB/s
                    </Typography>
                    <Typography variant="body2">
                      <strong>Jogadores Online:</strong> {serverStatus.players}/{serverStatus.maxPlayers}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma informação disponível
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Information Box */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Informações sobre Logs e Monitoramento
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Logs em Tempo Real:</strong> Visualize logs do servidor conforme são gerados
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Filtros:</strong> Filtre logs por nível e conteúdo para facilitar a busca
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Controles do Servidor:</strong> Inicie, pare ou reinicie o servidor diretamente
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Monitoramento:</strong> Acompanhe uso de CPU, memória e rede
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Atualização Automática:</strong> Configure intervalos de atualização
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Exportação:</strong> Baixe logs para análise externa
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

function a11yProps(index: number) {
  return {
    id: `monitoring-tab-${index}`,
    'aria-controls': `monitoring-tabpanel-${index}`,
  };
}

export default LogsMonitoring; 