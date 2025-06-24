// js/ui.js
export const UIManager = (() => {
    const DOM = {
        listeOffresContainer: document.getElementById('liste-offres'), formOffre: document.getElementById('form-offre'), coutsAdditionnelsContainer: document.getElementById('couts-additionnels-container'), 
        fabricantSelect: document.getElementById('fabricant'), modeleSelect: document.getElementById('modele'), prixIndicatifModele: document.getElementById('prix-indicatif-modele'),
        sectionResultats: document.getElementById('section-resultats'), tableauResultats: document.getElementById('tableau-resultats'),
        graphiqueScoresCanvas: document.getElementById('graphique-scores'), graphiqueRadarCanvas: document.getElementById('graphique-radar'), memoContainer: document.getElementById('memo-container'), 
        questionnaireContainer: document.getElementById('questionnaire-container'), statusIndicator: document.getElementById('status-indicator'),
        typeContratSelect: document.getElementById('type-contrat'), analyseContainer: document.getElementById('analyse-container'),
        modals: { offre: document.getElementById('offre-modal'), ai: document.getElementById('ai-settings-modal'), },
        modalTitle: document.getElementById('modal-title'),
        actionsSelectionBox: document.getElementById('actions-selection'),
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
                let nomAffichage, actionsHTML;
                
                if(offre.isGroup) {
                    offreDiv.classList.add('is-group');
                    nomAffichage = `${offre.prestataire} (Groupe - ${offre.children.length} contrats)`;
                    actionsHTML = `<button class="btn-group-actions" data-action="toggle-group-menu" data-id="${offre.id}" title="Actions du groupe"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                   <div class="group-actions-menu" data-id="${offre.id}">
                                     <button data-action="ungroup-offer" data-id="${offre.id}"><i class="fa-solid fa-object-ungroup"></i> Dégrouper</button>
                                     <button data-action="delete-group" data-id="${offre.id}"><i class="fa-solid fa-trash-can"></i> Supprimer</button>
                                   </div>`;
                } else {
                    nomAffichage = `${offre.prestataire} - ${modelesDb[offre.modele]?.fabricant || ''} ${offre.modele}`;
                    actionsHTML = `<button data-action="edit-offer" data-id="${offre.id}" title="Modifier"><i class="fa-regular fa-pen-to-square"></i></button>`;
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
                    </div>` : `<div class="remise-container">
                        <label for="remise-${offre.id}">Remise Groupe:</label>
                        <input type="number" id="remise-${offre.id}" class="remise-input" data-id="${offre.id}" min="0" max="100" value="${offre.remise_percent || 0}"> %
                    </div>`}
                `;
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
                    });
                }
            });
        },
        toggleOfferModal: (show, offre = null) => {
            const config = window.AppModules.DataManager.getConfig();
            if (show) {
                if (offre) {
                    DOM.modalTitle.textContent = "Modifier l'Offre";
                    UIManager.remplirFormulairePourEdition(offre, config.MODELES_COPIEURS);
                } else {
                    DOM.modalTitle.textContent = "Ajouter une Nouvelle Offre";
                    UIManager.resetFormulaire();
                }
            }
            DOM.modals.offre.style.display = show ? 'flex' : 'none';
        },
        toggleModal: (type, show) => {
            const modal = DOM.modals[type];
            if (modal) {
                modal.style.display = show ? 'flex' : 'none';
                if (show && type === 'ai') {
                    document.getElementById('gemini-api-key').value = localStorage.getItem('geminiApiKey_v1') || '';
                }
            }
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
                <button type="button" data-action="remove-cost-field" class="btn btn-danger btn-remove-cout" style="padding:0.75rem; height:100%;"><i class="fa-solid fa-xmark"></i></button>`;
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
            console.log("Types de contrat détectés :", typesContrat);
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
        afficherResultats: (resultats, dureeSim) => { /* ... */ },
        afficherAnalyse: (texte, isLoading) => { /* ... */ },
        afficherMemo: (memo) => { /* ... */ },
        cacherMemo: () => { DOM.memoContainer.style.display = 'none'; },
        afficherQuestionnaire: (questions) => { /* ... */ },
        cacherQuestionnaire: () => { DOM.questionnaireContainer.innerHTML = ''; },
        setStatut: (status) => { /* ... */ },
        toggleGroupMenu: (groupeId) => {
            const menu = document.querySelector(`.group-actions-menu[data-id='${groupeId}']`);
            if (menu) menu.classList.toggle('active');
        }
    };
})();
