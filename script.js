(function () {
  'use strict';

  var APP_KEY = 'webgame_minesWeeperBuddy';
  var APP_VERSION = '001.001';
  var DIFFICULTY_KEY = APP_KEY + '.difficulty.v1';
  var HIGHSCORES_KEY = APP_KEY + '.highscores.v1';
  var PROGRESS_KEY = APP_KEY + '.progress.v1';

  var DIFFICULTIES = {
    easy: { rows: 9, cols: 9, mines: 10, label: 'Easy' },
    medium: { rows: 16, cols: 16, mines: 40, label: 'Medium' },
    hard: { rows: 16, cols: 30, mines: 99, label: 'Hard' },
    expert: { rows: 20, cols: 35, mines: 145, label: 'Expert' }
  };

  var ICONS = Object.assign({}, Buddy.ICONS, {
    bomb: Buddy.icon('bomb'),
    flag: Buddy.icon('flag'),
    timer: Buddy.icon('timer')
  });
  var HELP_ICON_SVG = '<svg class="icon" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true"><path d="M8 1C5.419 1 2.75 2.964 2.75 6.25C2.75 8.167 3.637 9.184 4.224 9.856C4.408 10.067 4.598 10.285 4.628 10.398L5.568 13.889C5.744 14.543 6.34 14.999 7.017 14.999H8.984C9.662 14.999 10.257 14.542 10.432 13.889L11.372 10.397C11.402 10.285 11.593 10.067 11.776 9.856C12.363 9.183 13.25 8.167 13.25 6.25C13.25 3.355 10.895 1 8 1ZM9.467 13.63C9.408 13.848 9.209 14 8.984 14H7.017C6.791 14 6.593 13.848 6.534 13.63L6.095 12H9.906L9.467 13.63ZM11.022 9.199C10.741 9.522 10.497 9.802 10.407 10.137L10.175 10.999H5.826L5.594 10.138C5.503 9.801 5.26 9.522 4.977 9.199C4.43 8.572 3.75 7.792 3.75 6.25C3.75 3.59 5.911 2 8 2C10.344 2 12.25 3.907 12.25 6.25C12.25 7.792 11.569 8.572 11.022 9.199Z"/></svg>';
  var escapeHtml = Buddy.escapeHtml;

  var dom = {};
  var state = {
    difficulty: 'easy',
    highscores: {},
    rows: 0,
    cols: 0,
    mines: 0,
    cells: [],
    cellEls: [],
    status: 'idle',
    minesPlaced: false,
    revealedSafeCount: 0,
    totalSafeCells: 0,
    flagCount: 0,
    elapsedSeconds: 0,
    startTime: null,
    timerId: null
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDom();
    initStaticIcons();
    bindGlobalEvents();
    state.difficulty = loadDifficulty();
    state.highscores = loadHighscores();
    setDifficultyToggleUI(state.difficulty);

    var urlProgress = new URLSearchParams(window.location.search).get('progress');
    if (urlProgress) {
      history.replaceState(null, '', location.protocol + '//' + location.host + location.pathname);
      var urlData = decodeProgress(urlProgress);
      if (isValidProgressPayload(urlData)) {
        loadProgressData(urlData);
        return;
      }
    }

    var saved = loadSavedProgress();
    if (saved) {
      openResumeModal(saved);
      return;
    }

    newGame();
  }

  function cacheDom() {
    dom.btnSettings = document.getElementById('btnSettings');
    dom.btnShare = document.getElementById('btnShare');
    dom.btnHighScores = document.getElementById('btnHighScores');
    dom.btnHelp = document.getElementById('btnHelp');
    dom.difficultyToggle = document.getElementById('difficultyToggle');
    dom.minesIcon = document.getElementById('minesIcon');
    dom.timerIcon = document.getElementById('timerIcon');
    dom.bestIcon = document.getElementById('bestIcon');
    dom.minesLeft = document.getElementById('minesLeft');
    dom.timeElapsed = document.getElementById('timeElapsed');
    dom.bestTime = document.getElementById('bestTime');
    dom.board = document.getElementById('board');
    dom.banner = document.getElementById('banner');
  }

  function initStaticIcons() {
    dom.btnSettings.innerHTML = ICONS.settings;
    dom.btnShare.innerHTML = ICONS.send;
    dom.btnHighScores.innerHTML = ICONS.award;
    dom.btnHelp.innerHTML = HELP_ICON_SVG;
    dom.minesIcon.innerHTML = ICONS.bomb;
    dom.timerIcon.innerHTML = ICONS.timer;
    dom.bestIcon.innerHTML = ICONS.award;
  }

  function bindGlobalEvents() {
    dom.btnSettings.addEventListener('click', openSettingsModal);
    dom.btnShare.addEventListener('click', shareProgress);
    dom.btnHighScores.addEventListener('click', openHighScoresModal);
    dom.btnHelp.addEventListener('click', openHelpModal);

    dom.difficultyToggle.querySelectorAll('[data-difficulty]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-difficulty');
        state.difficulty = id;
        saveDifficulty();
        setDifficultyToggleUI(id);
        newGame();
      });
    });
  }



  function loadDifficulty() {
    try {
      var saved = localStorage.getItem(DIFFICULTY_KEY);
      return DIFFICULTIES.hasOwnProperty(saved) ? saved : 'easy';
    } catch (e) {
      return 'easy';
    }
  }

  function saveDifficulty() {
    try { localStorage.setItem(DIFFICULTY_KEY, state.difficulty); } catch (e) {}
  }

  function loadHighscores() {
    try {
      var raw = localStorage.getItem(HIGHSCORES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveHighscores() {
    try { localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(state.highscores)); } catch (e) {}
  }


  function buildProgressPayload() {
    var minesStr = '', revStr = '', flgStr = '';
    for (var r = 0; r < state.rows; r++) {
      for (var c = 0; c < state.cols; c++) {
        var cell = state.cells[r][c];
        minesStr += cell.mine ? '1' : '0';
        revStr += cell.revealed ? '1' : '0';
        flgStr += cell.flagged ? '1' : '0';
      }
    }
    return { diff: state.difficulty, r: state.rows, c: state.cols, m: state.mines, mines: minesStr, rev: revStr, flg: flgStr, t: state.elapsedSeconds };
  }

  function encodeProgress(payload) {
    return btoa(JSON.stringify(payload));
  }

  function decodeProgress(str) {
    try {
      return JSON.parse(atob(str));
    } catch (e) {
      return null;
    }
  }

  function isValidProgressPayload(data) {
    if (!data || typeof data !== 'object') return false;
    if (!DIFFICULTIES.hasOwnProperty(data.diff)) return false;
    var dd = DIFFICULTIES[data.diff];
    if (data.r !== dd.rows || data.c !== dd.cols || data.m !== dd.mines) return false;

    var total = data.r * data.c;
    if (typeof data.mines !== 'string' || data.mines.length !== total || !/^[01]+$/.test(data.mines)) return false;
    if (typeof data.rev !== 'string' || data.rev.length !== total || !/^[01]+$/.test(data.rev)) return false;
    if (typeof data.flg !== 'string' || data.flg.length !== total || !/^[01]+$/.test(data.flg)) return false;
    if (typeof data.t !== 'number' || data.t < 0) return false;

    var mineCount = 0;
    for (var i = 0; i < total; i++) {
      var isMine = data.mines[i] === '1';
      var isRev = data.rev[i] === '1';
      var isFlag = data.flg[i] === '1';
      if (isMine) mineCount++;
      if (isRev && isMine) return false;
      if (isRev && isFlag) return false;
    }
    return mineCount === data.m;
  }

  function saveProgress() {
    try {
      if (state.status !== 'playing' || !state.minesPlaced) {
        localStorage.removeItem(PROGRESS_KEY);
        return;
      }
      localStorage.setItem(PROGRESS_KEY, encodeProgress(buildProgressPayload()));
    } catch (e) {}
  }

  function clearProgress() {
    try { localStorage.removeItem(PROGRESS_KEY); } catch (e) {}
  }

  function loadSavedProgress() {
    try {
      var raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return null;
      var data = decodeProgress(raw);
      return isValidProgressPayload(data) ? data : null;
    } catch (e) {
      return null;
    }
  }

  function loadProgressData(data) {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }

    state.difficulty = data.diff;
    saveDifficulty();
    setDifficultyToggleUI(state.difficulty);

    state.rows = data.r;
    state.cols = data.c;
    state.mines = data.m;
    state.cells = buildEmptyCells(state.rows, state.cols);

    var idx = 0;
    for (var r = 0; r < state.rows; r++) {
      for (var c = 0; c < state.cols; c++, idx++) {
        var cell = state.cells[r][c];
        cell.mine = data.mines[idx] === '1';
        cell.revealed = data.rev[idx] === '1';
        cell.flagged = data.flg[idx] === '1';
      }
    }

    var revealedSafeCount = 0, flagCount = 0;
    for (var rr = 0; rr < state.rows; rr++) {
      for (var cc = 0; cc < state.cols; cc++) {
        var c2 = state.cells[rr][cc];
        if (c2.flagged) flagCount++;
        if (c2.mine) continue;
        var adjacent = 0;
        neighborsOf(rr, cc).forEach(function (n) { if (state.cells[n[0]][n[1]].mine) adjacent++; });
        c2.adjacent = adjacent;
        if (c2.revealed) revealedSafeCount++;
      }
    }

    state.status = 'playing';
    state.minesPlaced = true;
    state.revealedSafeCount = revealedSafeCount;
    state.totalSafeCells = state.rows * state.cols - state.mines;
    state.flagCount = flagCount;
    state.elapsedSeconds = data.t;
    state.startTime = null;

    finishSetup();
    startTimer();
  }

  function shareProgress() {
    var url = location.protocol + '//' + location.host + location.pathname +
      '?progress=' + encodeURIComponent(encodeProgress(buildProgressPayload()));
    navigator.clipboard.writeText(url).then(function () {
      dom.btnShare.innerHTML = ICONS.check;
      setTimeout(function () { dom.btnShare.innerHTML = ICONS.send; }, 1200);
    }).catch(function () {});
  }



  function currentDims() {
    return DIFFICULTIES[state.difficulty];
  }

  function highscoreKey() {
    return state.difficulty;
  }

  function setDifficultyToggleUI(id) {
    dom.difficultyToggle.querySelectorAll('[data-difficulty]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-difficulty') === id);
    });
  }

  function buildEmptyCells(rows, cols) {
    var grid = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) {
        row.push({ mine: false, adjacent: 0, revealed: false, flagged: false, exploded: false, wrongFlag: false });
      }
      grid.push(row);
    }
    return grid;
  }

  function newGame() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }

    var d = currentDims();
    state.rows = d.rows;
    state.cols = d.cols;
    state.mines = d.mines;
    state.cells = buildEmptyCells(state.rows, state.cols);
    state.status = 'idle';
    state.minesPlaced = false;
    state.revealedSafeCount = 0;
    state.totalSafeCells = state.rows * state.cols - state.mines;
    state.flagCount = 0;
    state.elapsedSeconds = 0;
    state.startTime = null;

    finishSetup();
  }

  function finishSetup() {
    renderBoard();
    hideBanner();
    updateScoreboard();
    saveProgress();
  }

  function renderBoard() {
    dom.board.innerHTML = '';
    dom.board.classList.remove('is-game-over', 'is-shaking');
    dom.board.style.gridTemplateColumns = 'repeat(' + state.cols + ', var(--cell-size))';
    dom.board.style.gridTemplateRows = 'repeat(' + state.rows + ', var(--cell-size))';

    state.cellEls = [];
    for (var r = 0; r < state.rows; r++) {
      var rowEls = [];
      for (var c = 0; c < state.cols; c++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mw-cell';
        btn.setAttribute('data-r', r);
        btn.setAttribute('data-c', c);
        btn.addEventListener('click', onCellClick);
        btn.addEventListener('contextmenu', onCellContext);
        btn.addEventListener('dblclick', onCellChord);
        dom.board.appendChild(btn);
        rowEls.push(btn);
        updateCellView(r, c, btn);
      }
      state.cellEls.push(rowEls);
    }
  }



  function key(r, c) {
    return r + '_' + c;
  }

  function neighborsOf(r, c) {
    var out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        var nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols) out.push([nr, nc]);
      }
    }
    return out;
  }

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  function placeMines(safeR, safeC) {
    var forbidden = {};
    forbidden[key(safeR, safeC)] = true;
    neighborsOf(safeR, safeC).forEach(function (n) { forbidden[key(n[0], n[1])] = true; });

    var candidates = [];
    for (var r = 0; r < state.rows; r++) {
      for (var c = 0; c < state.cols; c++) {
        if (!forbidden[key(r, c)]) candidates.push([r, c]);
      }
    }


    if (candidates.length < state.mines) {
      candidates = [];
      for (var r2 = 0; r2 < state.rows; r2++) {
        for (var c2 = 0; c2 < state.cols; c2++) {
          if (!(r2 === safeR && c2 === safeC)) candidates.push([r2, c2]);
        }
      }
    }

    shuffleArray(candidates);
    var toPlace = Math.min(state.mines, candidates.length);
    for (var i = 0; i < toPlace; i++) {
      var pos = candidates[i];
      state.cells[pos[0]][pos[1]].mine = true;
    }

    for (var rr = 0; rr < state.rows; rr++) {
      for (var cc = 0; cc < state.cols; cc++) {
        var cell = state.cells[rr][cc];
        if (cell.mine) continue;
        var count = 0;
        neighborsOf(rr, cc).forEach(function (n) { if (state.cells[n[0]][n[1]].mine) count++; });
        cell.adjacent = count;
      }
    }

    state.minesPlaced = true;
  }



  function floodReveal(startR, startC) {
    var stack = [[startR, startC]];
    while (stack.length) {
      var pos = stack.pop();
      var r = pos[0], c = pos[1];
      var cell = state.cells[r][c];
      if (cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      if (!cell.mine) state.revealedSafeCount++;
      updateCellView(r, c);
      if (!cell.mine && cell.adjacent === 0) {
        neighborsOf(r, c).forEach(function (n) {
          var nc = state.cells[n[0]][n[1]];
          if (!nc.revealed && !nc.flagged) stack.push(n);
        });
      }
    }
  }

  function onCellClick(e) {
    if (state.status === 'won' || state.status === 'lost') return;
    var r = Number(e.currentTarget.getAttribute('data-r'));
    var c = Number(e.currentTarget.getAttribute('data-c'));
    var cell = state.cells[r][c];
    if (cell.flagged || cell.revealed) return;

    if (!state.minesPlaced) {
      placeMines(r, c);
      state.status = 'playing';
      startTimer();
    }

    if (cell.mine) {
      handleLoss(r, c);
      saveProgress();
      return;
    }

    floodReveal(r, c);
    checkWin();
    saveProgress();
  }

  function onCellContext(e) {
    e.preventDefault();
    if (state.status === 'won' || state.status === 'lost') return;
    var r = Number(e.currentTarget.getAttribute('data-r'));
    var c = Number(e.currentTarget.getAttribute('data-c'));
    var cell = state.cells[r][c];
    if (cell.revealed) return;

    if (state.status === 'idle') { state.status = 'playing'; startTimer(); }

    cell.flagged = !cell.flagged;
    state.flagCount += cell.flagged ? 1 : -1;
    updateCellView(r, c);
    updateScoreboard();
    saveProgress();
  }

  function onCellChord(e) {
    if (state.status === 'won' || state.status === 'lost') return;
    var r = Number(e.currentTarget.getAttribute('data-r'));
    var c = Number(e.currentTarget.getAttribute('data-c'));
    var cell = state.cells[r][c];
    if (!cell.revealed || cell.mine || cell.adjacent === 0) return;

    var neighbors = neighborsOf(r, c);
    var flaggedCount = neighbors.filter(function (n) { return state.cells[n[0]][n[1]].flagged; }).length;
    if (flaggedCount !== cell.adjacent) return;

    var hitMine = null;
    neighbors.forEach(function (n) {
      var nc = state.cells[n[0]][n[1]];
      if (nc.flagged || nc.revealed) return;
      if (nc.mine) { hitMine = n; return; }
      floodReveal(n[0], n[1]);
    });

    if (hitMine) { handleLoss(hitMine[0], hitMine[1]); saveProgress(); return; }
    checkWin();
    saveProgress();
  }



  function handleLoss(exR, exC) {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
    state.status = 'lost';
    dom.board.classList.add('is-game-over');

    var exCell = state.cells[exR][exC];
    exCell.revealed = true;
    exCell.exploded = true;
    updateCellView(exR, exC);
    spawnBombBlast(exR, exC);

    var delay = 0;
    for (var r = 0; r < state.rows; r++) {
      for (var c = 0; c < state.cols; c++) {
        var cell = state.cells[r][c];
        if (r === exR && c === exC) continue;
        if (cell.mine && !cell.flagged) {
          (function (r2, c2, d) {
            setTimeout(function () {
              state.cells[r2][c2].revealed = true;
              updateCellView(r2, c2);
            }, d);
          })(r, c, delay);
          delay += 35;
        } else if (!cell.mine && cell.flagged) {
          cell.wrongFlag = true;
          updateCellView(r, c);
        }
      }
    }

    showBanner('lost');
  }

  function checkWin() {
    if (state.revealedSafeCount < state.totalSafeCells) return;

    state.status = 'won';
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
    dom.board.classList.add('is-game-over');

    for (var r = 0; r < state.rows; r++) {
      for (var c = 0; c < state.cols; c++) {
        var cell = state.cells[r][c];
        if (cell.mine && !cell.flagged) {
          cell.flagged = true;
          updateCellView(r, c);
        }
      }
    }
    state.flagCount = state.mines;

    var isBest = maybeSaveHighscore();
    updateScoreboard();
    Buddy.spawnConfetti(GRAFFITI_COLORS);
    showBanner('won', isBest);
  }

  function maybeSaveHighscore() {
    var scoreKey = highscoreKey();
    var best = state.highscores[scoreKey];
    if (best == null || state.elapsedSeconds < best) {
      state.highscores[scoreKey] = state.elapsedSeconds;
      saveHighscores();
      return true;
    }
    return false;
  }



  function cellAriaLabel(cell, r, c) {
    var base = 'Row ' + (r + 1) + ', column ' + (c + 1) + ', ';
    if (cell.wrongFlag) return base + 'incorrectly flagged';
    if (cell.flagged && !cell.revealed) return base + 'flagged';
    if (!cell.revealed) return base + 'hidden';
    if (cell.mine) return base + (cell.exploded ? 'mine, detonated' : 'mine');
    if (cell.adjacent > 0) return base + cell.adjacent + ' adjacent mines';
    return base + 'empty';
  }

  function updateCellView(r, c, elArg) {
    var cell = state.cells[r][c];
    var el = elArg || state.cellEls[r][c];
    var cls = 'mw-cell';
    var html = '';

    if (cell.wrongFlag) {
      cls += ' is-wrong-flag';
      html = ICONS.flag + '<span class="mw-wrong-x">' + ICONS.x + '</span>';
    } else if (cell.flagged && !cell.revealed) {
      cls += ' is-flagged';
      html = ICONS.flag;
    } else if (cell.revealed) {
      cls += ' is-revealed';
      if (cell.mine) {
        cls += ' is-mine';
        if (cell.exploded) cls += ' is-exploded';
        html = ICONS.bomb;
      } else if (cell.adjacent > 0) {
        cls += ' num-' + cell.adjacent;
        html = String(cell.adjacent);
      } else {
        cls += ' is-empty';
      }
    }

    el.className = cls;
    el.innerHTML = html;
    el.setAttribute('aria-label', cellAriaLabel(cell, r, c));
  }

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function formatTime(totalSeconds) {
    totalSeconds = Math.max(0, Math.floor(totalSeconds));
    var h = Math.floor(totalSeconds / 3600);
    var m = Math.floor((totalSeconds % 3600) / 60);
    var s = totalSeconds % 60;
    return (h > 0 ? h + ':' + pad2(m) : '' + m) + ':' + pad2(s);
  }

  function updateScoreboard() {
    dom.minesLeft.textContent = String(state.mines - state.flagCount);
    dom.timeElapsed.textContent = formatTime(state.elapsedSeconds);
    var best = state.highscores[highscoreKey()];
    dom.bestTime.textContent = best == null ? '--:--' : formatTime(best);
  }

  function startTimer() {
    state.startTime = Date.now();
    state.timerId = setInterval(function () {
      state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
      dom.timeElapsed.textContent = formatTime(state.elapsedSeconds);
    }, 250);
  }

  function hideBanner() {
    dom.banner.hidden = true;
    dom.banner.innerHTML = '';
  }

  function showBanner(kind, isBest) {
    dom.banner.hidden = false;
    dom.banner.className = 'mw-banner is-' + kind;
    if (kind === 'won') {
      dom.banner.innerHTML = ICONS.award +
        '<span>You win! Time ' + formatTime(state.elapsedSeconds) + (isBest ? ' — new best!' : '') + '</span>';
    } else {
      dom.banner.innerHTML = ICONS.bomb + '<span>Boom! Game over.</span>';
    }
  }



  function spawnBombBlast(r, c) {
    var el = state.cellEls[r][c];
    var rect = el.getBoundingClientRect();
    var boardRect = dom.board.getBoundingClientRect();
    var blast = document.createElement('span');
    blast.className = 'mw-blast';
    blast.style.left = (rect.left - boardRect.left + rect.width / 2) + 'px';
    blast.style.top = (rect.top - boardRect.top + rect.height / 2) + 'px';
    blast.addEventListener('animationend', function () { blast.remove(); });
    dom.board.appendChild(blast);

    dom.board.classList.add('is-shaking');
    setTimeout(function () { dom.board.classList.remove('is-shaking'); }, 450);
  }



  var GRAFFITI_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];



  var modalApi = Buddy.modal.init();
  var openModal = modalApi.open;
  var closeModal = modalApi.close;

  function openConfirmModal(title, message, confirmLabel, onConfirm, opts) {
    opts = opts || {};
    var danger = opts.danger ? 'btn-danger' : 'btn-primary';
    var html =
      '<p class="modal-message">' + escapeHtml(message) + '</p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-ghost" id="btnConfirmNo">Cancel</button>' +
      '<button class="btn ' + danger + '" id="btnConfirmYes">' + escapeHtml(confirmLabel) + '</button>' +
      '</div>';
    openModal(title, html, function (body) {
      body.querySelector('#btnConfirmNo').addEventListener('click', closeModal);
      body.querySelector('#btnConfirmYes').addEventListener('click', function () {
        closeModal();
        onConfirm();
      });
    }, { autoSize: true });
  }

  function openSettingsModal() {
    Buddy.settings.open(APP_KEY, openModal, closeModal, { appVersion: APP_VERSION });
  }

  function openResumeModal(progressData) {
    var html =
      '<p class="modal-message">We found a saved game on your system.<br>Do you want to resume from where you left off?</p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-ghost" id="btnResumeNo">No</button>' +
      '<button class="btn btn-primary" id="btnResumeYes">Yes</button>' +
      '</div>';
    openModal('Resume Saved Game?', html, function (body) {
      body.querySelector('#btnResumeNo').addEventListener('click', function () {
        closeModal();
        clearProgress();
        newGame();
      });
      body.querySelector('#btnResumeYes').addEventListener('click', function () {
        closeModal();
        loadProgressData(progressData);
      });
    }, { autoSize: true, forceChoice: true });
  }

  function openHelpModal() {
    var html =
      '<div class="modal-message">' +
      '<ul class="help-list">' +
      '<li>Left-click a cell to reveal it. Your first click is always safe and clears an opening around it.</li>' +
      '<li>A revealed number tells you how many mines are hiding in its 8 neighboring cells.</li>' +
      '<li>Right-click a cell to flag it as a suspected mine — flag every mine around a number, then double-click the number to reveal the rest of its neighbors at once.</li>' +
      '<li>Reveal every safe cell to win. Revealing a mine ends the game.</li>' +
      '<li>Switch difficulty anytime with Easy / Medium / Hard / Expert for a bigger board with more mines.</li>' +
      '</ul>' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-primary" id="btnCloseHelp">Got it</button>' +
      '</div>';

    openModal('How to Play', html, function (body) {
      body.querySelector('#btnCloseHelp').addEventListener('click', closeModal);
    }, { autoSize: true });
  }

  function openHighScoresModal() {
    var rows = ['easy', 'medium', 'hard', 'expert'].map(function (id) {
      var d = DIFFICULTIES[id];
      var best = state.highscores[id];
      return '<div class="mw-score-row">' +
        '<span class="mw-score-label">' + escapeHtml(d.label) + '</span>' +
        '<span class="mw-score-value">' + (best == null ? '—' : formatTime(best)) + '</span>' +
        '</div>';
    }).join('');

    var html = '<div class="mw-score-list">' + rows + '</div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" id="btnClearScores">Clear High Scores</button>' +
      '<button type="button" class="btn btn-primary" id="btnCloseScores">Close</button>' +
      '</div>';

    openModal('High Scores', html, function (body) {
      body.querySelector('#btnCloseScores').addEventListener('click', closeModal);
      body.querySelector('#btnClearScores').addEventListener('click', function () {
        openConfirmModal('Clear High Scores', 'Delete all saved best times? This cannot be undone.', 'Clear', function () {
          state.highscores = {};
          saveHighscores();
          updateScoreboard();
        }, { danger: true });
      });
    }, { autoSize: true });
  }
})();
