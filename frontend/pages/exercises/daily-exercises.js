// ============================================
// DAILY EXERCISES - JavaScript Logic  
// Version: 10.1 - January 2026
// ChessTempo-style PGN display with CLICKABLE VARIATION MOVES
// Uses event delegation for better security (no inline onclick)
// ============================================

const getPgnApiUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'superchessprep.com' || hostname === 'www.superchessprep.com') {
    return 'https://pgn.superchessprep.com/api';
  }
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3005/api';
  }
  if (hostname.includes('152.53.186.105')) {
    return `http://${hostname}:3005/api`;
  }
  return 'http://localhost:3005/api';
};

const PGN_API_URL = getPgnApiUrl();
let exercises = [];
let filteredExercises = [];
let currentExercise = null;
let currentBoard = null;
let currentMoveIndex = 0;
let currentUserTier = 'free';
let currentViewAs = null;
let mainlineMoves = [];
let mainlineFens = [];

// Track if we're currently viewing a variation
let isInVariation = false;
let lastClickedElement = null;

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }
  
  await updateAuthUI();
  await fetchExercises();
});

// ============================================
// GLOBAL CLICK HANDLER (most reliable method)
// Catches all clicks on the document
// ============================================

document.addEventListener('click', function(e) {
  const target = e.target;
  
  // Handle variation toggle (+/- buttons)
  if (target.classList && target.classList.contains('variation-toggle')) {
    e.preventDefault();
    e.stopPropagation();
    Logger.debug('[Daily Exercises] Toggle clicked via global handler');
    toggleVariation(target);
    return;
  }
  
  // Handle mainline move clicks
  if (target.classList && target.classList.contains('move-link')) {
    e.preventDefault();
    const index = parseInt(target.dataset.index);
    if (!isNaN(index)) {
      goToMove(index);
    }
    return;
  }
  
  // Handle variation move clicks
  if (target.classList && target.classList.contains('variation-move') && target.classList.contains('clickable')) {
    e.preventDefault();
    const fen = target.dataset.fen;
    if (fen) {
      goToPosition(fen, target);
    }
    return;
  }
});

// ============================================
// EVENT DELEGATION FOR MOVES (backup)
// This handles all click events on moves/variations
// Called after HTML is inserted into the container
// ============================================

let moveHandlersInitialized = false;

function setupMoveClickHandlers() {
  const container = document.getElementById('movesContent');
  if (!container) {
    Logger.warn('[Daily Exercises] movesContent container not found');
    return;
  }
  
  // Avoid adding multiple listeners
  if (moveHandlersInitialized) return;
  moveHandlersInitialized = true;
  
  Logger.debug('[Daily Exercises] Setting up container click handlers');
  
  // Use event delegation on the container
  container.addEventListener('click', (e) => {
    const target = e.target;
    
    // Handle variation toggle (+/- buttons)
    if (target.classList.contains('variation-toggle')) {
      e.preventDefault();
      e.stopPropagation();
      Logger.debug('[Daily Exercises] Toggle clicked via container handler');
      toggleVariation(target);
      return;
    }
    
    // Handle mainline move clicks
    if (target.classList.contains('move-link')) {
      e.preventDefault();
      const index = parseInt(target.dataset.index);
      if (!isNaN(index)) {
        goToMove(index);
      }
      return;
    }
    
    // Handle variation move clicks
    if (target.classList.contains('variation-move') && target.classList.contains('clickable')) {
      e.preventDefault();
      const fen = target.dataset.fen;
      if (fen) {
        goToPosition(fen, target);
      }
      return;
    }
  });
  
  Logger.debug('[Daily Exercises] Move click handlers initialized');
}

// ============================================
// AUTH UI
// ============================================

async function updateAuthUI() {
  const user = Auth.getCurrentUser();
  if (user) {
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    const usernameDisplayEl = document.getElementById('usernameDisplay');
    const emailDisplayEl = document.getElementById('emailDisplay');
    
    if (userNameEl) userNameEl.textContent = user.username;
    if (userAvatarEl) userAvatarEl.textContent = user.username.charAt(0).toUpperCase();
    if (usernameDisplayEl) usernameDisplayEl.textContent = user.username;
    if (emailDisplayEl) emailDisplayEl.textContent = user.email;
    
    if (user.role === 'admin') {
      const adminLink = document.getElementById('adminPanelLink');
      if (adminLink) adminLink.style.display = 'flex';
    }
  }
}

function toggleUserMenu() {
  const menu = document.getElementById('userDropdownMenu');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('userDropdownMenu');
  const button = document.querySelector('.user-menu-button');
  if (menu && button && !menu.contains(e.target) && !button.contains(e.target)) {
    menu.style.display = 'none';
  }
});

async function handleLogout() {
  try {
    await Auth.logout();
    window.location.href = '/';
  } catch (error) {
    Logger.error('Logout error:', error);
  }
}

// ============================================
// ADMIN VIEW
// ============================================

async function handleAdminViewChange() {
  const selector = document.getElementById('adminViewAsSelect');
  if (!selector) return;
  currentViewAs = selector.value === 'admin' ? null : selector.value;
  await fetchExercises();
}

// ============================================
// FETCH EXERCISES
// ============================================

async function fetchExercises() {
  try {
    const token = Auth.storage.getToken();
    if (!token) {
      window.location.href = '/';
      return;
    }
    
    const loadingEl = document.getElementById('loadingState');
    if (loadingEl) loadingEl.style.display = 'block';
    
    let apiUrl = `${PGN_API_URL}/exercises/daily`;
    if (currentViewAs) apiUrl += `?viewAs=${currentViewAs}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        Auth.storage.clearAll();
        window.location.href = '/';
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }
    
    const apiResponse = await response.json();
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || 'Failed to fetch');
    }
    
    const data = {
      exercises: apiResponse.data?.exercises || [],
      tier: apiResponse.data?.userTier || 'free',
      maxExercises: apiResponse.data?.limit || 0
    };
    
    currentUserTier = data.tier;
    
    if (loadingEl) loadingEl.style.display = 'none';
    
    const user = Auth.getCurrentUser();
    const isAdmin = user && user.role === 'admin';
    
    if (isAdmin) {
      const adminSelector = document.getElementById('adminTierSelector');
      if (adminSelector) adminSelector.style.display = 'flex';
    }
    
    if (data.tier === 'free' && data.exercises.length === 0) {
      showUpgradeMessage();
      return;
    }
    
    updateTierBadge(data.tier, data.exercises.length, data.maxExercises);
    
    exercises = data.exercises;
    filteredExercises = [...exercises];
    populateDropdown(filteredExercises);
    
    const container = document.getElementById('exercisesContainer');
    if (container) container.style.display = 'block';
    
    if (!isAdmin && (data.tier === 'basic' || data.tier === 'premium')) {
      showTierUpgradeMessage(data.tier);
    }
    
  } catch (error) {
    Logger.error('Error:', error);
    const loadingEl = document.getElementById('loadingState');
    if (loadingEl) {
      loadingEl.innerHTML = `<p style="color:#ff6347;">Error: ${SafeHTML.escapeText(error.message)}</p>
        <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;background:rgba(255,140,0,0.2);border:1px solid #ff8c00;border-radius:10px;color:#ff8c00;cursor:pointer;">Retry</button>`;
    }
  }
}

// ============================================
// DROPDOWN
// ============================================

function populateDropdown(list) {
  const dropdown = document.getElementById('pgnDropdown');
  if (!dropdown) return;
  
  SafeHTML.setHTML(dropdown, '<option value="">-- Choose an exercise --</option>');
  
  list.forEach((ex, idx) => {
    const option = document.createElement('option');
    const origIdx = exercises.findIndex(e => e.id === ex.id);
    option.value = origIdx !== -1 ? origIdx : idx;
    option.textContent = `${idx + 1}. ${ex.title || 'Untitled'}`;
    dropdown.appendChild(option);
  });
}

function filterExercises() {
  const input = document.getElementById('pgnSearchInput');
  const term = input ? input.value.toLowerCase().trim() : '';
  
  filteredExercises = term ? exercises.filter(ex => 
    (ex.title || '').toLowerCase().includes(term) ||
    (ex.event_name || '').toLowerCase().includes(term) ||
    (ex.eco || '').toLowerCase().includes(term)
  ) : [...exercises];
  
  populateDropdown(filteredExercises);
}

function handleExerciseSelect() {
  const dropdown = document.getElementById('pgnDropdown');
  if (!dropdown || dropdown.value === '') {
    hideBoard();
    return;
  }
  
  const exercise = exercises[parseInt(dropdown.value)];
  if (exercise) showBoard(exercise);
}

// ============================================
// SHOW/HIDE BOARD
// ============================================

function showBoard(exercise) {
  currentExercise = exercise;
  
  const placeholder = document.getElementById('boardPlaceholder');
  const container = document.getElementById('boardSidelinesContainer');
  
  if (placeholder) placeholder.style.display = 'none';
  if (container) container.style.display = 'grid';
  
  const headers = parsePgnHeaders(exercise.pgn_content);
  updateExerciseHeader(headers, exercise);
  initializeChessBoard(exercise);
  renderMoveList(exercise.pgn_content);
}

function hideBoard() {
  const placeholder = document.getElementById('boardPlaceholder');
  const container = document.getElementById('boardSidelinesContainer');
  
  if (placeholder) placeholder.style.display = 'flex';
  if (container) container.style.display = 'none';
  
  if (currentBoard) {
    currentBoard.destroy();
    currentBoard = null;
  }
  
  currentExercise = null;
  currentMoveIndex = 0;
  mainlineMoves = [];
  mainlineFens = [];
  isInVariation = false;
  lastClickedElement = null;
}

// ============================================
// PARSE PGN HEADERS
// ============================================

function parsePgnHeaders(pgn) {
  const headers = {};
  if (!pgn) return headers;
  
  const regex = /\[(\w+)\s+"([^"]*)"\]/g;
  let m;
  while ((m = regex.exec(pgn)) !== null) {
    headers[m[1]] = m[2];
  }
  return headers;
}

// ============================================
// UPDATE HEADER
// ============================================

function updateExerciseHeader(headers, exercise) {
  const boardTitle = document.getElementById('boardTitle');
  if (boardTitle) {
    const white = headers.White || '';
    const black = headers.Black || '';
    const result = headers.Result || '*';
    boardTitle.textContent = `${white} - ${black} ${result}`;
  }
  
  const subtitle = document.getElementById('panelSubtitle');
  if (subtitle) {
    const event = (headers.Event && headers.Event !== '?') ? headers.Event : '';
    const eco = (headers.ECO && headers.ECO !== '?') ? headers.ECO : '';
    const date = (headers.Date && headers.Date !== '????.??.??') ? headers.Date : '';
    
    let parts = [];
    if (event) parts.push(event);
    if (eco) parts.push(eco);
    if (date) parts.push(date);
    
    subtitle.textContent = parts.join(' • ') || exercise.title || '';
  }
}

// ============================================
// EXTRACT MAINLINE MOVES (improved algorithm)
// ============================================

function extractMainlineMoves(pgn) {
  if (!pgn) return [];
  
  // Remove headers
  let text = pgn.replace(/\[[^\]]+\]\s*/g, '').trim();
  
  // Process character by character to properly handle nesting
  let result = '';
  let depth = 0;        // Parenthesis depth for variations
  let inComment = false; // Inside {...} comment
  
  for (let and = 0; and < text.length; i++) {
    const char = text[i];
    
    if (char === '{' && !inComment) {
      inComment = true;
      continue;
    }
    if (char === '}' && inComment) {
      inComment = false;
      result += ' ';
      continue;
    }
    
    if (inComment) continue;
    
    if (char === '(') {
      depth++;
      continue;
    }
    if (char === ')') {
      depth--;
      result += ' ';
      continue;
    }
    
    // Only include mainline characters (depth === 0)
    if (depth === 0) {
      result += char;
    }
  }
  
  // Remove NAGs ($1, $14, etc)
  result = result.replace(/\$\d+/g, ' ');
  
  // Remove result
  result = result.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '');
  
  // Clean up whitespace
  result = result.replace(/\s+/g, ' ').trim();
  
  // Extract moves
  const moves = [];
  const moveRegex = /(?:\d+\.+\s*)?([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O-O|O-O)/g;
  
  let match;
  while ((match = moveRegex.exec(result)) !== null) {
    moves.push(match[1]);
  }
  
  return moves;
}

// ============================================
// INITIALIZE CHESS BOARD
// ============================================

function initializeChessBoard(exercise) {
  try {
    // Extract mainline moves using our improved algorithm
    const extractedMoves = extractMainlineMoves(exercise.pgn_content);
    // Validate moves with chess.js and build FEN positions
    const game = new Chess();
    mainlineMoves = [];
    mainlineFens = [game.fen()]; // Starting position
    
    for (const move of extractedMoves) {
      const result = game.move(move);
      if (result) {
        mainlineMoves.push(result.san);
        mainlineFens.push(game.fen());
      } else {
        Logger.warn('Invalid move skipped:', move);
      }
    }
    
    // Setup board
    if (currentBoard) currentBoard.destroy();
    
    currentBoard = Chessboard('chessboard', {
      position: 'start',
      draggable: false,
      pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    });
    
    currentMoveIndex = 0;
    isInVariation = false;
    lastClickedElement = null;
    updateMoveCounter();
    updateButtons();
    
  } catch (error) {
    Logger.error('Error initializing board:', error);
  }
}

// ============================================
// RENDER MOVE LIST (ChessTempo style)
// ============================================

function renderMoveList(pgn) {
  const container = document.getElementById('movesContent');
  if (!container) return;
  
  if (!pgn) {
    SafeHTML.setHTML(container, '<p style="color:#666;text-align:center;padding:20px;">No moves</p>');
    return;
  }
  
  // Remove headers
  let movesSection = pgn.replace(/\[[^\]]+\]\s*/g, '').trim();
  
  // Remove initial [%evp] comment
  movesSection = movesSection.replace(/^\{[^}]*\[%evp[^\]]*\][^}]*\}\s*/, '');
  
  // Parse and render with starting FEN
  const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const html = parseAndRenderPgn(movesSection, false, startFen);
  
  // Use SafeHTML with CHESS config (no onclick needed - using event delegation)
  SafeHTML.setHTML(container, html, SafeHTML.configs.CHESS);
  
  // Setup click handlers AFTER HTML is inserted
  setupMoveClickHandlers();
  
  // Also attach direct listeners to variation toggles as backup
  attachVariationToggleListeners();
  
  updateMovesHighlight();
}

// ============================================
// ATTACH VARIATION TOGGLE LISTENERS (backup method)
// Direct event listeners on each toggle button
// ============================================

function attachVariationToggleListeners() {
  const toggles = document.querySelectorAll('.variation-toggle');
  toggles.forEach(toggle => {
    // Remove existing listener if any (to avoid duplicates)
    toggle.removeEventListener('click', handleToggleClick);
    // Add new listener
    toggle.addEventListener('click', handleToggleClick);
  });
  
  if (toggles.length > 0) {
    Logger.debug(`[Daily Exercises] Attached listeners to ${toggles.length} variation toggles`);
  }
}

function handleToggleClick(e) {
  e.preventDefault();
  e.stopPropagation();
  toggleVariation(e.currentTarget);
}

// ============================================
// PARSE AND RENDER PGN (main recursive parser)
// Now tracks FEN positions for all moves
// NO INLINE ONCLICK - uses data attributes + event delegation
// ============================================

function parseAndRenderPgn(movesText, isVariation = false, startingFen = null) {
  let html = '';
  let pos = 0;
  let plyCount = 0;
  let lastShownMoveNum = 0;
  
  // Create a chess instance to track positions
  const game = new Chess();
  if (startingFen) {
    game.load(startingFen);
  }
  
  // Track position before each move for variations
  let lastFenBeforeMove = game.fen();
  
  while (pos < movesText.length) {
    // Skip whitespace
    while (pos < movesText.length && /\s/.test(movesText[pos])) pos++;
    if (pos >= movesText.length) break;
    
    const char = movesText[pos];
    
    // Comment {...} - INLINE
    if (char === '{') {
      const end = movesText.indexOf('}', pos);
      if (end === -1) break;
      
      let comment = movesText.slice(pos + 1, end).trim();
      comment = cleanComment(comment);
      
      if (comment) {
        html += `<span class="move-comment">${escapeHtml(comment)}</span> `;
      }
      pos = end + 1;
      continue;
    }
    
    // Variation (...) - recursive parse with current position
    if (char === '(') {
      const end = findMatchingParen(movesText, pos);
      if (end === -1) break;
      
      const varContent = movesText.slice(pos + 1, end).trim();
      // Pass the FEN from BEFORE the last mainline move (where variation branches off)
      html += renderVariation(varContent, lastFenBeforeMove);
      pos = end + 1;
      continue;
    }
    
    // Move number (e.g., "1." or "4..." or "4. ")
    const numMatch = movesText.slice(pos).match(/^(\d+)(\.+)\s*/);
    if (numMatch) {
      const moveNum = parseInt(numMatch[1]);
      const isBlackContinuation = numMatch[2].length > 1;
      
      if (isBlackContinuation) {
        html += `<span class="move-number">${moveNum}...</span>`;
      } else if (moveNum !== lastShownMoveNum) {
        html += `<span class="move-number">${moveNum}.</span>`;
        lastShownMoveNum = moveNum;
      }
      
      pos += numMatch[0].length;
      continue;
    }
    
    // Result
    const resMatch = movesText.slice(pos).match(/^(1-0|0-1|1\/2-1\/2|\*)/);
    if (resMatch) {
      pos += resMatch[0].length;
      continue;
    }
    
    // NAG ($1, $11, etc)
    const nagMatch = movesText.slice(pos).match(/^\$(\d+)/);
    if (nagMatch) {
      const symbol = convertNag(nagMatch[0]);
      if (symbol) {
        html += `<span class="move-nag">${symbol}</span>`;
      }
      pos += nagMatch[0].length;
      continue;
    }
    
    // Move with optional inline annotation (!?, !!, etc)
    const moveMatch = movesText.slice(pos).match(/^([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O-O|O-O)([!?]+)?/);
    if (moveMatch) {
      const san = moveMatch[1];
      const annotation = moveMatch[2] || '';
      
      // Store FEN before this move (for variations that branch after it)
      lastFenBeforeMove = game.fen();
      
      // Try to make the move
      const moveResult = game.move(san);
      
      if (moveResult) {
        const fenAfterMove = game.fen();
        
        if (isVariation) {
          // Variation moves - use data attributes (event delegation handles clicks)
          html += `<span class="variation-move clickable" data-fen="${fenAfterMove}" data-parent-fen="${lastFenBeforeMove}">${moveResult.san}${annotation}</span> `;
        } else {
          // Mainline moves - use data attributes (event delegation handles clicks)
          html += `<span class="move-link" data-index="${plyCount}" data-fen="${fenAfterMove}">${moveResult.san}${annotation}</span> `;
          plyCount++;
        }
      } else {
        // Invalid move - just display it without click
        html += `<span class="variation-move invalid">${san}${annotation}</span> `;
        Logger.warn('Invalid move in variation:', san);
      }
      
      pos += moveMatch[0].length;
      continue;
    }
    
    // Skip unknown character
    pos++;
  }
  
  return html;
}

// ============================================
// RENDER VARIATION (ChessTempo style - collapsible)
// Now passes starting FEN for position tracking
// ============================================

function renderVariation(content, parentFen) {
  if (!content) return '';
  
  // Get the preview (first move with move number)
  const preview = getVariationPreview(content);
  
  // Create variation block - NO onclick, using event delegation
  let html = `<div class="variation-line">`;
  html += `<span class="variation-toggle">+</span>`;
  html += `<span class="variation-header">${preview}</span>`;
  
  // Full content (hidden by default) - parse recursively with parent FEN
  html += `<div class="variation-content">${parseAndRenderPgn(content, true, parentFen)}</div>`;
  html += `</div>`;
  
  return html;
}

// ============================================
// GET VARIATION PREVIEW
// ============================================

function getVariationPreview(content) {
  // Extract move number and first move
  const match = content.match(/^(\d+)(\.+)\s*([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O-O|O-O)(\s*\$\d+)?([!?]*)?/);
  
  if (!match) {
    // If no move number, try to get just the move
    const moveOnly = content.match(/^([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O-O|O-O)/);
    return moveOnly ? moveOnly[1] : content.slice(0, 20) + '...';
  }
  
  const moveNum = match[1];
  const dots = match[2];
  const move = match[3];
  const nag = match[4] ? convertNag(match[4].trim()) : '';
  const annotation = match[5] || '';
  
  return `${moveNum}${dots} ${move}${nag}${annotation}`;
}

// ============================================
// CONVERT NAG TO SYMBOL
// ============================================

function convertNag(nag) {
  const nagMap = {
    '$1': '!',
    '$2': '?',
    '$3': '!!',
    '$4': '??',
    '$5': '!?',
    '$6': '?!',
    '$10': '=',
    '$11': '=',
    '$13': '∞',
    '$14': '⩲',
    '$15': '⩱',
    '$16': '±',
    '$17': '∓',
    '$18': '+−',
    '$19': '−+',
    '$22': '⨀',
    '$32': '⟳',
    '$36': '→',
    '$40': '↑',
    '$44': '=∞',
    '$132': '⇆',
    '$138': '⨁',
  };
  
  return nagMap[nag] || '';
}

// ============================================
// TOGGLE VARIATION
// ============================================

function toggleVariation(el) {
  Logger.debug('[Daily Exercises] toggleVariation called', el);
  
  const line = el.closest('.variation-line');
  if (!line) {
    Logger.warn('[Daily Exercises] Could not find .variation-line parent');
    return;
  }
  
  const content = line.querySelector('.variation-content');
  if (!content) {
    Logger.warn('[Daily Exercises] Could not find .variation-content');
    return;
  }
  
  Logger.debug('[Daily Exercises] Current display:', content.style.display);
  
  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'block';
    el.textContent = '−';
    el.classList.add('expanded');
    Logger.debug('[Daily Exercises] Variation EXPANDED');
  } else {
    content.style.display = 'none';
    el.textContent = '+';
    el.classList.remove('expanded');
    Logger.debug('[Daily Exercises] Variation COLLAPSED');
  }
}

// ============================================
// HELPERS
// ============================================

function findMatchingParen(str, start) {
  let depth = 0;
  let inComment = false;  // Track if we're inside a {...} comment
  
  for (let and = start; and < str.length; i++) {
    const char = str[i];
    
    // Handle comment start/end - ignore parentheses inside comments
    if (char === '{' && !inComment) {
      inComment = true;
      continue;
    }
    if (char === '}' && inComment) {
      inComment = false;
      continue;
    }
    
    // Skip everything inside comments (including parentheses like smileys :) )
    if (inComment) continue;
    
    if (char === '(') depth++;
    else if (char === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function cleanComment(text) {
  if (!text) return '';
  return text
    .replace(/\[%evp[^\]]*\]/g, '')
    .replace(/\[%csl[^\]]*\]/g, '')
    .replace(/\[%cal[^\]]*\]/g, '')
    .trim();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================
// NAVIGATION - MAINLINE
// ============================================

function goToMove(index) {
  if (!currentBoard || index < 0 || index >= mainlineMoves.length) return;
  
  currentBoard.position(mainlineFens[index + 1]);
  currentMoveIndex = index + 1;
  isInVariation = false;
  
  updateMoveCounter();
  updateButtons();
  updateMovesHighlight();
  scrollToActiveMove();
  highlightLastMove(index);
}

// ============================================
// NAVIGATION - ANY POSITION (for variations)
// ============================================

function goToPosition(fen, clickedElement) {
  if (!currentBoard || !fen) return;
  
  // Update board to this position
  currentBoard.position(fen);
  
  // Mark that we're in a variation
  isInVariation = true;
  
  // Clear all highlights
  clearAllMoveHighlights();
  
  // Highlight clicked element
  if (clickedElement) {
    clickedElement.classList.add('active');
    lastClickedElement = clickedElement;
    
    // Scroll to make it visible
    scrollToElement(clickedElement);
  }
  
  // Highlight last move squares on the board
  highlightMoveFromElement(clickedElement);
  
  // Update button states
  updateButtons();
}

// ============================================
// HIGHLIGHT MOVE FROM ELEMENT
// Uses data-parent-fen attribute to find from/to squares
// ============================================

function highlightMoveFromElement(moveElement) {
  clearMoveHighlights();
  
  if (!moveElement) return;
  
  // Get the move SAN from the element text (remove annotations)
  const moveSan = moveElement.textContent.replace(/[!?+#⩲⩱±∓∞=]+$/g, '').trim();
  
  // Get parent FEN from data attribute
  const parentFen = moveElement.dataset.parentFen;
  
  if (!parentFen) {
    Logger.warn('No parent FEN for move highlighting');
    return;
  }
  
  // Create a temp game, load parent FEN, make the move
  try {
    const tempGame = new Chess();
    tempGame.load(parentFen);
    const result = tempGame.move(moveSan);
    
    if (result) {
      const fromSquare = document.querySelector(`.square-${result.from}`);
      const toSquare = document.querySelector(`.square-${result.to}`);
      
      if (fromSquare) fromSquare.classList.add('highlight-from');
      if (toSquare) toSquare.classList.add('highlight-to');
    }
  } catch (e) {
    Logger.warn('Could not highlight move squares:', e);
  }
}

// ============================================
// HIGHLIGHT LAST MOVE (mainline)
// ============================================

function highlightLastMove(moveIndex) {
  clearMoveHighlights();
  
  if (moveIndex < 0 || moveIndex >= mainlineMoves.length) return;
  
  const squares = parseMoveSquares(moveIndex);
  if (!squares) return;
  
  let fromSquare = document.querySelector(`.square-${squares.from}`);
  let toSquare = document.querySelector(`.square-${squares.to}`);
  
  if (!fromSquare) fromSquare = document.querySelector(`[data-square="${squares.from}"]`);
  if (!toSquare) toSquare = document.querySelector(`[data-square="${squares.to}"]`);
  
  if (fromSquare) fromSquare.classList.add('highlight-from');
  if (toSquare) toSquare.classList.add('highlight-to');
}

function parseMoveSquares(moveIndex) {
  const tempGame = new Chess();
  
  for (let and = 0; and <= moveIndex; i++) {
    const result = tempGame.move(mainlineMoves[i]);
    if (!result) return null;
    if (i === moveIndex) {
      return { from: result.from, to: result.to };
    }
  }
  return null;
}

function clearMoveHighlights() {
  document.querySelectorAll('.highlight-from, .highlight-to').forEach(el => {
    el.classList.remove('highlight-from', 'highlight-to');
  });
}

function clearAllMoveHighlights() {
  // Clear board square highlights
  clearMoveHighlights();
  
  // Clear all move element highlights (mainline and variations)
  document.querySelectorAll('.move-link.active, .variation-move.active').forEach(el => {
    el.classList.remove('active');
  });
}

function updateMovesHighlight() {
  // Clear all active states
  document.querySelectorAll('.move-link.active, .variation-move.active').forEach(el => {
    el.classList.remove('active');
  });
  
  // If we're in a variation, don't highlight mainline
  if (isInVariation && lastClickedElement) {
    lastClickedElement.classList.add('active');
    return;
  }
  
  // Highlight current mainline move
  document.querySelectorAll('.move-link').forEach(el => {
    if (parseInt(el.dataset.index) === currentMoveIndex - 1) {
      el.classList.add('active');
    }
  });
}

function scrollToActiveMove() {
  const active = document.querySelector('.move-link.active, .variation-move.active');
  scrollToElement(active);
}

function scrollToElement(element) {
  const container = document.getElementById('movesScrollContainer');
  
  if (element && container) {
    const cRect = container.getBoundingClientRect();
    const aRect = element.getBoundingClientRect();
    const relTop = aRect.top - cRect.top;
    
    if (relTop < 0 || relTop > container.clientHeight - 30) {
      container.scrollTop += relTop - (container.clientHeight / 2);
    }
  }
}

// ============================================
// BOARD CONTROLS
// ============================================

function resetBoard() {
  if (!currentBoard) return;
  currentBoard.position(mainlineFens[0]);
  currentMoveIndex = 0;
  isInVariation = false;
  lastClickedElement = null;
  updateMoveCounter();
  updateButtons();
  updateMovesHighlight();
  clearMoveHighlights();
}

function previousMove() {
  if (!currentBoard) return;
  
  // If in variation, go back to mainline at current position
  if (isInVariation) {
    isInVariation = false;
    lastClickedElement = null;
    // Stay at current mainline position
    currentBoard.position(mainlineFens[currentMoveIndex]);
    updateMovesHighlight();
    if (currentMoveIndex > 0) {
      highlightLastMove(currentMoveIndex - 1);
    } else {
      clearMoveHighlights();
    }
    updateButtons();
    return;
  }
  
  if (currentMoveIndex <= 0) return;
  
  currentMoveIndex--;
  currentBoard.position(mainlineFens[currentMoveIndex]);
  updateMoveCounter();
  updateButtons();
  updateMovesHighlight();
  scrollToActiveMove();
  if (currentMoveIndex > 0) {
    highlightLastMove(currentMoveIndex - 1);
  } else {
    clearMoveHighlights();
  }
}

function nextMove() {
  if (!currentBoard || currentMoveIndex >= mainlineMoves.length) return;
  
  // If in variation, return to mainline first
  if (isInVariation) {
    isInVariation = false;
    lastClickedElement = null;
  }
  
  currentMoveIndex++;
  currentBoard.position(mainlineFens[currentMoveIndex]);
  updateMoveCounter();
  updateButtons();
  updateMovesHighlight();
  scrollToActiveMove();
  highlightLastMove(currentMoveIndex - 1);
}

function lastMove() {
  if (!currentBoard || mainlineMoves.length === 0) return;
  
  isInVariation = false;
  lastClickedElement = null;
  currentMoveIndex = mainlineMoves.length;
  currentBoard.position(mainlineFens[currentMoveIndex]);
  updateMoveCounter();
  updateButtons();
  updateMovesHighlight();
  scrollToActiveMove();
  highlightLastMove(currentMoveIndex - 1);
}

function updateMoveCounter() {
  const el = document.getElementById('moveCounter');
  if (el) el.style.display = 'none';
}

function updateButtons() {
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  // Previous enabled if we have moves to go back OR we're in variation
  if (prev) prev.disabled = (currentMoveIndex === 0 && !isInVariation);
  if (next) next.disabled = currentMoveIndex >= mainlineMoves.length;
}

// ============================================
// MESSAGES
// ============================================

function showUpgradeMessage() {
  const el = document.getElementById('upgradeMessage');
  if (el) el.style.display = 'block';
}

function showTierUpgradeMessage(tier) {
  const el = document.getElementById('tierUpgradeMessage');
  const title = document.getElementById('tierUpgradeTitle');
  const sub = document.getElementById('tierUpgradeSubtext');
  
  if (!el) return;
  
  if (tier === 'basic') {
    title.textContent = 'Upgrade to Premium or Elite';
    sub.textContent = 'Get access to more daily exercises';
  } else if (tier === 'premium') {
    title.textContent = 'Upgrade to Elite';
    sub.textContent = 'Unlock unlimited exercises';
  }
  
  el.style.display = 'block';
}

function updateTierBadge(tier, current, max) {
  const figure = document.getElementById('tierFigure');
  const name = document.getElementById('tierNameDropdown');
  const count = document.getElementById('tierCountDropdown');
  
  const cfg = {
    free: { n: 'Free', f: '♟️' },
    basic: { n: 'Basic', f: '♞' },
    premium: { n: 'Premium', f: '♛' },
    elite: { n: 'Elite', f: '👑' },
    admin: { n: 'Admin', f: '⚙️' }
  };
  
  const c = cfg[tier] || cfg.free;
  if (figure) figure.textContent = c.f;
  if (name) name.textContent = c.n;
  if (count) count.textContent = `${current}/${max === -1 ? '∞' : max}`;
}

// ============================================
// DOWNLOAD PGN
// ============================================

async function downloadPgn() {
  if (!currentExercise) return;
  
  try {
    if (currentExercise.pgn_content) {
      const blob = new Blob([currentExercise.pgn_content], { type: 'application/x-chess-pgn' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      
      const filename = (currentExercise.title || 'chess_game')
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .replace(/\s+/g, '_');
      a.download = `${filename}.pgn`;
      a.click();
      URL.revokeObjectURL(a.href);
    } else {
      Logger.warn('No PGN content available for download');
    }
  } catch (e) {
    Logger.error('Download error:', e);
  }
}

// ============================================
// KEYBOARD
// ============================================

document.addEventListener('keydown', (e) => {
  if (!currentExercise || !currentBoard) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  
  switch (e.key) {
    case 'ArrowLeft': e.preventDefault(); previousMove(); break;
    case 'ArrowRight': e.preventDefault(); nextMove(); break;
    case 'Home': e.preventDefault(); resetBoard(); break;
    case 'End': e.preventDefault(); lastMove(); break;
  }
});