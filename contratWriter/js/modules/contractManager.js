/**
 * Module de gestion des contrats
 * Ce module s'occupe de la création, modification et suppression des offres et groupes
 */
import { showNotification, formatSystime, isOlderThanOneMonth } from '../utils/helpers.js';
import { openIconSelector } from './iconSelector.js';
import { getCurrentTemplate } from './templateManager.js';
import { logInfo, logError, logWarning, logSuccess } from '../utils/logger.js';

let nextOfferId = 1;
let nextGroupId = 1;

/**
 * Initialise le gestionnaire de contrats
 * @param {HTMLElement} container - Conteneur des offres
 * @param {Function} updateSummaryCallback - Callback pour mettre à jour le résumé total
 */
export function initContractManager(container, updateSummaryCallback) {
    if (!container) {
        logError('Le conteneur des offres est indéfini');
        return;
    }
    
    // Ajouter un gestionnaire d'événements pour les actions sur les offres
    container.addEventListener('click', handleOfferActions);
    
    // Ajouter un gestionnaire d'événements pour les changements dans les inputs
    container.addEventListener('input', (e) => {
        if (e.target.matches('.offer-card input, .offer-card select, .offer-card textarea')) {
            if (updateSummaryCallback && typeof updateSummaryCallback === 'function') {
                updateSummaryCallback();
            }
        }
    });
    
    logInfo('Gestionnaire de contrats initialisé');
}

/**
 * Gère les actions sur les offres (clic sur boutons)
 * @param {Event} e - Événement de clic
 */
function handleOfferActions(e) {
    const target = e.target;
    
    // Bouton de modification d'icône
    if (target.matches('.icon-btn')) {
        const card = target.closest('.offer-card, .grouped-offer-card');
        if (card) {
            openIconSelector((selectedIcon) => {
                const iconElement = card.querySelector('.offer-icon');
                if (iconElement) {
                    iconElement.textContent = selectedIcon;
                    logInfo(`Icône de l'offre ${card.dataset.id} modifiée`);
                }
            });
        }
    }
    
    // Bouton de suppression d'offre
    else if (target.matches('.delete-offer-btn')) {
        const card = target.closest('.offer-card, .grouped-offer-card');
        if (card) {
            card.remove();
            showNotification('Offre supprimée', 'success');
            logInfo(`Offre ${card.dataset.id} supprimée`);
            
            // Mettre à jour le résumé
            const event = new CustomEvent('offersUpdated');
            document.dispatchEvent(event);
        }
    }
    
    // Bouton de duplication d'offre
    else if (target.matches('.duplicate-offer-btn')) {
        const card = target.closest('.offer-card');
        if (card) {
            const newCard = duplicateOffer(card);
            logInfo(`Offre ${card.dataset.id} dupliquée`);
            
            // Mettre à jour le résumé
            const event = new CustomEvent('offersUpdated');
            document.dispatchEvent(event);
        }
    }
    
    // Case à cocher de sélection d'offre
    else if (target.matches('.offer-checkbox')) {
        const card = target.closest('.offer-card');
        if (card) {
            card.classList.toggle('selected', target.checked);
        }
    }
    
    // Bouton de dissociation de groupe
    else if (target.matches('.ungroup-btn')) {
        const groupCard = target.closest('.grouped-offer-card');
        const container = groupCard.parentElement;
        if (groupCard && container && confirm('Êtes-vous sûr de vouloir dissocier ce groupe d\'offres ?')) {
            ungroupOffers(groupCard, container);
            
            // Mettre à jour le résumé
            const event = new CustomEvent('offersUpdated');
            document.dispatchEvent(event);
        }
    }
}

/**
 * Crée une nouvelle offre
 * @param {HTMLElement} container - Conteneur des offres
 * @returns {HTMLElement} - La carte d'offre créée
 */
export function createNewOffer(container) {
    if (!container) {
        logError('Le conteneur des offres est indéfini');
        return null;
    }
    
    const template = getCurrentTemplate();
    const card = document.createElement('div');
    card.className = 'offer-card';
    card.dataset.id = `offer-${nextOfferId}`;
    
    card.innerHTML = `
        <div class="offer-header">
            <input type="checkbox" class="offer-checkbox">
            <span class="offer-icon">📄</span>
            <button class="icon-btn" title="Changer l'icône">🖌️</button>
            <div class="offer-title">Offre #${nextOfferId}</div>
        </div>
        <div class="offer-inputs">
            ${generateFieldsFromTemplate(template)}
        </div>
        <div class="offer-footer">
            <button class="delete-offer-btn">🗑️ Supprimer</button>
            <button class="duplicate-offer-btn">📋 Dupliquer</button>
        </div>
    `;
    
    container.appendChild(card);
    nextOfferId++;
    return card;
}

/**
 * Génère les champs HTML à partir du template
 * @param {Object} template - Le template contenant les champs
 * @returns {string} - HTML des champs
 */
function generateFieldsFromTemplate(template) {
    if (!template || !template.fields || !Array.isArray(template.fields)) {
        logError('Template invalide ou champs non définis');
        return '';
    }
    
    let fieldsHtml = '';
    
    template.fields.forEach(field => {
        fieldsHtml += `<div class="field-wrapper">`;
        fieldsHtml += `<label>${field.label || field.id}</label>`;
        
        switch (field.type) {
            case 'textarea':
                fieldsHtml += `<textarea data-field="${field.id}" placeholder="${field.placeholder || ''}"></textarea>`;
                break;
            case 'select':
                fieldsHtml += `<select data-field="${field.id}">`;
                if (field.options && Array.isArray(field.options)) {
                    field.options.forEach(option => {
                        fieldsHtml += `<option value="${option.value}">${option.label}</option>`;
                    });
                }
                fieldsHtml += `</select>`;
                break;
            default: // text, number, etc.
                fieldsHtml += `<input type="${field.type || 'text'}" data-field="${field.id}" placeholder="${field.placeholder || ''}">`;
        }
        
        fieldsHtml += `</div>`;
    });
    
    return fieldsHtml;
}

/**
 * Duplique une offre existante
 * @param {HTMLElement} card - La carte d'offre à dupliquer
 * @returns {HTMLElement} - La nouvelle carte d'offre dupliquée
 */
function duplicateOffer(card) {
    if (!card) {
        logError('Carte d\'offre non définie pour duplication');
        return null;
    }
    
    const container = card.parentNode;
    const newCard = card.cloneNode(true);
    
    // Mettre à jour l'ID
    newCard.dataset.id = `offer-${nextOfferId}`;
    
    // Mettre à jour le titre
    const titleElement = newCard.querySelector('.offer-title');
    if (titleElement) {
        titleElement.textContent = `Offre #${nextOfferId}`;
    }
    
    // Décocher la case à cocher
    const checkbox = newCard.querySelector('.offer-checkbox');
    if (checkbox) {
        checkbox.checked = false;
    }
    
    // Supprimer la classe selected
    newCard.classList.remove('selected');
    
    container.appendChild(newCard);
    nextOfferId++;
    
    showNotification('Offre dupliquée', 'success');
    return newCard;
}

/**
 * Regroupe les offres sélectionnées
 * @param {HTMLElement} container - Conteneur des offres
 */
export function groupSelectedOffers(container) {
    if (!container) {
        logError('Le conteneur des offres est indéfini');
        return;
    }
    
    const selectedOffers = Array.from(container.querySelectorAll('.offer-card.selected'));
    
    if (selectedOffers.length < 2) {
        showNotification('Veuillez sélectionner au moins 2 offres à regrouper', 'warning');
        logWarning('Tentative de regroupement avec moins de 2 offres sélectionnées');
        return;
    }
    
    // Calculer le coût total
    let totalCost = 0;
    let offerTitles = [];
    
    selectedOffers.forEach(offer => {
        const costInput = offer.querySelector('[data-field="offer-cost"]');
        const costTypeSelect = offer.querySelector('[data-field="offer-cost-type"]');
        const titleElement = offer.querySelector('.offer-title');
        
        if (titleElement) {
            offerTitles.push(titleElement.textContent);
        }
        
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
    
    // Créer le groupe
    const groupCard = document.createElement('div');
    groupCard.className = 'grouped-offer-card';
    groupCard.dataset.id = `group-${nextGroupId}`;
    
    groupCard.innerHTML = `
        <div class="offer-header">
            <span class="offer-icon">📦</span>
            <button class="icon-btn" title="Changer l'icône">🖌️</button>
            <div class="offer-title">Groupe #${nextGroupId}</div>
        </div>
        <div class="grouped-offers-list">
            ${offerTitles.map(title => `<div class="grouped-offer-item">${title}</div>`).join('')}
        </div>
        <div class="grouped-total">
            <div class="grouped-total-label">Total:</div>
            <div class="grouped-total-cost">${totalCost.toLocaleString('fr-FR')} €</div>
        </div>
        <div class="offer-footer">
            <button class="delete-offer-btn">🗑️ Supprimer</button>
            <button class="ungroup-btn">🔓 Dissocier</button>
        </div>
    `;
    
    // Ajouter le groupe et supprimer les offres sélectionnées
    container.appendChild(groupCard);
    selectedOffers.forEach(offer => offer.remove());
    
    nextGroupId++;
    showNotification(`${selectedOffers.length} offres regroupées`, 'success');
    logInfo(`Groupe #${nextGroupId - 1} créé avec ${selectedOffers.length} offres`);
}

/**
 * Met à jour l'affichage de la date système sur une carte d'offre
 * @param {HTMLElement} card - Élément DOM de l'offre
 */
export function updateSystimeDisplay(card) {
    const systime = parseInt(card.dataset.systime, 10);
    const systimeSpan = card.querySelector('.offer-systime');
    if (systimeSpan) {
        let text = 'Ce contrat date de : ' + formatSystime(systime);
        
        // Avertissement si le contrat est ancien
        if (isOlderThanOneMonth(systime)) {
            text += ' (ancienne version)';
            systimeSpan.classList.add('outdated');
        } else {
            systimeSpan.classList.remove('outdated');
        }
        
        systimeSpan.textContent = text;
    }
}

/**
 * Dissocie un groupe d'offres
 * @param {HTMLElement} groupCard - La carte du groupe à dissocier
 * @param {HTMLElement} container - Conteneur des offres
 */
function ungroupOffers(groupCard, container) {
    if (!groupCard || !container) {
        logError("Impossible de dissocier le groupe: éléments manquants");
        return;
    }
    
    // Récupérer l'ID du groupe
    const groupId = groupCard.dataset.id.split('-')[1];
    logInfo(`Dissolution du groupe #${groupId} en cours...`);
    
    // Récupérer les titres des offres groupées
    const offerItems = groupCard.querySelectorAll('.grouped-offer-item');
    const offerTitles = Array.from(offerItems).map(item => item.textContent.trim());
    
    // Créer de nouvelles offres pour chaque offre du groupe
    offerTitles.forEach(title => {
        const newOfferCard = createNewOffer(container);
        const titleInput = newOfferCard.querySelector('[id^="offer-name"]');
        if (titleInput) {
            titleInput.value = title;
        }
    });
    
    // Supprimer la carte du groupe
    groupCard.remove();
    
    // Afficher une notification
    showNotification(`Groupe #${groupId} dissocié avec succès`, 'success');
    logSuccess(`Groupe #${groupId} dissocié en ${offerTitles.length} offres individuelles`);
}

/**
 * Définit le prochain ID d'offre à utiliser
 * @param {number} id - Prochain ID d'offre
 */
export function setNextOfferId(id) {
    if (typeof id === 'number' && id > 0) {
        nextOfferId = id;
        logInfo(`Prochain ID d'offre défini: ${id}`);
    } else {
        logError(`ID d'offre invalide: ${id}`);
    }
}

/**
 * Définit le prochain ID de groupe à utiliser
 * @param {number} id - Prochain ID de groupe
 */
export function setNextGroupId(id) {
    if (typeof id === 'number' && id > 0) {
        nextGroupId = id;
        logInfo(`Prochain ID de groupe défini: ${id}`);
    } else {
        logError(`ID de groupe invalide: ${id}`);
    }
}

// Exporter la fonction ungroupOffers pour qu'elle soit accessible depuis l'extérieur
export { ungroupOffers };
