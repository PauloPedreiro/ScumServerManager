// Função utilitária global para cadastrar jogadores a partir dos logs
export async function fetchPlayersFromLogs(logsPath: string, windowElectronAPI: any, setPlayersList?: (players: any[]) => void, showNotification?: (msg: string, sev?: string) => void) {
  const PLAYERS_PATH = 'players.json';
  if (windowElectronAPI?.listDir && windowElectronAPI?.readConfigFile && windowElectronAPI?.saveJsonFile) {
    const files = await windowElectronAPI.listDir(logsPath);
    const loginFiles = files.filter((f: string) => f.startsWith('login_') && f.endsWith('.log'));
    let players: Record<string, { name: string, steamId: string, timestamp: string, lastLogin: string, totalLogins: number }> = {};
    for (const file of loginFiles) {
      let content = await windowElectronAPI.readConfigFile(`${logsPath}/${file}`);
      content = content.replace(/\x00/g, '');
      const rawLines = content.split(/\r?\n/);
      const lines = rawLines.filter((l: string) => l.trim().length > 0 && l.includes('logged in'));
      for (const line of lines) {
        const match = line.match(/^(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): '[\d.]+ (\d+):([^()]+)\(\d+\)' logged in at:/);
        if (match) {
          const timestamp = match[1];
          const steamId = match[2];
          const name = match[3];
          if (!players[steamId]) {
            players[steamId] = {
              name,
              steamId,
              timestamp,
              lastLogin: timestamp,
              totalLogins: 1
            };
          } else {
            players[steamId].lastLogin = timestamp;
            players[steamId].totalLogins += 1;
          }
        }
      }
    }
    const playersArr = Object.values(players).sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime());
    if (setPlayersList) setPlayersList(playersArr);
    await windowElectronAPI.saveJsonFile(PLAYERS_PATH, playersArr);
    if (showNotification) showNotification(`Processados ${playersArr.length} jogadores únicos`, 'success');
    return playersArr;
  }
  return [];
} 