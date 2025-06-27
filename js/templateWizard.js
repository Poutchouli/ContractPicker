/**
 * Template Wizard - Handles template creation
 */
class TemplateWizard {
    constructor() {
        this.currentStep = 1;
        this.maxSteps = 3;
        this.template = {
            id: '',
            name: '',
            description: '',
            fields: []
        };
    }

    // Start the wizard
    start() {
        this.currentStep = 1;
        this.template = {
            id: this.generateId(),
            name: '',
            description: '',
            fields: []
        };
        this.showStep(1);
        this.updateFieldsList();
    }

    // Generate unique ID
    generateId() {
        return 'template_' + Date.now();
    }

    // Show specific step
    showStep(step) {
        document.querySelectorAll('.wizard-step').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelector(`[data-step="${step}"]`).classList.add('active');
        this.currentStep = step;

        if (step === 3) {
            this.showPreview();
        }
    }

    // Go to next step
    nextStep() {
        if (this.currentStep === 1) {
            if (!this.validateStep1()) return;
            this.saveStep1();
        }
        
        if (this.currentStep < this.maxSteps) {
            this.showStep(this.currentStep + 1);
        }
    }

    // Go to previous step
    prevStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }

    // Validate step 1
    validateStep1() {
        const name = document.getElementById('templateName').value.trim();
        if (!name) {
            alert('Veuillez entrer un nom pour le template');
            return false;
        }
        return true;
    }

    // Save step 1 data
    saveStep1() {
        this.template.name = document.getElementById('templateName').value.trim();
        this.template.description = document.getElementById('templateDescription').value.trim();
    }

    // Add field to template
    addField() {
        const label = document.getElementById('fieldLabel').value.trim();
        const type = document.getElementById('fieldType').value;

        if (!label) {
            alert('Veuillez entrer un nom pour le champ');
            return;
        }

        const field = {
            id: 'field_' + Date.now(),
            label: label,
            type: type,
            required: false,
            options: []
        };

        // Handle select fields
        if (type === 'select') {
            const options = prompt('Entrez les options séparées par des virgules:');
            if (options) {
                field.options = options.split(',').map(opt => opt.trim()).filter(opt => opt);
            }
        }

        this.template.fields.push(field);
        this.updateFieldsList();

        // Clear form
        document.getElementById('fieldLabel').value = '';
        document.getElementById('fieldType').value = 'text';
    }

    // Remove field from template
    removeField(index) {
        this.template.fields.splice(index, 1);
        this.updateFieldsList();
    }

    // Update fields list display
    updateFieldsList() {
        const container = document.getElementById('fieldsList');
        container.innerHTML = '';

        this.template.fields.forEach((field, index) => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'field-item';
            fieldDiv.innerHTML = `
                <span class="field-label">${field.label}</span>
                <span class="field-type">${this.getTypeLabel(field.type)}</span>
                <button class="remove-btn" onclick="templateWizard.removeField(${index})">×</button>
            `;
            container.appendChild(fieldDiv);
        });
    }

    // Get human-readable type label
    getTypeLabel(type) {
        const labels = {
            'text': 'Texte',
            'number': 'Nombre',
            'select': 'Liste',
            'textarea': 'Zone de texte'
        };
        return labels[type] || type;
    }

    // Show template preview
    showPreview() {
        const container = document.getElementById('templatePreview');
        let html = `
            <h4>Nom: ${this.template.name}</h4>
            <p>Description: ${this.template.description || 'Aucune'}</p>
            <h5>Champs (${this.template.fields.length}):</h5>
            <ul>
        `;

        this.template.fields.forEach(field => {
            html += `<li>${field.label} (${this.getTypeLabel(field.type)})`;
            if (field.options && field.options.length) {
                html += ` - Options: ${field.options.join(', ')}`;
            }
            html += `</li>`;
        });

        html += '</ul>';
        container.innerHTML = html;
    }

    // Create template and switch to contract screen
    createTemplate() {
        if (this.template.fields.length === 0) {
            alert('Veuillez ajouter au moins un champ au template');
            return;
        }

        // Save template
        const data = {
            template: this.template,
            contracts: [],
            extraCosts: [],
            globalDiscount: 0
        };

        window.storage.save(data);
        window.app.setCurrentData(data);
        window.app.showScreen('contract');
    }
}

// Global functions for onclick handlers
function nextStep() {
    window.templateWizard.nextStep();
}

function prevStep() {
    window.templateWizard.prevStep();
}

function addField() {
    window.templateWizard.addField();
}

function createTemplate() {
    window.templateWizard.createTemplate();
}

// Create global instance
window.templateWizard = new TemplateWizard();
