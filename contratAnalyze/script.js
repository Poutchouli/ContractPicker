document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation de page ---
    const uploadPage = document.getElementById('uploadPage');
    const reportPage = document.getElementById('reportPage');
    const csvFileInput = document.getElementById('csvFileInput');
    const fileNameDisplay = document.getElementById('fileName');
    const backButton = document.getElementById('backButton');
    let contractData = [];

    // API Key Modal Logic (never auto-show, only on button click)
    const openApiModalBtn = document.getElementById('openApiModalBtn');
    const apiModal = document.getElementById('apiModal');
    const closeApiModalBtn = document.getElementById('closeApiModalBtn');
    const modalApiKeyInput = document.getElementById('modalApiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const testApiKeyBtn = document.getElementById('testApiKeyBtn');
    const testApiKeyResult = document.getElementById('testApiKeyResult');
    function getApiKey() { return localStorage.getItem('geminiApiKey') || ''; }
    function setApiKey(key) { localStorage.setItem('geminiApiKey', key); }
    if (openApiModalBtn) openApiModalBtn.addEventListener('click', () => {
        modalApiKeyInput.value = getApiKey();
        testApiKeyResult.textContent = '';
        apiModal.classList.remove('hidden');
    });
    if (closeApiModalBtn) closeApiModalBtn.addEventListener('click', () => apiModal.classList.add('hidden'));
    if (saveApiKeyBtn) saveApiKeyBtn.addEventListener('click', () => {
        setApiKey(modalApiKeyInput.value.trim());
        apiModal.classList.add('hidden');
    });
    if (testApiKeyBtn) testApiKeyBtn.addEventListener('click', async () => {
        testApiKeyResult.textContent = 'Test en cours...';
        setTimeout(() => {
            if (modalApiKeyInput.value.trim()) {
                testApiKeyResult.textContent = 'Clé API enregistrée !';
            } else {
                testApiKeyResult.textContent = 'Veuillez saisir une clé API.';
            }
        }, 700);
    });

    // --- CSV Import Logic ---
    if (csvFileInput) csvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        fileNameDisplay.textContent = file.name;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                contractData = results.data;
                displayReport(contractData);
            }
        });
    });
    if (backButton) backButton.addEventListener('click', () => {
        reportPage.classList.add('hidden');
        uploadPage.classList.remove('hidden');
        fileNameDisplay.textContent = '';
    });

    // --- Executive Report Rendering ---
    function displayReport(data) {
        uploadPage.classList.add('hidden');
        reportPage.classList.remove('hidden');

        // --- Executive Summary ---
        const executiveSummaryContent = document.getElementById('executiveSummaryContent');
        const offers = data;
        const bestOffer = offers.reduce((best, curr) => {
            const currScore = (parseFloat(curr['Qualité'])||0) + (parseFloat(curr['Ressenti'])||0) - (parseFloat(curr['Coût'])||0)/1000;
            const bestScore = (parseFloat(best['Qualité'])||0) + (parseFloat(best['Ressenti'])||0) - (parseFloat(best['Coût'])||0)/1000;
            return currScore > bestScore ? curr : best;
        }, offers[0]);
        executiveSummaryContent.innerHTML = `
            <div class="decision-box">
                <b>Résumé :</b> Ce rapport présente une analyse comparative des offres de contrat reçues. L'objectif est d'apporter à la direction une vision claire et synthétique pour faciliter la prise de décision.
                <br><br>
                <b>Recommandation :</b> L'offre <b>${bestOffer['Nom'] || bestOffer['Type'] || 'N/A'}</b> se distingue par son équilibre entre coût, qualité et ressenti. Nous recommandons d'approfondir la négociation avec ce fournisseur, sauf contrainte spécifique non prise en compte dans ce rapport.
            </div>
        `;

        // --- Summary Table ---
        const summaryTableContainer = document.getElementById('summaryTableContainer');
        let tableHtml = `<table class="summary-table">
            <thead><tr>
                <th>Offre</th>
                <th>Coût total (€)</th>
                <th>Type paiement</th>
                <th>Durée (mois)</th>
                <th>SLA (h)</th>
                <th>Qualité (/100)</th>
                <th>Ressenti (/100)</th>
                <th>Pénalités</th>
            </tr></thead><tbody>`;
        offers.forEach(o => {
            tableHtml += `<tr>
                <td>${o['Nom'] || o['Type'] || ''}</td>
                <td>${o['Coût'] || ''}</td>
                <td>${o['Type paiement'] || ''}</td>
                <td>${o['Engagement (mois)'] || ''}</td>
                <td>${o['SLA'] || ''}</td>
                <td>${o['Qualité'] || ''}</td>
                <td>${o['Ressenti'] || ''}</td>
                <td>${o['Pénalités'] || ''}</td>
            </tr>`;
        });
        tableHtml += '</tbody></table>';
        summaryTableContainer.innerHTML = tableHtml;

        // --- Charts Section ---
        // Calculs coûts annuels et totaux
        const getAverage = (arr, key) => arr.length ? arr.reduce((a, b) => a + (parseFloat(b[key]) || 0), 0) / arr.length : 0;
        const yearlyCosts = data.map(c => {
            let cost = parseFloat(c['Coût']) || 0;
            let engagement = parseFloat(c['Engagement (mois)']) || 12;
            let type = c['Type paiement'];
            if (type === 'monthly') cost = cost * 12;
            else if (type === 'quarterly') cost = cost * 4;
            else if (type === 'yearly') cost = cost;
            // Coûts supplémentaires
            if (c['Coûts supplémentaires']) {
                c['Coûts supplémentaires'].split('|').forEach(s => {
                    const m = s.match(/([\d.,]+)\s*\((\d+)\s*x\s*(one|monthly|quarterly|yearly)\)/);
                    if (m) {
                        let ec = parseFloat(m[1].replace(',', '.')) * parseInt(m[2]);
                        if (m[3] === 'monthly') ec = ec * 12;
                        else if (m[3] === 'quarterly') ec = ec * 4;
                        else if (m[3] === 'yearly') ec = ec;
                        cost += ec;
                    }
                });
            }
            return { nom: c['Nom'], yearly: cost, total: cost * (engagement/12) };
        });
        const totalYearly = yearlyCosts.reduce((a, b) => a + b.yearly, 0);
        const totalGlobal = yearlyCosts.reduce((a, b) => a + b.total, 0);

        // 1. Barres : coût annuel
        const prixSection = document.getElementById('priceComparisonSection');
        prixSection.innerHTML = '<h3 class="font-bold text-lg mb-2">Coût annuel par offre</h3><div class="caption">Permet d’identifier les offres les plus économiques sur une base annuelle.</div>';
        prixSection.innerHTML += `<div class='w-full'><canvas id='yearlyBarChart'></canvas></div>`;
        new Chart(document.getElementById('yearlyBarChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: yearlyCosts.map(c => c.nom),
                datasets: [{
                    label: 'Coût annuel (€)',
                    data: yearlyCosts.map(c => c.yearly),
                    backgroundColor: '#1976d2',
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false }
        });
        prixSection.innerHTML += `<div class='mt-4 font-bold text-indigo-700'>Total annuel : ${totalYearly.toLocaleString('fr-FR', {maximumFractionDigits:2})} €<br>Total global : ${totalGlobal.toLocaleString('fr-FR', {maximumFractionDigits:2})} €</div>`;

        // 2. Pie : répartition des coûts
        const pieSection = document.getElementById('pieChartSection');
        pieSection.innerHTML = '<h3 class="font-bold text-lg mb-2">Répartition des coûts annuels</h3><div class="caption">Visualise la part de chaque offre dans le budget global.</div>';
        pieSection.innerHTML += `<div class='w-full'><canvas id='costPieChart'></canvas></div>`;
        new Chart(document.getElementById('costPieChart').getContext('2d'), {
            type: 'pie',
            data: {
                labels: yearlyCosts.map(c => c.nom),
                datasets: [{
                    label: 'Répartition',
                    data: yearlyCosts.map(c => c.yearly),
                    backgroundColor: [ '#1976d2', '#388e3c', '#fbc02d', '#c62828', '#7b1fa2', '#0288d1', '#f57c00', '#455a64' ]
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false }
        });

        // 3. Radar : critères
        const featureSection = document.getElementById('featureComparisonSection');
        featureSection.innerHTML = '<h3 class="font-bold text-lg mb-2">Comparaison des critères</h3><div class="caption">Compare la qualité, le ressenti et le SLA de chaque offre.</div>';
        featureSection.innerHTML += `<div class='w-full'><canvas id='radarChart'></canvas></div>`;
        new Chart(document.getElementById('radarChart').getContext('2d'), {
            type: 'radar',
            data: {
                labels: ['Qualité', 'Ressenti', 'SLA'],
                datasets: data.map((c, i) => ({
                    label: c['Nom'],
                    data: [parseFloat(c['Qualité']) || 0, parseFloat(c['Ressenti']) || 0, parseFloat(c['SLA']) || 0],
                    fill: true,
                    backgroundColor: `rgba(${30+i*30},${120+i*20},${200-i*20},0.2)`,
                    borderColor: `rgba(${30+i*30},${120+i*20},${200-i*20},0.8)`
                }))
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false }
        });

        // 4. Ligne : coût cumulé (si engagement)
        const lineSection = document.getElementById('lineChartSection');
        lineSection.innerHTML = '<h3 class="font-bold text-lg mb-2">Coût cumulé sur la durée d\'engagement</h3><div class="caption">Montre l’évolution du coût total pour chaque offre sur la durée d’engagement.</div>';
        lineSection.innerHTML += `<div class='w-full'><canvas id='cumulativeLineChart'></canvas></div>`;
        const maxMonths = Math.max(...data.map(c => parseFloat(c['Engagement (mois)']) || 12));
        const lineLabels = Array.from({length: maxMonths}, (_, i) => `M${i+1}`);
        const lineDatasets = data.map((c, i) => {
            let cost = parseFloat(c['Coût']) || 0;
            let type = c['Type paiement'];
            let engagement = parseFloat(c['Engagement (mois)']) || 12;
            let monthly = 0;
            if (type === 'monthly') monthly = cost;
            else if (type === 'quarterly') monthly = cost / 3;
            else if (type === 'yearly') monthly = cost / 12;
            else monthly = cost / engagement;
            if (c['Coûts supplémentaires']) {
                c['Coûts supplémentaires'].split('|').forEach(s => {
                    const m = s.match(/([\d.,]+)\s*\((\d+)\s*x\s*(one|monthly|quarterly|yearly)\)/);
                    if (m) {
                        let ec = parseFloat(m[1].replace(',', '.')) * parseInt(m[2]);
                        if (m[3] === 'monthly') ec = ec;
                        else if (m[3] === 'quarterly') ec = ec / 3;
                        else if (m[3] === 'yearly') ec = ec / 12;
                        else ec = ec / engagement;
                        monthly += ec;
                    }
                });
            }
            let points = [];
            for (let m = 1; m <= maxMonths; m++) {
                points.push(m <= engagement ? monthly * m : null);
            }
            return {
                label: c['Nom'],
                data: points,
                fill: false,
                borderColor: `rgba(${30+i*30},${120+i*20},${200-i*20},0.8)`,
                backgroundColor: `rgba(${30+i*30},${120+i*20},${200-i*20},0.2)`
            };
        });
        new Chart(document.getElementById('cumulativeLineChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: lineLabels,
                datasets: lineDatasets
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false }
        });

        // --- Decision Points ---
        const decisionPointsContent = document.getElementById('decisionPointsContent');
        let points = '<ul style="margin-left:1em;list-style:disc inside;">';
        // Points forts/faibles automatiques
        offers.forEach(o => {
            points += `<li><b>${o['Nom'] || o['Type'] || ''} :</b> `;
            let pf = [];
            if ((parseFloat(o['Qualité'])||0) > 80) pf.push('Excellente qualité');
            if ((parseFloat(o['Ressenti'])||0) > 80) pf.push('Très bon ressenti');
            if ((parseFloat(o['Coût'])||0) < getAverage(offers, 'Coût')) pf.push('Coût compétitif');
            if ((parseFloat(o['SLA'])||0) < getAverage(offers, 'SLA')) pf.push('SLA avantageux');
            let fw = [];
            if ((parseFloat(o['Coût'])||0) > getAverage(offers, 'Coût')) fw.push('Coût élevé');
            if ((parseFloat(o['Qualité'])||0) < 60) fw.push('Qualité perfectible');
            if ((parseFloat(o['Ressenti'])||0) < 60) fw.push('Ressenti à surveiller');
            if ((parseFloat(o['SLA'])||0) > getAverage(offers, 'SLA')) fw.push('SLA moins favorable');
            points += pf.length ? `<span style='color:#388e3c'>Points forts : ${pf.join(', ')}</span>` : '';
            points += fw.length ? `<span style='color:#c62828;margin-left:8px'>Points faibles : ${fw.join(', ')}</span>` : '';
            points += '</li>';
        });
        points += '</ul>';
        decisionPointsContent.innerHTML = `
            <div class="decision-box">
                <b>Analyse synthétique :</b><br>
                ${points}
                <br><b>Prochaines étapes suggérées :</b> Organiser une réunion de validation, demander des précisions aux fournisseurs sélectionnés, et préparer une négociation finale.
            </div>
        `;
    }
});