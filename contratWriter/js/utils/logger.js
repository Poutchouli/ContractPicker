/**
 * Module de journalisation
 * Ce module fournit des fonctions pour la journalisation et la gestion des erreurs
 */

// État de la console d'erreurs
const consoleState = {
    visible: true,
    minimized: false,
    logs: []
};

// Couleurs pour les différents niveaux de log
const logLevels = {
    info: { color: 'var(--log-info-color, #2196F3)', label: 'INFO' },
    warning: { color: 'var(--log-warning-color, #FF9800)', label: 'WARN' },
    error: { color: 'var(--log-error-color, #F44336)', label: 'ERROR' },
    success: { color: 'var(--log-success-color, #4CAF50)', label: 'SUCCESS' }
};

// Maximum de logs à conserver
const MAX_LOGS = 100;

/**
 * Initialise la console d'erreurs
 */
export function initErrorConsole() {
    // Créer la console d'erreurs si elle n'existe pas
    let errorConsole = document.getElementById('error-console');
    
    if (!errorConsole) {
        errorConsole = document.createElement('div');
        errorConsole.id = 'error-console';
        errorConsole.className = 'error-console';
        
        errorConsole.innerHTML = `
            <div class="error-console-header">
                <div class="error-console-title">Console</div>
                <div class="error-console-controls">
                    <button class="error-console-clear" title="Effacer">🗑️</button>
                    <button class="error-console-minimize" title="Réduire">_</button>
                </div>
            </div>
            <div class="error-console-content">
                <div class="error-console-logs"></div>
            </div>
        `;
        
        document.body.appendChild(errorConsole);
    }
    
    // Rendre la console déplaçable
    makeDraggable(errorConsole);
    
    // Ajouter les gestionnaires d'événements
    const minimizeBtn = errorConsole.querySelector('.error-console-minimize');
    const clearBtn = errorConsole.querySelector('.error-console-clear');
    
    if (minimizeBtn) {
        // Supprimer les gestionnaires d'événements existants pour éviter les doublons
        const newMinimizeBtn = minimizeBtn.cloneNode(true);
        minimizeBtn.parentNode.replaceChild(newMinimizeBtn, minimizeBtn);
        
        newMinimizeBtn.addEventListener('click', () => {
            errorConsole.classList.toggle('minimized');
            consoleState.minimized = errorConsole.classList.contains('minimized');
            // Mettre à jour le texte du bouton selon l'état
            newMinimizeBtn.textContent = consoleState.minimized ? '□' : '_';
            newMinimizeBtn.title = consoleState.minimized ? 'Agrandir' : 'Réduire';
        });
    }
    
    if (clearBtn) {
        // Supprimer les gestionnaires d'événements existants pour éviter les doublons
        const newClearBtn = clearBtn.cloneNode(true);
        clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
        
        newClearBtn.addEventListener('click', () => {
            const logsContainer = errorConsole.querySelector('.error-console-logs');
            if (logsContainer) {
                logsContainer.innerHTML = '';
                consoleState.logs = [];
                // Afficher une confirmation
                addLog('Console effacée', 'success');
            }
        });
    }
    
    // Remplacer les fonctions console.* natives
    overrideConsoleMethods();
    
    // Capturer les erreurs non gérées
    window.addEventListener('error', function(event) {
        logError(`Erreur non gérée: ${event.message} à ${event.filename}:${event.lineno}`);
    });
    
    // Capturer les rejets de promesses non gérés
    window.addEventListener('unhandledrejection', function(event) {
        logError(`Promesse rejetée non gérée: ${event.reason}`);
    });
    
    return errorConsole;
}

/**
 * Ajoute un log à la console d'erreurs
 * @param {string} message - Message à journaliser
 * @param {string} level - Niveau de log (info, warning, error, success)
 */
function addLog(message, level = 'info') {
    if (!message) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const logInfo = {
        message: message,
        level: level,
        timestamp: timestamp
    };
    
    // Ajouter à l'état
    consoleState.logs.push(logInfo);
    
    // Limiter le nombre de logs
    if (consoleState.logs.length > MAX_LOGS) {
        consoleState.logs.shift();
    }
    
    // Ajouter au DOM s'il existe
    const errorConsole = document.getElementById('error-console');
    if (!errorConsole) return;
    
    // S'assurer que le conteneur de logs existe
    let logsContainer = errorConsole.querySelector('.error-console-logs');
    if (!logsContainer) {
        logsContainer = document.createElement('div');
        logsContainer.className = 'error-console-logs';
        const contentContainer = errorConsole.querySelector('.error-console-content');
        if (contentContainer) {
            contentContainer.appendChild(logsContainer);
        } else {
            return;
        }
    }
    
    const logElement = document.createElement('div');
    logElement.className = `log-entry log-${level}`;
    
    const logLevelInfo = logLevels[level] || logLevels.info;
    
    logElement.innerHTML = `
        <span class="log-timestamp">${timestamp}</span>
        <span class="log-level" style="color: ${logLevelInfo.color}">[${logLevelInfo.label}]</span>
        <span class="log-message">${escapeHtml(message)}</span>
    `;
    
    logsContainer.appendChild(logElement);
    logsContainer.scrollTop = logsContainer.scrollHeight;
    
    // Auto-développer la console pour les logs importants
    autoExpandConsoleIfImportant(level);
}

/**
 * Journalise un message de niveau info
 * @param {string} message - Message à journaliser
 */
export function logInfo(message) {
    addLog(message, 'info');
}

/**
 * Journalise un message de niveau warning
 * @param {string} message - Message à journaliser
 */
export function logWarning(message) {
    addLog(message, 'warning');
}

/**
 * Journalise un message de niveau error
 * @param {string} message - Message à journaliser
 */
export function logError(message) {
    addLog(message, 'error');
}

/**
 * Journalise un message de niveau success
 * @param {string} message - Message à journaliser
 */
export function logSuccess(message) {
    addLog(message, 'success');
}

/**
 * Affiche des logs de test pour démontrer la fonctionnalité
 * Usage pour développement uniquement
 */
export function showTestLogs() {
    logInfo("Test d'information");
    logWarning("Test d'avertissement");
    logError("Test d'erreur");
    logSuccess("Test de succès");
}

/**
 * Remplace les fonctions console.* natives
 * pour pouvoir capturer les logs dans notre console personnalisée
 */
function overrideConsoleMethods() {
    const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error
    };
    
    console.log = function(...args) {
        originalConsole.log.apply(console, args);
        logInfo(args.join(' '));
    };
    
    console.info = function(...args) {
        originalConsole.info.apply(console, args);
        logInfo(args.join(' '));
    };
    
    console.warn = function(...args) {
        originalConsole.warn.apply(console, args);
        logWarning(args.join(' '));
    };
    
    console.error = function(...args) {
        originalConsole.error.apply(console, args);
        logError(args.join(' '));
    };
}

/**
 * Rend un élément HTML déplaçable
 * @param {HTMLElement} element - Élément à rendre déplaçable
 */
function makeDraggable(element) {
    const header = element.querySelector('.error-console-header');
    if (!header) return;
    
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    
    header.addEventListener('mousedown', (e) => {
        // Ignorer les clics sur les boutons
        if (e.target.tagName === 'BUTTON') return;
        
        isDragging = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        
        // Ajouter un style de curseur pour indiquer le déplacement
        header.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const newLeft = e.clientX - offsetX;
        const newTop = e.clientY - offsetY;
        
        // Limiter la position à l'intérieur de la fenêtre
        const maxX = window.innerWidth - element.offsetWidth;
        const maxY = window.innerHeight - element.offsetHeight;
        
        element.style.left = Math.max(0, Math.min(maxX, newLeft)) + 'px';
        element.style.top = Math.max(0, Math.min(maxY, newTop)) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            header.style.cursor = 'grab';
        }
    });
    
    // Style initial
    header.style.cursor = 'grab';
}

/**
 * Échappe les caractères HTML spéciaux
 * @param {string} text - Texte à échapper
 * @returns {string} - Texte échappé
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Auto-expands the console when important messages arrive
 * @param {string} level - Log level
 */
function autoExpandConsoleIfImportant(level) {
    // Only auto-expand for errors and warnings
    if (level !== 'error' && level !== 'warning') return;
    
    const errorConsole = document.getElementById('error-console');
    if (!errorConsole) return;
    
    // If console is minimized, expand it
    if (errorConsole.classList.contains('minimized')) {
        errorConsole.classList.remove('minimized');
        consoleState.minimized = false;
        
        // Update minimize button text
        const minimizeBtn = errorConsole.querySelector('.error-console-minimize');
        if (minimizeBtn) {
            minimizeBtn.textContent = '_';
            minimizeBtn.title = 'Réduire';
        }
    }
    
    // Make sure the console is visible
    errorConsole.style.display = 'flex';
}
