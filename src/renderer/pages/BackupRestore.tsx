import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useServerConfig } from '../contexts/ServerConfigContext';

interface BackupRestoreProps {
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

interface Backup {
  id: string;
  name: string;
  timestamp: string;
  size: string;
  files: string[];
  description?: string;
}

const BackupRestore: React.FC<BackupRestoreProps> = ({ showNotification }) => {
  const { serverPath } = useServerConfig();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [newBackupName, setNewBackupName] = useState('');
  const [newBackupDescription, setNewBackupDescription] = useState('');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupInterval, setAutoBackupInterval] = useState(24);

  useEffect(() => {
    loadBackups();
  }, [serverPath]);

  const loadBackups = async () => {
    if (!serverPath) return;
    
    try {
      setLoading(true);
      const backupList = await window.electronAPI.getBackups();
      setBackups(backupList || []);
    } catch (error) {
      showNotification('Erro ao carregar backups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    if (!serverPath || !newBackupName.trim()) return;
    
    try {
      setCreatingBackup(true);
      const backup = await window.electronAPI.createBackup({
        name: newBackupName.trim(),
        description: newBackupDescription.trim(),
        serverPath
      });
      
      if (backup) {
        setBackups(prev => [backup, ...prev]);
        setNewBackupName('');
        setNewBackupDescription('');
        setBackupDialogOpen(false);
        showNotification('Backup criado com sucesso!', 'success');
      }
    } catch (error) {
      showNotification('Erro ao criar backup', 'error');
    } finally {
      setCreatingBackup(false);
    }
  };

  const restoreBackup = async (backup: Backup) => {
    if (!serverPath) return;
    
    try {
      setRestoringBackup(true);
      const success = await window.electronAPI.restoreBackup(backup.id, serverPath);
      
      if (success) {
        showNotification('Backup restaurado com sucesso!', 'success');
        setRestoreDialogOpen(false);
        setSelectedBackup(null);
      }
    } catch (error) {
      showNotification('Erro ao restaurar backup', 'error');
    } finally {
      setRestoringBackup(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      const success = await window.electronAPI.deleteBackup(backupId);
      
      if (success) {
        setBackups(prev => prev.filter(b => b.id !== backupId));
        showNotification('Backup excluído com sucesso!', 'success');
      }
    } catch (error) {
      showNotification('Erro ao excluir backup', 'error');
    }
  };

  const downloadBackup = async (backup: Backup) => {
    try {
      await window.electronAPI.downloadBackup(backup.id);
      showNotification('Backup baixado com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao baixar backup', 'error');
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  if (!serverPath) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Selecione um servidor para gerenciar backups
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          <BackupIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Backup e Restauração
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={loadBackups}
            sx={{ mr: 2 }}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<BackupIcon />}
            onClick={() => setBackupDialogOpen(true)}
          >
            Criar Backup
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Gerencie backups dos arquivos de configuração do seu servidor SCUM. 
        Crie backups manuais ou configure backups automáticos para proteger suas configurações.
      </Alert>

      {/* Auto Backup Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Configurações de Backup Automático
          </Typography>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Intervalo de Backup</InputLabel>
                <Select
                  value={autoBackupInterval}
                  onChange={(e) => setAutoBackupInterval(e.target.value as number)}
                  disabled={!autoBackupEnabled}
                >
                  <MenuItem value={1}>A cada hora</MenuItem>
                  <MenuItem value={6}>A cada 6 horas</MenuItem>
                  <MenuItem value={12}>A cada 12 horas</MenuItem>
                  <MenuItem value={24}>Diário</MenuItem>
                  <MenuItem value={168}>Semanal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant={autoBackupEnabled ? "contained" : "outlined"}
                color={autoBackupEnabled ? "success" : "primary"}
                onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                startIcon={autoBackupEnabled ? <CheckCircleIcon /> : <SettingsIcon />}
              >
                {autoBackupEnabled ? 'Backup Automático Ativo' : 'Ativar Backup Automático'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Backups List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Backups Disponíveis
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : backups.length > 0 ? (
            <List>
              {backups.map((backup, index) => (
                <React.Fragment key={backup.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {backup.name}
                          <Chip 
                            label={backup.files.length} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {backup.description && `${backup.description} • `}
                            Criado em {formatDate(backup.timestamp)} • {backup.size}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {backup.files.slice(0, 3).map((file, idx) => (
                              <Chip
                                key={idx}
                                label={file}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                            {backup.files.length > 3 && (
                              <Chip
                                label={`+${backup.files.length - 3} mais`}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => downloadBackup(backup)}
                        title="Baixar backup"
                        sx={{ mr: 1 }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setRestoreDialogOpen(true);
                        }}
                        title="Restaurar backup"
                        color="primary"
                        sx={{ mr: 1 }}
                      >
                        <RestoreIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => deleteBackup(backup.id)}
                        title="Excluir backup"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < backups.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum backup encontrado. Crie seu primeiro backup para começar.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Novo Backup</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome do Backup"
            fullWidth
            variant="outlined"
            value={newBackupName}
            onChange={(e) => setNewBackupName(e.target.value)}
            placeholder="Backup Configurações SCUM"
          />
          <TextField
            margin="dense"
            label="Descrição (opcional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newBackupDescription}
            onChange={(e) => setNewBackupDescription(e.target.value)}
            placeholder="Descreva o que este backup contém..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={createBackup}
            disabled={!newBackupName.trim() || creatingBackup}
            variant="contained"
            startIcon={creatingBackup ? <CircularProgress size={20} /> : <BackupIcon />}
          >
            {creatingBackup ? 'Criando...' : 'Criar Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Restaurar Backup</DialogTitle>
        <DialogContent>
          {selectedBackup && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedBackup.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedBackup.description}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Arquivos incluídos:</strong>
              </Typography>
              <Box sx={{ mb: 2 }}>
                {selectedBackup.files.map((file, index) => (
                  <Chip
                    key={index}
                    label={file}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
              <Alert severity="warning">
                <strong>Atenção:</strong> Esta ação irá substituir os arquivos de configuração atuais. 
                Certifique-se de que deseja prosseguir.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={() => selectedBackup && restoreBackup(selectedBackup)}
            disabled={restoringBackup}
            variant="contained"
            color="warning"
            startIcon={restoringBackup ? <CircularProgress size={20} /> : <RestoreIcon />}
          >
            {restoringBackup ? 'Restaurando...' : 'Restaurar Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Information Box */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Informações sobre Backup e Restauração
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Backup Manual:</strong> Crie backups quando fizer alterações importantes
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Backup Automático:</strong> Configure backups periódicos para proteção contínua
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Restauração:</strong> Restaure backups para reverter alterações indesejadas
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Download:</strong> Baixe backups para armazenamento externo
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Arquivos Incluídos:</strong> Todos os arquivos de configuração importantes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Segurança:</strong> Mantenha backups em locais seguros
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default BackupRestore; 