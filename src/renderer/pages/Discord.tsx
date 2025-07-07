import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Card, CardContent, Grid, Button, List, ListItem, ListItemText, Chip, Alert, Accordion, AccordionSummary, AccordionDetails, Checkbox, FormControlLabel } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Discord: React.FC = () => {
  const [discordWebhooks, setDiscordWebhooks] = useState({ logNovosPlayers: '', logDestruicaoVeiculos: '', chatGlobal: '', painelPlayersOn: '', logsAdm: '' });
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [testando, setTestando] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [notifiedPlayers, setNotifiedPlayers] = useState<string[]>([]);
  const [loadingNotified, setLoadingNotified] = useState(false);
  const [clearingNotified, setClearingNotified] = useState(false);
  // Estados para feedback dos botões do webhook de veículos
  const [salvandoVeiculo, setSalvandoVeiculo] = useState(false);
  const [msgVeiculo, setMsgVeiculo] = useState<string | null>(null);
  const [testandoVeiculo, setTestandoVeiculo] = useState(false);
  const [testMsgVeiculo, setTestMsgVeiculo] = useState<string | null>(null);
  const [hideVehicleOwnerSteamId, setHideVehicleOwnerSteamId] = useState(false);
  // Estados para feedback dos botões do webhook de chat global
  const [salvandoChatGlobal, setSalvandoChatGlobal] = useState(false);
  const [msgChatGlobal, setMsgChatGlobal] = useState<string | null>(null);
  const [testandoChatGlobal, setTestandoChatGlobal] = useState(false);
  const [testMsgChatGlobal, setTestMsgChatGlobal] = useState<string | null>(null);
  
  // Estados para feedback dos botões do webhook adicional
  const [salvandoAdicional, setSalvandoAdicional] = useState(false);
  const [msgAdicional, setMsgAdicional] = useState<string | null>(null);
  const [testandoAdicional, setTestandoAdicional] = useState(false);
  const [testMsgAdicional, setTestMsgAdicional] = useState<string | null>(null);
  
  // Estados para validação e estatísticas
  const [validatingWebhook, setValidatingWebhook] = useState(false);
  const [webhookValidation, setWebhookValidation] = useState<{ valid: boolean; error?: string } | null>(null);
  const [discordStats, setDiscordStats] = useState<{ total: number; success: number; failed: number; lastError?: string } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    // Carregar webhooks salvos ao abrir a página
    if (window.electronAPI?.loadDiscordWebhooks) {
      window.electronAPI.loadDiscordWebhooks().then((data) => {
        if (data && typeof data === 'object') {
          setDiscordWebhooks({
            logNovosPlayers: data.logNovosPlayers || '',
            logDestruicaoVeiculos: data.logDestruicaoVeiculos || '',
            chatGlobal: data.chatGlobal || '',
            painelPlayersOn: data.painelPlayersOn || '',
            logsAdm: data.logsAdm || ''
          });
        }
      });
    }
    
    // Carregar config.json para saber se deve ocultar o SteamID
    if (window.electronAPI?.loadAppConfig) {
      window.electronAPI.loadAppConfig().then((config) => {
        if (config && typeof config === 'object' && typeof config.hideVehicleOwnerSteamId === 'boolean') {
          setHideVehicleOwnerSteamId(config.hideVehicleOwnerSteamId);
        }
      });
    }
    
    // Carregar jogadores notificados
    loadNotifiedPlayers();
  }, []);

  const loadNotifiedPlayers = async () => {
    setLoadingNotified(true);
    try {
      if (window.electronAPI?.getNotifiedPlayers) {
        const players = await window.electronAPI.getNotifiedPlayers();
        setNotifiedPlayers(players || []);
      }
    } catch (error) {
      console.error('Erro ao carregar jogadores notificados:', error);
    } finally {
      setLoadingNotified(false);
    }
  };

  const handleWebhookChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscordWebhooks({ ...discordWebhooks, logNovosPlayers: e.target.value });
  };

  const handleWebhookVeiculoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscordWebhooks({ ...discordWebhooks, logDestruicaoVeiculos: e.target.value });
  };

  const handleWebhookChatGlobalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscordWebhooks({ ...discordWebhooks, chatGlobal: e.target.value });
  };

  const handleWebhookAdicionalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscordWebhooks({ ...discordWebhooks, painelPlayersOn: e.target.value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHideVehicleOwnerSteamId(e.target.checked);
  };

  const handleSave = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      if (window.electronAPI?.saveDiscordWebhooks) {
        const res = await window.electronAPI.saveDiscordWebhooks(discordWebhooks);
        if (res && res.success) {
          setMsg('Webhook salvo com sucesso!');
        } else {
          setMsg('Erro ao salvar webhook.');
        }
      }
    } catch (err) {
      setMsg('Erro ao salvar webhook.');
    } finally {
      setSalvando(false);
    }
  };

  const handleTest = async () => {
    setTestando(true);
    setTestMsg(null);
    try {
      if (window.electronAPI?.sendDiscordWebhookMessage && discordWebhooks.logNovosPlayers) {
        const res = await window.electronAPI.sendDiscordWebhookMessage(
          discordWebhooks.logNovosPlayers,
          'Mensagem de teste do SCUM Server Manager!'
        );
        if (res && res.success) {
          setTestMsg('Mensagem enviada com sucesso!');
        } else {
          setTestMsg('Erro ao enviar mensagem: ' + (res?.error || 'Erro desconhecido'));
        }
      } else {
        setTestMsg('Informe a URL do webhook antes de testar.');
      }
    } catch (err) {
      setTestMsg('Erro ao enviar mensagem.');
    } finally {
      setTestando(false);
    }
  };

  const handleClearNotified = async () => {
    if (!confirm('Tem certeza que deseja limpar a lista de jogadores notificados? Isso permitirá que todos os jogadores sejam notificados novamente.')) {
      return;
    }
    
    setClearingNotified(true);
    try {
      if (window.electronAPI?.clearNotifiedPlayers) {
        const res = await window.electronAPI.clearNotifiedPlayers();
        if (res && res.success) {
          setNotifiedPlayers([]);
          setMsg('Lista de jogadores notificados limpa com sucesso!');
        } else {
          setMsg('Erro ao limpar lista de jogadores notificados.');
        }
      }
    } catch (err) {
      setMsg('Erro ao limpar lista de jogadores notificados.');
    } finally {
      setClearingNotified(false);
    }
  };

  const handleSaveVeiculo = async () => {
    setSalvandoVeiculo(true);
    setMsgVeiculo(null);
    try {
      if (window.electronAPI?.saveDiscordWebhooks && window.electronAPI?.saveAppConfig && window.electronAPI?.loadAppConfig) {
        const res = await window.electronAPI.saveDiscordWebhooks(discordWebhooks);
        // Carregar config atual, atualizar só o campo e salvar tudo
        const configAtual = await window.electronAPI.loadAppConfig();
        const configAtualizado = { ...configAtual, hideVehicleOwnerSteamId };
        await window.electronAPI.saveAppConfig(configAtualizado);
        if (res && res.success) {
          setMsgVeiculo('Webhook salvo com sucesso!');
        } else {
          setMsgVeiculo('Erro ao salvar webhook.');
        }
      }
    } catch (err) {
      setMsgVeiculo('Erro ao salvar webhook.');
    } finally {
      setSalvandoVeiculo(false);
    }
  };

  const handleTestVeiculo = async () => {
    setTestandoVeiculo(true);
    setTestMsgVeiculo(null);
    try {
      if (window.electronAPI?.sendDiscordWebhookMessage && discordWebhooks.logDestruicaoVeiculos) {
        const res = await window.electronAPI.sendDiscordWebhookMessage(
          discordWebhooks.logDestruicaoVeiculos,
          'Mensagem de teste do SCUM Server Manager!'
        );
        if (res && res.success) {
          setTestMsgVeiculo('Mensagem enviada com sucesso!');
        } else {
          setTestMsgVeiculo('Erro ao enviar mensagem: ' + (res?.error || 'Erro desconhecido'));
        }
      } else {
        setTestMsgVeiculo('Informe a URL do webhook antes de testar.');
      }
    } catch (err) {
      setTestMsgVeiculo('Erro ao enviar mensagem.');
    } finally {
      setTestandoVeiculo(false);
    }
  };

  const handleSaveChatGlobal = async () => {
    setSalvandoChatGlobal(true);
    setMsgChatGlobal(null);
    try {
      if (window.electronAPI?.saveDiscordWebhooks) {
        const res = await window.electronAPI.saveDiscordWebhooks(discordWebhooks);
        if (res && res.success) {
          setMsgChatGlobal('Webhook salvo com sucesso!');
        } else {
          setMsgChatGlobal('Erro ao salvar webhook.');
        }
      }
    } catch (err) {
      setMsgChatGlobal('Erro ao salvar webhook.');
    } finally {
      setSalvandoChatGlobal(false);
    }
  };

  const handleTestChatGlobal = async () => {
    setTestandoChatGlobal(true);
    setTestMsgChatGlobal(null);
    try {
      if (window.electronAPI?.sendDiscordWebhookMessage && discordWebhooks.chatGlobal) {
        const res = await window.electronAPI.sendDiscordWebhookMessage(
          discordWebhooks.chatGlobal,
          'Mensagem de teste do SCUM Server Manager!'
        );
        if (res && res.success) {
          setTestMsgChatGlobal('Mensagem enviada com sucesso!');
        } else {
          setTestMsgChatGlobal('Erro ao enviar mensagem: ' + (res?.error || 'Erro desconhecido'));
        }
      } else {
        setTestMsgChatGlobal('Informe a URL do webhook antes de testar.');
      }
    } catch (err) {
      setTestMsgChatGlobal('Erro ao enviar mensagem.');
    } finally {
      setTestandoChatGlobal(false);
    }
  };

  const handleSaveAdicional = async () => {
    setSalvandoAdicional(true);
    setMsgAdicional(null);
    try {
      if (window.electronAPI?.saveDiscordWebhooks) {
        const res = await window.electronAPI.saveDiscordWebhooks(discordWebhooks);
        if (res && res.success) {
          setMsgAdicional('Webhook salvo com sucesso!');
        } else {
          setMsgAdicional('Erro ao salvar webhook.');
        }
      }
    } catch (err) {
      setMsgAdicional('Erro ao salvar webhook.');
    } finally {
      setSalvandoAdicional(false);
    }
  };

  const handleTestAdicional = async () => {
    setTestandoAdicional(true);
    setTestMsgAdicional(null);
    try {
      if (window.electronAPI?.sendDiscordWebhookMessage && discordWebhooks.painelPlayersOn) {
        const res = await window.electronAPI.sendDiscordWebhookMessage(
          discordWebhooks.painelPlayersOn,
          'Mensagem de teste do SCUM Server Manager!'
        );
        if (res && res.success) {
          setTestMsgAdicional('Mensagem enviada com sucesso!');
        } else {
          setTestMsgAdicional('Erro ao enviar mensagem: ' + (res?.error || 'Erro desconhecido'));
        }
      } else {
        setTestMsgAdicional('Informe a URL do webhook antes de testar.');
      }
    } catch (err) {
      setTestMsgAdicional('Erro ao enviar mensagem.');
    } finally {
      setTestandoAdicional(false);
    }
  };

  // Função para validar webhook
  const handleValidateWebhook = async (webhookUrl: string) => {
    if (!webhookUrl.trim()) {
      setWebhookValidation({ valid: false, error: 'URL do webhook é obrigatória' });
      return;
    }

    setValidatingWebhook(true);
    setWebhookValidation(null);
    
    try {
      if (window.electronAPI?.validateDiscordWebhook) {
        const result = await window.electronAPI.validateDiscordWebhook(webhookUrl);
        setWebhookValidation(result);
      } else {
        setWebhookValidation({ valid: false, error: 'Função de validação não disponível' });
      }
    } catch (error) {
      setWebhookValidation({ valid: false, error: 'Erro ao validar webhook' });
    } finally {
      setValidatingWebhook(false);
    }
  };

  // Função para carregar estatísticas
  const loadDiscordStats = async () => {
    setLoadingStats(true);
    try {
      if (window.electronAPI?.getDiscordSendStats) {
        const stats = await window.electronAPI.getDiscordSendStats();
        setDiscordStats(stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Carregar estatísticas ao montar o componente
  useEffect(() => {
    loadDiscordStats();
  }, []);

  return (
    <Box sx={{ width: '100%', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 6 }}>
      <Grid container spacing={3} direction="column" alignItems="center" sx={{ width: '100%' }}>
        <Grid item xs={12} sm={8} md={6} lg={5} xl={4} sx={{ width: '100%', maxWidth: 500 }}>
          <Accordion sx={{ borderRadius: 3, minHeight: 60, width: '100%', mb: 2, background: '#232323', boxShadow: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />} sx={{ borderRadius: 3 }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>
                Webhook para Log de Novos Players
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                label="URL do Webhook (Log de Novos Players)"
                fullWidth
                value={discordWebhooks.logNovosPlayers || ''}
                onChange={handleWebhookChange}
                placeholder="Cole aqui a URL do webhook do Discord"
                margin="normal"
                disabled={salvando}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
                <Button variant="contained" color="primary" onClick={handleSave} disabled={salvando}>
                  Salvar
                </Button>
                <Button variant="outlined" color="secondary" onClick={handleTest} disabled={testando || !discordWebhooks.logNovosPlayers}>
                  Testar Webhook
                </Button>
                <Button 
                  variant="outlined" 
                  color="info" 
                  onClick={() => handleValidateWebhook(discordWebhooks.logNovosPlayers)}
                  disabled={validatingWebhook || !discordWebhooks.logNovosPlayers}
                >
                  {validatingWebhook ? 'Validando...' : 'Validar'}
                </Button>
              </Box>
              {msg && (
                <Typography variant="body2" color={msg.includes('sucesso') ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                  {msg}
                </Typography>
              )}
              {testMsg && (
                <Typography variant="body2" color={testMsg.includes('sucesso') ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                  {testMsg}
                </Typography>
              )}
              {webhookValidation && (
                <Typography variant="body2" color={webhookValidation.valid ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                  {webhookValidation.valid ? '✅ Webhook válido' : `❌ ${webhookValidation.error}`}
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} sm={8} md={6} lg={5} xl={4} sx={{ width: '100%', maxWidth: 500 }}>
          <Accordion sx={{ borderRadius: 3, minHeight: 60, width: '100%', mb: 2, background: '#232323', boxShadow: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />} sx={{ borderRadius: 3 }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>
                Webhook destruição de veículos
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                label="URL do Webhook (Destruição de Veículos)"
                fullWidth
                value={discordWebhooks.logDestruicaoVeiculos}
                onChange={handleWebhookVeiculoChange}
                placeholder="Cole aqui a URL do webhook do Discord"
                margin="normal"
              />
              <FormControlLabel
                control={<Checkbox checked={hideVehicleOwnerSteamId} onChange={handleCheckboxChange} color="primary" />}
                label="Ocultar SteamID do dono do veículo"
                sx={{ mt: 1 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
                <Button variant="contained" color="primary" onClick={handleSaveVeiculo} disabled={salvandoVeiculo}>
                  Salvar
                </Button>
                <Button variant="outlined" color="secondary" onClick={handleTestVeiculo} disabled={testandoVeiculo || !discordWebhooks.logDestruicaoVeiculos}>
                  Testar Webhook
                </Button>
              </Box>
              {msgVeiculo && (
                <Typography variant="body2" color={msgVeiculo.includes('sucesso') ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                  {msgVeiculo}
                </Typography>
              )}
              {testMsgVeiculo && (
                <Typography variant="body2" color={testMsgVeiculo.includes('sucesso') ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                  {testMsgVeiculo}
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} sm={8} md={6} lg={5} xl={4} sx={{ width: '100%', maxWidth: 500 }}>
          <Accordion sx={{ borderRadius: 3, minHeight: 60, width: '100%', mb: 2, background: '#232323', boxShadow: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />} sx={{ borderRadius: 3 }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>
                Chat Global e Local
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                label="URL do Webhook (Chat Global e Local)"
                fullWidth
                value={discordWebhooks.chatGlobal}
                onChange={handleWebhookChatGlobalChange}
                placeholder="Cole aqui a URL do webhook do Discord"
                margin="normal"
                disabled={salvandoChatGlobal}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
                <Button variant="contained" color="primary" onClick={handleSaveChatGlobal} disabled={salvandoChatGlobal}>
                  Salvar
                </Button>
                <Button variant="outlined" color="secondary" onClick={handleTestChatGlobal} disabled={testandoChatGlobal || !discordWebhooks.chatGlobal}>
                  Testar Webhook
                </Button>
              </Box>
              {msgChatGlobal && (
                <Typography variant="body2" color={msgChatGlobal.includes('sucesso') ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                  {msgChatGlobal}
                </Typography>
              )}
              {testMsgChatGlobal && (
                <Typography variant="body2" color={testMsgChatGlobal.includes('sucesso') ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                  {testMsgChatGlobal}
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} sm={8} md={6} lg={5} xl={4} sx={{ width: '100%', maxWidth: 500 }}>
          <Accordion sx={{ borderRadius: 3, minHeight: 60, width: '100%', mb: 2, background: '#232323', boxShadow: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />} sx={{ borderRadius: 3 }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>
                Painel Players On
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                label="URL do Webhook (Painel Players On)"
                fullWidth
                value={discordWebhooks.painelPlayersOn}
                onChange={handleWebhookAdicionalChange}
                placeholder="Cole aqui a URL do webhook do Discord"
                margin="normal"
                disabled={salvandoAdicional}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
                <Button variant="contained" color="primary" onClick={handleSaveAdicional} disabled={salvandoAdicional}>
                  Salvar
                </Button>
                <Button variant="outlined" color="secondary" onClick={handleTestAdicional} disabled={testandoAdicional || !discordWebhooks.painelPlayersOn}>
                  Testar Webhook
                </Button>
              </Box>
              {msgAdicional && (
                <Typography variant="body2" color={msgAdicional.includes('sucesso') ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                  {msgAdicional}
                </Typography>
              )}
              {testMsgAdicional && (
                <Typography variant="body2" color={testMsgAdicional.includes('sucesso') ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                  {testMsgAdicional}
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} sm={8} md={6} lg={5} xl={4} sx={{ width: '100%', maxWidth: 500 }}>
          <Accordion sx={{ borderRadius: 3, minHeight: 60, width: '100%', mb: 2, background: '#232323', boxShadow: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />} sx={{ borderRadius: 3 }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>
                Logs Adm
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                label="URL do Webhook (Logs Adm)"
                fullWidth
                value={discordWebhooks.logsAdm || ''}
                onChange={e => setDiscordWebhooks({ ...discordWebhooks, logsAdm: e.target.value })}
                placeholder="Cole aqui a URL do webhook do Discord"
                margin="normal"
                disabled={salvandoAdicional}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
                <Button variant="contained" color="primary" onClick={async () => {
                  setSalvandoAdicional(true);
                  setMsgAdicional(null);
                  try {
                    if (window.electronAPI?.saveDiscordWebhooks) {
                      const res = await window.electronAPI.saveDiscordWebhooks({ ...discordWebhooks, logsAdm: discordWebhooks.logsAdm });
                      if (res && res.success) {
                        setMsgAdicional('Webhook salvo com sucesso!');
                      } else {
                        setMsgAdicional('Erro ao salvar webhook.');
                      }
                    }
                  } catch (err) {
                    setMsgAdicional('Erro ao salvar webhook.');
                  } finally {
                    setSalvandoAdicional(false);
                  }
                }} disabled={salvandoAdicional}>
                  Salvar
                </Button>
                <Button variant="outlined" color="secondary" onClick={async () => {
                  setTestandoAdicional(true);
                  setTestMsgAdicional(null);
                  try {
                    if (window.electronAPI?.sendDiscordWebhookMessage && discordWebhooks.logsAdm) {
                      const res = await window.electronAPI.sendDiscordWebhookMessage(
                        discordWebhooks.logsAdm,
                        'Mensagem de teste do SCUM Server Manager!'
                      );
                      if (res && res.success) {
                        setTestMsgAdicional('Mensagem enviada com sucesso!');
                      } else {
                        setTestMsgAdicional('Erro ao enviar mensagem: ' + (res?.error || 'Erro desconhecido'));
                      }
                    } else {
                      setTestMsgAdicional('Informe a URL do webhook antes de testar.');
                    }
                  } catch (err) {
                    setTestMsgAdicional('Erro ao enviar mensagem.');
                  } finally {
                    setTestandoAdicional(false);
                  }
                }} disabled={testandoAdicional || !discordWebhooks.logsAdm}>
                  Testar Webhook
                </Button>
              </Box>
              {msgAdicional && (
                <Typography variant="body2" color={msgAdicional.includes('sucesso') ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                  {msgAdicional}
                </Typography>
              )}
              {testMsgAdicional && (
                <Typography variant="body2" color={testMsgAdicional.includes('sucesso') ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                  {testMsgAdicional}
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Card de Gerenciamento de Notificações */}
        <Grid item xs={12} sm={8} md={6} lg={5} xl={4} sx={{ width: '100%', maxWidth: 500 }}>
          <Card sx={{ borderRadius: 3, minHeight: 120, p: 2, width: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Gerenciamento de Notificações
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Jogadores que já foram notificados não receberão notificações duplicadas.
              </Alert>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={loadNotifiedPlayers} 
                  disabled={loadingNotified}
                >
                  {loadingNotified ? 'Carregando...' : 'Atualizar Lista'}
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  onClick={handleClearNotified} 
                  disabled={clearingNotified || notifiedPlayers.length === 0}
                >
                  {clearingNotified ? 'Limpando...' : 'Limpar Lista'}
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Jogadores já notificados ({notifiedPlayers.length}):
              </Typography>
              
              {notifiedPlayers.length > 0 ? (
                <List dense sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  {notifiedPlayers.map((steamId, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={
                          <Chip 
                            label={steamId} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontFamily: 'monospace' }}
                          />
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Nenhum jogador notificado ainda.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Card de Estatísticas do Discord */}
        <Grid item xs={12} sm={8} md={6} lg={5} xl={4} sx={{ width: '100%', maxWidth: 500 }}>
          <Card sx={{ borderRadius: 3, minHeight: 120, p: 2, width: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estatísticas de Envio do Discord
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={loadDiscordStats} 
                  disabled={loadingStats}
                >
                  {loadingStats ? 'Carregando...' : 'Atualizar Estatísticas'}
                </Button>
              </Box>
              
              {discordStats ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total de tentativas: {discordStats.total}
                  </Typography>
                  <Typography variant="body2" color="success.main" gutterBottom>
                    Envios bem-sucedidos: {discordStats.success}
                  </Typography>
                  <Typography variant="body2" color="error.main" gutterBottom>
                    Falhas: {discordStats.failed}
                  </Typography>
                  {discordStats.total > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Taxa de sucesso: {Math.round((discordStats.success / discordStats.total) * 100)}%
                    </Typography>
                  )}
                  {discordStats.lastError && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      Último erro: {discordStats.lastError}
                    </Alert>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Nenhuma estatística disponível.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Discord; 