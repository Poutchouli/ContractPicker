// js/ui.js
export const UIManager = (() => {
    const DOM = {
        listeOffresContainer: document.getElementById('liste-offres'), formOffre: document.getElementById('form-offre'), coutsAdditionnelsContainer: document.getElementById('couts-additionnels-container'), 
        fabricantSelect: document.getElementById('fabricant'), modeleSelect: document.getElementById('modele'), prixIndicatifModele: document.getElementById('prix-indicatif-modele'),
        actionsSelectionBox: document.getElementById('actions-selection'), sectionResultats: document.getElementById('section-resultats'), tableauResultats: document.getElementById('tableau-resultats'),
        graphiqueScoresCanvas: document.getElementById('graphique-scores'), graphiqueRadarCanvas: document.getElementById('graphique-radar'), memoContainer: document.getElementById('memo-container'), 
        questionnaireContainer: document.getElementById('questionnaire-container'), statusIndicator: document.getElementById('status-indicator'),
        typeContratSelect: document.getElementById('type-contrat'), analyseContainer: document.getElementById('analyse-container'),
        modals: {
            offre: document.getElementById('offre-modal'),
            ai: document.getElementById('ai-settings-modal'),
        },
        modalTitle: document.getElementById('modal-title'),
    };
    let monGraphiqueScores = null, monGraphiqueRadar = null;

    return {
        afficherListeOffres: (offres, modelesDb) => {
            DOM.listeOffresContainer.innerHTML = '';
            if (offres.length === 0) { DOM.listeOffresContainer.innerHTML = '<p style="text-align:center; color: var(--couleur-texte-secondaire);">Aucune offre enregistrée.</p>'; return; }
            const offresAffichees = offres.filter(o => o.parent === null);
            offresAffichees.forEach(offre => {
                const offreDiv = document.createElement('div');
                offreDiv.className = 'offre-item';
                offreDiv.dataset.id = offre.id;
                let nomAffichage = `${offre.prestataire} - ${offre.modele}`;
                let actionsHTML = `
                    <button class="btn-duplicate" data-id="${offre.id}" title="Dupliquer"><i class="fa-regular fa-copy"></i></button>
                    <button class="btn-edit" data-id="${offre.id}" title="Modifier"><i class="fa-regular fa-pen-to-square"></i></button>
                    <button class="btn-delete" data-id="${offre.id}" title="Supprimer"><i class="fa-regular fa-trash-can"></i></button>`;

                if(offre.isGroup) {
                    offreDiv.classList.add('is-group');
                    nomAffichage = `${offre.prestataire} (Groupe - ${offre.children.length} contrats)`;
                    actionsHTML += `<button class="btn-ungroup" data-id="${offre.id}" title="Dégrouper"><i class="fa-solid fa-object-ungroup"></i></button>`;
                } else if (modelesDb[offre.modele]) {
                    nomAffichage = `${offre.prestataire} - ${modelesDb[offre.modele].fabricant} ${offre.modele}`;
                }

                offreDiv.innerHTML = `
                    <div class="offre-item-header">
                        <div class="offre-item-header-info">
                            <i class="fa-solid fa-grip-vertical drag-handle"></i>
                            <input type="checkbox" class="offre-checkbox" data-id="${offre.id}">
                            <strong>${nomAffichage}</strong>
                        </div>
                        <div class="offre-item-header-actions">${actionsHTML}</div>
                    </div>
                    ${!offre.isGroup ? `<div class="ressenti-slider-container">
                        <label for="ressenti-${offre.id}">Votre ressenti :</label>
                        <input type="range" id="ressenti-${offre.id}" class="ressenti-slider" data-id="${offre.id}" min="0" max="100" value="${offre.ressenti || 50}">
                        <span id="valeur-ressenti-${offre.id}">${offre.ressenti || 50}</span>
                    </div>` : ''}`;
                DOM.listeOffresContainer.appendChild(offreDiv);
                if(offre.isGroup) {
                    offre.children.forEach(childId => {
                        const childOffre = offres.find(o => o.id === childId);
                        if(childOffre) {
                            const childDiv = document.createElement('div');
                            childDiv.className = 'offre-item is-child';
                            childDiv.innerHTML = `<span><i class="fa-solid fa-turn-up fa-rotate-90"></i> ${childOffre.prestataire} - ${childOffre.modele}</span>`;
                            DOM.listeOffresContainer.appendChild(childDiv);
                        }
                    })
                }
            });
            UIManager.updateActionsSelectionBox();
        },
        toggleOfferModal: (show, offre = null) => {
            if (show) {
                if (offre) {
                    DOM.modalTitle.textContent = "Modifier l'Offre";
                    UIManager.remplirFormulairePourEdition(offre, DataManager.getConfig().MODELES_COPIEURS);
                } else {
                    DOM.modalTitle.textContent = "Ajouter une Nouvelle Offre";
                    UIManager.resetFormulaire();
                }
            }
            DOM.modals.offre.style.display = show ? 'flex' : 'none';
        },
        toggleModal: (type, show) => { // Pour la modale IA
            const modal = DOM.modals[type];
            if (modal) {
                modal.style.display = show ? 'flex' : 'none';
                if (show && type === 'ai') {
                    document.getElementById('gemini-api-key').value = localStorage.getItem('geminiApiKey_v1') || '';
                }
            }
        },
        // ... le reste des fonctions UI ...
        updateActionsSelectionBox: () => {
            const selection = Array.from(document.querySelectorAll('.offre-checkbox:checked'));
            DOM.actionsSelectionBox.style.display = selection.length > 0 ? 'flex' : 'none';
        },
        resetFormulaire: () => {
            DOM.formOffre.reset();
            DOM.coutsAdditionnelsContainer.innerHTML = '';
            document.getElementById('offre-id').value = '';
            UIManager.majSelectModele('');
            DOM.prixIndicatifModele.textContent = '';
            DOM.formOffre.querySelector('button[type="submit"]').innerHTML = '<i class="fa-solid fa-save"></i> Enregistrer';
        },
        ajouterChampCout: (description = '', montant = '', periodicite = '') => {
            const div = document.createElement('div');
            div.className = 'cout-additionnel-item form-grid';
            div.style.marginBottom = '1rem'; div.style.alignItems = 'flex-end';
            div.innerHTML = `
                <div class="form-group grid-span-2"><input type="text" class="cout-desc" placeholder="Description" value="${description}" required></div>
                <div class="form-group"><input type="number" step="0.01" class="cout-montant" placeholder="Montant (€)" value="${montant}" required></div>
                <div class="form-group"><input type="number" class="cout-periodicite" placeholder="Périodicité (mois)" value="${periodicite}" required></div>
                <button type="button" class="btn btn-danger btn-remove-cout" style="padding:0.75rem; height:100%;"><i class="fa-solid fa-xmark"></i></button>`;
            DOM.coutsAdditionnelsContainer.appendChild(div);
        },
        remplirFormulairePourEdition: (offre, modelesDb) => {
            UIManager.resetFormulaire();
            const modeleData = modelesDb[offre.modele];
            if (modeleData) {
                DOM.fabricantSelect.value = modeleData.fabricant;
                UIManager.majSelectModele(modeleData.fabricant, modelesDb);
                DOM.modeleSelect.value = offre.modele;
                DOM.prixIndicatifModele.textContent = `Prix indicatif: ${modeleData.prix_indicatif} €`;
            }
            document.getElementById('offre-id').value = offre.id;
            document.getElementById('prestataire').value = offre.prestataire;
            document.getElementById('gti-heures').value = offre.gti_heures;
            document.getElementById('duree').value = offre.duree;
            document.getElementById('location').value = offre.location;
            document.getElementById('cout-nb').value = offre.coutNb;
            document.getElementById('cout-couleur').value = offre.coutCouleur;
            document.getElementById('notes').value = offre.notes;
            (offre.coutsAdditionnels || []).forEach(cout => UIManager.ajouterChampCout(cout.description, cout.montant, cout.periodicite));
            DOM.formOffre.querySelector('button[type="submit"]').innerHTML = '<i class="fa-solid fa-sync-alt"></i> Mettre à jour';
        },
        initialiserSelects: (config) => {
            const fabricants = config.MODELES_COPIEURS ? [...new Set(Object.values(config.MODELES_COPIEURS).map(m => m.fabricant))] : [];
            DOM.fabricantSelect.innerHTML = '<option value="">-- Choisir --</option>';
            fabricants.sort().forEach(f => { const option = document.createElement('option'); option.value = f; option.textContent = f; DOM.fabricantSelect.appendChild(option); });
            const typesContrat = config.CONTRATS_TYPES ? Object.keys(config.CONTRATS_TYPES) : [];
            DOM.typeContratSelect.innerHTML = '<option value="">-- Choisir un type --</option>';
            typesContrat.forEach(type => { const option = document.createElement('option'); option.value = type; option.textContent = type.charAt(0).toUpperCase() + type.slice(1); DOM.typeContratSelect.appendChild(option); });
        },
        majSelectModele: (fabricant, modelesDb = {}) => {
            DOM.modeleSelect.innerHTML = '<option value="">-- Choisir --</option>';
            DOM.prixIndicatifModele.textContent = '';
            if(!fabricant) return;
            Object.entries(modelesDb).forEach(([nomModele, data]) => {
                if(data.fabricant === fabricant) { const option = document.createElement('option'); option.value = nomModele; option.textContent = nomModele; DOM.modeleSelect.appendChild(option); }
            });
        },
        afficherResultats: (resultats, dureeSim) => {
            DOM.sectionResultats.style.display = 'block';
            DOM.tableauResultats.innerHTML = `
                <thead><tr><th>#</th><th>Offre</th><th>Score Final</th><th>Coût Total</th><th>SLA (GTI)</th></tr></thead>
                <tbody>
                    ${resultats.map((res, index) => `<tr style="--row-color: ${index === 0 && resultats.length > 1 ? 'var(--couleur-succes)' : 'var(--couleur-secondaire)'};">
                        <td><strong style="color: var(--row-color);">${resultats.length > 1 ? index + 1 : '-'}</strong></td>
                        <td>${res.prestataire}</td>
                        <td class="score-final" style="color: var(--row-color);">${res.score_final.toFixed(1)}</td>
                        <td>${res.tco.toFixed(2)} €</td>
                        <td>${res.gti_heures.toFixed(1)}h</td>
                    </tr>`).join('')}
                </tbody>`;
            if (monGraphiqueScores) monGraphiqueScores.destroy();
            const ctxScores = DOM.graphiqueScoresCanvas.getContext('2d');
            monGraphiqueScores = new Chart(ctxScores, {
                type: 'bar', data: { labels: resultats.map(r => r.prestataire), datasets: [{ label: `Score Final Pondéré`, data: resultats.map(r => r.score_final.toFixed(1)), backgroundColor: resultats.map((r, i) => i === 0 && resultats.length > 1 ? 'rgba(25, 135, 84, 0.7)' : 'rgba(13, 110, 253, 0.7)'), borderColor: resultats.map((r, i) => i === 0 && resultats.length > 1 ? 'var(--couleur-succes)' : 'var(--couleur-principale)'), borderWidth: 1 }] },
                options: { indexAxis: 'y', scales: { x: { beginAtZero: true, max: 100, ticks: { color: 'white' }}, y: { ticks: { color: 'white' }}}, plugins: { legend: { labels: { color: 'white' }}}}
            });
            if (monGraphiqueRadar) monGraphiqueRadar.destroy();
            const ctxRadar = DOM.graphiqueRadarCanvas.getContext('2d');
            const labels = ['🐖 Coût', '⏱️ Service', '⚙️ Matériel', '🤔 Ressenti'];
            const datasets = resultats.slice(0, 4).map((res, index) => {
                const colors = ['rgba(13, 110, 253, 0.5)', 'rgba(25, 135, 84, 0.5)', 'rgba(255, 193, 7, 0.5)', 'rgba(220, 53, 69, 0.5)'];
                return {
                    label: res.prestataire, data: [res.score_cout, res.score_qualite, res.score_modele_moyen, res.isGroup ? 50 : res.ressenti],
                    backgroundColor: colors[index % colors.length], borderColor: colors[index % colors.length].replace('0.5', '1'), pointBackgroundColor: colors[index % colors.length].replace('0.5', '1'),
                };
            });
            monGraphiqueRadar = new Chart(ctxRadar, {
                type: 'radar', data: { labels, datasets },
                options: { scales: { r: { angleLines: { color: 'rgba(255, 255, 255, 0.2)' }, grid: { color: 'rgba(255, 255, 255, 0.2)' }, pointLabels: { color: 'white', font: { size: 14 } }, ticks: { color: 'black', backdropColor: 'rgba(255, 255, 255, 0.8)', stepSize: 20 }, min: 0, max: 100 }}, plugins: { legend: { labels: { color: 'white' } } }}
            });
            DOM.sectionResultats.scrollIntoView({behavior: 'smooth'});
        },
        afficherAnalyse: (texte, isLoading) => {
            const container = document.getElementById('section-analyse');
            const content = document.getElementById('analyse-container');
            container.style.display = 'block';
            content.innerHTML = texte.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            content.classList.toggle('loading', isLoading);
        },
        afficherMemo: (memo) => {
             DOM.memoContainer.innerHTML = `<h4><i class="fa-solid fa-circle-info"></i> ${memo.titre}</h4><ul>${memo.points.map(p => `<li>${p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`).join('')}</ul>`;
            DOM.memoContainer.style.display = 'block';
        },
        cacherMemo: () => { DOM.memoContainer.style.display = 'none'; },
        afficherQuestionnaire: (questions) => {
            DOM.questionnaireContainer.innerHTML = '';
            questions.forEach(q => {
                const qDiv = document.createElement('div');
                qDiv.className = 'question-item';
                qDiv.innerHTML = `<p>${q.q}</p><button data-desc="${q.desc}" data-per="${q.periodicite}" class="btn btn-secondaire"><i class="fa-solid fa-plus"></i></button>`;
                DOM.questionnaireContainer.appendChild(qDiv);
            });
        },
        cacherQuestionnaire: () => { DOM.questionnaireContainer.innerHTML = ''; },
        setStatut: (status) => {
            const indicator = DOM.statusIndicator;
            indicator.classList.remove('secure', 'local', 'fallback');
            if (status === 'secure') { indicator.textContent = 'Mode Sécurisé'; indicator.classList.add('secure'); } 
            else if (status === 'local') { indicator.textContent = 'Mode Développement'; indicator.classList.add('local'); } 
            else { indicator.textContent = 'Mode Dégradé'; indicator.classList.add('fallback'); }
        }
    };
})();
