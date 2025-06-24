document.addEventListener('DOMContentLoaded', () => {
    // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
    const offersContainer = document.getElementById('offers-container');
    const addOfferBtn = document.getElementById('add-offer-btn');
    const groupOffersBtn = document.getElementById('group-offers-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const exportBtn = document.getElementById('export-csv-btn');

    let barChart, radarChart;
    let nextOfferId = 2; // Pour donner des ID uniques aux nouvelles offres
    let nextGroupId = 1;

    // --- GESTION DES OFFRES ---
    addOfferBtn.addEventListener('click', () => {
        const offerTemplate = document.querySelector('.offer-card');
        const newOffer = offerTemplate.cloneNode(true);
        newOffer.dataset.id = nextOfferId++;
        newOffer.querySelectorAll('input').forEach(input => {
            input.value = '';
            if (input.type === 'checkbox') input.checked = false;
        });
        offersContainer.appendChild(newOffer);
    });

    // --- LOGIQUE DE GROUPAGE ---
    groupOffersBtn.addEventListener('click', () => {
        const selectedOffers = offersContainer.querySelectorAll('.offer-group-checkbox:checked');
        if (selectedOffers.length < 2) {
            alert("Veuillez sélectionner au moins deux offres à regrouper.");
            return;
        }

        let totalCost = 0, maxSla = 0, totalQuality = 0, totalFeeling = 0;
        const groupMemberIds = [];
        const groupMemberNames = [];

        selectedOffers.forEach(checkbox => {
            const offerCard = checkbox.closest('.offer-card');
            totalCost += parseFloat(offerCard.querySelector('.offer-cost').value) || 0;
            const sla = parseFloat(offerCard.querySelector('.offer-sla').value) || 0;
            if (sla > maxSla) maxSla = sla;
            totalQuality += parseFloat(offerCard.querySelector('.offer-quality').value) || 0;
            totalFeeling += parseFloat(offerCard.querySelector('.offer-feeling').value) || 0;
            
            groupMemberIds.push(offerCard.dataset.id);
            groupMemberNames.push(offerCard.querySelector('.offer-name').value || `Offre ${offerCard.dataset.id}`);
            offerCard.classList.add('hidden');
        });
        
        const groupId = `group-${nextGroupId++}`;
        const template = document.getElementById('grouped-offer-template');
        const groupedCard = template.content.cloneNode(true).firstElementChild;
        groupedCard.dataset.groupId = groupId;
        groupedCard.dataset.memberIds = JSON.stringify(groupMemberIds);
        
        groupedCard.dataset.baseCost = totalCost;
        groupedCard.dataset.baseSla = maxSla;
        groupedCard.dataset.baseQuality = totalQuality / selectedOffers.length;
        groupedCard.dataset.baseFeeling = totalFeeling / selectedOffers.length;
        
        groupedCard.querySelector('.lot-title').textContent = `Lot: ${groupMemberNames.join(' + ')}`;
        groupedCard.querySelector('.lot-cost').textContent = totalCost.toFixed(2);
        groupedCard.querySelector('.lot-sla').textContent = maxSla.toFixed(2);
        groupedCard.querySelector('.lot-quality').textContent = (totalQuality / selectedOffers.length).toFixed(2);
        groupedCard.querySelector('.lot-feeling').textContent = (totalFeeling / selectedOffers.length).toFixed(2);
        
        offersContainer.appendChild(groupedCard);

        groupedCard.querySelector('.ungroup-btn').addEventListener('click', () => {
            const idsToUnhide = JSON.parse(groupedCard.dataset.memberIds);
            idsToUnhide.forEach(id => {
                const offerToUnhide = offersContainer.querySelector(`.offer-card[data-id="${id}"]`);
                if (offerToUnhide) {
                    offerToUnhide.classList.remove('hidden');
                    offerToUnhide.querySelector('.offer-group-checkbox').checked = false;
                }
            });
            groupedCard.remove();
        });
    });

    // --- MISE À JOUR VISUELLE DES POIDS ---
    document.querySelectorAll('.weights input[type="range"]').forEach(slider => {
        slider.addEventListener('input', e => {
            document.getElementById(`${e.target.id}-value`).textContent = `${e.target.value}%`;
        });
    });

    // --- LE CŒUR : CALCUL ---
    calculateBtn.addEventListener('click', () => {
        const offersData = getOffersData();
        if (offersData.length === 0) {
            alert("Veuillez renseigner au moins une offre valide.");
            return;
        }
        const weights = getWeights();
        const results = calculateScores(offersData, weights);
        results.sort((a, b) => b.finalScore - a.finalScore);
        updateCharts(results);
    });
    
    // --- GESTION EXPORT CSV ---
    exportBtn.addEventListener('click', () => {
        const offersData = getOffersData(); // Utilise la même fonction pour avoir les lots et remises
        if (offersData.length === 0) {
            alert("Rien à exporter.");
            return;
        }
        
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'export.php';
        
        const dataInput = document.createElement('input');
        dataInput.type = 'hidden';
        dataInput.name = 'export_data';
        // On ne passe que les données brutes, pas les scores calculés
        dataInput.value = JSON.stringify(offersData.map(d => ({
            name: d.name,
            cost: d.cost,
            sla: d.sla,
            quality: d.quality,
            feeling: d.feeling
        })));
        
        form.appendChild(dataInput);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    });

    // --- FONCTIONS AUXILIAIRES ---

    function getOffersData() {
        const data = [];
        // Offres individuelles non masquées
        offersContainer.querySelectorAll('.offer-card:not(.hidden)').forEach(card => {
            const name = card.querySelector('.offer-name').value || `Offre ${card.dataset.id}`;
            const cost = parseFloat(card.querySelector('.offer-cost').value);
            const sla = parseFloat(card.querySelector('.offer-sla').value);
            const quality = parseFloat(card.querySelector('.offer-quality').value);
            const feeling = parseFloat(card.querySelector('.offer-feeling').value);
            if (![cost, sla, quality, feeling].some(isNaN)) {
                data.push({ name, cost, sla, quality, feeling });
            }
        });
        // Offres groupées
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

        // Bar Chart
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

        // Radar Chart
        if (radarChart) radarChart.destroy();
        radarChart = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Coût', 'Service (SLA)', 'Matériel', 'Ressenti'],
                datasets: results.map((r, index) => {
                    const colors = ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)'];
                    return {
                        label: r.name,
                        data: [r.scores.scoreCost, r.scores.scoreSla, r.scores.scoreQuality, r.scores.scoreFeeling].map(s => s.toFixed(2)),
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