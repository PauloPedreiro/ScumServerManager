import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Gamepad as GameIcon,
  AttachMoney as EconomyIcon,
  Security as RaidIcon,
  People as UsersIcon,
  Inventory as LootIcon,
  Backup as BackupIcon,
  Folder as FolderIcon,
  Monitor as MonitorIcon,
  FolderOpen as FolderOpenIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useServerConfig } from '../contexts/ServerConfigContext';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Configurar Pastas', icon: <FolderOpenIcon />, path: '/folder-settings' },
  { text: 'Configurações do Servidor', icon: <SettingsIcon />, path: '/server-settings' },
  { text: 'Configurações do Jogo', icon: <GameIcon />, path: '/game-settings' },
  { text: 'Economia', icon: <EconomyIcon />, path: '/economy' },
  { text: 'Horários de Raid', icon: <RaidIcon />, path: '/raid-times' },
  { text: 'Gerenciamento de Usuários', icon: <UsersIcon />, path: '/users' },
  { text: 'Configurações de Loot', icon: <LootIcon />, path: '/loot' },
  { text: 'Backup e Restauração', icon: <BackupIcon />, path: '/backup' },
  { text: 'Logs e Monitoramento', icon: <MonitorIcon />, path: '/monitoring' },
];

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serverPath, serverCache, setServerPath } = useServerConfig();

  const handleSelectServerFolder = async () => {
    try {
      const selectedPath = await window.electronAPI.selectServerFolder();
      if (selectedPath) {
        setServerPath(selectedPath);
      }
    } catch (error) {
      console.error('Erro ao selecionar pasta:', error);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#2d2d2d',
          borderRight: '1px solid #404040',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          SCUM Server Manager
        </Typography>
      </Box>

      <Divider sx={{ borderColor: '#404040' }} />

      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleSelectServerFolder}
          sx={{
            borderRadius: 2,
            mb: 1,
            backgroundColor: serverPath ? 'success.dark' : 'warning.dark',
            '&:hover': {
              backgroundColor: serverPath ? 'success.main' : 'warning.main',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText
            primary={serverPath ? 'Servidor Conectado' : 'Selecionar Servidor'}
            secondary={
              serverCache 
                ? `${serverCache.serverName} (${serverCache.playstyle})`
                : serverPath 
                  ? serverPath.split('\\').pop() 
                  : 'Clique para selecionar'
            }
            sx={{ color: 'white' }}
          />
        </ListItemButton>
      </Box>

      <Divider sx={{ borderColor: '#404040' }} />

      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  color: location.pathname === item.path ? 'white' : 'inherit',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Navigation; 