// js/app.js
import { DataManager } from './data.js';
import { UIManager } from './ui.js';
import { AIAnalyzer } from './ai.js';

const App = (() => {
    let config = {};
    let DOM = {};

    const init = async () => {
        DOM = {
            mainContainer: document.getElementById('main-container'),
            formOffre: document.getElementById('form-offre'),
            formSimulation: document.getElementById('form-simulation'),
            typeContratSelect: document.getElementById('type-contrat'),
            questionnaireContainer: document.getElementById('questionnaire-container'),
            listeOffresContainer: document.getElementById('liste-offres'),
            poubelleZone: document.getElementById('poubelle-zone'),
            coutsAdditionnelsContainer: document.getElementById('couts-additionnels-container'),
            fabricantSelect: document.getElementById('fabricant'),
            modeleSelect: document.getElementById('modele'),
            sliders: {
                cout: document.getElementById('poids-cout'),
                qualite: document.getElementById('poids-qualite'),
                modele: document.getElementById('poids-modele'),
                ressenti: document.getElementById('poids-ressenti'),
            },
            buttons: {
                purgerOffres: document.querySelector('[data-action="purge-offers"]'),
                inputCsv: document.getElementById('input-csv'),
                groupSelection: document.getElementById('btn-grouper-selection'),
                deleteSelection: document.getElementById('btn-supprimer-selection'),
            },
            modals: {
                offre: document.getElementById('offre-modal'),
                ai: document.getElementById('ai-settings-modal'),
            },
            apiKeyInput: document.getElementById('gemini-api-key'),
        };
        

        const status = await DataManager.init(); // <-- récupère le statut ici
          config = DataManager.getConfig();
        console.log("Contrats types chargés :", config.CONTRATS_TYPES);
          window.AppModules = { DataManager };
        
          UIManager.setStatut(status); // <-- affiche le statut ici
        
          UIManager.initialiserSelects(config);
          UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
        
        
        initDragAndDrop();
        attachEventListeners();
        
    };
    
    const initDragAndDrop = () => {
        if (DOM.listeOffresContainer) {
            new Sortable(DOM.listeOffresContainer, {
                group: 'shared-offers', animation: 150, handle: '.drag-handle',
                onEnd: handleDragEnd, onMove: handleDragMove,
            });
        }
        if (DOM.poubelleZone) {
            new Sortable(DOM.poubelleZone, {
                group: 'shared-offers',
                onAdd: handleDropInTrash,
                onMove: () => DOM.poubelleZone.classList.add('drag-over'),
                onUnchoose: () => DOM.poubelleZone.classList.remove('drag-over')
            });
        }
    };

    const handleDragMove = (evt) => {
        document.querySelectorAll('.offre-item').forEach(el => el.classList.remove('drop-target'));
        const draggedItem = evt.item;
        const targetItem = evt.related;
        if (targetItem && !draggedItem.classList.contains('is-group') && targetItem.classList.contains('is-group')) {
            targetItem.classList.add('drop-target');
        }
        DOM.poubelleZone.classList.toggle('drag-over', evt.to === DOM.poubelleZone);
    };

    const handleDropInTrash = (evt) => {
        const offreId = parseInt(evt.item.dataset.id);
        evt.item.remove();
        if (confirm(`Êtes-vous sûr de vouloir supprimer cette offre ?`)) {
            DataManager.deleteOffre(offreId);
        }
        UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
    };
    
    const handleDragEnd = (evt) => {
        document.querySelectorAll('.offre-item').forEach(el => el.classList.remove('drop-target'));
        DOM.poubelleZone.classList.remove('drag-over');
        const { item, to, newIndex, oldIndex } = evt;
        const draggedId = parseInt(item.dataset.id);
        const draggedItem = DataManager.getOffreById(draggedId);
        
        if (to === DOM.listeOffresContainer) {
            const dropTargetElement = to.children[newIndex];
            if (dropTargetElement && draggedItem && !draggedItem.isGroup && dropTargetElement.classList.contains('is-group')) {
                const targetId = parseInt(dropTargetElement.dataset.id);
                if(confirm(`Voulez-vous ajouter cette offre au groupe "${DataManager.getOffreById(targetId).prestataire}" ?`)) {
                     handleGrouperOffres([draggedId], targetId);
                }
            } else {
                const offresParents = DataManager.getOffres().filter(o => o.parent === null);
                const [movedItem] = offresParents.splice(oldIndex, 1);
                offresParents.splice(newIndex, 0, movedItem);
                const offresEnfants = DataManager.getOffres().filter(o => o.parent !== null);
                DataManager.setOffres([...offresParents, ...offresEnfants]);
            }
        }
        UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
    };

    const attachEventListeners = () => {
        console.log("Écouteurs d'événements attachés");
        document.body.addEventListener('click', handleGlobalClick);
        DOM.formSimulation.addEventListener('submit', (e) => { e.preventDefault(); lancerSimulation(); });
        DOM.formOffre.addEventListener('submit', handleFormOffreSubmit);
        DOM.listeOffresContainer.addEventListener('input', handleListeOffresInput);
        DOM.listeOffresContainer.addEventListener('change', handleListeOffresChange);
        DOM.typeContratSelect.addEventListener('change', handleTypeContratChange);
        DOM.fabricantSelect.addEventListener('change', () => UIManager.majSelectModele(DOM.fabricantSelect.value, config.MODELES_COPIEURS));
        Object.values(DOM.sliders).forEach(slider => { slider.addEventListener('input', (e) => { document.getElementById(`valeur-${e.target.id}`).textContent = e.target.value; }); });
        DOM.buttons.inputCsv.addEventListener('change', handleFichierImport);
    };

    async function lancerSimulation() {
        console.log("Simulation lancée");
        const offresAComparer = DataManager.getOffres().filter(o => o.parent === null);
        if (offresAComparer.length === 0) { alert("Veuillez ajouter des offres pour lancer une simulation."); return; }
        const resultats = AIAnalyzer.calculerScores(offresAComparer, DOM, config.MODELES_COPIEURS, DataManager.getOffres());
        UIManager.afficherResultats(resultats, parseInt(document.getElementById('sim-duree').value));
        UIManager.afficherAnalyse("Génération de l'analyse...", true);
        const analyse = await AIAnalyzer.genererAnalyseTexte(resultats, config.ANALYSE_TEMPLATES);
        UIManager.afficherAnalyse(analyse, false);
    }
    
    function handleGlobalClick(e) {
        const actionTarget = e.target.closest('[data-action]');
        if (!actionTarget) {
            document.querySelectorAll('.group-actions-menu.active').forEach(menu => menu.classList.remove('active'));
            return;
        }

        e.stopPropagation(); // Empêcher le clic de se propager au body
        const { action, id } = actionTarget.dataset;
        const offreId = parseInt(id);
        const offre = offreId ? DataManager.getOffreById(offreId) : null;
        
        const actions = {
            'open-offer-modal': () => UIManager.toggleOfferModal(true),
            'close-offer-modal': () => UIManager.toggleOfferModal(false),
            'open-ai-modal': () => UIManager.toggleModal('ai', true),
            'close-ai-modal': () => UIManager.toggleModal('ai', false),
            'save-api-key': () => {
                AIAnalyzer.saveApiKey(DOM.apiKeyInput.value);
                UIManager.toggleModal('ai', false);
                alert("Clé API enregistrée !");
            },
            'add-cost-field': UIManager.ajouterChampCout,
            'simulate-offer': handleSimulerOffre,
            'purge-offers': handlePurgerOffres,
            'export-csv': handleExporterOffres,
            'import-csv': () => DOM.buttons.inputCsv.click(),
            'edit-offer': () => { if (offre) UIManager.toggleOfferModal(true, offre); },
            'toggle-group-menu': () => { if (offreId) UIManager.toggleGroupMenu(offreId); },
            'ungroup-offer': () => { if (offreId) handleDegrouperOffre(offreId); },
            'delete-group': () => { if (offreId && confirm('Supprimer ce groupe et toutes ses offres ?')) { DataManager.deleteOffre(offreId, true); UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS); } },
            'add-question-cost': () => {
                const { desc, per } = actionTarget.dataset;
                UIManager.ajouterChampCout(desc, '', per);
                actionTarget.disabled = true; actionTarget.innerHTML = '<i class="fa-solid fa-check"></i> Ajouté';
            },
            'group-selection': () => handleGrouperOffres(Array.from(document.querySelectorAll('.offre-checkbox:checked')).map(cb => parseInt(cb.dataset.id))),
            'delete-selection': () => handleSupprimerSelection()
        };
        
        if (actions[action]) actions[action]();
    }

    function handleFormOffreSubmit(e) { e.preventDefault();
        const id = document.getElementById('offre-id').value;
        const donnees = {
            prestataire: document.getElementById('prestataire').value, modele: document.getElementById('modele').value, gti_heures: parseInt(document.getElementById('gti-heures').value),
            duree: parseInt(document.getElementById('duree').value), location: parseFloat(document.getElementById('location').value), coutNb: parseFloat(document.getElementById('cout-nb').value),
            coutCouleur: parseFloat(document.getElementById('cout-couleur').value), notes: document.getElementById('notes').value, isGroup: false, children: [], parent: null, remise_percent: 0,
            coutsAdditionnels: Array.from(document.querySelectorAll('#couts-additionnels-container .cout-additionnel-item')).map(item => ({
                description: item.querySelector('.cout-desc').value, montant: parseFloat(item.querySelector('.cout-montant').value) || 0, periodicite: parseInt(item.querySelector('.cout-periodicite').value) || 0
            }))
        };
        if (!donnees.modele) { alert("Veuillez sélectionner un modèle."); return; }
        if (id) {
            const offreExistante = DataManager.getOffreById(parseInt(id));
            if (offreExistante) donnees.ressenti = offreExistante.ressenti;
            DataManager.updateOffre(id, donnees);
        } else { DataManager.addOffre({ id: Date.now(), ressenti: 50, ...donnees }); }
        UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
        UIManager.toggleOfferModal(false);
    }
    
    function handleListeOffresInput(e) {
        const target = e.target;
        const offreId = parseInt(target.closest('[data-id]')?.dataset.id);
        if (!offreId) return;
        if (target.classList.contains('ressenti-slider')) {
            DataManager.updateOffre(offreId, { ressenti: parseInt(target.value) });
            document.getElementById(`valeur-ressenti-${offreId}`).textContent = target.value;
        } else if (target.classList.contains('remise-input')) {
            DataManager.updateOffre(offreId, { remise_percent: parseFloat(target.value) || 0 });
        }
    }
    
    function handleListeOffresChange(e) {
        if(e.target.classList.contains('offre-checkbox')) {
            UIManager.updateActionsSelectionBox();
        }
    }

    function handleTypeContratChange(e) {
        const type = e.target.value;
        UIManager.cacherMemo(); UIManager.cacherQuestionnaire();
        if (!type) return;
        if (config.MEMOS_EXPERTS[type]) UIManager.afficherMemo(config.MEMOS_EXPERTS[type]);
        if (config.QUESTIONNAIRES[type]) UIManager.afficherQuestionnaire(config.QUESTIONNAIRES[type]);
        const template = config.CONTRATS_TYPES.find(t => t.type_contrat === type);
        if (template && confirm("Ajouter une offre 'Moyenne du marché' ?")) {
            const offreTemplate = {
                prestataire: template.prestataire, modele: template.modele, gti_heures: template.gti_heures,
                duree: template.duree, location: template.location, coutNb: template.coutNb,
                coutCouleur: template.coutCouleur, notes: template.notes, coutsAdditionnels: []
            };
            DataManager.addOffre({ id: Date.now(), ressenti: 50, ...offreTemplate, isGroup: false, children:[], parent: null, remise_percent: 0 });
            UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
        }
    }
    
    function handleSimulerOffre() {
        const nomSimule = config.NOMS_SIMULES[Math.floor(Math.random() * config.NOMS_SIMULES.length)];
        const modelesNoms = Object.keys(config.MODELES_COPIEURS);
        if (modelesNoms.length === 0) { alert("Aucun modèle pour la simulation."); return; }
        const modeleSimuleNom = modelesNoms[Math.floor(Math.random() * modelesNoms.length)];
        const modeleSimuleData = config.MODELES_COPIEURS[modeleSimuleNom];
        const locationSimulee = (modeleSimuleData.prix_indicatif / 48) * 1.5 + (Math.random() * 20 - 10);
        const nouvelleOffre = {
            id: Date.now(), prestataire: nomSimule, modele: modeleSimuleNom, gti_heures: [4, 8, 24][Math.floor(Math.random() * 3)],
            duree: [36, 48, 60][Math.floor(Math.random() * 3)], location: parseFloat(locationSimulee.toFixed(2)),
            coutNb: parseFloat((0.006 + Math.random() * 0.005).toFixed(5)), coutCouleur: parseFloat((0.06 + Math.random() * 0.04).toFixed(4)),
            notes: "Offre simulée automatiquement.", ressenti: 50, coutsAdditionnels: [], isGroup: false, children: [], parent: null, remise_percent: 0,
        };
        DataManager.addOffre(nouvelleOffre);
        UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
    }
    function handleGrouperOffres(idsAGrouper, targetGroupId = null) {
        if (targetGroupId) {
            const groupe = DataManager.getOffreById(targetGroupId);
            idsAGrouper.forEach(id => {
                if (id !== targetGroupId && !groupe.children.includes(id)) { DataManager.updateOffre(id, { parent: targetGroupId }); groupe.children.push(id); }
            });
            DataManager.updateOffre(targetGroupId, groupe);
        } else {
            if (idsAGrouper.length < 2) { alert("Veuillez sélectionner au moins deux offres à grouper."); return; }
            const nomGroupe = prompt("Nom pour la nouvelle offre groupée :", "Lot Copieurs");
            if (!nomGroupe) return;
            const groupeId = Date.now();
            idsAGrouper.forEach(id => DataManager.updateOffre(id, { parent: groupeId }));
            const offreGroupe = {
                id: groupeId, prestataire: nomGroupe, modele: "Offre Groupée", isGroup: true, children: idsAGrouper, parent: null, remise_percent: 0,
                gti_heures: 0, duree: 0, location: 0, coutNb: 0, coutCouleur: 0, notes: "", ressenti: 50, coutsAdditionnels: []
            };
            DataManager.addOffre(offreGroupe);
        }
        UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
    }
    
    function handleDegrouperOffre(groupeId) {
        if (!confirm("Voulez-vous dégrouper ces offres ?")) return;
        const groupe = DataManager.getOffreById(groupeId);
        if (groupe && groupe.isGroup) {
            groupe.children.forEach(childId => DataManager.updateOffre(childId, { parent: null }));
            DataManager.deleteOffre(groupeId);
            UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
        }
    }
    function handleSupprimerSelection() {
        const idsASupprimer = Array.from(document.querySelectorAll('.offre-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
        if (idsASupprimer.length === 0) return;
        if (confirm(`Supprimer ${idsASupprimer.length} offre(s) ?`)) {
            idsASupprimer.forEach(id => DataManager.deleteOffre(id));
            UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
        }
    }
    function handlePurgerOffres() {
        if (confirm("ATTENTION : Cette action supprimera DÉFINITIVEMENT toutes les offres. Continuer ?")) {
            DataManager.setOffres([]);
            UIManager.afficherListeOffres([], {});
        }
    }
    function handleExporterOffres() {
        const offres = DataManager.getOffres();
        if (offres.length === 0) { alert("Rien à exporter."); return; }
        const headers = ['id', 'prestataire', 'modele', 'gti_heures', 'duree', 'location', 'coutNb', 'coutCouleur', 'notes', 'ressenti', 'isGroup', 'parent', 'children', 'coutsAdditionnels', 'remise_percent'];
        const replacer = (key, value) => value === null ? '' : value;
        const csvRows = offres.map(offre => headers.map(header => JSON.stringify(offre[header] || '', replacer)).join(';'));
        const contenuCsv = [headers.join(';'), ...csvRows].join('\n');
        const blob = new Blob([contenuCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const lien = document.createElement("a");
        lien.setAttribute("href", url);
        lien.setAttribute("download", `sauvegarde_offres_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(lien); lien.click(); document.body.removeChild(lien);
    }
    function handleFichierImport(event) {
        const fichier = event.target.files[0];
        if (!fichier) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const contenu = e.target.result;
            const premiereLigne = contenu.split('\n')[0].trim();
            if (premiereLigne.includes('"id";"prestataire";"modele";"gti_heures"')) {
                if (confirm("Fichier de sauvegarde d'offres détecté. Remplacer les offres actuelles ?")) {
                    try {
                        const lignes = contenu.split('\n');
                        const headers = JSON.parse(`[${lignes.shift().replace(/;/g, ',')}]`);
                        const nouvellesOffres = lignes.map(ligne => {
                            if (!ligne.trim()) return null;
                            const valeurs = ligne.split(';');
                            const offre = {};
                            headers.forEach((header, index) => {
                                try { offre[header] = JSON.parse(valeurs[index]); } catch { offre[header] = valeurs[index] || ''; }
                            });
                            return offre;
                        }).filter(Boolean);
                        DataManager.setOffres(nouvellesOffres);
                        UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
                        alert(`${nouvellesOffres.length} offre(s) importée(s) avec succès !`);
                    } catch (error) {
                        alert("Erreur lors de l'importation du fichier. Vérifiez le format."); console.error(error);
                    }
                }
            } else { alert("Format de fichier non reconnu."); }
            event.target.value = '';
        };
        reader.readAsText(fichier, 'UTF-8');
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);

