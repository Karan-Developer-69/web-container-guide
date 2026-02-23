import './style.css'
import { WebContainer } from '@webcontainer/api';
import { files } from './files';

/** @type {import('@webcontainer/api').WebContainer}  */
let webcontainerInstance;
let isInstalling = false;

window.addEventListener('load', async () => {
  initializeUI();
  
  try {
    showBootScreen('Initializing WebContainer...');
    
    webcontainerInstance = await WebContainer.boot();
    await webcontainerInstance.mount(files);
    
    showBootScreen('Installing dependencies...');
    const exitCode = await installDependencies();
    
    if (exitCode !== 0) {
      throw new Error('Installation failed with exit code: ' + exitCode);
    }
    
    hideBootScreen();
    startDevServer();
  } catch (error) {
    console.error('Failed to initialize:', error);
    showError('Failed to initialize: ' + error.message);
  }
});

function initializeUI() {
  textareaEl.value = files['index.js'].file.contents;
  
  let timeout;
  textareaEl.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      writeIndexJS(e.currentTarget.value);
    }, 500);
  });

  document.querySelector('.clear-terminal')?.addEventListener('click', clearTerminal);
  document.querySelector('.reload-btn')?.addEventListener('click', () => {
    iframeEl.src = iframeEl.src;
  });
}

async function installDependencies() {
  isInstalling = true;
  updateStatus('installing');
  
  try {
    const installProcess = await webcontainerInstance.spawn('npm', ['install']);
    
    installProcess.output.pipeTo(new WritableStream({
      write(data) {
        appendToTerminal(data);
      }
    }));
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Installation timeout')), 120000);
    });
    
    const exitPromise = installProcess.exit;
    const exitCode = await Promise.race([exitPromise, timeoutPromise]);
    
    return exitCode;
  } catch (error) {
    appendToTerminal('\n[ERROR] ' + error.message + '\n');
    return 1;
  } finally {
    isInstalling = false;
  }
}

async function startDevServer() {
  updateStatus('starting');
  appendToTerminal('\n[SYSTEM] Starting development server...\n');
  
  try {
    await webcontainerInstance.spawn('npm', ['run', 'start']);
    
    webcontainerInstance.on('server-ready', (port, url) => {
      updateStatus('ready');
      iframeEl.src = url;
      urlDisplayEl.textContent = url;
      urlDisplayEl.href = url;
      urlBarEl.style.display = 'flex';
      appendToTerminal(`[SYSTEM] Server ready at ${url}\n`);
    });
    
    setTimeout(() => {
      if (iframeEl.src.includes('loading.html')) {
        appendToTerminal('\n[WARN] Server start timeout. Check logs above.\n');
      }
    }, 30000);
    
  } catch (error) {
    updateStatus('error');
    appendToTerminal('\n[ERROR] Failed to start server: ' + error.message + '\n');
  }
}

async function writeIndexJS(content) {
  try {
    await webcontainerInstance.fs.writeFile('/index.js', content);
    appendToTerminal('[FILE] Updated index.js\n');
  } catch (error) {
    appendToTerminal('[ERROR] Failed to write file: ' + error.message + '\n');
  }
}

function appendToTerminal(text) {
  const terminal = document.querySelector('.terminal-output');
  if (terminal) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  }
}

function clearTerminal() {
  const terminal = document.querySelector('.terminal-output');
  if (terminal) {
    terminal.innerHTML = '';
  }
}

function updateStatus(status) {
  const indicator = document.querySelector('.status-indicator');
  const statusText = document.querySelector('.status-text');
  
  if (!indicator || !statusText) return;
  
  indicator.className = 'status-indicator ' + status;
  
  const statusMap = {
    'installing': 'Installing dependencies...',
    'starting': 'Starting server...',
    'ready': 'Server running',
    'error': 'Error occurred'
  };
  
  statusText.textContent = statusMap[status] || status;
}

function showBootScreen(message) {
  const bootScreen = document.querySelector('.boot-screen');
  const bootText = document.querySelector('.boot-text');
  if (bootScreen && bootText) {
    bootScreen.style.display = 'flex';
    bootText.textContent = message;
  }
}

function hideBootScreen() {
  const bootScreen = document.querySelector('.boot-screen');
  if (bootScreen) {
    bootScreen.style.opacity = '0';
    setTimeout(() => {
      bootScreen.style.display = 'none';
    }, 300);
  }
}

function showError(message) {
  const bootScreen = document.querySelector('.boot-screen');
  const bootText = document.querySelector('.boot-text');
  if (bootScreen && bootText) {
    bootScreen.style.display = 'flex';
    bootScreen.style.background = '#1a0f0f';
    bootText.innerHTML = '<span style="color: #ff6b6b;">⚠️ ' + message + '</span><br><br><button onclick="location.reload()" style="padding: 10px 20px; background: #ff6b6b; border: none; color: white; border-radius: 4px; cursor: pointer;">Retry</button>';
  }
}

// DOM Elements - NO SVG, using emoji/icons instead
document.querySelector('#app').innerHTML = `
  <div class="ide-container">
    <div class="sidebar">
      <div class="sidebar-header">
        <span class="logo">⚡ WebContainer</span>
      </div>
      <div class="file-explorer">
        <div class="explorer-title">EXPLORER</div>
        <div class="file-list">
          <div class="file-item active">
            <span class="file-icon">JS</span>
            <span>index.js</span>
          </div>
          <div class="file-item">
            <span class="file-icon">📦</span>
            <span>package.json</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="main-content">
      <div class="editor-panel">
        <div class="panel-header">
          <div class="tab active">
            <span class="tab-icon">JS</span>
            <span>index.js</span>
            <span class="close-tab">×</span>
          </div>
        </div>
        <div class="editor-container">
          <div class="line-numbers">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
            <span>8</span>
            <span>9</span>
            <span>10</span>
          </div>
          <textarea spellcheck="false"></textarea>
        </div>
      </div>
      
      <div class="preview-panel">
        <div class="panel-header preview-header">
          <div class="preview-tabs">
            <div class="preview-tab active">🌐 Preview</div>
            <div class="preview-tab">📟 Terminal</div>
          </div>
          <div class="preview-controls">
            <button class="reload-btn" title="Reload">↻</button>
          </div>
        </div>
        
        <div class="preview-content">
          <div class="url-bar" style="display: none;">
            <div class="url-info">
              <span class="status-indicator"></span>
              <span class="status-text">Initializing...</span>
            </div>
            <a class="url-display" href="#" target="_blank" rel="noopener noreferrer"></a>
            <button class="open-tab-btn" title="Open in new tab">↗</button>
          </div>
          
          <div class="iframe-container">
            <iframe src="loading.html"></iframe>
          </div>
          
          <div class="terminal-panel">
            <div class="terminal-header">
              <span>Terminal</span>
              <button class="clear-terminal">Clear</button>
            </div>
            <div class="terminal-output"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="boot-screen">
    <div class="boot-content">
      <div class="spinner"></div>
      <div class="boot-text">Initializing WebContainer...</div>
    </div>
  </div>
`

/** @type {HTMLIFrameElement | null} */
const iframeEl = document.querySelector('iframe');

/** @type {HTMLTextAreaElement | null} */
const textareaEl = document.querySelector('textarea');

/** @type {HTMLDivElement | null} */
const urlBarEl = document.querySelector('.url-bar');

/** @type {HTMLAnchorElement | null} */
const urlDisplayEl = document.querySelector('.url-display');

/** @type {HTMLButtonElement | null} */
const openTabBtn = document.querySelector('.open-tab-btn');

openTabBtn?.addEventListener('click', () => {
  if (urlDisplayEl?.href) {
    window.open(urlDisplayEl.href, '_blank', 'noopener,noreferrer');
  }
});

// Tab switching for preview/terminal
const previewTabs = document.querySelectorAll('.preview-tab');
const iframeContainer = document.querySelector('.iframe-container');
const terminalPanel = document.querySelector('.terminal-panel');

previewTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    previewTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    if (index === 0) {
      iframeContainer.style.display = 'block';
      terminalPanel.style.display = 'none';
    } else {
      iframeContainer.style.display = 'none';
      terminalPanel.style.display = 'flex';
    }
  });
});

function initializeUI() {
  // Set initial content
  textareaEl.value = files['index.js'].file.contents;
  
  // Add input handler with debounce
  let timeout;
  textareaEl.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      writeIndexJS(e.currentTarget.value);
    }, 500);
  });

  // Setup terminal clear button
  document.querySelector('.clear-terminal')?.addEventListener('click', clearTerminal);
  
  // Setup reload button
  document.querySelector('.reload-btn')?.addEventListener('click', () => {
    iframeEl.src = iframeEl.src;
  });
}

async function installDependencies() {
  isInstalling = true;
  updateStatus('installing');
  
  try {
    const installProcess = await webcontainerInstance.spawn('npm', ['install']);
    
    installProcess.output.pipeTo(new WritableStream({
      write(data) {
        appendToTerminal(data);
      }
    }));
    
    // Add timeout for installation (2 minutes)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Installation timeout')), 120000);
    });
    
    const exitPromise = installProcess.exit;
    const exitCode = await Promise.race([exitPromise, timeoutPromise]);
    
    return exitCode;
  } catch (error) {
    appendToTerminal('\n[ERROR] ' + error.message + '\n');
    return 1;
  } finally {
    isInstalling = false;
  }
}

async function startDevServer() {
  updateStatus('starting');
  appendToTerminal('\n[SYSTEM] Starting development server...\n');
  
  try {
    await webcontainerInstance.spawn('npm', ['run', 'start']);
    
    webcontainerInstance.on('server-ready', (port, url) => {
      updateStatus('ready');
      iframeEl.src = url;
      urlDisplayEl.textContent = url;
      urlDisplayEl.href = url;
      urlBarEl.style.display = 'flex';
      appendToTerminal(`[SYSTEM] Server ready at ${url}\n`);
    });
    
    // Timeout if server doesn't start in 30 seconds
    setTimeout(() => {
      if (iframeEl.src.includes('loading.html')) {
        appendToTerminal('\n[WARN] Server start timeout. Check logs above.\n');
      }
    }, 30000);
    
  } catch (error) {
    updateStatus('error');
    appendToTerminal('\n[ERROR] Failed to start server: ' + error.message + '\n');
  }
}

async function writeIndexJS(content) {
  try {
    await webcontainerInstance.fs.writeFile('/index.js', content);
    appendToTerminal('[FILE] Updated index.js\n');
  } catch (error) {
    appendToTerminal('[ERROR] Failed to write file: ' + error.message + '\n');
  }
}

function appendToTerminal(text) {
  const terminal = document.querySelector('.terminal-output');
  if (terminal) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  }
}

function clearTerminal() {
  const terminal = document.querySelector('.terminal-output');
  if (terminal) {
    terminal.innerHTML = '';
  }
}

function updateStatus(status) {
  const indicator = document.querySelector('.status-indicator');
  const statusText = document.querySelector('.status-text');
  
  if (!indicator || !statusText) return;
  
  indicator.className = 'status-indicator ' + status;
  
  const statusMap = {
    'installing': 'Installing dependencies...',
    'starting': 'Starting server...',
    'ready': 'Server running',
    'error': 'Error occurred'
  };
  
  statusText.textContent = statusMap[status] || status;
}

function showBootScreen(message) {
  const bootScreen = document.querySelector('.boot-screen');
  const bootText = document.querySelector('.boot-text');
  if (bootScreen && bootText) {
    bootScreen.style.display = 'flex';
    bootText.textContent = message;
  }
}

function hideBootScreen() {
  const bootScreen = document.querySelector('.boot-screen');
  if (bootScreen) {
    bootScreen.style.opacity = '0';
    setTimeout(() => {
      bootScreen.style.display = 'none';
    }, 300);
  }
}

function showError(message) {
  const bootScreen = document.querySelector('.boot-screen');
  const bootText = document.querySelector('.boot-text');
  if (bootScreen && bootText) {
    bootScreen.style.display = 'flex';
    bootScreen.style.background = '#1a0f0f';
    bootText.innerHTML = '<span style="color: #ff6b6b;">⚠️ ' + message + '</span><br><br><button onclick="location.reload()" style="padding: 10px 20px; background: #ff6b6b; border: none; color: white; border-radius: 4px; cursor: pointer;">Retry</button>';
  }
}

// Create SVG icon as DOM element to avoid template literal issues
function createExternalLinkIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  
  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6');
  
  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', '15 3 21 3 21 9');
  
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '10');
  line.setAttribute('y1', '14');
  line.setAttribute('x2', '21');
  line.setAttribute('y2', '3');
  
  svg.appendChild(path1);
  svg.appendChild(polyline);
  svg.appendChild(line);
  
  return svg;
}

// DOM Elements
document.querySelector('#app').innerHTML = `
  <div class="ide-container">
    <div class="sidebar">
      <div class="sidebar-header">
        <span class="logo">⚡ WebContainer</span>
      </div>
      <div class="file-explorer">
        <div class="explorer-title">EXPLORER</div>
        <div class="file-list">
          <div class="file-item active">
            <span class="file-icon">📄</span>
            <span>index.js</span>
          </div>
          <div class="file-item">
            <span class="file-icon">📦</span>
            <span>package.json</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="main-content">
      <div class="editor-panel">
        <div class="panel-header">
          <div class="tab active">
            <span class="tab-icon">📄</span>
            <span>index.js</span>
            <span class="close-tab">×</span>
          </div>
        </div>
        <div class="editor-container">
          <div class="line-numbers">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
            <span>8</span>
            <span>9</span>
            <span>10</span>
          </div>
          <textarea spellcheck="false"></textarea>
        </div>
      </div>
      
      <div class="preview-panel">
        <div class="panel-header preview-header">
          <div class="preview-tabs">
            <div class="preview-tab active">🌐 Preview</div>
            <div class="preview-tab">📟 Terminal</div>
          </div>
          <div class="preview-controls">
            <button class="reload-btn" title="Reload">🔄</button>
          </div>
        </div>
        
        <div class="preview-content">
          <div class="url-bar" style="display: none;">
            <div class="url-info">
              <span class="status-indicator"></span>
              <span class="status-text">Initializing...</span>
            </div>
            <a class="url-display" href="#" target="_blank" rel="noopener noreferrer"></a>
            <button class="open-tab-btn" title="Open in new tab">
              <span class="icon-container"></span>
            </button>
          </div>
          
          <div class="iframe-container">
            <iframe src="loading.html"></iframe>
          </div>
          
          <div class="terminal-panel">
            <div class="terminal-header">
              <span>Terminal</span>
              <button class="clear-terminal">Clear</button>
            </div>
            <div class="terminal-output"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="boot-screen">
    <div class="boot-content">
      <div class="spinner"></div>
      <div class="boot-text">Initializing WebContainer...</div>
    </div>
  </div>
`

// Add SVG icon to button after DOM insertion
const openTabBtn = document.querySelector('.open-tab-btn');
if (openTabBtn) {
  const iconContainer = openTabBtn.querySelector('.icon-container');
  if (iconContainer) {
    iconContainer.appendChild(createExternalLinkIcon());
  }
}

/** @type {HTMLIFrameElement | null} */
const iframeEl = document.querySelector('iframe');

/** @type {HTMLTextAreaElement | null} */
const textareaEl = document.querySelector('textarea');

/** @type {HTMLDivElement | null} */
const urlBarEl = document.querySelector('.url-bar');

/** @type {HTMLAnchorElement | null} */
const urlDisplayEl = document.querySelector('.url-display');

openTabBtn?.addEventListener('click', () => {
  if (urlDisplayEl?.href) {
    window.open(urlDisplayEl.href, '_blank', 'noopener,noreferrer');
  }
});

// Tab switching for preview/terminal
const previewTabs = document.querySelectorAll('.preview-tab');
const iframeContainer = document.querySelector('.iframe-container');
const terminalPanel = document.querySelector('.terminal-panel');

previewTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    previewTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    if (index === 0) {
      iframeContainer.style.display = 'block';
      terminalPanel.style.display = 'none';
    } else {
      iframeContainer.style.display = 'none';
      terminalPanel.style.display = 'flex';
    }
  });
});

function initializeUI() {
  // Set initial content
  textareaEl.value = files['index.js'].file.contents;
  
  // Add input handler with debounce
  let timeout;
  textareaEl.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      writeIndexJS(e.currentTarget.value);
    }, 500);
  });

  // Setup terminal clear button
  document.querySelector('.clear-terminal')?.addEventListener('click', clearTerminal);
  
  // Setup reload button
  document.querySelector('.reload-btn')?.addEventListener('click', () => {
    iframeEl.src = iframeEl.src;
  });
}

async function installDependencies() {
  isInstalling = true;
  updateStatus('installing');
  
  try {
    const installProcess = await webcontainerInstance.spawn('npm', ['install']);
    
    installProcess.output.pipeTo(new WritableStream({
      write(data) {
        appendToTerminal(data);
      }
    }));
    
    // Add timeout for installation (2 minutes)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Installation timeout')), 120000);
    });
    
    const exitPromise = installProcess.exit;
    const exitCode = await Promise.race([exitPromise, timeoutPromise]);
    
    return exitCode;
  } catch (error) {
    appendToTerminal('\\n[ERROR] ' + error.message + '\\n');
    return 1;
  } finally {
    isInstalling = false;
  }
}

async function startDevServer() {
  updateStatus('starting');
  appendToTerminal('\\n[SYSTEM] Starting development server...\\n');
  
  try {
    await webcontainerInstance.spawn('npm', ['run', 'start']);
    
    webcontainerInstance.on('server-ready', (port, url) => {
      updateStatus('ready');
      iframeEl.src = url;
      urlDisplayEl.textContent = url;
      urlDisplayEl.href = url;
      urlBarEl.style.display = 'flex';
      appendToTerminal(`[SYSTEM] Server ready at ${url}\\n`);
    });
    
    // Timeout if server doesn't start in 30 seconds
    setTimeout(() => {
      if (iframeEl.src.includes('loading.html')) {
        appendToTerminal('\\n[WARN] Server start timeout. Check logs above.\\n');
      }
    }, 30000);
    
  } catch (error) {
    updateStatus('error');
    appendToTerminal('\\n[ERROR] Failed to start server: ' + error.message + '\\n');
  }
}

async function writeIndexJS(content) {
  try {
    await webcontainerInstance.fs.writeFile('/index.js', content);
    appendToTerminal('[FILE] Updated index.js\\n');
  } catch (error) {
    appendToTerminal('[ERROR] Failed to write file: ' + error.message + '\\n');
  }
}

function appendToTerminal(text) {
  const terminal = document.querySelector('.terminal-output');
  if (terminal) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  }
}

function clearTerminal() {
  const terminal = document.querySelector('.terminal-output');
  if (terminal) {
    terminal.innerHTML = '';
  }
}

function updateStatus(status) {
  const indicator = document.querySelector('.status-indicator');
  const statusText = document.querySelector('.status-text');
  
  if (!indicator || !statusText) return;
  
  indicator.className = 'status-indicator ' + status;
  
  const statusMap = {
    'installing': 'Installing dependencies...',
    'starting': 'Starting server...',
    'ready': 'Server running',
    'error': 'Error occurred'
  };
  
  statusText.textContent = statusMap[status] || status;
}

function showBootScreen(message) {
  const bootScreen = document.querySelector('.boot-screen');
  const bootText = document.querySelector('.boot-text');
  if (bootScreen && bootText) {
    bootScreen.style.display = 'flex';
    bootText.textContent = message;
  }
}

function hideBootScreen() {
  const bootScreen = document.querySelector('.boot-screen');
  if (bootScreen) {
    bootScreen.style.opacity = '0';
    setTimeout(() => {
      bootScreen.style.display = 'none';
    }, 300);
  }
}

function showError(message) {
  const bootScreen = document.querySelector('.boot-screen');
  const bootText = document.querySelector('.boot-text');
  if (bootScreen && bootText) {
    bootScreen.style.display = 'flex';
    bootScreen.style.background = '#1a0f0f';
    bootText.innerHTML = `<span style="color: #ff6b6b;">⚠️ ${message}</span><br><br><button onclick="location.reload()" style="padding: 10px 20px; background: #ff6b6b; border: none; color: white; border-radius: 4px; cursor: pointer;">Retry</button>`;
  }
}

// DOM Elements
document.querySelector('#app').innerHTML = `
  <div class="ide-container">
    <div class="sidebar">
      <div class="sidebar-header">
        <span class="logo">⚡ WebContainer</span>
      </div>
      <div class="file-explorer">
        <div class="explorer-title">EXPLORER</div>
        <div class="file-list">
          <div class="file-item active">
            <span class="file-icon">📄</span>
            <span>index.js</span>
          </div>
          <div class="file-item">
            <span class="file-icon">📦</span>
            <span>package.json</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="main-content">
      <div class="editor-panel">
        <div class="panel-header">
          <div class="tab active">
            <span class="tab-icon">📄</span>
            <span>index.js</span>
            <span class="close-tab">×</span>
          </div>
        </div>
        <div class="editor-container">
          <div class="line-numbers">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
            <span>8</span>
            <span>9</span>
            <span>10</span>
          </div>
          <textarea spellcheck="false"></textarea>
        </div>
      </div>
      
      <div class="preview-panel">
        <div class="panel-header preview-header">
          <div class="preview-tabs">
            <div class="preview-tab active">🌐 Preview</div>
            <div class="preview-tab">📟 Terminal</div>
          </div>
          <div class="preview-controls">
            <button class="reload-btn" title="Reload">🔄</button>
          </div>
        </div>
        
        <div class="preview-content">
          <div class="url-bar" style="display: none;">
            <div class="url-info">
              <span class="status-indicator"></span>
              <span class="status-text">Initializing...</span>
            </div>
            <a class="url-display" href="#" target="_blank" rel="noopener noreferrer"></a>
            <button class="open-tab-btn" title="Open in new tab">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </button>
          </div>
          
          <div class="iframe-container">
            <iframe src="loading.html"></iframe>
          </div>
          
          <div class="terminal-panel">
            <div class="terminal-header">
              <span>Terminal</span>
              <button class="clear-terminal">Clear</button>
            </div>
            <div class="terminal-output"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="boot-screen">
    <div class="boot-content">
      <div class="spinner"></div>
      <div class="boot-text">Initializing WebContainer...</div>
    </div>
  </div>
`

/** @type {HTMLIFrameElement | null} */
const iframeEl = document.querySelector('iframe');

/** @type {HTMLTextAreaElement | null} */
const textareaEl = document.querySelector('textarea');

/** @type {HTMLDivElement | null} */
const urlBarEl = document.querySelector('.url-bar');

/** @type {HTMLAnchorElement | null} */
const urlDisplayEl = document.querySelector('.url-display');

/** @type {HTMLButtonElement | null} */
const openTabBtn = document.querySelector('.open-tab-btn');

openTabBtn?.addEventListener('click', () => {
  if (urlDisplayEl?.href) {
    window.open(urlDisplayEl.href, '_blank', 'noopener,noreferrer');
  }
});

// Tab switching for preview/terminal
const previewTabs = document.querySelectorAll('.preview-tab');
const iframeContainer = document.querySelector('.iframe-container');
const terminalPanel = document.querySelector('.terminal-panel');

previewTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    previewTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    if (index === 0) {
      iframeContainer.style.display = 'block';
      terminalPanel.style.display = 'none';
    } else {
      iframeContainer.style.display = 'none';
      terminalPanel.style.display = 'flex';
    }
  });
});
        <button class="open-tab-btn" title="Open in new tab">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
      </div>
      <iframe src="loading.html"></iframe>
    </div>
  </div>
`

/** @type {HTMLIFrameElement | null} */
const iframeEl = document.querySelector('iframe');

/** @type {HTMLTextAreaElement | null} */
const textareaEl = document.querySelector('textarea');

/** @type {HTMLDivElement | null} */
const urlBarEl = document.querySelector('.url-bar');

/** @type {HTMLAnchorElement | null} */
const urlDisplayEl = document.querySelector('.url-display');

/** @type {HTMLButtonElement | null} */
const openTabBtn = document.querySelector('.open-tab-btn');

openTabBtn?.addEventListener('click', () => {
  if (urlDisplayEl?.href) {
    window.open(urlDisplayEl.href, '_blank', 'noopener,noreferrer');
  }
});
