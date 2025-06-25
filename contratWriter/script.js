document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const addOfferBtn = document.getElementById('add-offer-btn');
    const groupOffersBtn = document.getElementById('group-offers-btn');
    const offersContainer = document.getElementById('offers-container');

    let nextOfferId = 2;
    let nextGroupId = 1;

    // --- Helper: Format date for systime ---
    function formatSystime(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function isOlderThanOneMonth(ts) {
        if (!ts) return false;
        const now = Date.now();
        const oneMonth = 31 * 24 * 60 * 60 * 1000;
        return (now - ts) > oneMonth;
    }

    // Update systime display (with warning if >1 month)
    function updateSystimeDisplay(card) {
        const systime = parseInt(card.dataset.systime, 10);
        const systimeSpan = card.querySelector('.offer-systime');
        if (systimeSpan) {
            let text = 'Ce contrat date de : ' + formatSystime(systime);
            if (isOlderThanOneMonth(systime)) {
                text += ' <span style="color:#c62828;font-weight:bold;">⚠️ Ce contrat pourrait ne plus être valide</span>';
            }
            systimeSpan.innerHTML = text;
        }
    }

    // --- Add Offer (with systime) ---
    addOfferBtn.addEventListener('click', () => {
        const offerCard = document.createElement('div');
        offerCard.className = 'offer-card';
        offerCard.dataset.id = nextOfferId++;
        // Set systime
        const systime = Date.now();
        offerCard.dataset.systime = systime;
        offerCard.innerHTML = `
            <div class="offer-header">
                <input type="checkbox" class="offer-group-checkbox" title="Sélectionner pour regrouper">
                <input type="text" placeholder="Nom de l'offre (ex: Contrat A)" class="offer-name">
                <button class="delete-offer-btn" title="Supprimer l'offre" aria-label="Supprimer l'offre">🗑️</button>
                <button class="clone-offer-btn" title="Cloner l'offre" aria-label="Cloner l'offre" style="margin-left:2px;">📄</button>
                <span class="offer-systime" style="margin-left:auto;font-size:13px;color:#888;"></span>
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
        `;
        offersContainer.appendChild(offerCard);
        updateSystimeDisplay(offerCard);
    });

    // --- Helper: Get all offer data as variables ---
    function getAllOffersData() {
        const offers = [];
        offersContainer.querySelectorAll('.offer-card').forEach(card => {
            // Main offer fields
            const offerName = card.querySelector('.offer-name')?.value || '';
            const offerCost = card.querySelector('.offer-cost')?.value || '';
            const offerCostType = card.querySelector('.offer-cost-type')?.value || '';
            const offerSla = card.querySelector('.offer-sla')?.value || '';
            const offerQuality = card.querySelector('.offer-quality')?.value || '';
            const offerFeeling = card.querySelector('.offer-feeling')?.value || '';
            const contractNote = card.querySelector('.contract-note')?.value || '';
            const contractEngagement = card.querySelector('.contract-engagement')?.value || '';
            const contractPenalty = card.querySelector('.contract-penalty')?.value || '';
            const contractCancelDelay = card.querySelector('.contract-cancel-delay')?.value || '';
            // Extra costs
            const extraCosts = [];
            card.querySelectorAll('.extra-cost-row').forEach(row => {
                const extraCostAmount = row.querySelector('.extra-cost-amount')?.value || '';
                const extraCostNote = row.querySelector('.extra-cost-note')?.value || '';
                const extraCostFrequency = row.querySelector('.extra-cost-frequency')?.value || '';
                const extraCostPeriod = row.querySelector('.extra-cost-period')?.value || '';
                extraCosts.push({ extraCostAmount, extraCostNote, extraCostFrequency, extraCostPeriod });
            });
            offers.push({
                offerName,
                offerCost,
                offerCostType,
                offerSla,
                offerQuality,
                offerFeeling,
                contractNote,
                contractEngagement,
                contractPenalty,
                contractCancelDelay,
                extraCosts,
                systime: card.dataset.systime || ''
            });
        });
        return offers;
    }

    // --- Extra Costs: Add/Remove (event delegation) ---
    offersContainer.addEventListener('click', (e) => {
        // Delete Offer
        if (e.target.classList.contains('delete-offer-btn')) {
            e.target.closest('.offer-card')?.remove();
        }
        // Add Extra Cost
        if (e.target.classList.contains('add-extra-cost-btn')) {
            const offerCard = e.target.closest('.offer-card');
            if (!offerCard) return;
            const list = offerCard.querySelector('.extra-costs-list');
            const row = document.createElement('div');
            row.className = 'extra-cost-row';
            row.innerHTML = `
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
            `;
            list.appendChild(row);
        }
        // Remove Extra Cost
        if (e.target.classList.contains('remove-extra-cost-btn')) {
            e.target.closest('.extra-cost-row')?.remove();
        }
    });

    // --- Group Offers ---
    groupOffersBtn.addEventListener('click', () => {
        const selected = Array.from(offersContainer.querySelectorAll('.offer-group-checkbox:checked'));
        if (selected.length < 2) {
            alert('Sélectionnez au moins deux offres à regrouper.');
            return;
        }
        const groupMemberIds = [];
        const groupMemberNames = [];
        let totalCost = 0;
        let totalQuality = 0;
        let totalFeeling = 0;
        let totalSla = 0;
        let count = 0;
        selected.forEach(checkbox => {
            const card = checkbox.closest('.offer-card');
            groupMemberIds.push(card.dataset.id);
            groupMemberNames.push(card.querySelector('.offer-name').value || `Offre ${card.dataset.id}`);
            // Use variables for calculation
            const offerCost = parseFloat(card.querySelector('.offer-cost')?.value) || 0;
            const offerQuality = parseFloat(card.querySelector('.offer-quality')?.value) || 0;
            const offerFeeling = parseFloat(card.querySelector('.offer-feeling')?.value) || 0;
            const offerSla = parseFloat(card.querySelector('.offer-sla')?.value) || 0;
            totalCost += offerCost;
            totalQuality += offerQuality;
            totalFeeling += offerFeeling;
            totalSla += offerSla;
            count++;
            card.classList.add('hidden');
            checkbox.checked = false;
        });
        // Create grouped offer card
        const template = document.getElementById('grouped-offer-template');
        const groupedCard = template.content.cloneNode(true).firstElementChild;
        groupedCard.dataset.groupId = `group-${nextGroupId++}`;
        groupedCard.dataset.memberIds = JSON.stringify(groupMemberIds);
        groupedCard.querySelector('.lot-title').textContent = `Lot: ${groupMemberNames.join(' + ')}`;
        groupedCard.querySelector('.lot-cost').textContent = totalCost.toFixed(2);
        groupedCard.querySelector('.lot-quality').textContent = (totalQuality/count).toFixed(2);
        groupedCard.querySelector('.lot-feeling').textContent = (totalFeeling/count).toFixed(2);
        groupedCard.querySelector('.lot-sla').textContent = (totalSla/count).toFixed(2);
        groupedCard.querySelector('.ungroup-btn').addEventListener('click', () => {
            JSON.parse(groupedCard.dataset.memberIds).forEach(id => {
                const offerToUnhide = offersContainer.querySelector(`.offer-card[data-id="${id}"]`);
                if (offerToUnhide) offerToUnhide.classList.remove('hidden');
            });
            groupedCard.remove();
        });
        offersContainer.appendChild(groupedCard);
    });

    // --- Clone Offer ---
    offersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('clone-offer-btn')) {
            const originalCard = e.target.closest('.offer-card');
            if (!originalCard) return;
            // Clone the card DOM node
            const clone = originalCard.cloneNode(true);
            clone.dataset.id = nextOfferId++;
            // Clear checkboxes in the clone
            const groupCheckbox = clone.querySelector('.offer-group-checkbox');
            if (groupCheckbox) groupCheckbox.checked = false;
            // Optionally, update the offer name to indicate it's a copy
            const nameInput = clone.querySelector('.offer-name');
            if (nameInput) nameInput.value = (nameInput.value ? nameInput.value + ' (copie)' : 'Copie');
            // Event delegation covers extra cost buttons
            offersContainer.appendChild(clone);
        }
    });

    // --- CSV Export ---
    function offersToCSV(offers) {
        const escape = v => '"' + String(v).replace(/"/g, '""') + '"';
        const now = Date.now();
        offers.forEach(offer => {
            offer.systime = now;
            const card = offersContainer.querySelector(`.offer-card[data-id="${offer.id}"]`);
            if (card) {
                card.dataset.systime = now;
                updateSystimeDisplay(card);
            }
        });
        const rows = [];
        // Header
        rows.push([
            'Nom','Coût','Type paiement','SLA','Qualité','Ressenti','Note','Engagement (mois)','Pénalités','Préavis','Coûts supplémentaires','systime'
        ].join(','));
        // Data
        offers.forEach(offer => {
            const extraCosts = (offer.extraCosts || []).map(ec =>
                `${ec.extraCostAmount}€ x${ec.extraCostFrequency} ${ec.extraCostPeriod} (${ec.extraCostNote})`
            ).join(' | ');
            rows.push([
                escape(offer.offerName),
                offer.offerCost,
                offer.offerCostType,
                offer.offerSla,
                offer.offerQuality,
                offer.offerFeeling,
                escape(offer.contractNote),
                offer.contractEngagement,
                offer.contractPenalty,
                offer.contractCancelDelay,
                escape(extraCosts),
                offer.systime || ''
            ].join(','));
        });
        return rows.join('\r\n');
    }

    document.getElementById('export-csv-btn').addEventListener('click', () => {
        const offers = getAllOffersData();
        const csv = offersToCSV(offers);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'offres.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    });

    // --- Offer Total Summary ---
    function updateOffersTotalSummary() {
        const selectedCards = Array.from(offersContainer.querySelectorAll('.offer-group-checkbox:checked')).map(cb => cb.closest('.offer-card'));
        if (selectedCards.length === 0) {
            document.getElementById('offers-total-summary').innerHTML = '';
            return;
        }
        let totalMonthly = 0, totalQuarterly = 0, totalYearly = 0, totalEngagement = 0;
        selectedCards.forEach(card => {
            const cost = parseFloat(card.querySelector('.offer-cost')?.value) || 0;
            const type = card.querySelector('.offer-cost-type')?.value || 'one';
            const engagement = parseFloat(card.querySelector('.contract-engagement')?.value) || 1;
            // Normalize to monthly/quarterly/yearly
            if (type === 'one') {
                totalMonthly += cost / (engagement > 0 ? engagement : 1);
                totalQuarterly += cost / ((engagement > 0 ? engagement : 1) / 3);
                totalYearly += cost / ((engagement > 0 ? engagement : 1) / 12);
                totalEngagement += cost;
            } else if (type === 'monthly') {
                totalMonthly += cost;
                totalQuarterly += cost * 3;
                totalYearly += cost * 12;
                totalEngagement += cost * (engagement > 0 ? engagement : 1);
            } else if (type === 'quarterly') {
                totalMonthly += cost / 3;
                totalQuarterly += cost;
                totalYearly += cost * 4;
                totalEngagement += cost * ((engagement > 0 ? engagement : 1) / 3);
            } else if (type === 'yearly') {
                totalMonthly += cost / 12;
                totalQuarterly += cost / 4;
                totalYearly += cost;
                totalEngagement += cost * ((engagement > 0 ? engagement : 1) / 12);
            }
            // Extra costs
            card.querySelectorAll('.extra-cost-row').forEach(row => {
                const ecAmount = parseFloat(row.querySelector('.extra-cost-amount')?.value) || 0;
                const ecFreq = parseFloat(row.querySelector('.extra-cost-frequency')?.value) || 1;
                const ecPeriod = row.querySelector('.extra-cost-period')?.value || 'one';
                let months = 1;
                if (ecPeriod === 'monthly') months = 1;
                else if (ecPeriod === 'quarterly') months = 3;
                else if (ecPeriod === 'yearly') months = 12;
                else months = engagement > 0 ? engagement : 1;
                const totalForEngagement = ecAmount * ecFreq * (engagement > 0 ? engagement : 1) / months;
                totalMonthly += ecPeriod === 'monthly' ? ecAmount * ecFreq : ecPeriod === 'quarterly' ? (ecAmount * ecFreq) / 3 : ecPeriod === 'yearly' ? (ecAmount * ecFreq) / 12 : totalForEngagement / (engagement > 0 ? engagement : 1);
                totalQuarterly += ecPeriod === 'monthly' ? ecAmount * ecFreq * 3 : ecPeriod === 'quarterly' ? ecAmount * ecFreq : ecPeriod === 'yearly' ? (ecAmount * ecFreq) / 4 : totalForEngagement / ((engagement > 0 ? engagement : 1) / 3);
                totalYearly += ecPeriod === 'monthly' ? ecAmount * ecFreq * 12 : ecPeriod === 'quarterly' ? ecAmount * ecFreq * 4 : ecPeriod === 'yearly' ? ecAmount * ecFreq : totalForEngagement / ((engagement > 0 ? engagement : 1) / 12);
                totalEngagement += totalForEngagement;
            });
        });
        document.getElementById('offers-total-summary').innerHTML =
            `<div><b>Total sélectionné :</b></div>`+
            `<div>Mensuel : <b>${totalMonthly.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} €</b></div>`+
            `<div>Trimestriel : <b>${totalQuarterly.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} €</b></div>`+
            `<div>Sur engagement : <b>${totalEngagement.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} €</b></div>`;
    }

    offersContainer.addEventListener('input', updateOffersTotalSummary);
    offersContainer.addEventListener('change', updateOffersTotalSummary);
    updateOffersTotalSummary();

    // --- Programmatic Contract Creation ---
    /**
     * Adds a new contract offer and fills in all fields as if entered manually.
     * @param {Object} values - The values to fill in.
     * @param {string} values.offerName
     * @param {number|string} values.offerCost
     * @param {string} values.offerCostType - 'one' | 'monthly' | 'quarterly' | 'yearly'
     * @param {number|string} values.offerSla
     * @param {number|string} values.offerQuality
     * @param {number|string} values.offerFeeling
     * @param {string} values.contractNote
     * @param {number|string} values.contractEngagement
     * @param {number|string} values.contractPenalty
     * @param {number|string} values.contractCancelDelay
     * @param {Array<Object>} [values.extraCosts] - Array of extra cost objects
     *   { extraCostAmount, extraCostFrequency, extraCostPeriod, extraCostNote }
     */
    function addContractWithValues(values) {
        // Click the add offer button to create a new card
        const addOfferBtn = document.getElementById('add-offer-btn');
        addOfferBtn.click();
        // Get the last offer card (the one just added)
        const offersContainer = document.getElementById('offers-container');
        const offerCards = offersContainer.querySelectorAll('.offer-card');
        const card = offerCards[offerCards.length - 1];
        if (!card) return;
        // Systime
        const systime = values.systime || Date.now();
        card.dataset.systime = systime;
        updateSystimeDisplay(card);
        // Fill in the fields
        card.querySelector('.offer-name').value = values.offerName || '';
        card.querySelector('.offer-cost').value = values.offerCost || '';
        card.querySelector('.offer-cost-type').value = values.offerCostType || 'one';
        card.querySelector('.offer-sla').value = values.offerSla || '';
        card.querySelector('.offer-quality').value = values.offerQuality || '';
        card.querySelector('.offer-feeling').value = values.offerFeeling || '';
        card.querySelector('.contract-note').value = values.contractNote || '';
        card.querySelector('.contract-engagement').value = values.contractEngagement || '';
        card.querySelector('.contract-penalty').value = values.contractPenalty || '';
        card.querySelector('.contract-cancel-delay').value = values.contractCancelDelay || '';
        // Extra costs
        if (Array.isArray(values.extraCosts)) {
            const addExtraBtn = card.querySelector('.add-extra-cost-btn');
            const extraCostsList = card.querySelector('.extra-costs-list');
            const template = card.querySelector('.extra-cost-template') || document.querySelector('.extra-cost-template');
            values.extraCosts.forEach(ec => {
                addExtraBtn.click();
                // Get the last extra cost row
                const rows = extraCostsList.querySelectorAll('.extra-cost-row');
                const row = rows[rows.length - 1];
                if (!row) return;
                row.querySelector('.extra-cost-amount').value = ec.extraCostAmount || '';
                row.querySelector('.extra-cost-frequency').value = ec.extraCostFrequency || 1;
                row.querySelector('.extra-cost-period').value = ec.extraCostPeriod || 'one';
                row.querySelector('.extra-cost-note').value = ec.extraCostNote || '';
            });
        }
        // Trigger input events for live updates
        card.dispatchEvent(new Event('input', { bubbles: true }));
        card.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Helper: Add a contract and fill values as if entered manually
    function addContractWithValues(data) {
        // Trigger add offer (simulate manual add)
        document.getElementById('add-offer-btn').click();
        // Get the last offer card
        const cards = offersContainer.querySelectorAll('.offer-card');
        const card = cards[cards.length - 1];
        if (!card) return;
        // Fill main fields
        card.querySelector('.offer-name').value = data.offerName || '';
        card.querySelector('.offer-cost').value = data.offerCost || '';
        card.querySelector('.offer-cost-type').value = data.offerCostType || 'one';
        card.querySelector('.offer-sla').value = data.offerSla || '';
        card.querySelector('.offer-quality').value = data.offerQuality || '';
        card.querySelector('.offer-feeling').value = data.offerFeeling || '';
        card.querySelector('.contract-note').value = data.contractNote || '';
        card.querySelector('.contract-engagement').value = data.contractEngagement || '';
        card.querySelector('.contract-penalty').value = data.contractPenalty || '';
        card.querySelector('.contract-cancel-delay').value = data.contractCancelDelay || '';
        // Add extra costs if any
        if (Array.isArray(data.extraCosts)) {
            data.extraCosts.forEach(ec => {
                card.querySelector('.add-extra-cost-btn').click();
                const rows = card.querySelectorAll('.extra-cost-row');
                const row = rows[rows.length - 1];
                if (row) {
                    row.querySelector('.extra-cost-amount').value = ec.extraCostAmount || '';
                    row.querySelector('.extra-cost-frequency').value = ec.extraCostFrequency || 1;
                    row.querySelector('.extra-cost-period').value = ec.extraCostPeriod || 'one';
                    row.querySelector('.extra-cost-note').value = ec.extraCostNote || '';
                }
            });
        }
        // Trigger input events for live updates
        card.dispatchEvent(new Event('input', { bubbles: true }));
        card.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Example usage:
    // addContractWithValues({
    //     offerName: 'Contrat Test',
    //     offerCost: 1200,
    //     offerCostType: 'monthly',
    //     offerSla: 24,
    //     offerQuality: 90,
    //     offerFeeling: 80,
    //     contractNote: 'Exemple de contrat généré',
    //     contractEngagement: 12,
    //     contractPenalty: 300,
    //     contractCancelDelay: 30,
    //     extraCosts: [
    //         { extraCostAmount: 100, extraCostFrequency: 1, extraCostPeriod: 'monthly', extraCostNote: 'Maintenance' },
    //         { extraCostAmount: 500, extraCostFrequency: 1, extraCostPeriod: 'one', extraCostNote: 'Livraison' }
    //     ]
    // });

    // --- CSV Import ---
    const importCsvBtn = document.getElementById('import-csv-btn');
    const importCsvInput = document.getElementById('import-csv-input');

    importCsvBtn.addEventListener('click', () => {
        importCsvInput.value = '';
        importCsvInput.click();
    });

    importCsvInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            const text = event.target.result;
            importContractsFromCSV(text);
        };
        reader.readAsText(file, 'utf-8');
    });

    function importContractsFromCSV(csvText) {
        // Remove all offers except the first (template)
        const offersContainer = document.getElementById('offers-container');
        offersContainer.querySelectorAll('.offer-card').forEach((card, i) => { if (i > 0) card.remove(); });
        // Parse CSV
        const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) return alert('CSV vide ou incorrect.');
        const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        // Expected columns
        const expected = ['Nom','Coût','Type paiement','SLA','Qualité','Ressenti','Note','Engagement (mois)','Pénalités','Préavis','Coûts supplémentaires','systime'];
        if (header.length !== expected.length || !expected.every((h,i) => h === header[i])) {
            alert('Structure du CSV non reconnue.');
            return;
        }
        // Remove the first offer card (template)
        offersContainer.querySelectorAll('.offer-card').forEach(card => card.remove());
        // For each row, add a contract
        for (let i = 1; i < lines.length; ++i) {
            const row = parseCsvLine(lines[i]);
            if (row.length < 11) continue;
            // Parse extra costs
            let extraCosts = [];
            if (row[10]) {
                // Format: "100€ x1 monthly (Maintenance) | 500€ x1 one (Livraison)"
                extraCosts = row[10].split('|').map(s => {
                    const m = s.match(/([\d.,]+)€\s*x(\d+)\s+(one|monthly|quarterly|yearly)\s*\(([^)]*)\)/);
                    if (!m) return null;
                    return {
                        extraCostAmount: m[1].replace(',', '.'),
                        extraCostFrequency: m[2],
                        extraCostPeriod: m[3],
                        extraCostNote: m[4] || ''
                    };
                }).filter(Boolean);
            }
            addContractWithValues({
                offerName: row[0],
                offerCost: row[1],
                offerCostType: row[2],
                offerSla: row[3],
                offerQuality: row[4],
                offerFeeling: row[5],
                contractNote: row[6],
                contractEngagement: row[7],
                contractPenalty: row[8],
                contractCancelDelay: row[9],
                extraCosts,
                systime: row[11] || undefined
            });
        }
    }

    function parseCsvLine(line) {
        // Simple CSV parser for quoted/escaped values
        const result = [];
        let cur = '', inQuotes = false;
        for (let i = 0; i < line.length; ++i) {
            const c = line[i];
            if (c === '"') {
                if (inQuotes && line[i+1] === '"') { cur += '"'; ++i; }
                else inQuotes = !inQuotes;
            } else if (c === ',' && !inQuotes) {
                result.push(cur); cur = '';
            } else {
                cur += c;
            }
        }
        result.push(cur);
        return result;
    }
});