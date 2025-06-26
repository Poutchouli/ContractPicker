/**
 * Module de gestion des coûts supplémentaires
 * Ce module s'occupe de gérer les coûts additionnels pour les offres
 */
import { logInfo, logError } from '../utils/logger.js';
import { showNotification } from '../utils/helpers.js';

/**
 * Initialise le gestionnaire de coûts supplémentaires
 * @param {HTMLElement} offersContainer - Conteneur des offres
 */
export function initExtraCostManager(offersContainer) {
    if (!offersContainer) {
        logError('Conteneur des offres non défini');
        return;
    }
    
    // Ajouter un bouton de coût supplémentaire dans la barre d'outils
    const toolbar = document.querySelector('.toolbar');
    if (toolbar) {
        const extraCostBtn = document.createElement('button');
        extraCostBtn.id = 'extra-cost-btn';
        extraCostBtn.className = 'toolbar-btn';
        extraCostBtn.innerHTML = '💰 Coûts supplémentaires';
        extraCostBtn.addEventListener('click', () => openExtraCostModal(offersContainer));
        
        toolbar.appendChild(extraCostBtn);
        logInfo('Bouton de coûts supplémentaires ajouté à la barre d\'outils');
    } else {
        logError('Barre d\'outils introuvable');
    }
    
    // Initialiser le bouton dans la section dédiée aux coûts supplémentaires
    const addExtraCostSectionBtn = document.getElementById('add-extra-cost-section-btn');
    if (addExtraCostSectionBtn) {
        addExtraCostSectionBtn.addEventListener('click', () => openExtraCostModal(offersContainer));
        logInfo('Bouton de coûts supplémentaires ajouté à la section dédiée');
    } else {
        logError('Bouton d\'ajout de coût supplémentaire dans la section introuvable');
    }
}

/**
 * Ouvre la modal des coûts supplémentaires
 * @param {HTMLElement} offersContainer - Conteneur des offres
 */
function openExtraCostModal(offersContainer) {
    // Récupérer ou créer les coûts supplémentaires existants
    const extraCostsContainer = document.getElementById('extra-costs-container');
    let extraCosts = [];
    
    if (extraCostsContainer) {
        // Récupérer les coûts existants
        const costItems = extraCostsContainer.querySelectorAll('.extra-cost-item');
        costItems.forEach(item => {
            const nameEl = item.querySelector('.extra-cost-name');
            const valueEl = item.querySelector('.extra-cost-value');
            const typeEl = item.querySelector('.extra-cost-type');
            
            if (nameEl && valueEl && typeEl) {
                extraCosts.push({
                    name: nameEl.textContent,
                    value: parseFloat(valueEl.textContent),
                    type: typeEl.textContent
                });
            }
        });
    }
    
    // Créer la modal
    let modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    modalContainer.id = 'extra-cost-modal';
    
    modalContainer.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Coûts supplémentaires</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="extra-costs-editor">
                    <table class="extra-costs-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Valeur</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${extraCosts.map((cost, index) => `
                                <tr class="extra-cost-editor-row" data-index="${index}">
                                    <td><input type="text" class="extra-cost-name-input" value="${cost.name}"></td>
                                    <td><input type="number" step="0.01" class="extra-cost-value-input" value="${cost.value}"></td>
                                    <td>
                                        <select class="extra-cost-type-select">
                                            <option value="Fixe" ${cost.type === 'Fixe' ? 'selected' : ''}>Fixe</option>
                                            <option value="Mensuel" ${cost.type === 'Mensuel' ? 'selected' : ''}>Mensuel</option>
                                            <option value="Annuel" ${cost.type === 'Annuel' ? 'selected' : ''}>Annuel</option>
                                        </select>
                                    </td>
                                    <td><button class="delete-extra-cost-btn">🗑️</button></td>
                                </tr>
                            `).join('')}
                            <tr class="extra-cost-editor-row" data-index="${extraCosts.length}">
                                <td><input type="text" class="extra-cost-name-input" placeholder="Nouveau coût"></td>
                                <td><input type="number" step="0.01" class="extra-cost-value-input" placeholder="0.00"></td>
                                <td>
                                    <select class="extra-cost-type-select">
                                        <option value="Fixe">Fixe</option>
                                        <option value="Mensuel">Mensuel</option>
                                        <option value="Annuel">Annuel</option>
                                    </select>
                                </td>
                                <td><button class="delete-extra-cost-btn">🗑️</button></td>
                            </tr>
                        </tbody>
                    </table>
                    <button class="add-extra-cost-btn">+ Ajouter un coût</button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="cancel-btn">Annuler</button>
                <button class="save-extra-costs-btn">Enregistrer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalContainer);
    
    // Gestionnaire pour le bouton d'ajout
    modalContainer.querySelector('.add-extra-cost-btn').addEventListener('click', () => {
        const tbody = modalContainer.querySelector('tbody');
        const newIndex = tbody.children.length;
        
        const newRow = document.createElement('tr');
        newRow.className = 'extra-cost-editor-row';
        newRow.dataset.index = newIndex;
        
        newRow.innerHTML = `
            <td><input type="text" class="extra-cost-name-input" placeholder="Nouveau coût"></td>
            <td><input type="number" step="0.01" class="extra-cost-value-input" placeholder="0.00"></td>
            <td>
                <select class="extra-cost-type-select">
                    <option value="Fixe">Fixe</option>
                    <option value="Mensuel">Mensuel</option>
                    <option value="Annuel">Annuel</option>
                </select>
            </td>
            <td><button class="delete-extra-cost-btn">🗑️</button></td>
        `;
        
        tbody.appendChild(newRow);
    });
    
    // Gestionnaire pour les boutons de suppression
    modalContainer.addEventListener('click', (e) => {
        if (e.target.matches('.delete-extra-cost-btn')) {
            const row = e.target.closest('.extra-cost-editor-row');
            if (row) {
                row.remove();
            }
        }
    });
    
    // Gestionnaire pour le bouton de sauvegarde
    modalContainer.querySelector('.save-extra-costs-btn').addEventListener('click', () => {
        const rows = modalContainer.querySelectorAll('.extra-cost-editor-row');
        const newExtraCosts = [];
        
        rows.forEach(row => {
            const nameInput = row.querySelector('.extra-cost-name-input');
            const valueInput = row.querySelector('.extra-cost-value-input');
            const typeSelect = row.querySelector('.extra-cost-type-select');
            
            if (nameInput && valueInput && typeSelect && nameInput.value && valueInput.value) {
                newExtraCosts.push({
                    name: nameInput.value,
                    value: parseFloat(valueInput.value),
                    type: typeSelect.value
                });
            }
        });
        
        // Mettre à jour ou créer le conteneur de coûts
        updateExtraCostsContainer(offersContainer, newExtraCosts);
        
        modalContainer.remove();
        showNotification('Coûts supplémentaires mis à jour', 'success');
        
        // Mettre à jour le résumé total
        if (window.ContractPicker && window.ContractPicker.updateOffersTotalSummary) {
            window.ContractPicker.updateOffersTotalSummary();
        }
    });
    
    // Gestionnaire pour les boutons d'annulation et fermeture
    const closeButtons = modalContainer.querySelectorAll('.modal-close, .cancel-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modalContainer.remove();
        });
    });
    
    modalContainer.style.display = 'flex';
}

/**
 * Met à jour le conteneur des coûts supplémentaires
 * @param {HTMLElement} offersContainer - Conteneur des offres
 * @param {Array} extraCosts - Liste des coûts supplémentaires
 */
function updateExtraCostsContainer(offersContainer, extraCosts) {
    if (!offersContainer) return;
    
    // Utiliser la nouvelle section dédiée aux coûts supplémentaires
    let extraCostsContainer = document.getElementById('extra-costs-section');
    
    if (!extraCostsContainer) {
        logError('Section de coûts supplémentaires non trouvée');
        return;
    }
    
    // Trouver ou créer le conteneur dans la section
    let extraCostsContent = extraCostsContainer.querySelector('.extra-costs-container');
    if (!extraCostsContent) {
        extraCostsContent = document.createElement('div');
        extraCostsContent.id = 'extra-costs-container';
        extraCostsContent.className = 'extra-costs-container';
        extraCostsContainer.appendChild(extraCostsContent);
    }
    
    if (extraCosts.length === 0) {
        extraCostsContent.style.display = 'none';
        return;
    }
    
    extraCostsContent.style.display = 'block';
    
    // Générer le HTML pour les coûts
    let totalExtraCost = 0;
    let html = '<h3>Coûts supplémentaires</h3><div class="extra-costs-list">';
    
    extraCosts.forEach((cost, index) => {
        let annualizedValue = cost.value;
        if (cost.type === 'Mensuel') annualizedValue *= 12;
        totalExtraCost += annualizedValue;
        
        html += `
            <div class="extra-cost-item" data-index="${index}">
                <span class="extra-cost-name">${cost.name}</span>:
                <span class="extra-cost-value">${cost.value.toLocaleString('fr-FR')}</span> €
                <span class="extra-cost-type">${cost.type}</span>
                <button class="delete-extra-cost-btn" title="Supprimer ce coût">🗑️</button>
            </div>
        `;
    });
    
    html += `</div><div class="extra-costs-total">Total annualisé: <strong>${totalExtraCost.toLocaleString('fr-FR')} €</strong></div>`;
    extraCostsContent.innerHTML = html;
    
    // Ajouter les gestionnaires d'événements pour les boutons de suppression
    const deleteButtons = extraCostsContent.querySelectorAll('.delete-extra-cost-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const extraCostItem = e.target.closest('.extra-cost-item');
            const index = parseInt(extraCostItem.dataset.index);
            
            // Confirmer la suppression
            if (confirm(`Êtes-vous sûr de vouloir supprimer ce coût supplémentaire "${extraCosts[index].name}" ?`)) {
                // Supprimer le coût de la liste
                extraCosts.splice(index, 1);
                
                // Mettre à jour l'affichage
                updateExtraCostsContainer(offersContainer, extraCosts);
                
                showNotification('Coût supplémentaire supprimé', 'success');
                logInfo('Coût supplémentaire supprimé');
            }
        });
    });
    
    logInfo('Coûts supplémentaires mis à jour');
}
