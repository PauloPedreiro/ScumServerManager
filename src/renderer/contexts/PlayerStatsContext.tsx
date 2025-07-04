import React, { createContext, useContext, useState } from 'react';
import { useServerConfig } from './ServerConfigContext';

interface PlayerStats {
  online: number;
  total: number;
}

interface PlayerStatsContextType {
  playerStats: PlayerStats;
  setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
}

const PlayerStatsContext = createContext<PlayerStatsContextType | undefined>(undefined);

export const usePlayerStats = () => {
  const context = useContext(PlayerStatsContext);
  if (!context) {
    throw new Error('usePlayerStats deve ser usado dentro de PlayerStatsProvider');
  }
  return context;
};

export const PlayerStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ online: 0, total: 0 });
  const { logsPath } = useServerConfig();

  React.useEffect(() => {
    const pollInterval = 5000; // 5 segundos
    let interval: ReturnType<typeof setInterval>;

    const updateStats = async () => {
      if (!logsPath || !window.electronAPI?.listDir || !window.electronAPI?.readConfigFile) {
        // console.log('[PlayerStatsContext] logsPath não definido ou electronAPI indisponível:', logsPath);
        return;
      }
      try {
        const detectedPath = logsPath;
        const files = await window.electronAPI.listDir(detectedPath);
        const loginFiles = files.filter((f: string) => f.startsWith('login_') && f.endsWith('.log'));
        // console.log('[PlayerStatsContext] loginFiles encontrados:', loginFiles);
        let allLines: string[] = [];
        for (const file of loginFiles) {
          let content = await window.electronAPI.readConfigFile(`${detectedPath}/${file}`);
          content = content.replace(/\u0000/g, '');
          const lines = content.split(/\r?\n/).filter((l: string) => l.trim().length > 0 && l.includes('logged'));
          allLines.push(...lines);
        }
        // console.log('[PlayerStatsContext] Total de linhas de evento lidas:', allLines.length, allLines.slice(0, 5));
        // Ordenar por data
        allLines.sort((a, b) => {
          const getDate = (line: string) => {
            const m = line.match(/^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2})/);
            return m ? m[1] : '';
          };
          return getDate(a).localeCompare(getDate(b));
        });
        // Calcular jogadores online
        const onlinePlayers = new Set();
        for (const line of allLines) {
          const matchIn = line.match(/\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}: '[\d.]+ (\d+):/);
          if (line.includes('logged in') && matchIn) {
            onlinePlayers.add(matchIn[1]);
          } else if (line.includes('logged out') && matchIn) {
            onlinePlayers.delete(matchIn[1]);
          }
        }
        // console.log('[PlayerStatsContext] Jogadores online calculados:', onlinePlayers.size);
        setPlayerStats((prev) => ({ ...prev, online: onlinePlayers.size }));
      } catch (err) {
        console.error('[PlayerStatsContext] Erro no polling:', err);
      }
    };
    updateStats();
    interval = setInterval(updateStats, pollInterval);
    return () => clearInterval(interval);
  }, [logsPath]);

  return (
    <PlayerStatsContext.Provider value={{ playerStats, setPlayerStats }}>
      {children}
    </PlayerStatsContext.Provider>
  );
}; 