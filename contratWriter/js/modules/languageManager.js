/**
 * Language Manager - Handles internationalization
 */

// Language translations
const translations = {
    fr: {
        // Header and Navigation
        appTitle: "ContractPicker Pro",
        appSubtitle: "Outil d'Aide à la Décision Stratégique",
        newOffer: "Nouvelle offre",
        group: "Grouper",
        export: "Exporter",
        import: "Importer",
        templates: "Templates",
        analyzer: "Analyseur",
        help: "Aide",
        language: "Français",
        french: "Français",
        english: "English",
        premadeTemplates: "Templates Prêts",
        file: "Fichier",
        manageTemplates: "Gérer Templates",
        
        // Main sections
        section1Title: "1. Saisissez et Normalisez vos Offres",
        section2Title: "2. Gestion des Coûts Supplémentaires",
        section3Title: "3. Exportation et Configuration",
        
        // Form labels
        offerNameLabel: "Nom de cette offre :",
        offerNamePlaceholder: "Saisissez un nom pour ce lot ou cette série d'offres...",
        addExtraCost: "+ Ajouter un coût supplémentaire",
        amountPlaceholder: "Montant (€)",
        frequency: "Fréquence",
        
        // Buttons and actions
        addOffer: "Ajouter une offre",
        deleteOffer: "Supprimer",
        selectAll: "Tout sélectionner",
        deselectAll: "Tout désélectionner",
        save: "Sauvegarder",
        cancel: "Annuler",
        close: "Fermer",
        choose: "Choisir...",
        
        // Tooltips
        tooltipNewOffer: "Ajouter une nouvelle offre (Ctrl+N)",
        tooltipGroup: "Grouper les offres sélectionnées (Ctrl+G)",
        tooltipExport: "Exporter toutes les données en JSON (Ctrl+S)",
        tooltipImport: "Importer des données depuis un fichier JSON (Ctrl+O)",
        tooltipTemplates: "Gérer les templates de champs (Ctrl+T)",
        tooltipAnalyzer: "Ouvrir l'analyseur multi-fichiers",
        tooltipHelp: "Afficher l'aide et les raccourcis",
        tooltipLanguage: "Changer de langue / Change Language",
        
        // Modal titles
        helpModalTitle: "Aide et Raccourcis Clavier",
        templateModalTitle: "Gestionnaire de Templates",
        settingsModalTitle: "Paramètres",
        
        // Messages and notifications
        exportSuccess: "Export réussi!",
        importSuccess: "Import réussi!",
        errorOccurred: "Une erreur s'est produite",
        noOffersSelected: "Aucune offre sélectionnée",
        confirmDelete: "Êtes-vous sûr de vouloir supprimer cette offre?",
        
        // Time periods
        periodMonth: "par mois",
        periodYear: "par an",
        periodWeek: "par semaine", 
        periodDay: "par jour",
        periodOnce: "une fois",
        periodQuarter: "par trimestre",
        
        // Template categories
        templateGeneral: "Général",
        templatePrinter: "Imprimante",
        templateVehicle: "Véhicule",
        templateEquipment: "Équipement",
        templateSoftware: "Logiciel",
        templateService: "Service",
        
        // Help content
        helpKeyboardShortcuts: "Raccourcis Clavier",
        helpFeatures: "Fonctionnalités",
        helpTips: "Conseils d'utilisation",
        
        // Total summary
        totalAnnual: "Total annuel",
        numberOfOffers: "Nombre d'offres",
        additionalCosts: "Coûts supplémentaires",
        processed: "Traités",
        
        // Color themes
        colorPalette: "Couleurs",
        lightGray: "Gris Clair",
        blue: "Bleu",
        green: "Vert", 
        purple: "Violet",
        warm: "Chaleureux"
    },
    
    en: {
        // Header and Navigation
        appTitle: "ContractPicker Pro",
        appSubtitle: "Strategic Decision Support Tool",
        newOffer: "New Offer",
        group: "Group",
        export: "Export",
        import: "Import",
        templates: "Templates",
        analyzer: "Analyzer",
        help: "Help",
        language: "English",
        french: "Français",
        english: "English",
        premadeTemplates: "Ready Templates",
        file: "File",
        manageTemplates: "Manage Templates",
        
        // Main sections
        section1Title: "1. Enter and Normalize Your Offers",
        section2Title: "2. Additional Costs Management",
        section3Title: "3. Export and Configuration",
        
        // Form labels
        offerNameLabel: "Name of this offer:",
        offerNamePlaceholder: "Enter a name for this batch or series of offers...",
        addExtraCost: "+ Add additional cost",
        amountPlaceholder: "Amount (€)",
        frequency: "Frequency",
        
        // Buttons and actions
        addOffer: "Add Offer",
        deleteOffer: "Delete",
        selectAll: "Select All",
        deselectAll: "Deselect All",
        save: "Save",
        cancel: "Cancel",
        close: "Close",
        choose: "Choose...",
        
        // Tooltips
        tooltipNewOffer: "Add a new offer (Ctrl+N)",
        tooltipGroup: "Group selected offers (Ctrl+G)",
        tooltipExport: "Export all data to JSON (Ctrl+S)",
        tooltipImport: "Import data from JSON file (Ctrl+O)",
        tooltipTemplates: "Manage field templates (Ctrl+T)",
        tooltipAnalyzer: "Open multi-file analyzer",
        tooltipHelp: "Show help and shortcuts",
        tooltipLanguage: "Change language / Changer de langue",
        
        // Modal titles
        helpModalTitle: "Help and Keyboard Shortcuts",
        templateModalTitle: "Template Manager",
        settingsModalTitle: "Settings",
        
        // Messages and notifications
        exportSuccess: "Export successful!",
        importSuccess: "Import successful!",
        errorOccurred: "An error occurred",
        noOffersSelected: "No offers selected",
        confirmDelete: "Are you sure you want to delete this offer?",
        
        // Time periods
        periodMonth: "per month",
        periodYear: "per year", 
        periodWeek: "per week",
        periodDay: "per day",
        periodOnce: "once",
        periodQuarter: "per quarter",
        
        // Template categories
        templateGeneral: "General",
        templatePrinter: "Printer",
        templateVehicle: "Vehicle",
        templateEquipment: "Equipment",
        templateSoftware: "Software",
        templateService: "Service",
        
        // Help content
        helpKeyboardShortcuts: "Keyboard Shortcuts",
        helpFeatures: "Features",
        helpTips: "Usage Tips",
        
        // Total summary
        totalAnnual: "Annual Total",
        numberOfOffers: "Number of offers",
        additionalCosts: "Additional costs",
        processed: "Processed",
        
        // Color themes
        colorPalette: "Colors",
        lightGray: "Light Gray",
        blue: "Blue",
        green: "Green",
        purple: "Purple", 
        warm: "Warm"
    }
};

class LanguageManager {
    constructor() {
        this.currentLanguage = this.detectLanguage();
        this.init();
    }
    
    detectLanguage() {
        // Always default to French first
        return 'fr';
    }
    
    init() {
        this.setupLanguageSelector();
        this.translatePage();
        // Escape key handling is now managed by the unified modal manager
    }
    
    setupLanguageSelector() {
        const languageBtn = document.getElementById('language-btn');
        const languageDropdown = document.getElementById('language-dropdown');
        const languageOptions = document.querySelectorAll('.language-option');
        
        if (languageBtn && languageDropdown) {
            // Toggle dropdown
            languageBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                languageDropdown.classList.toggle('active');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                languageDropdown.classList.remove('active');
            });
            
            // Handle language selection
            languageOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newLang = option.getAttribute('data-lang');
                    this.changeLanguage(newLang);
                    languageDropdown.classList.remove('active');
                });
            });
        }
    }
    
    closeAllModals() {
        // This is now handled by the unified modal manager
        // Close help modal
        const helpModal = document.getElementById('help-modal');
        if (helpModal && helpModal.classList.contains('active')) {
            helpModal.classList.remove('active');
        }
        
        // Close template modal
        const templateModal = document.getElementById('template-modal');
        if (templateModal && templateModal.style.display !== 'none') {
            templateModal.style.display = 'none';
        }
        
        // Close any other modals that might be open
        const modals = document.querySelectorAll('.modal-overlay.active, .modal[style*="display: block"]');
        modals.forEach(modal => {
            if (modal.classList.contains('modal-overlay')) {
                modal.classList.remove('active');
            } else {
                modal.style.display = 'none';
            }
        });
    }
    
    changeLanguage(newLang) {
        if (!translations[newLang]) return;
        
        this.currentLanguage = newLang;
        localStorage.setItem('contractpicker-language', newLang);
        
        // Update HTML lang attribute
        document.documentElement.lang = newLang;
        
        this.translatePage();
        this.notifyLanguageChange();
    }
    
    translatePage() {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'text') {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
        
        // Update tooltips
        this.updateTooltips();
        
        // Update page title
        const pageTitle = this.getTranslation('appTitle');
        if (pageTitle) {
            document.title = pageTitle;
        }
    }
    
    updateTooltips() {
        const tooltipMappings = {
            'add-offer-btn': 'tooltipNewOffer',
            'group-offers-btn': 'tooltipGroup',
            'export-csv-btn': 'tooltipExport',
            'import-csv-btn': 'tooltipImport',
            'template-manager-btn': 'tooltipTemplates',
            'help-btn': 'tooltipHelp',
            'language-btn': 'tooltipLanguage'
        };
        
        Object.entries(tooltipMappings).forEach(([elementId, translationKey]) => {
            const element = document.getElementById(elementId);
            if (element) {
                const tooltip = this.getTranslation(translationKey);
                if (tooltip) {
                    element.setAttribute('title', tooltip);
                }
            }
        });
    }
    
    getTranslation(key) {
        return translations[this.currentLanguage] && translations[this.currentLanguage][key];
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    notifyLanguageChange() {
        // Dispatch custom event for other modules to listen to
        const event = new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        });
        document.dispatchEvent(event);
    }
}

// Initialize language manager
let languageManager;

export function initLanguageManager() {
    languageManager = new LanguageManager();
    return languageManager;
}

export function getLanguageManager() {
    return languageManager;
}

export function translate(key) {
    return languageManager ? languageManager.getTranslation(key) : key;
}

export function getCurrentLanguage() {
    return languageManager ? languageManager.getCurrentLanguage() : 'fr';
}
