import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Gamepad as GamepadIcon
} from '@mui/icons-material';
import { useServerConfig } from '../contexts/ServerConfigContext';

interface GameSettingsProps {
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

// Função utilitária para converter valores para boolean
function toBool(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') return val === '1' || val.toLowerCase() === 'true';
  return false;
}

const GameSettings: React.FC<GameSettingsProps> = ({ showNotification }) => {
  const { config, loading, saveConfig } = useServerConfig();
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (config?.gameSettings) {
      setLocalConfig(JSON.parse(JSON.stringify(config.gameSettings)));
    }
  }, [config]);

  const handleSave = async () => {
    if (!localConfig) return;
    try {
      setSaving(true);
      await saveConfig({ gameSettings: localConfig });
      showNotification('Configurações do jogo salvas com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao salvar configurações', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config?.gameSettings) {
      setLocalConfig(JSON.parse(JSON.stringify(config.gameSettings)));
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          <GamepadIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Configurações do Jogo
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
        Ajuste as configurações de interface, gráficos, áudio e controles do seu servidor SCUM.
      </Alert>

      <Grid container spacing={3}>
        {/* Interface */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Interface</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={toBool(localConfig.Game?.ShowAnnouncementMessages)}
                        onChange={(e) => updateConfig('Game', 'ShowAnnouncementMessages', e.target.checked)}
                      />
                    }
                    label="Mostrar Mensagens de Anúncio"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={toBool(localConfig.Game?.ShowChatTimestamps)}
                        onChange={(e) => updateConfig('Game', 'ShowChatTimestamps', e.target.checked)}
                      />
                    }
                    label="Mostrar Horário no Chat"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Idioma (0=Inglês, 1=Português, 2=Espanhol, etc)"
                    type="number"
                    value={localConfig.Game?.Language || 0}
                    onChange={(e) => updateConfig('Game', 'Language', parseInt(e.target.value))}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={toBool(localConfig.Game?.NudityCensoring)}
                        onChange={(e) => updateConfig('Game', 'NudityCensoring', e.target.checked)}
                      />
                    }
                    label="Censurar Nudez"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Gráficos */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Gráficos</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Gamma"
                    type="number"
                    value={localConfig.Video?.Gamma || 2.4}
                    onChange={(e) => updateConfig('Video', 'Gamma', parseFloat(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 1.0, max: 4.0, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="FOV Primeira Pessoa"
                    type="number"
                    value={localConfig.Video?.FirstPersonFOV || 70}
                    onChange={(e) => updateConfig('Video', 'FirstPersonFOV', parseInt(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 60, max: 120 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="FOV Terceira Pessoa"
                    type="number"
                    value={localConfig.Video?.ThirdPersonFOV || 70}
                    onChange={(e) => updateConfig('Video', 'ThirdPersonFOV', parseInt(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 60, max: 120 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Qualidade das Sombras"
                    type="number"
                    value={localConfig.Graphics?.ShadowQuality || 2}
                    onChange={(e) => updateConfig('Graphics', 'ShadowQuality', parseInt(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 0, max: 3 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Qualidade das Texturas"
                    type="number"
                    value={localConfig.Graphics?.TextureQuality || 2}
                    onChange={(e) => updateConfig('Graphics', 'TextureQuality', parseInt(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 0, max: 3 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Áudio */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Áudio</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Volume Master"
                    type="number"
                    value={localConfig.Sound?.MasterVolume || 100}
                    onChange={(e) => updateConfig('Sound', 'MasterVolume', parseInt(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Volume da Música"
                    type="number"
                    value={localConfig.Sound?.MusicVolume || 50}
                    onChange={(e) => updateConfig('Sound', 'MusicVolume', parseInt(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Volume dos Efeitos"
                    type="number"
                    value={localConfig.Sound?.EffectsVolume || 100}
                    onChange={(e) => updateConfig('Sound', 'EffectsVolume', parseInt(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Controles */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Controles</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Sensibilidade do Mouse (Primeira Pessoa)"
                    type="number"
                    value={localConfig.Mouse?.MouseSensitivityFP || 50}
                    onChange={(e) => updateConfig('Mouse', 'MouseSensitivityFP', parseInt(e.target.value))}
                    margin="normal"
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={toBool(localConfig.Mouse?.InvertMouseY)}
                        onChange={(e) => updateConfig('Mouse', 'InvertMouseY', e.target.checked)}
                      />
                    }
                    label="Inverter Eixo Y do Mouse"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GameSettings; 