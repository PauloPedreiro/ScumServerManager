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
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Casino as CasinoIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useServerConfig } from '../contexts/ServerConfigContext';

interface LootSettingsProps {
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

// Função utilitária para converter valores para boolean
function toBool(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') return val === '1' || val.toLowerCase() === 'true';
  return false;
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
      id={`loot-tabpanel-${index}`}
      aria-labelledby={`loot-tab-${index}`}
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

const LootSettings: React.FC<LootSettingsProps> = ({ showNotification }) => {
  const { config, loading, saveConfig } = useServerConfig();
  const [localLoot, setLocalLoot] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const lootCategories = [
    { key: 'general', label: 'Configurações Gerais', icon: <SettingsIcon /> },
    { key: 'spawns', label: 'Spawns de Loot', icon: <LocationIcon /> },
    { key: 'probabilities', label: 'Probabilidades', icon: <CasinoIcon /> },
    { key: 'categories', label: 'Categorias de Loot', icon: <InventoryIcon /> }
  ];

  React.useEffect(() => {
    if (config?.loot) {
      setLocalLoot(JSON.parse(JSON.stringify(config.loot)));
    }
  }, [config]);

  const handleSave = async () => {
    if (!localLoot) return;
    try {
      setSaving(true);
      await saveConfig({ loot: localLoot });
      showNotification('Configurações de loot salvas com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao salvar configurações de loot', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config?.loot) {
      setLocalLoot(JSON.parse(JSON.stringify(config.loot)));
      showNotification('Configurações de loot restauradas', 'info');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const updateLootSetting = (path: string, value: any) => {
    setLocalLoot((prev: any) => {
      const newLoot = { ...prev };
      const keys = path.split('.');
      let current = newLoot;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newLoot;
    });
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

  if (!localLoot) {
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
          <InventoryIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Configurações de Loot
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
        Configure as configurações de loot do seu servidor SCUM, incluindo spawns, probabilidades e categorias de itens.
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="loot settings tabs">
          {lootCategories.map((category, index) => (
            <Tab
              key={category.key}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {category.icon}
                  {category.label}
                </Box>
              }
              {...a11yProps(index)}
            />
          ))}
        </Tabs>
      </Box>

      {/* General Settings Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurações Básicas
                </Typography>
                
                <TextField
                  fullWidth
                  label="Multiplicador de Loot"
                  type="number"
                  value={localLoot.general?.multiplier || 1}
                  onChange={(e) => updateLootSetting('general.multiplier', parseFloat(e.target.value) || 1)}
                  margin="normal"
                  inputProps={{ min: 0.1, max: 10, step: 0.1 }}
                />

                <TextField
                  fullWidth
                  label="Intervalo de Respawn (minutos)"
                  type="number"
                  value={localLoot.general?.respawnInterval || 30}
                  onChange={(e) => updateLootSetting('general.respawnInterval', parseInt(e.target.value) || 30)}
                  margin="normal"
                  inputProps={{ min: 5, max: 1440 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={toBool(localLoot.general?.enableLootSpawns)}
                      onChange={(e) => updateLootSetting('general.enableLootSpawns', e.target.checked)}
                    />
                  }
                  label="Habilitar Spawns de Loot"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={toBool(localLoot.general?.enableRareLoot)}
                      onChange={(e) => updateLootSetting('general.enableRareLoot', e.target.checked)}
                    />
                  }
                  label="Habilitar Loot Raro"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurações Avançadas
                </Typography>

                <Typography gutterBottom>
                  Probabilidade de Spawn (%)
                </Typography>
                <Slider
                  value={localLoot.general?.spawnChance || 50}
                  onChange={(_, value) => updateLootSetting('general.spawnChance', value)}
                  min={0}
                  max={100}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 50, label: '50%' },
                    { value: 100, label: '100%' }
                  ]}
                  valueLabelDisplay="auto"
                />

                <Typography gutterBottom sx={{ mt: 2 }}>
                  Qualidade do Loot
                </Typography>
                <Slider
                  value={localLoot.general?.lootQuality || 50}
                  onChange={(_, value) => updateLootSetting('general.lootQuality', value)}
                  min={0}
                  max={100}
                  marks={[
                    { value: 0, label: 'Ruim' },
                    { value: 50, label: 'Média' },
                    { value: 100, label: 'Excelente' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Spawns Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurações de Spawn
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Máximo de Itens por Spawn"
                      type="number"
                      value={localLoot.spawns?.maxItemsPerSpawn || 10}
                      onChange={(e) => updateLootSetting('spawns.maxItemsPerSpawn', parseInt(e.target.value) || 10)}
                      margin="normal"
                      inputProps={{ min: 1, max: 50 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Raio de Spawn (metros)"
                      type="number"
                      value={localLoot.spawns?.spawnRadius || 100}
                      onChange={(e) => updateLootSetting('spawns.spawnRadius', parseInt(e.target.value) || 100)}
                      margin="normal"
                      inputProps={{ min: 10, max: 1000 }}
                    />
                  </Grid>
                </Grid>

                <FormControlLabel
                  control={
                    <Switch
                      checked={toBool(localLoot.spawns?.enableRandomSpawns)}
                      onChange={(e) => updateLootSetting('spawns.enableRandomSpawns', e.target.checked)}
                    />
                  }
                  label="Habilitar Spawns Aleatórios"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={toBool(localLoot.spawns?.enableFixedSpawns)}
                      onChange={(e) => updateLootSetting('spawns.enableFixedSpawns', e.target.checked)}
                    />
                  }
                  label="Habilitar Spawns Fixos"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Probabilities Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Probabilidades por Categoria
                </Typography>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Armas</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      label="Probabilidade de Armas (%)"
                      type="number"
                      value={localLoot.probabilities?.weapons || 15}
                      onChange={(e) => updateLootSetting('probabilities.weapons', parseInt(e.target.value) || 15)}
                      margin="normal"
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Munição</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      label="Probabilidade de Munição (%)"
                      type="number"
                      value={localLoot.probabilities?.ammo || 25}
                      onChange={(e) => updateLootSetting('probabilities.ammo', parseInt(e.target.value) || 25)}
                      margin="normal"
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Comida</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      label="Probabilidade de Comida (%)"
                      type="number"
                      value={localLoot.probabilities?.food || 30}
                      onChange={(e) => updateLootSetting('probabilities.food', parseInt(e.target.value) || 30)}
                      margin="normal"
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Probabilidades Especiais
                </Typography>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Itens Raros</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      label="Probabilidade de Itens Raros (%)"
                      type="number"
                      value={localLoot.probabilities?.rareItems || 5}
                      onChange={(e) => updateLootSetting('probabilities.rareItems', parseInt(e.target.value) || 5)}
                      margin="normal"
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Itens Lendários</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      label="Probabilidade de Itens Lendários (%)"
                      type="number"
                      value={localLoot.probabilities?.legendaryItems || 1}
                      onChange={(e) => updateLootSetting('probabilities.legendaryItems', parseInt(e.target.value) || 1)}
                      margin="normal"
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Itens de Craft</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      label="Probabilidade de Itens de Craft (%)"
                      type="number"
                      value={localLoot.probabilities?.craftItems || 20}
                      onChange={(e) => updateLootSetting('probabilities.craftItems', parseInt(e.target.value) || 20)}
                      margin="normal"
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Categories Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Categorias de Loot Disponíveis
                </Typography>
                
                <Grid container spacing={2}>
                  {['weapons', 'ammo', 'food', 'medical', 'tools', 'clothing', 'building', 'vehicles'].map((category) => (
                    <Grid item xs={12} sm={6} md={3} key={category}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={toBool(localLoot.categories?.[category]?.enabled)}
                            onChange={(e) => updateLootSetting(`categories.${category}.enabled`, e.target.checked)}
                          />
                        }
                        label={category.charAt(0).toUpperCase() + category.slice(1)}
                      />
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Configurações Especiais por Categoria
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Multiplicador de Armas"
                      type="number"
                      value={localLoot.categories?.weapons?.multiplier || 1}
                      onChange={(e) => updateLootSetting('categories.weapons.multiplier', parseFloat(e.target.value) || 1)}
                      margin="normal"
                      inputProps={{ min: 0.1, max: 5, step: 0.1 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Multiplicador de Munição"
                      type="number"
                      value={localLoot.categories?.ammo?.multiplier || 1}
                      onChange={(e) => updateLootSetting('categories.ammo.multiplier', parseFloat(e.target.value) || 1)}
                      margin="normal"
                      inputProps={{ min: 0.1, max: 5, step: 0.1 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Information Box */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Informações sobre Configurações de Loot
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Multiplicador de Loot:</strong> Aumenta ou diminui a quantidade de itens que spawnam
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Intervalo de Respawn:</strong> Tempo em minutos para os itens respawnarem
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Probabilidade de Spawn:</strong> Chance de um item aparecer em um local
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Qualidade do Loot:</strong> Afeta a condição dos itens que spawnam
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Spawns Aleatórios:</strong> Itens aparecem em locais aleatórios
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Spawns Fixos:</strong> Itens aparecem em locais específicos
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

function a11yProps(index: number) {
  return {
    id: `loot-tab-${index}`,
    'aria-controls': `loot-tabpanel-${index}`,
  };
}

export default LootSettings; 