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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  RestartAlt as RestartIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  Monitor as MonitorIcon,
  BugReport as LogIcon,
  Memory as MemoryIcon,
  Speed as CpuIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  People as PeopleIcon,
  Folder as FolderIcon
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
  const { serverPath, logsPath, setLogsPath } = useServerConfig();
  const [tabValue, setTabValue] = useState(0);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [logLevel, setLogLevel] = useState('ALL');
  const [logFilter, setLogFilter] = useState('');
  const [serverAction, setServerAction] = useState<'idle' | 'starting' | 'stopping' | 'restarting'>('idle');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [loginEvents, setLoginEvents] = useState<any[]>([]);
  const [playersList, setPlayersList] = useState<Array<{
    name: string;
    steamId: string;
    timestamp: string;
    lastLogin: string;
    totalLogins: number;
    lastPosition?: { x: string; y: string; z: string };
  }>>([]);
  const [pollInterval, setPollInterval] = useState<number>(5000); // padrão 5 segundos

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

  useEffect(() => {
    if (tabValue === 2) {
      loadLoginLogs();
      extractPlayersFromLoginLogs();
    }
  }, [tabValue, serverPath]);

  useEffect(() => {
    window.electronAPI.loadAppConfig().then((appConfig) => {
      setLogsPath(appConfig?.logsPath || 'C:\\Servers\\scum\\SCUM\\Saved\\Logs');
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Função para ler os logs da pasta logsPath e atualizar a lista de jogadores
      fetchPlayersFromLogs();
    }, pollInterval);
    return () => clearInterval(interval);
  }, [logsPath, pollInterval]);

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

  const loadLoginLogs = async () => {
    if (!serverPath) return;
    // Caminho base dos logs
    const logsDir = `${serverPath.replace(/\\/g, '/')}/Saved/SaveFiles/Logs`;
    // Buscar arquivos login_*.log
    if (window.electronAPI?.listDir && window.electronAPI?.readConfigFile) {
      const files = await window.electronAPI.listDir(logsDir);
      const loginFiles = files.filter((f: string) => f.startsWith('login_') && f.endsWith('.log'));
      let events: any[] = [];
      for (const file of loginFiles.slice(-5)) { // Pega os 5 mais recentes
        const content = await window.electronAPI.readConfigFile(`${logsDir}/${file}`);
        const lines = content.split('\n').filter((l: string) => l.trim().length > 0 && l.includes('logged'));
        for (const line of lines) {
          // Exemplo: 2025.06.22-04.58.36: '192.168.100.3 76561198040636105:Pedreiro(1)' logged in at: X=25824.000 Y=-674331.000 Z=1000.000
          const match = line.match(/^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): '([\d.]+) (\d+):([^(]+)\(\d+\)' logged (in|out) at: X=([\d.-]+) Y=([\d.-]+) Z=([\d.-]+)/);
          if (match) {
            events.push({
              timestamp: match[1],
              ip: match[2],
              steamId: match[3],
              name: match[4],
              action: match[5] === 'in' ? 'Login' : 'Logout',
              x: match[6],
              y: match[7],
              z: match[8]
            });
          }
        }
      }
      setLoginEvents(events.reverse());
    }
  };

  const extractPlayersFromLoginLogs = async () => {
    if (!serverPath) return;
    const logsDir = `${serverPath.replace(/\\/g, '/')}/Saved/SaveFiles/Logs`;
    const PLAYERS_PATH = 'players.json';
    if (window.electronAPI?.listDir && window.electronAPI?.readConfigFile && window.electronAPI?.saveJsonFile) {
      const files = await window.electronAPI.listDir(logsDir);
      const loginFiles = files.filter((f: string) => f.startsWith('login_') && f.endsWith('.log'));
      let players: Record<string, { name: string, steamId: string, timestamp: string, lastLogin: string, totalLogins: number }> = {};
      
      for (const file of loginFiles) {
        const content = await window.electronAPI.readConfigFile(`${logsDir}/${file}`);
        const lines = content.split('\n').filter((l: string) => l.trim().length > 0 && l.includes('logged in'));
        
        for (const line of lines) {
          const match = line.match(/^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): '([\d.]+) (\d+):([^(]+)\(\d+\)' logged in at:/);
          if (match) {
            const steamId = match[3];
            const name = match[4];
            const timestamp = match[1];
            
            if (!players[steamId]) {
              players[steamId] = {
                name,
                steamId,
                timestamp,
                lastLogin: timestamp,
                totalLogins: 1
              };
            } else {
              players[steamId].lastLogin = timestamp;
              players[steamId].totalLogins += 1;
            }
          }
        }
      }
      
      const playersArr = Object.values(players).sort((a, b) => 
        new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
      );
      
      setPlayersList(playersArr);
      await window.electronAPI.saveJsonFile(PLAYERS_PATH, playersArr);
      showNotification(`Processados ${playersArr.length} jogadores únicos`, 'success');
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

  const processAttachedLog = async () => {
    try {
      // Simular o processamento do log anexado
      const logContent = `2025.06.22-16.00.39: Game version: 1.0.0.1.95114
2025.06.22-16.02.50: '172.18.0.1 76561199581557003:SANDMAN(167)' logged in at: X=-70556.000 Y=-497816.000 Z=276.000
2025.06.22-16.02.50: '172.18.0.1 76561198305612921:Katsumoto(273)' logged in at: X=-763085.000 Y=-683503.000 Z=10712.000
2025.06.22-16.02.52: '172.18.0.1 76561199581557003:SANDMAN(167)' logged out at: ?
2025.06.22-16.03.02: '172.18.0.1 76561199581557003:SANDMAN(167)' logged in at: X=-70556.000 Y=-497816.000 Z=276.000
2025.06.22-16.03.02: '172.18.0.1 76561198201014691:Tua Mãe(271)' logged in at: X=-763163.000 Y=-680669.000 Z=10717.000
2025.06.22-16.03.04: '172.18.0.1 76561198201014691:Tua Mãe(271)' logged out at: ?
2025.06.22-16.03.16: '172.18.0.1 76561198381975980:iEduCopattiBR(178)' logged in at: X=-769054.000 Y=-748223.000 Z=2748.000
2025.06.22-16.03.22: '172.18.0.1 76561199446915172:jairtf(295)' logged in at: X=-388600.500 Y=-469269.500 Z=2949.781
2025.06.22-16.03.34: '172.18.0.1 76561198142874446:Saitama(51)' logged in at: X=-771934.000 Y=-748890.000 Z=2742.000
2025.06.22-16.03.54: '172.18.0.1 76561198201014691:Tua Mãe(271)' logged in at: X=-763163.000 Y=-680669.000 Z=10717.000
2025.06.22-16.04.03: '172.18.0.1 76561198240717656:Dilas(288)' logged in at: X=45375.000 Y=-679626.000 Z=611.000
2025.06.22-16.05.13: '172.18.0.1 76561198337589373:KamaBR(282)' logged in at: X=-787322.000 Y=-286317.000 Z=16665.000
2025.06.22-16.06.04: '172.18.0.1 76561199492540812:rafaela(259)' logged in at: X=-787328.000 Y=-286116.000 Z=16690.000
2025.06.22-16.06.06: '172.18.0.1 76561198258958714:Zerf23BR(235)' logged in at: X=-276478.000 Y=-675100.000 Z=7802.000
2025.06.22-20.00.45: '172.18.0.1 76561198081711036:Matheus(325)' logged in at: X=464045.562 Y=-508691.250 Z=5420.328`;

      const lines = logContent.split('\n').filter((l: string) => l.trim().length > 0 && l.includes('logged in'));
      let players: Record<string, { name: string, steamId: string, timestamp: string, lastLogin: string, totalLogins: number, lastPosition: { x: string, y: string, z: string } }> = {};
      
      for (const line of lines) {
        const match = line.match(/^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): '([\d.]+) (\d+):([^(]+)\(\d+\)' logged in at: X=([\d.-]+) Y=([\d.-]+) Z=([\d.-]+)/);
        if (match) {
          const steamId = match[3];
          const name = match[4];
          const timestamp = match[1];
          const x = match[5];
          const y = match[6];
          const z = match[7];
          
          if (!players[steamId]) {
            players[steamId] = {
              name,
              steamId,
              timestamp,
              lastLogin: timestamp,
              totalLogins: 1,
              lastPosition: { x, y, z }
            };
          } else {
            players[steamId].lastLogin = timestamp;
            players[steamId].totalLogins += 1;
            players[steamId].lastPosition = { x, y, z };
          }
        }
      }
      
      const playersArr = Object.values(players).sort((a, b) => 
        new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
      );
      
      setPlayersList(playersArr);
      
      // Salvar o JSON gerado
      if (window.electronAPI?.saveJsonFile) {
        await window.electronAPI.saveJsonFile('players_from_log.json', playersArr);
      }
      
      showNotification(`Processados ${playersArr.length} jogadores do log anexado`, 'success');
    } catch (error) {
      showNotification('Erro ao processar log anexado', 'error');
      console.error('Erro ao processar log:', error);
    }
  };

  const fetchPlayersFromLogs = async () => {
    if (!logsPath) return;
    const logsDir = logsPath;
    const PLAYERS_PATH = 'players.json';
    if (window.electronAPI?.listDir && window.electronAPI?.readConfigFile && window.electronAPI?.saveJsonFile) {
      const files = await window.electronAPI.listDir(logsDir);
      const loginFiles = files.filter((f: string) => f.startsWith('login_') && f.endsWith('.log'));
      let players: Record<string, { name: string, steamId: string, timestamp: string, lastLogin: string, totalLogins: number }> = {};
      
      for (const file of loginFiles) {
        const content = await window.electronAPI.readConfigFile(`${logsDir}/${file}`);
        const lines = content.split('\n').filter((l: string) => l.trim().length > 0 && l.includes('logged in'));
        
        for (const line of lines) {
          const match = line.match(/^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): '([\d.]+) (\d+):([^(]+)\(\d+\)' logged in at:/);
          if (match) {
            const steamId = match[3];
            const name = match[4];
            const timestamp = match[1];
            
            if (!players[steamId]) {
              players[steamId] = {
                name,
                steamId,
                timestamp,
                lastLogin: timestamp,
                totalLogins: 1
              };
            } else {
              players[steamId].lastLogin = timestamp;
              players[steamId].totalLogins += 1;
            }
          }
        }
      }
      
      const playersArr = Object.values(players).sort((a, b) => 
        new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
      );
      
      setPlayersList(playersArr);
      await window.electronAPI.saveJsonFile(PLAYERS_PATH, playersArr);
      showNotification(`Processados ${playersArr.length} jogadores do log anexado`, 'success');
    }
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

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Pasta dos Logs</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            value={logsPath}
            InputProps={{ readOnly: true }}
            placeholder="Pasta dos logs do servidor"
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<FolderIcon />}
            onClick={async () => {
              const selectedPath = await window.electronAPI.selectInstallFolder();
              if (selectedPath) {
                setLogsPath(selectedPath);
              }
            }}
          >
            Selecionar
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Monitore o status do seu servidor SCUM em tempo real e visualize logs para diagnóstico e troubleshooting.
      </Alert>

      {/* Tabs for Logs and Monitoring */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="logs tabs">
          <Tab label="Status do Servidor" {...a11yProps(0)} />
          <Tab label="Logs do Sistema" {...a11yProps(1)} />
          <Tab label="Logs de Login" {...a11yProps(2)} />
          <Tab label="Jogadores" {...a11yProps(3)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Server Status Content */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ações de Logs
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={downloadLogs}
                  >
                    Baixar Logs
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<ClearIcon />}
                    onClick={clearLogs}
                  >
                    Limpar Logs
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<PeopleIcon />}
                    onClick={processAttachedLog}
                  >
                    Processar Log Anexado
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ações de Logs
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={downloadLogs}
                  >
                    Baixar Logs
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<ClearIcon />}
                    onClick={clearLogs}
                  >
                    Limpar Logs
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<PeopleIcon />}
                    onClick={processAttachedLog}
                  >
                    Processar Log Anexado
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* System Logs Content */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Logs do Sistema
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Atualização automática"
          />
        </Box>
        
        <Paper sx={{ maxHeight: 600, overflow: 'auto' }}>
          <List>
            {logs.map((log, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={log.message}
                  secondary={`${log.timestamp} - ${log.source} [${log.level}]`}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Login Logs Content */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Logs de Login
          </Typography>
          <Button
            variant="outlined"
            onClick={loadLoginLogs}
            sx={{ mb: 2 }}
          >
            Carregar Logs de Login
          </Button>
        </Box>
        
        <Paper sx={{ maxHeight: 600, overflow: 'auto' }}>
          <List>
            {loginEvents.map((event, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={`${event.name} (${event.steamId})`}
                  secondary={`${event.action} em ${event.timestamp} - IP: ${event.ip} - Pos: X=${event.x}, Y=${event.y}, Z=${event.z}`}
                />
                <Chip 
                  label={event.action} 
                  color={event.action === 'Login' ? 'success' : 'error'}
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Players Content */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Lista de Jogadores
          </Typography>
          <FormControl size="small" sx={{ minWidth: 180, mb: 2 }}>
            <InputLabel id="interval-label">Intervalo de Atualização</InputLabel>
            <Select
              labelId="interval-label"
              value={pollInterval}
              label="Intervalo de Atualização"
              onChange={e => setPollInterval(Number(e.target.value))}
            >
              <MenuItem value={2000}>2 segundos</MenuItem>
              <MenuItem value={5000}>5 segundos</MenuItem>
              <MenuItem value={10000}>10 segundos</MenuItem>
              <MenuItem value={30000}>30 segundos</MenuItem>
              <MenuItem value={60000}>1 minuto</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Paper sx={{ maxHeight: 600, overflow: 'auto' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Steam ID</TableCell>
                  <TableCell>Último Login</TableCell>
                  <TableCell>Total de Logins</TableCell>
                  <TableCell>Última Posição</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {playersList.map((player, index) => (
                  <TableRow key={index}>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.steamId}</TableCell>
                    <TableCell>{player.lastLogin}</TableCell>
                    <TableCell>{player.totalLogins}</TableCell>
                    <TableCell>
                      {player.lastPosition ? 
                        `X: ${player.lastPosition.x}, Y: ${player.lastPosition.y}, Z: ${player.lastPosition.z}` : 
                        'N/A'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
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