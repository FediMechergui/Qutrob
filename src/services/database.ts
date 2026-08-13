// SQLite Database Service for Kotrob Game
// Uses expo-sqlite for native platforms, localStorage fallback for web
import { Platform } from 'react-native';

// Conditional import - only import expo-sqlite on native platforms
let SQLite: typeof import('expo-sqlite') | null = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

// Database instance (null on web)
let db: import('expo-sqlite').SQLiteDatabase | null = null;

// Web fallback storage
const webStorage: {
  players: any[];
  globalScores: any[];
  rootsSessions: any[];
  qutrabSessions: any[];
  completedLevels: any[];
  unlockedVideos: any[];
  unlockedCards: any[];
  gameHistory: any[];
} = {
  players: [],
  globalScores: [],
  rootsSessions: [],
  qutrabSessions: [],
  completedLevels: [],
  unlockedVideos: [],
  unlockedCards: [],
  gameHistory: [],
};

// Load web storage from localStorage
function loadWebStorage() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('kotrob_game_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(webStorage, parsed);
      }
    } catch (e) {
      console.warn('Failed to load web storage:', e);
    }
  }
}

// Save web storage to localStorage
function saveWebStorage() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('kotrob_game_data', JSON.stringify(webStorage));
    } catch (e) {
      console.warn('Failed to save web storage:', e);
    }
  }
}

// Initialize database
export async function initDatabase(): Promise<void> {
  if (Platform.OS === 'web') {
    // Web platform - use localStorage fallback
    loadWebStorage();
    console.log('Web storage initialized');
    return;
  }

  // Native platform - use SQLite
  try {
    db = await SQLite!.openDatabaseAsync('kotrob_game.db');
    
    // Create tables
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      -- Players table
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_played_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Global scores table
      CREATE TABLE IF NOT EXISTS global_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        total_score INTEGER DEFAULT 0,
        total_streak INTEGER DEFAULT 0,
        roots_high_score INTEGER DEFAULT 0,
        qutrab_high_score INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id)
      );
      
      -- Roots game sessions
      CREATE TABLE IF NOT EXISTS roots_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        difficulty TEXT DEFAULT 'easy',
        current_level INTEGER DEFAULT 1,
        current_round INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        is_paused INTEGER DEFAULT 0,
        is_completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id)
      );
      
      -- Qutrab game sessions
      CREATE TABLE IF NOT EXISTS qutrab_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        difficulty TEXT DEFAULT 'easy',
        current_level INTEGER DEFAULT 1,
        round_in_level INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        is_paused INTEGER DEFAULT 0,
        is_completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id)
      );
      
      -- Completed levels tracking
      CREATE TABLE IF NOT EXISTS completed_levels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        game_type TEXT NOT NULL,
        level_id TEXT NOT NULL,
        completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id),
        UNIQUE(player_id, game_type, level_id)
      );
      
      -- Unlocked videos
      CREATE TABLE IF NOT EXISTS unlocked_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        title TEXT,
        unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
        watch_count INTEGER DEFAULT 1,
        FOREIGN KEY (player_id) REFERENCES players(id),
        UNIQUE(player_id, filename)
      );
      
      -- Unlocked knowledge cards
      CREATE TABLE IF NOT EXISTS unlocked_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        card_id TEXT NOT NULL,
        title TEXT,
        description TEXT,
        notes TEXT,
        unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id),
        UNIQUE(player_id, card_id)
      );

      -- Game history for statistics
      CREATE TABLE IF NOT EXISTS game_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        game_type TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        max_streak INTEGER DEFAULT 0,
        levels_completed INTEGER DEFAULT 0,
        played_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id)
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Get database instance (native only)
function getDatabase(): import('expo-sqlite').SQLiteDatabase {
  if (Platform.OS === 'web') {
    throw new Error('SQLite not available on web');
  }
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// ============ PLAYER OPERATIONS ============

export interface Player {
  id: number;
  name: string;
  created_at: string;
  last_played_at: string;
}

export async function createPlayer(name: string): Promise<number> {
  if (Platform.OS === 'web') {
    const id = webStorage.players.length + 1;
    const now = new Date().toISOString();
    webStorage.players.push({ id, name, created_at: now, last_played_at: now });
    webStorage.globalScores.push({ 
      id, player_id: id, total_score: 0, total_streak: 0, 
      roots_high_score: 0, qutrab_high_score: 0 
    });
    saveWebStorage();
    return id;
  }

  const database = getDatabase();
  const result = await database.runAsync(
    'INSERT INTO players (name) VALUES (?)',
    [name]
  );
  
  // Create initial global scores record
  await database.runAsync(
    'INSERT INTO global_scores (player_id) VALUES (?)',
    [result.lastInsertRowId]
  );
  
  return result.lastInsertRowId;
}

export async function getPlayer(playerId?: number): Promise<Player | null> {
  if (Platform.OS === 'web') {
    if (typeof playerId === 'number') {
      return webStorage.players.find(p => p.id === playerId) || null;
    }
    return webStorage.players.length > 0
      ? webStorage.players[webStorage.players.length - 1]
      : null;
  }

  const database = getDatabase();
  const result = typeof playerId === 'number'
    ? await database.getFirstAsync<Player>('SELECT * FROM players WHERE id = ?', [playerId])
    : await database.getFirstAsync<Player>('SELECT * FROM players ORDER BY id DESC LIMIT 1');
  return result || null;
}

export async function updatePlayerLastPlayed(playerId: number): Promise<void> {
  if (Platform.OS === 'web') {
    const player = webStorage.players.find(p => p.id === playerId);
    if (player) {
      player.last_played_at = new Date().toISOString();
      saveWebStorage();
    }
    return;
  }

  const database = getDatabase();
  await database.runAsync(
    'UPDATE players SET last_played_at = CURRENT_TIMESTAMP WHERE id = ?',
    [playerId]
  );
}

export async function isFirstLaunch(): Promise<boolean> {
  const player = await getPlayer();
  return player === null;
}

// ============ GLOBAL SCORES ============

export interface GlobalScores {
  total_score: number;
  total_streak: number;
  roots_high_score: number;
  qutrab_high_score: number;
}

export async function getGlobalScores(playerId: number): Promise<GlobalScores> {
  if (Platform.OS === 'web') {
    const scores = webStorage.globalScores.find(s => s.player_id === playerId);
    return scores || { total_score: 0, total_streak: 0, roots_high_score: 0, qutrab_high_score: 0 };
  }

  const database = getDatabase();
  const result = await database.getFirstAsync<GlobalScores>(
    'SELECT total_score, total_streak, roots_high_score, qutrab_high_score FROM global_scores WHERE player_id = ?',
    [playerId]
  );
  return result || { total_score: 0, total_streak: 0, roots_high_score: 0, qutrab_high_score: 0 };
}

export async function addToTotalScore(playerId: number, points: number): Promise<number> {
  if (Platform.OS === 'web') {
    const scores = webStorage.globalScores.find(s => s.player_id === playerId);
    if (scores) {
      scores.total_score += points;
      saveWebStorage();
      return scores.total_score;
    }
    return 0;
  }

  const database = getDatabase();
  await database.runAsync(
    'UPDATE global_scores SET total_score = total_score + ?, updated_at = CURRENT_TIMESTAMP WHERE player_id = ?',
    [points, playerId]
  );
  const result = await database.getFirstAsync<{ total_score: number }>(
    'SELECT total_score FROM global_scores WHERE player_id = ?',
    [playerId]
  );
  return result?.total_score || 0;
}

export async function updateHighScore(playerId: number, gameType: 'roots' | 'qutrab', score: number): Promise<void> {
  if (Platform.OS === 'web') {
    const scores = webStorage.globalScores.find(s => s.player_id === playerId);
    if (scores) {
      const key = gameType === 'roots' ? 'roots_high_score' : 'qutrab_high_score';
      scores[key] = Math.max(scores[key] || 0, score);
      saveWebStorage();
    }
    return;
  }

  const database = getDatabase();
  const column = gameType === 'roots' ? 'roots_high_score' : 'qutrab_high_score';
  await database.runAsync(
    `UPDATE global_scores SET ${column} = MAX(${column}, ?), updated_at = CURRENT_TIMESTAMP WHERE player_id = ?`,
    [score, playerId]
  );
}

export async function updateTotalStreak(playerId: number, streak: number): Promise<void> {
  if (Platform.OS === 'web') {
    const scores = webStorage.globalScores.find(s => s.player_id === playerId);
    if (scores) {
      scores.total_streak = Math.max(scores.total_streak || 0, streak);
      saveWebStorage();
    }
    return;
  }

  const database = getDatabase();
  await database.runAsync(
    'UPDATE global_scores SET total_streak = MAX(total_streak, ?), updated_at = CURRENT_TIMESTAMP WHERE player_id = ?',
    [streak, playerId]
  );
}

// ============ ROOTS GAME SESSIONS ============

export interface RootsSession {
  id: number;
  player_id: number;
  difficulty: string;
  current_level: number;
  current_round: number;
  score: number;
  streak: number;
  is_paused: number;
  is_completed: number;
}

export async function saveRootsSession(
  playerId: number,
  data: {
    difficulty: string;
    currentLevel: number;
    currentRound: number;
    score: number;
    streak: number;
    isPaused: boolean;
    isCompleted?: boolean;
  }
): Promise<number> {
  if (Platform.OS === 'web') {
    const existing = webStorage.rootsSessions.find(
      s => s.player_id === playerId && s.is_paused === 1 && s.is_completed === 0
    );
    
    if (existing) {
      Object.assign(existing, {
        difficulty: data.difficulty,
        current_level: data.currentLevel,
        current_round: data.currentRound,
        score: data.score,
        streak: data.streak,
        is_paused: data.isPaused ? 1 : 0,
        is_completed: data.isCompleted ? 1 : 0,
      });
      saveWebStorage();
      return existing.id;
    } else {
      const id = webStorage.rootsSessions.length + 1;
      webStorage.rootsSessions.push({
        id,
        player_id: playerId,
        difficulty: data.difficulty,
        current_level: data.currentLevel,
        current_round: data.currentRound,
        score: data.score,
        streak: data.streak,
        is_paused: data.isPaused ? 1 : 0,
        is_completed: data.isCompleted ? 1 : 0,
      });
      saveWebStorage();
      return id;
    }
  }

  const database = getDatabase();
  
  // Check for existing paused session
  const existing = await database.getFirstAsync<RootsSession>(
    'SELECT id FROM roots_sessions WHERE player_id = ? AND is_paused = 1 AND is_completed = 0',
    [playerId]
  );
  
  if (existing) {
    // Update existing session
    await database.runAsync(
      `UPDATE roots_sessions SET 
        difficulty = ?, current_level = ?, current_round = ?, 
        score = ?, streak = ?, is_paused = ?, is_completed = ?,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`,
      [
        data.difficulty,
        data.currentLevel,
        data.currentRound,
        data.score,
        data.streak,
        data.isPaused ? 1 : 0,
        data.isCompleted ? 1 : 0,
        existing.id
      ]
    );
    return existing.id;
  } else {
    // Create new session
    const result = await database.runAsync(
      `INSERT INTO roots_sessions (player_id, difficulty, current_level, current_round, score, streak, is_paused, is_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        playerId,
        data.difficulty,
        data.currentLevel,
        data.currentRound,
        data.score,
        data.streak,
        data.isPaused ? 1 : 0,
        data.isCompleted ? 1 : 0
      ]
    );
    return result.lastInsertRowId;
  }
}

export async function getRootsSession(playerId: number): Promise<RootsSession | null> {
  if (Platform.OS === 'web') {
    const session = webStorage.rootsSessions.find(
      s => s.player_id === playerId && s.is_paused === 1 && s.is_completed === 0
    );
    return session || null;
  }

  const database = getDatabase();
  const result = await database.getFirstAsync<RootsSession>(
    'SELECT * FROM roots_sessions WHERE player_id = ? AND is_paused = 1 AND is_completed = 0 ORDER BY updated_at DESC LIMIT 1',
    [playerId]
  );
  return result || null;
}

export async function clearRootsSession(playerId: number): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage.rootsSessions.forEach(s => {
      if (s.player_id === playerId && s.is_paused === 1) {
        s.is_paused = 0;
        s.is_completed = 1;
      }
    });
    saveWebStorage();
    return;
  }

  const database = getDatabase();
  await database.runAsync(
    'UPDATE roots_sessions SET is_paused = 0, is_completed = 1, updated_at = CURRENT_TIMESTAMP WHERE player_id = ? AND is_paused = 1',
    [playerId]
  );
}

// ============ QUTRAB GAME SESSIONS ============

export interface QutrabSession {
  id: number;
  player_id: number;
  difficulty: string;
  current_level: number;
  round_in_level: number;
  score: number;
  streak: number;
  is_paused: number;
  is_completed: number;
}

export async function saveQutrabSession(
  playerId: number,
  data: {
    difficulty: string;
    currentLevel: number;
    roundInLevel: number;
    score: number;
    streak: number;
    isPaused: boolean;
    isCompleted?: boolean;
  }
): Promise<number> {
  if (Platform.OS === 'web') {
    const existing = webStorage.qutrabSessions.find(
      s => s.player_id === playerId && s.is_paused === 1 && s.is_completed === 0
    );
    
    if (existing) {
      Object.assign(existing, {
        difficulty: data.difficulty,
        current_level: data.currentLevel,
        round_in_level: data.roundInLevel,
        score: data.score,
        streak: data.streak,
        is_paused: data.isPaused ? 1 : 0,
        is_completed: data.isCompleted ? 1 : 0,
      });
      saveWebStorage();
      return existing.id;
    } else {
      const id = webStorage.qutrabSessions.length + 1;
      webStorage.qutrabSessions.push({
        id,
        player_id: playerId,
        difficulty: data.difficulty,
        current_level: data.currentLevel,
        round_in_level: data.roundInLevel,
        score: data.score,
        streak: data.streak,
        is_paused: data.isPaused ? 1 : 0,
        is_completed: data.isCompleted ? 1 : 0,
      });
      saveWebStorage();
      return id;
    }
  }

  const database = getDatabase();
  
  // Check for existing paused session
  const existing = await database.getFirstAsync<QutrabSession>(
    'SELECT id FROM qutrab_sessions WHERE player_id = ? AND is_paused = 1 AND is_completed = 0',
    [playerId]
  );
  
  if (existing) {
    // Update existing session
    await database.runAsync(
      `UPDATE qutrab_sessions SET 
        difficulty = ?, current_level = ?, round_in_level = ?, 
        score = ?, streak = ?, is_paused = ?, is_completed = ?,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`,
      [
        data.difficulty,
        data.currentLevel,
        data.roundInLevel,
        data.score,
        data.streak,
        data.isPaused ? 1 : 0,
        data.isCompleted ? 1 : 0,
        existing.id
      ]
    );
    return existing.id;
  } else {
    // Create new session
    const result = await database.runAsync(
      `INSERT INTO qutrab_sessions (player_id, difficulty, current_level, round_in_level, score, streak, is_paused, is_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        playerId,
        data.difficulty,
        data.currentLevel,
        data.roundInLevel,
        data.score,
        data.streak,
        data.isPaused ? 1 : 0,
        data.isCompleted ? 1 : 0
      ]
    );
    return result.lastInsertRowId;
  }
}

export async function getQutrabSession(playerId: number): Promise<QutrabSession | null> {
  if (Platform.OS === 'web') {
    const session = webStorage.qutrabSessions.find(
      s => s.player_id === playerId && s.is_paused === 1 && s.is_completed === 0
    );
    return session || null;
  }

  const database = getDatabase();
  const result = await database.getFirstAsync<QutrabSession>(
    'SELECT * FROM qutrab_sessions WHERE player_id = ? AND is_paused = 1 AND is_completed = 0 ORDER BY updated_at DESC LIMIT 1',
    [playerId]
  );
  return result || null;
}

export async function clearQutrabSession(playerId: number): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage.qutrabSessions.forEach(s => {
      if (s.player_id === playerId && s.is_paused === 1) {
        s.is_paused = 0;
        s.is_completed = 1;
      }
    });
    saveWebStorage();
    return;
  }

  const database = getDatabase();
  await database.runAsync(
    'UPDATE qutrab_sessions SET is_paused = 0, is_completed = 1, updated_at = CURRENT_TIMESTAMP WHERE player_id = ? AND is_paused = 1',
    [playerId]
  );
}

// ============ COMPLETED LEVELS ============

export async function saveCompletedLevel(playerId: number, gameType: string, levelId: string): Promise<void> {
  if (Platform.OS === 'web') {
    const exists = webStorage.completedLevels.find(
      l => l.player_id === playerId && l.game_type === gameType && l.level_id === levelId
    );
    if (!exists) {
      webStorage.completedLevels.push({
        id: webStorage.completedLevels.length + 1,
        player_id: playerId,
        game_type: gameType,
        level_id: levelId,
        completed_at: new Date().toISOString(),
      });
      saveWebStorage();
    }
    return;
  }

  const database = getDatabase();
  await database.runAsync(
    'INSERT OR IGNORE INTO completed_levels (player_id, game_type, level_id) VALUES (?, ?, ?)',
    [playerId, gameType, levelId]
  );
}

export async function getCompletedLevels(playerId: number, gameType: string): Promise<string[]> {
  if (Platform.OS === 'web') {
    return webStorage.completedLevels
      .filter(l => l.player_id === playerId && l.game_type === gameType)
      .map(l => l.level_id);
  }

  const database = getDatabase();
  const results = await database.getAllAsync<{ level_id: string }>(
    'SELECT level_id FROM completed_levels WHERE player_id = ? AND game_type = ?',
    [playerId, gameType]
  );
  return results.map(r => r.level_id);
}

// ============ VIDEO UNLOCKS ============

export interface UnlockedVideo {
  id: number;
  filename: string;
  title: string | null;
  unlocked_at: string;
  watch_count: number;
}

export async function unlockVideo(playerId: number, filename: string, title?: string): Promise<void> {
  if (Platform.OS === 'web') {
    const exists = webStorage.unlockedVideos.find(
      v => v.player_id === playerId && v.filename === filename
    );
    if (!exists) {
      webStorage.unlockedVideos.push({
        id: webStorage.unlockedVideos.length + 1,
        player_id: playerId,
        filename,
        title: title || null,
        unlocked_at: new Date().toISOString(),
        watch_count: 1,
      });
      saveWebStorage();
    }
    return;
  }

  const database = getDatabase();
  await database.runAsync(
    'INSERT OR IGNORE INTO unlocked_videos (player_id, filename, title) VALUES (?, ?, ?)',
    [playerId, filename, title || null]
  );
}

export async function getUnlockedVideos(playerId: number): Promise<UnlockedVideo[]> {
  if (Platform.OS === 'web') {
    return webStorage.unlockedVideos
      .filter(v => v.player_id === playerId)
      .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime());
  }

  const database = getDatabase();
  const results = await database.getAllAsync<UnlockedVideo>(
    'SELECT * FROM unlocked_videos WHERE player_id = ? ORDER BY unlocked_at DESC',
    [playerId]
  );
  return results;
}

export async function isVideoUnlocked(playerId: number, filename: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return webStorage.unlockedVideos.some(
      v => v.player_id === playerId && v.filename === filename
    );
  }

  const database = getDatabase();
  const result = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM unlocked_videos WHERE player_id = ? AND filename = ?',
    [playerId, filename]
  );
  return result !== null;
}

export async function incrementVideoWatchCount(playerId: number, filename: string): Promise<void> {
  if (Platform.OS === 'web') {
    const video = webStorage.unlockedVideos.find(
      v => v.player_id === playerId && v.filename === filename
    );
    if (video) {
      video.watch_count++;
      saveWebStorage();
    }
    return;
  }

  const database = getDatabase();
  await database.runAsync(
    'UPDATE unlocked_videos SET watch_count = watch_count + 1 WHERE player_id = ? AND filename = ?',
    [playerId, filename]
  );
}

// ============ UNLOCKED CARDS ============

export interface UnlockedCard {
  id: number | string;
  card_id: string;
  title: string | null;
  description: string | null;
  notes: string[];
  unlocked_at: string;
}

export async function unlockCard(
  playerId: number,
  card: { id: string; title?: string; description?: string; notes?: string[] }
): Promise<void> {
  if (Platform.OS === 'web') {
    const exists = webStorage.unlockedCards.find(
      c => c.player_id === playerId && c.card_id === card.id
    );
    if (!exists) {
      webStorage.unlockedCards.push({
        id: webStorage.unlockedCards.length + 1,
        player_id: playerId,
        card_id: card.id,
        title: card.title || null,
        description: card.description || null,
        notes: card.notes || [],
        unlocked_at: new Date().toISOString(),
      });
      saveWebStorage();
    }
    return;
  }

  const database = getDatabase();
  await database.runAsync(
    'INSERT OR IGNORE INTO unlocked_cards (player_id, card_id, title, description, notes) VALUES (?, ?, ?, ?, ?)',
    [
      playerId,
      card.id,
      card.title || null,
      card.description || null,
      JSON.stringify(card.notes || []),
    ]
  );
}

export async function getUnlockedCards(playerId: number): Promise<UnlockedCard[]> {
  if (Platform.OS === 'web') {
    return webStorage.unlockedCards
      .filter(c => c.player_id === playerId)
      .map(c => ({
        id: c.id,
        card_id: c.card_id,
        title: c.title,
        description: c.description,
        notes: Array.isArray(c.notes) ? c.notes : [],
        unlocked_at: c.unlocked_at,
      }));
  }

  const database = getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    card_id: string;
    title: string | null;
    description: string | null;
    notes: string | null;
    unlocked_at: string;
  }>(
    'SELECT id, card_id, title, description, notes, unlocked_at FROM unlocked_cards WHERE player_id = ? ORDER BY unlocked_at DESC',
    [playerId]
  );
  return rows.map(row => {
    let notes: string[] = [];
    try {
      const parsed = row.notes ? JSON.parse(row.notes) : [];
      if (Array.isArray(parsed)) notes = parsed;
    } catch {
      notes = [];
    }
    return { ...row, notes };
  });
}

// ============ GAME HISTORY ============

export async function saveGameHistory(
  playerId: number,
  gameType: string,
  score: number,
  maxStreak: number,
  levelsCompleted: number
): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage.gameHistory.push({
      id: webStorage.gameHistory.length + 1,
      player_id: playerId,
      game_type: gameType,
      score,
      max_streak: maxStreak,
      levels_completed: levelsCompleted,
      played_at: new Date().toISOString(),
    });
    saveWebStorage();
    return;
  }

  const database = getDatabase();
  await database.runAsync(
    'INSERT INTO game_history (player_id, game_type, score, max_streak, levels_completed) VALUES (?, ?, ?, ?, ?)',
    [playerId, gameType, score, maxStreak, levelsCompleted]
  );
}

// ============ ACTIVE GAME CHECK ============

export async function hasActiveGame(playerId: number): Promise<{ roots: boolean; qutrab: boolean }> {
  if (Platform.OS === 'web') {
    const rootsSession = webStorage.rootsSessions.find(
      s => s.player_id === playerId && s.is_paused === 1 && s.is_completed === 0
    );
    const qutrabSession = webStorage.qutrabSessions.find(
      s => s.player_id === playerId && s.is_paused === 1 && s.is_completed === 0
    );
    return {
      roots: rootsSession !== undefined,
      qutrab: qutrabSession !== undefined,
    };
  }

  const database = getDatabase();
  
  const rootsSession = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM roots_sessions WHERE player_id = ? AND is_paused = 1 AND is_completed = 0',
    [playerId]
  );
  
  const qutrabSession = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM qutrab_sessions WHERE player_id = ? AND is_paused = 1 AND is_completed = 0',
    [playerId]
  );
  
  return {
    roots: rootsSession !== null,
    qutrab: qutrabSession !== null
  };
}

// ============ UTILITY ============

export async function getTotalScore(playerId: number): Promise<number> {
  const scores = await getGlobalScores(playerId);
  return scores.total_score;
}

export async function resetAllData(): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage.players = [];
    webStorage.globalScores = [];
    webStorage.rootsSessions = [];
    webStorage.qutrabSessions = [];
    webStorage.completedLevels = [];
    webStorage.unlockedVideos = [];
    webStorage.unlockedCards = [];
    webStorage.gameHistory = [];
    saveWebStorage();
    return;
  }

  const database = getDatabase();
  await database.execAsync(`
    DELETE FROM game_history;
    DELETE FROM unlocked_cards;
    DELETE FROM unlocked_videos;
    DELETE FROM completed_levels;
    DELETE FROM qutrab_sessions;
    DELETE FROM roots_sessions;
    DELETE FROM global_scores;
    DELETE FROM players;
  `);
}
