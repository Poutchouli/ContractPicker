/**
 * Premade Templates for ContractPicker
 * This module provides a collection of predefined templates for common scenarios
 */

// Premade template definitions
const premadeTemplates = {
    printer: {
        id: 'printer-leasing',
        name: {
            fr: "Location d'imprimante",
            en: "Printer Leasing"
        },
        description: {
            fr: "Template pour la location d'équipements d'impression",
            en: "Template for printer equipment leasing"
        },
        category: 'equipment',
        icon: '🖨️',
        fields: [
            {
                label: { fr: "Modèle d'imprimante", en: "Printer Model" },
                type: "text",
                placeholder: { fr: "Ex: HP LaserJet Pro 4000", en: "Ex: HP LaserJet Pro 4000" },
                required: true
            },
            {
                label: { fr: "Pages par mois incluses", en: "Pages per month included" },
                type: "number",
                placeholder: { fr: "Ex: 2000", en: "Ex: 2000" },
                suffix: { fr: "pages", en: "pages" }
            },
            {
                label: { fr: "Coût par page supplémentaire", en: "Cost per additional page" },
                type: "number",
                placeholder: { fr: "0.05", en: "0.05" },
                prefix: "€",
                step: "0.01"
            },
            {
                label: { fr: "Maintenance incluse", en: "Maintenance included" },
                type: "select",
                options: [
                    { value: "yes", label: { fr: "Oui", en: "Yes" } },
                    { value: "no", label: { fr: "Non", en: "No" } },
                    { value: "partial", label: { fr: "Partielle", en: "Partial" } }
                ]
            },
            {
                label: { fr: "Durée du contrat", en: "Contract duration" },
                type: "select",
                options: [
                    { value: "12", label: { fr: "12 mois", en: "12 months" } },
                    { value: "24", label: { fr: "24 mois", en: "24 months" } },
                    { value: "36", label: { fr: "36 mois", en: "36 months" } },
                    { value: "48", label: { fr: "48 mois", en: "48 months" } }
                ]
            },
            {
                label: { fr: "Prix mensuel", en: "Monthly price" },
                type: "number",
                placeholder: { fr: "Ex: 89.99", en: "Ex: 89.99" },
                prefix: "€",
                required: true,
                step: "0.01"
            }
        ]
    },
    
    vehicle: {
        id: 'vehicle-leasing',
        name: {
            fr: "Location de véhicule",
            en: "Vehicle Leasing"
        },
        description: {
            fr: "Template pour la location longue durée de véhicules",
            en: "Template for long-term vehicle leasing"
        },
        category: 'vehicle',
        icon: '🚗',
        fields: [
            {
                label: { fr: "Marque et modèle", en: "Make and model" },
                type: "text",
                placeholder: { fr: "Ex: Renault Clio", en: "Ex: Renault Clio" },
                required: true
            },
            {
                label: { fr: "Année", en: "Year" },
                type: "number",
                placeholder: { fr: "Ex: 2024", en: "Ex: 2024" },
                min: "2020",
                max: "2030"
            },
            {
                label: { fr: "Kilométrage inclus (par an)", en: "Mileage included (per year)" },
                type: "number",
                placeholder: { fr: "Ex: 15000", en: "Ex: 15000" },
                suffix: "km"
            },
            {
                label: { fr: "Carburant", en: "Fuel type" },
                type: "select",
                options: [
                    { value: "gasoline", label: { fr: "Essence", en: "Gasoline" } },
                    { value: "diesel", label: { fr: "Diesel", en: "Diesel" } },
                    { value: "hybrid", label: { fr: "Hybride", en: "Hybrid" } },
                    { value: "electric", label: { fr: "Électrique", en: "Electric" } }
                ]
            },
            {
                label: { fr: "Assurance incluse", en: "Insurance included" },
                type: "select",
                options: [
                    { value: "full", label: { fr: "Complète", en: "Full coverage" } },
                    { value: "partial", label: { fr: "Partielle", en: "Partial" } },
                    { value: "none", label: { fr: "Non incluse", en: "Not included" } }
                ]
            },
            {
                label: { fr: "Prix mensuel", en: "Monthly price" },
                type: "number",
                placeholder: { fr: "Ex: 299.99", en: "Ex: 299.99" },
                prefix: "€",
                required: true,
                step: "0.01"
            }
        ]
    },
    
    software: {
        id: 'software-subscription',
        name: {
            fr: "Abonnement logiciel",
            en: "Software Subscription"
        },
        description: {
            fr: "Template pour les abonnements logiciels SaaS",
            en: "Template for SaaS software subscriptions"
        },
        category: 'software',
        icon: '💻',
        fields: [
            {
                label: { fr: "Nom du logiciel", en: "Software name" },
                type: "text",
                placeholder: { fr: "Ex: Microsoft Office 365", en: "Ex: Microsoft Office 365" },
                required: true
            },
            {
                label: { fr: "Nombre d'utilisateurs", en: "Number of users" },
                type: "number",
                placeholder: { fr: "Ex: 10", en: "Ex: 10" },
                min: "1"
            },
            {
                label: { fr: "Type de licence", en: "License type" },
                type: "select",
                options: [
                    { value: "user", label: { fr: "Par utilisateur", en: "Per user" } },
                    { value: "device", label: { fr: "Par appareil", en: "Per device" } },
                    { value: "site", label: { fr: "Site", en: "Site license" } },
                    { value: "enterprise", label: { fr: "Entreprise", en: "Enterprise" } }
                ]
            },
            {
                label: { fr: "Support inclus", en: "Support included" },
                type: "select",
                options: [
                    { value: "basic", label: { fr: "Basique", en: "Basic" } },
                    { value: "premium", label: { fr: "Premium", en: "Premium" } },
                    { value: "enterprise", label: { fr: "Entreprise", en: "Enterprise" } }
                ]
            },
            {
                label: { fr: "Fréquence de facturation", en: "Billing frequency" },
                type: "select",
                options: [
                    { value: "monthly", label: { fr: "Mensuelle", en: "Monthly" } },
                    { value: "quarterly", label: { fr: "Trimestrielle", en: "Quarterly" } },
                    { value: "annual", label: { fr: "Annuelle", en: "Annual" } }
                ]
            },
            {
                label: { fr: "Prix par utilisateur/mois", en: "Price per user/month" },
                type: "number",
                placeholder: { fr: "Ex: 12.99", en: "Ex: 12.99" },
                prefix: "€",
                required: true,
                step: "0.01"
            }
        ]
    },
    
    equipment: {
        id: 'equipment-rental',
        name: {
            fr: "Location d'équipement",
            en: "Equipment Rental"
        },
        description: {
            fr: "Template générique pour la location d'équipements",
            en: "Generic template for equipment rental"
        },
        category: 'equipment',
        icon: '⚙️',
        fields: [
            {
                label: { fr: "Type d'équipement", en: "Equipment type" },
                type: "text",
                placeholder: { fr: "Ex: Climatiseur industriel", en: "Ex: Industrial air conditioner" },
                required: true
            },
            {
                label: { fr: "Marque", en: "Brand" },
                type: "text",
                placeholder: { fr: "Ex: Daikin", en: "Ex: Daikin" }
            },
            {
                label: { fr: "Puissance/Capacité", en: "Power/Capacity" },
                type: "text",
                placeholder: { fr: "Ex: 5kW", en: "Ex: 5kW" }
            },
            {
                label: { fr: "Installation incluse", en: "Installation included" },
                type: "select",
                options: [
                    { value: "yes", label: { fr: "Oui", en: "Yes" } },
                    { value: "no", label: { fr: "Non", en: "No" } },
                    { value: "optional", label: { fr: "En option", en: "Optional" } }
                ]
            },
            {
                label: { fr: "Maintenance", en: "Maintenance" },
                type: "select",
                options: [
                    { value: "included", label: { fr: "Incluse", en: "Included" } },
                    { value: "optional", label: { fr: "En option", en: "Optional" } },
                    { value: "customer", label: { fr: "À la charge du client", en: "Customer responsibility" } }
                ]
            },
            {
                label: { fr: "Prix mensuel", en: "Monthly price" },
                type: "number",
                placeholder: { fr: "Ex: 150.00", en: "Ex: 150.00" },
                prefix: "€",
                required: true,
                step: "0.01"
            }
        ]
    },
    
    service: {
        id: 'service-contract',
        name: {
            fr: "Contrat de service",
            en: "Service Contract"
        },
        description: {
            fr: "Template pour les contrats de prestation de services",
            en: "Template for service provision contracts"
        },
        category: 'service',
        icon: '🔧',
        fields: [
            {
                label: { fr: "Type de service", en: "Service type" },
                type: "text",
                placeholder: { fr: "Ex: Maintenance informatique", en: "Ex: IT maintenance" },
                required: true
            },
            {
                label: { fr: "Fréquence d'intervention", en: "Intervention frequency" },
                type: "select",
                options: [
                    { value: "weekly", label: { fr: "Hebdomadaire", en: "Weekly" } },
                    { value: "monthly", label: { fr: "Mensuelle", en: "Monthly" } },
                    { value: "quarterly", label: { fr: "Trimestrielle", en: "Quarterly" } },
                    { value: "on-demand", label: { fr: "À la demande", en: "On demand" } }
                ]
            },
            {
                label: { fr: "Heures incluses par mois", en: "Hours included per month" },
                type: "number",
                placeholder: { fr: "Ex: 8", en: "Ex: 8" },
                suffix: "h"
            },
            {
                label: { fr: "Tarif horaire supplémentaire", en: "Additional hourly rate" },
                type: "number",
                placeholder: { fr: "Ex: 65.00", en: "Ex: 65.00" },
                prefix: "€",
                step: "0.01"
            },
            {
                label: { fr: "Temps de réponse garanti", en: "Guaranteed response time" },
                type: "select",
                options: [
                    { value: "4h", label: { fr: "4 heures", en: "4 hours" } },
                    { value: "24h", label: { fr: "24 heures", en: "24 hours" } },
                    { value: "48h", label: { fr: "48 heures", en: "48 hours" } },
                    { value: "next-day", label: { fr: "Jour ouvrable suivant", en: "Next business day" } }
                ]
            },
            {
                label: { fr: "Prix mensuel", en: "Monthly price" },
                type: "number",
                placeholder: { fr: "Ex: 450.00", en: "Ex: 450.00" },
                prefix: "€",
                required: true,
                step: "0.01"
            }
        ]
    }
};

class PremadeTemplateManager {
    constructor(languageManager) {
        this.languageManager = languageManager;
        this.templates = premadeTemplates;
    }
    
    getTemplates() {
        return Object.values(this.templates);
    }
    
    getTemplate(id) {
        return this.templates[id] || null;
    }
    
    getTemplatesByCategory(category) {
        return Object.values(this.templates).filter(template => template.category === category);
    }
    
    getLocalizedTemplate(templateId) {
        const template = this.getTemplate(templateId);
        if (!template) return null;
        
        const currentLang = this.languageManager ? this.languageManager.getCurrentLanguage() : 'fr';
        
        return {
            ...template,
            name: template.name[currentLang] || template.name.fr,
            description: template.description[currentLang] || template.description.fr,
            fields: template.fields.map(field => ({
                ...field,
                label: field.label[currentLang] || field.label.fr,
                placeholder: field.placeholder ? (field.placeholder[currentLang] || field.placeholder.fr) : '',
                options: field.options ? field.options.map(option => ({
                    ...option,
                    label: option.label[currentLang] || option.label.fr
                })) : undefined
            }))
        };
    }
    
    createTemplateSelector() {
        const currentLang = this.languageManager ? this.languageManager.getCurrentLanguage() : 'fr';
        const container = document.createElement('div');
        container.className = 'premade-templates-selector';
        
        const title = document.createElement('h3');
        title.textContent = currentLang === 'en' ? 'Choose a Template' : 'Choisir un Template';
        title.className = 'premade-templates-title';
        container.appendChild(title);
        
        const grid = document.createElement('div');
        grid.className = 'premade-templates-grid';
        
        Object.values(this.templates).forEach(template => {
            const card = document.createElement('div');
            card.className = 'premade-template-card';
            card.setAttribute('data-template-id', template.id);
            
            const icon = document.createElement('div');
            icon.className = 'template-icon';
            icon.textContent = template.icon;
            
            const name = document.createElement('div');
            name.className = 'template-name';
            name.textContent = template.name[currentLang] || template.name.fr;
            
            const description = document.createElement('div');
            description.className = 'template-description';
            description.textContent = template.description[currentLang] || template.description.fr;
            
            card.appendChild(icon);
            card.appendChild(name);
            card.appendChild(description);
            
            card.addEventListener('click', () => {
                this.selectTemplate(template.id);
            });
            
            grid.appendChild(card);
        });
        
        container.appendChild(grid);
        return container;
    }
    
    selectTemplate(templateId) {
        const template = this.getLocalizedTemplate(templateId);
        if (!template) return;
        
        // Dispatch event for template selection
        const event = new CustomEvent('premadeTemplateSelected', {
            detail: { template }
        });
        document.dispatchEvent(event);
        
        // Close template selector modal if it exists
        const modal = document.querySelector('.premade-template-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    showTemplateSelector() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay premade-template-modal active';
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        const header = document.createElement('div');
        header.className = 'modal-header';
        
        const title = document.createElement('h2');
        title.className = 'modal-title';
        const currentLang = this.languageManager ? this.languageManager.getCurrentLanguage() : 'fr';
        title.textContent = currentLang === 'en' ? 'Select a Template' : 'Sélectionner un Template';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', () => overlay.remove());
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.appendChild(this.createTemplateSelector());
        
        content.appendChild(header);
        content.appendChild(body);
        overlay.appendChild(content);
        
        // Add to document
        document.body.appendChild(overlay);
        
        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Handle overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }
}

export { PremadeTemplateManager, premadeTemplates };
