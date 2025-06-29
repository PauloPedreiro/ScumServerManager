import React, { useState } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useServerConfig } from '../contexts/ServerConfigContext';

interface RaidSettingsProps {
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

const dayOptions = [
  'Weekdays',
  'Weekend',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
  'Monday-Wednesday',
  'Monday,Wednesday,Friday'
];

const RaidSettings: React.FC<RaidSettingsProps> = ({ showNotification }) => {
  const { config, loading, saveConfig } = useServerConfig();
  const [localRaidTimes, setLocalRaidTimes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (config?.raidTimes) {
      setLocalRaidTimes(JSON.parse(JSON.stringify(config.raidTimes)));
    }
  }, [config]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveConfig({ raidTimes: localRaidTimes });
      showNotification('Horários de raid salvos com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao salvar horários de raid', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config?.raidTimes) {
      setLocalRaidTimes(JSON.parse(JSON.stringify(config.raidTimes)));
      showNotification('Horários restaurados', 'info');
    }
  };

  const addRaidTime = () => {
    setLocalRaidTimes(prev => [...prev, {
      day: 'Weekdays',
      time: '17:00-19:00',
      startAnnouncementTime: '30',
      endAnnouncementTime: '30'
    }]);
  };

  const removeRaidTime = (index: number) => {
    setLocalRaidTimes(prev => prev.filter((_, i) => i !== index));
  };

  const updateRaidTime = (index: number, field: string, value: string) => {
    setLocalRaidTimes(prev => prev.map((raid, i) => 
      i === index ? { ...raid, [field]: value } : raid
    ));
  };

  const validateTimeFormat = (time: string) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          <SecurityIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Horários de Raid
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
        Configure os horários permitidos para raids no seu servidor SCUM. 
        Use o formato HH:MM-HH:MM para os horários (ex: 17:00-19:00).
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addRaidTime}
          sx={{ mb: 2 }}
        >
          Adicionar Horário de Raid
        </Button>
      </Box>

      <Grid container spacing={3}>
        {localRaidTimes.map((raid, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Raid #{index + 1}
                  </Typography>
                  <IconButton
                    color="error"
                    onClick={() => removeRaidTime(index)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Dia da Semana</InputLabel>
                      <Select
                        value={raid.day}
                        label="Dia da Semana"
                        onChange={(e) => updateRaidTime(index, 'day', e.target.value)}
                      >
                        {dayOptions.map((day) => (
                          <MenuItem key={day} value={day}>{day}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Horário (HH:MM-HH:MM)"
                      value={raid.time}
                      onChange={(e) => updateRaidTime(index, 'time', e.target.value)}
                      error={!validateTimeFormat(raid.time)}
                      helperText={!validateTimeFormat(raid.time) ? 'Formato inválido. Use HH:MM-HH:MM' : ''}
                      placeholder="17:00-19:00"
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Anúncio Início (min)"
                      type="number"
                      value={raid.startAnnouncementTime}
                      onChange={(e) => updateRaidTime(index, 'startAnnouncementTime', e.target.value)}
                      inputProps={{ min: 0, max: 60 }}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Anúncio Fim (min)"
                      type="number"
                      value={raid.endAnnouncementTime}
                      onChange={(e) => updateRaidTime(index, 'endAnnouncementTime', e.target.value)}
                      inputProps={{ min: 0, max: 60 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`Dia: ${raid.day}`} 
                        color="primary" 
                        variant="outlined" 
                        size="small" 
                      />
                      <Chip 
                        label={`Horário: ${raid.time}`} 
                        color="secondary" 
                        variant="outlined" 
                        size="small" 
                      />
                      <Chip 
                        label={`Anúncios: ${raid.startAnnouncementTime}/${raid.endAnnouncementTime}min`} 
                        color="info" 
                        variant="outlined" 
                        size="small" 
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {localRaidTimes.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum horário de raid configurado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Clique em "Adicionar Horário de Raid" para começar
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Informações sobre Horários de Raid
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          • <strong>Weekdays:</strong> Segunda a Sexta-feira
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          • <strong>Weekend:</strong> Sábado e Domingo
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          • <strong>Formato de Horário:</strong> Use HH:MM-HH:MM (ex: 17:00-19:00)
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          • <strong>Anúncios:</strong> Tempo em minutos antes do início/fim do raid
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>Múltiplos Horários:</strong> Você pode configurar vários horários para o mesmo dia
        </Typography>
      </Box>
    </Box>
  );
};

export default RaidSettings; 