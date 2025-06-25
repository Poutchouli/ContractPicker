document.addEventListener('DOMContentLoaded', () => {
    // --- Sélection des éléments DOM ---
    const calculateBtn = document.getElementById('calculate-btn');
    const exportBtn = document.getElementById('export-csv-btn');
    const addOfferBtn = document.getElementById('add-offer-btn');
    const groupOffersBtn = document.getElementById('group-offers-btn');
    const offersContainer = document.getElementById('offers-container');

    let barChart = null, radarChart = null;
    let nextOfferId = 2;
    let nextGroupId = 1;

    // --- Ajout d'une nouvelle offre ---
    addOfferBtn.addEventListener('click', () => {
        const offerCard = document.createElement('div');
        offerCard.className = 'offer-card';
        offerCard.dataset.id = nextOfferId;
        offerCard.innerHTML = `
            <div class="offer-header">
                <input type="checkbox" class="offer-group-checkbox" title="Sélectionner pour regrouper">
                <input type="text" placeholder="Nom de l'offre (ex: Contrat A)" class="offer-name">
                <button class="delete-offer-btn" title="Supprimer l'offre" aria-label="Supprimer l'offre">🗑️</button>
            </div>
            <div class="offer-inputs">
                <input type="number" placeholder="Coût Total (€)" class="offer-cost">
                <select class="offer-cost-type">
                    <option value="one">Paiement unique</option>
                    <option value="monthly">Mensuel</option>
                    <option value="quarterly">Trimestriel</option>
                    <option value="yearly">Annuel</option>
                </select>
                <input type="number" placeholder="Délai Interv. (heures)" class="offer-sla">
                <input type="number" placeholder="Score Matériel (/100)" class="offer-quality">
                <input type="number" placeholder="Votre Ressenti (/100)" class="offer-feeling">
            </div>
            <div class="extra-costs-list"></div>
            <button class="add-extra-cost-btn" type="button">+ Ajouter un coût supplémentaire</button>
        `;
        offersContainer.appendChild(offerCard);
        // Ajout du gestionnaire de suppression
        offerCard.querySelector('.delete-offer-btn').addEventListener('click', () => {
            offerCard.remove();
        });
        // Ajout du gestionnaire d'ajout de coût supplémentaire
        setupExtraCostHandlers(offerCard);
        nextOfferId++;
    });

    // Pour la première offre statique
    setupExtraCostHandlers(offersContainer.querySelector('.offer-card'));

    function setupExtraCostHandlers(offerCard) {
        const addBtn = offerCard.querySelector('.add-extra-cost-btn');
        const list = offerCard.querySelector('.extra-costs-list');
        let template = document.querySelector('.extra-cost-template');
        if (!template) {
            // fallback: create template if not present (should not happen)
            template = document.createElement('template');
            template.innerHTML = `<div class='extra-cost-row'>...</div>`;
        }
        addBtn.addEventListener('click', () => {
            const row = template.content.cloneNode(true).firstElementChild;
            row.querySelector('.remove-extra-cost-btn').addEventListener('click', () => row.remove());
            list.appendChild(row);
        });
    }

    // --- Groupage des offres sélectionnées ---
    groupOffersBtn.addEventListener('click', () => {
        const selected = Array.from(offersContainer.querySelectorAll('.offer-group-checkbox:checked'));
        if (selected.length < 2) {
            alert('Sélectionnez au moins deux offres à regrouper.');
            return;
        }
        let totalCost = 0, maxSla = 0, totalQuality = 0, totalFeeling = 0;
        const groupMemberIds = [], groupMemberNames = [];
        selected.forEach(checkbox => {
            const card = checkbox.closest('.offer-card');
            groupMemberIds.push(card.dataset.id);
            groupMemberNames.push(card.querySelector('.offer-name').value || `Offre ${card.dataset.id}`);
            totalCost += parseFloat(card.querySelector('.offer-cost').value) || 0;
            maxSla = Math.max(maxSla, parseFloat(card.querySelector('.offer-sla').value) || 0);
            totalQuality += parseFloat(card.querySelector('.offer-quality').value) || 0;
            totalFeeling += parseFloat(card.querySelector('.offer-feeling').value) || 0;
            card.classList.add('hidden');
            checkbox.checked = false;
        });
        const groupId = `group-${nextGroupId++}`;
        const template = document.getElementById('grouped-offer-template');
        const groupedCard = template.content.cloneNode(true).firstElementChild;
        groupedCard.dataset.groupId = groupId;
        groupedCard.dataset.memberIds = JSON.stringify(groupMemberIds);
        groupedCard.dataset.baseCost = totalCost;
        groupedCard.dataset.baseSla = maxSla;
        groupedCard.dataset.baseQuality = totalQuality / selected.length;
        groupedCard.dataset.baseFeeling = totalFeeling / selected.length;
        groupedCard.querySelector('.lot-title').textContent = `Lot: ${groupMemberNames.join(' + ')}`;
        groupedCard.querySelector('.lot-cost').textContent = totalCost.toFixed(2);
        groupedCard.querySelector('.lot-sla').textContent = maxSla.toFixed(2);
        groupedCard.querySelector('.lot-quality').textContent = (totalQuality / selected.length).toFixed(2);
        groupedCard.querySelector('.lot-feeling').textContent = (totalFeeling / selected.length).toFixed(2);
        groupedCard.querySelector('.ungroup-btn').addEventListener('click', () => {
            JSON.parse(groupedCard.dataset.memberIds).forEach(id => {
                const offerToUnhide = offersContainer.querySelector(`.offer-card[data-id="${id}"]`);
                if (offerToUnhide) offerToUnhide.classList.remove('hidden');
            });
            groupedCard.remove();
        });
        offersContainer.appendChild(groupedCard);
    });

    // --- Fonctions utilitaires ---
    function getOffersData() {
        const data = [];
        offersContainer.querySelectorAll('.offer-card:not(.hidden)').forEach(card => {
            const name = card.querySelector('.offer-name').value || `Offre ${card.dataset.id}`;
            const cost = parseFloat(card.querySelector('.offer-cost').value) || 0;
            const costType = card.querySelector('.offer-cost-type').value;
            let costTotal = convertToYearly(cost, 1, costType);
            // Extra costs
            const extraCosts = [];
            card.querySelectorAll('.extra-cost-row').forEach(row => {
                const amount = parseFloat(row.querySelector('.extra-cost-amount').value) || 0;
                const freq = parseInt(row.querySelector('.extra-cost-frequency').value) || 1;
                const period = row.querySelector('.extra-cost-period').value;
                const note = row.querySelector('.extra-cost-note').value || '';
                extraCosts.push({ amount, frequency: freq, period, note });
                costTotal += convertToYearly(amount, freq, period);
            });
            const sla = parseFloat(card.querySelector('.offer-sla').value);
            const quality = parseFloat(card.querySelector('.offer-quality').value);
            const feeling = parseFloat(card.querySelector('.offer-feeling').value);
            // New contract meta fields
            const note = card.querySelector('.contract-note')?.value || '';
            const engagement = parseInt(card.querySelector('.contract-engagement')?.value) || 0;
            const penalty = parseFloat(card.querySelector('.contract-penalty')?.value) || 0;
            const cancelDelay = parseInt(card.querySelector('.contract-cancel-delay')?.value) || 0;
            if (![sla, quality, feeling].some(isNaN)) {
                data.push({ name, cost: costTotal, sla, quality, feeling, note, engagement, penalty, cancelDelay, extraCosts });
            }
        });
        offersContainer.querySelectorAll('.grouped-offer-card').forEach(card => {
            const discount = parseFloat(card.querySelector('.lot-discount-input').value) || 0;
            const baseCost = parseFloat(card.dataset.baseCost);
            const cost = baseCost * (1 - discount / 100);
            data.push({
                name: card.querySelector('.lot-title').textContent,
                cost: cost,
                sla: parseFloat(card.dataset.baseSla),
                quality: parseFloat(card.dataset.baseQuality),
                feeling: parseFloat(card.dataset.baseFeeling)
            });
        });
        return data;
    }

    function convertToYearly(amount, freq, period) {
        switch(period) {
            case 'monthly': return amount * freq * 12;
            case 'quarterly': return amount * freq * 4;
            case 'yearly': return amount * freq;
            case 'one': return amount * freq;
            default: return 0;
        }
    }

    function getWeights() {
        return {
            cost: parseInt(document.getElementById('weight-cost').value),
            sla: parseInt(document.getElementById('weight-sla').value),
            quality: parseInt(document.getElementById('weight-quality').value),
            feeling: parseInt(document.getElementById('weight-feeling').value),
        };
    }

    function calculateScores(offers, weights) {
        const costs = offers.map(o => o.cost);
        const slas = offers.map(o => o.sla);
        const minCost = Math.min(...costs);
        const maxCost = Math.max(...costs);
        const minSla = Math.min(...slas);
        const maxSla = Math.max(...slas);
        const normalize = (value, min, max, invert = false) => {
            if (max === min) return 100;
            const score = ((value - min) / (max - min)) * 100;
            return invert ? 100 - score : score;
        };
        return offers.map(offer => {
            const scoreCost = normalize(offer.cost, minCost, maxCost, true);
            const scoreSla = normalize(offer.sla, minSla, maxSla, true);
            const scoreQuality = offer.quality;
            const scoreFeeling = offer.feeling;
            const totalWeight = weights.cost + weights.sla + weights.quality + weights.feeling;
            if (totalWeight === 0) return { ...offer, finalScore: 0, scores: { scoreCost, scoreSla, scoreQuality, scoreFeeling } };
            const finalScore = ((scoreCost * weights.cost) + (scoreSla * weights.sla) + (scoreQuality * weights.quality) + (scoreFeeling * weights.feeling)) / totalWeight;
            return { ...offer, finalScore, scores: { scoreCost, scoreSla, scoreQuality, scoreFeeling } };
        });
    }

    function updateCharts(results) {
        const barCtx = document.getElementById('bar-chart')?.getContext('2d');
        const radarCtx = document.getElementById('radar-chart')?.getContext('2d');
        if (!barCtx || !radarCtx) return;
        if (barChart) barChart.destroy();
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: results.map(r => r.name),
                datasets: [{
                    label: 'Score Final (/100)',
                    data: results.map(r => r.finalScore.toFixed(2)),
                    backgroundColor: 'rgba(0, 123, 255, 0.7)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
        });
        if (radarChart) radarChart.destroy();
        radarChart = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Coût', 'Service (SLA)', 'Matériel', 'Ressenti'],
                datasets: results.map((r, index) => {
                    const colors = ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)'];
                    return {
                        label: r.name,
                        data: [r.scores.scoreCost, r.scores.scoreSla, r.scores.scoreQuality, r.scores.scoreFeeling].map(Number),
                        backgroundColor: colors[index % colors.length],
                        borderColor: colors[index % colors.length].replace('0.5', '1')
                    };
                })
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { r: { angleLines: { display: true }, suggestedMin: 0, suggestedMax: 100 } } }
        });
    }

    // --- Export CSV ---
    exportBtn.addEventListener('click', () => {
        const offersData = getOffersData();
        if (offersData.length === 0) {
            alert("Rien à exporter.");
            return;
        }
        // Export all fields, including meta and extra costs as JSON
        const exportData = offersData.map(d => ({
            name: d.name,
            cost: d.cost,
            sla: d.sla,
            quality: d.quality,
            feeling: d.feeling,
            note: d.note,
            engagement: d.engagement,
            penalty: d.penalty,
            cancelDelay: d.cancelDelay,
            extraCosts: d.extraCosts ? JSON.stringify(d.extraCosts) : ''
        }));
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'export.php';
        const dataInput = document.createElement('input');
        dataInput.type = 'hidden';
        dataInput.name = 'export_data';
        dataInput.value = JSON.stringify(exportData);
        form.appendChild(dataInput);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    });

    // --- Import CSV/JSON ---
    const importBtn = document.createElement('button');
    importBtn.textContent = 'Importer CSV/JSON';
    importBtn.id = 'import-csv-btn';
    importBtn.style.marginLeft = '10px';
    document.querySelector('.results-actions').appendChild(importBtn);
    importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                let data;
                try {
                    if (file.name.endsWith('.json')) {
                        data = JSON.parse(evt.target.result);
                    } else {
                        // Simple CSV to JSON (assume ; separator)
                        const lines = evt.target.result.split(/\r?\n/).filter(Boolean);
                        const headers = lines[0].split(';');
                        data = lines.slice(1).map(line => {
                            const values = line.split(';');
                            const obj = {};
                            headers.forEach((h, i) => obj[h.trim()] = values[i]);
                            return obj;
                        });
                    }
                } catch (e) { alert('Erreur de lecture du fichier.'); return; }
                // Clear current offers
                offersContainer.innerHTML = '';
                data.forEach((d, idx) => {
                    const offerCard = document.createElement('div');
                    offerCard.className = 'offer-card';
                    offerCard.dataset.id = idx + 1;
                    offerCard.innerHTML = `
                        <div class="offer-header">
                            <input type="checkbox" class="offer-group-checkbox" title="Sélectionner pour regrouper">
                            <input type="text" placeholder="Nom de l'offre (ex: Contrat A)" class="offer-name" value="${d.name || ''}">
                            <button class="delete-offer-btn" title="Supprimer l'offre" aria-label="Supprimer l'offre">🗑️</button>
                        </div>
                        <div class="offer-inputs">
                            <input type="number" placeholder="Coût Total (€)" class="offer-cost" value="${d.cost || ''}">
                            <select class="offer-cost-type"><option value="one">Paiement unique</option><option value="monthly">Mensuel</option><option value="quarterly">Trimestriel</option><option value="yearly">Annuel</option></select>
                            <input type="number" placeholder="Délai Interv. (heures)" class="offer-sla" value="${d.sla || ''}">
                            <input type="number" placeholder="Score Matériel (/100)" class="offer-quality" value="${d.quality || ''}">
                            <input type="number" placeholder="Votre Ressenti (/100)" class="offer-feeling" value="${d.feeling || ''}">
                        </div>
                        <div class="contract-details">
                            <textarea class="contract-note" placeholder="Note sur le contrat (ex: particularités, remarques...)" rows="2">${d.note || ''}</textarea>
                            <div class="contract-meta">
                                <input type="number" class="contract-engagement" min="0" placeholder="Durée d'engagement (mois)" value="${d.engagement || ''}">
                                <input type="number" class="contract-penalty" min="0" placeholder="Pénalités de résiliation (€)" value="${d.penalty || ''}">
                                <input type="number" class="contract-cancel-delay" min="0" placeholder="Préavis avant résiliation (jours)" value="${d.cancelDelay || ''}">
                            </div>
                        </div>
                        <div class="extra-costs-list"></div>
                        <button class="add-extra-cost-btn" type="button">+ Ajouter un coût supplémentaire</button>
                        <template class="extra-cost-template">
                            <div class="extra-cost-row">
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
                            </div>
                        </template>
                    `;
                    offersContainer.appendChild(offerCard);
                    offerCard.querySelector('.delete-offer-btn').addEventListener('click', () => offerCard.remove());
                    setupExtraCostHandlers(offerCard);
                    // Restore extra costs if present
                    if (d.extraCosts) {
                        let extraCostsArr = [];
                        try { extraCostsArr = typeof d.extraCosts === 'string' ? JSON.parse(d.extraCosts) : d.extraCosts; } catch {}
                        extraCostsArr.forEach(ec => {
                            const addBtn = offerCard.querySelector('.add-extra-cost-btn');
                            addBtn.click();
                            const lastRow = offerCard.querySelector('.extra-costs-list .extra-cost-row:last-child');
                            if (lastRow) {
                                lastRow.querySelector('.extra-cost-amount').value = ec.amount || '';
                                lastRow.querySelector('.extra-cost-frequency').value = ec.frequency || 1;
                                lastRow.querySelector('.extra-cost-period').value = ec.period || 'one';
                                lastRow.querySelector('.extra-cost-note').value = ec.note || '';
                            }
                        });
                    }
                });
            };
            reader.readAsText(file);
        });
        input.click();
    });

    // --- Calcul des scores ---
    calculateBtn.addEventListener('click', () => {
        const offersData = getOffersData();
        if (offersData.length === 0) {
            alert("Aucune offre valide à évaluer.");
            return;
        }
        const weights = getWeights();
        const results = calculateScores(offersData, weights);
        // Affichage des résultats dans le tableau
        const resultsTable = document.getElementById('results-table');
        resultsTable.innerHTML = `
            <tr>
                <th>Offre</th>
                <th>Coût (€)</th>
                <th>Délai (h)</th>
                <th>Qualité</th>
                <th>Ressenti</th>
                <th>Score Final</th>
            </tr>
        `;
        results.forEach(r => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${r.name}</td>
                <td>${r.cost.toFixed(2)}</td>
                <td>${r.sla.toFixed(2)}</td>
                <td>${r.quality.toFixed(2)}</td>
                <td>${r.feeling.toFixed(2)}</td>
                <td>${r.finalScore.toFixed(2)}</td>
            `;
            resultsTable.appendChild(row);
        });
        updateCharts(results);
    });

    // --- Contract type dropdown and tips logic ---
    const contractTypeSelect = document.getElementById('contract-type-select');
    const contractTypeTips = document.getElementById('contract-type-tips');
    const addDefaultOfferBtn = document.getElementById('add-default-offer-btn');
    let contractTypeData = [];

    // Simple CSV parser for ; separated values
    function parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) return [];
        const headers = lines[0].split(';').map(h => h.trim());
        return lines.slice(1).map(line => {
            const values = line.split(';');
            const obj = {};
            headers.forEach((h, i) => obj[h] = values[i] || '');
            return obj;
        });
    }

    // Load contract types from data.csv
    fetch('data.csv')
        .then(r => r.text())
        .then(text => {
            contractTypeData = parseCSV(text);
            contractTypeSelect.innerHTML = '<option value="">-- Choisir un type --</option>' +
                contractTypeData.map(d => `<option value="${d.type}">${d.type}</option>`).join('');
        });

    contractTypeSelect.addEventListener('change', () => {
        const type = contractTypeSelect.value;
        const found = contractTypeData.find(d => d.type === type);
        contractTypeTips.textContent = found && found.tips ? `Conseils : ${found.tips}` : '';
    });

    addDefaultOfferBtn.addEventListener('click', () => {
        const type = contractTypeSelect.value;
        if (!type) return;
        const found = contractTypeData.find(d => d.type === type);
        if (!found) return;
        // Add a new offer pre-filled with defaults
        const offerCard = document.createElement('div');
        offerCard.className = 'offer-card';
        offerCard.dataset.id = nextOfferId;
        offerCard.innerHTML = `
            <div class="offer-header">
                <input type="checkbox" class="offer-group-checkbox" title="Sélectionner pour regrouper">
                <input type="text" placeholder="Nom de l'offre (ex: Contrat A)" class="offer-name" value="${found.defaultName || type}">
                <button class="delete-offer-btn" title="Supprimer l'offre" aria-label="Supprimer l'offre">🗑️</button>
            </div>
            <div class="offer-inputs">
                <input type="number" placeholder="Coût Total (€)" class="offer-cost" value="${found.defaultCost || ''}">
                <select class="offer-cost-type">
                    <option value="one">Paiement unique</option>
                    <option value="monthly"${found.defaultCostType==='monthly'?' selected':''}>Mensuel</option>
                    <option value="quarterly"${found.defaultCostType==='quarterly'?' selected':''}>Trimestriel</option>
                    <option value="yearly"${found.defaultCostType==='yearly'?' selected':''}>Annuel</option>
                </select>
                <input type="number" placeholder="Délai Interv. (heures)" class="offer-sla" value="${found.defaultSla || ''}">
                <input type="number" placeholder="Score Matériel (/100)" class="offer-quality" value="${found.defaultQuality || ''}">
                <input type="number" placeholder="Votre Ressenti (/100)" class="offer-feeling" value="${found.defaultFeeling || ''}">
            </div>
            <div class="contract-details">
                <textarea class="contract-note" placeholder="Note sur le contrat (ex: particularités, remarques...)" rows="2">${found.defaultNote || ''}</textarea>
                <div class="contract-meta">
                    <input type="number" class="contract-engagement" min="0" placeholder="Durée d'engagement (mois)" value="${found.defaultEngagement || ''}">
                    <input type="number" class="contract-penalty" min="0" placeholder="Pénalités de résiliation (€)" value="${found.defaultPenalty || ''}">
                    <input type="number" class="contract-cancel-delay" min="0" placeholder="Préavis avant résiliation (jours)" value="${found.defaultCancelDelay || ''}">
                </div>
            </div>
            <div class="extra-costs-list"></div>
            <button class="add-extra-cost-btn" type="button">+ Ajouter un coût supplémentaire</button>
            <template class="extra-cost-template">
                <div class="extra-cost-row">
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
                </div>
            </template>
        `;
        offersContainer.appendChild(offerCard);
        offerCard.querySelector('.delete-offer-btn').addEventListener('click', () => offerCard.remove());
        setupExtraCostHandlers(offerCard);
        nextOfferId++;
    });

    // --- Fonctions existantes (getOffersData, convertToYearly, getWeights, calculateScores, updateCharts) ---

    function getOffersData() {
        const data = [];
        offersContainer.querySelectorAll('.offer-card:not(.hidden)').forEach(card => {
            const name = card.querySelector('.offer-name').value || `Offre ${card.dataset.id}`;
            const cost = parseFloat(card.querySelector('.offer-cost').value) || 0;
            const costType = card.querySelector('.offer-cost-type').value;
            let costTotal = convertToYearly(cost, 1, costType);
            // Extra costs
            const extraCosts = [];
            card.querySelectorAll('.extra-cost-row').forEach(row => {
                const amount = parseFloat(row.querySelector('.extra-cost-amount').value) || 0;
                const freq = parseInt(row.querySelector('.extra-cost-frequency').value) || 1;
                const period = row.querySelector('.extra-cost-period').value;
                const note = row.querySelector('.extra-cost-note').value || '';
                extraCosts.push({ amount, frequency: freq, period, note });
                costTotal += convertToYearly(amount, freq, period);
            });
            const sla = parseFloat(card.querySelector('.offer-sla').value);
            const quality = parseFloat(card.querySelector('.offer-quality').value);
            const feeling = parseFloat(card.querySelector('.offer-feeling').value);
            // New contract meta fields
            const note = card.querySelector('.contract-note')?.value || '';
            const engagement = parseInt(card.querySelector('.contract-engagement')?.value) || 0;
            const penalty = parseFloat(card.querySelector('.contract-penalty')?.value) || 0;
            const cancelDelay = parseInt(card.querySelector('.contract-cancel-delay')?.value) || 0;
            if (![sla, quality, feeling].some(isNaN)) {
                data.push({ name, cost: costTotal, sla, quality, feeling, note, engagement, penalty, cancelDelay, extraCosts });
            }
        });
        offersContainer.querySelectorAll('.grouped-offer-card').forEach(card => {
            const discount = parseFloat(card.querySelector('.lot-discount-input').value) || 0;
            const baseCost = parseFloat(card.dataset.baseCost);
            const cost = baseCost * (1 - discount / 100);
            data.push({
                name: card.querySelector('.lot-title').textContent,
                cost: cost,
                sla: parseFloat(card.dataset.baseSla),
                quality: parseFloat(card.dataset.baseQuality),
                feeling: parseFloat(card.dataset.baseFeeling)
            });
        });
        return data;
    }

    function convertToYearly(amount, freq, period) {
        switch(period) {
            case 'monthly': return amount * freq * 12;
            case 'quarterly': return amount * freq * 4;
            case 'yearly': return amount * freq;
            case 'one': return amount * freq;
            default: return 0;
        }
    }

    function getWeights() {
        return {
            cost: parseInt(document.getElementById('weight-cost').value),
            sla: parseInt(document.getElementById('weight-sla').value),
            quality: parseInt(document.getElementById('weight-quality').value),
            feeling: parseInt(document.getElementById('weight-feeling').value),
        };
    }

    function calculateScores(offers, weights) {
        const costs = offers.map(o => o.cost);
        const slas = offers.map(o => o.sla);
        const minCost = Math.min(...costs);
        const maxCost = Math.max(...costs);
        const minSla = Math.min(...slas);
        const maxSla = Math.max(...slas);
        const normalize = (value, min, max, invert = false) => {
            if (max === min) return 100;
            const score = ((value - min) / (max - min)) * 100;
            return invert ? 100 - score : score;
        };
        return offers.map(offer => {
            const scoreCost = normalize(offer.cost, minCost, maxCost, true);
            const scoreSla = normalize(offer.sla, minSla, maxSla, true);
            const scoreQuality = offer.quality;
            const scoreFeeling = offer.feeling;
            const totalWeight = weights.cost + weights.sla + weights.quality + weights.feeling;
            if (totalWeight === 0) return { ...offer, finalScore: 0, scores: { scoreCost, scoreSla, scoreQuality, scoreFeeling } };
            const finalScore = ((scoreCost * weights.cost) + (scoreSla * weights.sla) + (scoreQuality * weights.quality) + (scoreFeeling * weights.feeling)) / totalWeight;
            return { ...offer, finalScore, scores: { scoreCost, scoreSla, scoreQuality, scoreFeeling } };
        });
    }

    function updateCharts(results) {
        const barCtx = document.getElementById('bar-chart')?.getContext('2d');
        const radarCtx = document.getElementById('radar-chart')?.getContext('2d');
        if (!barCtx || !radarCtx) return;
        if (barChart) barChart.destroy();
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: results.map(r => r.name),
                datasets: [{
                    label: 'Score Final (/100)',
                    data: results.map(r => r.finalScore.toFixed(2)),
                    backgroundColor: 'rgba(0, 123, 255, 0.7)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
        });
        if (radarChart) radarChart.destroy();
        radarChart = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Coût', 'Service (SLA)', 'Matériel', 'Ressenti'],
                datasets: results.map((r, index) => {
                    const colors = ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)'];
                    return {
                        label: r.name,
                        data: [r.scores.scoreCost, r.scores.scoreSla, r.scores.scoreQuality, r.scores.scoreFeeling].map(Number),
                        backgroundColor: colors[index % colors.length],
                        borderColor: colors[index % colors.length].replace('0.5', '1')
                    };
                })
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { r: { angleLines: { display: true }, suggestedMin: 0, suggestedMax: 100 } } }
        });
    }

    console.log("Outil d'aide à la décision initialisé et prêt.");
});