import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  AttachMoney as EconomyIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useServerConfig } from '../contexts/ServerConfigContext';

interface EconomySettingsProps {
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

const traderKeys = [
  'A_0_Armory', 'A_0_BoatShop', 'A_0_Hospital', 'A_0_Mechanic', 'A_0_Saloon', 'A_0_Trader', 'A_0_Barber',
  'B_4_Armory', 'B_4_BoatShop', 'B_4_Hospital', 'B_4_Mechanic', 'B_4_Saloon', 'B_4_Trader', 'B_4_Barber',
  'C_2_Armory', 'C_2_BoatShop', 'C_2_Hospital', 'C_2_Mechanic', 'C_2_Saloon', 'C_2_Trader', 'C_2_Barber',
  'Z_3_Armory', 'Z_3_BoatShop', 'Z_3_Hospital', 'Z_3_Mechanic', 'Z_3_Saloon', 'Z_3_Trader', 'Z_3_Barber'
];

const EconomySettings: React.FC<EconomySettingsProps> = ({ showNotification }) => {
  const { config, loading, saveConfig, serverPath, loadServerCache } = useServerConfig();
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState<string>('A_0_Armory');

  // Carregar cache do servidor se não houver config
  React.useEffect(() => {
    if (!config && !loading) {
      loadServerCache();
    }
  }, [config, loading, loadServerCache]);

  // Processar configuração de economia apenas quando config mudar
  React.useEffect(() => {
    if (!config) return;
    
    // Tentar obter a configuração de economia de diferentes locais
    let eco = config?.economyConfig?.['economy-override'] || 
              config?.economyConfig || 
              (config as any)?.['economy-override'];
    
    if (eco && Object.keys(eco).length > 0) {
      // Se temos dados de economia, usar diretamente
      setLocalConfig(JSON.parse(JSON.stringify(eco)));
      console.log('Configuração de economia carregada:', eco);
    } else {
      // Se não há configuração de economia, criar uma padrão
      const defaultConfig: any = {
        'economy-reset-time-hours': '-1.0',
        'prices-randomization-time-hours': '-1.0',
        'tradeable-rotation-time-ingame-hours-min': '48.0',
        'tradeable-rotation-time-ingame-hours-max': '96.0',
        'tradeable-rotation-time-of-day-min': '8.0',
        'tradeable-rotation-time-of-day-max': '16.0',
        'fully-restock-tradeable-hours': '2.0',
        'trader-funds-change-rate-per-hour-multiplier': '1.0',
        'prices-subject-to-player-count': '0',
        'gold-price-subject-to-global-multiplier': '1',
        'gold-base-price': '-1',
        'gold-sale-price-modifier': '-1.0',
        'gold-price-change-percentage-step': '-1.0',
        'gold-price-change-per-step': '-1.0',
        'economy-logging': '1',
        'traders-unlimited-funds': '1',
        'traders-unlimited-stock': '1',
        'only-after-player-sale-tradeable-availability-enabled': '1',
        'tradeable-rotation-enabled': '1',
        'enable-fame-point-requirement': '1',
        traders: {}
      };
      
      // Inicializar todos os traders vazios
      traderKeys.forEach(key => {
        defaultConfig.traders[key] = [];
      });
      
      setLocalConfig(defaultConfig);
      console.log('Configuração de economia padrão criada');
    }
  }, [config]);

  const handleSave = async () => {
    if (!localConfig) return;
    try {
      setSaving(true);
      await saveConfig({ economyConfig: localConfig });
      showNotification('Configurações de economia salvas com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao salvar configurações', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config?.economyConfig) {
      setLocalConfig(JSON.parse(JSON.stringify(config.economyConfig)));
      showNotification('Configurações restauradas', 'info');
    }
  };

  const updateConfig = (key: string, value: any) => {
    setLocalConfig((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const updateTraderItem = (trader: string, idx: number, field: string, value: any) => {
    setLocalConfig((prev: any) => {
      const updated = { ...prev };
      updated.traders[trader][idx][field] = value;
      return updated;
    });
  };

  const addTraderItem = (trader: string) => {
    setLocalConfig((prev: any) => {
      const updated = { ...prev };
      if (!updated.traders[trader]) updated.traders[trader] = [];
      updated.traders[trader].push({
        tradeableCode: '',
        basePurchasePrice: -1,
        baseSellPrice: -1,
        deltaPrice: -1,
        canBePurchased: 'true',
        requiredFamepoints: -1
      });
      return updated;
    });
  };

  const removeTraderItem = (trader: string, idx: number) => {
    setLocalConfig((prev: any) => {
      const updated = { ...prev };
      updated.traders[trader].splice(idx, 1);
      return updated;
    });
  };

  if (!config) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Carregando configurações...
        </Typography>
        <CircularProgress sx={{ mt: 2 }} />
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

  // Garantir que traders existe
  if (!localConfig.traders) {
    localConfig.traders = {};
  }
  
  // Inicializar traders vazios se não existirem
  traderKeys.forEach(key => {
    if (!localConfig.traders[key]) {
      localConfig.traders[key] = [];
    }
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          <EconomyIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Economia
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
        Configure preços, rotação de itens e traders do seu servidor SCUM.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tempo de rotação dos itens (horas) - Mínimo"
            type="number"
            value={localConfig['tradeable-rotation-time-ingame-hours-min'] || '48.0'}
            onChange={(e) => updateConfig('tradeable-rotation-time-ingame-hours-min', e.target.value)}
            margin="normal"
            inputProps={{ min: 1, max: 168, step: 0.1 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tempo de rotação dos itens (horas) - Máximo"
            type="number"
            value={localConfig['tradeable-rotation-time-ingame-hours-max'] || '96.0'}
            onChange={(e) => updateConfig('tradeable-rotation-time-ingame-hours-max', e.target.value)}
            margin="normal"
            inputProps={{ min: 1, max: 168, step: 0.1 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Preço base do ouro"
            type="number"
            value={localConfig['gold-base-price'] || '-1'}
            onChange={(e) => updateConfig('gold-base-price', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Multiplicador global de preço do ouro"
            type="number"
            value={localConfig['gold-price-subject-to-global-multiplier'] || '1'}
            onChange={(e) => updateConfig('gold-price-subject-to-global-multiplier', e.target.value)}
            margin="normal"
            inputProps={{ min: 0.1, step: 0.01 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tempo de reset da economia (horas)"
            type="number"
            value={localConfig['economy-reset-time-hours'] || '-1.0'}
            onChange={(e) => updateConfig('economy-reset-time-hours', e.target.value)}
            margin="normal"
            inputProps={{ step: 0.1 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tempo de randomização de preços (horas)"
            type="number"
            value={localConfig['prices-randomization-time-hours'] || '-1.0'}
            onChange={(e) => updateConfig('prices-randomization-time-hours', e.target.value)}
            margin="normal"
            inputProps={{ step: 0.1 }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" sx={{ mb: 2 }}>Traders</Typography>
      <FormControl sx={{ mb: 2, minWidth: 220 }}>
        <InputLabel>Trader</InputLabel>
        <Select
          value={selectedTrader}
          label="Trader"
          onChange={(e) => setSelectedTrader(e.target.value)}
        >
          {traderKeys.map((key) => (
            <MenuItem key={key} value={key}>{key}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Preço Compra</TableCell>
              <TableCell>Preço Venda</TableCell>
              <TableCell>Delta</TableCell>
              <TableCell>Fama</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(localConfig.traders[selectedTrader] || []).map((item: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell>
                  <TextField
                    value={item.tradeableCode || ''}
                    onChange={e => updateTraderItem(selectedTrader, idx, 'tradeableCode', e.target.value)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={item.basePurchasePrice || -1}
                    type="number"
                    onChange={e => updateTraderItem(selectedTrader, idx, 'basePurchasePrice', parseInt(e.target.value))}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={item.baseSellPrice || -1}
                    type="number"
                    onChange={e => updateTraderItem(selectedTrader, idx, 'baseSellPrice', parseInt(e.target.value))}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={item.deltaPrice || -1}
                    type="number"
                    onChange={e => updateTraderItem(selectedTrader, idx, 'deltaPrice', parseInt(e.target.value))}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={item.requiredFamepoints || -1}
                    type="number"
                    onChange={e => updateTraderItem(selectedTrader, idx, 'requiredFamepoints', parseInt(e.target.value))}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton color="error" onClick={() => removeTraderItem(selectedTrader, idx)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Button startIcon={<AddIcon />} onClick={() => addTraderItem(selectedTrader)}>
                  Adicionar Item
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EconomySettings; 