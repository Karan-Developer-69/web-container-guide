import './style.css';
import { WebContainer } from '@webcontainer/api';
import { files } from './files';

let wc = null;
let installInProgress = false;

/* ------------------ DOM Elements ------------------ */

const $ = (id) => document.getElementById(id);

const editor = $('editor');
const previewFrame = $('preview-frame');
const terminalOutput = $('terminal-output');
const statusIndicator = $('status-indicator');
const statusText = $('status-text');
const urlDisplay = $('url-display');
const urlBar = $('url-bar');
const bootScreen = $('boot-screen');
const bootText = $('boot-text');
const clearTerminalBtn = $('clear-terminal');
const reloadBtn = $('reload-btn');
const openTabBtn = $('open-tab-btn');

/* ------------------ App Start ------------------ */

window.addEventListener('load', initApp);

async function initApp() {
  try {
    setupEditor();
    setupButtons();
    setupTabs();

    showBoot('Initializing WebContainer...');
    wc = await WebContainer.boot();
    await wc.mount(files);

    showBoot('Installing dependencies...');
    const code = await installDependencies();

    if (code !== 0) throw new Error('Dependency install failed');

    hideBoot();
    startServer();
  } catch (err) {
    showError(err.message);
  }
}

/* ------------------ Setup Functions ------------------ */

function setupEditor() {
  if (!editor) return;

  editor.value = files['index.js'].file.contents;

  let debounce;
  editor.addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      writeFile(e.target.value);
    }, 400);
  });
}

function setupButtons() {
  clearTerminalBtn?.addEventListener('click', () => {
    terminalOutput.innerHTML = '';
  });

  reloadBtn?.addEventListener('click', () => {
    if (previewFrame) previewFrame.src = previewFrame.src;
  });

  openTabBtn?.addEventListener('click', () => {
    if (urlDisplay?.href) {
      window.open(urlDisplay.href, '_blank', 'noopener');
    }
  });
}

function setupTabs() {
  const tabs = document.querySelectorAll('.preview-tab');
  const iframeContainer = $('iframe-container');
  const terminalPanel = $('terminal-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const type = tab.dataset.tab;

      if (type === 'preview') {
        iframeContainer.style.display = 'block';
        terminalPanel.style.display = 'none';
      } else {
        iframeContainer.style.display = 'none';
        terminalPanel.style.display = 'flex';
      }
    });
  });
}

/* ------------------ WebContainer Logic ------------------ */

async function installDependencies() {
  installInProgress = true;
  updateStatus('installing');

  try {
    const proc = await wc.spawn('npm', ['install']);

    proc.output.pipeTo(new WritableStream({
      write(data) {
        log(data);
      }
    }));

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Install timeout')), 120000)
    );

    return await Promise.race([proc.exit, timeout]);
  } catch (err) {
    log('\n[ERROR] ' + err.message);
    return 1;
  } finally {
    installInProgress = false;
  }
}

async function startServer() {
  updateStatus('starting');
  log('\n[SYSTEM] Starting server...\n');

  try {
    await wc.spawn('npm', ['run', 'start']);

    wc.on('server-ready', (port, url) => {
      updateStatus('ready');

      previewFrame.src = url;
      urlDisplay.textContent = url;
      urlDisplay.href = url;
      urlBar.style.display = 'flex';

      log('[SYSTEM] Server running at ' + url);
    });
  } catch (err) {
    updateStatus('error');
    log('[ERROR] ' + err.message);
  }
}

async function writeFile(content) {
  try {
    await wc.fs.writeFile('/index.js', content);
    log('[FILE] index.js updated');
  } catch (err) {
    log('[ERROR] File write failed');
  }
}

/* ------------------ UI Helpers ------------------ */

function log(text) {
  if (!terminalOutput) return;
  const line = document.createElement('div');
  line.textContent = text;
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function updateStatus(state) {
  if (!statusIndicator || !statusText) return;

  statusIndicator.className = 'status-indicator ' + state;

  const map = {
    installing: 'Installing dependencies...',
    starting: 'Starting server...',
    ready: 'Server running',
    error: 'Error occurred'
  };

  statusText.textContent = map[state] || state;
}

function showBoot(message) {
  bootScreen.style.display = 'flex';
  bootText.textContent = message;
}

function hideBoot() {
  bootScreen.style.display = 'none';
}

function showError(message) {
  bootScreen.style.display = 'flex';
  bootScreen.style.background = '#1a0f0f';
  bootText.innerHTML = `
    <span style="color:#ff6b6b">⚠️ ${message}</span><br><br>
    <button onclick="location.reload()" 
      style="padding:8px 16px;background:#ff6b6b;border:none;color:white;border-radius:4px">
      Retry
    </button>
  `;
    }
