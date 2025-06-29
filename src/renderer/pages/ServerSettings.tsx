import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useServerConfig } from '../contexts/ServerConfigContext';
import ptBR from '../locales/ptBR';

interface ServerSettingsProps {
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

// Função utilitária para converter valores para boolean
function toBool(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') return val === '1' || val.toLowerCase() === 'true';
  return false;
}

// Função para validar configurações em tempo real
function validateField(section: string, key: string, value: any): { valid: boolean; message?: string } {
  switch (key) {
    case 'ServerName':
      if (!value || value.trim().length === 0) {
        return { valid: false, message: 'Nome do servidor é obrigatório' };
      }
      if (value.length > 100) {
        return { valid: false, message: 'Nome muito longo (máx. 100 caracteres)' };
      }
      break;
    case 'MaxPlayers':
      if (value < 1 || value > 100) {
        return { valid: false, message: 'Máximo de jogadores deve estar entre 1 e 100' };
      }
      break;
    case 'RandomRespawnPrice':
    case 'SectorRespawnPrice':
      if (value < 0) {
        return { valid: false, message: 'Preço não pode ser negativo' };
      }
      break;
    case 'TimeOfDaySpeed':
      if (value < 0.1 || value > 10) {
        return { valid: false, message: 'Velocidade deve estar entre 0.1x e 10x' };
      }
      break;
  }
  return { valid: true };
}

// Função utilitária para campos booleanos
function isBooleanField(section: string, key: string) {
  // Lista de campos booleanos (0/1) por seção
  const boolFields: Record<string, string[]> = {
    General: [
      'AllowFirstPerson','AllowThirdPerson','AllowCrosshair','AllowVoting','AllowMapScreen','AllowKillClaiming','AllowComa','AllowMinesAndTraps','AllowSkillGainInSafeZones','AllowEvents','LimitGlobalChat','AllowGlobalChat','AllowLocalChat','AllowSquadChat','AllowAdminChat','RustyLocksLogging','HideKillNotification','DisableTimedGifts','UseMapBaseBuildingRestriction','DisableBaseBuilding','PartialWipe','GoldWipe','FullWipe','LogSuicides','EnableSpawnOnGround','DeleteInactiveUsers','DeleteBannedUsers','LogChestOwnership','MasterServerIsLocalTest'
    ],
    World: [
      'EnableDropshipAbandonedBunkerEncounter','EnableDropshipBaseBuildingEncounter','SpawnEncountersInThreatZonesIgnoringBaseBuilding','EnableEncounterManagerLowPlayerCountMode','EncounterCanRemoveLowPriorityCharacters','EncounterCanClampCharacterNumWhenOutOfResources','EnableSentryRespawning','EnableLockedLootContainers','CustomMapEnabled','EnableDropshipAbandonedBunkerEncounter','EnableDropshipBaseBuildingEncounter','EnableEncounterManagerLowPlayerCountMode','EncounterCanRemoveLowPriorityCharacters','EncounterCanClampCharacterNumWhenOutOfResources','EnableSentryRespawning','EnableLockedLootContainers','CustomMapEnabled','EnableSpawnOnGround','EnableItemCooldownGroups','EnableSquadMemberNameWidget','EnableBCULocking','EnableNewPlayerProtection','EnableDeenaOnServer','EnableDigitalDeluxeStarterPack'
    ],
    Respawn: [
      'AllowSectorRespawn','AllowShelterRespawn','AllowSquadmateRespawn'
    ],
    Vehicles: [],
    Damage: [],
    Features: [
      'AllowMultipleFlagsPerPlayer','AllowFlagPlacementOnBBElements','AllowFloorPlacementOnHalfAndLowWalls','AllowWallPlacementOnHalfAndLowWalls','RaidProtectionGlobalShouldShowRaidTimesMessage','RaidProtectionGlobalShouldShowRaidAnnouncementMessage','RaidProtectionGlobalShouldShowRaidStartEndMessages','EnableItemCooldownGroups','EnableSquadMemberNameWidget','EnableBCULocking','EnableNewPlayerProtection','EnableDeenaOnServer','EnableDigitalDeluxeStarterPack'
    ]
  };
  return boolFields[section]?.includes(key);
}

// Função para renderizar campos dinamicamente
function renderField(section: string, key: string, value: any, updateConfig: any) {
  const label = ptBR[key] || key;
  if (key === 'ServerPlaystyle') {
    return (
      <Grid item xs={12} md={6} key={key}>
        <FormControl fullWidth margin="normal">
          <InputLabel>{label}</InputLabel>
          <Select
            value={value}
            label={label}
            onChange={e => updateConfig(section, key, e.target.value)}
          >
            <MenuItem value="PVE">PVE</MenuItem>
            <MenuItem value="PVP">PVP</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    );
  }
  if (isBooleanField(section, key)) {
    return (
      <Grid item xs={12} md={6} key={key}>
        <FormControlLabel
          control={
            <Switch
              checked={value === 1 || value === true || value === '1'}
              onChange={e => updateConfig(section, key, e.target.checked ? 1 : 0)}
            />
          }
          label={label}
        />
      </Grid>
    );
  }
  // Campo numérico
  if (!isNaN(Number(value)) && value !== '' && value !== null) {
    return (
      <Grid item xs={12} md={6} key={key}>
        <TextField
          fullWidth
          label={label}
          type="number"
          value={value}
          onChange={e => updateConfig(section, key, e.target.value === '' ? '' : Number(e.target.value))}
          margin="normal"
        />
      </Grid>
    );
  }
  // Campo texto
  return (
    <Grid item xs={12} md={6} key={key}>
      <TextField
        fullWidth
        label={label}
        value={value}
        onChange={e => updateConfig(section, key, e.target.value)}
        margin="normal"
      />
    </Grid>
  );
}

const ServerSettings: React.FC<ServerSettingsProps> = ({ showNotification }) => {
  const { config, loading, saveConfig } = useServerConfig();
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Presets de configuração rápida
  const configPresets = {
    pve: {
      name: 'PVE - Jogador vs Ambiente',
      description: 'Configurações otimizadas para servidor PVE focado em sobrevivência e exploração',
      config: {
        General: {
          ServerPlaystyle: 'PVE',
          AllowKillClaiming: false,
          FamePointPenaltyOnKilled: 0.1,
          FamePointRewardOnKill: 0.0,
          AllowMinesAndTraps: false,
          AllowSkillGainInSafeZones: true
        },
        Respawn: {
          AllowSectorRespawn: true,
          AllowShelterRespawn: true,
          RandomRespawnPrice: 100,
          SectorRespawnPrice: 500
        }
      }
    },
    pvp: {
      name: 'PVP - Jogador vs Jogador',
      description: 'Configurações otimizadas para servidor PVP competitivo',
      config: {
        General: {
          ServerPlaystyle: 'PVP',
          AllowKillClaiming: true,
          FamePointPenaltyOnKilled: 0.5,
          FamePointRewardOnKill: 0.25,
          AllowMinesAndTraps: true,
          AllowSkillGainInSafeZones: false
        },
        Respawn: {
          AllowSectorRespawn: true,
          AllowShelterRespawn: false,
          RandomRespawnPrice: 250,
          SectorRespawnPrice: 1000
        }
      }
    },
    hardcore: {
      name: 'Hardcore - Modo Difícil',
      description: 'Configurações para servidor hardcore com penalidades severas',
      config: {
        General: {
          ServerPlaystyle: 'PVP',
          FamePointPenaltyOnDeath: 0.3,
          FamePointPenaltyOnKilled: 0.8,
          FamePointRewardOnKill: 0.5,
          AllowComa: false,
          AllowSkillGainInSafeZones: false
        },
        Respawn: {
          AllowSectorRespawn: false,
          AllowShelterRespawn: false,
          RandomRespawnPrice: 500,
          PermadeathThreshold: -1000
        },
        World: {
          PuppetHealthMultiplier: 2.0,
          ArmedNPCDifficultyLevel: 4
        }
      }
    },
    casual: {
      name: 'Casual - Modo Relaxado',
      description: 'Configurações para servidor casual com penalidades reduzidas',
      config: {
        General: {
          ServerPlaystyle: 'PVE',
          FamePointPenaltyOnDeath: 0.05,
          FamePointPenaltyOnKilled: 0.1,
          FamePointRewardOnKill: 0.1,
          AllowComa: true,
          AllowSkillGainInSafeZones: true
        },
        Respawn: {
          AllowSectorRespawn: true,
          AllowShelterRespawn: true,
          RandomRespawnPrice: 50,
          SectorRespawnPrice: 200
        },
        World: {
          PuppetHealthMultiplier: 0.5,
          ArmedNPCDifficultyLevel: 1
        }
      }
    }
  };

  const applyPreset = (presetKey: string) => {
    const preset = configPresets[presetKey as keyof typeof configPresets];
    if (!preset || !localConfig) return;

    const newConfig = { ...localConfig };
    
    // Aplicar configurações do preset
    Object.keys(preset.config).forEach(section => {
      newConfig[section] = {
        ...newConfig[section],
        ...preset.config[section as keyof typeof preset.config]
      };
    });

    setLocalConfig(newConfig);
    setValidationErrors({});
    showNotification(`Preset "${preset.name}" aplicado com sucesso!`, 'success');
  };

  React.useEffect(() => {
    if (config?.serverSettings) {
      setLocalConfig(JSON.parse(JSON.stringify(config.serverSettings)));
    }
  }, [config]);

  const handleSave = async () => {
    if (!localConfig) return;

    // Validar antes de salvar
    const errors: {[key: string]: string} = {};
    Object.keys(localConfig).forEach(section => {
      Object.keys(localConfig[section] || {}).forEach(key => {
        const validation = validateField(section, key, localConfig[section][key]);
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
      await saveConfig({ serverSettings: localConfig });
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
    setLocalConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));

    // Validar em tempo real
    const validation = validateField(section, key, value);
    if (validation.valid) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${section}.${key}`];
        return newErrors;
      });
    } else {
      setValidationErrors(prev => ({
        ...prev,
        [`${section}.${key}`]: validation.message || 'Valor inválido'
      }));
    }
  };

  const getFieldError = (section: string, key: string) => {
    return validationErrors[`${section}.${key}`];
  };

  const renderTextField = (
    section: string, 
    key: string, 
    label: string, 
    type: string = 'text',
    helperText?: string,
    tooltip?: string,
    inputProps?: any
  ) => {
    const error = getFieldError(section, key);
    const value = localConfig?.[section]?.[key] || '';
    
    return (
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={label}
          type={type}
          value={value}
          onChange={(e) => updateConfig(section, key, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
          margin="normal"
          error={!!error}
          helperText={error || helperText}
          InputProps={{
            ...inputProps,
            endAdornment: tooltip ? (
              <InputAdornment position="end">
                <Tooltip title={tooltip} arrow>
                  <IconButton size="small">
                    <HelpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : inputProps?.endAdornment
          }}
          inputProps={inputProps}
        />
      </Grid>
    );
  };

  const renderSwitch = (section: string, key: string, label: string, tooltip?: string) => {
    const checked = toBool(localConfig?.[section]?.[key]);
    
    return (
      <Grid item xs={12} md={6}>
        <FormControlLabel
          control={
            <Switch
              checked={checked}
              onChange={(e) => updateConfig(section, key, e.target.checked)}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {label}
              {tooltip && (
                <Tooltip title={tooltip} arrow>
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <HelpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          }
        />
      </Grid>
    );
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
                <Grid container spacing={3}>
                  {localConfig?.[section] && Object.keys(localConfig[section]).map(key =>
                    renderField(section, key, localConfig[section][key], updateConfig)
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ServerSettings; 