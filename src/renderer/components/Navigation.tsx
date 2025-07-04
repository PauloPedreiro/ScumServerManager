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
import SvgIcon from '@mui/material/SvgIcon';

const drawerWidth = 280;

function DiscordIcon(props: any) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.8732.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1835 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1835 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </SvgIcon>
  );
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Configurar Pastas', icon: <FolderOpenIcon />, path: '/folder-settings' },
  { text: 'Configurações do Servidor', icon: <SettingsIcon />, path: '/server-settings' },
  { text: 'Configurações do Jogo', icon: <GameIcon />, path: '/game-settings' },
  { text: 'Economia', icon: <EconomyIcon />, path: '/economy' },
  { text: 'Horários de Raid', icon: <RaidIcon />, path: '/raid-times' },
  { text: 'Gerenciamento de Usuários', icon: <UsersIcon />, path: '/users' },
  { text: 'Discord', icon: <DiscordIcon />, path: '/discord' },
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