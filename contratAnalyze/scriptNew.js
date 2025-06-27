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

        // Modal backdrop click
        document.getElementById('apiModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('apiModal')) {
                document.getElementById('apiModal').classList.add('hidden');
            }
        });
    }

    setupDragAndDrop() {
        const dropZone = document.querySelector('.border-dashed');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('border-primary');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('border-primary');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            this.handleFileSelection(files);
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleFileSelection(files) {
        if (files.length === 0) return;

        if (files.length > this.maxFiles) {
            this.showError(`Vous ne pouvez importer que ${this.maxFiles} fichiers maximum.`);
            return;
        }

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
        // Update summary stats
        this.updateSummaryStats(results.executiveSummary);
        
        // Create cost chart
        this.createCostChart(results.costAnalysis);
        
        // Create type chart
        this.createTypeChart(results.typeAnalysis);
        
        // Display detailed comparison
        this.displayDetailedComparison(results.detailedComparison);
        
        // Display AI recommendations
        this.displayAIRecommendations(results.recommendations);
    }

    updateSummaryStats(summary) {
        document.getElementById('resultFilesCount').textContent = summary.filesCount;
        document.getElementById('resultOffersCount').textContent = summary.totalOffers;
        document.getElementById('resultAvgCost').textContent = `${summary.avgCost}€`;
        document.getElementById('resultCostRange').textContent = `${summary.minCost}€ - ${summary.maxCost}€`;
    }

    createCostChart(costAnalysis) {
        const ctx = document.getElementById('costChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.costChartInstance) {
            window.costChartInstance.destroy();
        }
        
        window.costChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: costAnalysis.labels,
                datasets: [{
                    label: 'Coût moyen (€)',
                    data: costAnalysis.costData,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Comparaison des coûts moyens par fichier'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '€';
                            }
                        }
                    }
                }
            }
        });
    }

    createTypeChart(typeAnalysis) {
        const ctx = document.getElementById('typeChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.typeChartInstance) {
            window.typeChartInstance.destroy();
        }
        
        const colors = [
            'rgba(239, 68, 68, 0.6)',
            'rgba(34, 197, 94, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(234, 179, 8, 0.6)',
            'rgba(168, 85, 247, 0.6)'
        ];
        
        window.typeChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: typeAnalysis.labels,
                datasets: [{
                    data: typeAnalysis.data,
                    backgroundColor: colors.slice(0, typeAnalysis.labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Répartition des types de contrats'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    displayDetailedComparison(comparison) {
        const container = document.getElementById('detailedComparison');
        
        container.innerHTML = comparison.map(file => `
            <div class="bg-white rounded-lg border border-slate-200 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-slate-900">${file.fileName}</h3>
                    <div class="text-sm text-slate-600">
                        ${file.offersCount} offre${file.offersCount > 1 ? 's' : ''} • 
                        Moyenne: ${file.averageCost}€
                    </div>
                </div>
                <div class="space-y-3">
                    ${file.offers.map(offer => `
                        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div class="flex-1">
                                <div class="font-medium text-slate-900">${offer.name}</div>
                                <div class="text-sm text-slate-600">${offer.description}</div>
                            </div>
                            <div class="text-right">
                                <div class="font-semibold text-slate-900">${offer.cost}€</div>
                                <div class="text-sm text-slate-600">${offer.type}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    displayAIRecommendations(recommendations) {
        const container = document.getElementById('aiRecommendations');
        
        if (!recommendations.available) {
            container.innerHTML = `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <div class="text-2xl mb-2">🤖</div>
                    <div class="text-blue-800 font-medium mb-2">Recommandations IA non disponibles</div>
                    <div class="text-blue-600 text-sm">${recommendations.message}</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                <div class="flex items-center mb-4">
                    <span class="text-2xl mr-3">🤖</span>
                    <h3 class="text-lg font-semibold text-green-800">Recommandations IA</h3>
                </div>
                <div class="prose prose-green max-w-none">
                    ${recommendations.recommendation.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }

    loadApiKey() {
        this.apiKey = localStorage.getItem('geminiApiKey') || '';
    }

    saveApiKey() {
        const apiKey = document.getElementById('modalApiKeyInput').value.trim();
        
        if (!apiKey) {
            this.showError('Veuillez entrer une clé API valide');
            return;
        }
        
        this.apiKey = apiKey;
        localStorage.setItem('geminiApiKey', apiKey);
        document.getElementById('apiModal').classList.add('hidden');
        
        this.showSuccess('Clé API sauvegardée avec succès');
    }

    async testApiKey() {
        const apiKey = document.getElementById('modalApiKeyInput').value.trim();
        const resultDiv = document.getElementById('testApiKeyResult');
        
        if (!apiKey) {
            resultDiv.innerHTML = '<div class="text-red-600">Veuillez entrer une clé API</div>';
            return;
        }
        
        resultDiv.innerHTML = '<div class="text-blue-600">Test en cours...</div>';
        
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'Test de connexion API'
                        }]
                    }]
                })
            });

            if (response.ok) {
                resultDiv.innerHTML = '<div class="text-green-600">✅ Clé API valide</div>';
            } else {
                const errorData = await response.json();
                resultDiv.innerHTML = `<div class="text-red-600">❌ Erreur: ${errorData.error?.message || 'Clé API invalide'}</div>`;
            }
        } catch (error) {
            resultDiv.innerHTML = `<div class="text-red-600">❌ Erreur de connexion: ${error.message}</div>`;
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
            type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
            type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
            'bg-blue-100 border border-blue-400 text-blue-700'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-start">
                <span class="text-xl mr-3">${
                    type === 'error' ? '❌' :
                    type === 'success' ? '✅' : 'ℹ️'
                }</span>
                <div class="flex-1">
                    <div class="font-medium">${type === 'error' ? 'Erreur' : type === 'success' ? 'Succès' : 'Information'}</div>
                    <div class="text-sm mt-1">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-3 text-lg hover:opacity-70">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize analyzer
const analyzer = new ContractAnalyzer();

// Make analyzer available globally for onclick handlers
window.analyzer = analyzer;
