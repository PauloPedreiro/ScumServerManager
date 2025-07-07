import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Button,
  Modal,
  Select,
  MenuItem,
  IconButton,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  People as PeopleIcon,
  Speed as CpuIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Memory as MemoryIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  ContactSupport as ContactSupportIcon
} from '@mui/icons-material';
import { useServerConfig } from '../contexts/ServerConfigContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';

interface DashboardProps {
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
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

const Dashboard: React.FC<DashboardProps> = ({ showNotification }) => {
  const { config, serverPath: serverConfigPath, serverCache, loading, error, loadConfig, saveConfig } = useServerConfig();
  const { playerStats } = usePlayerStats();
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [playersList, setPlayersList] = useState<Array<any>>([]);
  const [steamcmdPath, setSteamcmdPath] = useState<string>('');
  const [serverExecutablePath, setServerExecutablePath] = useState<string>('');
  const [installPath, setInstallPath] = useState<string>('');
  const [serverPort, setServerPort] = useState<number>(8900);
  const [maxPlayers, setMaxPlayers] = useState<number>(64);
  const [enableBattleye, setEnableBattleye] = useState<boolean>(true);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [restartCountdown, setRestartCountdown] = useState(0);
  const [isRestarting, setIsRestarting] = useState(false);
  const [updateLog, setUpdateLog] = useState<string | null>(null);
  const [realtimeLog, setRealtimeLog] = useState<string>('');
  const [showRealtimeModal, setShowRealtimeModal] = useState(false);
  const [startCountdown, setStartCountdown] = useState<number | null>(null);
  const [canStartServer, setCanStartServer] = useState(false);
  const [restartHours, setRestartHours] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [newRestartHour, setNewRestartHour] = useState<number>(0);
  const [lastAutoRestart, setLastAutoRestart] = useState<string | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);

  const electron = window.require ? window.require('electron') : null;
  const ipcRenderer = electron ? electron.ipcRenderer : null;

  const handleSaveAll = async () => {
    if (!config) return;

    try {
      await saveConfig(config);
      showNotification('Configurações salvas com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao salvar configurações', 'error');
    }
  };

  const handleRefresh = async () => {
    try {
      await loadConfig();
    } catch (error) {
      showNotification('Erro ao recarregar configurações', 'error');
    }
  };

  const getServerInfo = () => {
    if (!config?.serverSettings?.General) return null;

    const general = config.serverSettings.General;
    return {
      name: general.ServerName || 'Não configurado',
      maxPlayers: general.MaxPlayers || 0,
      playstyle: general.ServerPlaystyle || 'Não configurado',
      description: general.ServerDescription || 'Sem descrição'
    };
  };

  const serverInfo = getServerInfo();

  useEffect(() => {
    const fetchStatus = async () => {
      if (!serverConfigPath) return;
      try {
        const status = await window.electronAPI.getRealServerStatus(serverConfigPath);
        setServerStatus({
          running: status.running,
          uptime: status.uptime,
          players: status.players,
          maxPlayers: status.maxPlayers,
          cpu: status.cpu,
          memory: status.memory,
          network: { in: 0, out: 0 }
        });
      } catch (error) {
        setServerStatus(null);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [serverConfigPath]);

  useEffect(() => {
    window.electronAPI.loadAppConfig().then((appConfig) => {
      setSteamcmdPath(appConfig?.steamcmdPath || '');
      setServerExecutablePath(appConfig?.serverPath || '');
      setInstallPath(appConfig?.installPath || '');
      setServerPort(appConfig?.serverPort || 8900);
      setMaxPlayers(appConfig?.maxPlayers || 64);
      setEnableBattleye(appConfig?.enableBattleye !== false);
    });
  }, []);

  const handleUpdateServer = async () => {
    if (!steamcmdPath || !installPath) {
      showNotification('Configure os caminhos do steamcmd e instalação nas configurações!', 'warning');
      return;
    }
          // console.log('[Atualizar] steamcmdPath:', steamcmdPath);
      // console.log('[Atualizar] installPath:', installPath);
    try {
      const result = await window.electronAPI.updateServerWithSteamcmd(steamcmdPath, installPath);
      // console.log('[Atualizar] Log retornado:', result.output);
      setUpdateLog(result.output);
      if (result.success) {
        showNotification('Atualização do servidor finalizada!', 'success');
      } else {
        showNotification('Erro ao atualizar o servidor!', 'error');
      }
    } catch (err) {
      showNotification('Erro ao atualizar o servidor!', 'error');
    }
  };

  const handleStartServer = async () => {
    if (!serverExecutablePath) {
      showNotification('Configure o caminho do servidor nas configurações!', 'warning');
      return;
    }
    await window.electronAPI.startServerWithConfig(serverExecutablePath, serverPort, maxPlayers, enableBattleye);
    showNotification('Servidor iniciado!', 'success');
  };

  const handleRestartServer = async () => {
    setRestartCountdown(5);
    setShowRestartModal(true);
    setIsRestarting(true);
  };

  useEffect(() => {
    if (!isRestarting) return;
    if (restartCountdown === 0 && showRestartModal) {
      // Chama o restart
      let closed = false;
      const closeModal = () => {
        if (!closed) {
          setShowRestartModal(false);
          setIsRestarting(false);
          closed = true;
        }
      };
      // Timeout de segurança
      const fallback = setTimeout(() => {
        closeModal();
      }, 10000);
      window.electronAPI.restartServer(serverExecutablePath || '')
        .then(() => {
          closeModal();
          showNotification('Servidor reiniciado!', 'success');
        })
        .catch(() => {
          closeModal();
          showNotification('Erro ao reiniciar o servidor!', 'error');
        })
        .finally(() => {
          clearTimeout(fallback);
        });
      return;
    }
    if (restartCountdown > 0) {
      const timer = setTimeout(() => {
        setRestartCountdown(restartCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [restartCountdown, isRestarting, showRestartModal]);

  const handleUpdateServerRealtime = async () => {
    setRealtimeLog('');
    setShowRealtimeModal(true);
    setStartCountdown(null);
    setCanStartServer(false);
    // 1. Parar o servidor
    if (serverStatus?.running) {
      await window.electronAPI.stopServer(serverExecutablePath || '');
    }
    // 2. Esperar 3 segundos
    await new Promise(resolve => setTimeout(resolve, 3000));
    // 3. Iniciar atualização
    window.electronAPI.sendUpdateServerWithSteamcmdStream(steamcmdPath, installPath);
  };

  useEffect(() => {
    const logListener = (_event: any, data: string) => {
      setRealtimeLog((prev) => prev + data);
    };
    const endListener = async () => {
      showNotification('Atualização finalizada!', 'success');
      setStartCountdown(10);
      setCanStartServer(true);
    };
    window.electronAPI.onUpdateServerLog(logListener);
    window.electronAPI.onUpdateServerLogEnd(endListener);
    return () => {
      window.electronAPI.removeUpdateServerLog(logListener);
      window.electronAPI.removeUpdateServerLogEnd(endListener);
    };
  }, [serverExecutablePath, serverPort, maxPlayers, enableBattleye]);

  // Contador regressivo para iniciar o servidor
  useEffect(() => {
    if (startCountdown === null) return;
    if (startCountdown === 0) {
      // Inicia o servidor e fecha o modal
      (async () => {
        await startServerAfterUpdate();
      })();
      setShowRealtimeModal(false);
      return;
    }
    const timer = setTimeout(() => {
      setStartCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [startCountdown]);

  const startServerAfterUpdate = async () => {
    setCanStartServer(false);
    setStartCountdown(null);
    await window.electronAPI.startServerWithConfig(serverExecutablePath, serverPort, maxPlayers, enableBattleye);
    showNotification('Servidor iniciado após atualização!', 'success');
  };

  const openDonationLink = (url: string) => {
    window.open(url, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('Copiado para a área de transferência!', 'success');
  };

  // Agendador de reinício automático
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const timeKey = `${hour}:${minute}`;
      // Só executa se for no minuto 0 do horário agendado e não já executou neste horário
      if (restartHours.includes(hour) && minute === 0 && lastAutoRestart !== timeKey) {
        setLastAutoRestart(timeKey);
        // Verifica se o servidor está online antes de reiniciar
        const status = await window.electronAPI.getRealServerStatus(serverExecutablePath);
        if (status?.running) {
          showNotification(`Reinício automático agendado para ${hour.toString().padStart(2, '0')}:00`, 'info');
          await window.electronAPI.stopServer(serverExecutablePath || '');
          await handleUpdateServerRealtime();
        }
      }
      // Limpa o lastAutoRestart se mudou de minuto
      if (lastAutoRestart && lastAutoRestart !== timeKey && minute !== 0) {
        setLastAutoRestart(null);
      }
    }, 1000 * 30); // verifica a cada 30 segundos
    return () => clearInterval(interval);
  }, [restartHours, lastAutoRestart, serverExecutablePath, showNotification]);

  // Carregar horários do arquivo ao abrir o app
  useEffect(() => {
    (async () => {
      const loaded = await window.electronAPI.loadRestartSchedule();
      if (Array.isArray(loaded)) setRestartHours(loaded);
      setIsLoaded(true);
    })();
  }, []);

  // Salvar horários sempre que mudar, mas só depois de carregar
  useEffect(() => {
    if (isLoaded) {
      window.electronAPI.saveRestartSchedule(restartHours);
    }
  }, [restartHours, isLoaded]);

  if (!serverConfigPath) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          Bem-vindo ao SCUM Server Manager
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Selecione a pasta do seu servidor SCUM para começar a monitorar
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="error" sx={{ mb: 3 }}>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Exibe os horários agendados no topo do Dashboard */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="subtitle1">
          Restart automático:
          {restartHours.length === 0 ? ' Nenhum horário agendado' :
            restartHours.sort((a, b) => a - b).map((h, i) =>
              <span key={h} style={{ marginLeft: 8 }}>{h.toString().padStart(2, '0')}h{i < restartHours.length - 1 ? ' •' : ''}</span>
            )}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 80, ml: 2 }}>
          <InputLabel id="add-restart-hour-label">Hora</InputLabel>
          <Select
            labelId="add-restart-hour-label"
            value={newRestartHour}
            label="Hora"
            onChange={e => setNewRestartHour(Number(e.target.value))}
          >
            {[...Array(24).keys()].map(h => (
              <MenuItem key={h} value={h}>{h.toString().padStart(2, '0')}h</MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton color="primary" onClick={() => {
          if (!restartHours.includes(newRestartHour)) setRestartHours([...restartHours, newRestartHour]);
        }}>
          <AddIcon />
        </IconButton>
        {restartHours.length > 0 && (
          <IconButton color="error" onClick={() => setRestartHours(restartHours.filter(h => h !== newRestartHour))}>
            <DeleteIcon />
          </IconButton>
        )}
        
        {/* Botão de Doação */}
        <Box sx={{ ml: 'auto' }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<FavoriteIcon />}
            onClick={() => setShowDonationModal(true)}
            sx={{
              background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
              '&:hover': {
                background: 'linear-gradient(45deg, #FF5252, #FF7043)',
              }
            }}
          >
            Apoiar Projeto
          </Button>
        </Box>
      </Box>

      {/* Bloco de status de jogadores */}
      {serverStatus && (
        <Box sx={{ mb: 3, p: 3, bgcolor: 'primary.main', borderRadius: 2, color: 'white' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon sx={{ mr: 1, fontSize: 30 }} />
                Jogadores Online
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white' }}>{playerStats.online} / 64</Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {playerStats.online} jogadores conectados agora
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Taxa de Ocupação
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Box sx={{ width: '100%', maxWidth: 200, mr: 2 }}>
                    <Box sx={{ 
                      width: '100%', 
                      height: 20, 
                      bgcolor: 'rgba(255,255,255,0.3)', 
                      borderRadius: 10,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        width: `${Math.min(((playerStats.online || 0) / (maxPlayers || 1)) * 100, 100)}%`, 
                        height: '100%', 
                        bgcolor: playerStats.online > (maxPlayers || 0) * 0.8 ? 'warning.main' : 'success.main',
                        transition: 'width 0.3s ease'
                      }} />
                    </Box>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {Math.round(((playerStats.online || 0) / (maxPlayers || 1)) * 100)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Cards de monitoramento resumido */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CpuIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Status do Servidor</Typography>
              <Chip
                label={serverStatus?.running ? 'Online' : 'Offline'}
                color={serverStatus?.running ? 'success' : 'error'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controles do Servidor */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Controles do Servidor
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<PeopleIcon />}
              onClick={async () => {
                if (serverStatus?.running) return;
                await handleUpdateServerRealtime();
              }}
              disabled={serverStatus?.running}
            >
              Iniciar
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<PeopleIcon />}
              onClick={async () => {
                if (!serverStatus?.running) return;
                await window.electronAPI.stopServer(serverConfigPath);
              }}
              disabled={!serverStatus?.running}
            >
              Parar
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={<PeopleIcon />}
              onClick={async () => {
                if (!serverStatus?.running || isRestarting) return;
                await handleUpdateServerRealtime();
              }}
              disabled={!serverStatus?.running || isRestarting}
            >
              Reiniciar
            </Button>
            <Button
              variant="contained"
              color="info"
              startIcon={<PeopleIcon />}
              onClick={handleUpdateServerRealtime}
            >
              Atualizar
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Modal open={showRestartModal} onClose={() => {}} disableEscapeKeyDown>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          minWidth: 300,
          textAlign: 'center',
        }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Reiniciando servidor em {restartCountdown} segundo{restartCountdown === 1 ? '' : 's'}...
          </Typography>
          <CircularProgress />
        </Box>
      </Modal>

      <Modal open={updateLog !== null} onClose={() => setUpdateLog(null)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          minWidth: 400,
          maxWidth: 700,
          maxHeight: 500,
          textAlign: 'center',
          overflow: 'auto',
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Log da Atualização do Servidor</Typography>
          <pre style={{ maxHeight: 350, overflow: 'auto', textAlign: 'left', background: '#222', color: '#fff', padding: 12, borderRadius: 8 }}>{updateLog && updateLog.trim() ? updateLog : 'Nenhuma saída retornada pelo SteamCMD.'}</pre>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => setUpdateLog(null)}>Fechar</Button>
        </Box>
      </Modal>

      <Modal open={showRealtimeModal} onClose={() => setShowRealtimeModal(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          minWidth: 400,
          maxWidth: 700,
          maxHeight: 500,
          textAlign: 'center',
          overflow: 'auto',
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Log da Atualização</Typography>
          <pre style={{
            maxHeight: 350,
            overflow: 'auto',
            textAlign: 'left',
            background: '#222',
            color: '#fff',
            padding: 12,
            borderRadius: 8,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
          }}>{realtimeLog || 'Aguardando saída...'}</pre>
          {canStartServer && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Servidor será iniciado em {startCountdown} segundo{startCountdown === 1 ? '' : 's'}...
              </Typography>
              <Button variant="contained" color="success" onClick={startServerAfterUpdate}>
                Iniciar agora
              </Button>
            </Box>
          )}
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => setShowRealtimeModal(false)}>Fechar</Button>
        </Box>
      </Modal>

      {/* Modal de Doação */}
      <Dialog open={showDonationModal} onClose={() => setShowDonationModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
            <FavoriteIcon sx={{ color: '#FF6B6B', mr: 1, fontSize: 28 }} />
            <Typography variant="h5">Apoie o Projeto</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Se este projeto te ajudou, considere fazer uma doação para apoiar o desenvolvimento
          </Typography>
        </DialogTitle>
        <DialogContent>
          <List>
            <ListItem button onClick={() => openDonationLink('https://nubank.com.br/cobrar/11dh0n/686a7d58-9cbf-4c90-a6bb-39c21dda7527')}>
              <ListItemIcon>
                <PaymentIcon sx={{ color: '#32BCAD' }} />
              </ListItemIcon>
              <ListItemText 
                primary="PIX - Nubank" 
                secondary="Clique para abrir o link do PIX"
              />
            </ListItem>
            
            <Divider />
            
            <ListItem button onClick={() => openDonationLink('https://www.paypal.com/donate/?hosted_button_id=M5252YJR7KJUN')}>
              <ListItemIcon>
                <PaymentIcon sx={{ color: '#0070BA' }} />
              </ListItemIcon>
              <ListItemText 
                primary="PayPal" 
                secondary="Clique para abrir o link do PayPal"
              />
            </ListItem>
            
            <Divider />
            
            <ListItem button onClick={() => copyToClipboard('GAUSPMTYLI7VVK46GHHAUEF3FCQY4HJ6SS4YTK3BHR5YNI552NL3K2AX')}>
              <ListItemIcon>
                <AccountBalanceIcon sx={{ color: '#F7931A' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Pi Network Wallet" 
                secondary="GAUSPMTYLI7VVK46GHHAUEF3FCQY4HJ6SS4YTK3BHR5YNI552NL3K2AX"
              />
            </ListItem>
            
            <Divider />
            
            <ListItem button onClick={() => copyToClipboard('pedreiro')}>
              <ListItemIcon>
                <ContactSupportIcon sx={{ color: '#5865F2' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Discord" 
                secondary="pedreiro - Clique para copiar o nome de usuário"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setShowDonationModal(false)} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 