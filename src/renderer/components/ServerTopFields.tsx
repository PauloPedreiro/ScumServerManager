import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';


interface ServerTopFieldsProps {
  serverPort: number;
  enableBattleye: boolean;
  onSave: (serverPort: number, enableBattleye: boolean) => void;
}

const ServerTopFields = React.memo<ServerTopFieldsProps>(({ 
  serverPort: initialServerPort, 
  enableBattleye: initialEnableBattleye, 
  onSave 
}) => {
  const [serverPort, setServerPort] = useState(initialServerPort);
  const [enableBattleye, setEnableBattleye] = useState(initialEnableBattleye);

  // Atualizar estados locais quando as props mudarem
  useEffect(() => {
    setServerPort(initialServerPort);
    setEnableBattleye(initialEnableBattleye);
  }, [initialServerPort, initialEnableBattleye]);

  const handleSave = () => {
    onSave(serverPort, enableBattleye);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Card>
        <CardHeader title="Configurações do Servidor" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Porta do Servidor"
                type="number"
                value={serverPort}
                onChange={(e) => setServerPort(Number(e.target.value))}
                placeholder="27015"
                inputProps={{ min: 1, max: 65535 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enableBattleye}
                    onChange={(e) => setEnableBattleye(e.target.checked)}
                  />
                }
                label="Ativar Battleye"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              color="primary"
            >
              Salvar Configurações
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
});

ServerTopFields.displayName = 'ServerTopFields';

export default ServerTopFields; 