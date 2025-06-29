import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Gamepad as GameIcon,
  AttachMoney as EconomyIcon,
  Security as RaidIcon,
  People as UsersIcon,
  Inventory as LootIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useServerConfig } from '../contexts/ServerConfigContext';

interface DashboardProps {
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ showNotification }) => {
  const { config, serverPath, serverCache, loading, error, loadConfig, saveConfig, clearServerCache } = useServerConfig();

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
      showNotification('Configurações atualizadas!', 'success');
    } catch (error) {
      showNotification('Erro ao atualizar configurações', 'error');
    }
  };

  const handleClearCache = async () => {
    try {
      await clearServerCache();
      showNotification('Cache limpo com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao limpar cache', 'error');
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

  if (!serverPath) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          Bem-vindo ao SCUM Server Manager
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Selecione a pasta do seu servidor SCUM para começar a configurar
        </Typography>
        <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
          Clique em "Selecionar Servidor" na barra lateral para conectar ao seu servidor SCUM
        </Alert>
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleRefresh}>
          Tentar Novamente
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 2 }}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveAll}
            disabled={loading}
          >
            Salvar Tudo
          </Button>
        </Box>
      </Box>

      {/* Informações do Cache */}
      {serverCache && (
        <Card sx={{ mb: 4, bgcolor: 'success.light', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Servidor Carregado
                </Typography>
                <Typography variant="body2">
                  <strong>Nome:</strong> {serverCache.serverName} | 
                  <strong> Jogadores:</strong> {serverCache.maxPlayers} | 
                  <strong> Estilo:</strong> {serverCache.playstyle}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Último carregamento:</strong> {new Date(serverCache.lastLoaded).toLocaleString('pt-BR')}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {serverInfo && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Informações do Servidor
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Nome:</strong> {serverInfo.name}
                </Typography>
                <Typography variant="body1">
                  <strong>Descrição:</strong> {serverInfo.description}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Máximo de Jogadores:</strong> {serverInfo.maxPlayers}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body1" sx={{ m: 0 }}>
                    <strong>Estilo de Jogo:</strong>
                  </Typography>
                  <Chip 
                    label={serverInfo.playstyle} 
                    color={serverInfo.playstyle === 'PVE' ? 'success' : 'warning'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Configurações do Servidor</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Configure as configurações básicas do servidor, incluindo nome, descrição, limites de jogadores e muito mais.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" href="/server-settings">
                Configurar
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GameIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Configurações do Jogo</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Ajuste as configurações de interface, gráficos, áudio e outras opções do jogo.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" href="/game-settings">
                Configurar
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EconomyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Economia</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Configure preços, rotação de itens e configurações dos traders.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" href="/economy">
                Configurar
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RaidIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Horários de Raid</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Defina os horários permitidos para raids no servidor.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" href="/raid-times">
                Configurar
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <UsersIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Usuários</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Gerencie administradores, whitelist, banimentos e usuários exclusivos.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" href="/users">
                Gerenciar
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LootIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Loot</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Configure spawners, itens e configurações de loot do servidor.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" href="/loot">
                Configurar
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 