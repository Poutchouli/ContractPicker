/**
 * Application principale pour la gestion des contrats
 * Ce fichier centralise les interactions entre les différents modules
 */
import { showNotification } from './utils/helpers.js';
import { initIconSelector, openIconSelector } from './modules/iconSelector.js';
import { initContractManager, createNewOffer, groupSelectedOffers, setNextOfferId, setNextGroupId } from './modules/contractManager.js';
import { downloadContractsAsFile, importContractsFromCSV, exportContractsToJSON } from './modules/csvManager.js';
import { initTemplateManager, getCurrentTemplate, openTemplateModal } from './modules/templateManager.js';
import { initExtraCostManager } from './modules/extraCostManager.js';
import { initErrorConsole, logError, logInfo, logWarning, logSuccess } from './utils/logger.js';

// État global de l'application
const appState = {
    nextOfferId: 2,
    nextGroupId: 1,
    debug: false
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
    initTemplateManager(() => {
        // Callback lors du changement de template
        updateOffersWithCurrentTemplate();
    });

    // Initialiser le gestionnaire d'icônes
    initIconSelector();

    // Initialiser le gestionnaire de contrats
    initContractManager(offersContainer, updateOffersTotalSummary);
    
    // Initialiser le gestionnaire de coûts supplémentaires
    initExtraCostManager(offersContainer);

    // Initialiser la console d'erreurs
    initErrorConsole();

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
            openTemplateModal();
            logInfo("Gestionnaire de templates ouvert");
        });
    } else {
        logError("Bouton #template-manager-btn introuvable dans le DOM");
    }

    // Créer une première offre
    createNewOffer(offersContainer);
    logInfo("Application initialisée avec succès");
});

/**
 * Met à jour toutes les offres avec le template actuel
 */
function updateOffersWithCurrentTemplate() {
    const template = getCurrentTemplate();
    const allOfferCards = document.querySelectorAll('.offer-card');
    
    allOfferCards.forEach(card => {
        // Récupérer les données actuelles avant de mettre à jour
        const currentData = {};
        template.fields.forEach(field => {
            const input = card.querySelector(`[data-field="${field.id}"]`);
            if (input) {
                currentData[field.id] = input.value;
            }
        });
        
        updateCardWithTemplate(card, template, currentData);
    });
    
    logInfo("Toutes les offres ont été mises à jour avec le template actuel");
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
 * Initialise le champ de saisie du nom de l'offre
 */
function initContractNameInput() {
    const input = document.getElementById('contract-offername-input');
    if (!input) return;

    input.addEventListener('input', () => {
        const text = input.value.trim();
        const tipElement = document.getElementById('contract-type-tips');
        
        if (text.length > 0) {
            tipElement.innerHTML = `<strong>Vous êtes en train de comparer : ${text}</strong>`;
            document.title = `Comparateur de contrats | ${text}`;
        } else {
            tipElement.innerHTML = '';
            document.title = 'Outil d\'Aide à la Décision Stratégique';
        }
    });
}

/**
 * Met à jour le résumé des offres
 */
function updateOffersTotalSummary() {
    const totalSummaryElement = document.getElementById('offers-total-summary');
    if (!totalSummaryElement) return;
    
    const offerCards = document.querySelectorAll('.offer-card');
    const groupedOfferCards = document.querySelectorAll('.grouped-offer-card');
    
    // Calculer le total
    let totalCost = 0;
    let totalCount = offerCards.length + groupedOfferCards.length;
    
    offerCards.forEach(card => {
        const costInput = card.querySelector('[data-field="offer-cost"]');
        const costTypeSelect = card.querySelector('[data-field="offer-cost-type"]');
        
        if (costInput && costInput.value) {
            const cost = parseFloat(costInput.value);
            
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
                totalCost += cost;
            }
        }
    });
    
    // Mettre à jour l'affichage
    totalSummaryElement.innerHTML = `
        <div>Total: <strong>${totalCost.toLocaleString('fr-FR')} €</strong></div>
        <div>Nombre d'offres: ${totalCount}</div>
    `;
}

// Exposer les fonctions pour d'autres scripts ou la console du navigateur
window.ContractPicker = {
    createNewOffer,
    updateOffersTotalSummary,
    getCurrentTemplate,
    setNextOfferId,
    setNextGroupId,
    log: logInfo,
    info: logInfo,
    warn: logWarning,
    error: logError,
    success: logSuccess
};
