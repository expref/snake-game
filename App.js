import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Vibration,
  Platform,
  ScrollView,
  Animated,
  Easing,
  TextInput,
  Alert,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {
  Circle,
  Rect,
  Polygon,
  Path,
  Defs,
  LinearGradient as SvgGrad,
  Stop,
} from 'react-native-svg';

const eatSound = require('./assets/sounds/eat.wav');
const deadSound = require('./assets/sounds/dead.wav');
const musicSound = require('./assets/sounds/music.wav');
const introSound = require('./assets/sounds/intro.wav');
const winSound = require('./assets/sounds/win.wav');

const COLS = 11;
const JOYSTICK_DEADZONE = 18;
const TAP_THRESHOLD = 8;
const LEVEL_SIZE = 10;
const MAX_LEVEL = 5;
const WIN_COUNT = LEVEL_SIZE * MAX_LEVEL;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BOARD_PADDING = 12;
const CELL = Math.floor((SCREEN_W - BOARD_PADDING * 2) / COLS);
const BOARD_W = CELL * COLS;
const ROWS = Math.max(11, Math.floor((SCREEN_H * 0.40) / CELL));
const BOARD_H = CELL * ROWS;

// Square size for the "here's what you revealed" loss screen.
const REVEAL_SIZE = Math.round(Math.min(SCREEN_W * 0.82, SCREEN_H * 0.46));
const REVEAL_MS = 2400; // how long the reveal shows before Game Over

const TOP_PAD =
  Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) + 10 : 50;

const DIR = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const CELEBRITIES = [
  { name: 'TAYLOR SWIFT', country: 'USA', flag: ['#B22234', '#3C3B6E'], hair: '#e9d18a', skin: '#f6d2bd', emoji: '🎤' },
  { name: 'ADELE', country: 'UK', flag: ['#012169', '#C8102E'], hair: '#3a2a1a', skin: '#f3c5a3', emoji: '🎤' },
  { name: 'DRAKE', country: 'CANADA', flag: ['#FF0000', '#FFFFFF'], hair: '#1a1a1a', skin: '#a87a5a', emoji: '🎤' },
  { name: 'RIHANNA', country: 'BARBADOS', flag: ['#00267F', '#FFC726'], hair: '#1a1a1a', skin: '#8c5a3c', emoji: '🎤' },
  { name: 'CHA EUN-WOO', country: 'S.KOREA', flag: ['#003478', '#C60C30'], hair: '#1a1a1a', skin: '#f0d3b8', emoji: '🎬' },
  { name: 'HIKARU UTADA', country: 'JAPAN', flag: ['#BC002D', '#FFFFFF'], hair: '#1a1a1a', skin: '#eed4b8', emoji: '🎤' },
  { name: 'JACKIE CHAN', country: 'CHINA', flag: ['#DE2910', '#FFDE00'], hair: '#1a1a1a', skin: '#e8c094', emoji: '🎬' },
  { name: 'SHAH RUKH KHAN', country: 'INDIA', flag: ['#FF9933', '#138808'], hair: '#1a1a1a', skin: '#c89b6c', emoji: '🎬' },
  { name: 'CRISTIANO RONALDO', country: 'PORTUGAL', flag: ['#006600', '#FF0000'], hair: '#3a2a1a', skin: '#dcb094', emoji: '⚽' },
  { name: 'LIONEL MESSI', country: 'ARGENTINA', flag: ['#74ACDF', '#FFFFFF'], hair: '#5a3a1a', skin: '#e0bf99', emoji: '⚽' },
  { name: 'ANITTA', country: 'BRAZIL', flag: ['#009C3B', '#FFDF00'], hair: '#2a1a1a', skin: '#cea087', emoji: '🎤' },
  { name: 'KYLIAN MBAPPE', country: 'FRANCE', flag: ['#0055A4', '#EF4135'], hair: '#1a1a1a', skin: '#8a5a40', emoji: '⚽' },
  { name: 'RAFAEL NADAL', country: 'SPAIN', flag: ['#AA151B', '#F1BF00'], hair: '#3a2a1a', skin: '#d9a07a', emoji: '🎾' },
  { name: 'TONI KROOS', country: 'GERMANY', flag: ['#000000', '#FFCE00'], hair: '#c8a866', skin: '#f0c8a8', emoji: '⚽' },
  { name: 'SOPHIA LOREN', country: 'ITALY', flag: ['#009246', '#CE2B37'], hair: '#3a2a1a', skin: '#e9c8a0', emoji: '🎬' },
  { name: 'SALMA HAYEK', country: 'MEXICO', flag: ['#006847', '#CE1126'], hair: '#1a1a1a', skin: '#c89870', emoji: '🎬' },
  { name: 'SHAKIRA', country: 'COLOMBIA', flag: ['#FCD116', '#003893'], hair: '#a07840', skin: '#dcb094', emoji: '🎤' },
  { name: 'BAD BUNNY', country: 'PUERTO RICO', flag: ['#0050F0', '#ED0000'], hair: '#5a3a1a', skin: '#c89870', emoji: '🎤' },
  { name: 'HUGH JACKMAN', country: 'AUSTRALIA', flag: ['#012169', '#E4002B'], hair: '#3a2a1a', skin: '#f0c8a8', emoji: '🎬' },
  { name: 'LORDE', country: 'NEW ZEALAND', flag: ['#012169', '#E4002B'], hair: '#3a2a1a', skin: '#f0c8a8', emoji: '🎤' },
  { name: 'CILLIAN MURPHY', country: 'IRELAND', flag: ['#169B62', '#FF883E'], hair: '#3a2a1a', skin: '#f0c8a8', emoji: '🎬' },
  { name: 'TYLA', country: 'S.AFRICA', flag: ['#007A4D', '#FFB81C'], hair: '#3a2a1a', skin: '#a87858', emoji: '🎤' },
  { name: 'BURNA BOY', country: 'NIGERIA', flag: ['#008751', '#FFFFFF'], hair: '#1a1a1a', skin: '#6a4830', emoji: '🎤' },
  { name: 'MOHAMED SALAH', country: 'EGYPT', flag: ['#CE1126', '#000000'], hair: '#1a1a1a', skin: '#a87858', emoji: '⚽' },
  { name: 'IBRAHIMOVIC', country: 'SWEDEN', flag: ['#005293', '#FECB00'], hair: '#3a2a1a', skin: '#e0bf99', emoji: '⚽' },
  { name: 'ERLING HAALAND', country: 'NORWAY', flag: ['#BA0C2F', '#00205B'], hair: '#c8a866', skin: '#f0c8a8', emoji: '⚽' },
  { name: 'TIESTO', country: 'NETHERLANDS', flag: ['#AE1C28', '#21468B'], hair: '#3a2a1a', skin: '#f0c8a8', emoji: '🎧' },
  { name: 'DE BRUYNE', country: 'BELGIUM', flag: ['#FAE042', '#000000'], hair: '#c8a866', skin: '#f0c8a8', emoji: '⚽' },
  { name: 'LEWANDOWSKI', country: 'POLAND', flag: ['#FFFFFF', '#DC143C'], hair: '#5a3a1a', skin: '#e9d2af', emoji: '⚽' },
  { name: 'LUKA MODRIC', country: 'CROATIA', flag: ['#171796', '#FF0000'], hair: '#5a3a1a', skin: '#e0bf99', emoji: '⚽' },
  { name: 'SHARAPOVA', country: 'RUSSIA', flag: ['#FFFFFF', '#D52B1E'], hair: '#e9d18a', skin: '#f0c8a8', emoji: '🎾' },
  { name: 'HANDE ERCEL', country: 'TURKEY', flag: ['#E30A17', '#FFFFFF'], hair: '#3a2a1a', skin: '#dcb094', emoji: '🎬' },
  { name: 'GIANNIS', country: 'GREECE', flag: ['#0D5EAF', '#FFFFFF'], hair: '#1a1a1a', skin: '#6a4830', emoji: '🏀' },
  { name: 'FEDERER', country: 'SWITZERLAND', flag: ['#FF0000', '#FFFFFF'], hair: '#3a2a1a', skin: '#e0bf99', emoji: '🎾' },
  { name: 'SCHWARZENEGGER', country: 'AUSTRIA', flag: ['#ED2939', '#FFFFFF'], hair: '#5a3a1a', skin: '#e9d2af', emoji: '🎬' },
  { name: 'PACQUIAO', country: 'PHILIPPINES', flag: ['#0038A8', '#CE1126'], hair: '#1a1a1a', skin: '#c89870', emoji: '🥊' },
  { name: 'AGNEZ MO', country: 'INDONESIA', flag: ['#FF0000', '#FFFFFF'], hair: '#1a1a1a', skin: '#c89870', emoji: '🎤' },
  { name: 'LISA', country: 'THAILAND', flag: ['#A51931', '#2D2A4A'], hair: '#3a2a1a', skin: '#e9c8a0', emoji: '🎤' },
  { name: 'SON TUNG M-TP', country: 'VIETNAM', flag: ['#DA251D', '#FFFF00'], hair: '#1a1a1a', skin: '#e0bf99', emoji: '🎤' },
  { name: 'MICHELLE YEOH', country: 'MALAYSIA', flag: ['#CC0001', '#010066'], hair: '#1a1a1a', skin: '#c89870', emoji: '🎬' },
  { name: 'MAHIRA KHAN', country: 'PAKISTAN', flag: ['#01411C', '#FFFFFF'], hair: '#1a1a1a', skin: '#c89870', emoji: '🎬' },
  { name: 'GOOGOOSH', country: 'IRAN', flag: ['#239F40', '#DA0000'], hair: '#5a3a1a', skin: '#dcb094', emoji: '🎤' },
  { name: 'GAL GADOT', country: 'ISRAEL', flag: ['#0038B8', '#FFFFFF'], hair: '#3a2a1a', skin: '#dcb094', emoji: '🎬' },
  { name: 'MIKA', country: 'LEBANON', flag: ['#ED1C24', '#FFFFFF'], hair: '#3a2a1a', skin: '#e0bf99', emoji: '🎤' },
  { name: 'MOHAMMED ABDU', country: 'SAUDI ARABIA', flag: ['#006C35', '#FFFFFF'], hair: '#1a1a1a', skin: '#c89870', emoji: '🎤' },
  { name: 'LUPITA NYONG\'O', country: 'KENYA', flag: ['#BB0000', '#006600'], hair: '#1a1a1a', skin: '#5a3818', emoji: '🎬' },
  { name: 'THE WEEKND', country: 'ETHIOPIA', flag: ['#078930', '#FCDD09'], hair: '#1a1a1a', skin: '#7a5638', emoji: '🎤' },
  { name: 'USAIN BOLT', country: 'JAMAICA', flag: ['#009B3A', '#FED100'], hair: '#1a1a1a', skin: '#6a4830', emoji: '🏃' },
  { name: 'CAMILA CABELLO', country: 'CUBA', flag: ['#002A8F', '#CF142B'], hair: '#3a2a1a', skin: '#e0bf99', emoji: '🎤' },
  { name: 'KAROL G', country: 'COLOMBIA', flag: ['#FCD116', '#003893'], hair: '#e0a040', skin: '#dcb094', emoji: '🎤' },

  // ---- Footballers: World Cup, European & all-time greats ----
  { name: 'NEYMAR JR', country: 'BRAZIL', flag: ['#009C3B', '#FFDF00'], hair: '#2a1a1a', skin: '#cea087', emoji: '⚽' },
  { name: 'VINICIUS JR', country: 'BRAZIL', flag: ['#009C3B', '#FFDF00'], hair: '#1a1a1a', skin: '#7a5638', emoji: '⚽' },
  { name: 'PELE', country: 'BRAZIL', flag: ['#009C3B', '#FFDF00'], hair: '#1a1a1a', skin: '#6a4830', emoji: '⚽' },
  { name: 'RONALDINHO', country: 'BRAZIL', flag: ['#009C3B', '#FFDF00'], hair: '#1a1a1a', skin: '#7a5638', emoji: '⚽' },
  { name: 'MARADONA', country: 'ARGENTINA', flag: ['#74ACDF', '#FFFFFF'], hair: '#1a1a1a', skin: '#dcb094', emoji: '⚽' },
  { name: 'LAUTARO MARTINEZ', country: 'ARGENTINA', flag: ['#74ACDF', '#FFFFFF'], hair: '#1a1a1a', skin: '#dcb094', emoji: '⚽' },
  { name: 'HARRY KANE', country: 'ENGLAND', flag: ['#FFFFFF', '#CF142B'], hair: '#5a3a1a', skin: '#f0c8a8', emoji: '⚽' },
  { name: 'JUDE BELLINGHAM', country: 'ENGLAND', flag: ['#FFFFFF', '#CF142B'], hair: '#1a1a1a', skin: '#c89870', emoji: '⚽' },
  { name: 'DAVID BECKHAM', country: 'ENGLAND', flag: ['#FFFFFF', '#CF142B'], hair: '#c8a866', skin: '#f0c8a8', emoji: '⚽' },
  { name: 'ANTOINE GRIEZMANN', country: 'FRANCE', flag: ['#0055A4', '#EF4135'], hair: '#5a3a1a', skin: '#f0c8a8', emoji: '⚽' },
  { name: 'ZINEDINE ZIDANE', country: 'FRANCE', flag: ['#0055A4', '#EF4135'], hair: '#3a2a1a', skin: '#e0bf99', emoji: '⚽' },
  { name: 'PEDRI', country: 'SPAIN', flag: ['#AA151B', '#F1BF00'], hair: '#1a1a1a', skin: '#e0bf99', emoji: '⚽' },
  { name: 'VIRGIL VAN DIJK', country: 'NETHERLANDS', flag: ['#AE1C28', '#21468B'], hair: '#1a1a1a', skin: '#7a5638', emoji: '⚽' },
  { name: 'HEUNG-MIN SON', country: 'S.KOREA', flag: ['#003478', '#C60C30'], hair: '#1a1a1a', skin: '#f0d3b8', emoji: '⚽' },
  { name: 'LUIS SUAREZ', country: 'URUGUAY', flag: ['#7B9AD8', '#FFFFFF'], hair: '#5a3a1a', skin: '#e9d2af', emoji: '⚽' },
  { name: 'SADIO MANE', country: 'SENEGAL', flag: ['#00853F', '#FDEF42'], hair: '#1a1a1a', skin: '#5a3818', emoji: '⚽' },
  { name: 'ACHRAF HAKIMI', country: 'MOROCCO', flag: ['#C1272D', '#006233'], hair: '#1a1a1a', skin: '#a87858', emoji: '⚽' },
  { name: 'RIYAD MAHREZ', country: 'ALGERIA', flag: ['#006233', '#FFFFFF'], hair: '#1a1a1a', skin: '#a87858', emoji: '⚽' },
  { name: 'GARETH BALE', country: 'WALES', flag: ['#C8102E', '#00B140'], hair: '#3a2a1a', skin: '#f0c8a8', emoji: '⚽' },

  // ---- Hollywood actors & actresses ----
  { name: 'LEONARDO DICAPRIO', country: 'USA', flag: ['#B22234', '#3C3B6E'], hair: '#c8a866', skin: '#f0c8a8', emoji: '🎬' },
  { name: 'TOM CRUISE', country: 'USA', flag: ['#B22234', '#3C3B6E'], hair: '#1a1a1a', skin: '#f0c8a8', emoji: '🎬' },
  { name: 'BRAD PITT', country: 'USA', flag: ['#B22234', '#3C3B6E'], hair: '#c8a866', skin: '#f0c8a8', emoji: '🎬' },
  { name: 'ANGELINA JOLIE', country: 'USA', flag: ['#B22234', '#3C3B6E'], hair: '#2a1a1a', skin: '#e9c8a0', emoji: '🎬' },
  { name: 'SCARLETT JOHANSSON', country: 'USA', flag: ['#B22234', '#3C3B6E'], hair: '#e9d18a', skin: '#f6d2bd', emoji: '🎬' },
  { name: 'WILL SMITH', country: 'USA', flag: ['#B22234', '#3C3B6E'], hair: '#1a1a1a', skin: '#6a4830', emoji: '🎬' },
  { name: 'DENZEL WASHINGTON', country: 'USA', flag: ['#B22234', '#3C3B6E'], hair: '#b8b8b8', skin: '#5a3818', emoji: '🎬' },
  { name: 'ROBERT DOWNEY JR', country: 'USA', flag: ['#B22234', '#3C3B6E'], hair: '#1a1a1a', skin: '#e9c8a0', emoji: '🎬' },
  { name: 'TOM HANKS', country: 'USA', flag: ['#B22234', '#3C3B6E'], hair: '#3a2a1a', skin: '#f0c8a8', emoji: '🎬' },
  { name: 'MORGAN FREEMAN', country: 'USA', flag: ['#B22234', '#3C3B6E'], hair: '#cccccc', skin: '#5a3818', emoji: '🎬' },
  { name: 'DWAYNE JOHNSON', country: 'USA', flag: ['#B22234', '#3C3B6E'], hair: '#3a2a1a', skin: '#a87858', emoji: '🎬' },
  { name: 'ZENDAYA', country: 'USA', flag: ['#B22234', '#3C3B6E'], hair: '#1a1a1a', skin: '#a87858', emoji: '🎬' },
  { name: 'KEANU REEVES', country: 'CANADA', flag: ['#FF0000', '#FFFFFF'], hair: '#1a1a1a', skin: '#e9c8a0', emoji: '🎬' },
  { name: 'EMMA WATSON', country: 'UK', flag: ['#012169', '#C8102E'], hair: '#5a3a1a', skin: '#f3c5a3', emoji: '🎬' },
  { name: 'DANIEL CRAIG', country: 'UK', flag: ['#012169', '#C8102E'], hair: '#c8a866', skin: '#f0c8a8', emoji: '🎬' },
  { name: 'TOM HOLLAND', country: 'UK', flag: ['#012169', '#C8102E'], hair: '#3a2a1a', skin: '#f0c8a8', emoji: '🎬' },
  { name: 'IDRIS ELBA', country: 'UK', flag: ['#012169', '#C8102E'], hair: '#1a1a1a', skin: '#5a3818', emoji: '🎬' },
  { name: 'HENRY CAVILL', country: 'UK', flag: ['#012169', '#C8102E'], hair: '#1a1a1a', skin: '#f0c8a8', emoji: '🎬' },
  { name: 'CHRIS HEMSWORTH', country: 'AUSTRALIA', flag: ['#012169', '#E4002B'], hair: '#c8a866', skin: '#f0c8a8', emoji: '🎬' },
  { name: 'MARGOT ROBBIE', country: 'AUSTRALIA', flag: ['#012169', '#E4002B'], hair: '#e9d18a', skin: '#f6d2bd', emoji: '🎬' },

  // ---- Established actors around the world ----
  { name: 'PRIYANKA CHOPRA', country: 'INDIA', flag: ['#FF9933', '#138808'], hair: '#1a1a1a', skin: '#c89b6c', emoji: '🎬' },
  { name: 'AAMIR KHAN', country: 'INDIA', flag: ['#FF9933', '#138808'], hair: '#1a1a1a', skin: '#c89b6c', emoji: '🎬' },
  { name: 'AMITABH BACHCHAN', country: 'INDIA', flag: ['#FF9933', '#138808'], hair: '#b8b8b8', skin: '#c89b6c', emoji: '🎬' },
  { name: 'DEEPIKA PADUKONE', country: 'INDIA', flag: ['#FF9933', '#138808'], hair: '#2a1a1a', skin: '#dcb094', emoji: '🎬' },
  { name: 'LEE JUNG-JAE', country: 'S.KOREA', flag: ['#003478', '#C60C30'], hair: '#1a1a1a', skin: '#f0d3b8', emoji: '🎬' },
  { name: 'TONY LEUNG', country: 'HONG KONG', flag: ['#DE2910', '#FFFFFF'], hair: '#1a1a1a', skin: '#e8c094', emoji: '🎬' },
  { name: 'ZHANG ZIYI', country: 'CHINA', flag: ['#DE2910', '#FFDE00'], hair: '#1a1a1a', skin: '#eed4b8', emoji: '🎬' },
  { name: 'KEN WATANABE', country: 'JAPAN', flag: ['#BC002D', '#FFFFFF'], hair: '#1a1a1a', skin: '#eed4b8', emoji: '🎬' },
  { name: 'PENELOPE CRUZ', country: 'SPAIN', flag: ['#AA151B', '#F1BF00'], hair: '#2a1a1a', skin: '#e9c8a0', emoji: '🎬' },
  { name: 'ANTONIO BANDERAS', country: 'SPAIN', flag: ['#AA151B', '#F1BF00'], hair: '#1a1a1a', skin: '#dcb094', emoji: '🎬' },
  { name: 'MARION COTILLARD', country: 'FRANCE', flag: ['#0055A4', '#EF4135'], hair: '#3a2a1a', skin: '#f0c8a8', emoji: '🎬' },
  { name: 'MONICA BELLUCCI', country: 'ITALY', flag: ['#009246', '#CE2B37'], hair: '#2a1a1a', skin: '#e9c8a0', emoji: '🎬' },
];

// In the 10x5 tile grid covering the board, these tiles sit over the
// centered face/eyes area — saved for the LAST reveals.
const PUZZLE_COLS = 10;
const PUZZLE_ROWS = 5;
const EYE_TILES = [14, 15, 24, 25];

function makeRevealOrder() {
  const eyeSet = new Set(EYE_TILES);
  const others = [];
  for (let i = 0; i < PUZZLE_COLS * PUZZLE_ROWS; i++) {
    if (!eyeSet.has(i)) others.push(i);
  }
  // shuffle helper
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  return [...shuffle(others), ...shuffle([...EYE_TILES])];
}

// Cumulative fraction of the picture revealed at the END of each level:
// L1 → 30%, L2 → 50%, L3 → 70%, L4 → 90%, L5 → 100%. Index 0 is the start.
const LEVEL_REVEAL_PCT = [0, 0.3, 0.5, 0.7, 0.9, 1.0];

// Map the running score to how many tiles should be uncovered, interpolating
// linearly within each level so the reveal grows smoothly with every answer.
function revealedTilesForScore(score) {
  const total = PUZZLE_COLS * PUZZLE_ROWS;
  const s = Math.max(0, Math.min(WIN_COUNT, score));
  const seg = Math.min(MAX_LEVEL - 1, Math.floor(s / LEVEL_SIZE));
  const within = (s - seg * LEVEL_SIZE) / LEVEL_SIZE; // 0..1 progress in level
  const pct =
    LEVEL_REVEAL_PCT[seg] +
    within * (LEVEL_REVEAL_PCT[seg + 1] - LEVEL_REVEAL_PCT[seg]);
  return Math.round(total * pct);
}

// ---- Game-over celebration ----
// The party scales with how far the player got. Keyed by the level reached
// when the run ended (1 = died in the very first level, 5 = made it to the
// final level). Each tier stacks on the previous one's effects.
const CONFETTI_COLORS = [
  '#ff4b2b', '#ffd200', '#36d1dc', '#38ef7d', '#d04ed6',
  '#ff6a00', '#5b86e5', '#ee0979', '#a8e063', '#fa709a',
];
const SPRINKLE_COLORS = ['#ff7ad9', '#7afcff', '#fff07a', '#9dff7a', '#ff9d7a', '#c08bff'];
const CHOCOLATE_EMOJIS = ['🍫', '🍬', '🍩'];

const LOSS_TIERS = {
  1: { headline: 'GOOD TRY!', badge: '🌱', tagline: 'Every champion starts here — go again!' },
  2: { headline: 'WELL PLAYED!', badge: '🥉', tagline: 'The crowd is clapping for you!' },
  3: { headline: 'GREAT JOB!', badge: '🥈', tagline: 'Confetti rains down on you!' },
  4: { headline: 'AMAZING!', badge: '🥇', tagline: 'Confetti and sprinkles everywhere!' },
  5: { headline: 'INCREDIBLE!', badge: '🏅', tagline: 'A chocolate shower, just for you!' },
};
const WIN_TIER = {
  headline: 'CHAMPION!',
  badge: '🏆',
  tagline: 'You mastered every level — the crowd goes wild!',
};

// Which effects are active for a finished run.
function celebrationFor(score, won) {
  const reached = Math.min(MAX_LEVEL, Math.floor(score / LEVEL_SIZE) + 1);
  return {
    reached,
    won,
    tier: won ? WIN_TIER : LOSS_TIERS[reached],
    grad: won ? ['#f5af19', '#f12711'] : ['#ee0979', '#ff6a00'],
    claps: won || reached >= 2,
    confetti: won || reached >= 3,
    sprinkles: won || reached >= 4,
    chocolate: won || reached >= 5,
    trophy: won,
  };
}

const TICK_START = 230;
const TICK_STEP = 4;
const TICK_MIN = 130;

const SHAPES = {
  2: {
    type: 'circle',
    colors: ['#36d1dc', '#5b86e5'],
    name: 'circle',
  },
  3: {
    type: 'polygon',
    points: '50,10 92,90 8,90',
    colors: ['#56ab2f', '#a8e063'],
    name: 'triangle',
  },
  4: {
    type: 'rect',
    rx: 18,
    x: 6,
    y: 6,
    w: 88,
    h: 88,
    colors: ['#f7b733', '#fc4a1a'],
    name: 'square',
  },
  5: {
    type: 'polygon',
    points: '50,5 95,38 78,92 22,92 5,38',
    colors: ['#ee0979', '#ff6a00'],
    name: 'pentagon',
  },
  6: {
    type: 'polygon',
    points: '50,5 93,28 93,72 50,95 7,72 7,28',
    colors: ['#834d9b', '#d04ed6'],
    name: 'hexagon',
  },
  7: {
    type: 'polygon',
    points:
      '50,5 61,38 95,38 67,58 78,90 50,70 22,90 33,58 5,38 39,38',
    colors: ['#11998e', '#38ef7d'],
    name: 'star',
  },
  8: {
    type: 'polygon',
    points: '50,5 95,50 50,95 5,50',
    colors: ['#ff416c', '#ff4b2b'],
    name: 'diamond',
  },
  9: {
    type: 'path',
    d: 'M50,92 C18,68 5,40 22,22 C32,12 45,18 50,30 C55,18 68,12 78,22 C95,40 82,68 50,92 Z',
    colors: ['#fa709a', '#fee140'],
    name: 'heart',
  },
  10: {
    type: 'polygon',
    points: '30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30',
    colors: ['#16a085', '#f4d03f'],
    name: 'octagon',
  },
  11: {
    type: 'polygon',
    points:
      '35,5 65,5 65,35 95,35 95,65 65,65 65,95 35,95 35,65 5,65 5,35 35,35',
    colors: ['#ee9ca7', '#c0392b'],
    name: 'plus',
  },
  12: {
    type: 'polygon',
    points:
      '50,0 60,38 90,15 75,50 95,75 65,75 55,100 50,75 35,100 25,75 5,75 25,50 10,15 40,38',
    colors: ['#a18cd1', '#fbc2eb'],
    name: 'sun',
  },
};

const STORAGE_KEY_BEST = 'snake.tables.best.v3';
const STORAGE_KEY_SETTINGS = 'snake.settings.v1';
const STORAGE_KEY_PROFILE = 'snake.profile.v1';
const STORAGE_KEY_RECENT = 'snake.recentCelebs.v1';
// Don't show the same puzzle celebrity again until this many other picks have
// gone by (persisted across sessions).
const RECENT_CELEB_LIMIT = 50;

// Pick a random celebrity whose name isn't among the most recent picks, so the
// puzzle face keeps changing. Falls back to the full list only if every name
// has been used within the recent window.
function pickCelebExcluding(recentNames) {
  const recent = new Set(recentNames);
  const fresh = CELEBRITIES.filter((c) => !recent.has(c.name));
  const pool = fresh.length ? fresh : CELEBRITIES;
  return pool[Math.floor(Math.random() * pool.length)];
}
const APP_VERSION = '1.0.0';
const isReverse = (a, b) => a.x === -b.x && a.y === -b.y;

function makeUserId() {
  return 'TITU-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// NOTE: placeholder legal copy — replace with your real, lawyer-reviewed
// policy before publishing to any app store.
const TERMS_TEXT = `Welcome to Snake × Times Tables ("the Game").

1. Acceptance — By playing the Game you agree to these Terms. If you do not agree, please do not use the Game.

2. License — We grant you a personal, non-transferable, non-exclusive license to use the Game for entertainment and educational purposes.

3. Acceptable use — You agree not to reverse engineer, resell, or misuse the Game.

4. Content — Celebrity names and country references are used for educational illustration only and imply no endorsement.

5. No warranty — The Game is provided "as is" without warranties of any kind.

6. Limitation of liability — To the maximum extent permitted by law, we are not liable for any damages arising from your use of the Game.

7. Changes — We may update these Terms from time to time. Continued use means you accept the updated Terms.

Last updated: 2026-05-31.`;

const PRIVACY_TEXT = `Your privacy matters to us.

1. Data we store — The Game stores your preferences (sound, music, voice, vibration), your best scores, and a randomly generated local User ID. All of this is kept ON YOUR DEVICE only.

2. No account required — You can play without signing in. The optional local profile name you enter is stored only on your device.

3. No tracking — We do not collect analytics, location, contacts, or advertising identifiers.

4. No third parties — We do not sell or share your data with anyone.

5. Children — The Game is designed to be family friendly and does not knowingly collect personal information from children.

6. Your control — You can clear all stored data at any time using "Reset progress" in Settings, or by uninstalling the Game.

Last updated: 2026-05-31.`;

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substr(0, 2), 16),
    g: parseInt(h.substr(2, 2), 16),
    b: parseInt(h.substr(4, 2), 16),
  };
}
function blendHex(c1, c2, t) {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  const m = (x, y) => Math.round(x + (y - x) * t);
  return `rgb(${m(a.r, b.r)}, ${m(a.g, b.g)}, ${m(a.b, b.b)})`;
}

function initialSnake() {
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);
  return [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
}

function randomFreeCell(snake) {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  let cell;
  do {
    cell = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (occupied.has(`${cell.x},${cell.y}`));
  return cell;
}

function makeFood(table, multiplier, snake) {
  const pos = randomFreeCell(snake);
  return { x: pos.x, y: pos.y, value: table * multiplier, multiplier };
}

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [table, setTable] = useState(2);
  const [bestScores, setBestScores] = useState({});
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [profile, setProfile] = useState({ userId: '', name: '', signedIn: false });
  const [paused, setPaused] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  // Mirror of the latest settings so persistence merges correctly without
  // stale closures across the four independent boolean states.
  const settingsRef = useRef({
    musicEnabled,
    voiceEnabled,
    sfxEnabled,
    vibrationEnabled,
  });
  useEffect(() => {
    settingsRef.current = {
      musicEnabled,
      voiceEnabled,
      sfxEnabled,
      vibrationEnabled,
    };
  }, [musicEnabled, voiceEnabled, sfxEnabled, vibrationEnabled]);

  const eatRef = useRef(null);
  const deadRef = useRef(null);
  const musicRef = useRef(null);
  const introRef = useRef(null);
  const winRef = useRef(null);
  // Names of recently shown puzzle celebrities, newest last (see pickCeleb).
  const recentCelebsRef = useRef([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_BEST)
      .then((raw) => {
        if (!raw) return;
        try {
          setBestScores(JSON.parse(raw) || {});
        } catch {}
      })
      .catch(() => {});
    AsyncStorage.getItem(STORAGE_KEY_SETTINGS)
      .then((raw) => {
        if (!raw) return;
        try {
          const s = JSON.parse(raw);
          if (typeof s.musicEnabled === 'boolean')
            setMusicEnabled(s.musicEnabled);
          if (typeof s.voiceEnabled === 'boolean')
            setVoiceEnabled(s.voiceEnabled);
          if (typeof s.sfxEnabled === 'boolean') setSfxEnabled(s.sfxEnabled);
          if (typeof s.vibrationEnabled === 'boolean')
            setVibrationEnabled(s.vibrationEnabled);
        } catch {}
      })
      .catch(() => {});
    AsyncStorage.getItem(STORAGE_KEY_PROFILE)
      .then((raw) => {
        let p = null;
        if (raw) {
          try {
            p = JSON.parse(raw);
          } catch {}
        }
        if (p && p.userId) {
          setProfile({
            userId: p.userId,
            name: p.name || '',
            signedIn: !!p.signedIn,
          });
        } else {
          // First launch — mint a stable local User ID.
          const fresh = { userId: makeUserId(), name: '', signedIn: false };
          setProfile(fresh);
          AsyncStorage.setItem(
            STORAGE_KEY_PROFILE,
            JSON.stringify(fresh)
          ).catch(() => {});
        }
      })
      .catch(() => {});
    AsyncStorage.getItem(STORAGE_KEY_RECENT)
      .then((raw) => {
        if (!raw) return;
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) recentCelebsRef.current = arr;
        } catch {}
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const [
          { sound: eatS },
          { sound: deadS },
          { sound: musicS },
          { sound: introS },
          { sound: winS },
        ] = await Promise.all([
          Audio.Sound.createAsync(eatSound),
          Audio.Sound.createAsync(deadSound),
          Audio.Sound.createAsync(musicSound, {
            isLooping: true,
            volume: 0.35,
          }),
          Audio.Sound.createAsync(introSound, { volume: 0.85 }),
          Audio.Sound.createAsync(winSound, { volume: 0.95 }),
        ]);
        if (cancelled) {
          eatS.unloadAsync();
          deadS.unloadAsync();
          musicS.unloadAsync();
          introS.unloadAsync();
          winS.unloadAsync();
          return;
        }
        eatRef.current = eatS;
        deadRef.current = deadS;
        musicRef.current = musicS;
        introRef.current = introS;
        winRef.current = winS;
        setAudioReady(true);
      } catch (e) {
        console.warn('audio init failed', e);
      }
    })();
    return () => {
      cancelled = true;
      eatRef.current?.unloadAsync();
      deadRef.current?.unloadAsync();
      musicRef.current?.unloadAsync();
      introRef.current?.unloadAsync();
      winRef.current?.unloadAsync();
      eatRef.current = null;
      deadRef.current = null;
      musicRef.current = null;
      introRef.current = null;
      winRef.current = null;
    };
  }, []);

  const playIntro = useCallback(() => {
    if (!settingsRef.current.sfxEnabled) return;
    introRef.current?.replayAsync().catch(() => {});
  }, []);

  // Spoken studio sting on the splash screen.
  const speakBrand = useCallback(() => {
    if (!settingsRef.current.sfxEnabled) return;
    Speech.stop();
    Speech.speak('Titu Games', { rate: 0.95, pitch: 1.05 });
  }, []);

  const vibrate = useCallback((pattern) => {
    if (settingsRef.current.vibrationEnabled) Vibration.vibrate(pattern);
  }, []);

  useEffect(() => {
    const m = musicRef.current;
    if (!m) return;
    const shouldPlay = musicEnabled && screen === 'playing' && !paused && gameActive;
    (async () => {
      try {
        if (shouldPlay) await m.playAsync();
        else await m.pauseAsync();
      } catch {}
    })();
  }, [musicEnabled, screen, paused, gameActive]);

  const playEat = useCallback(() => {
    if (!settingsRef.current.sfxEnabled) return;
    eatRef.current?.replayAsync().catch(() => {});
  }, []);
  const playDead = useCallback(() => {
    if (!settingsRef.current.sfxEnabled) return;
    deadRef.current?.replayAsync().catch(() => {});
  }, []);
  const playWin = useCallback(() => {
    if (!settingsRef.current.sfxEnabled) return;
    winRef.current?.replayAsync().catch(() => {});
  }, []);

  const saveBest = useCallback((tableKey, score) => {
    setBestScores((prev) => {
      const cur = prev[tableKey] || 0;
      if (score <= cur) return prev;
      const next = { ...prev, [tableKey]: score };
      AsyncStorage.setItem(STORAGE_KEY_BEST, JSON.stringify(next)).catch(
        () => {}
      );
      return next;
    });
  }, []);

  // Merge a patch with the latest committed settings (held in settingsRef) and
  // write the whole object. Avoids stale closures without a settings reducer.
  const persistSettings = useCallback((patch) => {
    const data = { ...settingsRef.current, ...patch };
    AsyncStorage.setItem(
      STORAGE_KEY_SETTINGS,
      JSON.stringify(data)
    ).catch(() => {});
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => {
      const next = !prev;
      persistSettings({ musicEnabled: next });
      return next;
    });
  }, [persistSettings]);
  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      if (!next) Speech.stop();
      persistSettings({ voiceEnabled: next });
      return next;
    });
  }, [persistSettings]);
  const toggleSfx = useCallback(() => {
    setSfxEnabled((prev) => {
      const next = !prev;
      persistSettings({ sfxEnabled: next });
      return next;
    });
  }, [persistSettings]);
  const toggleVibration = useCallback(() => {
    setVibrationEnabled((prev) => {
      const next = !prev;
      if (next) Vibration.vibrate(15); // confirm haptics when turning on
      persistSettings({ vibrationEnabled: next });
      return next;
    });
  }, [persistSettings]);

  const persistProfile = useCallback((p) => {
    AsyncStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(p)).catch(() => {});
  }, []);
  const login = useCallback(
    (name) => {
      setProfile((prev) => {
        const next = {
          ...prev,
          name: (name || '').trim() || 'Player',
          signedIn: true,
        };
        persistProfile(next);
        return next;
      });
    },
    [persistProfile]
  );
  const logout = useCallback(() => {
    setProfile((prev) => {
      const next = { ...prev, name: '', signedIn: false };
      persistProfile(next);
      return next;
    });
  }, [persistProfile]);
  const resetProgress = useCallback(() => {
    setBestScores({});
    AsyncStorage.removeItem(STORAGE_KEY_BEST).catch(() => {});
  }, []);

  const speakNumber = useCallback(
    (n) => {
      if (!voiceEnabled) return;
      Speech.stop();
      Speech.speak(String(n), { rate: 1.0, pitch: 1.1 });
    },
    [voiceEnabled]
  );

  // Spoken appreciation on game over (replaces the old applause). Gated by
  // sound effects rather than the number-voice toggle so it still cheers you on.
  const speakPraise = useCallback((text) => {
    if (!settingsRef.current.sfxEnabled) return;
    Speech.stop();
    Speech.speak(text, { rate: 0.96, pitch: 1.15 });
  }, []);

  // Choose the next puzzle celebrity, avoiding the recent ones, and remember it.
  const pickCeleb = useCallback(() => {
    const celeb = pickCelebExcluding(recentCelebsRef.current);
    const next = [...recentCelebsRef.current, celeb.name].slice(-RECENT_CELEB_LIMIT);
    recentCelebsRef.current = next;
    AsyncStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(next)).catch(() => {});
    return celeb;
  }, []);

  const startGame = (t) => {
    setTable(t);
    setScreen('playing');
  };
  const goToMenu = () => setScreen('menu');

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      style={styles.root}
    >
      <StatusBar style="light" />
      {screen === 'splash' ? (
        <Splash
          onDone={() => setScreen('menu')}
          playIntro={playIntro}
          speakBrand={speakBrand}
          audioReady={audioReady}
        />
      ) : screen === 'menu' ? (
        <Menu
          bestScores={bestScores}
          onStart={startGame}
          onOpenSettings={() => setScreen('settings')}
        />
      ) : screen === 'settings' ? (
        <Settings
          profile={profile}
          musicEnabled={musicEnabled}
          voiceEnabled={voiceEnabled}
          sfxEnabled={sfxEnabled}
          vibrationEnabled={vibrationEnabled}
          onToggleMusic={toggleMusic}
          onToggleVoice={toggleVoice}
          onToggleSfx={toggleSfx}
          onToggleVibration={toggleVibration}
          onLogin={login}
          onLogout={logout}
          onResetProgress={resetProgress}
          onBack={goToMenu}
        />
      ) : (
        <Game
          table={table}
          bestScore={bestScores[table] || 0}
          paused={paused}
          setPaused={setPaused}
          onEat={playEat}
          onDeath={playDead}
          onWin={playWin}
          onPraise={speakPraise}
          onSpeak={speakNumber}
          pickCeleb={pickCeleb}
          onVibrate={vibrate}
          onSaveBest={(s) => saveBest(table, s)}
          onMenu={goToMenu}
          musicEnabled={musicEnabled}
          onToggleMusic={toggleMusic}
          voiceEnabled={voiceEnabled}
          onToggleVoice={toggleVoice}
          onActiveChange={setGameActive}
        />
      )}
    </LinearGradient>
  );
}

function Splash({ onDone, playIntro, speakBrand, audioReady }) {
  const letters = ['T', 'I', 'T', 'U'];
  const directions = [
    { x: -300, y: -200, rot: -2 },
    { x: 300, y: -200, rot: 2 },
    { x: -300, y: 200, rot: -1.5 },
    { x: 300, y: 200, rot: 1.5 },
  ];

  const animsRef = useRef(
    letters.map(() => ({
      tx: new Animated.Value(0),
      ty: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3),
      rot: new Animated.Value(0),
    }))
  );
  const gamesOpacity = useRef(new Animated.Value(0)).current;
  const gamesScale = useRef(new Animated.Value(0.5)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.6)).current;

  const [showButton, setShowButton] = useState(false);
  const introPlayedRef = useRef(false);

  useEffect(() => {
    if (audioReady && !introPlayedRef.current) {
      introPlayedRef.current = true;
      playIntro();
    }
  }, [audioReady, playIntro]);

  useEffect(() => {
    const anims = animsRef.current;
    anims.forEach((a, i) => {
      a.tx.setValue(directions[i].x);
      a.ty.setValue(directions[i].y);
      a.rot.setValue(directions[i].rot);
    });

    // Begin letter animation after ~1.4s so the build-up sound matches landing
    const startDelay = 1400;

    const letterAnims = anims.map((a, i) =>
      Animated.parallel([
        Animated.spring(a.tx, {
          toValue: 0,
          delay: startDelay + i * 80,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.spring(a.ty, {
          toValue: 0,
          delay: startDelay + i * 80,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 400,
          delay: startDelay + i * 80,
          useNativeDriver: true,
        }),
        Animated.spring(a.scale, {
          toValue: 1,
          delay: startDelay + i * 80,
          friction: 4,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(a.rot, {
          toValue: 0,
          duration: 700,
          delay: startDelay + i * 80,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    Animated.parallel(letterAnims).start(() => {
      // Speak the studio name just as "TITU GAMES" finishes assembling.
      speakBrand?.();
      Animated.parallel([
        Animated.timing(gamesOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(gamesScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowButton(true);
        Animated.parallel([
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(buttonScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anims = animsRef.current;

  return (
    <View style={styles.splashContainer}>
      <View style={styles.splashLettersWrap}>
        {letters.map((letter, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.splashLetter,
              {
                opacity: anims[i].opacity,
                transform: [
                  { translateX: anims[i].tx },
                  { translateY: anims[i].ty },
                  { scale: anims[i].scale },
                  {
                    rotate: anims[i].rot.interpolate({
                      inputRange: [-3, 0, 3],
                      outputRange: ['-540deg', '0deg', '540deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {letter}
          </Animated.Text>
        ))}
      </View>
      <Animated.Text
        style={[
          styles.splashGames,
          { opacity: gamesOpacity, transform: [{ scale: gamesScale }] },
        ]}
      >
        GAMES
      </Animated.Text>
      <Animated.Text style={[styles.splashTagline, { opacity: taglineOpacity }]}>
        presents
      </Animated.Text>
      <Animated.Text style={[styles.splashSubtitle, { opacity: taglineOpacity }]}>
        SNAKE & MULTIPLY
      </Animated.Text>
      {showButton && (
        <Animated.View
          style={{
            opacity: buttonOpacity,
            transform: [{ scale: buttonScale }],
            marginTop: 48,
          }}
        >
          <TouchableOpacity
            onPress={onDone}
            activeOpacity={0.85}
            style={styles.letsGoBtnWrap}
          >
            <LinearGradient
              colors={['#ee0979', '#ff6a00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.letsGoBtn}
            >
              <Text style={styles.letsGoTxt}>LET'S GO →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

function Menu({ bestScores, onStart, onOpenSettings }) {
  return (
    <View style={[styles.menuContainer, { paddingTop: TOP_PAD }]}>
      <View style={styles.topBar}>
        <View style={{ width: 44 }} />
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>SNAKE</Text>
          <Text style={styles.menuSubtitle}>&amp; multiply</Text>
        </View>
        <TouchableOpacity
          onPress={onOpenSettings}
          activeOpacity={0.7}
          style={styles.gearBtn}
        >
          <Text style={styles.gearTxt}>⚙</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tableGridWrap}>
        <Text style={styles.pickHint}>pick a table</Text>
        <View style={styles.tableGrid}>
          {TABLES.map((t) => (
            <TableButton
              key={t}
              table={t}
              best={bestScores[t] || 0}
              onPress={() => onStart(t)}
            />
          ))}
        </View>
      </View>

      <View style={styles.menuFooter}>
        <Text style={styles.menuHint}>swipe to move • tap board to pause</Text>
      </View>
    </View>
  );
}

function TableButton({ table, best, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.tableBtnWrap}
    >
      <View style={styles.tableBtn}>
        <FoodShape table={table} size={56} />
        <Text style={styles.tableBtnLabel}>× {table}</Text>
        <Text style={styles.tableBtnBest}>best {best}</Text>
      </View>
    </TouchableOpacity>
  );
}

function FoodShape({ table, size, value }) {
  const cfg = SHAPES[table] || SHAPES[2];
  const gradId = `g-${table}-${size}`;
  const fill = `url(#${gradId})`;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <SvgGrad id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={cfg.colors[0]} stopOpacity="1" />
            <Stop offset="1" stopColor={cfg.colors[1]} stopOpacity="1" />
          </SvgGrad>
        </Defs>
        {cfg.type === 'circle' && (
          <Circle
            cx={50}
            cy={50}
            r={45}
            fill={fill}
            stroke={cfg.colors[0]}
            strokeWidth={3}
          />
        )}
        {cfg.type === 'rect' && (
          <Rect
            x={cfg.x}
            y={cfg.y}
            width={cfg.w}
            height={cfg.h}
            rx={cfg.rx}
            fill={fill}
            stroke={cfg.colors[0]}
            strokeWidth={3}
          />
        )}
        {cfg.type === 'polygon' && (
          <Polygon
            points={cfg.points}
            fill={fill}
            stroke={cfg.colors[0]}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        )}
        {cfg.type === 'path' && (
          <Path
            d={cfg.d}
            fill={fill}
            stroke={cfg.colors[0]}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        )}
      </Svg>
      {value !== undefined && (
        <Text
          style={[
            styles.shapeText,
            { fontSize: Math.max(11, size * 0.36) },
          ]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

function ToggleBtn({ label, enabled, onPress, small }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.toggleBtn,
        small && styles.toggleBtnSmall,
        !enabled && styles.toggleBtnOff,
      ]}
    >
      <Text
        style={[
          styles.toggleTxt,
          small && styles.toggleTxtSmall,
          !enabled && styles.toggleTxtOff,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ToggleSwitch({ value, onValueChange }) {
  return (
    <TouchableOpacity
      onPress={onValueChange}
      activeOpacity={0.85}
      style={[
        styles.switchTrack,
        value ? styles.switchTrackOn : styles.switchTrackOff,
      ]}
    >
      <View style={styles.switchThumb} />
    </TouchableOpacity>
  );
}

function SettingRow({ icon, label, sublabel, right, onPress, danger }) {
  const body = (
    <View style={styles.setRow}>
      <Text style={styles.setRowIcon}>{icon}</Text>
      <View style={styles.setRowText}>
        <Text style={[styles.setRowLabel, danger && styles.setRowLabelDanger]}>
          {label}
        </Text>
        {sublabel ? <Text style={styles.setRowSub}>{sublabel}</Text> : null}
      </View>
      <View style={styles.setRowRight}>{right}</View>
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.65}>
        {body}
      </TouchableOpacity>
    );
  }
  return body;
}

function LoginModal({ initialName, onCancel, onSubmit }) {
  const [name, setName] = useState(initialName || '');
  return (
    <View style={styles.overlay}>
      <View style={styles.dialogCard}>
        <Text style={styles.dialogTitle}>Log in</Text>
        <Text style={styles.dialogSub}>
          Enter a name for your local profile. No password or internet needed.
        </Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#8a86b8"
          maxLength={18}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => onSubmit(name)}
        />
        <View style={styles.dialogBtnRow}>
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.dialogBtn, styles.dialogBtnGhost]}
          >
            <Text style={styles.dialogBtnTxt}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSubmit(name)}
            style={[styles.dialogBtn, styles.dialogBtnPrimary]}
          >
            <Text style={styles.dialogBtnTxt}>SAVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function LegalModal({ title, body, onClose }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.legalCard}>
        <Text style={styles.dialogTitle}>{title}</Text>
        <ScrollView
          style={styles.legalScroll}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          <Text style={styles.legalText}>{body}</Text>
        </ScrollView>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.dialogBtn, styles.dialogBtnPrimary, { marginTop: 12 }]}
        >
          <Text style={styles.dialogBtnTxt}>CLOSE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TutorialModal({ onClose }) {
  const steps = [
    '🎯  Pick a times table (×2 to ×12) from the menu.',
    '🕹️  Swipe anywhere or drag the joystick to steer. Walls wrap around.',
    '🍎  Eat the shape to score. Each shows the next answer: 2, 4, 6, 8…',
    '🗣️  Turn on “Voice numbers” to hear every answer spoken aloud.',
    '⚡  The snake speeds up as you score — don’t bite your own tail!',
    '🖼️  Every 10 answers clears a level and uncovers more of a mystery star. Beat all 5 levels to fully reveal them and win.',
    '⏸️  Tap the board or the pause button to pause anytime.',
  ];
  return (
    <View style={styles.overlay}>
      <View style={styles.legalCard}>
        <Text style={styles.dialogTitle}>How to play</Text>
        <ScrollView
          style={styles.legalScroll}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {steps.map((s, i) => (
            <Text key={i} style={styles.tutStep}>
              {s}
            </Text>
          ))}
        </ScrollView>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.dialogBtn, styles.dialogBtnPrimary, { marginTop: 12 }]}
        >
          <Text style={styles.dialogBtnTxt}>GOT IT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Settings({
  profile,
  musicEnabled,
  voiceEnabled,
  sfxEnabled,
  vibrationEnabled,
  onToggleMusic,
  onToggleVoice,
  onToggleSfx,
  onToggleVibration,
  onLogin,
  onLogout,
  onResetProgress,
  onBack,
}) {
  const [modal, setModal] = useState(null); // 'login'|'terms'|'privacy'|'tutorial'
  const chevron = <Text style={styles.setChevron}>›</Text>;

  const confirmReset = () => {
    Alert.alert(
      'Reset progress?',
      'This erases all of your best scores on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: onResetProgress },
      ]
    );
  };
  const confirmLogout = () => {
    Alert.alert(
      'Log out?',
      'You will switch back to a guest profile on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  const signedName = profile.signedIn && profile.name ? profile.name : '';

  return (
    <View style={[styles.setContainer, { paddingTop: TOP_PAD }]}>
      <View style={styles.setHeader}>
        <TouchableOpacity onPress={onBack} style={styles.menuBtn}>
          <Text style={styles.menuBtnTxt}>‹ BACK</Text>
        </TouchableOpacity>
        <Text style={styles.setTitle}>SETTINGS</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        style={styles.setScroll}
        contentContainerStyle={styles.setScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.setSectionTitle}>ACCOUNT</Text>
        <View style={styles.setCard}>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarTxt}>
                {(signedName ? signedName[0] : 'G').toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName} numberOfLines={1}>
                {signedName || 'Guest Player'}
              </Text>
              <Text style={styles.profileStatus}>
                {profile.signedIn ? 'Signed in (local)' : 'Not signed in'}
              </Text>
            </View>
          </View>
          <SettingRow
            icon="🆔"
            label="User ID"
            sublabel="Stored on this device only"
            right={<Text style={styles.setValue}>{profile.userId || '—'}</Text>}
          />
          {profile.signedIn ? (
            <SettingRow
              icon="🚪"
              label="Log out"
              danger
              onPress={confirmLogout}
              right={chevron}
            />
          ) : (
            <SettingRow
              icon="👤"
              label="Log in"
              sublabel="Set a local profile name"
              onPress={() => setModal('login')}
              right={chevron}
            />
          )}
        </View>

        <Text style={styles.setSectionTitle}>PREFERENCES</Text>
        <View style={styles.setCard}>
          <SettingRow
            icon="🎵"
            label="Music"
            sublabel="Background music while playing"
            right={
              <ToggleSwitch value={musicEnabled} onValueChange={onToggleMusic} />
            }
          />
          <SettingRow
            icon="🔊"
            label="Sound effects"
            sublabel="Eat & game-over sounds"
            right={
              <ToggleSwitch value={sfxEnabled} onValueChange={onToggleSfx} />
            }
          />
          <SettingRow
            icon="🗣️"
            label="Voice numbers"
            sublabel="Speak each answer aloud"
            right={
              <ToggleSwitch value={voiceEnabled} onValueChange={onToggleVoice} />
            }
          />
          <SettingRow
            icon="📳"
            label="Vibration"
            sublabel="Haptic feedback"
            right={
              <ToggleSwitch
                value={vibrationEnabled}
                onValueChange={onToggleVibration}
              />
            }
          />
        </View>

        <Text style={styles.setSectionTitle}>HELP</Text>
        <View style={styles.setCard}>
          <SettingRow
            icon="📖"
            label="How to play"
            sublabel="Tutorial & tips"
            onPress={() => setModal('tutorial')}
            right={chevron}
          />
        </View>

        <Text style={styles.setSectionTitle}>ABOUT</Text>
        <View style={styles.setCard}>
          <SettingRow
            icon="📜"
            label="Terms & Conditions"
            onPress={() => setModal('terms')}
            right={chevron}
          />
          <SettingRow
            icon="🔒"
            label="Privacy Policy"
            onPress={() => setModal('privacy')}
            right={chevron}
          />
          <SettingRow
            icon="ℹ️"
            label="Version"
            right={<Text style={styles.setValue}>{APP_VERSION}</Text>}
          />
          <SettingRow
            icon="🔄"
            label="Reset progress"
            danger
            onPress={confirmReset}
            right={chevron}
          />
        </View>

        <Text style={styles.setFooter}>TITU GAMES • Snake × Times Tables</Text>
      </ScrollView>

      {modal === 'login' && (
        <LoginModal
          initialName={profile.name}
          onCancel={() => setModal(null)}
          onSubmit={(name) => {
            onLogin(name);
            setModal(null);
          }}
        />
      )}
      {(modal === 'terms' || modal === 'privacy') && (
        <LegalModal
          title={modal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
          body={modal === 'terms' ? TERMS_TEXT : PRIVACY_TEXT}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'tutorial' && <TutorialModal onClose={() => setModal(null)} />}
    </View>
  );
}

function Game({
  table,
  bestScore,
  paused,
  setPaused,
  onEat,
  onDeath,
  onWin,
  onPraise,
  onSpeak,
  pickCeleb,
  onVibrate,
  onSaveBest,
  onMenu,
  musicEnabled,
  onToggleMusic,
  voiceEnabled,
  onToggleVoice,
  onActiveChange,
}) {
  const [snake, setSnake] = useState(initialSnake);
  const [food, setFood] = useState(() => makeFood(table, 1, initialSnake()));
  const [score, setScore] = useState(0);
  const [eaten, setEaten] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  // After a loss we briefly show the picture the player uncovered before the
  // Game Over card slides in.
  const [reviewing, setReviewing] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState(0);
  const [celeb, setCeleb] = useState(() => pickCeleb());
  const [revealOrder, setRevealOrder] = useState(() => makeRevealOrder());

  // Game-over card entrance + one-shot celebration trigger.
  const cardAnim = useRef(new Animated.Value(0)).current;
  const celebratedRef = useRef(false);

  const dirRef = useRef(DIR.RIGHT);
  const pendingDirRef = useRef(DIR.RIGHT);

  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const scoreRef = useRef(score);
  const bestRef = useRef(bestScore);
  const cbRef = useRef({ onEat, onDeath, onWin, onPraise, onSaveBest, onSpeak, onVibrate });
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { bestRef.current = bestScore; }, [bestScore]);
  useEffect(() => {
    cbRef.current = { onEat, onDeath, onWin, onPraise, onSaveBest, onSpeak, onVibrate };
  }, [onEat, onDeath, onWin, onPraise, onSaveBest, onSpeak, onVibrate]);

  useEffect(() => {
    onActiveChange(!gameOver);
    return () => onActiveChange(false);
  }, [gameOver, onActiveChange]);

  const tickMs = Math.max(TICK_MIN, TICK_START - score * TICK_STEP);

  const tick = useCallback(() => {
    const prev = snakeRef.current;
    const cur = dirRef.current;
    const nxt = pendingDirRef.current;
    const useDir = isReverse(nxt, cur) ? cur : nxt;
    dirRef.current = useDir;

    const head = prev[0];
    const newHead = {
      x: (head.x + useDir.x + COLS) % COLS,
      y: (head.y + useDir.y + ROWS) % ROWS,
    };

    for (let i = 0; i < prev.length - 1; i++) {
      if (prev[i].x === newHead.x && prev[i].y === newHead.y) {
        setGameOver(true);
        setReviewing(true);
        cbRef.current.onVibrate(220);
        cbRef.current.onDeath();
        return;
      }
    }

    const currentFood = foodRef.current;
    const ate = newHead.x === currentFood.x && newHead.y === currentFood.y;
    const newBody = ate
      ? [newHead, ...prev]
      : [newHead, ...prev.slice(0, -1)];

    setSnake(newBody);

    if (ate) {
      const newScore = scoreRef.current + 1;
      const nextMultiplier = currentFood.multiplier + 1;
      const justAte = currentFood.value;
      setScore(newScore);
      setEaten((prev) => [...prev, justAte]);
      cbRef.current.onVibrate(25);
      cbRef.current.onEat();
      cbRef.current.onSpeak(justAte);
      if (newScore > bestRef.current) {
        cbRef.current.onSaveBest(newScore);
      }
      if (newScore >= WIN_COUNT) {
        setWon(true);
        setGameOver(true);
        setFood({ x: -1, y: -1, value: 0, multiplier: nextMultiplier });
      } else {
        setFood(makeFood(table, nextMultiplier, newBody));
        if (newScore % LEVEL_SIZE === 0) {
          const newLevel = Math.floor(newScore / LEVEL_SIZE) + 1;
          setLevelUpFlash(newLevel);
          cbRef.current.onVibrate([0, 40, 60, 40]);
          setTimeout(() => setLevelUpFlash(0), 1400);
        }
      }
    }
  }, [table]);

  useEffect(() => {
    if (gameOver || paused) return;
    const id = setInterval(tick, tickMs);
    return () => clearInterval(id);
  }, [tick, tickMs, gameOver, paused]);

  // Auto-advance the loss reveal to the Game Over card after a short beat.
  useEffect(() => {
    if (!reviewing) return;
    const id = setTimeout(() => setReviewing(false), REVEAL_MS);
    return () => clearTimeout(id);
  }, [reviewing]);

  // When the Game Over card appears, pop it in and fire the celebration once.
  useEffect(() => {
    if (gameOver && !reviewing) {
      if (!celebratedRef.current) {
        celebratedRef.current = true;
        const c = celebrationFor(scoreRef.current, won);
        if (c.won) cbRef.current.onWin();
        else cbRef.current.onPraise(c.tier.headline);
        if (c.claps) cbRef.current.onVibrate([0, 60, 70, 60, 70, 140]);
      }
      cardAnim.setValue(0);
      Animated.spring(cardAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } else if (!gameOver) {
      celebratedRef.current = false;
    }
  }, [gameOver, reviewing, won, cardAnim]);

  const reset = () => {
    const s = initialSnake();
    setSnake(s);
    setFood(makeFood(table, 1, s));
    dirRef.current = DIR.RIGHT;
    pendingDirRef.current = DIR.RIGHT;
    setScore(0);
    setEaten([]);
    setGameOver(false);
    setWon(false);
    setReviewing(false);
    setLevelUpFlash(0);
    setPaused(false);
    setCeleb(pickCeleb());
    setRevealOrder(makeRevealOrder());
    celebratedRef.current = false;
  };

  const setDirection = (d) => {
    if (gameOver) return;
    if (isReverse(d, dirRef.current)) return;
    pendingDirRef.current = d;
  };


  const foodColors = (SHAPES[table] || SHAPES[2]).colors;
  const party = celebrationFor(score, won);
  const currentLevel = Math.min(
    MAX_LEVEL,
    Math.floor(score / LEVEL_SIZE) + 1
  );
  const scale = 0.78 + (currentLevel - 1) * 0.055; // 0.78, 0.835, 0.89, 0.945, 1.0
  const cellSize = CELL * scale;
  const cellOffset = (CELL - cellSize) / 2;
  const snakeCells = snake.map((seg, i) => {
    const t = snake.length > 1 ? i / (snake.length - 1) : 0;
    const isHead = i === 0;
    const color = blendHex(foodColors[0], foodColors[1], t);
    return (
      <View
        key={`s-${i}`}
        style={[
          styles.cell,
          {
            left: seg.x * CELL + cellOffset,
            top: seg.y * CELL + cellOffset,
            width: cellSize,
            height: cellSize,
            backgroundColor: color,
            borderRadius: isHead ? cellSize * 0.42 : cellSize * 0.28,
            shadowColor: '#000',
            // Outline every segment so the snake stays readable over the
            // revealed picture even when their colours are similar.
            borderWidth: isHead ? 2 : 1.5,
            borderColor: isHead
              ? 'rgba(255,255,255,0.9)'
              : 'rgba(0,0,0,0.55)',
          },
        ]}
      />
    );
  });

  const seqScrollRef = useRef(null);
  useEffect(() => {
    seqScrollRef.current?.scrollToEnd({ animated: true });
  }, [eaten.length]);

  return (
    <View style={[styles.container, { paddingTop: TOP_PAD }]}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onMenu} style={styles.menuBtn}>
          <Text style={styles.menuBtnTxt}>‹ MENU</Text>
        </TouchableOpacity>
        <Text style={styles.diffTag}>× {table}  TABLE</Text>
        <View style={styles.toggleRow}>
          <ToggleBtn label="♪" enabled={musicEnabled} onPress={onToggleMusic} />
          <ToggleBtn
            label="123"
            enabled={voiceEnabled}
            onPress={onToggleVoice}
            small
          />
        </View>
      </View>

      <View style={styles.scoreRow}>
        <ScoreCard label="LEVEL" value={`${Math.min(MAX_LEVEL, Math.floor(score / LEVEL_SIZE) + 1)}/${MAX_LEVEL}`} />
        <ScoreCard
          label="NEXT"
          value={won ? '★' : food.value}
          highlight={foodColors}
        />
        <ScoreCard label="BEST" value={Math.max(bestScore, score)} />
        <TouchableOpacity
          onPress={() => {
            if (!gameOver) setPaused((p) => !p);
          }}
          activeOpacity={0.7}
          style={[styles.pauseBtn, paused && styles.pauseBtnActive]}
        >
          <Text style={styles.pauseBtnTxt}>{paused ? '▶' : 'II'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.seqWrap}>
        <Text style={styles.seqLabel}>× {table} =</Text>
        <ScrollView
          ref={seqScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.seqScroll}
          contentContainerStyle={styles.seqContent}
        >
          {eaten.map((n, i) => (
            <View
              key={`e-${i}`}
              style={[
                styles.seqPill,
                {
                  backgroundColor: foodColors[1],
                  borderColor: foodColors[0],
                },
              ]}
            >
              <Text style={styles.seqPillTxt}>{n}</Text>
            </View>
          ))}
          {eaten.length === 0 && (
            <Text style={styles.seqEmpty}>eat to start the sequence…</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.boardWrap}>
        <View style={[styles.board, { width: BOARD_W, height: BOARD_H }]}>
          <BoardPuzzle
            celeb={celeb}
            revealedCount={revealedTilesForScore(score)}
            revealOrder={revealOrder}
          />
          <View style={styles.boardScrim} pointerEvents="none" />
          {!won && (
            <View
              style={[
                styles.foodWrap,
                {
                  left: food.x * CELL,
                  top: food.y * CELL,
                  width: CELL,
                  height: CELL,
                },
              ]}
            >
              <FoodShape table={table} size={cellSize} value={food.value} />
            </View>
          )}
          {snakeCells}
          {levelUpFlash > 0 && (
            <View style={styles.levelFlashWrap} pointerEvents="none">
              <Text style={styles.levelFlashTxt}>LEVEL {levelUpFlash}</Text>
            </View>
          )}
        </View>
      </View>

      <Joystick
        colors={foodColors}
        paused={paused}
        onDirection={setDirection}
        onVibrate={onVibrate}
      />

      {reviewing && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setReviewing(false)}
        >
          <Text style={styles.revealCaption}>YOU REVEALED</Text>
          <View style={styles.revealBox}>
            <BoardPuzzle
              celeb={celeb}
              revealedCount={revealedTilesForScore(score)}
              revealOrder={revealOrder}
              faceSize={REVEAL_SIZE * 0.5}
            />
          </View>
          <Text style={styles.revealSub}>
            Score {score} — keep playing to uncover more
          </Text>
          <Text style={styles.revealHint}>tap to continue</Text>
        </TouchableOpacity>
      )}

      {gameOver && !reviewing && (
        <View style={styles.overlay}>
          {party.confetti && (
            <CelebrationLayer kind="confetti" count={26} colors={CONFETTI_COLORS} />
          )}
          {party.sprinkles && (
            <CelebrationLayer kind="sprinkle" count={22} colors={SPRINKLE_COLORS} />
          )}
          {party.chocolate && <CelebrationLayer kind="chocolate" count={14} />}
          {party.won && <AudienceCheer />}

          <Animated.View
            style={{
              opacity: cardAnim,
              transform: [
                {
                  scale: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
              ],
            }}
          >
            <LinearGradient
              colors={party.grad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.modal,
                styles.gameOverCard,
                { shadowColor: party.grad[1] },
              ]}
            >
              <PulseBadge emoji={party.tier.badge} won={party.won} />
              <Text style={styles.gameOverTitle}>{party.tier.headline}</Text>
              <Text style={styles.gameOverTagline}>{party.tier.tagline}</Text>

              <View style={styles.statRow}>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>SCORE</Text>
                  <Text style={styles.statValue}>{score}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>BEST</Text>
                  <Text style={styles.statValue}>{Math.max(bestScore, score)}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>LEVEL</Text>
                  <Text style={styles.statValue}>
                    {party.reached}/{MAX_LEVEL}
                  </Text>
                </View>
              </View>

              <View style={styles.celebReveal}>
                <Text style={styles.celebRevealLabel}>
                  {won ? 'YOU FULLY REVEALED' : 'YOU WERE UNCOVERING'}
                </Text>
                <Text style={styles.gameOverCeleb}>{celeb.name}</Text>
                <Text style={styles.gameOverCelebSub}>
                  {celeb.country}  {celeb.emoji}
                </Text>
              </View>

              <View style={styles.gameOverBtnRow}>
                <TouchableOpacity
                  onPress={reset}
                  activeOpacity={0.85}
                  style={[styles.restartBtn, styles.restartBtnPrimary]}
                >
                  <Text style={styles.restartTxt}>PLAY AGAIN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onMenu}
                  activeOpacity={0.85}
                  style={[styles.restartBtn, styles.menuModalBtn]}
                >
                  <Text style={styles.restartTxt}>MAIN MENU</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      )}

      {paused && !gameOver && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setPaused(false)}
        >
          <View style={styles.pauseBadge} pointerEvents="none">
            <Text style={styles.pauseTxt}>PAUSED</Text>
            <Text style={styles.pauseHint}>tap anywhere to resume</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

function FaceAvatar({ hair, skin, size = 60 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M 50,3 C 22,3 12,30 16,58 L 22,52 C 24,38 30,32 32,32 L 68,32 C 70,32 76,38 78,52 L 84,58 C 88,30 78,3 50,3 Z"
        fill={hair}
      />
      <Circle cx={50} cy={52} r={30} fill={skin} />
      <Circle cx={50} cy={52} r={30} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={1.5} />
      <Circle cx={40} cy={50} r={3.5} fill="#1a1a1a" />
      <Circle cx={60} cy={50} r={3.5} fill="#1a1a1a" />
      <Path d="M 41,68 Q 50,73 59,68" stroke="#5a2828" strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function BoardPuzzle({ celeb, revealedCount, revealOrder, faceSize }) {
  if (!celeb) return null;
  const revealedSet = new Set(revealOrder.slice(0, revealedCount));
  const total = PUZZLE_COLS * PUZZLE_ROWS;
  const tiles = [];
  for (let i = 0; i < total; i++) {
    if (revealedSet.has(i)) continue;
    const row = Math.floor(i / PUZZLE_COLS);
    const col = i % PUZZLE_COLS;
    tiles.push(
      <View
        key={i}
        style={[
          styles.puzzleTile,
          {
            top: `${(row / PUZZLE_ROWS) * 100}%`,
            left: `${(col / PUZZLE_COLS) * 100}%`,
            width: `${100 / PUZZLE_COLS}%`,
            height: `${100 / PUZZLE_ROWS}%`,
          },
        ]}
      />
    );
  }
  const fSize = faceSize != null ? faceSize : Math.min(BOARD_W, BOARD_H) * 0.5;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={celeb.flag}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.boardPuzzleBg}
      >
        <FaceAvatar hair={celeb.hair} skin={celeb.skin} size={fSize} />
        <Text
          style={styles.boardPuzzleName}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {celeb.name}
        </Text>
        <Text style={styles.boardPuzzleCountry} numberOfLines={1}>
          {celeb.country}  {celeb.emoji}
        </Text>
      </LinearGradient>
      {tiles}
    </View>
  );
}

function ScoreCard({ label, value, highlight }) {
  return (
    <View
      style={[
        styles.scoreCard,
        highlight && {
          backgroundColor: highlight[1] + '44',
          borderColor: highlight[0],
        },
      ]}
    >
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={styles.scoreVal}>{value}</Text>
    </View>
  );
}

const JOY_MAX = 70;

function Joystick({ colors, paused, onDirection, onVibrate }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const lastDirRef = useRef(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setKnob({ x: 0, y: 0 });
        lastDirRef.current = null;
      },
      onPanResponderMove: (_, g) => {
        const mag = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
        let kx = g.dx;
        let ky = g.dy;
        if (mag > JOY_MAX) {
          kx = (g.dx / mag) * JOY_MAX;
          ky = (g.dy / mag) * JOY_MAX;
        }
        setKnob({ x: kx, y: ky });
        if (mag < JOYSTICK_DEADZONE) return;
        const newDir =
          Math.abs(g.dx) > Math.abs(g.dy)
            ? g.dx > 0 ? DIR.RIGHT : DIR.LEFT
            : g.dy > 0 ? DIR.DOWN : DIR.UP;
        if (newDir !== lastDirRef.current) {
          onVibrate(10);
          lastDirRef.current = newDir;
        }
        onDirection(newDir);
      },
      onPanResponderRelease: () => {
        setKnob({ x: 0, y: 0 });
      },
    })
  ).current;

  return (
    <View style={styles.joyOuter} {...panResponder.panHandlers}>
      <View style={styles.joyBase}>
        <Text style={[styles.joyArrow, styles.joyArrowUp]}>↑</Text>
        <Text style={[styles.joyArrow, styles.joyArrowDown]}>↓</Text>
        <Text style={[styles.joyArrow, styles.joyArrowLeft]}>←</Text>
        <Text style={[styles.joyArrow, styles.joyArrowRight]}>→</Text>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.joyKnob,
            {
              transform: [{ translateX: knob.x }, { translateY: knob.y }],
              shadowColor: colors[0],
            },
          ]}
        >
          <Text style={styles.joyKnobIcon}>{paused ? '▶' : '✦'}</Text>
        </LinearGradient>
      </View>
    </View>
  );
}

// ---- Game-over celebration visuals ----

// One piece (confetti rect, sprinkle capsule, or chocolate emoji) that falls
// from above the screen, drifting sideways and spinning, then loops.
function FallingPiece({ cfg }) {
  const fall = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(fall, {
        toValue: 1,
        duration: cfg.duration,
        delay: cfg.delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [fall, cfg]);

  const translateY = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, SCREEN_H + 60],
  });
  const translateX = fall.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [cfg.x, cfg.x + cfg.drift, cfg.x],
  });
  const rotate = fall.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${cfg.spin}deg`],
  });
  const base = {
    position: 'absolute',
    top: 0,
    left: 0,
    transform: [{ translateX }, { translateY }, { rotate }],
  };

  if (cfg.kind === 'chocolate') {
    return <Animated.Text style={[base, { fontSize: cfg.size }]}>{cfg.emoji}</Animated.Text>;
  }
  if (cfg.kind === 'sprinkle') {
    return (
      <Animated.View
        style={[
          base,
          { width: 4, height: cfg.size, borderRadius: 4, backgroundColor: cfg.color },
        ]}
      />
    );
  }
  return (
    <Animated.View
      style={[
        base,
        {
          width: cfg.size * 0.62,
          height: cfg.size,
          borderRadius: 2,
          backgroundColor: cfg.color,
        },
      ]}
    />
  );
}

function CelebrationLayer({ kind, count, colors }) {
  const pieces = useRef(
    Array.from({ length: count }, () => ({
      kind,
      x: Math.random() * SCREEN_W,
      drift: (Math.random() * 2 - 1) * 70,
      spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
      duration: 2200 + Math.random() * 2400,
      delay: Math.random() * 2600,
      size:
        kind === 'chocolate'
          ? 20 + Math.random() * 16
          : kind === 'sprinkle'
          ? 10 + Math.random() * 8
          : 9 + Math.random() * 8,
      color: colors ? colors[Math.floor(Math.random() * colors.length)] : '#fff',
      emoji: CHOCOLATE_EMOJIS[Math.floor(Math.random() * CHOCOLATE_EMOJIS.length)],
    }))
  ).current;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((cfg, i) => (
        <FallingPiece key={i} cfg={cfg} />
      ))}
    </View>
  );
}

const CHEER_WORDS = ['BRAVO!', 'WOW!', '👏', '🎉', 'SUPERB!', '⭐', 'AMAZING!', '🙌'];

// A single cheer that floats up from the bottom and fades — like a shout from
// the crowd. Loops with a stagger so the audience never goes quiet.
function FloatingCheer({ cfg }) {
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rise, {
        toValue: 1,
        duration: cfg.duration,
        delay: cfg.delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [rise, cfg]);
  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [0, -180] });
  const opacity = rise.interpolate({
    inputRange: [0, 0.15, 0.75, 1],
    outputRange: [0, 1, 1, 0],
  });
  return (
    <Animated.Text
      style={{
        position: 'absolute',
        bottom: cfg.bottom,
        left: cfg.x,
        opacity,
        transform: [{ translateY }],
        color: cfg.color,
        fontSize: cfg.size,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 6,
      }}
    >
      {cfg.text}
    </Animated.Text>
  );
}

function AudienceCheer() {
  const cheers = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      text: CHEER_WORDS[i % CHEER_WORDS.length],
      x: 12 + Math.random() * (SCREEN_W - 80),
      bottom: 40 + Math.random() * 90,
      size: 18 + Math.random() * 14,
      duration: 1800 + Math.random() * 1400,
      delay: Math.random() * 2400,
      color: ['#ffd200', '#ff7ad9', '#7afcff', '#fff', '#9dff7a'][i % 5],
    }))
  ).current;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {cheers.map((cfg, i) => (
        <FloatingCheer key={i} cfg={cfg} />
      ))}
    </View>
  );
}

// The badge medal/trophy at the top of the card, gently pulsing.
function PulseBadge({ emoji, won }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[
        styles.badgeCircle,
        won && styles.badgeCircleWin,
        { transform: [{ scale: pulse }] },
      ]}
    >
      <Text style={[styles.badgeEmoji, won && styles.badgeEmojiWin]}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLettersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splashLetter: {
    color: '#fff',
    fontSize: 96,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(120, 220, 255, 0.85)',
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
    marginHorizontal: 2,
  },
  splashGames: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 14,
    marginTop: 4,
    textShadowColor: 'rgba(238,9,121,0.7)',
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
  splashTagline: {
    color: '#a8b0ff',
    fontSize: 13,
    letterSpacing: 4,
    marginTop: 28,
    textTransform: 'uppercase',
  },
  splashSubtitle: {
    color: '#fff',
    fontSize: 14,
    letterSpacing: 3,
    marginTop: 8,
    opacity: 0.85,
    fontWeight: '700',
  },
  letsGoBtnWrap: {
    shadowColor: '#ff6a00',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  letsGoBtn: {
    paddingHorizontal: 44,
    paddingVertical: 18,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  letsGoTxt: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 18,
  },
  menuContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  menuHeader: { flex: 1, alignItems: 'center' },
  menuTitle: {
    color: '#fff',
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 8,
    textShadowColor: 'rgba(120, 220, 255, 0.65)',
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
  },
  menuSubtitle: {
    color: '#a8b0ff',
    fontSize: 13,
    letterSpacing: 4,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  tableGridWrap: { alignItems: 'center', width: '100%', paddingHorizontal: 18 },
  pickHint: {
    color: '#fff',
    fontSize: 26,
    letterSpacing: 4,
    fontWeight: '900',
    marginBottom: 14,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(120,220,255,0.55)',
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tableBtnWrap: { width: '32%', aspectRatio: 1, padding: 5 },
  tableBtn: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
  },
  tableBtnLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  tableBtnBest: {
    color: '#a8b0ff',
    fontSize: 10,
    marginTop: 1,
    fontWeight: '700',
    letterSpacing: 1,
  },
  menuFooter: { alignItems: 'center' },
  menuHint: { color: '#a8b0ff', fontSize: 12, marginTop: 2 },

  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
    marginLeft: 6,
  },
  toggleBtnSmall: { width: 44, height: 44 },
  toggleBtnOff: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.10)',
  },
  toggleTxt: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  toggleTxtSmall: { fontSize: 13, letterSpacing: 0.5 },
  toggleTxtOff: { color: 'rgba(255,255,255,0.35)' },

  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 18,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 14,
  },
  menuBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    minWidth: 80,
  },
  menuBtnTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  diffTag: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
  },
  scoreRow: { flexDirection: 'row', marginTop: 4, alignItems: 'center' },
  pauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginLeft: 5,
  },
  pauseBtnActive: {
    backgroundColor: 'rgba(56,239,125,0.7)',
    borderColor: '#fff',
  },
  pauseBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  scoreCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    marginHorizontal: 5,
    minWidth: 80,
  },
  scoreLabel: {
    color: '#a8b0ff',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  scoreVal: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },

  boardPuzzleBg: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  boardPuzzleName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  boardPuzzleCountry: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
  },
  puzzleTile: {
    position: 'absolute',
    backgroundColor: '#1a1530',
    borderWidth: 0.5,
    borderColor: '#0a0820',
  },
  seqWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 14,
    marginTop: 2,
  },
  seqLabel: {
    color: '#a8b0ff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginRight: 8,
  },
  seqScroll: { flex: 1, height: 38 },
  seqContent: { alignItems: 'center', paddingRight: 12 },
  seqPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1,
    minWidth: 36,
    alignItems: 'center',
  },
  seqPillTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 2,
  },
  seqEmpty: {
    color: '#777a99',
    fontSize: 12,
    fontStyle: 'italic',
  },

  boardWrap: { alignItems: 'center', justifyContent: 'center' },
  board: {
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  cell: {
    position: 'absolute',
    shadowOpacity: 0.85,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  foodWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapeText: {
    color: '#fff',
    fontWeight: '900',
    position: 'absolute',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 },
  },
  joyOuter: { alignItems: 'center', justifyContent: 'center', padding: 10 },
  joyBase: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joyArrow: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 22,
    fontWeight: '900',
  },
  joyArrowUp: { top: 8 },
  joyArrowDown: { bottom: 8 },
  joyArrowLeft: { left: 14 },
  joyArrowRight: { right: 14 },
  joyKnob: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  joyKnobIcon: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 26,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    paddingHorizontal: 36,
    paddingVertical: 30,
    borderRadius: 24,
    alignItems: 'center',
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  gameOverCard: {
    width: Math.min(SCREEN_W - 36, 360),
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  badgeCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  badgeCircleWin: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderColor: '#fff5cc',
  },
  badgeEmoji: { fontSize: 44 },
  badgeEmojiWin: { fontSize: 56 },
  gameOverTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 2 },
  },
  gameOverTagline: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
  },
  statRow: {
    flexDirection: 'row',
    marginTop: 18,
    justifyContent: 'center',
  },
  statChip: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    minWidth: 78,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  celebReveal: {
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'stretch',
  },
  celebRevealLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  gameOverCeleb: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
    letterSpacing: 1,
    textAlign: 'center',
  },
  gameOverCelebSub: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '700',
  },
  gameOverBtnRow: { flexDirection: 'row', marginTop: 22 },
  restartBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    marginHorizontal: 5,
  },
  restartBtnPrimary: { backgroundColor: 'rgba(255,255,255,0.32)' },
  menuModalBtn: { backgroundColor: 'rgba(0,0,0,0.25)' },
  restartTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  pauseBadge: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  pauseTxt: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 4,
  },
  pauseHint: { color: '#a8b0ff', fontSize: 12, marginTop: 4 },
  levelFlashWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelFlashTxt: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 6,
    textShadowColor: 'rgba(120, 220, 255, 0.95)',
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },

  // ---- Settings: menu gear button ----
  gearBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  gearTxt: { color: '#fff', fontSize: 22, fontWeight: '900' },

  // ---- Settings: toggle switch ----
  switchTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchTrackOn: { backgroundColor: '#38ef7d', justifyContent: 'flex-end' },
  switchTrackOff: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'flex-start',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },

  // ---- Settings: screen ----
  setContainer: { flex: 1 },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  setTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
  },
  setScroll: { flex: 1, width: '100%' },
  setScrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  setSectionTitle: {
    color: '#a8b0ff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  setCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  setRowIcon: { fontSize: 20, width: 30, textAlign: 'center' },
  setRowText: { flex: 1, marginLeft: 8 },
  setRowLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  setRowLabelDanger: { color: '#ff8a8a' },
  setRowSub: {
    color: '#9b9ec2',
    fontSize: 12,
    marginTop: 2,
  },
  setRowRight: { marginLeft: 10, alignItems: 'flex-end' },
  setValue: {
    color: '#a8b0ff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  setChevron: { color: 'rgba(255,255,255,0.4)', fontSize: 24, fontWeight: '700' },

  // ---- Settings: profile ----
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(120,220,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(120,220,255,0.5)',
  },
  profileAvatarTxt: { color: '#fff', fontSize: 24, fontWeight: '900' },
  profileText: { flex: 1, marginLeft: 14 },
  profileName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  profileStatus: { color: '#9b9ec2', fontSize: 12, marginTop: 2 },
  setFooter: {
    color: '#6f7299',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 1,
  },

  // ---- Settings: dialogs ----
  dialogCard: {
    width: '84%',
    backgroundColor: '#221d3f',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  dialogTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dialogSub: {
    color: '#b6b8d8',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
  },
  input: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dialogBtnRow: { flexDirection: 'row', marginTop: 18, justifyContent: 'flex-end' },
  dialogBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    marginLeft: 10,
    alignItems: 'center',
  },
  dialogBtnGhost: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dialogBtnPrimary: { backgroundColor: '#5b86e5' },
  dialogBtnTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  legalCard: {
    width: '88%',
    maxHeight: '78%',
    backgroundColor: '#221d3f',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  legalScroll: { marginTop: 14 },
  legalText: { color: '#d4d6f0', fontSize: 13, lineHeight: 20 },
  tutStep: {
    color: '#e6e7fb',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },

  // ---- Picture/snake contrast + loss reveal ----
  boardScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  revealCaption: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 16,
    textShadowColor: 'rgba(120,220,255,0.8)',
    textShadowRadius: 12,
  },
  revealBox: {
    width: REVEAL_SIZE,
    height: REVEAL_SIZE,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: '#1a1530',
  },
  revealSub: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 18,
    opacity: 0.95,
  },
  revealHint: {
    color: '#a8b0ff',
    fontSize: 12,
    marginTop: 8,
    letterSpacing: 1,
  },
});
