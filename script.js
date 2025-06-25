document.addEventListener('DOMContentLoaded', () => {
    // --- Sélection des éléments DOM ---
    const calculateBtn = document.getElementById('calculate-btn');
    const exportBtn = document.getElementById('export-csv-btn');
    const addOfferBtn = document.getElementById('add-offer-btn');
    const groupOffersBtn = document.getElementById('group-offers-btn');
    const offersContainer = document.getElementById('offers-container');

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
        offersContainer.querySelectorAll('.offer-card').forEach(card => {
            if (card.classList.contains('hidden')) return; // skip hidden cards
            const name = card.querySelector('.offer-name')?.value || '';
            const cost = parseFloat(card.querySelector('.offer-cost')?.value) || 0;
            const costType = card.querySelector('.offer-cost-type')?.value || 'one';
            let costTotal = convertToYearly(cost, 1, costType);
            // Extra costs
            const extraCosts = [];
            card.querySelectorAll('.extra-cost-row').forEach(row => {
                const amount = parseFloat(row.querySelector('.extra-cost-amount')?.value) || 0;
                const freq = parseInt(row.querySelector('.extra-cost-frequency')?.value) || 1;
                const period = row.querySelector('.extra-cost-period')?.value || 'one';
                const note = row.querySelector('.extra-cost-note')?.value || '';
                extraCosts.push({ amount, frequency: freq, period, note });
                costTotal += convertToYearly(amount, freq, period);
            });
            const sla = parseFloat(card.querySelector('.offer-sla')?.value) || 0;
            const quality = parseFloat(card.querySelector('.offer-quality')?.value) || 0;
            const feeling = parseFloat(card.querySelector('.offer-feeling')?.value) || 0;
            const note = card.querySelector('.contract-note')?.value || '';
            const engagement = parseInt(card.querySelector('.contract-engagement')?.value) || 0;
            const penalty = parseFloat(card.querySelector('.contract-penalty')?.value) || 0;
            const cancelDelay = parseInt(card.querySelector('.contract-cancel-delay')?.value) || 0;
            // Ajoute même si certains champs sont vides, tant qu'il y a un nom ou un coût
            if (name || costTotal > 0) {
                data.push({ name, cost: costTotal, sla, quality, feeling, note, engagement, penalty, cancelDelay, extraCosts });
            }
        });
        offersContainer.querySelectorAll('.grouped-offer-card').forEach(card => {
            const discount = parseFloat(card.querySelector('.lot-discount-input')?.value) || 0;
            const discountType = card.querySelector('.lot-discount-type')?.value || 'percent';
            const baseCost = parseFloat(card.dataset.baseCost);
            let cost;
            if (discountType === 'flat') {
                cost = Math.max(0, baseCost - discount);
            } else {
                cost = baseCost * (1 - discount / 100);
            }
            data.push({
                name: card.querySelector('.lot-title')?.textContent || '',
                cost: cost,
                sla: parseFloat(card.dataset.baseSla) || 0,
                quality: parseFloat(card.dataset.baseQuality) || 0,
                feeling: parseFloat(card.dataset.baseFeeling) || 0
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
        // Générer le CSV (UTF-8, séparateur point-virgule)
        const headers = ['Nom de l\'offre','Coût Total (€)','Type coût','Délai Interv. (h)','Score Matériel (/100)','Ressenti (/100)','Note','Engagement (mois)','Pénalités (€)','Préavis (jours)','Coûts supp. (JSON)'];
        const rows = exportData.map(d => [
            d.name || '',
            d.cost || '',
            d.costType || '',
            d.sla || '',
            d.quality || '',
            d.feeling || '',
            d.note || '',
            d.engagement || '',
            d.penalty || '',
            d.cancelDelay || '',
            d.extraCosts ? JSON.stringify(d.extraCosts) : ''
        ].map(x => (typeof x === 'string' && x.includes(';')) ? '"'+x.replace(/"/g,'""')+'"' : x));
        const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        // Copier dans le presse-papiers
        navigator.clipboard.writeText(csv).then(() => {
            alert('Données copiées dans le presse-papiers !');
        }, () => {
            alert('Erreur lors de la copie des données.');
        });
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

    // Chargement des types de contrats depuis data.csv et remplissage du datalist
    function loadContractTypes() {
        fetch('data.csv')
            .then(response => response.text())
            .then(text => {
                const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
                const header = lines[0].split(';');
                const typeIdx = header.indexOf('type');
                const tipsIdx = header.indexOf('tips');
                const datalist = document.getElementById('contract-type-list');
                datalist.innerHTML = '';
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(';');
                    if (cols[typeIdx]) {
                        const opt = document.createElement('option');
                        opt.value = cols[typeIdx];
                        datalist.appendChild(opt);
                    }
                }
            });
    }

    // Affichage des tips si le type correspond à un modèle connu
    function updateContractTypeTips() {
        fetch('data.csv')
            .then(response => response.text())
            .then(text => {
                const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
                const header = lines[0].split(';');
                const typeIdx = header.indexOf('type');
                const tipsIdx = header.indexOf('tips');
                const input = document.getElementById('contract-type-input');
                const tipsDiv = document.getElementById('contract-type-tips');
                let found = false;
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(';');
                    if (cols[typeIdx] && input.value.trim().toLowerCase() === cols[typeIdx].trim().toLowerCase()) {
                        tipsDiv.textContent = cols[tipsIdx] || '';
                        found = true;
                        break;
                    }
                }
                if (!found) tipsDiv.textContent = '';
            });
    }

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

    // Chargement des types de contrats depuis data.csv
    fetch('data.csv')
        .then(r => r.text())
        .then(text => {
            contractTypeData = parseCSV(text);
            contractTypeSelect.innerHTML = '<option value="">-- Choisir un type --</option>' +
                contractTypeData.map(d => `<option value="${d.type}">${d.type}</option>`).join('');
        });

    // Chargement des types de contrats au démarrage
    loadContractTypes();
    const contractTypeInput = document.getElementById('contract-type-input');
    contractTypeInput.addEventListener('input', updateContractTypeTips);

    // --- Copier les données CSV dans le presse-papiers ---
    const copyBtn = document.getElementById('copy-csv-btn');
    const copyFeedback = document.getElementById('copy-feedback');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const offersData = getOffersData();
            if (!offersData.length) {
                copyFeedback.textContent = 'Aucune offre à copier.';
                copyFeedback.style.display = 'block';
                setTimeout(() => { copyFeedback.style.display = 'none'; }, 2000);
                return;
            }
            // Générer le CSV (UTF-8, séparateur point-virgule)
            const headers = ['Nom de l\'offre','Coût Total (€)','Type coût','Délai Interv. (h)','Score Matériel (/100)','Ressenti (/100)','Note','Engagement (mois)','Pénalités (€)','Préavis (jours)','Coûts supp. (JSON)'];
            const rows = offersData.map(d => [
                d.name || '',
                d.cost || '',
                d.costType || '',
                d.sla || '',
                d.quality || '',
                d.feeling || '',
                d.note || '',
                d.engagement || '',
                d.penalty || '',
                d.cancelDelay || '',
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

    // --- Affichage direct du CSV dans un champ texte non modifiable ---
    function ensureCsvOutputTextarea() {
        let csvOutput = document.getElementById('csv-output');
        if (!csvOutput) {
            csvOutput = document.createElement('textarea');
            csvOutput.id = 'csv-output';
            csvOutput.readOnly = true;
            csvOutput.style.width = '100%';
            csvOutput.style.minHeight = '120px';
            csvOutput.style.marginTop = '10px';
            // Cherche la section .results-actions ou la section .card correspondante
            let resultsSection = document.querySelector('.results-actions');
            if (resultsSection) {
                // Ajoute après le paragraphe d'instructions si possible
                const parentCard = resultsSection.closest('.card');
                const infoPara = parentCard ? parentCard.querySelector('p') : null;
                if (infoPara && !parentCard.querySelector('#csv-output')) {
                    infoPara.insertAdjacentElement('afterend', csvOutput);
                } else if (!parentCard.querySelector('#csv-output')) {
                    resultsSection.parentNode.insertBefore(csvOutput, resultsSection.nextSibling);
                }
            } else {
                // Fallback : ajoute à la fin du body
                document.body.appendChild(csvOutput);
            }
        }
        return csvOutput;
    }

    function updateCsvOutput() {
        const csvOutput = ensureCsvOutputTextarea();
        const offersData = getOffersData();
        if (!offersData.length) {
            csvOutput.value = '';
            return;
        }
        const headers = ['Nom de l\'offre','Coût Total (€)','Type coût','Délai Interv. (h)','Score Matériel (/100)','Ressenti (/100)','Note','Engagement (mois)','Pénalités (€)','Préavis (jours)','Coûts supp. (JSON)'];
        const rows = offersData.map(d => [
            d.name || '',
            d.cost || '',
            d.costType || '',
            d.sla || '',
            d.quality || '',
            d.feeling || '',
            d.note || '',
            d.engagement || '',
            d.penalty || '',
            d.cancelDelay || '',
            d.extraCosts ? JSON.stringify(d.extraCosts) : ''
        ].map(x => (typeof x === 'string' && x.includes(';')) ? '"'+x.replace(/"/g,'""')+'"' : x));
        csvOutput.value = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    }

    // Mettre à jour le CSV à chaque modification
    ['input','change'].forEach(evt => {
        document.body.addEventListener(evt, e => {
            if (e.target.closest('.offer-card') || e.target.closest('.grouped-offer-card')) {
                updateCsvOutput();
            }
        });
    });
    // Mettre à jour aussi à l'initialisation
    updateCsvOutput();

    // --- Affichage des logs en temps réel en bas de page ---
    (function setupLiveLog() {
        let logDiv = document.getElementById('live-log');
        if (!logDiv) {
            logDiv = document.createElement('div');
            logDiv.id = 'live-log';
            logDiv.style.position = 'fixed';
            logDiv.style.left = '0';
            logDiv.style.right = '0';
            logDiv.style.bottom = '0';
            logDiv.style.background = 'rgba(30,30,30,0.95)';
            logDiv.style.color = '#fff';
            logDiv.style.fontSize = '15px';
            logDiv.style.padding = '8px 18px';
            logDiv.style.zIndex = '9999';
            logDiv.style.maxHeight = '120px';
            logDiv.style.overflowY = 'auto';
            logDiv.style.fontFamily = 'monospace';
            logDiv.style.display = 'none';
            document.body.appendChild(logDiv);
        }
        function logMsg(msg, type = 'info') {
            logDiv.style.display = 'block';
            const color = type === 'error' ? '#ff5252' : (type === 'warn' ? '#ffd600' : '#b2ff59');
            const prefix = type === 'error' ? '[ERREUR]' : type === 'warn' ? '[AVERT]' : '[INFO]';
            const line = document.createElement('div');
            line.innerHTML = `<span style="color:${color};font-weight:bold;">${prefix}</span> ${msg}`;
            logDiv.appendChild(line);
            logDiv.scrollTop = logDiv.scrollHeight;
            // Auto-hide after 10s for info, 20s for warn, never for error
            if (type === 'info') setTimeout(() => { line.remove(); if (!logDiv.hasChildNodes()) logDiv.style.display = 'none'; }, 10000);
            if (type === 'warn') setTimeout(() => { line.remove(); if (!logDiv.hasChildNodes()) logDiv.style.display = 'none'; }, 20000);
        }
        window.liveLog = logMsg;
        window.onerror = function(msg, url, line, col, error) {
            logMsg(`${msg} (${url}:${line})`, 'error');
            return false;
        };
        // Pour usage dans le code : window.liveLog('message', 'info'|'warn'|'error')
    })();

    console.log("Outil d'aide à la décision initialisé et prêt.");

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
});