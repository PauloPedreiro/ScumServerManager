/// <reference path="../types/electron.d.ts" />
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ServerConfig {
  serverSettings: any;
  gameSettings: any;
  economyConfig: any;
  raidTimes: any[];
  users: any;
  loot?: any;
}

interface ServerCache {
  serverPath: string;
  lastLoaded: string;
  serverName: string;
  maxPlayers: number;
  playstyle: string;
  configDir: string;
  version: string;
}

interface ServerConfigContextType {
  config: ServerConfig | null;
  serverPath: string | null;
  serverCache: ServerCache | null;
  loading: boolean;
  error: string | null;
  setServerPath: (path: string | null) => void;
  loadConfig: () => Promise<void>;
  saveConfig: (config: Partial<ServerConfig>) => Promise<void>;
  validateConfig: (config: any) => Promise<{ valid: boolean; errors: string[] }>;
  loadServerCache: () => Promise<void>;
  clearServerCache: () => Promise<void>;
  logsPath: string;
  setLogsPath: (path: string) => void;
}

const ServerConfigContext = createContext<ServerConfigContextType | undefined>(undefined);

export const useServerConfig = () => {
  const context = useContext(ServerConfigContext);
  if (!context) {
    throw new Error('useServerConfig must be used within a ServerConfigProvider');
  }
  return context;
};

export const ServerConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [serverPath, setServerPathState] = useState<string | null>(null);
  const [serverCache, setServerCache] = useState<ServerCache | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logsPath, setLogsPathState] = useState<string>('C:\\Servers\\scum\\SCUM\\Saved\\Logs');

  // Função para setar o caminho e salvar no config.json
  const setServerPath = (path: string | null) => {
    setServerPathState(path);
    if (path && window.electronAPI?.saveAppConfig) {
      window.electronAPI.saveAppConfig(path);
    }
  };

  // Carregar config.json na inicialização
  useEffect(() => {
    (async () => {
      if (window.electronAPI?.loadAppConfig) {
        const appConfig = await window.electronAPI.loadAppConfig();
        if (appConfig?.lastServerPath) {
          setServerPathState(appConfig.lastServerPath);
        }
      }
    })();
  }, []);

  const loadServerCache = async () => {
    try {
      if (window.electronAPI?.loadServerCache) {
        const cache = await window.electronAPI.loadServerCache();
        if (cache) {
          setServerCache(cache);
          setServerPathState(cache.serverPath);
          console.log('Cache do servidor carregado:', cache.serverName);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar cache:', err);
    }
  };

  const clearServerCache = async () => {
    try {
      if (window.electronAPI?.clearServerCache) {
        await window.electronAPI.clearServerCache();
        setServerCache(null);
        setServerPathState(null);
        setConfig(null);
        console.log('Cache do servidor limpo');
      }
    } catch (err) {
      console.error('Erro ao limpar cache:', err);
    }
  };

  const loadConfig = async () => {
    if (!serverPath) return;
    try {
      setLoading(true);
      setError(null);
      if (window.electronAPI?.readServerConfig) {
        const serverConfig = await window.electronAPI.readServerConfig(serverPath);
        setConfig(serverConfig);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: Partial<ServerConfig>) => {
    if (!serverPath || !config) return;
    try {
      setLoading(true);
      setError(null);
      const updatedConfig = { ...config, ...newConfig };
      if (window.electronAPI?.saveServerConfig) {
        await window.electronAPI.saveServerConfig(serverPath, updatedConfig);
        setConfig(updatedConfig);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const validateConfig = async (configToValidate: any) => {
    try {
      if (window.electronAPI?.validateConfig) {
        return await window.electronAPI.validateConfig(configToValidate);
      }
      return { valid: false, errors: ['API não disponível'] };
    } catch (err) {
      return {
        valid: false,
        errors: [err instanceof Error ? err.message : 'Erro na validação']
      };
    }
  };

  useEffect(() => {
    loadServerCache();
  }, []);

  useEffect(() => {
    if (serverPath) {
      loadConfig();
    }
  }, [serverPath]);

  useEffect(() => {
    (async () => {
      if (window.electronAPI?.loadAppConfig) {
        const appConfig = await window.electronAPI.loadAppConfig();
        if (appConfig?.logsPath) {
          setLogsPathState(appConfig.logsPath);
        }
      }
    })();
  }, []);

  const setLogsPath = (path: string) => {
    setLogsPathState(path);
    if (window.electronAPI?.saveAppConfig) {
      window.electronAPI.saveAppConfig(serverPath || '', undefined, undefined, undefined, undefined, undefined, undefined, path);
    }
  };

  return (
    <ServerConfigContext.Provider value={{
      config,
      serverPath,
      serverCache,
      loading,
      error,
      setServerPath,
      loadConfig,
      saveConfig,
      validateConfig,
      loadServerCache,
      clearServerCache,
      logsPath,
      setLogsPath
    }}>
      {children}
    </ServerConfigContext.Provider>
  );
}; 