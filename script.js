document.addEventListener('DOMContentLoaded', () => {
    // --- Sélection des éléments DOM ---
    // --- Constants ---
    const DATA_CSV_PATH = 'data.csv';

    // --- Cached DOM Elements ---
    const DOM = {
        calculateBtn: document.getElementById('calculate-btn'),
        exportCsvBtn: document.getElementById('export-csv-btn'), // Renamed from exportBtn for clarity
        addOfferBtn: document.getElementById('add-offer-btn'),
        groupOffersBtn: document.getElementById('group-offers-btn'),
        offersContainer: document.getElementById('offers-container'),
        contractTypeSelect: document.getElementById('contract-type-select'),
        contractTypeTips: document.getElementById('contract-type-tips'),
        addDefaultOfferBtn: document.getElementById('add-default-offer-btn'),
    };

    let nextOfferId = 2;
    let nextGroupId = 1; // For grouping offers
    const CSV_SEPARATOR = ';';
    const MAX_EXTRA_OPTIONS = 10;

    // --- Ajout d'une nouvelle offre ---
    DOM.addOfferBtn.addEventListener('click', () => {
        const offerCardTemplate = document.querySelector('#offer-card-template');
        if (!offerCardTemplate) {
            window.liveLog('Template #offer-card-template non trouvé.', 'error');
            return;
        }
        const offerCard = offerCardTemplate.content.cloneNode(true).firstElementChild;
        offerCard.dataset.id = nextOfferId++;
        DOM.offersContainer.appendChild(offerCard);
        updateAllViews();
    });

    // --- Event Delegation for dynamically added elements ---
    DOM.offersContainer.addEventListener('click', (e) => {
        // Delete Offer Button
        if (e.target.classList.contains('delete-offer-btn')) {
            e.target.closest('.offer-card')?.remove();
            updateAllViews();
        }

        // Remove Extra Cost Button
        if (e.target.classList.contains('remove-extra-cost-btn')) {
            e.target.closest('.extra-cost-row')?.remove();
            updateAllViews();
        }

        // Add Extra Cost Button
        if (e.target.classList.contains('add-extra-cost-btn')) {
            const offerCard = e.target.closest('.offer-card');
            if (!offerCard) return;
            const list = offerCard.querySelector('.extra-costs-list');
            let template = document.querySelector('#extra-cost-template'); // Use ID for template
            if (!template) { // Fallback if template not in HTML
                template = createExtraCostTemplate();
            }
            const row = template.content.cloneNode(true).firstElementChild;
            list.appendChild(row);
            updateAllViews();
        }
    });

    // --- Groupage des offres sélectionnées ---
    DOM.groupOffersBtn.addEventListener('click', () => {
        const selected = Array.from(DOM.offersContainer.querySelectorAll('.offer-group-checkbox:checked'));
        if (selected.length < 2) {
            alert('Sélectionnez au moins deux offres à regrouper.');
            window.liveLog('Sélectionnez au moins deux offres à regrouper.', 'warn');
            return;
        }

        let totalCost = 0, totalSla = 0, totalQuality = 0, totalFeeling = 0;
        const memberIds = [];
        selected.forEach(checkbox => {
            const card = checkbox.closest('.offer-card');
            if (card) {
                const offerData = getOfferDataFromCard(card); // Helper to get data from a single card
                totalCost += offerData.cost;
                totalSla += offerData.sla;
                totalQuality += offerData.quality;
                totalFeeling += offerData.feeling;
                memberIds.push(card.dataset.id);
                card.classList.add('hidden'); // Hide selected offers
            }
        });

        const groupedCard = document.createElement('div');
        groupedCard.className = 'grouped-offer-card';
        groupedCard.dataset.id = nextGroupId++;
        groupedCard.dataset.memberIds = JSON.stringify(memberIds);
        groupedCard.dataset.baseCost = totalCost;
        groupedCard.dataset.baseSla = totalSla;
        groupedCard.dataset.baseQuality = totalQuality;
        groupedCard.dataset.baseFeeling = totalFeeling;

        groupedCard.innerHTML = `
            <div class="offer-header">
                <span class="lot-title">Lot groupé ${groupedCard.dataset.id}</span>
                <button class="ungroup-btn" title="Dégrouper les offres" aria-label="Dégrouper les offres">↩️</button>
            </div>
            <div class="offer-inputs">
                <label>Coût Total: <span class="lot-cost">${totalCost.toFixed(2)}</span> €</label>
                <label>Délai Interv.: <span class="lot-sla">${(totalSla / selected.length).toFixed(2)}</span> h</label>
                <label>Score Matériel: <span class="lot-quality">${(totalQuality / selected.length).toFixed(2)}</span> /100</label>
                <label>Ressenti: <span class="lot-feeling">${(totalFeeling / selected.length).toFixed(2)}</span> /100</label>
            </div>
            <div class="contract-details">
                <label>Remise:
                    <input type="number" class="lot-discount-input" value="0" min="0">
                    <select class="lot-discount-type">
                        <option value="percent">%</option>
                        <option value="amount">€</option>
                    </select>
                </label>
            </div>
        `;

        // Add event listener for ungrouping
        groupedCard.querySelector('.ungroup-btn').addEventListener('click', () => {
            JSON.parse(groupedCard.dataset.memberIds).forEach(id => {
                const offerToUnhide = DOM.offersContainer.querySelector(`.offer-card[data-id="${id}"]`);
                if (offerToUnhide) offerToUnhide.classList.remove('hidden'); // Show hidden offers
            });
            groupedCard.remove();
            updateAllViews();
        });

        // Add event listener for discount input
        groupedCard.querySelector('.lot-discount-input').addEventListener('input', updateAllViews);
        groupedCard.querySelector('.lot-discount-type').addEventListener('change', updateAllViews);

        DOM.offersContainer.appendChild(groupedCard);
        updateAllViews();
    });

    // --- Fonctions utilitaires ---
    function getOffersData() { // Consolidated function
        const offers = [];
        DOM.offersContainer.querySelectorAll('.offer-card').forEach(card => {
            if (card.classList.contains('hidden')) return;
            offers.push(getOfferDataFromCard(card));
        });

        // Handle grouped offers (they are not part of the 'offer-card' class)
        DOM.offersContainer.querySelectorAll('.grouped-offer-card').forEach(card => {
            const discount = parseFloat(card.querySelector('.lot-discount-input')?.value) || 0;
            const discountType = card.querySelector('.lot-discount-type')?.value || 'percent';
            const baseCost = parseFloat(card.dataset.baseCost);
            let cost = baseCost;
            if (discountType === 'amount') {
                cost = baseCost - discount;
            } else {
                cost = baseCost * (1 - discount / 100);
            }
            offers.push({
                name: card.querySelector('.lot-title')?.textContent || '',
                cost: cost,
                sla: parseFloat(card.dataset.baseSla) || 0,
                quality: parseFloat(card.dataset.baseQuality) || 0,
                feeling: parseFloat(card.dataset.baseFeeling) || 0
            });
            // Grouped offers don't have extra options, sysdate, etc. in this model.
            // They are simplified representations.
        });
        return offers;
    }

    // Helper function to extract data from a single offer card
    function getOfferDataFromCard(card) {
        const name = card.querySelector('.offer-name')?.value || '';
        const cost = parseFloat(card.querySelector('.offer-cost')?.value) || 0;
        const costType = card.querySelector('.offer-cost-type')?.value || 'one';
        let costTotal = convertToYearly(cost, 1, costType);

        const extraOptions = [];
        card.querySelectorAll('.extra-cost-row').forEach(row => {
            const amount = parseFloat(row.querySelector('.extra-cost-amount')?.value) || '';
            const freq = parseInt(row.querySelector('.extra-cost-frequency')?.value) || 1;
            const period = row.querySelector('.extra-cost-period')?.value || 'one';
            const note = row.querySelector('.extra-cost-note')?.value || '';
            extraOptions.push({ amount, frequency: freq, period, note });
            costTotal += convertToYearly(parseFloat(amount) || 0, freq, period);
        });
        // Ensure MAX_EXTRA_OPTIONS are always present for consistent CSV/table output
        while(extraOptions.length < MAX_EXTRA_OPTIONS) extraOptions.push({amount:'',note:''});

        const sla = parseFloat(card.querySelector('.offer-sla')?.value) || 0;
        const quality = parseFloat(card.querySelector('.offer-quality')?.value) || 0;
        const feeling = parseFloat(card.querySelector('.offer-feeling')?.value) || 0;
        const note = card.querySelector('.contract-note')?.value || '';
        const engagement = parseInt(card.querySelector('.contract-engagement')?.value) || 0;
        const penalty = parseFloat(card.querySelector('.contract-penalty')?.value) || 0;
        const cancelDelay = parseInt(card.querySelector('.contract-cancel-delay')?.value) || 0;

        let sysdate = card.dataset.sysdate;
        if (!sysdate) { sysdate = getSysdate(); card.dataset.sysdate = sysdate; }

        return { name, cost: costTotal, costType, sla, quality, feeling, note, engagement, penalty, cancelDelay, extraOptions, sysdate };
    }

    function convertToYearly(amount, freq, period) {
        switch (period) {
            case 'one': return amount;
            case 'monthly': return amount * freq * 12;
            case 'quarterly': return amount * freq * 4;
            case 'yearly': return amount * freq;
            default: return amount;
        }
    }

    function generateCsvString(offersData) {
        if (offersData.length === 0) {
            return '';
        }
        // Headers for the CSV
        let headers = ["Nom de l'offre","Coût Total (€)","Type coût","Délai Interv. (h)","Score Matériel","Ressenti","Note","Engagement (mois)","Pénalités (€)","Préavis (jours)"];
        for(let i=1;i<=MAX_EXTRA_OPTIONS;i++) { headers.push(`Option ${i} (€)`, `Option ${i} (desc.)`); }
        headers.push('Date création');

        // Map data to rows
        const rows = offersData.map(d => {
            let row = [
                d.name || '', d.cost || '', d.costType || '', d.sla || '', d.quality || '', d.feeling || '',
                d.note || '', d.engagement || '', d.penalty || '', d.cancelDelay || ''
            ];
            for(let i=0;i<MAX_EXTRA_OPTIONS;i++) {
                const opt = d.extraOptions[i] || {};
                row.push(opt.amount || '', opt.note || '');
            }
            row.push(d.sysdate || '');
            // Escape semicolons and quotes for CSV
            return row.map(x => (typeof x === 'string' && x.includes(CSV_SEPARATOR)) ? '"'+x.replace(/"/g,'""')+'"' : x);
        });
        return [headers.join(CSV_SEPARATOR), ...rows.map(r => r.join(CSV_SEPARATOR))].join('\n');
    }

    // --- Export CSV to Clipboard ---
    DOM.exportCsvBtn.addEventListener('click', () => {
        const offersData = getOffersData();
        if (offersData.length === 0) {
            alert("Rien à exporter.");
            window.liveLog("Rien à exporter.", 'warn');
            return;
        }
        const csv = generateCsvString(offersData);
        // Copier dans le presse-papiers
        navigator.clipboard.writeText(csv).then(() => {
            alert('Données copiées dans le presse-papiers !');
            window.liveLog('Données copiées dans le presse-papiers !', 'info');
        }, () => {
            alert('Erreur lors de la copie des données.');
            window.liveLog('Erreur lors de la copie des données.', 'error');
        });
    });

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

    // Chargement des types de contrats depuis data.csv et remplissage du datalist
    function loadContractTypes() {
        fetch('data.csv')
    // Load contract types from data.csv and populate datalist/dropdown
    async function loadContractTypesAndTips() {
        try {
            const response = await fetch(DATA_CSV_PATH);
            const text = await response.text();
            contractTypeData = parseCSV(text);

            // Populate the datalist for the input field (if present)
            const datalist = document.getElementById('contract-type-list');
            if (datalist) {
                datalist.innerHTML = '';
                contractTypeData.forEach(d => {
                    if (d.type) {
                        const opt = document.createElement('option');
                        opt.value = d.type;
                        datalist.appendChild(opt);
                    }
                });
            }

            // Populate the select dropdown
            DOM.contractTypeSelect.innerHTML = '<option value="">-- Choisir un type --</option>' +
                contractTypeData.map(d => `<option value="${d.type}">${d.type}</option>`).join('');

        } catch (error) {
            window.liveLog(`Erreur lors du chargement des types de contrats: ${error.message}`, 'error');
        }
    }

    // Affichage des tips si le type correspond à un modèle connu
    function updateContractTypeTips(inputValue) {
        const found = contractTypeData.find(d => d.type?.trim().toLowerCase() === inputValue.trim().toLowerCase());
        DOM.contractTypeTips.textContent = found && found.tips ? `Conseils : ${found.tips}` : '';
    }

    DOM.contractTypeSelect.addEventListener('change', () => {
        updateContractTypeTips(DOM.contractTypeSelect.value);
    });

    DOM.addDefaultOfferBtn.addEventListener('click', () => {
        const type = DOM.contractTypeSelect.value;
        if (!type) {
            window.liveLog('Veuillez choisir un type de contrat par défaut.', 'warn');
            return;
        }
        const found = contractTypeData.find(d => d.type === type);
        if (!found) {
            window.liveLog('Type de contrat par défaut non trouvé dans les données.', 'warn');
            return;
        }

        // Create a template for the offer card if it doesn't exist in HTML
        let offerCardTemplate = document.querySelector('#offer-card-template');
        if (!offerCardTemplate) {
            offerCardTemplate = document.createElement('template');
            offerCardTemplate.id = 'offer-card-template';
            offerCardTemplate.innerHTML = `
                <div class="offer-card">
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
                    <div class="contract-details">
                        <textarea class="contract-note" placeholder="Note sur le contrat (ex: particularités, remarques...)" rows="2"></textarea>
                        <div class="contract-meta">
                            <input type="number" class="contract-engagement" min="0" placeholder="Durée d'engagement (mois)">
                            <input type="number" class="contract-penalty" min="0" placeholder="Pénalités de résiliation (€)">
                            <input type="number" class="contract-cancel-delay" min="0" placeholder="Préavis avant résiliation (jours)">
                        </div>
                    </div>
                    <div class="extra-costs-list"></div>
                    <button class="add-extra-cost-btn" type="button">+ Ajouter un coût supplémentaire</button>
                </div>
            `;
            document.body.appendChild(offerCardTemplate); // Append to body, but it won't be visible
        }

        const offerCard = offerCardTemplate.content.cloneNode(true).firstElementChild;
        offerCard.dataset.id = nextOfferId;

        // Pre-fill fields
        offerCard.querySelector('.offer-name').value = found.defaultName || '';
        offerCard.querySelector('.offer-cost').value = found.defaultCost || '';
        // Select the correct cost type option
        const costTypeSelect = offerCard.querySelector('.offer-cost-type');
        if (found.defaultCostType) {
            const option = costTypeSelect.querySelector(`option[value="${found.defaultCostType}"]`);
            if (option) option.selected = true;
        }
        offerCard.querySelector('.offer-sla').value = found.defaultSla || '';
        offerCard.querySelector('.offer-quality').value = found.defaultQuality || '';
        offerCard.querySelector('.offer-feeling').value = found.defaultFeeling || '';
        offerCard.querySelector('.contract-note').value = found.defaultNote || '';
        offerCard.querySelector('.contract-engagement').value = found.defaultEngagement || '';
        offerCard.querySelector('.contract-penalty').value = found.defaultPenalty || '';
        offerCard.querySelector('.contract-cancel-delay').value = found.defaultCancelDelay || '';

        DOM.offersContainer.appendChild(offerCard); // Append the new offer card
        nextOfferId++;
        updateAllViews();
    });

    // Helper to create extra cost template if not in HTML
    function createExtraCostTemplate() {
        const template = document.createElement('template');
        template.id = 'extra-cost-template';
        template.innerHTML = `
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
        `;
        document.body.appendChild(template); // Append to body, but it won't be visible
        return template;
    }

    // Initial load of contract types
    loadContractTypesAndTips();

    const contractTypeInput = document.getElementById('contract-type-input'); // This is for the datalist input, not the select
    if (contractTypeInput) {
        contractTypeInput.addEventListener('input', (e) => updateContractTypeTips(e.target.value));
    }

    // --- Copier les données CSV dans le presse-papiers (consolidated with exportBtn) ---
    const copyBtn = document.getElementById('copy-csv-btn'); // This button seems redundant with exportCsvBtn
    const copyFeedback = document.getElementById('copy-feedback');
    if (copyBtn) { // If copyBtn exists, make it use the same logic as exportCsvBtn
        copyBtn.addEventListener('click', () => {
            DOM.exportCsvBtn.click(); // Trigger the exportCsvBtn click
            // Provide feedback specific to copyBtn if needed
            if (copyFeedback) {
                copyFeedback.textContent = 'Copié !';
                copyFeedback.style.display = 'block';
                setTimeout(() => { copyFeedback.style.display = 'none'; }, 2000);
            }
        });
    }

    // --- Live Log Utility ---
    // This function is self-contained and good as is.
    (function setupLiveLog() {
        let logDiv = document.getElementById('live-log');
        if (!logDiv) {
            logDiv = document.createElement('div');
            logDiv.id = 'live-log';
            logDiv.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0;
                background: rgba(30,30,30,0.97); color: #fff;
                font-size: 15px; padding: 8px 18px; z-index: 2000;
                max-height: 90px; overflow-y: auto; font-family: monospace;
                display: none;
            `;
            document.body.prepend(logDiv);
        }
        function logMsg(msg, type = 'info') {
            logDiv.style.display = 'block';
            const color = type === 'error' ? '#ff5252' : (type === 'warn' ? '#ffd600' : '#b2ff59');
            const prefix = type === 'error' ? '[ERREUR]' : type === 'warn' ? '[AVERT]' : '[INFO]';
            const line = document.createElement('div');
            line.innerHTML = `<span style="color:${color};font-weight:bold;">${prefix}</span> ${msg}`;
            logDiv.appendChild(line);
            logDiv.scrollTop = logDiv.scrollHeight;
            const timeout = type === 'info' ? 5000 : (type === 'warn' ? 10000 : 0);
            if (timeout > 0) {
                setTimeout(() => { line.remove(); if (!logDiv.hasChildNodes()) logDiv.style.display = 'none'; }, timeout);
            }
        }
        window.liveLog = logMsg;
    })();

    // Log each value added/modified (using event delegation)
    document.body.addEventListener('input', e => {
        const card = e.target.closest('.offer-card');
        if (card) {
            const name = card.querySelector('.offer-name')?.value || '';
            const cost = card.querySelector('.offer-cost')?.value || '';
            const options = Array.from(card.querySelectorAll('.extra-cost-row')).map(row => {
                return (row.querySelector('.extra-cost-amount')?.value || '') + ' ' + (row.querySelector('.extra-cost-note')?.value || '');
            }).filter(Boolean).join(' | ');
            window.liveLog && window.liveLog(`Saisie: Offre="${name}" Coût="${cost}" Options=[${options}]`);
        }
    });

    // --- Export PHP (téléchargement direct) ---
    function setupPhpExport() {
        const form = document.getElementById('php-export-form');
        const csvInput = document.getElementById('php-export-csv-input');
        const exportBtn = document.getElementById('php-export-btn');
        if (!form || !csvInput || !exportBtn) return;

        // Affiche le bouton si export.php existe (optionnel, can be removed if form is always visible)
        fetch('export.php', {method:'HEAD'}).then(resp => {
            if (resp.ok) form.style.display = '';
        }).catch(() => {
            // If export.php doesn't exist or fetch fails, hide the form
            form.style.display = 'none';
            window.liveLog('export.php non trouvé, le bouton d\'export PHP est désactivé.', 'warn');
        });

        exportBtn.addEventListener('click', function(e) {
            updateAllViews(); // force update just before export
            const csvData = generateCsvString(getOffersData());
            if (!csvData.trim()) {
                e.preventDefault();
                window.liveLog('Aucune donnée à exporter (CSV vide).', 'warn');
                return false;
            }
            csvInput.value = csvData;
        });
    }
    setupPhpExport(); // Call setup once

    // --- Ajout de la date de création à chaque offre ---
    function getSysdate() {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace('T', ' ');
    }

    // --- Génération du tableau des offres ---
    function renderOffersTable() {
        const container = document.getElementById('offers-table-container');
        if (!container) return; // Exit if container not found
        const offers = getOffersData(); // Use the consolidated function
        if (!offers.length) { container.innerHTML = '<em>Aucune offre saisie.</em>'; return; }

        let html = '<table style="width:100%;border-collapse:collapse;font-size:15px;">';
        html += '<thead><tr>';
        html += '<th>Nom de l\'offre</th><th>Coût Total (€)</th><th>Type coût</th><th>Délai Interv. (h)</th><th>Score Matériel</th><th>Ressenti</th><th>Note</th><th>Engagement (mois)</th><th>Pénalités (€)</th><th>Préavis (jours)</th>';
        for(let i=1;i<=MAX_EXTRA_OPTIONS;i++) html += `<th>Option ${i} (€)</th><th>Option ${i} (desc.)</th>`;
        html += '<th>Date création</th>';
        html += '</tr></thead><tbody>'; // Corrected closing tag

        for(const offer of offers) {
            html += '<tr>';
            html += `<td>${offer.name||''}</td><td>${offer.cost||''}</td><td>${offer.costType||''}</td><td>${offer.sla||''}</td><td>${offer.quality||''}</td><td>${offer.feeling||''}</td><td>${offer.note||''}</td><td>${offer.engagement||''}</td><td>${offer.penalty||''}</td><td>${offer.cancelDelay||''}</td>`;
            for(let i=0;i<MAX_EXTRA_OPTIONS;i++) {
                const opt = offer.extraOptions[i]||{};
                html += `<td>${opt.amount||''}</td><td>${opt.note||''}</td>`;
            }
            html += `<td>${offer.sysdate||''}</td>`;
            html += '</tr>';
        } // Missing closing brace for for loop
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    // --- Génération des données CSV/TSV en temps réel ---
    function renderRealtimeCsv() {
        const offers = getOffersData(); // Use the consolidated function
        const realtimeDiv = document.getElementById('realtime-csv-output');
        const phpExportInput = document.getElementById('php-export-csv-input');
        const csvPreview = document.getElementById('csv-preview'); // Assuming this is a textarea for preview

        const csvString = generateCsvString(offers); // Use the shared CSV generation function

        if (realtimeDiv) realtimeDiv.textContent = csvString;
        if (phpExportInput) phpExportInput.value = csvString;
        if (csvPreview) csvPreview.value = csvString;

        if (!offers.length) { // Clear outputs if no offers
            if (realtimeDiv) realtimeDiv.textContent = '';
            if (phpExportInput) phpExportInput.value = '';
            if (csvPreview) csvPreview.value = '';
        }
    }

    // --- Met à jour tout en temps réel ---
    function updateAllViews() {
        renderOffersTable();
        renderRealtimeCsv();
        enforceExtraOptionLimit();
    }

    // Listen for input/change events on the body to trigger updates
    ['input','change'].forEach(evt => {
        document.body.addEventListener(evt, e => {
            // Only update if the event originated from an offer card or grouped card
            if (e.target.closest('.offer-card') || e.target.closest('.grouped-offer-card')) {
                updateAllViews();
            }
        });
    });

    // Initial update when the page loads
    updateAllViews();

    // --- Limite le nombre d'options supplémentaires à 10 ---
    function enforceExtraOptionLimit() {
        document.querySelectorAll('.offer-card').forEach(card => {
            const addBtn = card.querySelector('.add-extra-cost-btn');
            const list = card.querySelector('.extra-costs-list');
            if (list && addBtn) {
                addBtn.disabled = list.querySelectorAll('.extra-cost-row').length >= MAX_EXTRA_OPTIONS;
            }
        });
    }
                d.extraCosts ? JSON.stringify(d.extraCosts) : ''
            ].map(x => (typeof x === 'string' && x.includes(';')) ? '"'+x.replace(/"/g,'""')+'"' : x));
            const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
            navigator.clipboard.writeText(csv).then(() => {
                copyFeedback.textContent = 'Copié !';
                copyFeedback.style.display = 'block';
                setTimeout(() => { copyFeedback.style.display = 'none'; }, 2000);
            }, () => {
                copyFeedback.textContent = 'Erreur lors de la copie.';
                copyFeedback.style.display = 'block';
                setTimeout(() => { copyFeedback.style.display = 'none'; }, 2000);
            });
        });
    }

    // --- Affichage des logs en temps réel en haut de page ---
    (function setupLiveLog() {
        let logDiv = document.getElementById('live-log');
        if (!logDiv) {
            logDiv = document.createElement('div');
            logDiv.id = 'live-log';
            logDiv.style.position = 'fixed';
            logDiv.style.top = '0';
            logDiv.style.left = '0';
            logDiv.style.right = '0';
            logDiv.style.background = 'rgba(30,30,30,0.97)';
            logDiv.style.color = '#fff';
            logDiv.style.fontSize = '15px';
            logDiv.style.padding = '8px 18px';
            logDiv.style.zIndex = '2000';
            logDiv.style.maxHeight = '90px';
            logDiv.style.overflowY = 'auto';
            logDiv.style.fontFamily = 'monospace';
            logDiv.style.display = 'none';
            document.body.prepend(logDiv);
        }
        function logMsg(msg, type = 'info') {
            logDiv.style.display = 'block';
            const color = type === 'error' ? '#ff5252' : (type === 'warn' ? '#ffd600' : '#b2ff59');
            const prefix = type === 'error' ? '[ERREUR]' : type === 'warn' ? '[AVERT]' : '[INFO]';
            const line = document.createElement('div');
            line.innerHTML = `<span style="color:${color};font-weight:bold;">${prefix}</span> ${msg}`;
            logDiv.appendChild(line);
            logDiv.scrollTop = logDiv.scrollHeight;
            if (type === 'info') setTimeout(() => { line.remove(); if (!logDiv.hasChildNodes()) logDiv.style.display = 'none'; }, 5000);
            if (type === 'warn') setTimeout(() => { line.remove(); if (!logDiv.hasChildNodes()) logDiv.style.display = 'none'; }, 10000);
        }
        window.liveLog = logMsg;
    })();

    // Log chaque valeur ajoutée/modifiée
    document.body.addEventListener('input', e => {
        const card = e.target.closest('.offer-card');
        if (card) {
            const name = card.querySelector('.offer-name')?.value || '';
            const cost = card.querySelector('.offer-cost')?.value || '';
            const options = Array.from(card.querySelectorAll('.extra-cost-row')).map(row => {
                return (row.querySelector('.extra-cost-amount')?.value || '') + ' ' + (row.querySelector('.extra-cost-note')?.value || '');
            }).filter(Boolean).join(' | ');
            window.liveLog && window.liveLog(`Saisie: Offre="${name}" Coût="${cost}" Options=[${options}]`);
        }
    });

    // --- Export PHP (téléchargement direct) ---
    function setupPhpExport() {
        const form = document.getElementById('php-export-form');
        const csvInput = document.getElementById('php-export-csv-input');
        const exportBtn = document.getElementById('php-export-btn');
        if (!form || !csvInput || !exportBtn) return;
        // Affiche le bouton si export.php existe (optionnel)
        fetch('export.php', {method:'HEAD'}).then(resp => {
            if (resp.ok) form.style.display = '';
        });
        exportBtn.addEventListener('click', function(e) {
            const csvOutput = document.getElementById('csv-output');
            if (!csvOutput || !csvOutput.value.trim()) {
                e.preventDefault();
                window.liveLog('Aucune donnée à exporter.', 'warn');
                return false;
            }
            csvInput.value = csvOutput.value;
        });
    }
    setupPhpExport();

    // --- Ajout de la date de création à chaque offre ---
    function getSysdate() {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace('T', ' ');
    }

    // --- Génération du tableau des offres ---
    function renderOffersTable() {
        const container = document.getElementById('offers-table-container');
        if (!container) return;
        const offers = getOffersDataWithSysdate();
        if (!offers.length) { container.innerHTML = '<em>Aucune offre saisie.</em>'; return; }
        let html = '<table style="width:100%;border-collapse:collapse;font-size:15px;">';
        html += '<thead><tr>';
        html += '<th>Nom de l\'offre</th><th>Coût Total (€)</th><th>Type coût</th><th>Délai Interv. (h)</th><th>Score Matériel</th><th>Ressenti</th><th>Note</th><th>Engagement (mois)</th><th>Pénalités (€)</th><th>Préavis (jours)</th>';
        for(let i=1;i<=10;i++) html += `<th>Option ${i} (€)</th><th>Option ${i} (desc.)</th>`;
        html += '<th>Date création</th>';
        html += '</tr></thead><tbody>';
        for(const offer of offers) {
            html += '<tr>';
            html += `<td>${offer.name||''}</td><td>${offer.cost||''}</td><td>${offer.costType||''}</td><td>${offer.sla||''}</td><td>${offer.quality||''}</td><td>${offer.feeling||''}</td><td>${offer.note||''}</td><td>${offer.engagement||''}</td><td>${offer.penalty||''}</td><td>${offer.cancelDelay||''}</td>`;
            for(let i=0;i<10;i++) {
                const opt = offer.extraOptions[i]||{};
                html += `<td>${opt.amount||''}</td><td>${opt.note||''}</td>`;
            }
            html += `<td>${offer.sysdate||''}</td>`;
            html += '</tr>';
        }
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    // --- Génération des données CSV/TSV en temps réel ---
    function renderRealtimeCsv() {
        const offers = getOffersDataWithSysdate();
        const realtimeDiv = document.getElementById('realtime-csv-output');
        const phpExportInput = document.getElementById('php-export-csv-input');
        const csvPreview = document.getElementById('csv-preview');
        if (!offers.length) {
            if (realtimeDiv) realtimeDiv.textContent = '';
            if (phpExportInput) phpExportInput.value = '';
            if (csvPreview) csvPreview.value = '';
            return;
        }
        let headers = ["Nom de l'offre","Coût Total (€)","Type coût","Délai Interv. (h)","Score Matériel","Ressenti","Note","Engagement (mois)","Pénalités (€)","Préavis (jours)"];
        for(let i=1;i<=10;i++) { headers.push(`Option ${i} (€)`, `Option ${i} (desc.)`); }
        headers.push('Date création');
        let lines = [headers.join(';')];
        for(const offer of offers) {
            let row = [offer.name||'',offer.cost||'',offer.costType||'',offer.sla||'',offer.quality||'',offer.feeling||'',offer.note||'',offer.engagement||'',offer.penalty||'',offer.cancelDelay||''];
            for(let i=0;i<10;i++) {
                const opt = offer.extraOptions[i]||{};
                row.push(opt.amount||'', opt.note||'');
            }
            row.push(offer.sysdate||'');
            lines.push(row.map(x => (typeof x === 'string' && x.includes(';')) ? '"'+x.replace(/"/g,'""')+'"' : x).join(';'));
        }
        const csvString = lines.join('\n');
        if (realtimeDiv) realtimeDiv.textContent = csvString;
        if (phpExportInput) phpExportInput.value = csvString;
        if (csvPreview) csvPreview.value = csvString;
    }

    // --- Met à jour tout en temps réel ---
    function updateAllViews() {
        renderOffersTable();
        renderRealtimeCsv();
        enforceExtraOptionLimit();
    }
    ['input','change'].forEach(evt => {
        document.body.addEventListener(evt, e => {
            if (e.target.closest('.offer-card') || e.target.closest('.grouped-offer-card')) {
                updateAllViews();
            }
        });
    });
    updateAllViews();

    // --- Sécurise l'export PHP et log si problème ---
    function setupPhpExport() {
        const form = document.getElementById('php-export-form');
        const csvInput = document.getElementById('php-export-csv-input');
        const exportBtn = document.getElementById('php-export-btn');
        if (!form || !csvInput || !exportBtn) return;
        exportBtn.addEventListener('click', function(e) {
            updateAllViews(); // force update juste avant export
            if (!csvInput.value.trim()) {
                e.preventDefault();
                window.liveLog && window.liveLog('Aucune donnée à exporter (CSV vide).', 'warn');
                alert('Aucune donnée à exporter.');
                return false;
            }
        });
    }
    setupPhpExport();

    // --- Nouvelle fonction pour collecter les données avec sysdate et options fixes ---
    function getOffersDataWithSysdate() {
        const data = [];
        offersContainer.querySelectorAll('.offer-card').forEach(card => {
            if (card.classList.contains('hidden')) return;
            const name = card.querySelector('.offer-name')?.value || '';
            const cost = parseFloat(card.querySelector('.offer-cost')?.value) || 0;
            const costType = card.querySelector('.offer-cost-type')?.value || 'one';
            let costTotal = convertToYearly(cost, 1, costType);
            const extraOptions = [];
            let i = 0;
            card.querySelectorAll('.extra-cost-row').forEach(row => {
                if (i<10) {
                    const amount = parseFloat(row.querySelector('.extra-cost-amount')?.value) || '';
                    const note = row.querySelector('.extra-cost-note')?.value || '';
                    extraOptions.push({amount, note});
                }
                i++;
            });
            while(extraOptions.length<10) extraOptions.push({amount:'',note:''});
            const sla = parseFloat(card.querySelector('.offer-sla')?.value) || '';
            const quality = parseFloat(card.querySelector('.offer-quality')?.value) || '';
            const feeling = parseFloat(card.querySelector('.offer-feeling')?.value) || '';
            const note = card.querySelector('.contract-note')?.value || '';
            const engagement = parseInt(card.querySelector('.contract-engagement')?.value) || '';
            const penalty = parseFloat(card.querySelector('.contract-penalty')?.value) || '';
            const cancelDelay = parseInt(card.querySelector('.contract-cancel-delay')?.value) || '';
            let sysdate = card.dataset.sysdate;
            if (!sysdate) {
                sysdate = getSysdate();
                card.dataset.sysdate = sysdate;
            }
            data.push({ name, cost: costTotal, costType, sla, quality, feeling, note, engagement, penalty, cancelDelay, extraOptions, sysdate });
        });
        return data;
    }

    // --- Limite le nombre d'options supplémentaires à 10 ---
    function enforceExtraOptionLimit() {
        document.querySelectorAll('.offer-card').forEach(card => {
            const addBtn = card.querySelector('.add-extra-cost-btn');
            const list = card.querySelector('.extra-costs-list');
            if (list && addBtn) {
                addBtn.disabled = list.querySelectorAll('.extra-cost-row').length >= 10;
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const MAX_EXTRA_OPTIONS = 10; // Limite le nombre d'options supplémentaires
    let nextOfferId = 1; // ID pour les nouvelles offres
    const offersContainer = document.getElementById('offers-container');
    if (!offersContainer) return;

    // Helper to generate CSV string from offers data
    function generateCsvString(offers) {
        if (!offers || !offers.length) return '';
        const headers = ["Nom de l'offre","Coût Total (€)","Type coût","Délai Interv. (h)","Score Matériel (/100)","Ressenti (/100)","Note","Engagement (mois)","Pénalités (€)","Préavis (jours)"];
        for(let i=1;i<=MAX_EXTRA_OPTIONS;i++) { headers.push(`Option ${i} (€)`); headers.push(`Option ${i} (desc.)`); }
        headers.push('Date création');
        const rows = offers.map(offer => {
            const row = [
                offer.name || '',
                offer.cost || '',
                offer.costType || '',
                offer.sla || '',
                offer.quality || '',
                offer.feeling || '',
                offer.note || '',
                offer.engagement || '',
                offer.penalty || '',
                offer.cancelDelay || ''
            ];
            for(let i=0;i<MAX_EXTRA_OPTIONS;i++) {
                const opt = offer.extraOptions[i] || {};
                row.push(opt.amount || '');
                row.push(opt.note || '');
            }
            row.push(offer.sysdate || '');
            return row.map(x => (typeof x === 'string' && x.includes(';')) ? `"${x.replace(/"/g,'""')}"` : x).join(';');
        });
        return [headers.join(';'), ...rows].join('\n');
    }

    // Helper to get offers data
    function getOffersData() {
        const data = [];
        offersContainer.querySelectorAll('.offer-card').forEach(card => {
            if (card.classList.contains('hidden')) return;
            const name = card.querySelector('.offer-name')?.value || '';
            const cost = parseFloat(card.querySelector('.offer-cost')?.value) || 0;
            const costType = card.querySelector('.offer-cost-type')?.value || 'one';
            let costTotal = convertToYearly(cost, 1, costType);
            const extraOptions = [];
            let i = 0;