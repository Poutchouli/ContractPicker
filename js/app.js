/**
 * Main application entry point
 * This file is a fallback that redirects to the actual application in the contratWriter directory
 */

console.log('Redirecting to the main application...');

// Check if we're not already in the contratWriter directory
if (!window.location.href.includes('contratWriter')) {
    // Redirect to the ContratWriter application
    window.location.href = '../contratWriter/';
}

/**
 * Main Application Controller
 */
class App {
    constructor() {
        this.currentData = null;
        this.init();
    }

    // Initialize application
    init() {
        this.setupEventListeners();
        this.loadExistingData();
        this.showScreen('welcome');
    }

    // Setup event listeners
    setupEventListeners() {
        // Header buttons
        document.getElementById('newTemplateBtn').addEventListener('click', () => {
            this.startNewTemplate();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            this.importData();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Welcome screen buttons
        document.getElementById('startNewBtn').addEventListener('click', () => {
            this.startNewTemplate();
        });

        document.getElementById('loadExistingBtn').addEventListener('click', () => {
            this.importData();
        });

        // Contract screen buttons
        document.getElementById('addContractBtn').addEventListener('click', () => {
            window.contractManager.addContract();
        });

        document.getElementById('backToWelcomeBtn').addEventListener('click', () => {
            this.showScreen('welcome');
        });

        document.getElementById('addExtraCostBtn').addEventListener('click', () => {
            window.contractManager.addExtraCost();
        });

        // Calculator period selector
        document.getElementById('periodSelector').addEventListener('change', () => {
            window.contractManager.calculateTotal();
        });

        // Global discount
        document.getElementById('globalDiscount').addEventListener('input', (e) => {
            window.contractManager.updateGlobalDiscount(e.target.value);
        });

        // File input for import
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileImport(e.target.files[0]);
        });
    }

    // Show specific screen
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        document.getElementById(screenName + 'Screen').classList.add('active');

        // Show/hide calculator based on screen
        const calculator = document.getElementById('totalCalculator');
        if (screenName === 'contract') {
            calculator.style.display = 'block';
        } else {
            calculator.style.display = 'none';
        }
    }

    // Start new template creation
    startNewTemplate() {
        this.clearImportDate();
        this.showScreen('templateWizard');
        window.templateWizard.start();
    }

    // Import data from file
    importData() {
        document.getElementById('fileInput').click();
    }

    // Handle file import
    async handleFileImport(file) {
        if (!file) return;

        try {
            const data = await window.storage.importFromFile(file);
            
            // Validate data structure
            if (!this.validateImportData(data)) {
                alert('Fichier JSON invalide ou format non supporté');
                return;
            }

            // Load data
            this.setCurrentData(data);
            window.contractManager.setData(data);
            
            // Show import date
            this.showImportDate(data.exportDate);
            
            // Switch to contract screen
            this.showScreen('contract');
            
            alert('Données importées avec succès!');
            
        } catch (error) {
            alert('Erreur lors de l\'importation: ' + error.message);
        }
    }

    // Validate import data
    validateImportData(data) {
        return data && 
               data.template && 
               data.template.name && 
               Array.isArray(data.template.fields) &&
               Array.isArray(data.contracts);
    }

    // Export current data
    exportData() {
        if (!this.currentData) {
            alert('Aucune donnée à exporter');
            return;
        }

        const data = window.contractManager.getData();
        const filename = `${data.template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
        
        window.storage.exportToFile(data, filename);
        alert('Données exportées avec succès!');
    }

    // Set current data
    setCurrentData(data) {
        this.currentData = data;
    }

    // Load existing data from localStorage
    loadExistingData() {
        const data = window.storage.load();
        if (data && data.template) {
            this.setCurrentData(data);
            // Don't automatically show contract screen, let user choose
        }
    }

    // Show import date
    showImportDate(dateString) {
        if (!dateString) return;
        
        const date = new Date(dateString);
        const importDate = document.getElementById('importDate');
        importDate.textContent = `Importé le: ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}`;
        importDate.classList.add('visible');
    }

    // Clear import date
    clearImportDate() {
        const importDate = document.getElementById('importDate');
        importDate.classList.remove('visible');
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
