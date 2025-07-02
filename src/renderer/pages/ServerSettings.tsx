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

interface GeneralSectionProps {
  initialGeneral: any;
  onSave: (general: any) => void;
}

const GeneralSection: React.FC<GeneralSectionProps> = memo(({ initialGeneral, onSave }) => {
  // Estados locais para todos os campos da seção General
  const [serverName, setServerName] = useState(initialGeneral.ServerName || '');
  const [serverDescription, setServerDescription] = useState(initialGeneral.ServerDescription || '');
  const [serverPassword, setServerPassword] = useState(initialGeneral.ServerPassword || '');
  const [maxPlayers, setMaxPlayers] = useState(initialGeneral.MaxPlayers || 64);
  const [serverBannerUrl, setServerBannerUrl] = useState(initialGeneral.ServerBannerUrl || '');
  const [serverPlaystyle, setServerPlaystyle] = useState(initialGeneral.ServerPlaystyle || 'PVE');
  const [welcomeMessage, setWelcomeMessage] = useState(initialGeneral.WelcomeMessage || '');
  const [messageOfTheDay, setMessageOfTheDay] = useState(initialGeneral.MessageOfTheDay || '');
  const [messageOfTheDayCooldown, setMessageOfTheDayCooldown] = useState(initialGeneral.MessageOfTheDayCooldown || 10);
  const [minServerTickRate, setMinServerTickRate] = useState(initialGeneral.MinServerTickRate || 5);
  const [maxServerTickRate, setMaxServerTickRate] = useState(initialGeneral.MaxServerTickRate || 30);
  const [maxPing, setMaxPing] = useState(initialGeneral.MaxPing || 200);
  const [serverPort, setServerPort] = useState(initialGeneral.ServerPort || 8900);
  const [enableBattleye, setEnableBattleye] = useState(initialGeneral.EnableBattleye !== undefined ? initialGeneral.EnableBattleye : true);

  // Atualizar estados locais se initialGeneral mudar (ex: reset)
  useEffect(() => {
    setServerName(initialGeneral.ServerName || '');
    setServerDescription(initialGeneral.ServerDescription || '');
    setServerPassword(initialGeneral.ServerPassword || '');
    setMaxPlayers(initialGeneral.MaxPlayers || 64);
    setServerBannerUrl(initialGeneral.ServerBannerUrl || '');
    setServerPlaystyle(initialGeneral.ServerPlaystyle || 'PVE');
    setWelcomeMessage(initialGeneral.WelcomeMessage || '');
    setMessageOfTheDay(initialGeneral.MessageOfTheDay || '');
    setMessageOfTheDayCooldown(initialGeneral.MessageOfTheDayCooldown || 10);
    setMinServerTickRate(initialGeneral.MinServerTickRate || 5);
    setMaxServerTickRate(initialGeneral.MaxServerTickRate || 30);
    setMaxPing(initialGeneral.MaxPing || 200);
    setServerPort(initialGeneral.ServerPort || 8900);
    setEnableBattleye(initialGeneral.EnableBattleye !== undefined ? initialGeneral.EnableBattleye : true);
  }, [initialGeneral]);

  // Função para salvar
  const handleSave = () => {
    onSave({
      ServerName: serverName,
      ServerDescription: serverDescription,
      ServerPassword: serverPassword,
      MaxPlayers: maxPlayers,
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
    });
  };

  // Campos otimizados
  const handleServerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setServerName(e.target.value), []);
  const handleServerDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setServerDescription(e.target.value), []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          label={ptBR.ServerName || 'Nome do Servidor'}
          fullWidth
          value={serverName}
          onChange={handleServerNameChange}
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={ptBR.ServerDescription || 'Descrição do Servidor'}
          fullWidth
          value={serverDescription}
          onChange={handleServerDescriptionChange}
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={ptBR.ServerPassword || 'Senha do Servidor'}
          fullWidth
          value={serverPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setServerPassword(e.target.value)}
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={ptBR.MaxPlayers || 'Máximo de Jogadores'}
          fullWidth
          type="number"
          value={maxPlayers}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMaxPlayers(Number(e.target.value))}
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={ptBR.ServerBannerUrl || 'URL do Banner do Servidor'}
          fullWidth
          value={serverBannerUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setServerBannerUrl(e.target.value)}
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Estilo de Jogo</InputLabel>
          <Select value={serverPlaystyle} onChange={e => setServerPlaystyle(e.target.value)} label="Estilo de Jogo">
            <MenuItem value="PVE">PVE</MenuItem>
            <MenuItem value="PVP">PVP</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={ptBR.WelcomeMessage || 'Mensagem de Boas-vindas'}
          fullWidth
          value={welcomeMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setWelcomeMessage(e.target.value)}
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={ptBR.MessageOfTheDay || 'Mensagem do Dia'}
          fullWidth
          value={messageOfTheDay}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMessageOfTheDay(e.target.value)}
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={ptBR.MessageOfTheDayCooldown || 'Intervalo da Mensagem do Dia'}
          fullWidth
          type="number"
          value={messageOfTheDayCooldown}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMessageOfTheDayCooldown(Number(e.target.value))}
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={ptBR.MinServerTickRate || 'Taxa Mínima de Tick do Servidor'}
          fullWidth
          type="number"
          value={minServerTickRate}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMinServerTickRate(Number(e.target.value))}
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={ptBR.MaxServerTickRate || 'Taxa Máxima de Tick do Servidor'}
          fullWidth
          type="number"
          value={maxServerTickRate}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMaxServerTickRate(Number(e.target.value))}
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={ptBR.MaxPing || 'Ping Máximo'}
          fullWidth
          type="number"
          value={maxPing}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMaxPing(Number(e.target.value))}
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label={ptBR['ServerPort'] || 'Porta do Servidor'}
          fullWidth
          type="number"
          value={serverPort}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setServerPort(Number(e.target.value))}
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControlLabel
          control={
            <Switch
              checked={enableBattleye}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnableBattleye(e.target.checked)}
            />
          }
          label={ptBR['EnableBattleye'] || 'Ativar Battleye'}
        />
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

  // Inicializar os estados locais a partir do config
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
    if (config?.serverSettings) {
      setLocalConfig(JSON.parse(JSON.stringify(config.serverSettings)));
    }
  }, [config]);

  const handleSave = async () => {
    if (!localConfig) return;

    const updatedConfig = { ...localConfig };
    if (!updatedConfig.General) updatedConfig.General = {};
    updatedConfig.General.ServerName = serverName;
    updatedConfig.General.ServerDescription = serverDescription;
    updatedConfig.General.ServerPassword = serverPassword;
    updatedConfig.General.MaxPlayers = maxPlayers;
    updatedConfig.General.ServerBannerUrl = serverBannerUrl;
    updatedConfig.General.ServerPlaystyle = serverPlaystyle;
    updatedConfig.General.WelcomeMessage = welcomeMessage;
    updatedConfig.General.MessageOfTheDay = messageOfTheDay;
    updatedConfig.General.MessageOfTheDayCooldown = messageOfTheDayCooldown;
    updatedConfig.General.MinServerTickRate = minServerTickRate;
    updatedConfig.General.MaxServerTickRate = maxServerTickRate;
    updatedConfig.General.MaxPing = maxPing;
    updatedConfig.General.ServerPort = serverPort;
    updatedConfig.General.EnableBattleye = enableBattleye;

    // Validar antes de salvar
    const errors: {[key: string]: string} = {};
    Object.keys(updatedConfig).forEach(section => {
      Object.keys(updatedConfig[section] || {}).forEach(key => {
        const validation = validateField(section, key, updatedConfig[section][key]);
        if (!validation.valid) {
          errors[`${section}.${key}`] = validation.message || 'Valor inválido';
        }
      });
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showNotification('Existem erros de validação. Corrija-os antes de salvar.', 'error');
      return;
    }

    try {
      setSaving(true);
      await saveConfig({ serverSettings: updatedConfig });
      showNotification('Configurações do servidor salvas com sucesso!', 'success');
      setValidationErrors({});
    } catch (error) {
      showNotification('Erro ao salvar configurações', 'error');
    } finally {
      setSaving(false);
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

  // No componente principal:
  const handleServerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setServerName(e.target.value), []);
  const handleServerDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setServerDescription(e.target.value), []);

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
            <Accordion defaultExpanded={section==='General'}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{section}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {section === 'General' ? (
                  <GeneralSection initialGeneral={localConfig.General} onSave={data => updateConfig('General', '', data)} />
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