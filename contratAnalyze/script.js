/**
 * Analyseur d'Offres de Contrat - Multi-fichiers JSON
 * Permet l'import et l'analyse comparative de plusieurs fichiers JSON d'offres
 */

class ContractAnalyzer {
    constructor() {
        this.importedFiles = [];
        this.maxFiles = 10;
        this.compatibleTemplate = null;
        this.apiKey = localStorage.getItem('geminiApiKey') || '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.loadApiKey();
    }

    setupEventListeners() {
        // File selection
        document.getElementById('selectFilesBtn').addEventListener('click', () => {
            document.getElementById('jsonFileInput').click();
        });

        document.getElementById('jsonFileInput').addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Analysis
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.performAnalysis();
        });

        // Navigation
        document.getElementById('backButton').addEventListener('click', () => {
            this.showUploadPage();
        });

        // API Modal
        document.getElementById('openApiModalBtn').addEventListener('click', () => {
            document.getElementById('apiModal').classList.remove('hidden');
            document.getElementById('modalApiKeyInput').value = this.apiKey;
        });

        document.getElementById('closeApiModalBtn').addEventListener('click', () => {
            document.getElementById('apiModal').classList.add('hidden');
        });

        document.getElementById('saveApiKeyBtn').addEventListener('click', () => {
            this.saveApiKey();
        });

        document.getElementById('testApiKeyBtn').addEventListener('click', () => {
            this.testApiKey();
        });
    }

    setupDragAndDrop() {
        const dropArea = document.querySelector('.border-dashed');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.add('border-primary', 'bg-blue-50');
            }, false);
        });

        ['dragleave', 'drop'].forfeach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.remove('border-primary', 'bg-blue-50');
            }, false);
        });

        dropArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelection(files);
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleFileSelection(files) {
        const fileArray = Array.from(files);
        
        // Limiter à 10 fichiers
        if (fileArray.length > this.maxFiles) {
            this.showNotification(`Maximum ${this.maxFiles} fichiers autorisés`, 'error');
            return;
        }

        // Vérifier que ce sont des fichiers JSON
        const jsonFiles = fileArray.filter(file => file.type === 'application/json' || file.name.endsWith('.json'));
        if (jsonFiles.length !== fileArray.length) {
            this.showNotification('Seuls les fichiers JSON sont acceptés', 'error');
            return;
        }

        // Traiter les fichiers
        this.importedFiles = [];
        for (const file of jsonFiles) {
            try {
                const content = await this.readFileContent(file);
                const data = JSON.parse(content);
                
                // Valider la structure du fichier
                if (this.validateFileStructure(data)) {
                    this.importedFiles.push({
                        name: file.name,
                        data: data,
                        template: data.templates ? data.templates.find(t => t.id === data.currentTemplateId) : null
                    });
                }
            } catch (error) {
                this.showNotification(`Erreur lors de la lecture de ${file.name}: ${error.message}`, 'error');
            }
        }

        if (this.importedFiles.length > 0) {
            this.checkTemplateCompatibility();
            this.displaySelectedFiles();
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
            reader.readAsText(file);
        });
    }

    validateFileStructure(data) {
        return data && 
               data.offers && 
               Array.isArray(data.offers) && 
               data.metadata && 
               data.format === 'json';
    }

    checkTemplateCompatibility() {
        if (this.importedFiles.length === 0) return;

        const templates = this.importedFiles.map(f => f.template).filter(t => t !== null);
        
        if (templates.length === 0) {
            this.showTemplateCheckResult('Aucun template trouvé dans les fichiers', 'warning');
            return;
        }

        // Vérifier que tous les templates ont la même structure
        const firstTemplate = templates[0];
        const allCompatible = templates.every(template => 
            this.templatesAreCompatible(firstTemplate, template)
        );

        if (allCompatible) {
            this.compatibleTemplate = firstTemplate;
            this.showTemplateCheckResult(
                `✅ Tous les fichiers utilisent le template compatible "${firstTemplate.name}"`, 
                'success'
            );
            document.getElementById('analyzeBtn').disabled = false;
        } else {
            this.showTemplateCheckResult(
                '❌ Les fichiers utilisent des templates incompatibles. Veuillez utiliser des fichiers avec le même template.',
                'error'
            );
            document.getElementById('analyzeBtn').disabled = true;
        }
    }

    templatesAreCompatible(template1, template2) {
        if (!template1 || !template2) return false;
        if (template1.fields.length !== template2.fields.length) return false;
        
        return template1.fields.every((field1, index) => {
            const field2 = template2.fields[index];
            return field1.id === field2.id && 
                   field1.type === field2.type && 
                   field1.label === field2.label;
        });
    }

    displaySelectedFiles() {
        const container = document.getElementById('filesContainer');
        const filesList = document.getElementById('selectedFilesList');
        
        container.innerHTML = '';
        
        this.importedFiles.forEach((file, index) => {
            const fileElement = document.createElement('div');
            fileElement.className = 'flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200';
            fileElement.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-2xl">📄</span>
                    <div>
                        <p class="font-medium text-slate-900">${file.name}</p>
                        <p class="text-sm text-slate-600">${file.data.offers.length} offres • Template: ${file.template ? file.template.name : 'Non défini'}</p>
                    </div>
                </div>
                <button onclick="contractAnalyzer.removeFile(${index})" class="text-red-500 hover:text-red-700">
                    🗑️
                </button>
            `;
            container.appendChild(fileElement);
        });

        filesList.classList.remove('hidden');
    }

    removeFile(index) {
        this.importedFiles.splice(index, 1);
        if (this.importedFiles.length === 0) {
            document.getElementById('selectedFilesList').classList.add('hidden');
            document.getElementById('templateCheckResults').classList.add('hidden');
        } else {
            this.displaySelectedFiles();
            this.checkTemplateCompatibility();
        }
    }

    showTemplateCheckResult(message, type) {
        const resultContainer = document.getElementById('templateCheckResults');
        const contentContainer = document.getElementById('templateCheckContent');
        
        const colorClasses = {
            success: 'text-green-700 bg-green-50 border-green-200',
            error: 'text-red-700 bg-red-50 border-red-200',
            warning: 'text-yellow-700 bg-yellow-50 border-yellow-200'
        };

        contentContainer.innerHTML = `
            <div class="p-3 rounded-lg border ${colorClasses[type] || colorClasses.warning}">
                ${message}
            </div>
        `;
        
        resultContainer.classList.remove('hidden');
    }

    async performAnalysis() {
        if (this.importedFiles.length === 0) {
            this.showNotification('Aucun fichier sélectionné', 'error');
            return;
        }

        document.getElementById('analyzeBtn').disabled = true;
        document.getElementById('analyzeBtn').textContent = 'Analyse en cours...';

        try {
            // Combiner toutes les offres
            const allOffers = [];
            this.importedFiles.forEach(file => {
                file.data.offers.forEach(offer => {
                    allOffers.push({
                        ...offer,
                        source: file.name
                    });
                });
            });

            // Générer les analyses
            this.generateExecutiveSummary(allOffers);
            this.generateCharts(allOffers);
            this.generateDetailedAnalysis(allOffers);

            // Afficher la page de résultats
            this.showReportPage();
            
        } catch (error) {
            this.showNotification(`Erreur lors de l'analyse: ${error.message}`, 'error');
        } finally {
            document.getElementById('analyzeBtn').disabled = false;
            document.getElementById('analyzeBtn').textContent = 'Analyser les offres';
        }
    }

    generateExecutiveSummary(offers) {
        const totalOffers = offers.length;
        const totalFiles = this.importedFiles.length;
        const avgCost = offers.reduce((sum, offer) => {
            const cost = this.extractCostFromOffer(offer);
            return sum + (cost || 0);
        }, 0) / totalOffers;

        const summary = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="text-center p-4 bg-slate-50 rounded-lg">
                    <div class="text-2xl font-bold text-primary">${totalFiles}</div>
                    <div class="text-slate-600">Fichiers analysés</div>
                </div>
                <div class="text-center p-4 bg-slate-50 rounded-lg">
                    <div class="text-2xl font-bold text-primary">${totalOffers}</div>
                    <div class="text-slate-600">Offres totales</div>
                </div>
                <div class="text-center p-4 bg-slate-50 rounded-lg">
                    <div class="text-2xl font-bold text-primary">${avgCost.toLocaleString('fr-FR')} €</div>
                    <div class="text-slate-600">Coût moyen</div>
                </div>
            </div>
            <p class="text-slate-700 leading-relaxed">
                Cette analyse comparative porte sur <strong>${totalOffers} offres</strong> réparties sur 
                <strong>${totalFiles} fichiers</strong> différents. Le coût moyen des offres s'élève à 
                <strong>${avgCost.toLocaleString('fr-FR')} €</strong>.
            </p>
        `;

        document.getElementById('executiveSummaryContent').innerHTML = summary;
        document.getElementById('analysisDate').textContent = new Date().toLocaleDateString('fr-FR');
    }

    generateCharts(offers) {
        // Chart des coûts
        this.generateCostChart(offers);
        
        // Chart de répartition par type
        this.generateTypeChart(offers);
    }

    generateCostChart(offers) {
        const ctx = document.getElementById('costComparisonChart').getContext('2d');
        
        const costData = this.importedFiles.map(file => {
            const fileOffers = offers.filter(offer => offer.source === file.name);
            const avgCost = fileOffers.reduce((sum, offer) => {
                return sum + (this.extractCostFromOffer(offer) || 0);
            }, 0) / fileOffers.length;
            
            return {
                label: file.name.replace('.json', ''),
                cost: avgCost || 0
            };
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: costData.map(d => d.label),
                datasets: [{
                    label: 'Coût moyen (€)',
                    data: costData.map(d => d.cost),
                    backgroundColor: 'rgba(30, 64, 175, 0.8)',
                    borderColor: 'rgba(30, 64, 175, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('fr-FR') + ' €';
                            }
                        }
                    }
                }
            }
        });
    }

    generateTypeChart(offers) {
        const ctx = document.getElementById('typeDistributionChart').getContext('2d');
        
        const typeCount = {};
        offers.forEach(offer => {
            const type = this.extractTypeFromOffer(offer) || 'Non défini';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(typeCount),
                datasets: [{
                    data: Object.values(typeCount),
                    backgroundColor: [
                        'rgba(30, 64, 175, 0.8)',
                        'rgba(5, 150, 105, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    generateDetailedAnalysis(offers) {
        const analysis = `
            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-semibold text-slate-900 mb-3">Répartition par fichier source</h3>
                    <div class="space-y-2">
                        ${this.importedFiles.map(file => {
                            const fileOffers = offers.filter(o => o.source === file.name);
                            return `
                                <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span class="font-medium">${file.name.replace('.json', '')}</span>
                                    <span class="text-slate-600">${fileOffers.length} offres</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div>
                    <h3 class="text-lg font-semibold text-slate-900 mb-3">Recommandations</h3>
                    <div class="space-y-2 text-slate-700">
                        <p>• Analyse comparative de ${offers.length} offres réparties sur ${this.importedFiles.length} sources</p>
                        <p>• Template utilisé: ${this.compatibleTemplate ? this.compatibleTemplate.name : 'Variables'}</p>
                        <p>• Les coûts varient selon les sources d'offres</p>
                        <p>• Consultez les graphiques ci-dessus pour une vision détaillée</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('detailedAnalysisContent').innerHTML = analysis;
    }

    extractCostFromOffer(offer) {
        // Rechercher dans les champs de l'offre
        if (offer.fields) {
            const costField = offer.fields.find(field => 
                field.id && (field.id.includes('cost') || field.id.includes('cout'))
            );
            if (costField && costField.value) {
                return parseFloat(costField.value) || 0;
            }
        }
        return 0;
    }

    extractTypeFromOffer(offer) {
        if (offer.fields) {
            const typeField = offer.fields.find(field => 
                field.id && (field.id.includes('type') || field.id.includes('periode'))
            );
            if (typeField && typeField.value) {
                return typeField.value;
            }
        }
        return 'Non défini';
    }

    showUploadPage() {
        document.getElementById('uploadPage').classList.remove('hidden');
        document.getElementById('reportPage').classList.add('hidden');
    }

    showReportPage() {
        document.getElementById('uploadPage').classList.add('hidden');
        document.getElementById('reportPage').classList.remove('hidden');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
        
        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-black',
            info: 'bg-blue-500 text-white'
        };
        
        notification.className += ` ${colors[type] || colors.info}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Shows loading indicator with message
     */
    showLoadingIndicator(message = 'Chargement...') {
        let loader = document.getElementById('loadingIndicator');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loadingIndicator';
            loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            loader.innerHTML = `
                <div class="bg-white rounded-lg p-6 shadow-xl">
                    <div class="flex items-center space-x-3">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span id="loadingMessage" class="text-slate-700">${message}</span>
                    </div>
                    <div id="loadingProgress" class="mt-3 w-64 bg-slate-200 rounded-full h-2 hidden">
                        <div id="loadingProgressBar" class="bg-primary h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(loader);
        }
    }

    /**
     * Updates loading progress
     */
    updateLoadingProgress(percentage) {
        const progressBar = document.getElementById('loadingProgressBar');
        const progressContainer = document.getElementById('loadingProgress');
        
        if (progressBar && progressContainer) {
            progressContainer.classList.remove('hidden');
            progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }

    /**
     * Hides loading indicator
     */
    hideLoadingIndicator() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.classList.add('hidden');
        }
    }

    /**
     * Enhanced file validation with detailed error reporting
     */
    validateJSONStructure(data) {
        const errors = [];
        
        if (!data || typeof data !== 'object') {
            errors.push('Le fichier ne contient pas d\'objet JSON valide');
        }
        
        if (!data.offers || !Array.isArray(data.offers)) {
            errors.push('Le fichier ne contient pas de liste d\'offres valide');
        }
        
        if (!data.metadata || typeof data.metadata !== 'object') {
            errors.push('Le fichier ne contient pas de métadonnées valides');
        }
        
        if (!data.templates || !Array.isArray(data.templates)) {
            errors.push('Le fichier ne contient pas de templates valides');
        }
        
        if (errors.length > 0) {
            console.warn('Erreurs de validation JSON:', errors);
            return false;
        }
        
        return true;
    }

    async handleFileSelection(files) {
        if (files.length === 0) return;

        if (files.length > this.maxFiles) {
            this.showError(`Vous ne pouvez importer que ${this.maxFiles} fichiers maximum.`);
            return;
        }

        this.showLoadingIndicator('Validation des fichiers...');

        // Reset previous imports
        this.importedFiles = [];
        this.compatibleTemplate = null;

        const validFiles = [];
        const errors = [];

        for (let file of files) {
            if (!file.name.toLowerCase().endsWith('.json')) {
                errors.push(`${file.name} n'est pas un fichier JSON`);
                continue;
            }

            try {
                const content = await this.readFileAsText(file);
                const data = JSON.parse(content);
                
                // Validate JSON structure
                if (!this.validateJSONStructure(data)) {
                    errors.push(`${file.name} n'a pas la structure JSON attendue`);
                    continue;
                }

                validFiles.push({
                    name: file.name,
                    data: data,
                    template: data.currentTemplateId || 'unknown'
                });

            } catch (error) {
                errors.push(`Erreur lors de la lecture de ${file.name}: ${error.message}`);
            }
        }

        this.hideLoadingIndicator();

        if (errors.length > 0) {
            this.showError(`Erreurs détectées:\n${errors.join('\n')}`);
        }

        if (validFiles.length === 0) {
            this.showError('Aucun fichier JSON valide trouvé.');
            return;
        }

        // Check template compatibility
        const templateCompatibility = this.checkTemplateCompatibility(validFiles);
        
        if (!templateCompatibility.compatible) {
            this.showError(`Les fichiers ne sont pas compatibles:\n${templateCompatibility.reason}`);
            return;
        }

        this.importedFiles = validFiles;
        this.compatibleTemplate = templateCompatibility.template;
        this.updateFilesList();
        this.showAnalysisSection();
    }

    validateJSONStructure(data) {
        // Check if it's a valid contract export JSON
        return data && 
               typeof data === 'object' && 
               Array.isArray(data.offers) && 
               data.metadata && 
               data.metadata.version &&
               data.templates &&
               Array.isArray(data.templates);
    }

    checkTemplateCompatibility(files) {
        if (files.length === 0) {
            return { compatible: false, reason: 'Aucun fichier à analyser' };
        }

        if (files.length === 1) {
            const template = this.extractTemplate(files[0].data);
            return { 
                compatible: true, 
                template: template,
                templateId: files[0].data.currentTemplateId
            };
        }

        // Check that all files use the same template
        const firstTemplateId = files[0].data.currentTemplateId;
        const firstTemplate = this.extractTemplate(files[0].data);

        for (let i = 1; i < files.length; i++) {
            const currentTemplateId = files[i].data.currentTemplateId;
            
            if (currentTemplateId !== firstTemplateId) {
                return { 
                    compatible: false, 
                    reason: `Template incompatible: ${files[0].name} utilise "${firstTemplateId}" tandis que ${files[i].name} utilise "${currentTemplateId}"` 
                };
            }
        }

        return { 
            compatible: true, 
            template: firstTemplate,
            templateId: firstTemplateId
        };
    }

    extractTemplate(data) {
        const templateId = data.currentTemplateId;
        const template = data.templates.find(t => t.id === templateId);
        return template || { id: 'unknown', name: 'Template inconnu', fields: [] };
    }

    async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(new Error('Erreur de lecture du fichier'));
            reader.readAsText(file);
        });
    }

    updateFilesList() {
        const container = document.getElementById('filesListContainer');
        
        if (this.importedFiles.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        const listElement = document.getElementById('filesList');
        
        listElement.innerHTML = this.importedFiles.map((file, index) => `
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">📄</span>
                    <div>
                        <div class="font-medium text-slate-900">${file.name}</div>
                        <div class="text-sm text-slate-600">
                            ${file.data.offers.length} offre${file.data.offers.length > 1 ? 's' : ''} • 
                            Template: ${this.compatibleTemplate.name}
                        </div>
                    </div>
                </div>
                <button onclick="analyzer.removeFile(${index})" class="text-red-500 hover:text-red-700 text-xl">&times;</button>
            </div>
        `).join('');

        // Update analyze button state
        document.getElementById('analyzeBtn').disabled = this.importedFiles.length === 0;
        document.getElementById('analyzeBtn').className = this.importedFiles.length === 0 
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed py-3 px-6 rounded-lg font-medium'
            : 'bg-primary hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors';
    }

    removeFile(index) {
        this.importedFiles.splice(index, 1);
        
        if (this.importedFiles.length === 0) {
            this.compatibleTemplate = null;
            this.showUploadPage();
        } else {
            // Re-check compatibility
            const compatibility = this.checkTemplateCompatibility(this.importedFiles);
            if (!compatibility.compatible) {
                this.showError('Fichiers restants incompatibles après suppression');
                this.importedFiles = [];
                this.compatibleTemplate = null;
                this.showUploadPage();
                return;
            }
            this.compatibleTemplate = compatibility.template;
            this.updateFilesList();
        }
    }

    showAnalysisSection() {
        document.getElementById('uploadPage').style.display = 'none';
        document.getElementById('analysisPage').style.display = 'block';
        
        // Update summary info
        document.getElementById('summaryFilesCount').textContent = this.importedFiles.length;
        document.getElementById('summaryTemplate').textContent = this.compatibleTemplate.name;
        
        const totalOffers = this.importedFiles.reduce((sum, file) => sum + file.data.offers.length, 0);
        document.getElementById('summaryOffersCount').textContent = totalOffers;
    }

    showUploadPage() {
        document.getElementById('uploadPage').style.display = 'block';
        document.getElementById('analysisPage').style.display = 'none';
        document.getElementById('resultsPage').style.display = 'none';
    }

    async performAnalysis() {
        if (this.importedFiles.length === 0) {
            this.showError('Aucun fichier à analyser');
            return;
        }

        // Show loading state
        const analyzeBtn = document.getElementById('analyzeBtn');
        const originalText = analyzeBtn.textContent;
        analyzeBtn.textContent = '⏳ Analyse en cours...';
        analyzeBtn.disabled = true;

        try {
            // Perform analysis
            const analysisResults = await this.runAnalysis();
            
            // Display results
            this.displayResults(analysisResults);
            
            // Show results page
            document.getElementById('analysisPage').style.display = 'none';
            document.getElementById('resultsPage').style.display = 'block';
            
        } catch (error) {
            this.showError(`Erreur lors de l'analyse: ${error.message}`);
            console.error('Analysis error:', error);
        } finally {
            // Restore button state
            analyzeBtn.textContent = originalText;
            analyzeBtn.disabled = false;
        }
    }

    async runAnalysis() {
        // Prepare data for analysis
        const allOffers = [];
        const fileMapping = {};
        
        this.importedFiles.forEach((file, fileIndex) => {
            fileMapping[fileIndex] = {
                name: file.name,
                offers: []
            };
            
            file.data.offers.forEach((offer, offerIndex) => {
                const processedOffer = {
                    id: `${fileIndex}-${offerIndex}`,
                    fileIndex: fileIndex,
                    fileName: file.name,
                    ...offer
                };
                
                allOffers.push(processedOffer);
                fileMapping[fileIndex].offers.push(processedOffer);
            });
        });

        // Generate analysis results
        const results = {
            executiveSummary: this.generateExecutiveSummary(allOffers, fileMapping),
            costAnalysis: this.generateCostAnalysis(allOffers, fileMapping),
            typeAnalysis: this.generateTypeAnalysis(allOffers, fileMapping),
            detailedComparison: this.generateDetailedComparison(allOffers, fileMapping),
            recommendations: await this.generateAIRecommendations(allOffers, fileMapping)
        };

        return results;
    }

    generateExecutiveSummary(allOffers, fileMapping) {
        const filesCount = Object.keys(fileMapping).length;
        const totalOffers = allOffers.length;
        
        // Calculate cost statistics
        const costs = allOffers
            .filter(offer => offer['offer-cost'] && !isNaN(parseFloat(offer['offer-cost'])))
            .map(offer => parseFloat(offer['offer-cost']));
        
        const avgCost = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
        const minCost = costs.length > 0 ? Math.min(...costs) : 0;
        const maxCost = costs.length > 0 ? Math.max(...costs) : 0;

        return {
            filesCount,
            totalOffers,
            avgCost: avgCost.toFixed(2),
            minCost: minCost.toFixed(2),
            maxCost: maxCost.toFixed(2),
            templateName: this.compatibleTemplate.name
        };
    }

    generateCostAnalysis(allOffers, fileMapping) {
        const costData = [];
        const labels = [];
        
        Object.values(fileMapping).forEach(file => {
            const fileCosts = file.offers
                .filter(offer => offer['offer-cost'] && !isNaN(parseFloat(offer['offer-cost'])))
                .map(offer => parseFloat(offer['offer-cost']));
            
            const avgCost = fileCosts.length > 0 ? fileCosts.reduce((a, b) => a + b, 0) / fileCosts.length : 0;
            
            costData.push(avgCost.toFixed(2));
            labels.push(file.name.replace('.json', ''));
        });

        return { costData, labels };
    }

    generateTypeAnalysis(allOffers, fileMapping) {
        const typeCount = {};
        
        allOffers.forEach(offer => {
            const type = offer['offer-cost-type'] || 'Non spécifié';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });

        return {
            labels: Object.keys(typeCount),
            data: Object.values(typeCount)
        };
    }

    generateDetailedComparison(allOffers, fileMapping) {
        const comparison = [];
        
        Object.values(fileMapping).forEach(file => {
            const fileAnalysis = {
                fileName: file.name,
                offersCount: file.offers.length,
                averageCost: 0,
                offers: file.offers.map(offer => ({
                    name: offer['offer-name'] || 'Sans nom',
                    cost: parseFloat(offer['offer-cost']) || 0,
                    type: offer['offer-cost-type'] || 'Non spécifié',
                    description: offer['offer-description'] || 'Aucune description'
                }))
            };
            
            const costs = fileAnalysis.offers
                .filter(offer => !isNaN(offer.cost))
                .map(offer => offer.cost);
            
            fileAnalysis.averageCost = costs.length > 0 ? 
                (costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(2) : '0.00';
            
            comparison.push(fileAnalysis);
        });

        return comparison;
    }

    async generateAIRecommendations(allOffers, fileMapping) {
        if (!this.apiKey) {
            return {
                available: false,
                message: 'Configurez votre clé API Gemini pour obtenir des recommandations IA'
            };
        }

        try {
            // Prepare data for AI analysis
            const summary = this.generateExecutiveSummary(allOffers, fileMapping);
            const prompt = this.buildAIPrompt(summary, allOffers, fileMapping);
            
            const recommendation = await this.callGeminiAPI(prompt);
            
            return {
                available: true,
                recommendation: recommendation
            };
        } catch (error) {
            return {
                available: false,
                message: `Erreur lors de la génération des recommandations: ${error.message}`
            };
        }
    }

    buildAIPrompt(summary, allOffers, fileMapping) {
        let prompt = `Analysez ces données de contrats et fournissez des recommandations stratégiques:\n\n`;
        prompt += `RÉSUMÉ:\n`;
        prompt += `- ${summary.filesCount} fichiers analysés\n`;
        prompt += `- ${summary.totalOffers} offres au total\n`;
        prompt += `- Coût moyen: ${summary.avgCost}€\n`;
        prompt += `- Coût minimum: ${summary.minCost}€\n`;
        prompt += `- Coût maximum: ${summary.maxCost}€\n\n`;
        
        prompt += `DÉTAILS PAR FICHIER:\n`;
        Object.values(fileMapping).forEach(file => {
            prompt += `${file.name}:\n`;
            file.offers.forEach(offer => {
                prompt += `  - ${offer['offer-name']}: ${offer['offer-cost']}€ (${offer['offer-cost-type']})\n`;
            });
            prompt += `\n`;
        });
        
        prompt += `Fournissez une analyse concise avec:\n`;
        prompt += `1. Points clés de l'analyse\n`;
        prompt += `2. Recommandations stratégiques\n`;
        prompt += `3. Optimisations possibles\n`;
        prompt += `4. Risques identifiés\n\n`;
        prompt += `Répondez en français et soyez concis mais informatif.`;
        
        return prompt;
    }

    async callGeminiAPI(prompt) {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + this.apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error?.message || 'Erreur inconnue'}`);
        }

        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text || 'Aucune recommandation générée';
    }

    displayResults(results) {
        // Switch to report page
        document.getElementById('uploadPage').classList.add('hidden');
        document.getElementById('reportPage').classList.remove('hidden');

        // Update summary stats
        this.updateSummaryStats(results.summary);

        // Create charts
        this.createCostChart(results.costAnalysis);
        this.createTypeChart(results.typeAnalysis);

        // Display detailed comparison
        this.displayDetailedComparison(results.comparison);

        // Display AI recommendations if available
        if (results.aiRecommendations) {
            this.displayAIRecommendations(results.aiRecommendations);
        }
        
        // Add export functionality
        this.addExportFunctionality(results);
    }

    /**
     * Adds export functionality for analysis results
     */
    addExportFunctionality(results) {
        // Create export button if it doesn't exist
        let exportBtn = document.getElementById('exportResultsBtn');
        if (!exportBtn) {
            exportBtn = document.createElement('button');
            exportBtn.id = 'exportResultsBtn';
            exportBtn.className = 'bg-primary hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors ml-4';
            exportBtn.innerHTML = '📄 Exporter l\'analyse';
            
            const backButton = document.getElementById('backButton');
            if (backButton && backButton.parentNode) {
                backButton.parentNode.appendChild(exportBtn);
            }
        }

        exportBtn.onclick = () => this.exportAnalysisResults(results);
    }

    /**
     * Exports analysis results to JSON
     */
    exportAnalysisResults(results) {
        try {
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    analyzer: 'ContractPicker Analyzer',
                    version: '2.0',
                    filesAnalyzed: this.importedFiles.length
                },
                summary: results.summary,
                costAnalysis: results.costAnalysis,
                typeAnalysis: results.typeAnalysis,
                comparison: results.comparison,
                aiRecommendations: results.aiRecommendations || null,
                sourceFiles: this.importedFiles.map(f => ({
                    name: f.name,
                    size: f.size,
                    offersCount: f.data.offers.length
                }))
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analyse_contrats_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess('Analyse exportée avec succès');
        } catch (error) {
            this.showError(`Erreur lors de l'export: ${error.message}`);
        }
    }

    /**
     * Shows loading indicator with message
     */
    showLoadingIndicator(message = 'Chargement...') {
        let loader = document.getElementById('loadingIndicator');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loadingIndicator';
            loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            loader.innerHTML = `
                <div class="bg-white rounded-lg p-6 shadow-xl">
                    <div class="flex items-center space-x-3">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span id="loadingMessage" class="text-slate-700">${message}</span>
                    </div>
                    <div id="loadingProgress" class="mt-3 w-64 bg-slate-200 rounded-full h-2 hidden">
                        <div id="loadingProgressBar" class="bg-primary h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(loader);
        }
    }

    /**
     * Updates loading progress
     */
    updateLoadingProgress(percentage) {
        const progressBar = document.getElementById('loadingProgressBar');
        const progressContainer = document.getElementById('loadingProgress');
        
        if (progressBar && progressContainer) {
            progressContainer.classList.remove('hidden');
            progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }

    /**
     * Hides loading indicator
     */
    hideLoadingIndicator() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.classList.add('hidden');
        }
    }

    /**
     * Enhanced file validation with detailed error reporting
     */
    validateJSONStructure(data) {
        const errors = [];
        
        if (!data || typeof data !== 'object') {
            errors.push('Le fichier ne contient pas d\'objet JSON valide');
        }
        
        if (!data.offers || !Array.isArray(data.offers)) {
            errors.push('Le fichier ne contient pas de liste d\'offres valide');
        }
        
        if (!data.metadata || typeof data.metadata !== 'object') {
            errors.push('Le fichier ne contient pas de métadonnées valides');
        }
        
        if (!data.templates || !Array.isArray(data.templates)) {
            errors.push('Le fichier ne contient pas de templates valides');
        }
        
        if (errors.length > 0) {
            console.warn('Erreurs de validation JSON:', errors);
            return false;
        }
        
        return true;
    }

    async handleFileSelection(files) {
        if (files.length === 0) return;

        if (files.length > this.maxFiles) {
            this.showError(`Vous ne pouvez importer que ${this.maxFiles} fichiers maximum.`);
            return;
        }

        this.showLoadingIndicator('Validation des fichiers...');

        // Reset previous imports
        this.importedFiles = [];
        this.compatibleTemplate = null;

        const validFiles = [];
        const errors = [];

        for (let file of files) {
            if (!file.name.toLowerCase().endsWith('.json')) {
                errors.push(`${file.name} n'est pas un fichier JSON`);
                continue;
            }

            try {
                const content = await this.readFileAsText(file);
                const data = JSON.parse(content);
                
                // Validate JSON structure
                if (!this.validateJSONStructure(data)) {
                    errors.push(`${file.name} n'a pas la structure JSON attendue`);
                    continue;
                }

                validFiles.push({
                    name: file.name,
                    data: data,
                    template: data.currentTemplateId || 'unknown'
                });

            } catch (error) {
                errors.push(`Erreur lors de la lecture de ${file.name}: ${error.message}`);
            }
        }

        this.hideLoadingIndicator();

        if (errors.length > 0) {
            this.showError(`Erreurs détectées:\n${errors.join('\n')}`);
        }

        if (validFiles.length === 0) {
            this.showError('Aucun fichier JSON valide trouvé.');
            return;
        }

        // Check template compatibility
        const templateCompatibility = this.checkTemplateCompatibility(validFiles);
        
        if (!templateCompatibility.compatible) {
            this.showError(`Les fichiers ne sont pas compatibles:\n${templateCompatibility.reason}`);
            return;
        }

        this.importedFiles = validFiles;
        this.compatibleTemplate = templateCompatibility.template;
        this.updateFilesList();
        this.showAnalysisSection();
    }

    validateJSONStructure(data) {
        // Check if it's a valid contract export JSON
        return data && 
               typeof data === 'object' && 
               Array.isArray(data.offers) && 
               data.metadata && 
               data.metadata.version &&
               data.templates &&
               Array.isArray(data.templates);
    }

    checkTemplateCompatibility(files) {
        if (files.length === 0) {
            return { compatible: false, reason: 'Aucun fichier à analyser' };
        }

        if (files.length === 1) {
            const template = this.extractTemplate(files[0].data);
            return { 
                compatible: true, 
                template: template,
                templateId: files[0].data.currentTemplateId
            };
        }

        // Check that all files use the same template
        const firstTemplateId = files[0].data.currentTemplateId;
        const firstTemplate = this.extractTemplate(files[0].data);

        for (let i = 1; i < files.length; i++) {
            const currentTemplateId = files[i].data.currentTemplateId;
            
            if (currentTemplateId !== firstTemplateId) {
                return { 
                    compatible: false, 
                    reason: `Template incompatible: ${files[0].name} utilise "${firstTemplateId}" tandis que ${files[i].name} utilise "${currentTemplateId}"` 
                };
            }
        }

        return { 
            compatible: true, 
            template: firstTemplate,
            templateId: firstTemplateId
        };
    }

    extractTemplate(data) {
        const templateId = data.currentTemplateId;
        const template = data.templates.find(t => t.id === templateId);
        return template || { id: 'unknown', name: 'Template inconnu', fields: [] };
    }

    async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(new Error('Erreur de lecture du fichier'));
            reader.readAsText(file);
        });
    }

    updateFilesList() {
        const container = document.getElementById('filesListContainer');
        
        if (this.importedFiles.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        const listElement = document.getElementById('filesList');
        
        listElement.innerHTML = this.importedFiles.map((file, index) => `
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">📄</span>
                    <div>
                        <div class="font-medium text-slate-900">${file.name}</div>
                        <div class="text-sm text-slate-600">
                            ${file.data.offers.length} offre${file.data.offers.length > 1 ? 's' : ''} • 
                            Template: ${this.compatibleTemplate.name}
                        </div>
                    </div>
                </div>
                <button onclick="analyzer.removeFile(${index})" class="text-red-500 hover:text-red-700 text-xl">&times;</button>
            </div>
        `).join('');

        // Update analyze button state
        document.getElementById('analyzeBtn').disabled = this.importedFiles.length === 0;
        document.getElementById('analyzeBtn').className = this.importedFiles.length === 0 
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed py-3 px-6 rounded-lg font-medium'
            : 'bg-primary hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors';
    }

    removeFile(index) {
        this.importedFiles.splice(index, 1);
        
        if (this.importedFiles.length === 0) {
            this.compatibleTemplate = null;
            this.showUploadPage();
        } else {
            // Re-check compatibility
            const compatibility = this.checkTemplateCompatibility(this.importedFiles);
            if (!compatibility.compatible) {
                this.showError('Fichiers restants incompatibles après suppression');
                this.importedFiles = [];
                this.compatibleTemplate = null;
                this.showUploadPage();
                return;
            }
            this.compatibleTemplate = compatibility.template;
            this.updateFilesList();
        }
    }

    showAnalysisSection() {
        document.getElementById('uploadPage').style.display = 'none';
        document.getElementById('analysisPage').style.display = 'block';
        
        // Update summary info
        document.getElementById('summaryFilesCount').textContent = this.importedFiles.length;
        document.getElementById('summaryTemplate').textContent = this.compatibleTemplate.name;
        
        const totalOffers = this.importedFiles.reduce((sum, file) => sum + file.data.offers.length, 0);
        document.getElementById('summaryOffersCount').textContent = totalOffers;
    }

    showUploadPage() {
        document.getElementById('uploadPage').style.display = 'block';
        document.getElementById('analysisPage').style.display = 'none';
        document.getElementById('resultsPage').style.display = 'none';
    }

    async performAnalysis() {
        if (this.importedFiles.length === 0) {
            this.showError('Aucun fichier à analyser');
            return;
        }

        // Show loading state
        const analyzeBtn = document.getElementById('analyzeBtn');
        const originalText = analyzeBtn.textContent;
        analyzeBtn.textContent = '⏳ Analyse en cours...';
        analyzeBtn.disabled = true;

        try {
            // Perform analysis
            const analysisResults = await this.runAnalysis();
            
            // Display results
            this.displayResults(analysisResults);
            
            // Show results page
            document.getElementById('analysisPage').style.display = 'none';
            document.getElementById('resultsPage').style.display = 'block';
            
        } catch (error) {
            this.showError(`Erreur lors de l'analyse: ${error.message}`);
            console.error('Analysis error:', error);
        } finally {
            // Restore button state
            analyzeBtn.textContent = originalText;
            analyzeBtn.disabled = false;
        }
    }

    async runAnalysis() {
        // Prepare data for analysis
        const allOffers = [];
        const fileMapping = {};
        
        this.importedFiles.forEach((file, fileIndex) => {
            fileMapping[fileIndex] = {
                name: file.name,
                offers: []
            };
            
            file.data.offers.forEach((offer, offerIndex) => {
                const processedOffer = {
                    id: `${fileIndex}-${offerIndex}`,
                    fileIndex: fileIndex,
                    fileName: file.name,
                    ...offer
                };
                
                allOffers.push(processedOffer);
                fileMapping[fileIndex].offers.push(processedOffer);
            });
        });

        // Generate analysis results
        const results = {
            executiveSummary: this.generateExecutiveSummary(allOffers, fileMapping),
            costAnalysis: this.generateCostAnalysis(allOffers, fileMapping),
            typeAnalysis: this.generateTypeAnalysis(allOffers, fileMapping),
            detailedComparison: this.generateDetailedComparison(allOffers, fileMapping),
            recommendations: await this.generateAIRecommendations(allOffers, fileMapping)
        };

        return results;
    }

    generateExecutiveSummary(allOffers, fileMapping) {
        const filesCount = Object.keys(fileMapping).length;
        const totalOffers = allOffers.length;
        
        // Calculate cost statistics
        const costs = allOffers
            .filter(offer => offer['offer-cost'] && !isNaN(parseFloat(offer['offer-cost'])))
            .map(offer => parseFloat(offer['offer-cost']));
        
        const avgCost = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
        const minCost = costs.length > 0 ? Math.min(...costs) : 0;
        const maxCost = costs.length > 0 ? Math.max(...costs) : 0;

        return {
            filesCount,
            totalOffers,
            avgCost: avgCost.toFixed(2),
            minCost: minCost.toFixed(2),
            maxCost: maxCost.toFixed(2),
            templateName: this.compatibleTemplate.name
        };
    }

    generateCostAnalysis(allOffers, fileMapping) {
        const costData = [];
        const labels = [];
        
        Object.values(fileMapping).forEach(file => {
            const fileCosts = file.offers
                .filter(offer => offer['offer-cost'] && !isNaN(parseFloat(offer['offer-cost'])))
                .map(offer => parseFloat(offer['offer-cost']));
            
            const avgCost = fileCosts.length > 0 ? fileCosts.reduce((a, b) => a + b, 0) / fileCosts.length : 0;
            
            costData.push(avgCost.toFixed(2));
            labels.push(file.name.replace('.json', ''));
        });

        return { costData, labels };
    }

    generateTypeAnalysis(allOffers, fileMapping) {
        const typeCount = {};
        
        allOffers.forEach(offer => {
            const type = offer['offer-cost-type'] || 'Non spécifié';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });

        return {
            labels: Object.keys(typeCount),
            data: Object.values(typeCount)
        };
    }

    generateDetailedComparison(allOffers, fileMapping) {
        const comparison = [];
        
        Object.values(fileMapping).forEach(file => {
            const fileAnalysis = {
                fileName: file.name,
                offersCount: file.offers.length,
                averageCost: 0,
                offers: file.offers.map(offer => ({
                    name: offer['offer-name'] || 'Sans nom',
                    cost: parseFloat(offer['offer-cost']) || 0,
                    type: offer['offer-cost-type'] || 'Non spécifié',
                    description: offer['offer-description'] || 'Aucune description'
                }))
            };
            
            const costs = fileAnalysis.offers
                .filter(offer => !isNaN(offer.cost))
                .map(offer => offer.cost);
            
            fileAnalysis.averageCost = costs.length > 0 ? 
                (costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(2) : '0.00';
            
            comparison.push(fileAnalysis);
        });

        return comparison;
    }

    async generateAIRecommendations(allOffers, fileMapping) {
        if (!this.apiKey) {
            return {
                available: false,
                message: 'Configurez votre clé API Gemini pour obtenir des recommandations IA'
            };
        }

        try {
            // Prepare data for AI analysis
            const summary = this.generateExecutiveSummary(allOffers, fileMapping);
            const prompt = this.buildAIPrompt(summary, allOffers, fileMapping);
            
            const recommendation = await this.callGeminiAPI(prompt);
            
            return {
                available: true,
                recommendation: recommendation
            };
        } catch (error) {
            return {
                available: false,
                message: `Erreur lors de la génération des recommandations: ${error.message}`
            };
        }
    }

    buildAIPrompt(summary, allOffers, fileMapping) {
        let prompt = `Analysez ces données de contrats et fournissez des recommandations stratégiques:\n\n`;
        prompt += `RÉSUMÉ:\n`;
        prompt += `- ${summary.filesCount} fichiers analysés\n`;
        prompt += `- ${summary.totalOffers} offres au total\n`;
        prompt += `- Coût moyen: ${summary.avgCost}€\n`;
        prompt += `- Coût minimum: ${summary.minCost}€\n`;
        prompt += `- Coût maximum: ${summary.maxCost}€\n\n`;
        
        prompt += `DÉTAILS PAR FICHIER:\n`;
        Object.values(fileMapping).forEach(file => {
            prompt += `${file.name}:\n`;
            file.offers.forEach(offer => {
                prompt += `  - ${offer['offer-name']}: ${offer['offer-cost']}€ (${offer['offer-cost-type']})\n`;
            });
            prompt += `\n`;
        });
        
        prompt += `Fournissez une analyse concise avec:\n`;
        prompt += `1. Points clés de l'analyse\n`;
        prompt += `2. Recommandations stratégiques\n`;
        prompt += `3. Optimisations possibles\n`;
        prompt += `4. Risques identifiés\n\n`;
        prompt += `Répondez en français et soyez concis mais informatif.`;
        
        return prompt;
    }

    async callGeminiAPI(prompt) {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + this.apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error?.message || 'Erreur inconnue'}`);
        }

        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text || 'Aucune recommandation générée';
    }

    displayResults(results) {
        // Switch to report page
        document.getElementById('uploadPage').classList.add('hidden');
        document.getElementById('reportPage').classList.remove('hidden');

        // Update summary stats
        this.updateSummaryStats(results.summary);

        // Create charts
        this.createCostChart(results.costAnalysis);
        this.createTypeChart(results.typeAnalysis);

        // Display detailed comparison
        this.displayDetailedComparison(results.comparison);

        // Display AI recommendations if available
        if (results.aiRecommendations) {
            this.displayAIRecommendations(results.aiRecommendations);
        }
        
        // Add export functionality
        this.addExportFunctionality(results);
    }

    /**
     * Adds export functionality for analysis results
     */
    addExportFunctionality(results) {
        // Create export button if it doesn't exist
        let exportBtn = document.getElementById('exportResultsBtn');
        if (!exportBtn) {
            exportBtn = document.createElement('button');
            exportBtn.id = 'exportResultsBtn';
            exportBtn.className = 'bg-primary hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors ml-4';
            exportBtn.innerHTML = '📄 Exporter l\'analyse';
            
            const backButton = document.getElementById('backButton');
            if (backButton && backButton.parentNode) {
                backButton.parentNode.appendChild(exportBtn);
            }
        }

        exportBtn.onclick = () => this.exportAnalysisResults(results);
    }

    /**
     * Exports analysis results to JSON
     */
    exportAnalysisResults(results) {
        try {
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    analyzer: 'ContractPicker Analyzer',
                    version: '2.0',
                    filesAnalyzed: this.importedFiles.length
                },
                summary: results.summary,
                costAnalysis: results.costAnalysis,
                typeAnalysis: results.typeAnalysis,
                comparison: results.comparison,
                aiRecommendations: results.aiRecommendations || null,
                sourceFiles: this.importedFiles.map(f => ({
                    name: f.name,
                    size: f.size,
                    offersCount: f.data.offers.length
                }))
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analyse_contrats_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess('Analyse exportée avec succès');
        } catch (error) {
            this.showError(`Erreur lors de l'export: ${error.message}`);
        }
    }

    /**
     * Shows loading indicator with message
     */
    showLoadingIndicator(message = 'Chargement...') {
        let loader = document.getElementById('loadingIndicator');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loadingIndicator';
            loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            loader.innerHTML = `
                <div class="bg-white rounded-lg p-6 shadow-xl">
                    <div class="flex items-center space-x-3">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span id="loadingMessage" class="text-slate-700">${message}</span>
                    </div>
                    <div id="loadingProgress" class="mt-3 w-64 bg-slate-200 rounded-full h-2 hidden">
                        <div id="loadingProgressBar" class="bg-primary h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(loader);
        }
    }

    /**
     * Updates loading progress
     */
    updateLoadingProgress(percentage) {
        const progressBar = document.getElementById('loadingProgressBar');
        const progressContainer = document.getElementById('loadingProgress');
        
        if (progressBar && progressContainer) {
            progressContainer.classList.remove('hidden');
            progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }

    /**
     * Hides loading indicator
     */
    hideLoadingIndicator() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.classList.add('hidden');
        }
    }
}