// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
    const addOfferBtn = document.getElementById('add-offer-btn');
    const offersContainer = document.getElementById('offers-container');
    const calculateBtn = document.getElementById('calculate-btn');
    const exportBtn = document.getElementById('export-csv-btn');

    const barChartCtx = document.getElementById('bar-chart').getContext('2d');
    const radarChartCtx = document.getElementById('radar-chart').getContext('2d');
    let barChart, radarChart;

    // --- LOGIQUE D'AJOUT D'OFFRE ---
    addOfferBtn.addEventListener('click', () => {
        const offerTemplate = document.querySelector('.offer-card');
        const newOffer = offerTemplate.cloneNode(true);
        newOffer.removeAttribute('id'); // L'ID doit être unique
        newOffer.querySelectorAll('input').forEach(input => input.value = '');
        offersContainer.appendChild(newOffer);
    });

    // --- MISE À JOUR VISUELLE DES POIDS ---
    document.querySelectorAll('.weights input[type="range"]').forEach(slider => {
        slider.addEventListener('input', (e) => {
            document.getElementById(`${e.target.id}-value`).textContent = `${e.target.value}%`;
        });
    });

    // --- LE CŒUR : CALCUL DES SCORES ---
    calculateBtn.addEventListener('click', () => {
        const offersData = getOffersData();
        if (offersData.length === 0) {
            alert("Veuillez renseigner au moins une offre.");
            return;
        }
        const weights = getWeights();
        const results = calculateScores(offersData, weights);
        
        // Trier les résultats par score final décroissant
        results.sort((a, b) => b.finalScore - a.finalScore);
        
        updateBarChart(results);
        updateRadarChart(results);
    });

    // --- FONCTIONS AUXILIAIRES ---

    function getOffersData() {
        const offerCards = offersContainer.querySelectorAll('.offer-card');
        const data = [];
        offerCards.forEach((card, index) => {
            const name = card.querySelector('.offer-name').value || `Offre ${index + 1}`;
            const cost = parseFloat(card.querySelector('.offer-cost').value);
            const sla = parseFloat(card.querySelector('.offer-sla').value);
            const quality = parseFloat(card.querySelector('.offer-quality').value);
            const feeling = parseFloat(card.querySelector('.offer-feeling').value);
            
            if (!isNaN(cost) && !isNaN(sla) && !isNaN(quality) && !isNaN(feeling)) {
                data.push({ name, cost, sla, quality, feeling });
            }
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
        // Normalisation : convertir chaque valeur en un score de 0 à 100
        // Pour le coût et le SLA, plus la valeur est basse, meilleur est le score (inversion).
        const costs = offers.map(o => o.cost);
        const slas = offers.map(o => o.sla);
        const minCost = Math.min(...costs);
        const maxCost = Math.max(...costs);
        const minSla = Math.min(...slas);
        const maxSla = Math.max(...slas);

        // Calcule le score normalisé de 0 à 100
        const normalize = (value, min, max, invert = false) => {
            if (max === min) return 100; // Éviter la division par zéro si toutes les valeurs sont égales
            const score = ((value - min) / (max - min)) * 100;
            return invert ? 100 - score : score;
        };

        const results = offers.map(offer => {
            const scoreCost = normalize(offer.cost, minCost, maxCost, true);
            const scoreSla = normalize(offer.sla, minSla, maxSla, true);
            const scoreQuality = offer.quality; // Déjà sur 100
            const scoreFeeling = offer.feeling; // Déjà sur 100
            
            // Calcul du score pondéré final
            const totalWeight = weights.cost + weights.sla + weights.quality + weights.feeling;
            if (totalWeight === 0) return { ...offer, finalScore: 0, scores: { scoreCost, scoreSla, scoreQuality, scoreFeeling } };

            const finalScore = (
                (scoreCost * weights.cost) +
                (scoreSla * weights.sla) +
                (scoreQuality * weights.quality) +
                (scoreFeeling * weights.feeling)
            ) / totalWeight;

            return {
                ...offer,
                finalScore: finalScore,
                scores: { scoreCost, scoreSla, scoreQuality, scoreFeeling }
            };
        });

        return results;
    }

    // --- MISE À JOUR DES GRAPHIQUES ---

    function updateBarChart(results) {
        const labels = results.map(r => r.name);
        const data = results.map(r => r.finalScore.toFixed(2));
        
        if (barChart) barChart.destroy(); // Détruire l'ancien graphique pour le remplacer
        
        barChart = new Chart(barChartCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score Final (/100)',
                    data: data,
                    backgroundColor: 'rgba(0, 123, 255, 0.7)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });
    }

    function updateRadarChart(results) {
        const labels = ['Coût', 'Service (SLA)', 'Matériel', 'Ressenti'];
        const datasets = results.map((r, index) => {
            const colors = ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)'];
            return {
                label: r.name,
                data: [
                    r.scores.scoreCost.toFixed(2),
                    r.scores.scoreSla.toFixed(2),
                    r.scores.scoreQuality.toFixed(2),
                    r.scores.scoreFeeling.toFixed(2)
                ],
                backgroundColor: colors[index % colors.length],
                borderColor: colors[index % colors.length].replace('0.5', '1'),
                borderWidth: 1
            };
        });

        if (radarChart) radarChart.destroy();

        radarChart = new Chart(radarChartCtx, {
            type: 'radar',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { display: false },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    }

    // --- GESTION EXPORT CSV ---
    exportBtn.addEventListener('click', () => {
        const offersData = getOffersData();
        if (offersData.length === 0) {
            alert("Rien à exporter.");
            return;
        }
        
        // Nous allons créer un formulaire en mémoire et le soumettre à notre script PHP
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'export.php';
        
        const dataInput = document.createElement('input');
        dataInput.type = 'hidden';
        dataInput.name = 'export_data';
        dataInput.value = JSON.stringify(offersData);
        
        form.appendChild(dataInput);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    });
});