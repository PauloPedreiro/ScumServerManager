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
  'A_0_Armory', 'A_0_BoatShop', 'A_0_Hospital', 'A_0_Mechanic', 'A_0_Saloon', 'A_0_Trader',
  'B_4_Armory', 'B_4_BoatShop', 'B_4_Hospital', 'B_4_Mechanic', 'B_4_Saloon', 'B_4_Trader',
  'C_2_Armory', 'C_2_BoatShop', 'C_2_Hospital', 'C_2_Mechanic', 'C_2_Saloon', 'C_2_Trader',
  'Z_3_Armory', 'Z_3_BoatShop', 'Z_3_Hospital', 'Z_3_Mechanic', 'Z_3_Saloon', 'Z_3_Trader'
];

const EconomySettings: React.FC<EconomySettingsProps> = ({ showNotification }) => {
  const { config, loading, saveConfig } = useServerConfig();
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState<string>('A_0_Armory');

  const mapTradeableItemFromJson = (item: any) => {
    return {
      tradeableCode: item['tradeable-code'] || '',
      basePurchasePrice: Number(item['base-purchase-price']) || 0,
      baseSellPrice: Number(item['base-sell-price']) || 0,
      deltaPrice: Number(item['delta-price']) || 0,
      canBePurchased: item['can-be-purchased'] || 'default',
      requiredFamepoints: Number(item['required-famepoints']) || 0,
    };
  };

  React.useEffect(() => {
    const eco = config?.economyConfig?.['economy-override'] || config?.['economy-override'];
    if (eco) {
      const economyConfig = JSON.parse(JSON.stringify(eco));
      if (economyConfig.traders) {
        Object.entries(economyConfig.traders).forEach(([trader, items]) => {
          if (Array.isArray(items)) {
            economyConfig.traders[trader] = items.map(mapTradeableItemFromJson);
          }
        });
      }
      setLocalConfig(economyConfig);
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
        basePurchasePrice: 0,
        baseSellPrice: 0,
        deltaPrice: 0,
        canBePurchased: 'default',
        requiredFamepoints: 0
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

  if (!localConfig.traders) {
    localConfig.traders = {};
  }
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
            label="Tempo de rotação dos itens (horas)"
            type="number"
            value={localConfig.tradeableRotationTimeIngameHoursMin || 48}
            onChange={(e) => updateConfig('tradeableRotationTimeIngameHoursMin', parseFloat(e.target.value))}
            margin="normal"
            inputProps={{ min: 1, max: 168 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tempo máximo de rotação dos itens (horas)"
            type="number"
            value={localConfig.tradeableRotationTimeIngameHoursMax || 96}
            onChange={(e) => updateConfig('tradeableRotationTimeIngameHoursMax', parseFloat(e.target.value))}
            margin="normal"
            inputProps={{ min: 1, max: 168 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Preço base do ouro"
            type="number"
            value={localConfig.goldBasePrice || 0}
            onChange={(e) => updateConfig('goldBasePrice', parseFloat(e.target.value))}
            margin="normal"
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Multiplicador global de preço do ouro"
            type="number"
            value={localConfig.goldPriceSubjectToGlobalMultiplier || 1}
            onChange={(e) => updateConfig('goldPriceSubjectToGlobalMultiplier', parseFloat(e.target.value))}
            margin="normal"
            inputProps={{ min: 0.1, step: 0.01 }}
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
                    value={item.tradeableCode}
                    onChange={e => updateTraderItem(selectedTrader, idx, 'tradeableCode', e.target.value)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={item.basePurchasePrice}
                    type="number"
                    onChange={e => updateTraderItem(selectedTrader, idx, 'basePurchasePrice', parseFloat(e.target.value))}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={item.baseSellPrice}
                    type="number"
                    onChange={e => updateTraderItem(selectedTrader, idx, 'baseSellPrice', parseFloat(e.target.value))}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={item.deltaPrice}
                    type="number"
                    onChange={e => updateTraderItem(selectedTrader, idx, 'deltaPrice', parseFloat(e.target.value))}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={item.requiredFamepoints}
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