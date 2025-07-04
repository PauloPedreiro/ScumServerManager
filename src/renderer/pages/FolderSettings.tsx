import React, { useState, useEffect } from 'react';

// Declaração de tipos para window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      loadAppConfig: () => Promise<any>;
      checkPathExists: (path: string) => Promise<boolean>;
      selectInstallFolder: () => Promise<string | null>;
      saveAppConfig: (serverPath: string, steamcmdPath?: string, installPath?: string, serverPort?: number, maxPlayers?: number, enableBattleye?: boolean, iniConfigPath?: string) => Promise<any>;
    };
  }
}
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Folder as FolderIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  AutoFixHigh as AutoFixIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface FolderSettingsProps {
  showNotification: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

interface FolderConfig {
  name: string;
  path: string;
  required: boolean;
  exists: boolean;
  description: string;
}

const FolderSettings: React.FC<FolderSettingsProps> = ({ showNotification }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [folders, setFolders] = useState<FolderConfig[]>([]);

  const defaultFolders: FolderConfig[] = [
    {
      name: 'Pasta do Servidor',
      path: 'C:\\Servers\\scum\\SCUM\\Binaries\\Win64',
      required: true,
      exists: false,
      description: 'Pasta onde está o SCUMServer.exe'
    },
    {
      name: 'Pasta de Instalação',
      path: 'C:\\Servers\\scum',
      required: true,
      exists: false,
      description: 'Pasta raiz de instalação do SCUM'
    },
    {
      name: 'Pasta de Configuração (.ini)',
      path: 'C:\\Servers\\scum\\SCUM\\Saved\\Config\\WindowsServer',
      required: true,
      exists: false,
      description: 'Pasta com os arquivos ServerSettings.ini, GameUserSettings.ini, etc.'
    },
    {
      name: 'Pasta de Logs',
      path: 'C:\\Servers\\scum\\SCUM\\Saved\\Logs',
      required: true,
      exists: false,
      description: 'Pasta onde ficam os logs do servidor'
    },
    {
      name: 'Pasta do SteamCMD',
      path: 'C:\\Servers\\steamcmd',
      required: true,
      exists: false,
      description: 'Pasta onde está o steamcmd.exe para atualizações'
    },
    {
      name: 'Pasta de Backups',
      path: 'C:\\Servers\\scum\\backups',
      required: false,
      exists: false,
      description: 'Pasta para armazenar backups automáticos'
    }
  ];

  useEffect(() => {
    loadFolderConfig();
  }, []);

  const loadFolderConfig = async () => {
    try {
      setLoading(true);
      
      const appConfig = await window.electronAPI.loadAppConfig();
      
      const updatedFolders = defaultFolders.map(folder => {
        let path = folder.path;
        
        switch (folder.name) {
          case 'Pasta do Servidor':
            path = appConfig?.serverPath ? appConfig.serverPath.replace('\\SCUMServer.exe', '') : folder.path;
            break;
          case 'Pasta de Instalação':
            path = appConfig?.installPath || folder.path;
            break;
          case 'Pasta de Configuração (.ini)':
            path = appConfig?.iniConfigPath || folder.path;
            break;
          case 'Pasta de Logs':
            path = appConfig?.logsPath || folder.path;
            break;
          case 'Pasta do SteamCMD':
            path = appConfig?.steamcmdPath ? appConfig.steamcmdPath.replace('\\steamcmd.exe', '') : folder.path;
            break;
        }
        
        return { ...folder, path };
      });
      
      setFolders(updatedFolders);
      await checkFoldersExistence(updatedFolders);
      
    } catch (error) {
      console.error('Erro ao carregar configuração de pastas:', error);
      showNotification('Erro ao carregar configuração de pastas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkFoldersExistence = async (folderList: FolderConfig[]) => {
    const updatedFolders = await Promise.all(
      folderList.map(async (folder) => {
        try {
          const exists = await window.electronAPI.checkPathExists(folder.path);
          return { ...folder, exists };
        } catch (error) {
          return { ...folder, exists: false };
        }
      })
    );
    setFolders(updatedFolders);
  };

  const handleFolderSelect = async (index: number) => {
    try {
      const selectedPath = await window.electronAPI.selectInstallFolder();
      if (selectedPath) {
        const updatedFolders = [...folders];
        updatedFolders[index].path = selectedPath;
        
        const exists = await window.electronAPI.checkPathExists(selectedPath);
        updatedFolders[index].exists = exists;
        
        setFolders(updatedFolders);
        showNotification(`Pasta ${updatedFolders[index].name} atualizada`, 'success');
      }
    } catch (error) {
      console.error('Erro ao selecionar pasta:', error);
      showNotification('Erro ao selecionar pasta', 'error');
    }
  };

  const handleAutoDetect = async () => {
    try {
      setSaving(true);
      
      const commonPaths = [
        'C:\\Servers\\scum',
        'C:\\Program Files\\SCUM',
        'C:\\Steam\\steamapps\\common\\SCUM',
        'D:\\Servers\\scum',
        'D:\\Games\\SCUM'
      ];
      
      let detectedPath = '';
      
      for (const path of commonPaths) {
        try {
          const exists = await window.electronAPI.checkPathExists(path);
          if (exists) {
            detectedPath = path;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (detectedPath) {
        const updatedFolders = folders.map(folder => {
          let newPath = folder.path;
          
          if (detectedPath.includes('scum') || detectedPath.includes('SCUM')) {
            switch (folder.name) {
              case 'Pasta do Servidor':
                newPath = `${detectedPath}\\SCUM\\Binaries\\Win64`;
                break;
              case 'Pasta de Instalação':
                newPath = detectedPath;
                break;
              case 'Pasta de Configuração (.ini)':
                newPath = `${detectedPath}\\SCUM\\Saved\\Config\\WindowsServer`;
                break;
              case 'Pasta de Logs':
                newPath = `${detectedPath}\\SCUM\\Saved\\Logs`;
                break;
            }
          }
          
          return { ...folder, path: newPath };
        });
        
        setFolders(updatedFolders);
        await checkFoldersExistence(updatedFolders);
        showNotification('Detecção automática concluída!', 'success');
      } else {
        showNotification('Não foi possível detectar automaticamente as pastas', 'warning');
      }
      
    } catch (error) {
      console.error('Erro na detecção automática:', error);
      showNotification('Erro na detecção automática', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const requiredFolders = folders.filter(f => f.required);
      const missingRequired = requiredFolders.filter(f => !f.exists);
      if (missingRequired.length > 0) {
        showNotification(
          `Pastas obrigatórias não encontradas: ${missingRequired.map(f => f.name).join(', ')}`,
          'warning'
        );
        return;
      }
      const serverPath = folders.find(f => f.name === 'Pasta do Servidor')?.path + '\\SCUMServer.exe';
      const installPath = folders.find(f => f.name === 'Pasta de Instalação')?.path;
      const iniConfigPath = folders.find(f => f.name === 'Pasta de Configuração (.ini)')?.path;
      const steamcmdPath = folders.find(f => f.name === 'Pasta do SteamCMD')?.path + '\\steamcmd.exe';
      // Carregar config atual, fazer merge e salvar
      const configAtual = await window.electronAPI.loadAppConfig();
      const configAtualizado = {
        ...configAtual,
        serverPath,
        steamcmdPath,
        installPath,
        serverPort: 8900,
        maxPlayers: 64,
        enableBattleye: true,
        iniConfigPath
      };
      await window.electronAPI.saveAppConfig(configAtualizado);
      showNotification('Configuração de pastas salva com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      showNotification('Erro ao salvar configuração', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (folder: FolderConfig) => {
    if (folder.required && !folder.exists) {
      return <ErrorIcon color="error" />;
    } else if (folder.exists) {
      return <CheckCircleIcon color="success" />;
    } else {
      return <InfoIcon color="action" />;
    }
  };

  const getStatusChip = (folder: FolderConfig) => {
    if (folder.required && !folder.exists) {
      return <Chip label="Obrigatória - Não encontrada" color="error" size="small" />;
    } else if (folder.exists) {
      return <Chip label="Encontrada" color="success" size="small" />;
    } else {
      return <Chip label="Opcional" color="default" size="small" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Carregando configurações...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        Configurar Pastas
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Configure os caminhos das pastas essenciais para o funcionamento do servidor SCUM.
      </Typography>

      {/* Alertas */}
      <Box sx={{ mb: 3 }}>
        {folders.filter(f => f.required && !f.exists).length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Algumas pastas obrigatórias não foram encontradas. Configure-as para que o servidor funcione corretamente.
          </Alert>
        )}
        
        {folders.every(f => f.exists) && (
          <Alert severity="success">
            Todas as pastas obrigatórias foram encontradas! O servidor está pronto para funcionar.
          </Alert>
        )}
      </Box>

      {/* Ações */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AutoFixIcon />}
          onClick={handleAutoDetect}
          disabled={saving}
        >
          Detecção Automática
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadFolderConfig}
          disabled={saving}
        >
          Recarregar
        </Button>
        
        <Button
          variant="contained"
          color="success"
          startIcon={<SaveIcon />}
          onClick={handleSaveConfig}
          disabled={saving}
        >
          Salvar Configuração
        </Button>
      </Box>

      {/* Lista de Pastas */}
      <Grid container spacing={3}>
        {folders.map((folder, index) => (
          <Grid item xs={12} md={6} key={folder.name}>
            <Card 
              sx={{ 
                height: '100%',
                border: folder.required && !folder.exists ? '2px solid #f44336' : '1px solid #e0e0e0'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FolderIcon color="primary" />
                  <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                    {folder.name}
                  </Typography>
                  {getStatusIcon(folder)}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {folder.description}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  {getStatusChip(folder)}
                </Box>
                
                <TextField
                  fullWidth
                  size="small"
                  value={folder.path}
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 2 }}
                />
                
                <Button
                  variant="outlined"
                  startIcon={<FolderIcon />}
                  onClick={() => handleFolderSelect(index)}
                  fullWidth
                >
                  Selecionar Pasta
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Informações Adicionais */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informações Importantes
        </Typography>
        
        <List dense>
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="info" />
            </ListItemIcon>
            <ListItemText 
              primary="Pastas Obrigatórias"
              secondary="São necessárias para o funcionamento básico do servidor"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="info" />
            </ListItemIcon>
            <ListItemText 
              primary="Pastas Opcionais"
              secondary="Melhoram a experiência mas não são essenciais"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="info" />
            </ListItemIcon>
            <ListItemText 
              primary="Detecção Automática"
              secondary="Tenta encontrar automaticamente as pastas em locais comuns"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default FolderSettings; 