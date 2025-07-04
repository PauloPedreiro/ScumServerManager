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
import { useServerConfig } from '../contexts/ServerConfigContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';

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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [logLevel, setLogLevel] = useState('INFO');
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
  const [pollInterval, setPollInterval] = useState(30000);
  const [loginLogStats, setLoginLogStats] = useState({
    path: '',
    files: 0,
    events: 0,
    online: 0
  });
  const { setPlayerStats } = usePlayerStats();
  const [logsPathInput, setLogsPathInput] = useState(logsPath);
  const [isProcessingPlayers, setIsProcessingPlayers] = useState(false);
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState<number>(0);

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
    }
  }, [tabValue, serverPath]);

  useEffect(() => {
    window.electronAPI.loadAppConfig().then((appConfig) => {
      setLogsPath(appConfig?.logsPath || 'C:\\Servers\\scum\\SCUM\\Saved\\Logs');
    });
  }, []);

  useEffect(() => {
    if (!logsPath) return;
    
    processPlayersFromLogs();
    
    const interval = setInterval(processPlayersFromLogs, pollInterval);
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
    const logsDir = `${serverPath.replace(/\\/g, '/')}/Saved/SaveFiles/Logs`;
    if (window.electronAPI?.listDir && window.electronAPI?.readConfigFile) {
      const files = await window.electronAPI.listDir(logsDir);
      const loginFiles = files.filter((f: string) => f.startsWith('login_') && f.endsWith('.log'));
      let events: any[] = [];
      for (const file of loginFiles.slice(-5)) {
        let content = await window.electronAPI.readConfigFile(`${logsDir}/${file}`);
        content = content.replace(/\u0000/g, '');
        const rawLines = content.split(/\r?\n/);
        // console.log(`[DEBUG] Linhas brutas do arquivo ${file}:`, rawLines.slice(0, 10));
        const lines = rawLines.filter((l: string) => l.trim().length > 0 && l.includes('logged'));
        for (const line of lines) {
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

  const processPlayersFromLogs = async () => {
    if (isProcessingPlayers) {
      // console.log('[DEBUG] Já processando jogadores, pulando...');
      return;
    }

    const now = Date.now();
    if (now - lastProcessedTimestamp < 5000) {
      // console.log('[DEBUG] Processamento muito recente, pulando...');
      return;
    }

    setIsProcessingPlayers(true);
    setLastProcessedTimestamp(now);

    try {
      const detectedPath = logsPath;
      // console.log('[DEBUG] Processando jogadores do caminho:', detectedPath);
      
      const files = await window.electronAPI.listDir(detectedPath);
      const loginFiles = files.filter((f: string) => f.startsWith('login_') && f.endsWith('.log'));
              // console.log('[DEBUG] Arquivos login_*.log encontrados:', loginFiles.length);
      
      let allLines: string[] = [];
      let events = 0;
      
      for (const file of loginFiles) {
        let content = await window.electronAPI.readConfigFile(`${detectedPath}/${file}`);
        content = content.replace(/\u0000/g, '');
        const rawLines = content.split(/\r?\n/);
        const lines = rawLines.filter((l: string) => l.trim().length > 0 && l.includes('logged'));
        events += lines.length;
        allLines.push(...lines);
      }
      
              // console.log('[DEBUG] Total de linhas de evento lidas:', allLines.length);
      
      allLines.sort((a, b) => {
        const getDate = (line: string) => {
          const m = line.match(/^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2})/);
          return m ? m[1].replace(/\./g, '-').replace('-', 'T').replace(/-/g, ':').replace('T', '-') : '';
        };
        return getDate(a).localeCompare(getDate(b));
      });
      
      const onlinePlayers = new Set();
      for (const line of allLines) {
        const matchIn = line.match(/\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}: '[\d.]+ (\d+):/);
        if (line.includes('logged in') && matchIn) {
          onlinePlayers.add(matchIn[1]);
        } else if (line.includes('logged out') && matchIn) {
          onlinePlayers.delete(matchIn[1]);
        }
      }
      
      setLoginLogStats({ path: detectedPath, files: loginFiles.length, events, online: onlinePlayers.size });
      setPlayerStats((prev) => ({ ...prev, online: onlinePlayers.size }));
      
      await updatePlayersJson(allLines);
      
    } catch (error) {
      console.error('[DEBUG] Erro ao processar jogadores:', error);
    } finally {
      setIsProcessingPlayers(false);
    }
  };

  const updatePlayersJson = async (allLines: string[]) => {
    if (!allLines || allLines.length === 0) {
      // console.log('[DEBUG][players.json] Nenhuma linha de log para processar, pulando...');
      return;
    }
    
    try {
      let playersDb: any[] = [];
      try {
        playersDb = await window.electronAPI.readJsonFile('players.json');
        if (!Array.isArray(playersDb)) playersDb = [];
      } catch { playersDb = []; }
      const playersMap = new Map(playersDb.map(p => [p.steamId, p]));

      let updated = false;
      let newPlayersCount = 0;
      for (const line of allLines) {
        const match = line.match(/\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}: '[\d.]+ (\d+):([^']+)\(/);
        if (line.includes('logged in') && match) {
          const steamId = match[1];
          const name = match[2];
          const tsMatch = line.match(/^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2})/);
          const timestamp = tsMatch ? tsMatch[1] : '';
          
          if (!playersMap.has(steamId)) {
            playersMap.set(steamId, {
              steamId,
              name,
              firstLogin: timestamp,
              lastLogin: timestamp,
              totalLogins: 1
            });
            updated = true;
            newPlayersCount++;
            // console.log(`[DEBUG][players.json] Novo jogador detectado: ${name} (${steamId})`);
          } else {
            const player = playersMap.get(steamId);
            if (player.lastLogin !== timestamp || player.name !== name) {
              player.lastLogin = timestamp;
              player.name = name;
              updated = true;
              // console.log(`[DEBUG][players.json] Jogador atualizado: ${name} (${steamId})`);
            }
            player.totalLogins += 1;
            playersMap.set(steamId, player);
          }
        }
      }
      
      // console.log(`[DEBUG][players.json] Processamento concluído: ${newPlayersCount} novos jogadores, ${playersMap.size} total`);
      
      if (playersMap.size === 0) {
        // console.log('[DEBUG][players.json] playersMap está vazio, NÃO VOU salvar nem limpar o arquivo!');
        return;
      }
      
      if (updated) {
        try {
          let playersPath = 'players.json';
          await window.electronAPI.saveJsonFile(playersPath, Array.from(playersMap.values()));
          // console.log('[DEBUG][players.json] Arquivo salvo em', playersPath, 'total jogadores:', playersMap.size);
        } catch (err) {
          console.error('[DEBUG][players.json] Erro ao salvar arquivo:', err);
        }
      } else {
        // console.log('[DEBUG][players.json] Nenhuma alteração detectada, não sobrescrevendo arquivo.');
      }
    } catch (error) {
      console.error('[DEBUG][players.json] Erro ao processar jogadores:', error);
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Card sx={{ background: '#232323', color: 'white', display: 'inline-block', minWidth: 320 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Resumo da Pasta de Logs</Typography>
            <Typography variant="body2">Caminho: <b>{loginLogStats.path}</b></Typography>
            <Typography variant="body2">Arquivos de login: <b>{loginLogStats.files}</b></Typography>
            <Typography variant="body2">Eventos de login/logout: <b>{loginLogStats.events}</b></Typography>
            <Typography variant="body2" sx={{ color: 'lightgreen', fontWeight: 'bold' }}>Jogadores online agora: <b>{loginLogStats.online}</b></Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Pasta dos Logs</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            value={logsPathInput}
            onChange={e => setLogsPathInput(e.target.value)}
            placeholder="Pasta dos logs do servidor"
          />
          <Button
            variant="outlined"
            size="small"
            onClick={async () => {
              const selectedPath = await window.electronAPI.selectInstallFolder();
              if (selectedPath) {
                setLogsPathInput(selectedPath);
              }
            }}
          >
            Selecionar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              // console.log('[LogsMonitoring] Salvando logsPathInput:', logsPathInput);
              await setLogsPath(logsPathInput);
            }}
          >
            Salvar
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Monitore o status do seu servidor SCUM em tempo real e visualize logs para diagnóstico e troubleshooting.
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="logs tabs">
          <Tab label="Logs do Sistema" {...a11yProps(0)} />
          <Tab label="Logs de Login" {...a11yProps(1)} />
          <Tab label="Jogadores" {...a11yProps(2)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
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

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Logs de Login
          </Typography>
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

      <TabPanel value={tabValue} index={2}>
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