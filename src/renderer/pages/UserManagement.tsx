import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
  VolumeOff as MuteIcon
} from '@mui/icons-material';
import { useServerConfig } from '../contexts/ServerConfigContext';

interface UserManagementProps {
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
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

const UserManagement: React.FC<UserManagementProps> = ({ showNotification }) => {
  const { config, loading, saveConfig } = useServerConfig();
  const [localUsers, setLocalUsers] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ steamId: '', permission: '', godmode: false, name: '' });
  const [usernames, setUsernames] = useState<any>({});
  const USERNAMES_PATH = 'usernames.json';

  const userTypes = [
    { key: 'adminUsers', label: 'Administradores', icon: <AdminIcon />, color: 'primary' },
    { key: 'serverSettingsAdminUsers', label: 'Admins Configuração', icon: <SecurityIcon />, color: 'secondary' },
    { key: 'whitelistedUsers', label: 'Whitelist', icon: <SecurityIcon />, color: 'success' },
    { key: 'bannedUsers', label: 'Banidos', icon: <BlockIcon />, color: 'error' },
    { key: 'silencedUsers', label: 'Silenciados', icon: <MuteIcon />, color: 'warning' },
    { key: 'exclusiveUsers', label: 'Exclusivos', icon: <PeopleIcon />, color: 'info' }
  ];

  useEffect(() => {
    if (config?.users) {
      setLocalUsers(JSON.parse(JSON.stringify(config.users)));
    }
  }, [config]);

  useEffect(() => {
    // Carregar usernames.json ao iniciar
    if (window.electronAPI?.readJsonFile) {
      window.electronAPI.readJsonFile(USERNAMES_PATH)
        .then((data: any) => {
          if (data) setUsernames(data);
        })
        .catch(() => setUsernames({}));
    }
  }, []);

  const handleSave = async () => {
    if (!localUsers) return;
    try {
      setSaving(true);
      await saveConfig({ users: localUsers });
      showNotification('Usuários salvos com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao salvar usuários', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config?.users) {
      setLocalUsers(JSON.parse(JSON.stringify(config.users)));
      showNotification('Usuários restaurados', 'info');
    }
  };

  const addUser = (userType: string, steamId: string, godmode: boolean, name: string) => {
    if (!steamId.trim()) return;
    let idToSave = steamId.trim();
    if (godmode) {
      idToSave += '[setgodmode]';
    }
    setLocalUsers((prev: any) => ({
      ...prev,
      [userType]: [...(prev[userType] || []), idToSave]
    }));
    if (name && steamId) {
      const updatedUsernames = { ...usernames, [idToSave]: name };
      setUsernames(updatedUsernames);
      if (window.electronAPI?.saveJsonFile) {
        window.electronAPI.saveJsonFile(USERNAMES_PATH, updatedUsernames);
      }
    }
    setNewUser({ steamId: '', permission: '', godmode: false, name: '' });
    setAddDialogOpen(false);
    showNotification(`Usuário adicionado à ${userTypes.find(t => t.key === userType)?.label}`, 'success');
  };

  const removeUser = (userType: string, steamId: string) => {
    setLocalUsers((prev: any) => ({
      ...prev,
      [userType]: prev[userType].filter((id: string) => id !== steamId)
    }));
    showNotification('Usuário removido', 'info');
  };

  const validateSteamId = (steamId: string) => {
    // Steam ID validation (basic format check)
    const steamIdRegex = /^[0-9]{17}$/;
    return steamIdRegex.test(steamId);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!config) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Carregando configurações...
        </Typography>
      </Box>
    );
  }

  if (!localUsers) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          <PeopleIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Gerenciamento de Usuários
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleReset}
            sx={{ mr: 2 }}
          >
            Restaurar
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Gerencie administradores, whitelist, banimentos e outros tipos de usuários do seu servidor SCUM.
        Use Steam IDs de 17 dígitos para identificar os usuários.
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="user management tabs">
          {userTypes.map((userType, index) => (
            <Tab
              key={userType.key}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {userType.icon}
                  {userType.label}
                  <Chip
                    label={localUsers[userType.key]?.length || 0}
                    size="small"
                    color={userType.color as any}
                    variant="outlined"
                  />
                </Box>
              }
              {...a11yProps(index)}
            />
          ))}
        </Tabs>
      </Box>

      {userTypes.map((userType, index) => (
        <TabPanel key={userType.key} value={tabValue} index={index}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {userType.label}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                setNewUser({ steamId: '', permission: userType.key, godmode: false, name: '' });
                setAddDialogOpen(true);
              }}
            >
              Adicionar {userType.label.slice(0, -1)}
            </Button>
          </Box>

          <Card>
            <CardContent>
              {localUsers[userType.key]?.length > 0 ? (
                <List>
                  {localUsers[userType.key].map((steamId: string, idx: number) => {
                    const nome = usernames[steamId];
                    return (
                      <ListItem key={idx} divider>
                        <ListItemText
                          primary={nome ? `Nome: ${nome}` : steamId}
                          secondary={nome ? `Steam ID: ${steamId}` : undefined}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => removeUser(userType.key, steamId)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhum usuário nesta categoria
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      ))}

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Usuário</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Steam ID"
            type="text"
            fullWidth
            variant="outlined"
            value={newUser.steamId}
            onChange={(e) => setNewUser({ ...newUser, steamId: e.target.value })}
            error={newUser.steamId.length > 0 && !validateSteamId(newUser.steamId)}
            helperText={
              newUser.steamId.length > 0 && !validateSteamId(newUser.steamId)
                ? 'Steam ID deve ter 17 dígitos'
                : 'Digite o Steam ID de 17 dígitos do usuário'
            }
            placeholder="76561198040636105"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newUser.godmode}
                onChange={e => setNewUser({ ...newUser, godmode: e.target.checked })}
              />
            }
            label="Godmode ([setgodmode])"
          />
          <TextField
            margin="dense"
            label="Nome do Usuário (opcional)"
            type="text"
            fullWidth
            variant="outlined"
            value={newUser.name}
            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
            helperText="Se preenchido, será vinculado ao Steam ID no controle de nomes."
            placeholder="Nome do jogador"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={() => addUser(newUser.permission, newUser.steamId, newUser.godmode, newUser.name)}
            disabled={!validateSteamId(newUser.steamId)}
            variant="contained"
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Information Box */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Informações sobre Gerenciamento de Usuários
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Administradores:</strong> Acesso total ao servidor
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Admins Configuração:</strong> Podem alterar configurações do servidor
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Whitelist:</strong> Apenas usuários autorizados podem entrar
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Banidos:</strong> Usuários proibidos de entrar no servidor
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Silenciados:</strong> Usuários sem permissão de chat
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Exclusivos:</strong> Usuários com acesso exclusivo
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

function a11yProps(index: number) {
  return {
    id: `user-tab-${index}`,
    'aria-controls': `user-tabpanel-${index}`,
  };
}

export default UserManagement; 