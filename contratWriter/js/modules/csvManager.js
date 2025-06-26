/**
 * Module de gestion des formats d'exports et d'imports (CSV et JSON)
 * Ce module s'occupe de l'export des contrats vers CSV/JSON et de l'import depuis ces formats
 * Les fichiers CSV utilisent le séparateur ";" selon le standard européen
 */
import { showNotification } from '../utils/helpers.js';
import { logInfo, logError, logWarning, logSuccess } from '../utils/logger.js';

/**
 * Exporte les contrats vers un fichier CSV ou JSON
 * @param {HTMLElement} container - Conteneur des offres
 * @param {Object} existingData - Données existantes (optionnel)
 * @returns {string} - Contenu CSV ou JSON
 */
export function exportContractsToJSON(container, existingData = null) {
    if (!container && !existingData) {
        logError('Le conteneur des offres est indéfini et aucune donnée n\'est fournie');
        return '';
    }
    
    // Si des données existantes sont fournies, les utiliser
    if (existingData) {
        if (existingData.format === 'csv') {
            // Générer directement le CSV à partir des données existantes
            return generateCSV(existingData.offers, existingData.extraCosts);
        }
        return JSON.stringify(existingData, null, 2);
    }
    
    const offers = [];
    const offerElements = container.querySelectorAll('.offer-card');
    const groupedOfferElements = container.querySelectorAll('.grouped-offer-card');
    
    // Récupérer les données des offres simples
    offerElements.forEach(offer => {
        const offerData = {
            type: 'offer',
            id: offer.dataset.id,
            icon: offer.querySelector('.offer-icon')?.textContent || '📄'
        };
        
        // Récupérer tous les inputs
        const inputs = offer.querySelectorAll('[data-field]');
        inputs.forEach(input => {
            offerData[input.dataset.field] = input.value || '';
        });
        
        offers.push(offerData);
    });
    
    // Récupérer les données des offres groupées
    groupedOfferElements.forEach(group => {
        const offerItems = Array.from(group.querySelectorAll('.grouped-offer-item')).map(item => item.textContent);
        const totalCost = group.querySelector('.grouped-total-cost')?.textContent || '0 €';
        
        const groupData = {
            type: 'group',
            id: group.dataset.id,
            icon: group.querySelector('.offer-icon')?.textContent || '📦',
            items: offerItems.join('|'),
            totalCost: totalCost.replace(' €', '')
        };
        
        offers.push(groupData);
    });
    
    // Récupérer les coûts supplémentaires
    const extraCosts = [];
    const extraCostsContainer = document.getElementById('extra-costs-container');
    
    if (extraCostsContainer) {
        const extraCostItems = extraCostsContainer.querySelectorAll('.extra-cost-item');
        extraCostItems.forEach(item => {
            const name = item.querySelector('.extra-cost-name')?.textContent || '';
            const value = item.querySelector('.extra-cost-value')?.textContent || '0';
            const type = item.querySelector('.extra-cost-type')?.textContent || '';
            
            if (name && value) {
                extraCosts.push({
                    name,
                    value: value.replace(/[^\d.,]/g, ''),
                    type
                });
            }
        });
    }
    
    // Créer l'objet de données à exporter
    const exportData = {
        offers,
        extraCosts,
        metadata: {
            exportDate: new Date().toISOString(),
            version: '1.1.0'
        },
        // Le format sera défini lors de l'export selon l'extension choisie
        format: null
    };
    
    // Convertir en JSON pour la sortie
    const jsonStr = JSON.stringify(exportData, null, 2);
    logInfo('Données exportées: ' + jsonStr.substring(0, 100) + '...');
    
    return jsonStr;
}

/**
 * Télécharge les contrats sous forme de fichier CSV ou JSON
 * @param {HTMLElement} container - Conteneur des offres
 * @param {boolean} useJsonExtension - Si vrai, utilise l'extension .json au lieu de .csv
 */
export function downloadContractsAsFile(container, useJsonExtension = false) {
    if (!container) {
        logError('Le conteneur des offres est indéfini');
        return;
    }
    
    // Récupérer les données exportées sous forme d'objet
    const dataObj = {
        ...JSON.parse(exportContractsToJSON(container)),
        // Définir le format selon l'extension choisie
        format: useJsonExtension ? 'json' : 'csv'
    };
    
    if (!dataObj || !dataObj.offers) {
        logError('Aucune donnée à exporter');
        showNotification('Aucune donnée à exporter', 'error');
        return;
    }
    
    // Générer le contenu selon le format choisi
    let content;
    if (useJsonExtension) {
        content = JSON.stringify(dataObj, null, 2);
    } else {
        // Définir le format CSV et régénérer le contenu
        dataObj.format = 'csv';
        content = exportContractsToJSON(container, dataObj);
    }
    
    // Déterminer le type MIME et l'extension de fichier
    const fileExtension = useJsonExtension ? 'json' : 'csv';
    const mimeType = useJsonExtension ? 'application/json' : 'text/csv';
    
    // Créer un élément pour télécharger le fichier
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Configurer le lien de téléchargement
    const date = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
    link.href = url;
    link.download = `contrats_export_${date}.${fileExtension}`;
    
    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    logSuccess(`Export ${fileExtension.toUpperCase()} effectué avec succès`);
    showNotification('Export effectué avec succès', 'success');
}

/**
 * Importe des contrats depuis un fichier CSV ou JSON
 * @param {File} file - Fichier CSV ou JSON avec extension .csv
 * @param {HTMLElement} container - Conteneur des offres
 * @param {Function} createOfferCallback - Fonction pour créer une nouvelle offre
 */
export function importContractsFromCSV(file, container, createOfferCallback) {
    if (!file || !container || !createOfferCallback) {
        logError('Paramètres manquants pour l\'import');
        return;
    }
    
    // Vérifier le type de fichier
    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.json')) {
        logError('Le fichier doit être au format CSV ou JSON');
        showNotification('Le fichier doit être au format CSV ou JSON', 'error');
        return;
    }
    
    // Lire le fichier
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;
        
        try {
            // Tenter de parser comme JSON (notre format principal)
            let jsonData;
            try {
                jsonData = JSON.parse(data);
                if (jsonData && jsonData.offers) {
                    importOffersFromJsonData(jsonData, container, createOfferCallback);
                    logSuccess('Import JSON effectué avec succès');
                    showNotification('Import effectué avec succès', 'success');
                    return;
                }
            } catch (jsonError) {
                // Si ce n'est pas du JSON, continuer avec l'ancien format CSV
                logWarning('Pas un fichier JSON valide, tentative d\'import au format CSV standard');
            }
            
            // Ancien format: Parser les données CSV
            const rows = data.split('\n').filter(row => row.trim());
            
            if (rows.length < 2) {
                logError('Données CSV invalides');
                showNotification('Données CSV invalides', 'error');
                return;
            }
                    
                    // Extraire les en-têtes
                    const headers = parseCSVRow(rows[0]);
                    
                    // Vider le conteneur actuel
                    container.innerHTML = '';
                    
                    // Stocker les IDs pour mettre à jour les compteurs
                    let maxOfferId = 1;
                    let maxGroupId = 0;
                    
                    // Traiter chaque ligne
                    for (let i = 1; i < rows.length; i++) {
                        const values = parseCSVRow(rows[i]);
                        if (values.length !== headers.length) continue;
                        
                        // Créer un objet avec les données
                        const rowData = {};
                        for (let j = 0; j < headers.length; j++) {
                            rowData[headers[j]] = values[j];
                        }
                        
                        // Traiter selon le type
                        if (rowData.type === 'offer') {
                            // Créer une nouvelle offre
                            const newOffer = createOfferCallback(container);
                            
                            // Mettre à jour l'icône
                            const iconElement = newOffer.querySelector('.offer-icon');
                            if (iconElement && rowData.icon) {
                                iconElement.textContent = rowData.icon;
                            }
                            
                            // Remplir les champs
                            Object.keys(rowData).forEach(key => {
                                if (key !== 'type' && key !== 'id' && key !== 'icon') {
                                    const input = newOffer.querySelector(`[data-field="${key}"]`);
                                    if (input) {
                                        input.value = rowData[key];
                                    }
                                }
                            });
                            
                            // Mettre à jour le compteur d'ID
                            if (rowData.id) {
                                const match = rowData.id.match(/offer-(\d+)/);
                                if (match && parseInt(match[1]) > maxOfferId) {
                                    maxOfferId = parseInt(match[1]);
                                }
                            }
                        }
                        else if (rowData.type === 'group') {
                            // Créer un groupe
                            const groupCard = document.createElement('div');
                            groupCard.className = 'grouped-offer-card';
                            groupCard.dataset.id = rowData.id || `group-${++maxGroupId}`;
                            
                            // Items du groupe
                            const items = rowData.items ? rowData.items.split('|') : [];
                            const itemsHtml = items.map(item => `<div class="grouped-offer-item">${item}</div>`).join('');
                            
                            groupCard.innerHTML = `
                                <div class="offer-header">
                                    <span class="offer-icon">${rowData.icon || '📦'}</span>
                                    <button class="icon-btn" title="Changer l'icône">🖌️</button>
                                    <div class="offer-title">Groupe #${maxGroupId}</div>
                                </div>
                                <div class="grouped-offers-list">
                                    ${itemsHtml}
                                </div>
                                <div class="grouped-total">
                                    <div class="grouped-total-label">Total:</div>
                                    <div class="grouped-total-cost">${rowData.totalCost || '0 €'}</div>
                                </div>
                                <div class="offer-footer">
                                    <button class="delete-offer-btn">🗑️ Supprimer</button>
                                </div>
                            `;
                            
                            container.appendChild(groupCard);
                            
                            // Mettre à jour le compteur d'ID
                            if (rowData.id) {
                                const match = rowData.id.match(/group-(\d+)/);
                                if (match && parseInt(match[1]) > maxGroupId) {
                                    maxGroupId = parseInt(match[1]);
                                }
                            }
                        }
                    }
                    
                    // Mettre à jour les compteurs globaux
                    if (window.ContractPicker) {
                        window.ContractPicker.setNextOfferId(maxOfferId + 1);
                        window.ContractPicker.setNextGroupId(maxGroupId + 1);
                    }
                    
                    logSuccess('Import réussi');
                    showNotification('Import réussi', 'success');
                } catch (e) {
                    logError('Erreur lors du parsing des données: ' + e.message);
                    showNotification('Erreur lors du parsing des données', 'error');
                }
        };
    reader.onerror = function() {
        logError('Erreur lors de la lecture du fichier');
        showNotification('Erreur lors de la lecture du fichier', 'error');
    };
    reader.readAsText(file);
}

/**
 * Importe les données à partir d'un objet JSON
 * @param {Object} jsonData - Données au format JSON
 * @param {HTMLElement} container - Conteneur des offres
 * @param {Function} createOfferCallback - Fonction pour créer une nouvelle offre
 */
function importOffersFromJsonData(jsonData, container, createOfferCallback) {
    if (!jsonData || !container || !createOfferCallback) {
        logError('Paramètres manquants pour l\'importation JSON');
        return;
    }
    
    // Supprimer les offres existantes
    const existingOffers = container.querySelectorAll('.offer-card, .grouped-offer-card');
    existingOffers.forEach(offer => offer.remove());
    
    let maxOfferId = 1;
    let maxGroupId = 1;
    
    // Importer les offres
    if (jsonData.offers && Array.isArray(jsonData.offers)) {
        jsonData.offers.forEach(offerData => {
            if (offerData.type === 'offer') {
                // Créer une nouvelle offre
                const newOffer = createOfferCallback(container);
                
                // Mettre à jour l'icône
                const iconElement = newOffer.querySelector('.offer-icon');
                if (iconElement && offerData.icon) {
                    iconElement.textContent = offerData.icon;
                }
                
                // Remplir les champs
                Object.keys(offerData).forEach(key => {
                    if (key !== 'type' && key !== 'id' && key !== 'icon') {
                        const input = newOffer.querySelector(`[data-field="${key}"]`);
                        if (input) {
                            input.value = offerData[key];
                        }
                    }
                });
                
                // Mettre à jour le compteur d'ID
                if (offerData.id) {
                    const match = offerData.id.match(/offer-(\d+)/);
                    if (match && parseInt(match[1]) > maxOfferId) {
                        maxOfferId = parseInt(match[1]);
                    }
                }
            }
            // Ajouter ici le code pour les groupes
        });
    }
    
    // Importer les coûts supplémentaires
    if (jsonData.extraCosts && Array.isArray(jsonData.extraCosts)) {
        // Trouver ou créer le conteneur de coûts supplémentaires
        let extraCostsContainer = document.getElementById('extra-costs-container');
        if (extraCostsContainer) {
            // Générer le HTML pour les coûts
            let totalExtraCost = 0;
            let html = '<h3>Coûts supplémentaires</h3><div class="extra-costs-list">';
            
            jsonData.extraCosts.forEach(cost => {
                let annualizedValue = parseFloat(cost.value);
                if (cost.type === 'Mensuel') annualizedValue *= 12;
                totalExtraCost += annualizedValue;
                
                html += `
                    <div class="extra-cost-item">
                        <span class="extra-cost-name">${cost.name}</span>:
                        <span class="extra-cost-value">${cost.value}</span> €
                        <span class="extra-cost-type">${cost.type}</span>
                    </div>
                `;
            });
            
            html += `</div><div class="extra-costs-total">Total annualisé: <strong>${totalExtraCost.toLocaleString('fr-FR')} €</strong></div>`;
            extraCostsContainer.innerHTML = html;
            
            logInfo('Coûts supplémentaires importés');
        }
    }
    
    // Mettre à jour les compteurs d'ID
    if (window.ContractPicker) {
        if (window.ContractPicker.setNextOfferId) {
            window.ContractPicker.setNextOfferId(maxOfferId + 1);
        }
        if (window.ContractPicker.setNextGroupId) {
            window.ContractPicker.setNextGroupId(maxGroupId + 1);
        }
        if (window.ContractPicker.updateOffersTotalSummary) {
            window.ContractPicker.updateOffersTotalSummary();
        }
    }
    
    logSuccess('Importation des données JSON terminée avec succès');
    showNotification('Importation terminée avec succès', 'success');
}

/**
 * Génère le contenu CSV avec séparateur ";" à partir des données
 * @param {Array} offers - Liste des offres à exporter
 * @param {Array} extraCosts - Liste des coûts supplémentaires
 * @returns {string} - Contenu CSV formaté
 */
function generateCSV(offers, extraCosts) {
    // Création de l'en-tête CSV
    let headers = ['type', 'id', 'icon'];
    
    // Trouver tous les champs possibles dans les offres
    const allFields = new Set();
    offers.forEach(offer => {
        Object.keys(offer).forEach(key => {
            if (!['type', 'id', 'icon'].includes(key)) {
                allFields.add(key);
            }
        });
    });
    
    // Ajouter tous les champs trouvés aux en-têtes
    headers = headers.concat(Array.from(allFields));
    
    // Créer la ligne d'en-tête
    let csvContent = headers.join(';') + '\n';
    
    // Ajouter les données de chaque offre
    offers.forEach(offer => {
        let row = [];
        headers.forEach(header => {
            // Échapper les valeurs contenant des point-virgules ou retours à la ligne
            let value = offer[header] || '';
            if (typeof value === 'string' && (value.includes(';') || value.includes('\n') || value.includes('"'))) {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            row.push(value);
        });
        csvContent += row.join(';') + '\n';
    });
    
    // Ajouter une section pour les coûts supplémentaires
    if (extraCosts && extraCosts.length > 0) {
        csvContent += '\n"EXTRA_COSTS";\n';
        csvContent += 'name;value;type\n';
        extraCosts.forEach(cost => {
            let name = cost.name.includes(';') || cost.name.includes('"') ? 
                '"' + cost.name.replace(/"/g, '""') + '"' : cost.name;
            csvContent += `${name};${cost.value};${cost.type}\n`;
        });
    }
    
    logInfo('Données exportées en CSV: ' + csvContent.substring(0, 100) + '...');
    return csvContent;
}

/**
 * Parse une ligne CSV en tenant compte des guillemets
 * @param {string} row - Ligne CSV à parser
 * @returns {Array} - Tableau des valeurs
 */
function parseCSVRow(row) {
    const result = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
            if (i < row.length - 1 && row[i + 1] === '"') {
                // Double guillemet à l'intérieur d'un champ entre guillemets
                currentValue += '"';
                i++; // Sauter le prochain guillemet
            } else {
                // Début/fin d'un champ entre guillemets
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Fin d'un champ
            result.push(currentValue);
            currentValue = '';
        } else {
            // Caractère normal
            currentValue += char;
        }
    }
    
    // Ajouter le dernier champ
    result.push(currentValue);
    
    return result;
}
