document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const addOfferBtn = document.getElementById('add-offer-btn');
    const groupOffersBtn = document.getElementById('group-offers-btn');
    const offersContainer = document.getElementById('offers-container');
    const templateManagerBtn = document.getElementById('template-manager-btn');
    const templateModal = document.getElementById('template-modal');
    const iconSelectorModal = document.getElementById('icon-selector-modal');

    let nextOfferId = 2;
    let nextGroupId = 1;
    
    // Variable pour stocker l'élément actuellement en cours d'édition d'icône
    let currentIconTarget = null;
    let currentIconType = null; // 'template' ou 'offer'
    
    // Pour la conversion PNG
    const PNG_HEADER = "CONTPICK"; // En-tête pour identifier nos fichiers PNG
    
    // Template system - default fields structure
    const defaultTemplateFields = [
        { id: 'offer-name', label: "Nom de l'offre", type: 'text', placeholder: "Nom de l'offre (ex: Contrat A)", required: true },
        { id: 'offer-cost', label: "Coût Total", type: 'number', placeholder: "Coût Total (€)" },
        { id: 'offer-cost-type', label: "Type de Coût", type: 'select', options: [
            { value: 'one', label: 'Paiement unique' },
            { value: 'monthly', label: 'Mensuel' },
            { value: 'quarterly', label: 'Trimestriel' },
            { value: 'yearly', label: 'Annuel' }
        ]},
        { id: 'offer-sla', label: "Délai Interv.", type: 'number', placeholder: "Délai Interv. (heures)" },
        { id: 'offer-quality', label: "Score Matériel", type: 'number', placeholder: "Score Matériel (/100)" },
        { id: 'offer-feeling', label: "Votre Ressenti", type: 'number', placeholder: "Votre Ressenti (/100)" },
        { id: 'contract-note', label: "Note", type: 'textarea', placeholder: "Note sur le contrat (ex: particularités, remarques...)" },
        { id: 'contract-engagement', label: "Durée d'engagement", type: 'number', placeholder: "Durée d'engagement (mois)" },
        { id: 'contract-penalty', label: "Pénalités", type: 'number', placeholder: "Pénalités de résiliation (€)" },
        { id: 'contract-cancel-delay', label: "Préavis", type: 'number', placeholder: "Préavis avant résiliation (jours)" }
    ];
    
    // Current active template
    let currentTemplate = {
        name: 'Template par défaut',
        fields: JSON.parse(JSON.stringify(defaultTemplateFields)) // deep copy
    };
    
    // Load saved templates from localStorage
    let savedTemplates = JSON.parse(localStorage.getItem('contractPickerTemplates') || '{}');
    if (!Object.keys(savedTemplates).length) {
        // Add default template if no templates exist
        savedTemplates = {
            'default': {
                name: 'Template par défaut',
                fields: JSON.parse(JSON.stringify(defaultTemplateFields))
            }
        };
        localStorage.setItem('contractPickerTemplates', JSON.stringify(savedTemplates));
    }

    // --- Helper: Format date for systime ---
    function formatSystime(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function isOlderThanOneMonth(ts) {
        if (!ts) return false;
        const now = Date.now();
        const oneMonth = 31 * 24 * 60 * 60 * 1000;
        return (now - ts) > oneMonth;
    }

    // Update systime display (with warning if >1 month)
    function updateSystimeDisplay(card) {
        const systime = parseInt(card.dataset.systime, 10);
        const systimeSpan = card.querySelector('.offer-systime');
        if (systimeSpan) {
            let text = 'Ce contrat date de : ' + formatSystime(systime);
            if (isOlderThanOneMonth(systime)) {
                text += ' <span style="color:#c62828;font-weight:bold;">⚠️ Ce contrat pourrait ne plus être valide</span>';
            }
            systimeSpan.innerHTML = text;
        }
    }

    // --- Template Management Functions ---
    
    // Initialize the template modal
    function initTemplateModal() {
        // Setup tab navigation
        document.querySelectorAll('.template-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Hide all tab content
                document.querySelectorAll('.template-tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                
                // Deactivate all tabs
                document.querySelectorAll('.template-tab').forEach(t => {
                    t.classList.remove('active');
                });
                
                // Activate clicked tab
                tab.classList.add('active');
                
                // Show corresponding content
                const tabId = tab.dataset.tab;
                document.getElementById(`${tabId}-tab`).style.display = 'block';
            });
        });
        
        // Load template fields
        loadTemplateFields();
        
        // Load saved templates list
        loadSavedTemplatesList();
        
        // Setup event listeners
        document.getElementById('add-field-btn').addEventListener('click', addNewTemplateField);
        document.getElementById('reset-fields-btn').addEventListener('click', resetTemplateFields);
        document.getElementById('save-template-btn').addEventListener('click', saveCurrentTemplate);
        document.getElementById('apply-template-btn').addEventListener('click', applyCurrentTemplate);
        document.getElementById('close-modal-btn').addEventListener('click', closeTemplateModal);
        document.querySelector('.close-modal').addEventListener('click', closeTemplateModal);
        document.getElementById('export-template-csv-btn').addEventListener('click', exportTemplateToPNG);
        document.getElementById('import-template-btn').addEventListener('click', () => {
            document.getElementById('import-template-input').click();
        });
        document.getElementById('import-template-input').addEventListener('change', importTemplateFromPNG);
        
        // When clicking outside the modal content, close the modal
        window.addEventListener('click', (event) => {
            if (event.target === templateModal) {
                closeTemplateModal();
            }
        });
    }
    
    // Open template modal
    function openTemplateModal() {
        templateModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    }
    
    // Close template modal
    function closeTemplateModal() {
        templateModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // Load template fields into the edit fields tab
    function loadTemplateFields() {
        const fieldList = document.querySelector('.template-field-list');
        fieldList.innerHTML = '';
        
        currentTemplate.fields.forEach((field, index) => {
            const fieldElement = createTemplateFieldElement(field, index);
            fieldList.appendChild(fieldElement);
        });
    }
    
    // Create a field element for the template editor
    function createTemplateFieldElement(field, index) {
        const template = document.getElementById('template-field-item');
        const fieldElement = template.content.cloneNode(true).querySelector('.template-field-item');
        
        // Set field values
        fieldElement.dataset.index = index;
        fieldElement.querySelector('.field-label').value = field.label || '';
        fieldElement.querySelector('.field-type').value = field.type || 'text';
        fieldElement.querySelector('.field-placeholder').value = field.placeholder || '';
        
        // Handle options for select fields
        const fieldOptions = fieldElement.querySelector('.field-options');
        if (field.type === 'select' && field.options) {
            fieldOptions.style.display = '';
            fieldOptions.value = field.options.map(opt => `${opt.value}:${opt.label}`).join(';');
        } else {
            fieldOptions.style.display = 'none';
        }
        
        // Show/hide options field based on selected type
        const fieldTypeSelect = fieldElement.querySelector('.field-type');
        fieldTypeSelect.addEventListener('change', () => {
            if (fieldTypeSelect.value === 'select') {
                fieldOptions.style.display = '';
            } else {
                fieldOptions.style.display = 'none';
            }
        });
        
        // Delete field button
        fieldElement.querySelector('.delete-field-btn').addEventListener('click', () => {
            if (currentTemplate.fields.length > 1) {
                fieldElement.remove();
                currentTemplate.fields.splice(index, 1);
                loadTemplateFields(); // Reload to update indices
            } else {
                alert('Vous ne pouvez pas supprimer tous les champs. Un template doit contenir au moins un champ.');
            }
        });
        
        // Update template data when field changes
        ['field-label', 'field-type', 'field-placeholder', 'field-options'].forEach(className => {
            const input = fieldElement.querySelector(`.${className}`);
            input.addEventListener('change', () => {
                updateFieldData(index, fieldElement);
            });
        });
        
        return fieldElement;
    }
    
    // Update field data in currentTemplate when edits are made
    function updateFieldData(index, fieldElement) {
        const field = currentTemplate.fields[index];
        if (!field) return;
        
        field.label = fieldElement.querySelector('.field-label').value;
        field.type = fieldElement.querySelector('.field-type').value;
        field.placeholder = fieldElement.querySelector('.field-placeholder').value;
        
        // Handle select options
        if (field.type === 'select') {
            const optionsStr = fieldElement.querySelector('.field-options').value;
            field.options = optionsStr.split(';')
                .filter(opt => opt.trim())
                .map(opt => {
                    const [value, label] = opt.split(':').map(s => s.trim());
                    return { value, label: label || value };
                });
        }
    }
    
    // Add a new field to the template
    function addNewTemplateField() {
        const newField = {
            id: `custom-field-${Date.now()}`,
            label: 'Nouveau champ',
            type: 'text',
            placeholder: 'Saisissez une valeur'
        };
        
        currentTemplate.fields.push(newField);
        loadTemplateFields();
        
        // Scroll to bottom to show the new field
        const fieldList = document.querySelector('.template-field-list');
        fieldList.scrollTop = fieldList.scrollHeight;
    }
    
    // Reset template fields to default
    function resetTemplateFields() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser les champs ? Cette action ne peut pas être annulée.')) {
            currentTemplate.fields = JSON.parse(JSON.stringify(defaultTemplateFields));
            loadTemplateFields();
        }
    }
    
    // Load the list of saved templates
    function loadSavedTemplatesList() {
        const listContainer = document.querySelector('.saved-templates-list');
        listContainer.innerHTML = '';
        
        Object.keys(savedTemplates).forEach(key => {
            const template = savedTemplates[key];
            const templateItem = document.createElement('div');
            templateItem.className = 'saved-template-item';
            templateItem.innerHTML = `
                <span class="template-name">${template.name}</span>
                <div class="template-load-actions">
                    <button class="load-template-btn" data-key="${key}">Charger</button>
                    ${key !== 'default' ? `<button class="delete-template-btn" data-key="${key}">Supprimer</button>` : ''}
                </div>
            `;
            
            // Load template button
            templateItem.querySelector('.load-template-btn').addEventListener('click', () => {
                loadTemplate(key);
            });
            
            // Delete template button (if not default)
            if (key !== 'default') {
                templateItem.querySelector('.delete-template-btn').addEventListener('click', () => {
                    deleteTemplate(key);
                });
            }
            
            listContainer.appendChild(templateItem);
        });
    }
    
    // Load a template from saved templates
    function loadTemplate(key) {
        const template = savedTemplates[key];
        if (template) {
            currentTemplate = {
                name: template.name,
                fields: JSON.parse(JSON.stringify(template.fields)), // deep copy
                icon: template.icon || '📋'
            };
            
            // Mettre à jour le nom du template dans l'interface
            document.getElementById('template-name-input').value = template.name;
            
            // Mettre à jour l'icône si disponible
            if (template.icon) {
                const iconDisplay = document.getElementById('template-icon-display');
                if (iconDisplay) {
                    if (typeof template.icon === 'string' && template.icon.startsWith('data:')) {
                        iconDisplay.innerHTML = `<img src="${template.icon}" alt="Icon">`;
                    } else {
                        iconDisplay.innerHTML = `<span>${template.icon}</span>`;
                    }
                    iconDisplay.dataset.icon = template.icon;
                }
            }
            
            loadTemplateFields();
            showNotification(`✅ Template "${template.name}" chargé avec succès.`);
        }
    }
    
    // Delete a saved template
    function deleteTemplate(key) {
        if (confirm(`Êtes-vous sûr de vouloir supprimer le template "${savedTemplates[key].name}" ?`)) {
            delete savedTemplates[key];
            localStorage.setItem('contractPickerTemplates', JSON.stringify(savedTemplates));
            loadSavedTemplatesList();
            alert('Template supprimé avec succès.');
        }
    }
    
    // Save the current template
    function saveCurrentTemplate() {
        const templateName = document.getElementById('template-name-input').value.trim() || 'Template sans nom';
        currentTemplate.name = templateName;
        
        // Sauvegarder l'icône du template si disponible
        const iconDisplay = document.getElementById('template-icon-display');
        if (iconDisplay) {
            if (iconDisplay.querySelector('img')) {
                currentTemplate.icon = iconDisplay.querySelector('img').src;
            } else {
                currentTemplate.icon = iconDisplay.textContent || '📋';
            }
        }
        
        const templateKey = 'template_' + Date.now();
        savedTemplates[templateKey] = JSON.parse(JSON.stringify(currentTemplate));
        
        localStorage.setItem('contractPickerTemplates', JSON.stringify(savedTemplates));
        loadSavedTemplatesList();
        showNotification(`✅ Template "${templateName}" sauvegardé avec succès.`);
    }
    
    // Apply the current template to the form
    function applyCurrentTemplate() {
        if (confirm('Appliquer le template "' + currentTemplate.name + '" ? Les offres existantes seront adaptées au nouveau format.')) {
            // Store the current values of existing offers
            const existingOffers = [];
            offersContainer.querySelectorAll('.offer-card').forEach(card => {
                const offerData = {
                    systime: card.dataset.systime || Date.now()
                };
                
                // For each field in the current template, save its value
                currentTemplate.fields.forEach(field => {
                    const element = card.querySelector('.' + field.id);
                    if (element) {
                        offerData[field.id] = element.value;
                    }
                });
                
                // Save extra costs
                const extraCosts = [];
                card.querySelectorAll('.extra-cost-row').forEach(row => {
                    extraCosts.push({
                        extraCostAmount: row.querySelector('.extra-cost-amount').value,
                        extraCostFrequency: row.querySelector('.extra-cost-frequency').value,
                        extraCostPeriod: row.querySelector('.extra-cost-period').value,
                        extraCostNote: row.querySelector('.extra-cost-note').value
                    });
                });
                offerData.extraCosts = extraCosts;
                
                existingOffers.push(offerData);
            });
            
            // Clear all existing offers
            offersContainer.innerHTML = '';
            
            // Create a new template for offer cards based on current template
            updateCardTemplate();
            
            // Recreate offers with the new template and preserved data
            existingOffers.forEach(offerData => {
                createContractCardFromTemplateData(offerData);
            });
            
            closeTemplateModal();
            alert('Le template "' + currentTemplate.name + '" a été appliqué.');
            
            // Update to preserve CSV settings
            updateOffersTotalSummary();
        }
    }
    
    // Create HTML for dynamic card template based on current template
    function updateCardTemplate() {
        // First offer template is maintained in the HTML, update it for new instances
        const firstOfferCard = offersContainer.querySelector('.offer-card');
        if (firstOfferCard) {
            updateCardWithTemplate(firstOfferCard);
        }
    }
    
    // Update an offer card with the current template
    function updateCardWithTemplate(card) {
        // Preserve header and extra costs sections
        const headerHTML = `
            <div class="offer-header">
                <input type="checkbox" class="offer-group-checkbox" title="Sélectionner pour regrouper">
                <input type="text" placeholder="Nom de l'offre (ex: Contrat A)" class="offer-name">
                <button class="delete-offer-btn" title="Supprimer l'offre" aria-label="Supprimer l'offre">🗑️</button>
                <button class="clone-offer-btn" title="Cloner l'offre" aria-label="Cloner l'offre" style="margin-left:2px;">📄</button>
                <span class="offer-systime" style="margin-left:auto;font-size:13px;color:#888;"></span>
            </div>
        `;
        
        const extraCostsHTML = `
            <div class="extra-costs-list"></div>
            <button class="add-extra-cost-btn" type="button">+ Ajouter un coût supplémentaire</button>
        `;
        
        // Generate dynamic fields based on template
        let fieldsHTML = '<div class="offer-inputs">';
        
        currentTemplate.fields.forEach(field => {
            // Skip the offer name as it's in the header
            if (field.id === 'offer-name') return;
            
            switch(field.type) {
                case 'select':
                    fieldsHTML += '<select class="' + field.id + '">';
                    if (field.options && Array.isArray(field.options)) {
                        field.options.forEach(opt => {
                            fieldsHTML += '<option value="' + opt.value + '">' + opt.label + '</option>';
                        });
                    }
                    fieldsHTML += '</select>';
                    break;
                    
                case 'textarea':
                    fieldsHTML += '<textarea class="' + field.id + '" placeholder="' + field.placeholder + '" rows="2"></textarea>';
                    break;
                    
                default: // text, number, etc.
                    fieldsHTML += '<input type="' + field.type + '" class="' + field.id + '" placeholder="' + field.placeholder + '">';
            }
        });
        
        fieldsHTML += '</div>';
        
        // Update the card HTML
        card.innerHTML = headerHTML + fieldsHTML + extraCostsHTML;
    }
    
    // Create a new contract card with template data
    function createContractCardFromTemplateData(data) {
        // Click the add offer button to create a new card
        addOfferBtn.click();
        
        // Get the last offer card (the one just added)
        const offerCards = offersContainer.querySelectorAll('.offer-card');
        const card = offerCards[offerCards.length - 1];
        if (!card) return;
        
        // Set systime
        card.dataset.systime = data.systime || Date.now();
        updateSystimeDisplay(card);
        
        // Fill in template fields
        currentTemplate.fields.forEach(field => {
            const element = card.querySelector('.' + field.id);
            if (element && data[field.id] !== undefined) {
                element.value = data[field.id];
            }
        });
        
        // Add extra costs
        if (Array.isArray(data.extraCosts)) {
            const addExtraBtn = card.querySelector('.add-extra-cost-btn');
            const extraCostsList = card.querySelector('.extra-costs-list');
            
            data.extraCosts.forEach(ec => {
                addExtraBtn.click();
                // Get the last extra cost row
                const rows = extraCostsList.querySelectorAll('.extra-cost-row');
                const row = rows[rows.length - 1];
                if (!row) return;
                
                row.querySelector('.extra-cost-amount').value = ec.extraCostAmount || '';
                row.querySelector('.extra-cost-frequency').value = ec.extraCostFrequency || 1;
                row.querySelector('.extra-cost-period').value = ec.extraCostPeriod || 'one';
                row.querySelector('.extra-cost-note').value = ec.extraCostNote || '';
            });
        }
        
        // Trigger input events for live updates
        card.dispatchEvent(new Event('input', { bubbles: true }));
        card.dispatchEvent(new Event('change', { bubbles: true }));
        
        return card;
    }
    
    // Open modal when template manager button is clicked
    if (templateManagerBtn) {
        templateManagerBtn.addEventListener('click', () => {
            openTemplateModal();
        });
    }
    
    // Initialize template modal
    initTemplateModal();
    
    // --- Icon Selector Functions ---
    
    // Initialize icon selector modal
    function initIconSelectorModal() {
        // Setup tab navigation
        document.querySelectorAll('.icon-selector-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Hide all tab content
                document.querySelectorAll('.icon-selector-tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                
                // Deactivate all tabs
                document.querySelectorAll('.icon-selector-tab').forEach(t => {
                    t.classList.remove('active');
                });
                
                // Activate clicked tab
                tab.classList.add('active');
                
                // Show corresponding content
                const tabId = tab.dataset.tab;
                document.getElementById(tabId + '-tab').style.display = 'block';
            });
        });
        
        // Setup preset icon selection
        document.querySelectorAll('.icon-item').forEach(item => {
            item.addEventListener('click', () => {
                // Clear previous selection
                document.querySelectorAll('.icon-item').forEach(i => i.classList.remove('selected'));
                
                // Select new item
                item.classList.add('selected');
            });
        });
        
        // Setup file selection
        document.getElementById('select-icon-file-btn').addEventListener('click', () => {
            document.getElementById('icon-upload').click();
        });
        
        document.getElementById('icon-upload').addEventListener('change', handleIconFileSelect);
        
        // Apply and cancel buttons
        document.getElementById('apply-icon-btn').addEventListener('click', applySelectedIcon);
        document.getElementById('cancel-icon-btn').addEventListener('click', closeIconModal);
        document.querySelector('.close-icon-modal').addEventListener('click', closeIconModal);
        
        // When clicking outside the modal content, close the modal
        window.addEventListener('click', (event) => {
            if (event.target === iconSelectorModal) {
                closeIconModal();
            }
        });
    }
    
    // Handle icon file selection
    function handleIconFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check file size
        if (file.size > 500000) { // 500KB limit
            alert('L\'image est trop grande. Veuillez sélectionner une image de moins de 500Ko.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('selected-icon-preview');
            preview.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = event.target.result;
            img.dataset.icon = event.target.result; // Store the data URL
            preview.appendChild(img);
        };
        
        reader.readAsDataURL(file);
    }
    
    // Open icon selector modal
    function openIconModal(target, type) {
        currentIconTarget = target;
        currentIconType = type;
        
        // Reset selections
        document.querySelectorAll('.icon-item').forEach(i => i.classList.remove('selected'));
        document.getElementById('selected-icon-preview').innerHTML = '';
        document.getElementById('icon-upload').value = '';
        
        // Show the first tab
        document.querySelector('.icon-selector-tab[data-tab="preset"]').click();
        
        // Show modal
        iconSelectorModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    // Close icon selector modal
    function closeIconModal() {
        iconSelectorModal.style.display = 'none';
        document.body.style.overflow = '';
        currentIconTarget = null;
        currentIconType = null;
    }
    
    // Apply the selected icon
    function applySelectedIcon() {
        if (!currentIconTarget) return;
        
        // Get selected icon
        const selectedPreset = document.querySelector('.icon-item.selected');
        const uploadedImage = document.querySelector('#selected-icon-preview img');
        
        let iconValue = '';
        let isCustomImage = false;
        
        if (uploadedImage) {
            iconValue = uploadedImage.dataset.icon;
            isCustomImage = true;
        } else if (selectedPreset) {
            iconValue = selectedPreset.dataset.icon;
        } else {
            // No selection, use default
            iconValue = '📄';
        }
        
        // Update icon in the target element
        if (currentIconType === 'template') {
            const iconDisplay = document.getElementById('template-icon-display');
            iconDisplay.dataset.icon = iconValue;
            
            if (isCustomImage) {
                iconDisplay.innerHTML = '<img src="' + iconValue + '" alt="Custom icon">';
            } else {
                iconDisplay.innerHTML = '<span>' + iconValue + '</span>';
            }
        } else if (currentIconType === 'offer') {
            const iconContainer = currentIconTarget.querySelector('.offer-icon');
            if (iconContainer) {
                iconContainer.dataset.icon = iconValue;
                
                if (isCustomImage) {
                    iconContainer.innerHTML = '<img src="' + iconValue + '" alt="Custom icon">';
                } else {
                    iconContainer.innerHTML = '<span>' + iconValue + '</span>';
                }
            }
        }
        
        closeIconModal();
    }
    
    // Initialize icon selector modal
    initIconSelectorModal();
    
    // Event listener for template icon button
    document.getElementById('select-template-icon-btn').addEventListener('click', () => {
        openIconModal(document.getElementById('template-icon-display').parentElement, 'template');
    });
    
    // Event delegation for offer icon buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('select-offer-icon-btn')) {
            const offerCard = e.target.closest('.offer-card');
            if (offerCard) {
                openIconModal(offerCard, 'offer');
            }
        }
    });
    
    // --- Helper: Get all offer data as variables ---
    function getAllOffersData() {
        const offers = [];
        offersContainer.querySelectorAll('.offer-card').forEach(card => {
            // Create offer object and add systime
            const offer = {
                systime: card.dataset.systime || Date.now()
            };
            
            // Extract values from template fields
            currentTemplate.fields.forEach(field => {
                const element = card.querySelector('.' + field.id);
                if (element) {
                    offer[field.id] = element.value || '';
                }
            });
            
            // Ensure backward compatibility with standard field names
            // Map template fields to standard field names for CSV export
            const fieldMap = {
                'offer-name': 'offerName',
                'offer-cost': 'offerCost',
                'offer-cost-type': 'offerCostType',
                'offer-sla': 'offerSla',
                'offer-quality': 'offerQuality',
                'offer-feeling': 'offerFeeling',
                'contract-note': 'contractNote',
                'contract-engagement': 'contractEngagement',
                'contract-penalty': 'contractPenalty',
                'contract-cancel-delay': 'contractCancelDelay'
            };
            
            // Map fields to standard names for CSV compatibility
            for (const [templateId, csvId] of Object.entries(fieldMap)) {
                if (offer[templateId] !== undefined) {
                    offer[csvId] = offer[templateId];
                }
            }
            
            // Extra costs (handled separately)
            const extraCosts = [];
            card.querySelectorAll('.extra-cost-row').forEach(row => {
                const extraCostAmount = row.querySelector('.extra-cost-amount')?.value || '';
                const extraCostNote = row.querySelector('.extra-cost-note')?.value || '';
                const extraCostFrequency = row.querySelector('.extra-cost-frequency')?.value || '';
                const extraCostPeriod = row.querySelector('.extra-cost-period')?.value || '';
                extraCosts.push({ extraCostAmount, extraCostNote, extraCostFrequency, extraCostPeriod });
            });
            offer.extraCosts = extraCosts;
            
            offers.push(offer);
        });
        return offers;
    }

    // --- Extra Costs: Add/Remove (event delegation) ---
    offersContainer.addEventListener('click', (e) => {
        // Delete Offer
        if (e.target.classList.contains('delete-offer-btn')) {
            e.target.closest('.offer-card')?.remove();
        }
        // Add Extra Cost
        if (e.target.classList.contains('add-extra-cost-btn')) {
            const offerCard = e.target.closest('.offer-card');
            if (!offerCard) return;
            const list = offerCard.querySelector('.extra-costs-list');
            const row = document.createElement('div');
            row.className = 'extra-cost-row';
            row.innerHTML = `
                <input type="number" class="extra-cost-amount" placeholder="Montant (€)">
                <input type="number" class="extra-cost-frequency" min="1" value="1" style="width:60px;" title="Fréquence">
                <select class="extra-cost-period">
                    <option value="one">fois</option>
                    <option value="monthly">/mois</option>
                    <option value="quarterly">/trimestre</option>
                    <option value="yearly">/an</option>
                </select>
                <input type="text" class="extra-cost-note" placeholder="Note (ex: maintenance, livraison...)" style="width:180px;">
                <button class="remove-extra-cost-btn" type="button" title="Supprimer">🗑️</button>
            `;
            list.appendChild(row);
        }
        // Remove Extra Cost
        if (e.target.classList.contains('remove-extra-cost-btn')) {
            e.target.closest('.extra-cost-row')?.remove();
        }
    });

    // --- Group Offers ---
    groupOffersBtn.addEventListener('click', () => {
        const selected = Array.from(offersContainer.querySelectorAll('.offer-group-checkbox:checked'));
        if (selected.length < 2) {
            alert('Sélectionnez au moins deux offres à regrouper.');
            return;
        }
        const groupMemberIds = [];
        const groupMemberNames = [];
        let totalCost = 0;
        let totalQuality = 0;
        let totalFeeling = 0;
        let totalSla = 0;
        let count = 0;
        selected.forEach(checkbox => {
            const card = checkbox.closest('.offer-card');
            groupMemberIds.push(card.dataset.id);
            groupMemberNames.push(card.querySelector('.offer-name').value || `Offre ${card.dataset.id}`);
            // Use variables for calculation
            const offerCost = parseFloat(card.querySelector('.offer-cost')?.value) || 0;
            const offerQuality = parseFloat(card.querySelector('.offer-quality')?.value) || 0;
            const offerFeeling = parseFloat(card.querySelector('.offer-feeling')?.value) || 0;
            const offerSla = parseFloat(card.querySelector('.offer-sla')?.value) || 0;
            totalCost += offerCost;
            totalQuality += offerQuality;
            totalFeeling += offerFeeling;
            totalSla += offerSla;
            count++;
            card.classList.add('hidden');
            checkbox.checked = false;
        });
        // Create grouped offer card
        const template = document.getElementById('grouped-offer-template');
        const groupedCard = template.content.cloneNode(true).firstElementChild;
        groupedCard.dataset.groupId = `group-${nextGroupId++}`;
        groupedCard.dataset.memberIds = JSON.stringify(groupMemberIds);
        groupedCard.querySelector('.lot-title').textContent = `Lot: ${groupMemberNames.join(' + ')}`;
        groupedCard.querySelector('.lot-cost').textContent = totalCost.toFixed(2);
        groupedCard.querySelector('.lot-quality').textContent = (totalQuality/count).toFixed(2);
        groupedCard.querySelector('.lot-feeling').textContent = (totalFeeling/count).toFixed(2);
        groupedCard.querySelector('.lot-sla').textContent = (totalSla/count).toFixed(2);
        groupedCard.querySelector('.ungroup-btn').addEventListener('click', () => {
            JSON.parse(groupedCard.dataset.memberIds).forEach(id => {
                const offerToUnhide = offersContainer.querySelector(`.offer-card[data-id="${id}"]`);
                if (offerToUnhide) offerToUnhide.classList.remove('hidden');
            });
            groupedCard.remove();
        });
        offersContainer.appendChild(groupedCard);
    });

    // --- Clone Offer ---
    offersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('clone-offer-btn')) {
            const originalCard = e.target.closest('.offer-card');
            if (!originalCard) return;
            
            // Create a new offer data object from the original card
            const offerData = {
                systime: Date.now() // New timestamp for the clone
            };
            
            // For each field in the current template, save its value
            currentTemplate.fields.forEach(field => {
                const element = originalCard.querySelector('.' + field.id);
                if (element) {
                    // For the name field, add "(copie)" suffix
                    if (field.id === 'offer-name') {
                        offerData[field.id] = element.value ? element.value + ' (copie)' : 'Copie';
                    } else {
                        offerData[field.id] = element.value;
                    }
                }
            });
            
            // Save extra costs
            const extraCosts = [];
            originalCard.querySelectorAll('.extra-cost-row').forEach(row => {
                extraCosts.push({
                    extraCostAmount: row.querySelector('.extra-cost-amount').value,
                    extraCostFrequency: row.querySelector('.extra-cost-frequency').value || 1,
                    extraCostPeriod: row.querySelector('.extra-cost-period').value || 'one',
                    extraCostNote: row.querySelector('.extra-cost-note').value || ''
                });
            });
            offerData.extraCosts = extraCosts;
            
            // Create a new card with the cloned data
            createContractCardFromTemplateData(offerData);
        }
    });

    // --- CSV Export ---
    function offersToCSV(offers) {
        const escape = v => '"' + String(v).replace(/"/g, '""') + '"';
        const now = Date.now();
        
        // Update systime for all offers
        offers = offers.map(offer => {
            return {
                ...offer,
                systime: now
            };
        });
        
        // Update systime in UI
        offersContainer.querySelectorAll('.offer-card').forEach(card => {
            card.dataset.systime = now;
            updateSystimeDisplay(card);
        });
        
        const rows = [];
        // Header with field IDs for more reliable data access
        rows.push([
            'Nom','Coût','Type paiement','SLA','Qualité','Ressenti','Note','Engagement (mois)','Pénalités','Préavis','Coûts supplémentaires','systime',
            'ID_Interne','Coût_Mensuel','Coût_Annuel','Coût_Total'
        ].join(','));
        
        // Data with calculated fields for reporting
        offers.forEach((offer, index) => {
            // Calculate normalized costs for reporting
            const cost = parseFloat(offer.offerCost) || 0;
            const type = offer.offerCostType || 'one';
            const engagement = parseFloat(offer.contractEngagement) || 12;
            
            // Normalize to monthly and yearly costs
            let monthlyCost = 0;
            let yearlyCost = 0;
            let totalCost = 0;
            
            if (type === 'one') {
                monthlyCost = cost / engagement;
                yearlyCost = cost / (engagement / 12);
                totalCost = cost;
            } else if (type === 'monthly') {
                monthlyCost = cost;
                yearlyCost = cost * 12;
                totalCost = cost * engagement;
            } else if (type === 'quarterly') {
                monthlyCost = cost / 3;
                yearlyCost = cost * 4;
                totalCost = cost * (engagement / 3);
            } else if (type === 'yearly') {
                monthlyCost = cost / 12;
                yearlyCost = cost;
                totalCost = cost * (engagement / 12);
            }
            
            // Process extra costs in a structured format
            const extraCosts = (offer.extraCosts || []).map(ec => {
                const amount = parseFloat(ec.extraCostAmount) || 0;
                const freq = parseInt(ec.extraCostFrequency) || 1;
                const period = ec.extraCostPeriod || 'one';
                const note = ec.extraCostNote || '';
                
                // Format: amount€ xfreq period (note)
                return `${amount.toFixed(2)}€ x${freq} ${period} (${note})`;
            }).join(' | ');
            
            // Add extra costs to calculations
            (offer.extraCosts || []).forEach(ec => {
                const amount = parseFloat(ec.extraCostAmount) || 0;
                const freq = parseInt(ec.extraCostFrequency) || 1;
                const period = ec.extraCostPeriod || 'one';
                
                if (period === 'monthly') {
                    monthlyCost += amount * freq;
                    yearlyCost += amount * freq * 12;
                    totalCost += amount * freq * engagement;
                } else if (period === 'quarterly') {
                    monthlyCost += (amount * freq) / 3;
                    yearlyCost += amount * freq * 4;
                    totalCost += amount * freq * (engagement / 3);
                } else if (period === 'yearly') {
                    monthlyCost += (amount * freq) / 12;
                    yearlyCost += amount * freq;
                    totalCost += amount * freq * (engagement / 12);
                } else if (period === 'one') {
                    // One-time cost
                    totalCost += amount * freq;
                }
            });
            
            // Add row with all fields plus calculated metrics
            rows.push([
                escape(offer.offerName),
                offer.offerCost,
                offer.offerCostType,
                offer.offerSla,
                offer.offerQuality,
                offer.offerFeeling,
                escape(offer.contractNote),
                offer.contractEngagement,
                offer.contractPenalty,
                offer.contractCancelDelay,
                escape(extraCosts),
                offer.systime || now,
                `offer_${index}`,
                monthlyCost.toFixed(2),
                yearlyCost.toFixed(2),
                totalCost.toFixed(2)
            ].join(','));
        });
        return rows.join('\r\n');
    }

    document.getElementById('export-csv-btn').addEventListener('click', async () => {
        const offers = getAllOffersData();
        const csv = offersToCSV(offers);
        
        // Obtenir l'icône du premier contrat sélectionné, ou une icône par défaut
        const selectedCards = Array.from(offersContainer.querySelectorAll('.offer-group-checkbox:checked'));
        let iconData = '📊'; // Icône par défaut
        
        if (selectedCards.length > 0) {
            const iconElement = selectedCards[0].closest('.offer-card').querySelector('.offer-icon');
            if (iconElement) {
                if (iconElement.querySelector('img')) {
                    iconData = iconElement.querySelector('img').src;
                } else {
                    iconData = iconElement.textContent.trim();
                }
            }
        }
        
        try {
            // Encoder les données dans une image PNG
            const pngDataURL = await encodeDataInPNG(iconData, csv);
            
            // Télécharger le fichier PNG
            const a = document.createElement('a');
            a.href = pngDataURL;
            a.download = 'offres.png';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
            }, 100);
            
            showNotification('✅ Export PNG réussi avec ' + offers.length + ' offre(s)');
        } catch (e) {
            console.error('Erreur lors de l\'encodage en PNG:', e);
            showNotification('❌ Erreur lors de l\'export en PNG: ' + e.message, 'error');
        }
    });

    // --- Offer Total Summary ---
    function updateOffersTotalSummary() {
        const selectedCards = Array.from(offersContainer.querySelectorAll('.offer-group-checkbox:checked')).map(cb => cb.closest('.offer-card'));
        if (selectedCards.length === 0) {
            document.getElementById('offers-total-summary').innerHTML = '';
            return;
        }
        let totalMonthly = 0, totalQuarterly = 0, totalYearly = 0, totalEngagement = 0;
        selectedCards.forEach(card => {
            const cost = parseFloat(card.querySelector('.offer-cost')?.value) || 0;
            const type = card.querySelector('.offer-cost-type')?.value || 'one';
            const engagement = parseFloat(card.querySelector('.contract-engagement')?.value) || 1;
            // Normalize to monthly/quarterly/yearly
            if (type === 'one') {
                totalMonthly += cost / (engagement > 0 ? engagement : 1);
                totalQuarterly += cost / ((engagement > 0 ? engagement : 1) / 3);
                totalYearly += cost / ((engagement > 0 ? engagement : 1) / 12);
                totalEngagement += cost;
            } else if (type === 'monthly') {
                totalMonthly += cost;
                totalQuarterly += cost * 3;
                totalYearly += cost * 12;
                totalEngagement += cost * (engagement > 0 ? engagement : 1);
            } else if (type === 'quarterly') {
                totalMonthly += cost / 3;
                totalQuarterly += cost;
                totalYearly += cost * 4;
                totalEngagement += cost * ((engagement > 0 ? engagement : 1) / 3);
            } else if (type === 'yearly') {
                totalMonthly += cost / 12;
                totalQuarterly += cost / 4;
                totalYearly += cost;
                totalEngagement += cost * ((engagement > 0 ? engagement : 1) / 12);
            }
            // Extra costs
            card.querySelectorAll('.extra-cost-row').forEach(row => {
                const ecAmount = parseFloat(row.querySelector('.extra-cost-amount')?.value) || 0;
                const ecFreq = parseFloat(row.querySelector('.extra-cost-frequency')?.value) || 1;
                const ecPeriod = row.querySelector('.extra-cost-period')?.value || 'one';
                let months = 1;
                if (ecPeriod === 'monthly') months = 1;
                else if (ecPeriod === 'quarterly') months = 3;
                else if (ecPeriod === 'yearly') months = 12;
                else months = engagement > 0 ? engagement : 1;
                const totalForEngagement = ecAmount * ecFreq * (engagement > 0 ? engagement : 1) / months;
                totalMonthly += ecPeriod === 'monthly' ? ecAmount * ecFreq : ecPeriod === 'quarterly' ? (ecAmount * ecFreq) / 3 : ecPeriod === 'yearly' ? (ecAmount * ecFreq) / 12 : totalForEngagement / (engagement > 0 ? engagement : 1);
                totalQuarterly += ecPeriod === 'monthly' ? ecAmount * ecFreq * 3 : ecPeriod === 'quarterly' ? ecAmount * ecFreq : ecPeriod === 'yearly' ? (ecAmount * ecFreq) / 4 : totalForEngagement / ((engagement > 0 ? engagement : 1) / 3);
                totalYearly += ecPeriod === 'monthly' ? ecAmount * ecFreq * 12 : ecPeriod === 'quarterly' ? ecAmount * ecFreq * 4 : ecPeriod === 'yearly' ? ecAmount * ecFreq : totalForEngagement / ((engagement > 0 ? engagement : 1) / 12);
                totalEngagement += totalForEngagement;
            });
        });
        document.getElementById('offers-total-summary').innerHTML =
            `<div><b>Total sélectionné :</b></div>`+
            `<div>Mensuel : <b>${totalMonthly.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} €</b></div>`+
            `<div>Trimestriel : <b>${totalQuarterly.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} €</b></div>`+
            `<div>Sur engagement : <b>${totalEngagement.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} €</b></div>`;
    }

    offersContainer.addEventListener('input', updateOffersTotalSummary);
    offersContainer.addEventListener('change', updateOffersTotalSummary);
    updateOffersTotalSummary();

    // --- Programmatic Contract Creation ---
    /**
     * Adds a new contract offer and fills in all fields as if entered manually.
     * @param {Object} values - The values to fill in.
     * @param {string} values.offerName - Name of the offer
     * @param {number|string} values.offerCost - Cost amount
     * @param {string} values.offerCostType - 'one' | 'monthly' | 'quarterly' | 'yearly' 
     * @param {number|string} values.offerSla - Service Level Agreement hours
     * @param {number|string} values.offerQuality - Quality score (0-100)
     * @param {number|string} values.offerFeeling - Feeling score (0-100)
     * @param {string} values.contractNote - Notes about the contract
     * @param {number|string} values.contractEngagement - Engagement duration in months
     * @param {number|string} values.contractPenalty - Penalty amount for early termination
     * @param {number|string} values.contractCancelDelay - Notice period in days
     * @param {number|string} values.systime - Timestamp of creation/update (optional)
     * @param {Array<Object>} [values.extraCosts] - Array of extra cost objects
     *   { extraCostAmount, extraCostFrequency, extraCostPeriod, extraCostNote }
     */
    function createContractCard(values) {
        // Click the add offer button to create a new card
        const addOfferBtn = document.getElementById('add-offer-btn');
        addOfferBtn.click();
        
        // Get the last offer card (the one just added)
        const offerCards = offersContainer.querySelectorAll('.offer-card');
        const card = offerCards[offerCards.length - 1];
        if (!card) return;
        
        // Systime - use provided value or current timestamp
        const systime = values.systime || Date.now();
        card.dataset.systime = systime;
        updateSystimeDisplay(card);
        
        // Fill in the fields
        card.querySelector('.offer-name').value = values.offerName || '';
        card.querySelector('.offer-cost').value = values.offerCost || '';
        card.querySelector('.offer-cost-type').value = values.offerCostType || 'one';
        card.querySelector('.offer-sla').value = values.offerSla || '';
        card.querySelector('.offer-quality').value = values.offerQuality || '';
        card.querySelector('.offer-feeling').value = values.offerFeeling || '';
        card.querySelector('.contract-note').value = values.contractNote || '';
        card.querySelector('.contract-engagement').value = values.contractEngagement || '';
        card.querySelector('.contract-penalty').value = values.contractPenalty || '';
        card.querySelector('.contract-cancel-delay').value = values.contractCancelDelay || '';
        
        // Extra costs
        if (Array.isArray(values.extraCosts)) {
            const addExtraBtn = card.querySelector('.add-extra-cost-btn');
            const extraCostsList = card.querySelector('.extra-costs-list');
            
            values.extraCosts.forEach(ec => {
                addExtraBtn.click();
                // Get the last extra cost row
                const rows = extraCostsList.querySelectorAll('.extra-cost-row');
                const row = rows[rows.length - 1];
                if (!row) return;
                
                row.querySelector('.extra-cost-amount').value = ec.extraCostAmount || '';
                row.querySelector('.extra-cost-frequency').value = ec.extraCostFrequency || 1;
                row.querySelector('.extra-cost-period').value = ec.extraCostPeriod || 'one';
                row.querySelector('.extra-cost-note').value = ec.extraCostNote || '';
            });
        }
        
        // Trigger input events for live updates
        card.dispatchEvent(new Event('input', { bubbles: true }));
        card.dispatchEvent(new Event('change', { bubbles: true }));
        
        return card;
    }

    // Public API function for adding contracts programmatically
    function addContractWithValues(data) {
        return createContractCard(data);
    }

    // Example usage:
    // addContractWithValues({
    //     offerName: 'Contrat Test',
    //     offerCost: 1200,
    //     offerCostType: 'monthly',
    //     offerSla: 24,
    //     offerQuality: 90,
    //     offerFeeling: 80,
    //     contractNote: 'Exemple de contrat généré',
    //     contractEngagement: 12,
    //     contractPenalty: 300,
    //     contractCancelDelay: 30,
    //     extraCosts: [
    //         { extraCostAmount: 100, extraCostFrequency: 1, extraCostPeriod: 'monthly', extraCostNote: 'Maintenance' },
    //         { extraCostAmount: 500, extraCostFrequency: 1, extraCostPeriod: 'one', extraCostNote: 'Livraison' }
    //     ]
    // });

    // --- CSV Import ---
    const importCsvBtn = document.getElementById('import-csv-btn');
    const importCsvInput = document.getElementById('import-csv-input');

    importCsvBtn.addEventListener('click', () => {
        importCsvInput.value = '';
        importCsvInput.click();
    });

    importCsvInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        
        // Lire le fichier comme une URL de données (pour les PNG)
        reader.onload = async function(event) {
            try {
                // Essayer de décoder les données CSV depuis le PNG
                const dataURL = event.target.result;
                const csvText = await decodeDataFromPNG(dataURL);
                
                // Extraire l'icône si possible
                const iconData = extractIconFromPNG(dataURL);
                
                // Importer les contrats
                importContractsFromCSV(csvText, iconData);
                
                showNotification('✅ Import PNG réussi - Données extraites et chargées');
            } catch (e) {
                console.error('Erreur lors du décodage du PNG:', e);
                showNotification('❌ Erreur lors de la lecture du fichier. Est-ce un fichier PNG ContractPicker valide?', 'error');
            }
        };
        
        reader.readAsDataURL(file);
    });

    function importContractsFromCSV(csvText, iconData = null) {
        // Clear existing offers
        const offersContainer = document.getElementById('offers-container');
        offersContainer.querySelectorAll('.offer-card').forEach(card => card.remove());
        
        // Parse CSV
        const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) return alert('Données vides ou incorrectes.');
        
        // Parse header and create column index map
        const header = parseCsvLine(lines[0]);
        const colIdx = {};
        header.forEach((col, idx) => {
            colIdx[col] = idx;
        });
        
        // Required base columns (we'll accept additional columns for backward/forward compatibility)
        const requiredColumns = [
            'Nom', 'Coût', 'Type paiement'
        ];
        
        // Check if the required base columns are present
        const missingColumns = requiredColumns.filter(col => !header.includes(col));
        if (missingColumns.length > 0) {
            alert('Structure du CSV incorrecte. Colonnes manquantes: ' + missingColumns.join(', '));
            return;
        }
        
        // Map CSV columns to template fields
        const fieldMap = {
            'Nom': 'offer-name',
            'Coût': 'offer-cost',
            'Type paiement': 'offer-cost-type',
            'SLA': 'offer-sla',
            'Qualité': 'offer-quality',
            'Ressenti': 'offer-feeling',
            'Note': 'contract-note',
            'Engagement (mois)': 'contract-engagement',
            'Pénalités': 'contract-penalty',
            'Préavis': 'contract-cancel-delay'
        };
        
        // Process each row
        for (let i = 1; i < lines.length; ++i) {
            const row = parseCsvLine(lines[i]);
            if (row.length < 3) continue; // Skip rows with insufficient data
            
            // Create data object mapped to template fields
            const offerData = {};
            
            // Map standard fields using the field map
            for (const [csvField, templateField] of Object.entries(fieldMap)) {
                if (colIdx[csvField] !== undefined) {
                    offerData[templateField] = row[colIdx[csvField]];
                }
            }
            
            // Handle any custom fields directly (if present in CSV but not in fieldMap)
            currentTemplate.fields.forEach(field => {
                if (!Object.values(fieldMap).includes(field.id) && colIdx[field.label] !== undefined) {
                    offerData[field.id] = row[colIdx[field.label]];
                }
            });
            
            // Parse extra costs
            let extraCosts = [];
            const extraCostsIdx = colIdx['Coûts supplémentaires'];
            if (extraCostsIdx !== undefined && row[extraCostsIdx]) {
                // Format: "100€ x1 monthly (Maintenance) | 500€ x1 one (Livraison)"
                extraCosts = row[extraCostsIdx].split('|').map(s => {
                    // More robust regex that handles variations in format
                    const m = s.match(/([\d.,]+)€?\s*x(\d+)\s+(one|monthly|quarterly|yearly)\s*(?:\(([^)]*)\))?/);
                    if (!m) return null;
                    return {
                        extraCostAmount: m[1].replace(',', '.'),
                        extraCostFrequency: m[2],
                        extraCostPeriod: m[3],
                        extraCostNote: m[4] || ''
                    };
                }).filter(Boolean);
            }
            offerData.extraCosts = extraCosts;
            
            // Get systime from CSV if available, otherwise use current time
            const systime = colIdx['systime'] !== undefined ? row[colIdx['systime']] : Date.now();
            offerData.systime = systime;
            
            // Create contract with the template data
            createContractCardFromTemplateData(offerData);
        }
        
        // Update total summary
        updateOffersTotalSummary();
        
        // Display confirmation
        const count = lines.length - 1;
        document.getElementById('realtime-csv-output').textContent = 
            `✅ ${count} offre(s) importée(s) avec succès. Les données ont été normalisées pour le reporting.`;
        setTimeout(() => {
            document.getElementById('realtime-csv-output').textContent = '';
        }, 5000);
    }

    /**
     * Improved CSV line parser that handles quoted fields and escaping properly
     * @param {string} line - CSV line to parse
     * @returns {Array<string>} Array of field values
     */
    function parseCsvLine(line) {
        // CSV parser with support for quotes and escaped quotes
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; ++i) {
            const char = line[i];
            
            if (char === '"') {
                // Handle escaped quotes within quoted strings
                if (inQuotes && line[i+1] === '"') {
                    current += '"';
                    i++; // Skip the next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } 
            else if (char === ',' && !inQuotes) {
                // End of field, add to result
                result.push(current);
                current = '';
            } 
            else {
                // Normal character, add to current field
                current += char;
            }
        }
        
        // Add the last field
        result.push(current);
        return result;
    }

    // --- Template Management ---
    function openTemplateManager() {
        // Populate template list
        const templateList = document.getElementById('template-list');
        templateList.innerHTML = '';
        Object.keys(savedTemplates).forEach(key => {
            const template = savedTemplates[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = template.name;
            templateList.appendChild(option);
        });
        
        // Show modal
        templateModal.style.display = 'block';
    }

    function closeTemplateManager() {
        templateModal.style.display = 'none';
    }

    function saveTemplate() {
        const templateName = document.getElementById('new-template-name').value.trim();
        if (!templateName) return alert('Nom de template invalide.');
        
        // Check for existing name
        if (Object.values(savedTemplates).find(t => t.name === templateName)) {
            return alert('Un template avec ce nom existe déjà.');
        }
        
        // Save current template
        savedTemplates[templateName] = currentTemplate;
        localStorage.setItem('contractPickerTemplates', JSON.stringify(savedTemplates));
        
        // Update template list
        const templateList = document.getElementById('template-list');
        const option = document.createElement('option');
        option.value = templateName;
        option.textContent = templateName;
        templateList.appendChild(option);
        
        alert('Template enregistré avec succès.');
    }

    function loadTemplate() {
        const templateName = document.getElementById('template-list').value;
        if (!templateName) return;
        
        // Load selected template
        currentTemplate = JSON.parse(JSON.stringify(savedTemplates[templateName]));
        
        // Update UI fields
        updateTemplateFieldsUI();
    }

    function updateTemplateFieldsUI() {
        const fieldsContainer = document.getElementById('template-fields');
        fieldsContainer.innerHTML = '';
        currentTemplate.fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'template-field';
            fieldDiv.innerHTML = `
                <label>${field.label}:</label>
                ${field.type === 'text' ? `<input type="text" id="${field.id}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>` : ''}
                ${field.type === 'number' ? `<input type="number" id="${field.id}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>` : ''}
                ${field.type === 'select' ? `

                    <select id="${field.id}">
                        ${field.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                ` : ''}
                ${field.type === 'textarea' ? `<textarea id="${field.id}" placeholder="${field.placeholder}" rows="2"></textarea>` : ''}
            `;
            fieldsContainer.appendChild(fieldDiv);
        });
    }

    // Open template manager on button click
    templateManagerBtn.addEventListener('click', openTemplateManager);
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === templateModal) {
            closeTemplateManager();
        }
    });
    
    // Save template button
    document.getElementById('save-template-btn').addEventListener('click', saveTemplate);
    
    // Load template on selection change
    document.getElementById('template-list').addEventListener('change', loadTemplate);
    
    // --- Add Offer (with systime and template) ---
    addOfferBtn.addEventListener('click', () => {
        const offerCard = document.createElement('div');
        offerCard.className = 'offer-card';
        offerCard.dataset.id = nextOfferId++;
        // Set systime
        const systime = Date.now();
        offerCard.dataset.systime = systime;
        
        // Generate HTML based on current template
        let headerHTML = '<div class="offer-header">' +
            '<input type="checkbox" class="offer-group-checkbox" title="Sélectionner pour regrouper">' +
            '<div class="offer-icon" title="Icône du contrat"><span>📄</span></div>' +
            '<input type="text" placeholder="Nom de l\'offre (ex: Contrat A)" class="offer-name">' +
            '<button class="select-offer-icon-btn icon-btn" title="Changer l\'icône" aria-label="Changer l\'icône">🖼️</button>' +
            '<button class="delete-offer-btn" title="Supprimer l\'offre" aria-label="Supprimer l\'offre">🗑️</button>' +
            '<button class="clone-offer-btn" title="Cloner l\'offre" aria-label="Cloner l\'offre" style="margin-left:2px;">📄</button>' +
            '<span class="offer-systime" style="margin-left:auto;font-size:13px;color:#888;"></span>' +
            '</div>';
        
        // Generate dynamic fields based on template
        let fieldsHTML = '<div class="offer-inputs">';
        
        currentTemplate.fields.forEach(field => {
            // Skip the offer name as it's in the header
            if (field.id === 'offer-name') return;
            
            switch(field.type) {
                case 'select':
                    fieldsHTML += '<select class="' + field.id + '">';
                    if (field.options && Array.isArray(field.options)) {
                        field.options.forEach(opt => {
                            fieldsHTML += '<option value="' + opt.value + '">' + opt.label + '</option>';
                        });
                    }
                    fieldsHTML += '</select>';
                    break;
                    
                case 'textarea':
                    fieldsHTML += '<textarea class="' + field.id + '" placeholder="' + (field.placeholder || '') + '" rows="2"></textarea>';
                    break;
                    
                default: // text, number, etc.
                    fieldsHTML += '<input type="' + field.type + '" class="' + field.id + '" placeholder="' + (field.placeholder || '') + '">';
            }
        });
        
        fieldsHTML += '</div>';
        
        const extraCostsHTML = '<div class="extra-costs-list"></div>' +
            '<button class="add-extra-cost-btn" type="button">+ Ajouter un coût supplémentaire</button>';
        
        offerCard.innerHTML = headerHTML + fieldsHTML + extraCostsHTML;
        offersContainer.appendChild(offerCard);
        updateSystimeDisplay(offerCard);
    });
    
    // --- PNG Steganography Functions ---

    // Fonction pour convertir du texte en données binaires
    function textToBinary(text) {
        const codePoints = [];
        for (let i = 0; i < text.length; i++) {
            codePoints.push(text.charCodeAt(i));
        }
        return new Uint8Array(codePoints);
    }

    // Fonction pour convertir des données binaires en texte
    function binaryToText(binary) {
        return String.fromCharCode.apply(null, binary);
    }

    // Fonction pour encoder des données dans une image PNG
    function encodeDataInPNG(imageData, data) {
        return new Promise((resolve, reject) => {
            // Créer un canvas pour générer l'image PNG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Définir la taille du canvas pour contenir l'icône et les données
            canvas.width = 300;
            canvas.height = 300;
            
            // Remplir avec un fond blanc
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Si nous avons une image personnalisée
            if (imageData && imageData.startsWith('data:')) {
                const img = new Image();
                img.onload = function() {
                    // Dessiner l'image au centre du canvas
                    const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
                    const x = (canvas.width - img.width * scale) / 2;
                    const y = (canvas.height - img.height * scale) / 2;
                    
                    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                    
                    // Ajouter les données encodées
                    finishEncoding();
                };
                img.onerror = function() {
                    // En cas d'erreur, continuer sans image
                    finishEncoding();
                };
                img.src = imageData;
            } else if (imageData) {
                // Si nous avons juste un emoji
                ctx.font = '120px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(imageData, canvas.width / 2, canvas.height / 2);
                finishEncoding();
            } else {
                // Pas d'icône, continuer sans image
                finishEncoding();
            }
            
            function finishEncoding() {
                try {
                    // Encoder les données
                    // Format: PNG_HEADER + longueur de données + données
                    const headerBin = textToBinary(PNG_HEADER);
                    const dataBin = textToBinary(data);
                    const lengthBin = textToBinary(String.fromCharCode(dataBin.length & 0xFF, (dataBin.length >> 8) & 0xFF, (dataBin.length >> 16) & 0xFF, (dataBin.length >> 24) & 0xFF));
                    
                    // Obtenir les données du canvas
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const pixels = imageData.data;
                    
                    // Insérer l'en-tête
                    for (let i = 0; i < headerBin.length; i++) {
                        // Modifier le canal alpha (A) des pixels pour stocker nos données
                        // Position 3 est le canal alpha, puis tous les 4 indices (r,g,b,a)
                        pixels[i * 4 + 3] = headerBin[i];
                    }
                    
                    // Insérer la longueur des données (4 octets)
                    for (let i = 0; i < 4; i++) {
                        pixels[(i + headerBin.length) * 4 + 3] = lengthBin[i];
                    }
                    
                    // Insérer les données
                    const startPos = headerBin.length + 4;
                    for (let i = 0; i < dataBin.length; i++) {
                        if (startPos + i < pixels.length / 4) {
                            pixels[(startPos + i) * 4 + 3] = dataBin[i];
                        }
                    }
                    
                    // Mettre à jour le canvas
                    ctx.putImageData(imageData, 0, 0);
                    
                    // Convertir le canvas en URL de données PNG
                    const dataURL = canvas.toDataURL('image/png');
                    resolve(dataURL);
                } catch (e) {
                    reject(e);
                }
            }
        });
    }

    // Fonction pour décoder des données d'une image PNG
    function decodeDataFromPNG(dataURL) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function() {
                // Créer un canvas pour analyser l'image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Dessiner l'image sur le canvas
                ctx.drawImage(img, 0, 0);
                
                // Obtenir les données de l'image
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;
                
                try {
                    // Extraire l'en-tête
                    const headerLength = PNG_HEADER.length;
                    let headerStr = '';
                    for (let i = 0; i < headerLength; i++) {
                        headerStr += String.fromCharCode(pixels[i * 4 + 3]);
                    }
                    
                    // Vérifier l'en-tête
                    if (headerStr !== PNG_HEADER) {
                        throw new Error('Format de fichier invalide: ce n\'est pas un fichier ContractPicker');
                    }
                    
                    // Extraire la longueur des données
                    const lengthBytes = new Uint8Array(4);
                    for (let i = 0; i < 4; i++) {
                        lengthBytes[i] = pixels[(i + headerLength) * 4 + 3];
                    }
                    
                    const dataLength = lengthBytes[0] | (lengthBytes[1] << 8) | (lengthBytes[2] << 16) | (lengthBytes[3] << 24);
                    
                    // Extraire les données
                    const startPos = headerLength + 4;
                    const dataBin = new Uint8Array(dataLength);
                    for (let i = 0; i < dataLength; i++) {
                        if (startPos + i < pixels.length / 4) {
                            dataBin[i] = pixels[(startPos + i) * 4 + 3];
                        }
                    }
                    
                    // Convertir en texte
                    const dataStr = binaryToText(dataBin);
                    resolve(dataStr);
                } catch (e) {
                    reject(e);
                }
            };
            
            img.onerror = function() {
                reject(new Error('Erreur de chargement de l\'image'));
            };
            
            img.src = dataURL;
        });
    }

    // Extraire l'icône d'une image PNG encodée
    function extractIconFromPNG(dataURL) {
        return dataURL; // Directement l'URL de l'image
    }
    
    // --- Helper: Show notification ---
    function showNotification(message, type = 'success') {
        const notificationElement = document.getElementById('realtime-csv-output');
        if (!notificationElement) return;
        
        notificationElement.textContent = message;
        notificationElement.style.backgroundColor = type === 'success' ? '#e8f5e9' : '#ffebee';
        notificationElement.style.color = type === 'success' ? '#2e7d32' : '#c62828';
        
        setTimeout(() => {
            notificationElement.textContent = '';
            notificationElement.style.backgroundColor = '';
            notificationElement.style.color = '';
        }, 5000);
    }
    
    // Fonction d'export du template en PNG
    async function exportTemplateToPNG() {
        try {
            // Obtenir l'icône du template actuel
            const iconDisplay = document.getElementById('template-icon-display');
            let iconData = '📋'; // Icône par défaut
            
            if (iconDisplay) {
                if (iconDisplay.querySelector('img')) {
                    iconData = iconDisplay.querySelector('img').src;
                } else if (iconDisplay.textContent) {
                    iconData = iconDisplay.textContent;
                }
            }
            
            // Convertir le template en JSON
            const templateData = JSON.stringify({
                name: currentTemplate.name,
                fields: currentTemplate.fields,
                icon: iconData
            });
            
            // Encoder le template dans une image PNG
            const pngDataURL = await encodeDataInPNG(iconData, templateData);
            
            // Télécharger le fichier PNG
            const a = document.createElement('a');
            a.href = pngDataURL;
            a.download = (currentTemplate.name || 'template').replace(/\s+/g, '_') + '.png';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
            }, 100);
            
            showNotification('✅ Template exporté avec succès en PNG');
        } catch (e) {
            console.error('Erreur lors de l\'export du template en PNG:', e);
            showNotification('❌ Erreur lors de l\'export du template: ' + e.message, 'error');
        }
    }
    
    // Fonction d'import du template depuis PNG
    async function importTemplateFromPNG(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const reader = new FileReader();
            
            reader.onload = async function(event) {
                try {
                    // Décoder les données du template depuis le PNG
                    const dataURL = event.target.result;
                    const templateJSON = await decodeDataFromPNG(dataURL);
                    
                    // Parser le JSON
                    const templateData = JSON.parse(templateJSON);
                    
                    // Vérifier que le format est valide
                    if (!templateData.name || !Array.isArray(templateData.fields)) {
                        throw new Error('Format de template invalide');
                    }
                    
                    // Mettre à jour le template actuel
                    currentTemplate = {
                        name: templateData.name,
                        fields: templateData.fields
                    };
                    
                    // Mettre à jour l'icône si elle existe
                    if (templateData.icon) {
                        const iconDisplay = document.getElementById('template-icon-display');
                        if (iconDisplay) {
                            if (templateData.icon.startsWith('data:')) {
                                iconDisplay.innerHTML = `<img src="${templateData.icon}" alt="Icon">`;
                            } else {
                                iconDisplay.innerHTML = `<span>${templateData.icon}</span>`;
                            }
                            iconDisplay.dataset.icon = templateData.icon;
                        }
                    }
                    
                    // Mettre à jour l'interface
                    loadTemplateFields();
                    
                    showNotification('✅ Template importé avec succès depuis PNG');
                } catch (e) {
                    console.error('Erreur lors du décodage du template:', e);
                    showNotification('❌ Erreur lors de l\'import du template: ' + e.message, 'error');
                }
            };
            
            reader.readAsDataURL(file);
        } catch (e) {
            console.error('Erreur lors de la lecture du fichier:', e);
            showNotification('❌ Erreur lors de la lecture du fichier', 'error');
        }
    }
});