/**
 * Module de gestion des templates
 * Ce module s'occupe de gérer les templates utilisés pour créer et afficher les offres
 */
import { showNotification } from '../utils/helpers.js';
import { logInfo, logError, logWarning } from '../utils/logger.js';

// Template par défaut
const defaultTemplate = {
    id: 'default',
    name: 'Template par défaut',
    fields: [
        {
            id: 'offer-name',
            label: 'Nom de l\'offre',
            type: 'text',
            placeholder: 'Entrez le nom de l\'offre',
            required: true
        },
        {
            id: 'offer-description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Description du contrat...'
        },
        {
            id: 'offer-cost',
            label: 'Coût',
            type: 'number',
            placeholder: '0.00',
            required: true
        },
        {
            id: 'offer-cost-type',
            label: 'Période',
            type: 'select',
            options: [
                { value: 'monthly', label: 'Mensuel' },
                { value: 'quarterly', label: 'Trimestriel' },
                { value: 'yearly', label: 'Annuel' }
            ],
            required: true
        }
    ]
};

// État du module
let templates = [defaultTemplate];
let currentTemplateId = 'default';
let onTemplateChangeCallback = null;

/**
 * Initialise le gestionnaire de templates
 * @param {Function} callback - Fonction à appeler lors du changement de template
 */
export function initTemplateManager(callback) {
    // Charger les templates depuis le stockage local
    const savedTemplates = localStorage.getItem('contractTemplates');
    if (savedTemplates) {
        try {
            templates = JSON.parse(savedTemplates);
            logInfo('Templates chargés depuis le stockage local');
        } catch (e) {
            logError('Erreur lors du chargement des templates:', e);
            templates = [defaultTemplate];
        }
    }
    
    // Récupérer le template actuel depuis le stockage local
    const savedCurrentTemplateId = localStorage.getItem('currentTemplateId');
    if (savedCurrentTemplateId) {
        const templateExists = templates.some(t => t.id === savedCurrentTemplateId);
        if (templateExists) {
            currentTemplateId = savedCurrentTemplateId;
        } else {
            logWarning(`Template ${savedCurrentTemplateId} non trouvé, utilisation du template par défaut`);
        }
    }
    
    // Stocker le callback
    if (callback && typeof callback === 'function') {
        onTemplateChangeCallback = callback;
    }
    
    logInfo('Gestionnaire de templates initialisé');
}

/**
 * Récupère le template actuel
 * @returns {Object} - Le template actuel
 */
export function getCurrentTemplate() {
    return templates.find(t => t.id === currentTemplateId) || defaultTemplate;
}

/**
 * Récupère tous les templates disponibles
 * @returns {Array} - Liste des templates
 */
export function getAllTemplates() {
    return [...templates];
}

/**
 * Définit le template actuel
 * @param {string} templateId - ID du template à utiliser
 */
export function setCurrentTemplate(templateId) {
    const templateExists = templates.some(t => t.id === templateId);
    
    if (templateExists) {
        currentTemplateId = templateId;
        localStorage.setItem('currentTemplateId', templateId);
        
        if (onTemplateChangeCallback && typeof onTemplateChangeCallback === 'function') {
            onTemplateChangeCallback();
        }
        
        logInfo(`Template actuel défini à ${templateId}`);
        return true;
    } else {
        logError(`Template ${templateId} introuvable`);
        return false;
    }
}

/**
 * Ajoute un nouveau template
 * @param {Object} template - Nouveau template à ajouter
 * @returns {boolean} - true si l'ajout a réussi, false sinon
 */
export function addTemplate(template) {
    if (!template || !template.id || !template.name || !template.fields || !Array.isArray(template.fields)) {
        logError('Template invalide');
        return false;
    }
    
    // Vérifier que le template n'existe pas déjà
    const existingTemplate = templates.find(t => t.id === template.id);
    if (existingTemplate) {
        logError(`Un template avec l'ID ${template.id} existe déjà`);
        return false;
    }
    
    templates.push(template);
    saveTemplates();
    logInfo(`Nouveau template ${template.name} ajouté`);
    return true;
}

/**
 * Met à jour un template existant
 * @param {Object} template - Template à mettre à jour
 * @returns {boolean} - true si la mise à jour a réussi, false sinon
 */
export function updateTemplate(template) {
    if (!template || !template.id) {
        logError('Template invalide');
        return false;
    }
    
    const index = templates.findIndex(t => t.id === template.id);
    
    if (index === -1) {
        logError(`Template ${template.id} introuvable`);
        return false;
    }
    
    templates[index] = template;
    saveTemplates();
    
    // Si le template actuel a été mis à jour, notifier le callback
    if (template.id === currentTemplateId && onTemplateChangeCallback) {
        onTemplateChangeCallback();
    }
    
    logInfo(`Template ${template.name} mis à jour`);
    return true;
}

/**
 * Supprime un template
 * @param {string} templateId - ID du template à supprimer
 * @returns {boolean} - true si la suppression a réussi, false sinon
 */
export function deleteTemplate(templateId) {
    if (templateId === 'default') {
        logWarning('Impossible de supprimer le template par défaut');
        return false;
    }
    
    const index = templates.findIndex(t => t.id === templateId);
    
    if (index === -1) {
        logError(`Template ${templateId} introuvable`);
        return false;
    }
    
    templates.splice(index, 1);
    saveTemplates();
    
    // Si le template actuel a été supprimé, revenir au template par défaut
    if (templateId === currentTemplateId) {
        currentTemplateId = 'default';
        localStorage.setItem('currentTemplateId', 'default');
        
        if (onTemplateChangeCallback) {
            onTemplateChangeCallback();
        }
    }
    
    logInfo(`Template ${templateId} supprimé`);
    return true;
}

/**
 * Enregistre les templates dans le stockage local
 */
function saveTemplates() {
    try {
        localStorage.setItem('contractTemplates', JSON.stringify(templates));
        logInfo('Templates enregistrés dans le stockage local');
    } catch (e) {
        logError('Erreur lors de l\'enregistrement des templates:', e);
    }
}

/**
 * Ouvre la modal de gestion des templates
 */
export function openTemplateModal() {
    // Créer la modal si elle n'existe pas encore
    let modalContainer = document.getElementById('template-modal-container');
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'template-modal-container';
        modalContainer.className = 'modal-container';
        document.body.appendChild(modalContainer);
    }
    
    // Remplir la modal avec le contenu
    modalContainer.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Gestion des templates</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="templates-list">
                    ${templates.map(template => `
                        <div class="template-item ${template.id === currentTemplateId ? 'active' : ''}" data-id="${template.id}">
                            <div class="template-name">${template.name}</div>
                            <div class="template-actions">
                                <button class="template-edit-btn" data-id="${template.id}">✏️</button>
                                ${template.id !== 'default' ? `<button class="template-delete-btn" data-id="${template.id}">🗑️</button>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="add-template-btn">+ Ajouter un template</button>
            </div>
        </div>
    `;
    
    // Ajouter les gestionnaires d'événements
    const closeBtn = modalContainer.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modalContainer.remove();
        });
    }
    
    // Gestionnaire pour la sélection d'un template
    const templateItems = modalContainer.querySelectorAll('.template-item');
    templateItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Ignorer si on a cliqué sur un bouton
            if (e.target.matches('.template-edit-btn, .template-delete-btn')) {
                return;
            }
            
            const templateId = item.dataset.id;
            setCurrentTemplate(templateId);
            
            // Mettre à jour l'interface
            templateItems.forEach(ti => {
                ti.classList.toggle('active', ti.dataset.id === templateId);
            });
            
            showNotification(`Template "${templates.find(t => t.id === templateId).name}" activé`, 'success');
        });
    });
    
    // Gestionnaire pour l'édition d'un template
    const editBtns = modalContainer.querySelectorAll('.template-edit-btn');
    editBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const templateId = btn.dataset.id;
            const template = templates.find(t => t.id === templateId);
            
            if (template) {
                openTemplateEditorModal(template);
            }
        });
    });
    
    // Gestionnaire pour la suppression d'un template
    const deleteBtns = modalContainer.querySelectorAll('.template-delete-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const templateId = btn.dataset.id;
            
            if (confirm(`Êtes-vous sûr de vouloir supprimer ce template ?`)) {
                if (deleteTemplate(templateId)) {
                    modalContainer.remove();
                    openTemplateModal();
                    showNotification('Template supprimé', 'success');
                }
            }
        });
    });
    
    // Gestionnaire pour l'ajout d'un template
    const addBtn = modalContainer.querySelector('.add-template-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            // Créer un nouveau template vide basé sur le template par défaut
            const newTemplate = {
                id: `template-${Date.now()}`,
                name: 'Nouveau template',
                fields: [...defaultTemplate.fields]
            };
            
            openTemplateEditorModal(newTemplate, true);
        });
    }
    
    // Afficher la modal
    modalContainer.style.display = 'flex';
}

/**
 * Ouvre la modal d'édition de template
 * @param {Object} template - Template à éditer
 * @param {boolean} isNew - Indique si c'est un nouveau template
 */
function openTemplateEditorModal(template, isNew = false) {
    // Créer une copie du template pour ne pas modifier l'original
    const editingTemplate = JSON.parse(JSON.stringify(template));
    
    // Créer la modal
    let modalContainer = document.getElementById('template-editor-modal');
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'template-editor-modal';
        modalContainer.className = 'modal-container';
        document.body.appendChild(modalContainer);
    }
    
    // Générer le HTML pour les champs
    let fieldsHtml = '';
    editingTemplate.fields.forEach((field, index) => {
        fieldsHtml += `
            <div class="template-field" data-index="${index}">
                <div class="field-header">
                    <input type="text" class="field-id" value="${field.id}" placeholder="ID du champ" required>
                    <input type="text" class="field-label" value="${field.label || ''}" placeholder="Libellé">
                    <button class="delete-field-btn">&times;</button>
                </div>
                <div class="field-body">
                    <div>
                        <label>Type:</label>
                        <select class="field-type">
                            <option value="text" ${field.type === 'text' ? 'selected' : ''}>Texte</option>
                            <option value="number" ${field.type === 'number' ? 'selected' : ''}>Nombre</option>
                            <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Zone de texte</option>
                            <option value="select" ${field.type === 'select' ? 'selected' : ''}>Liste déroulante</option>
                        </select>
                    </div>
                    <div>
                        <label>Placeholder:</label>
                        <input type="text" class="field-placeholder" value="${field.placeholder || ''}" placeholder="Texte indicatif">
                    </div>
                    <div>
                        <label>
                            <input type="checkbox" class="field-required" ${field.required ? 'checked' : ''}>
                            Obligatoire
                        </label>
                    </div>
                </div>
                ${field.type === 'select' ? `
                    <div class="field-options">
                        <div class="options-header">Options:</div>
                        <div class="options-list">
                            ${field.options && Array.isArray(field.options) ? field.options.map((option, optIndex) => `
                                <div class="option-item" data-index="${optIndex}">
                                    <input type="text" class="option-value" value="${option.value || ''}" placeholder="Valeur">
                                    <input type="text" class="option-label" value="${option.label || ''}" placeholder="Libellé">
                                    <button class="delete-option-btn">&times;</button>
                                </div>
                            `).join('') : ''}
                        </div>
                        <button class="add-option-btn">+ Ajouter une option</button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    // Remplir la modal
    modalContainer.innerHTML = `
        <div class="modal-content wide">
            <div class="modal-header">
                <h2>${isNew ? 'Nouveau template' : 'Modifier le template'}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="template-form">
                    <div class="template-general">
                        <label>
                            Nom du template:
                            <input type="text" id="template-name" value="${editingTemplate.name}" required>
                        </label>
                    </div>
                    
                    <h3>Champs</h3>
                    <div class="template-fields">
                        ${fieldsHtml}
                    </div>
                    <button class="add-field-btn">+ Ajouter un champ</button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="cancel-btn">Annuler</button>
                <button class="save-template-btn">Enregistrer</button>
            </div>
        </div>
    `;
    
    // Ajouter les gestionnaires d'événements
    const closeBtn = modalContainer.querySelector('.modal-close');
    const cancelBtn = modalContainer.querySelector('.cancel-btn');
    if (closeBtn && cancelBtn) {
        closeBtn.addEventListener('click', () => {
            modalContainer.remove();
        });
        cancelBtn.addEventListener('click', () => {
            modalContainer.remove();
        });
    }
    
    // Gestionnaire pour le changement de type de champ
    modalContainer.addEventListener('change', (e) => {
        if (e.target.matches('.field-type')) {
            const fieldElement = e.target.closest('.template-field');
            const fieldType = e.target.value;
            
            // Générer ou supprimer la section des options
            const optionsSection = fieldElement.querySelector('.field-options');
            if (fieldType === 'select') {
                if (!optionsSection) {
                    const optionsDiv = document.createElement('div');
                    optionsDiv.className = 'field-options';
                    optionsDiv.innerHTML = `
                        <div class="options-header">Options:</div>
                        <div class="options-list"></div>
                        <button class="add-option-btn">+ Ajouter une option</button>
                    `;
                    fieldElement.appendChild(optionsDiv);
                    
                    // Ajouter une première option
                    addNewOption(optionsDiv.querySelector('.options-list'));
                }
            } else if (optionsSection) {
                optionsSection.remove();
            }
        }
    });
    
    // Gestionnaire pour l'ajout d'un champ
    const addFieldBtn = modalContainer.querySelector('.add-field-btn');
    if (addFieldBtn) {
        addFieldBtn.addEventListener('click', () => {
            const fieldsContainer = modalContainer.querySelector('.template-fields');
            const newFieldIndex = fieldsContainer.children.length;
            
            const newFieldElement = document.createElement('div');
            newFieldElement.className = 'template-field';
            newFieldElement.dataset.index = newFieldIndex;
            
            newFieldElement.innerHTML = `
                <div class="field-header">
                    <input type="text" class="field-id" value="field-${newFieldIndex}" placeholder="ID du champ" required>
                    <input type="text" class="field-label" value="Nouveau champ" placeholder="Libellé">
                    <button class="delete-field-btn">&times;</button>
                </div>
                <div class="field-body">
                    <div>
                        <label>Type:</label>
                        <select class="field-type">
                            <option value="text" selected>Texte</option>
                            <option value="number">Nombre</option>
                            <option value="textarea">Zone de texte</option>
                            <option value="select">Liste déroulante</option>
                        </select>
                    </div>
                    <div>
                        <label>Placeholder:</label>
                        <input type="text" class="field-placeholder" value="" placeholder="Texte indicatif">
                    </div>
                    <div>
                        <label>
                            <input type="checkbox" class="field-required">
                            Obligatoire
                        </label>
                    </div>
                </div>
            `;
            
            fieldsContainer.appendChild(newFieldElement);
        });
    }
    
    // Gestionnaire pour la suppression d'un champ
    modalContainer.addEventListener('click', (e) => {
        if (e.target.matches('.delete-field-btn')) {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce champ ?')) {
                e.target.closest('.template-field').remove();
            }
        } else if (e.target.matches('.add-option-btn')) {
            const optionsList = e.target.previousElementSibling;
            addNewOption(optionsList);
        } else if (e.target.matches('.delete-option-btn')) {
            e.target.closest('.option-item').remove();
        }
    });
    
    // Gestionnaire pour l'enregistrement du template
    const saveBtn = modalContainer.querySelector('.save-template-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            // Valider et récupérer les données du formulaire
            const templateNameInput = modalContainer.querySelector('#template-name');
            if (!templateNameInput || !templateNameInput.value.trim()) {
                showNotification('Le nom du template est obligatoire', 'error');
                return;
            }
            
            // Mettre à jour le nom du template
            editingTemplate.name = templateNameInput.value.trim();
            
            // Récupérer tous les champs
            const fields = [];
            const fieldElements = modalContainer.querySelectorAll('.template-field');
            
            fieldElements.forEach((fieldEl) => {
                const fieldId = fieldEl.querySelector('.field-id').value.trim();
                const fieldLabel = fieldEl.querySelector('.field-label').value.trim();
                const fieldType = fieldEl.querySelector('.field-type').value;
                const fieldPlaceholder = fieldEl.querySelector('.field-placeholder').value;
                const fieldRequired = fieldEl.querySelector('.field-required').checked;
                
                if (!fieldId) {
                    showNotification('L\'ID du champ est obligatoire', 'error');
                    return;
                }
                
                const field = {
                    id: fieldId,
                    label: fieldLabel || fieldId,
                    type: fieldType,
                    placeholder: fieldPlaceholder || '',
                    required: fieldRequired
                };
                
                // Récupérer les options pour les champs de type select
                if (fieldType === 'select') {
                    const optionsElements = fieldEl.querySelectorAll('.option-item');
                    field.options = [];
                    
                    optionsElements.forEach(optEl => {
                        const optValue = optEl.querySelector('.option-value').value.trim();
                        const optLabel = optEl.querySelector('.option-label').value.trim();
                        
                        if (optValue) {
                            field.options.push({
                                value: optValue,
                                label: optLabel || optValue
                            });
                        }
                    });
                    
                    if (field.options.length === 0) {
                        showNotification('Les listes déroulantes doivent avoir au moins une option', 'error');
                        return;
                    }
                }
                
                fields.push(field);
            });
            
            if (fields.length === 0) {
                showNotification('Le template doit avoir au moins un champ', 'error');
                return;
            }
            
            // Mettre à jour les champs du template
            editingTemplate.fields = fields;
            
            // Enregistrer le template
            let success = false;
            if (isNew) {
                success = addTemplate(editingTemplate);
            } else {
                success = updateTemplate(editingTemplate);
            }
            
            if (success) {
                modalContainer.remove();
                showNotification(`Template ${isNew ? 'ajouté' : 'mis à jour'} avec succès`, 'success');
                
                // Réouvrir la modal principale
                openTemplateModal();
            }
        });
    }
    
    // Afficher la modal
    modalContainer.style.display = 'flex';
}

/**
 * Ajoute une nouvelle option à une liste d'options
 * @param {HTMLElement} optionsList - Élément DOM contenant la liste d'options
 */
function addNewOption(optionsList) {
    const optIndex = optionsList.children.length;
    const optionEl = document.createElement('div');
    optionEl.className = 'option-item';
    optionEl.dataset.index = optIndex;
    optionEl.innerHTML = `
        <input type="text" class="option-value" value="option-${optIndex}" placeholder="Valeur">
        <input type="text" class="option-label" value="Option ${optIndex + 1}" placeholder="Libellé">
        <button class="delete-option-btn">&times;</button>
    `;
    optionsList.appendChild(optionEl);
}
