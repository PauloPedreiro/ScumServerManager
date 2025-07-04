import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { useServerConfig } from '../contexts/ServerConfigContext';
import ptBR from '../locales/ptBR';
import ServerTopFields from '../components/ServerTopFields';
import { SelectChangeEvent } from '@mui/material/Select';
// Usar asserção de tipo para listDir

interface ServerSettingsProps {
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

function validateField(section: string, key: string, value: any): { valid: boolean; message?: string } {
  // Validações básicas
  if (value === null || value === undefined) {
    return { valid: false, message: 'Campo obrigatório' };
  }

  // Validações específicas por campo
  if (key === 'ServerName' && (typeof value !== 'string' || value.length < 3)) {
    return { valid: false, message: 'Nome do servidor deve ter pelo menos 3 caracteres' };
  }

  if (key === 'MaxPlayers' && (isNaN(Number(value)) || Number(value) < 1 || Number(value) > 100)) {
    return { valid: false, message: 'Máximo de jogadores deve ser entre 1 e 100' };
  }

  if (key === 'ServerPort' && (isNaN(Number(value)) || Number(value) < 1024 || Number(value) > 65535)) {
    return { valid: false, message: 'Porta deve ser entre 1024 e 65535' };
  }

  return { valid: true };
}

function isBooleanField(section: string, key: string) {
  const booleanFields = [
    'AllowFirstPersonView', 'AllowThirdPersonView', 'AllowMap', 'AllowCrosshair',
    'AllowHud', 'AllowInventory', 'AllowCrafting', 'AllowBuilding',
    'AllowVehicles', 'AllowWeapons', 'AllowAmmo', 'AllowFood',
    'AllowWater', 'AllowMedicine', 'AllowTools', 'AllowClothing',
    'AllowBackpacks', 'AllowContainers', 'AllowTents', 'AllowFlags',
    'AllowLocks', 'AllowKeys', 'AllowCodes', 'AllowExplosives',
    'AllowTraps', 'AllowBombs', 'AllowMines', 'AllowGrenades',
    'AllowRockets', 'AllowMissiles', 'AllowArtillery', 'AllowAirstrikes',
    'AllowHelicopters', 'AllowPlanes', 'AllowBoats', 'AllowSubmarines',
    'AllowTanks', 'AllowAPCs', 'AllowJeeps', 'AllowMotorcycles',
    'AllowBicycles', 'AllowHorses', 'AllowDogs', 'AllowCats',
    'AllowBirds', 'AllowFish', 'AllowInsects', 'AllowReptiles',
    'AllowAmphibians', 'AllowMammals', 'AllowDinosaurs', 'AllowAliens',
    'AllowZombies', 'AllowVampires', 'AllowWerewolves', 'AllowGhosts',
    'AllowDemons', 'AllowAngels', 'AllowGods', 'AllowDevils',
    'AllowWitches', 'AllowWizards', 'AllowSorcerers', 'AllowNecromancers',
    'AllowPaladins', 'AllowClerics', 'AllowDruids', 'AllowRangers',
    'AllowFighters', 'AllowRogues', 'AllowMonks', 'AllowBarbarians',
    'AllowBards', 'AllowWarlocks', 'AllowArtificers', 'AllowBloodHunters'
  ];
  
  return booleanFields.includes(key);
}

// Componente separado para o modal de edição genérico
const EditFieldModal: React.FC<{
  open: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (value: string) => void;
  fieldName: string;
  multiline?: boolean;
}> = ({ open, onClose, initialValue, onSave, fieldName, multiline = false }) => {
  const [value, setValue] = useState(initialValue);

  // Resetar o valor quando o modal abre
  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [open, initialValue]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Editar {fieldName}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={fieldName}
          fullWidth
          multiline={multiline}
          rows={multiline ? 4 : 1}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={() => {
            onSave(value);
            onClose();
          }}
          variant="contained"
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Campo otimizado para Nome do Servidor
interface ServerFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function ServerNameFieldComponent({ value, onChange }: ServerFieldProps) {
  console.log('Renderizou ServerNameField');
  return (
    <TextField
      label={ptBR.ServerName || 'Nome do Servidor'}
      fullWidth
      value={value}
      onChange={onChange}
      margin="normal"
    />
  );
}
const ServerNameField = React.memo(ServerNameFieldComponent);

function ServerDescriptionFieldComponent({ value, onChange }: ServerFieldProps) {
  console.log('Renderizou ServerDescriptionField');
  return (
    <TextField
      label={ptBR.ServerDescription || 'Descrição do Servidor'}
      fullWidth
      value={value}
      onChange={onChange}
      margin="normal"
    />
  );
}
const ServerDescriptionField = React.memo(ServerDescriptionFieldComponent);

// Tipos das props do GeneralSection
interface GeneralSectionProps {
  serverName: string;
  onServerNameChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  serverDescription: string;
  onServerDescriptionChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  serverPassword: string;
  onServerPasswordChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  maxPlayers: number;
  onMaxPlayersChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  serverBannerUrl: string;
  onServerBannerUrlChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  serverPlaystyle: string;
  onServerPlaystyleChange: (e: SelectChangeEvent<string>) => void;
  welcomeMessage: string;
  onWelcomeMessageChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  messageOfTheDay: string;
  onMessageOfTheDayChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  messageOfTheDayCooldown: number;
  onMessageOfTheDayCooldownChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  minServerTickRate: number;
  onMinServerTickRateChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  maxServerTickRate: number;
  onMaxServerTickRateChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  maxPing: number;
  onMaxPingChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  serverPort: number;
  onServerPortChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  enableBattleye: boolean;
  onEnableBattleyeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// GeneralSection recebe handlers onChange
const GeneralSection: React.FC<GeneralSectionProps> = memo(({
  serverName,
  onServerNameChange,
  serverDescription,
  onServerDescriptionChange,
  serverPassword,
  onServerPasswordChange,
  maxPlayers,
  onMaxPlayersChange,
  serverBannerUrl,
  onServerBannerUrlChange,
  serverPlaystyle,
  onServerPlaystyleChange,
  welcomeMessage,
  onWelcomeMessageChange,
  messageOfTheDay,
  onMessageOfTheDayChange,
  messageOfTheDayCooldown,
  onMessageOfTheDayCooldownChange,
  minServerTickRate,
  onMinServerTickRateChange,
  maxServerTickRate,
  onMaxServerTickRateChange,
  maxPing,
  onMaxPingChange,
  serverPort,
  onServerPortChange,
  enableBattleye,
  onEnableBattleyeChange
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField label="Nome do Servidor" fullWidth value={serverName} onChange={onServerNameChange} margin="normal" />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Descrição do Servidor" fullWidth value={serverDescription} onChange={onServerDescriptionChange} margin="normal" />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Senha do Servidor" fullWidth value={serverPassword} onChange={onServerPasswordChange} margin="normal" />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Máximo de Jogadores" type="number" fullWidth value={maxPlayers} onChange={onMaxPlayersChange} margin="normal" />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Banner do Servidor (URL)" fullWidth value={serverBannerUrl} onChange={onServerBannerUrlChange} margin="normal" />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Estilo de Jogo</InputLabel>
          <Select value={serverPlaystyle} onChange={onServerPlaystyleChange} label="Estilo de Jogo">
            <MenuItem value="PVE">PVE</MenuItem>
            <MenuItem value="PVP">PVP</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField label="Mensagem de Boas-vindas" fullWidth value={welcomeMessage} onChange={onWelcomeMessageChange} margin="normal" />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Mensagem do Dia" fullWidth value={messageOfTheDay} onChange={onMessageOfTheDayChange} margin="normal" />
      </Grid>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={2}>
            <TextField label="Cooldown da Mensagem do Dia" type="number" fullWidth value={messageOfTheDayCooldown} onChange={onMessageOfTheDayCooldownChange} margin="normal" />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="Min Server Tick Rate" type="number" fullWidth value={minServerTickRate} onChange={onMinServerTickRateChange} margin="normal" />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="Max Server Tick Rate" type="number" fullWidth value={maxServerTickRate} onChange={onMaxServerTickRateChange} margin="normal" />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="Max Ping" type="number" fullWidth value={maxPing} onChange={onMaxPingChange} margin="normal" />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="Porta do Servidor" type="number" fullWidth value={serverPort} onChange={onServerPortChange} margin="normal" />
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <FormControlLabel control={<Switch checked={enableBattleye} onChange={onEnableBattleyeChange} />} label="Battleye Ativado" />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
});

function createSectionComponent(sectionName: string, ptBR: any) {
  return memo(function Section({ initialData, onSave }: { initialData: any; onSave: (data: any) => void }) {
    const [localState, setLocalState] = useState<any>({ ...initialData });
    useEffect(() => {
      setLocalState({ ...initialData });
    }, [initialData]);
    const handleChange = (key: string, value: any) => {
      setLocalState((prev: any) => ({ ...prev, [key]: value }));
    };
    const handleSave = () => {
      onSave(localState);
    };
    return (
      <Grid container spacing={3}>
        {Object.keys(localState).map((key) => (
          <Grid item xs={12} md={6} key={key}>
            <TextField
              label={ptBR[key] || key}
              fullWidth
              type={typeof localState[key] === 'number' ? 'number' : 'text'}
              value={localState[key]}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleChange(key, typeof localState[key] === 'number' ? Number(e.target.value) : e.target.value)}
              margin="normal"
            />
          </Grid>
        ))}
      </Grid>
    );
  });
}

const WorldSection = createSectionComponent('World', ptBR);
const RespawnSection = createSectionComponent('Respawn', ptBR);
const VehiclesSection = createSectionComponent('Vehicles', ptBR);
const DamageSection = createSectionComponent('Damage', ptBR);
const FeaturesSection = createSectionComponent('Features', ptBR);

const ServerSettings: React.FC<ServerSettingsProps> = ({ showNotification }) => {
  const { config, loading, saveConfig } = useServerConfig();
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [editModal, setEditModal] = useState<{
    open: boolean;
    section: string;
    key: string;
    value: string;
    fieldName: string;
    multiline?: boolean;
  }>({
    open: false,
    section: '',
    key: '',
    value: '',
    fieldName: '',
    multiline: false
  });
  
  // Estados locais para os campos do topo
  const [serverPort, setServerPort] = useState<number>(8900);
  const [enableBattleye, setEnableBattleye] = useState<boolean>(true);

  // Adicionar hooks de estado para cada campo da seção General
  const [serverName, setServerName] = useState('');
  const [serverDescription, setServerDescription] = useState('');
  const [serverPassword, setServerPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(64);
  const [serverBannerUrl, setServerBannerUrl] = useState('');
  const [serverPlaystyle, setServerPlaystyle] = useState('PVE');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [messageOfTheDay, setMessageOfTheDay] = useState('');
  const [messageOfTheDayCooldown, setMessageOfTheDayCooldown] = useState(10);
  const [minServerTickRate, setMinServerTickRate] = useState(5);
  const [maxServerTickRate, setMaxServerTickRate] = useState(30);
  const [maxPing, setMaxPing] = useState(200);

  // 1. Adicione um estado: const [expandedSection, setExpandedSection] = useState<string | false>('General');
  const [expandedSection, setExpandedSection] = useState<string | false>('General');

  // Ref para o campo Máximo de Jogadores
  const maxPlayersRef = React.useRef<HTMLInputElement>(null);

  // Estado para campo de teste
  const [campoTeste, setCampoTeste] = useState('');

  // Inicializar os estados locais apenas uma vez ao montar o componente
  useEffect(() => {
    if (config?.serverSettings?.General) {
      setServerPort(config.serverSettings.General.ServerPort || 8900);
      setEnableBattleye(
        config.serverSettings.General.EnableBattleye !== undefined
          ? config.serverSettings.General.EnableBattleye
          : true
      );
      setServerName(config.serverSettings.General.ServerName || '');
      setServerDescription(config.serverSettings.General.ServerDescription || '');
      setServerPassword(config.serverSettings.General.ServerPassword || '');
      setMaxPlayers(config.serverSettings.General.MaxPlayers || 64);
      setServerBannerUrl(config.serverSettings.General.ServerBannerUrl || '');
      setServerPlaystyle(config.serverSettings.General.ServerPlaystyle || 'PVE');
      setWelcomeMessage(config.serverSettings.General.WelcomeMessage || '');
      setMessageOfTheDay(config.serverSettings.General.MessageOfTheDay || '');
      setMessageOfTheDayCooldown(config.serverSettings.General.MessageOfTheDayCooldown || 10);
      setMinServerTickRate(config.serverSettings.General.MinServerTickRate || 5);
      setMaxServerTickRate(config.serverSettings.General.MaxServerTickRate || 30);
      setMaxPing(config.serverSettings.General.MaxPing || 200);
    }
    if (config?.serverSettings && !localConfig) {
      setLocalConfig(JSON.parse(JSON.stringify(config.serverSettings)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (event?: React.MouseEvent) => {
    if (event) event.preventDefault();

    // Debug: logar valor real do input no DOM no clique
    setTimeout(() => {
      const val = maxPlayersRef.current ? maxPlayersRef.current.value : 'N/A';
              // console.log('[DEBUG] Valor do input no DOM no clique:', val);
    }, 0);

    if (!expandedSection) return;

    // Capturar o valor do campo diretamente do input
    const maxPlayersValue = maxPlayersRef.current ? Number(maxPlayersRef.current.value) : maxPlayers;
    // console.log('[handleSave] Valor capturado via ref para MaxPlayers:', maxPlayersValue);

    // console.log('[handleSave] Seção expandida:', expandedSection);
    // console.log('[handleSave] Estados locais dos campos:');
    // console.log('  serverName:', serverName);
    // console.log('  maxPlayers:', maxPlayersValue);
    // console.log('  serverDescription:', serverDescription);
    // console.log('  serverPassword:', serverPassword);
    // console.log('  serverBannerUrl:', serverBannerUrl);
    // console.log('  serverPlaystyle:', serverPlaystyle);
    // console.log('  welcomeMessage:', welcomeMessage);
    // console.log('  messageOfTheDay:', messageOfTheDay);
    // console.log('  messageOfTheDayCooldown:', messageOfTheDayCooldown);
    // console.log('  minServerTickRate:', minServerTickRate);
    // console.log('  maxServerTickRate:', maxServerTickRate);
    // console.log('  maxPing:', maxPing);
    // console.log('  serverPort:', serverPort);
    // console.log('  enableBattleye:', enableBattleye);

    // Buscar o appConfig para pegar o iniConfigPath
    let iniBasePath = '';
    if (window.electronAPI?.loadAppConfig) {
      const appConfig = await window.electronAPI.loadAppConfig();
      iniBasePath = appConfig?.iniConfigPath || '';
    }

    // console.log('[handleSave] Caminho da pasta .ini:', iniBasePath);

    let iniFile = '';
    let sectionData = {};

    switch (expandedSection) {
      case 'General':
        iniFile = 'ServerSettings.ini';
        sectionData = {
          ServerName: serverName,
          ServerDescription: serverDescription,
          ServerPassword: serverPassword,
          MaxPlayers: maxPlayersValue,
          ServerBannerUrl: serverBannerUrl,
          ServerPlaystyle: serverPlaystyle,
          WelcomeMessage: welcomeMessage,
          MessageOfTheDay: messageOfTheDay,
          MessageOfTheDayCooldown: messageOfTheDayCooldown,
          MinServerTickRate: minServerTickRate,
          MaxServerTickRate: maxServerTickRate,
          MaxPing: maxPing,
          ServerPort: serverPort,
          EnableBattleye: enableBattleye
        };
        break;
      case 'World':
        iniFile = 'GameUserSettings.ini';
        sectionData = localConfig.World;
        break;
      // Adicione outros cases conforme necessário
      default:
        return;
    }

    // console.log('[handleSave] Arquivo a ser salvo:', iniFile);
    // console.log('[handleSave] Dados a serem enviados:', sectionData);

    try {
      await window.electronAPI.saveIniFile(iniBasePath + '/' + iniFile, sectionData);
      showNotification('Configuração salva com sucesso!', 'success');
    } catch (error) {
      console.error('[handleSave] Erro ao salvar:', error);
      showNotification('Erro ao salvar configuração!', 'error');
    }
  };

  const handleReset = () => {
    if (config?.serverSettings) {
      setLocalConfig(JSON.parse(JSON.stringify(config.serverSettings)));
      setValidationErrors({});
      showNotification('Configurações restauradas', 'info');
    }
  };

  const updateConfig = (section: string, key: string, value: any) => {
    if (key === '') {
      setLocalConfig((prev: any) => ({ ...prev, [section]: value }));
    } else {
      setLocalConfig((prev: any) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      }));
    }
    // Nenhuma validação em tempo real aqui!
  };

  // No componente principal, criar handlers para cada campo:
  const handleServerNameChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setServerName(e.target.value);
  const handleServerDescriptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setServerDescription(e.target.value);
  const handleServerPasswordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setServerPassword(e.target.value);
  const handleMaxPlayersChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMaxPlayers(Number(e.target.value));
  const handleServerBannerUrlChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setServerBannerUrl(e.target.value);
  const handleServerPlaystyleChange = (e: SelectChangeEvent<string>) => setServerPlaystyle(e.target.value as string);
  const handleWelcomeMessageChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setWelcomeMessage(e.target.value);
  const handleMessageOfTheDayChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMessageOfTheDay(e.target.value);
  const handleMessageOfTheDayCooldownChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMessageOfTheDayCooldown(Number(e.target.value));
  const handleMinServerTickRateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMinServerTickRate(Number(e.target.value));
  const handleMaxServerTickRateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMaxServerTickRate(Number(e.target.value));
  const handleMaxPingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMaxPing(Number(e.target.value));
  const handleServerPortChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setServerPort(Number(e.target.value));
  const handleEnableBattleyeChange = (e: React.ChangeEvent<HTMLInputElement>) => setEnableBattleye(e.target.checked);

  if (!config) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Carregando configurações...
        </Typography>
      </Box>
    );
  }

  if (!localConfig) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          <SettingsIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Configurações do Servidor
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
            type="button"
            disabled={saving || loading || hasErrors}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </Box>
      </Box>

      {hasErrors && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1 }} />
            Existem {Object.keys(validationErrors).length} erro(s) de validação. Corrija-os antes de salvar.
          </Box>
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Edite todas as configurações do servidor SCUM. Todos os campos do arquivo .ini estão disponíveis.
      </Alert>
      <Grid container spacing={3}>
        {/* Renderizar cada seção dinamicamente */}
        {['General','World','Respawn','Vehicles','Damage','Features'].map(section => (
          <Grid item xs={12} key={section}>
            <Accordion defaultExpanded={section==='General'} expanded={expandedSection === section} onChange={() => setExpandedSection(expandedSection === section ? false : section)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{section}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {section === 'General' ? (
                  <GeneralSection
                    serverName={serverName}
                    onServerNameChange={handleServerNameChange}
                    serverDescription={serverDescription}
                    onServerDescriptionChange={handleServerDescriptionChange}
                    serverPassword={serverPassword}
                    onServerPasswordChange={handleServerPasswordChange}
                    maxPlayers={maxPlayers}
                    onMaxPlayersChange={handleMaxPlayersChange}
                    serverBannerUrl={serverBannerUrl}
                    onServerBannerUrlChange={handleServerBannerUrlChange}
                    serverPlaystyle={serverPlaystyle}
                    onServerPlaystyleChange={handleServerPlaystyleChange}
                    welcomeMessage={welcomeMessage}
                    onWelcomeMessageChange={handleWelcomeMessageChange}
                    messageOfTheDay={messageOfTheDay}
                    onMessageOfTheDayChange={handleMessageOfTheDayChange}
                    messageOfTheDayCooldown={messageOfTheDayCooldown}
                    onMessageOfTheDayCooldownChange={handleMessageOfTheDayCooldownChange}
                    minServerTickRate={minServerTickRate}
                    onMinServerTickRateChange={handleMinServerTickRateChange}
                    maxServerTickRate={maxServerTickRate}
                    onMaxServerTickRateChange={handleMaxServerTickRateChange}
                    maxPing={maxPing}
                    onMaxPingChange={handleMaxPingChange}
                    serverPort={serverPort}
                    onServerPortChange={handleServerPortChange}
                    enableBattleye={enableBattleye}
                    onEnableBattleyeChange={handleEnableBattleyeChange}
                  />
                ) : (
                  <>
                    {section === 'World' && <WorldSection initialData={localConfig.World} onSave={data => updateConfig('World', '', data)} />}
                    {section === 'Respawn' && <RespawnSection initialData={localConfig.Respawn} onSave={data => updateConfig('Respawn', '', data)} />}
                    {section === 'Vehicles' && <VehiclesSection initialData={localConfig.Vehicles} onSave={data => updateConfig('Vehicles', '', data)} />}
                    {section === 'Damage' && <DamageSection initialData={localConfig.Damage} onSave={data => updateConfig('Damage', '', data)} />}
                    {section === 'Features' && <FeaturesSection initialData={localConfig.Features} onSave={data => updateConfig('Features', '', data)} />}
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {/* Modal genérico para editar campos */}
      <EditFieldModal
        open={editModal.open}
        onClose={() => setEditModal(prev => ({ ...prev, open: false }))}
        initialValue={editModal.value}
        onSave={(value) => {
          updateConfig(editModal.section, editModal.key, value);
          setEditModal(prev => ({ ...prev, open: false }));
        }}
        fieldName={editModal.fieldName}
        multiline={editModal.multiline}
      />
    </Box>
  );
};

export default ServerSettings; 