/**
 * Application principale pour la gestion des contrats
 * Ce fichier centralise les interactions entre les différents modules
 */
import { showNotification } from './utils/helpers.js';
import { initContractManager, createNewOffer, groupSelectedOffers, setNextOfferId, setNextGroupId } from './modules/contractManager.js';
import { downloadContractsAsFile, importContractsFromCSV, exportContractsToJSON } from './modules/csvManager.js';
import { initTemplateManager, getCurrentTemplate, openTemplateModal, openSimpleTemplateEditor, setCurrentTemplate } from './modules/templateManager.js';
import { initExtraCostManager } from './modules/extraCostManager.js';
import { initErrorConsole, logError, logInfo, logWarning, logSuccess } from './utils/logger.js';
import { initLanguageManager, getLanguageManager, translate } from './modules/languageManager.js';
import { PremadeTemplateManager } from './modules/premadeTemplates.js';
import { initModalManager, getModalManager, openModal, closeModal, closeAllModals } from './modules/modalManager.js';

// État global de l'application
const appState = {
    nextOfferId: 2,
    nextGroupId: 1,
    debug: false,
    languageManager: null,
    premadeTemplateManager: null,
    modalManager: null
};

/**
 * Initialise l'application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Références DOM
    const offersContainer = document.getElementById('offers-container');
    const addOfferBtn = document.getElementById('add-offer-btn');
    const groupOffersBtn = document.getElementById('group-offers-btn');
    const exportBtn = document.getElementById('export-csv-btn');
    const exportAsCSV = document.getElementById('export-as-csv');
    const exportAsJSON = document.getElementById('export-as-json');
    const importBtn = document.getElementById('import-csv-btn');
    const importInput = document.getElementById('import-csv-input');
    const templateManagerBtn = document.getElementById('template-manager-btn');

    // Vérifier que tous les éléments nécessaires sont présents
    if (!offersContainer) {
        logError("Élément #offers-container introuvable dans le DOM");
        return;
    }

    // Initialiser le gestionnaire de templates
    try {
        initTemplateManager(() => {
            // Callback lors du changement de template
            updateOffersWithCurrentTemplate();
        });
        logInfo("Gestionnaire de templates initialisé avec succès");
        
        // Ensure all template manager functions are globally available
        setTimeout(() => {
            ensureTemplateManagerFunctionsAvailable();
        }, 500); // Small delay to allow templateManager.js to finish loading
        
    } catch (error) {
        logError(`Erreur lors de l'initialisation du gestionnaire de templates: ${error.message}`);
    }

    // Initialiser le gestionnaire de contrats
    initContractManager(offersContainer, updateOffersTotalSummary);
    
    // Initialiser le gestionnaire de coûts supplémentaires
    initExtraCostManager(offersContainer);

    // Initialiser la console d'erreurs
    initErrorConsole();
    
    // Initialiser le gestionnaire de langues
    try {
        appState.languageManager = initLanguageManager();
        logInfo("Gestionnaire de langues initialisé avec succès");
    } catch (error) {
        logError(`Erreur lors de l'initialisation du gestionnaire de langues: ${error.message}`);
    }
    
    // Initialiser le gestionnaire de templates prédéfinis
    try {
        appState.premadeTemplateManager = new PremadeTemplateManager(appState.languageManager);
        logInfo("Gestionnaire de templates prédéfinis initialisé avec succès");
    } catch (error) {
        logError(`Erreur lors de l'initialisation du gestionnaire de templates prédéfinis: ${error.message}`);
    }
    
    // Initialiser le gestionnaire de modales
    try {
        appState.modalManager = initModalManager();
        logInfo("Gestionnaire de modales initialisé avec succès");
    } catch (error) {
        logError(`Erreur lors de l'initialisation du gestionnaire de modales: ${error.message}`);
    }

    // Interface de gestion des contrats initialisée
    logInfo("Interface de gestion des contrats initialisée");

    // Ajouter un gestionnaire pour le bouton d'ajout d'offre
    if (addOfferBtn) {
        addOfferBtn.addEventListener('click', () => {
            createNewOffer(offersContainer);
            updateOffersTotalSummary();
            logInfo("Nouvelle offre ajoutée");
        });
    } else {
        logError("Bouton #add-offer-btn introuvable dans le DOM");
    }

    // Ajouter un gestionnaire pour le bouton de regroupement des offres
    if (groupOffersBtn) {
        groupOffersBtn.addEventListener('click', () => {
            groupSelectedOffers(offersContainer);
            updateOffersTotalSummary();
            logInfo("Offres regroupées");
        });
    } else {
        logError("Bouton #group-offers-btn introuvable dans le DOM");
    }

    // Ajouter un gestionnaire pour le bouton d'export
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            downloadContractsAsFile(offersContainer);
            logInfo("Export au format JSON");
        });
    } else {
        logError("Bouton #export-csv-btn introuvable dans le DOM");
    }

    // Ajouter un gestionnaire pour le bouton d'import
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            importInput.click();
        });
        
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.json')) {
                    importContractsFromCSV(file, offersContainer, createNewOffer);
                    logInfo("Import fichier en cours");
                } else {
                    logError("Format de fichier non supporté. Veuillez choisir un fichier CSV ou JSON.");
                    showNotification('Format de fichier non supporté. Veuillez choisir un fichier CSV ou JSON.', 'error');
                }
            }
        });
    } else {
        logError("Bouton #import-csv-btn ou champ #import-csv-input introuvable dans le DOM");
    }

    // Ajouter un gestionnaire pour le bouton du gestionnaire de template
    if (templateManagerBtn) {
        templateManagerBtn.addEventListener('click', () => {
            // Show premade template selector first
            if (appState.premadeTemplateManager) {
                appState.premadeTemplateManager.showTemplateSelector();
            } else {
                openTemplateModal();
            }
            logInfo("Gestionnaire de templates ouvert");
        });
    } else {
        logError("Bouton #template-manager-btn introuvable dans le DOM");
    }
    
    // Event handler for premade template selection
    document.addEventListener('premadeTemplateSelected', (e) => {
        const { template } = e.detail;
        logInfo(`Template prédéfini sélectionné: ${template.name}`);
        
        // Apply template to create new offer
        if (template && template.fields) {
            createNewOfferFromTemplate(template, offersContainer);
            updateOffersTotalSummary();
        }
    });

    // Ajouter un gestionnaire pour le bouton d'aide
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeHelpModal = document.getElementById('close-help-modal');
    const testTemplateManager = document.getElementById('test-template-manager');
    
    if (helpBtn && helpModal) {
        helpBtn.addEventListener('click', () => {
            helpModal.classList.add('active');
            logInfo("Modal d'aide ouverte");
        });
    }
    
    if (closeHelpModal && helpModal) {
        closeHelpModal.addEventListener('click', () => {
            helpModal.classList.remove('active');
        });
    }
    
    if (testTemplateManager) {
        testTemplateManager.addEventListener('click', () => {
            // Run template manager tests
            if (window.templateManagerTests) {
                window.templateManagerTests.runAllTests();
            } else {
                logWarning("Tests de template manager non disponibles");
            }
        });
    }
    
    // Close modal on overlay click
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.remove('active');
            }
        });
    }
    
    // Créer une première offre
    createNewOffer(offersContainer);
    
    // Initialiser les raccourcis clavier
    initKeyboardShortcuts();
    
    // Initialiser les menus déroulants
    initDropdownMenus();
    
    // Initialiser l'auto-sauvegarde
    initAutoSave();
    
    // Initialiser les menus de navigation déroulants
    initDropdownMenus();
    
    // Initialize color theme functionality
    initColorThemes();
    
    // Listen for language changes to update totals
    document.addEventListener('languageChanged', () => {
        updateOffersTotalSummary();
        logInfo('Totaux mis à jour après changement de langue');
    });
    
    logInfo("Application initialisée avec succès");
});

/**
 * Met à jour toutes les offres avec le template actuel
 */
function updateOffersWithCurrentTemplate() {
    const template = getCurrentTemplate();
    if (!template) {
        logError("Aucun template disponible pour la mise à jour");
        return;
    }
    
    const allOfferCards = document.querySelectorAll('.offer-card');
    
    if (allOfferCards.length === 0) {
        logInfo("Aucune offre à mettre à jour");
        return;
    }
    
    allOfferCards.forEach((card, index) => {
        try {
            // Récupérer les données actuelles avant de mettre à jour
            const currentData = {};
            template.fields.forEach(field => {
                const input = card.querySelector(`[data-field="${field.id}"]`);
                if (input) {
                    currentData[field.id] = input.value;
                }
            });
            
            updateCardWithTemplate(card, template, currentData);
        } catch (error) {
            logError(`Erreur lors de la mise à jour de l'offre ${index + 1}: ${error.message}`);
        }
    });
    
    logInfo(`${allOfferCards.length} offre(s) mise(s) à jour avec le template actuel`);
}

/**
 * Met à jour une carte d'offre avec le template actuel
 * @param {HTMLElement} card - Carte d'offre à mettre à jour
 * @param {Object} template - Template à appliquer
 * @param {Object} currentData - Données actuelles à conserver
 */
function updateCardWithTemplate(card, template, currentData = {}) {
    const inputsContainer = card.querySelector('.offer-inputs');
    if (!inputsContainer) return;
    
    // Vider le conteneur
    inputsContainer.innerHTML = '';
    
    // Ajouter les champs du template
    template.fields.forEach(field => {
        const fieldWrapper = document.createElement('div');
        fieldWrapper.className = 'field-wrapper';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        fieldWrapper.appendChild(label);
        
        let input;
        
        switch (field.type) {
            case 'textarea':
                input = document.createElement('textarea');
                input.placeholder = field.placeholder || '';
                break;
            case 'select':
                input = document.createElement('select');
                if (field.options) {
                    field.options.forEach(option => {
                        const optionEl = document.createElement('option');
                        optionEl.value = option.value;
                        optionEl.textContent = option.label;
                        input.appendChild(optionEl);
                    });
                }
                break;
            default: // text, number, etc.
                input = document.createElement('input');
                input.type = field.type || 'text';
                input.placeholder = field.placeholder || '';
        }
        
        input.dataset.field = field.id;
        
        // Restaurer les données existantes
        if (currentData[field.id]) {
            input.value = currentData[field.id];
        }
        
        // Ajouter une classe pour les champs requis
        if (field.required) {
            input.classList.add('required');
        }
        
        fieldWrapper.appendChild(input);
        inputsContainer.appendChild(fieldWrapper);
    });
}

/**
 * Met à jour le résumé des offres
 */
function updateOffersTotalSummary() {
    const startTime = performance.now();
    
    const totalSummaryElement = document.getElementById('offers-total-summary');
    if (!totalSummaryElement) {
        logWarning("Élément offers-total-summary introuvable");
        return;
    }
    
    const offerCards = document.querySelectorAll('.offer-card');
    const groupedOfferCards = document.querySelectorAll('.grouped-offer-card');
    
    // Calculer le total
    let totalCost = 0;
    let totalCount = offerCards.length + groupedOfferCards.length;
    let processedCards = 0;
    
    try {
        offerCards.forEach(card => {
            const costInput = card.querySelector('[data-field="offer-cost"]');
            const costTypeSelect = card.querySelector('[data-field="offer-cost-type"]');
            
            if (costInput && costInput.value) {
                const cost = parseFloat(costInput.value);
                
                if (!isNaN(cost)) {
                    // Appliquer un multiplicateur selon le type de coût
                    let multiplier = 1;
                    if (costTypeSelect) {
                        switch (costTypeSelect.value) {
                            case 'monthly': multiplier = 12; break;
                            case 'quarterly': multiplier = 4; break;
                            case 'yearly': multiplier = 1; break;
                        }
                    }
                    
                    totalCost += cost * multiplier;
                    processedCards++;
                }
            }
        });
        
        // Ajouter les coûts des offres groupées
        groupedOfferCards.forEach(card => {
            const costElement = card.querySelector('.grouped-total-cost');
            if (costElement) {
                const costText = costElement.textContent;
                const costMatch = costText.match(/[\d.,]+/);
                
                if (costMatch) {
                    const cost = parseFloat(costMatch[0].replace(',', '.'));
                    if (!isNaN(cost)) {
                        totalCost += cost;
                        processedCards++;
                    }
                }
            }
        });
        
        // Ajouter les coûts supplémentaires
        const extraCosts = calculateExtraCosts();
        totalCost += extraCosts;
        
        // Mettre à jour l'affichage avec support multilingue
        const currentLang = appState.languageManager ? appState.languageManager.getCurrentLanguage() : 'fr';
        const totalLabel = appState.languageManager ? appState.languageManager.getTranslation('totalAnnual') : 'Total annuel';
        const offersCountLabel = appState.languageManager ? appState.languageManager.getTranslation('numberOfOffers') : 'Nombre d\'offres';
        const processedLabel = appState.languageManager ? appState.languageManager.getTranslation('processed') : 'Traités';
        const extraCostsLabel = appState.languageManager ? appState.languageManager.getTranslation('additionalCosts') : 'Coûts supplémentaires';
        
        totalSummaryElement.innerHTML = `
            <div class="summary-title">${totalLabel}</div>
            <div class="summary-item">
                <span class="summary-item-label">${offersCountLabel}:</span>
                <span class="summary-item-value">${totalCount}</span>
            </div>
            ${extraCosts > 0 ? `
            <div class="summary-item">
                <span class="summary-item-label">${extraCostsLabel}:</span>
                <span class="summary-item-value">${extraCosts.toLocaleString('fr-FR')} €</span>
            </div>
            ` : ''}
            <div class="summary-total">
                <span class="summary-total-label">${totalLabel}:</span>
                <span class="summary-total-value">${totalCost.toLocaleString('fr-FR')} €</span>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">${processedLabel}: ${processedCards}</div>
        `;
        
        const endTime = performance.now();
        if (endTime - startTime > 100) {
            logWarning(`Mise à jour du résumé lente: ${Math.round(endTime - startTime)}ms`);
        }
        
    } catch (error) {
        logError(`Erreur lors de la mise à jour du résumé: ${error.message}`);
        totalSummaryElement.innerHTML = `
            <div style="color: #f44336;">Erreur de calcul</div>
        `;
    }
}

/**
 * Initialise les raccourcis clavier
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // The unified modal manager handles escape key for all modals
        // No need for manual escape handling here
        
        // Vérifier si Ctrl ou Cmd est pressé
        const isModifierPressed = e.ctrlKey || e.metaKey;
        
        if (!isModifierPressed) return;
        
        switch (e.code) {
            case 'KeyN': // Ctrl+N - Nouvelle offre
                e.preventDefault();
                const container = document.getElementById('offers-container');
                if (container) {
                    createNewOffer(container);
                    updateOffersTotalSummary();
                    logInfo("Nouvelle offre créée via raccourci clavier");
                }
                break;
                
            case 'KeyS': // Ctrl+S - Sauvegarder/Exporter
                e.preventDefault();
                const exportBtn = document.getElementById('export-csv-btn');
                if (exportBtn) {
                    exportBtn.click();
                    logInfo("Export déclenché via raccourci clavier");
                }
                break;
                
            case 'KeyO': // Ctrl+O - Ouvrir/Importer
                e.preventDefault();
                const importBtn = document.getElementById('import-csv-btn');
                if (importBtn) {
                    importBtn.click();
                    logInfo("Import déclenché via raccourci clavier");
                }
                break;
                
            case 'KeyG': // Ctrl+G - Grouper
                e.preventDefault();
                const groupBtn = document.getElementById('group-offers-btn');
                if (groupBtn) {
                    groupBtn.click();
                    logInfo("Groupement déclenché via raccourci clavier");
                }
                break;
                
            case 'KeyT': // Ctrl+T - Templates
                e.preventDefault();
                const templateBtn = document.getElementById('template-manager-btn');
                if (templateBtn) {
                    templateBtn.click();
                    logInfo("Gestionnaire de templates ouvert via raccourci clavier");
                }
                break;
                
            case 'KeyH': // Ctrl+H - Aide
                e.preventDefault();
                const helpBtn = document.getElementById('help-btn');
                if (helpBtn) {
                    helpBtn.click();
                    logInfo("Aide ouverte via raccourci clavier");
                }
                break;
        }
    });
    
    logInfo("Raccourcis clavier initialisés (Ctrl+N, Ctrl+S, Ctrl+O, Ctrl+G, Ctrl+T, Ctrl+H)");
}

/**
 * Initialise la sauvegarde automatique
 */
function initAutoSave() {
    // Sauvegarder automatiquement toutes les 30 secondes
    setInterval(() => {
        try {
            const offersContainer = document.getElementById('offers-container');
            if (offersContainer && offersContainer.children.length > 0) {
                // Sauvegarder dans localStorage comme backup
                const backupData = {
                    timestamp: new Date().toISOString(),
                    html: offersContainer.innerHTML,
                    title: 'ContractPicker Backup'
                };
                
                localStorage.setItem('contractPicker_autoSave', JSON.stringify(backupData));
                logInfo("Sauvegarde automatique effectuée");
            }
        } catch (error) {
            logError(`Erreur lors de la sauvegarde automatique: ${error.message}`);
        }
    }, 30000); // 30 secondes
}

/**
 * Calcule le total des coûts supplémentaires annualisés
 * @returns {number} Total des coûts supplémentaires par an
 */
function calculateExtraCosts() {
    let totalExtraCosts = 0;
    let processedRows = 0;
    
    try {
        const extraCostRows = document.querySelectorAll('.extra-cost-row');
        logInfo(`Calcul des coûts supplémentaires: ${extraCostRows.length} lignes trouvées`);
        
        extraCostRows.forEach((row, index) => {
            const amountInput = row.querySelector('.extra-cost-amount');
            const frequencyInput = row.querySelector('.extra-cost-frequency');
            const periodSelect = row.querySelector('.extra-cost-period');
            
            if (amountInput && amountInput.value && periodSelect && periodSelect.value) {
                const amount = parseFloat(amountInput.value);
                const frequency = frequencyInput ? parseInt(frequencyInput.value) || 1 : 1;
                
                if (!isNaN(amount) && amount > 0) {
                    let annualizedCost = 0;
                    
                    switch (periodSelect.value) {
                        case 'month':
                            annualizedCost = amount * frequency * 12;
                            break;
                        case 'quarter':
                            annualizedCost = amount * frequency * 4;
                            break;
                        case 'year':
                            annualizedCost = amount * frequency;
                            break;
                        case 'week':
                            annualizedCost = amount * frequency * 52;
                            break;
                        case 'day':
                            annualizedCost = amount * frequency * 365;
                            break;
                        case 'once':
                            annualizedCost = amount;
                            break;
                        default:
                            annualizedCost = amount * frequency;
                    }
                    
                    totalExtraCosts += annualizedCost;
                    processedRows++;
                    logInfo(`Coût supplémentaire ${index + 1}: ${amount}€ x ${frequency} ${periodSelect.value} = ${annualizedCost}€/an`);
                }
            }
        });
        
        logInfo(`Total des coûts supplémentaires: ${totalExtraCosts}€/an (${processedRows} lignes traitées)`);
        
    } catch (error) {
        logError(`Erreur lors du calcul des coûts supplémentaires: ${error.message}`);
    }
    
    return totalExtraCosts;
}

/**
 * Valide l'intégrité des données de l'application
 */
function validateData() {
    const errors = [];
    const warnings = [];
    
    // Vérifier les offres
    const offerCards = document.querySelectorAll('.offer-card');
    offerCards.forEach((card, index) => {
        const nameInput = card.querySelector('[data-field="offer-name"]');
        const costInput = card.querySelector('[data-field="offer-cost"]');
        
        if (!nameInput || !nameInput.value.trim()) {
            warnings.push(`Offre ${index + 1}: Nom manquant`);
        }
        
        if (!costInput || !costInput.value || isNaN(parseFloat(costInput.value))) {
            errors.push(`Offre ${index + 1}: Coût invalide ou manquant`);
        }
    });
    
    // Vérifier le template actuel
    const currentTemplate = getCurrentTemplate();
    if (!currentTemplate || !currentTemplate.fields || currentTemplate.fields.length === 0) {
        errors.push('Template actuel invalide ou vide');
    }
    
    // Afficher les résultats
    if (errors.length > 0) {
        logError(`Erreurs de validation: ${errors.join(', ')}`);
    }
    
    if (warnings.length > 0) {
        logWarning(`Avertissements de validation: ${warnings.join(', ')}`);
    }
    
    if (errors.length === 0 && warnings.length === 0) {
        logSuccess('Validation réussie: Toutes les données sont valides');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Récupère les données depuis la sauvegarde automatique
 */
function recoverFromAutoSave() {
    try {
        const autoSaveData = localStorage.getItem('contractPicker_autoSave');
        if (!autoSaveData) {
            logInfo('Aucune sauvegarde automatique trouvée');
            return false;
        }
        
        const backup = JSON.parse(autoSaveData);
        const backupDate = new Date(backup.timestamp);
        const isRecent = (Date.now() - backupDate.getTime()) < 86400000; // 24h
        
        if (!isRecent) {
            logWarning('Sauvegarde automatique trop ancienne (>24h)');
            return false;
        }
        
        if (confirm(`Récupérer la sauvegarde automatique du ${backupDate.toLocaleString()} ?`)) {
            const offersContainer = document.getElementById('offers-container');
            
            if (offersContainer && backup.html) {
                offersContainer.innerHTML = backup.html;
                logInfo("Sauvegarde automatique restaurée");
            }
            
            updateOffersTotalSummary();
            logSuccess('Données récupérées depuis la sauvegarde automatique');
            return true;
        }
    } catch (error) {
        logError(`Erreur lors de la récupération: ${error.message}`);
    }
    
    return false;
}

/**
 * Export sécurisé avec validation
 */
function exportDataSafely() {
    const validation = validateData();
    
    if (!validation.isValid) {
        const proceed = confirm(`Des erreurs ont été détectées:\n${validation.errors.join('\n')}\n\nContinuer l'export quand même ?`);
        if (!proceed) {
            return false;
        }
    }
    
    try {
        const exportBtn = document.getElementById('export-csv-btn');
        if (exportBtn) {
            exportBtn.click();
            logSuccess('Export sécurisé réussi');
            return true;
        }
    } catch (error) {
        logError(`Erreur lors de l'export sécurisé: ${error.message}`);
    }
    
    return false;
}

/**
 * Opens the help modal
 */
function openHelpModal() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.style.display = 'flex';
        logInfo('Modal d\'aide ouverte');
    }
}

/**
 * Closes the help modal
 */
function closeHelpModal() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.style.display = 'none';
        logInfo('Modal d\'aide fermée');
    }
}

/**
 * Initialize color theme functionality
 */
function initColorThemes() {
    const themeOptions = document.querySelectorAll('.color-theme-option');
    const body = document.body;
    
    // Load saved theme
    const savedTheme = localStorage.getItem('contractpicker-theme') || 'light-gray';
    applyTheme(savedTheme);
    
    // Handle theme selection
    themeOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const theme = option.dataset.theme;
            applyTheme(theme);
            localStorage.setItem('contractpicker-theme', theme);
            logInfo(`Thème changé: ${theme}`);
        });
    });
    
    function applyTheme(theme) {
        // Remove all theme classes
        body.className = body.className.replace(/theme-\w+/g, '');
        // Add new theme class
        body.classList.add(`theme-${theme}`);
        logInfo(`Thème appliqué: ${theme}`);
    }
    
    logInfo('✅ Color themes initialized');
}

/**
 * Ensure all template manager functions are available globally
 */
function ensureTemplateManagerFunctionsAvailable() {
    try {
        // Check if template manager functions are available
        if (typeof getCurrentTemplate === 'undefined') {
            logWarning('getCurrentTemplate function not available globally');
        }
        if (typeof openTemplateModal === 'undefined') {
            logWarning('openTemplateModal function not available globally');
        }
        if (typeof setCurrentTemplate === 'undefined') {
            logWarning('setCurrentTemplate function not available globally');
        }
        logInfo('Template manager functions availability checked');
    } catch (error) {
        logError(`Error checking template manager functions: ${error.message}`);
    }
}

/**
 * Initialize dropdown navigation menus with hover functionality
 */
function initDropdownMenus() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (toggle && menu) {
            // Open dropdown on hover
            dropdown.addEventListener('mouseenter', () => {
                // Close other dropdowns
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('active');
                    }
                });
                
                // Open current dropdown
                dropdown.classList.add('active');
                logInfo('Dropdown ouvert au survol');
            });
            
            // Close dropdown when mouse leaves
            dropdown.addEventListener('mouseleave', () => {
                dropdown.classList.remove('active');
                logInfo('Dropdown fermé après survol');
            });
            
            // Handle dropdown item clicks
            const items = menu.querySelectorAll('.dropdown-item');
            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.remove('active');
                });
            });
        }
    });
    
    // Close dropdowns on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
    
    logInfo('✅ Hover-based dropdown menus initialized');
}