/**
 * Module de gestion des templates - Version Simplifiée
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
 * Initialise le module
 */
export function initTemplateManager() {
    loadTemplates();
    logInfo('Module de gestion des templates initialisé');
}

/**
 * Charge les templates depuis le stockage local
 */
function loadTemplates() {
    try {
        const savedTemplates = localStorage.getItem('contractTemplates');
        const savedCurrentId = localStorage.getItem('currentTemplateId');
        
        if (savedTemplates) {
            const parsedTemplates = JSON.parse(savedTemplates);
            
            // S'assurer que le template par défaut existe toujours
            const hasDefault = parsedTemplates.some(t => t.id === 'default');
            if (!hasDefault) {
                parsedTemplates.unshift(defaultTemplate);
            }
            
            templates = parsedTemplates;
        }
        
        if (savedCurrentId && templates.some(t => t.id === savedCurrentId)) {
            currentTemplateId = savedCurrentId;
        }
        
        logInfo('Templates chargés depuis le stockage local');
    } catch (e) {
        logError('Erreur lors du chargement des templates:', e);
        templates = [defaultTemplate];
        currentTemplateId = 'default';
    }
}

/**
 * Définit une fonction de callback pour les changements de template
 * @param {Function} callback - Fonction à appeler lors des changements
 */
export function setOnTemplateChangeCallback(callback) {
    onTemplateChangeCallback = callback;
}

/**
 * Retourne le template actuel
 * @returns {Object} - Template actuel
 */
export function getCurrentTemplate() {
    return templates.find(t => t.id === currentTemplateId) || defaultTemplate;
}

/**
 * Retourne tous les templates disponibles
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
    
    // Traiter les champs avec période (number-period)
    const processedFields = [];
    template.fields.forEach(field => {
        const converted = convertToStandardField(field);
        if (Array.isArray(converted)) {
            processedFields.push(...converted);
        } else {
            processedFields.push(converted);
        }
    });
    
    const processedTemplate = {
        ...template,
        fields: processedFields
    };
    
    templates.push(processedTemplate);
    saveTemplates();
    logInfo(`Nouveau template ${template.name} ajouté`);
    return true;
}

/**
 * Met à jour un template existant
 * @param {Object} template - Template modifié
 * @returns {boolean} - true si la modification a réussi, false sinon
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
    
    // Traiter les champs avec période (number-period)
    const processedFields = [];
    template.fields.forEach(field => {
        const converted = convertToStandardField(field);
        if (Array.isArray(converted)) {
            processedFields.push(...converted);
        } else {
            processedFields.push(converted);
        }
    });
    
    const processedTemplate = {
        ...template,
        fields: processedFields
    };
    
    templates[index] = processedTemplate;
    saveTemplates();
    
    // Si c'est le template actuel, déclencher le callback
    if (template.id === currentTemplateId && onTemplateChangeCallback) {
        onTemplateChangeCallback();
    }
    
    logInfo(`Template ${template.name} modifié`);
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
 * Ouvre l'éditeur de template simplifié
 * @param {Object} template - Template à éditer (optionnel pour créer un nouveau template)
 */
export function openSimpleTemplateEditor(template = null) {
    const isEditing = template !== null;
    const editingTemplate = isEditing ? JSON.parse(JSON.stringify(template)) : {
        id: '',
        name: '',
        fields: []
    };

    // Créer la modal
    let modalContainer = document.getElementById('simple-template-editor-modal');
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'simple-template-editor-modal';
        modalContainer.className = 'template-modal';
        document.body.appendChild(modalContainer);
    }

    modalContainer.innerHTML = `
        <div class="template-modal-content">
            <div class="template-modal-header">
                <h2>${isEditing ? '✏️ Modifier le template' : '➕ Nouveau template'}</h2>
                <button class="template-modal-close" onclick="closeSimpleTemplateEditor()">&times;</button>
            </div>
            <div class="template-modal-body">
                <div class="template-basic-info">
                    <div class="template-form-group">
                        <label for="template-name">Nom du template</label>
                        <input type="text" id="template-name" class="template-form-input" 
                               value="${editingTemplate.name}" placeholder="Ex: Template Fournisseur Internet" required>
                    </div>
                </div>
                
                <div class="fields-section">
                    <h3>🔧 Champs du template</h3>
                    <div id="fields-container">
                        ${generateFieldsHTML(editingTemplate.fields)}
                    </div>
                    <button class="add-field-btn" onclick="addNewField()">
                        ➕ Ajouter un champ
                    </button>
                </div>
            </div>
            <div class="template-modal-footer">
                <button class="template-btn template-btn-secondary" onclick="closeSimpleTemplateEditor()">
                    Annuler
                </button>
                <button class="template-btn template-btn-primary" onclick="saveSimpleTemplate(${isEditing})">
                    ${isEditing ? 'Modifier' : 'Créer'} le template
                </button>
            </div>
        </div>
    `;

    modalContainer.style.display = 'flex';
    
    // Focus sur le nom du template
    setTimeout(() => {
        document.getElementById('template-name').focus();
    }, 100);

    // Stocker le template en cours d'édition
    window.currentEditingTemplate = editingTemplate;
}

/**
 * Génère le HTML pour les champs existants
 */
function generateFieldsHTML(fields) {
    if (!fields || fields.length === 0) {
        return '<p style="text-align: center; color: #6b7280; font-style: italic; padding: 2rem;">Aucun champ défini. Cliquez sur "Ajouter un champ" pour commencer.</p>';
    }
    
    return fields.map((field, index) => generateFieldHTML(field, index)).join('');
}

/**
 * Génère le HTML pour un champ individuel
 */
function generateFieldHTML(field, index) {
    const fieldTypes = {
        'text': { icon: '📝', label: 'Texte simple' },
        'number': { icon: '🔢', label: 'Nombre' },
        'number-period': { icon: '💰', label: 'Nombre avec période' },
        'list': { icon: '📋', label: 'Liste déroulante' }
    };

    return `
        <div class="field-item" data-index="${index}">
            <div class="field-header">
                <input type="text" class="field-input" placeholder="Titre du champ" 
                       value="${field.label || ''}" onchange="updateFieldTitle(${index}, this.value)">
                <select class="field-type-select" onchange="updateFieldType(${index}, this.value)">
                    <option value="" disabled>Choisir le type</option>
                    ${Object.entries(fieldTypes).map(([type, info]) => 
                        `<option value="${type}" ${field.type === type ? 'selected' : ''}>${info.icon} ${info.label}</option>`
                    ).join('')}
                </select>
                <button class="field-delete-btn" onclick="removeField(${index})">&times;</button>
            </div>
            ${generateFieldOptionsHTML(field, index)}
        </div>
    `;
}

/**
 * Génère les options spécifiques selon le type de champ
 */
function generateFieldOptionsHTML(field, index) {
    switch (field.type) {
        case 'number-period':
            const periods = field.periods || [];
            return `
                <div class="field-options">
                    <h4>Périodes disponibles</h4>
                    <div class="period-options">
                        <label class="period-option">
                            <input type="checkbox" ${periods.includes('monthly') ? 'checked' : ''} 
                                   onchange="updatePeriodOption(${index}, 'monthly', this.checked)">
                            <span>Mensuel</span>
                        </label>
                        <label class="period-option">
                            <input type="checkbox" ${periods.includes('quarterly') ? 'checked' : ''} 
                                   onchange="updatePeriodOption(${index}, 'quarterly', this.checked)">
                            <span>Trimestriel</span>
                        </label>
                        <label class="period-option">
                            <input type="checkbox" ${periods.includes('yearly') ? 'checked' : ''} 
                                   onchange="updatePeriodOption(${index}, 'yearly', this.checked)">
                            <span>Annuel</span>
                        </label>
                    </div>
                </div>
            `;
        case 'list':
            const options = field.options || [];
            return `
                <div class="field-options">
                    <h4>Options de la liste</h4>
                    <div id="options-list-${index}">
                        ${options.map((option, optIndex) => `
                            <div class="option-item">
                                <input type="text" class="option-input" placeholder="Libellé de l'option" 
                                       value="${option.label || ''}" 
                                       onchange="updateListOption(${index}, ${optIndex}, this.value)">
                                <button class="option-delete-btn" onclick="removeListOption(${index}, ${optIndex})">&times;</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="add-option-btn" onclick="addListOption(${index})">
                        ➕ Ajouter une option
                    </button>
                </div>
            `;
        default:
            return '';
    }
}

/**
 * Fonctions globales pour la gestion des champs
 */
window.closeSimpleTemplateEditor = function() {
    const modal = document.getElementById('simple-template-editor-modal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.addNewField = function() {
    const template = window.currentEditingTemplate;
    const newField = {
        id: '',
        label: '',
        type: '',
        required: false
    };
    
    template.fields.push(newField);
    
    const container = document.getElementById('fields-container');
    const newIndex = template.fields.length - 1;
    
    // Ajouter le nouveau champ avec animation
    const fieldHTML = generateFieldHTML(newField, newIndex);
    container.insertAdjacentHTML('beforeend', fieldHTML);
    
    // Focus sur le titre du nouveau champ
    const newFieldElement = container.lastElementChild;
    newFieldElement.classList.add('new');
    const titleInput = newFieldElement.querySelector('.field-input');
    titleInput.focus();
    
    // Supprimer la classe d'animation après l'animation
    setTimeout(() => {
        newFieldElement.classList.remove('new');
    }, 300);
};

window.updateFieldTitle = function(index, title) {
    const template = window.currentEditingTemplate;
    template.fields[index].label = title;
    template.fields[index].id = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

window.updateFieldType = function(index, type) {
    const template = window.currentEditingTemplate;
    const field = template.fields[index];
    field.type = type;
    
    // Initialiser les propriétés spécifiques au type
    switch (type) {
        case 'number-period':
            field.periods = field.periods || ['monthly'];
            break;
        case 'list':
            field.options = field.options || [{ value: '', label: '' }];
            break;
        case 'text':
        case 'number':
            // Nettoyer les propriétés spécifiques
            delete field.periods;
            delete field.options;
            break;
    }
    
    // Actualiser l'affichage du champ
    const fieldElement = document.querySelector(`[data-index="${index}"]`);
    const optionsContainer = fieldElement.querySelector('.field-options');
    if (optionsContainer) {
        optionsContainer.remove();
    }
    
    const newOptionsHTML = generateFieldOptionsHTML(field, index);
    if (newOptionsHTML) {
        fieldElement.insertAdjacentHTML('beforeend', newOptionsHTML);
    }
};

window.removeField = function(index) {
    const template = window.currentEditingTemplate;
    template.fields.splice(index, 1);
    
    // Régénérer tous les champs pour mettre à jour les indices
    refreshFieldsDisplay();
};

window.updatePeriodOption = function(index, period, checked) {
    const template = window.currentEditingTemplate;
    const field = template.fields[index];
    
    if (!field.periods) field.periods = [];
    
    if (checked) {
        if (!field.periods.includes(period)) {
            field.periods.push(period);
        }
    } else {
        field.periods = field.periods.filter(p => p !== period);
    }
};

window.addListOption = function(index) {
    const template = window.currentEditingTemplate;
    const field = template.fields[index];
    
    if (!field.options) field.options = [];
    field.options.push({ value: '', label: '' });
    
    // Régénérer les options
    const optionsList = document.getElementById(`options-list-${index}`);
    const newOptionHTML = `
        <div class="option-item">
            <input type="text" class="option-input" placeholder="Libellé de l'option" 
                   onchange="updateListOption(${index}, ${field.options.length - 1}, this.value)">
            <button class="option-delete-btn" onclick="removeListOption(${index}, ${field.options.length - 1})">&times;</button>
        </div>
    `;
    optionsList.insertAdjacentHTML('beforeend', newOptionHTML);
    
    // Focus sur la nouvelle option
    const newOptionInput = optionsList.lastElementChild.querySelector('.option-input');
    newOptionInput.focus();
};

window.updateListOption = function(index, optionIndex, value) {
    const template = window.currentEditingTemplate;
    const option = template.fields[index].options[optionIndex];
    option.label = value;
    option.value = value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

window.removeListOption = function(index, optionIndex) {
    const template = window.currentEditingTemplate;
    template.fields[index].options.splice(optionIndex, 1);
    
    // Régénérer les options
    const optionsList = document.getElementById(`options-list-${index}`);
    const options = template.fields[index].options;
    
    optionsList.innerHTML = options.map((option, idx) => `
        <div class="option-item">
            <input type="text" class="option-input" placeholder="Libellé de l'option" 
                   value="${option.label || ''}" 
                   onchange="updateListOption(${index}, ${idx}, this.value)">
            <button class="option-delete-btn" onclick="removeListOption(${index}, ${idx})">&times;</button>
        </div>
    `).join('');
};

window.saveSimpleTemplate = function(isEditing) {
    const template = window.currentEditingTemplate;
    const templateName = document.getElementById('template-name').value.trim();
    
    // Validation
    if (!templateName) {
        showNotification('Veuillez entrer un nom pour le template', 'error');
        document.getElementById('template-name').focus();
        return;
    }
    
    // Valider que tous les champs ont un titre et un type
    for (let i = 0; i < template.fields.length; i++) {
        const field = template.fields[i];
        if (!field.label.trim()) {
            showNotification(`Le champ ${i + 1} doit avoir un titre`, 'error');
            return;
        }
        if (!field.type) {
            showNotification(`Le champ "${field.label}" doit avoir un type`, 'error');
            return;
        }
        
        // Validation spécifique pour les listes
        if (field.type === 'list') {
            if (!field.options || field.options.length === 0 || !field.options.some(opt => opt.label.trim())) {
                showNotification(`Le champ "${field.label}" de type liste doit avoir au moins une option`, 'error');
                return;
            }
        }
        
        // Validation spécifique pour les nombres avec période
        if (field.type === 'number-period') {
            if (!field.periods || field.periods.length === 0) {
                showNotification(`Le champ "${field.label}" de type nombre avec période doit avoir au moins une période sélectionnée`, 'error');
                return;
            }
        }
    }
    
    // Finaliser le template
    template.name = templateName;
    if (!template.id || !isEditing) {
        template.id = templateName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
    
    // Sauvegarder
    let success = false;
    if (isEditing) {
        success = updateTemplate(template);
    } else {
        success = addTemplate(template);
    }
    
    if (success) {
        showNotification(`Template "${templateName}" ${isEditing ? 'modifié' : 'créé'} avec succès`, 'success');
        closeSimpleTemplateEditor();
        
        // Appeler le callback de changement de template
        if (onTemplateChangeCallback) {
            onTemplateChangeCallback();
        }
    }
};

/**
 * Convertit un champ simplifié vers le format standard de l'application
 */
function convertToStandardField(simpleField) {
    const baseField = {
        id: simpleField.id,
        label: simpleField.label,
        required: simpleField.required || false,
        placeholder: `Entrez ${simpleField.label.toLowerCase()}`
    };
    
    switch (simpleField.type) {
        case 'text':
            return {
                ...baseField,
                type: 'text'
            };
            
        case 'number':
            return {
                ...baseField,
                type: 'number',
                placeholder: '0'
            };
            
        case 'number-period':
            // Créer deux champs : un pour le montant et un pour la période
            const numberField = {
                ...baseField,
                type: 'number',
                placeholder: '0.00'
            };
            
            const periodField = {
                id: `${simpleField.id}-period`,
                label: `Période (${simpleField.label})`,
                type: 'select',
                required: false,
                options: simpleField.periods.map(period => ({
                    value: period,
                    label: period === 'monthly' ? 'Mensuel' : 
                           period === 'quarterly' ? 'Trimestriel' : 'Annuel'
                }))
            };
            
            // Retourner un tableau pour indiquer qu'il faut ajouter deux champs
            return [numberField, periodField];
            
        case 'list':
            return {
                ...baseField,
                type: 'select',
                options: simpleField.options.filter(opt => opt.label.trim()).map(opt => ({
                    value: opt.value,
                    label: opt.label
                }))
            };
            
        default:
            return {
                ...baseField,
                type: 'text'
            };
    }
}

/**
 * Actualise l'affichage des champs
 */
function refreshFieldsDisplay() {
    const template = window.currentEditingTemplate;
    const container = document.getElementById('fields-container');
    
    if (template.fields.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280; font-style: italic; padding: 2rem;">Aucun champ défini. Cliquez sur "Ajouter un champ" pour commencer.</p>';
    } else {
        container.innerHTML = generateFieldsHTML(template.fields);
    }
}

/**
 * Ouvre la modal de gestion des templates (version simplifiée)
 */
export function openTemplateModal() {
    // Créer la modal si elle n'existe pas encore
    let modalContainer = document.getElementById('template-modal-container');
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'template-modal-container';
        modalContainer.className = 'template-modal';
        document.body.appendChild(modalContainer);
    }
    
    // Remplir la modal avec le contenu
    modalContainer.innerHTML = `
        <div class="template-modal-content">
            <div class="template-modal-header">
                <h2>📋 Gestion des templates</h2>
                <button class="template-modal-close">&times;</button>
            </div>
            <div class="template-modal-body">
                <div class="template-form-group">
                    <button class="template-btn template-btn-primary" style="width: 100%; margin-bottom: 24px;" onclick="openSimpleTemplateEditor()">
                        ➕ Créer un nouveau template
                    </button>
                </div>
                <div class="templates-list">
                    ${templates.map(template => `
                        <div class="field-item ${template.id === currentTemplateId ? 'active' : ''}" style="background: ${template.id === currentTemplateId ? '#f0f8ff' : 'white'}; border-color: ${template.id === currentTemplateId ? '#667eea' : '#e2e8f0'};">
                            <div class="field-header">
                                <span style="flex: 1; font-weight: 600; color: #1f2937;">${template.name}</span>
                                <button class="template-btn template-btn-secondary" style="padding: 8px 16px; margin-right: 8px;" onclick="setCurrentTemplate('${template.id}'); openTemplateModal();">
                                    ${template.id === currentTemplateId ? '✅ Actif' : 'Activer'}
                                </button>
                                <button class="template-btn template-btn-secondary" style="padding: 8px 16px; margin-right: 8px;" onclick="openSimpleTemplateEditor(${JSON.stringify(template).replace(/"/g, '&quot;')})">
                                    ✏️ Modifier
                                </button>
                                ${template.id !== 'default' ? `
                                    <button class="template-btn template-btn-danger" style="padding: 8px 16px;" onclick="deleteTemplateWithConfirm('${template.id}')">
                                        🗑️ Supprimer
                                    </button>
                                ` : ''}
                            </div>
                            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                                ${template.fields.length} champ${template.fields.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="template-modal-footer">
                <button class="template-btn template-btn-secondary" onclick="closeTemplateModal()">
                    Fermer
                </button>
            </div>
        </div>
    `;

    modalContainer.style.display = 'flex';
    
    // Ajouter les gestionnaires d'événements
    const closeBtn = modalContainer.querySelector('.template-modal-close');
    closeBtn.addEventListener('click', () => {
        modalContainer.style.display = 'none';
    });
}

window.closeTemplateModal = function() {
    const modal = document.getElementById('template-modal-container');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.deleteTemplateWithConfirm = function(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (template && confirm(`Êtes-vous sûr de vouloir supprimer le template "${template.name}" ?`)) {
        if (deleteTemplate(templateId)) {
            showNotification(`Template "${template.name}" supprimé`, 'success');
            openTemplateModal(); // Refresh the modal
        }
    }
};
