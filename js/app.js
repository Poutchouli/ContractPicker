// js/app.js
import { DataManager } from './data.js';
import { UIManager } from './ui.js';
import { AIAnalyzer } from './ai.js';

const App = (() => {
    let config = {};
    const DOM = {
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
            ajouterOffre: document.getElementById('btn-ajouter-offre'),
            annulerModal: document.getElementById('btn-annuler-modal'),
            closeOffreModal: document.getElementById('btn-close-offre-modal'),
            aiSettings: document.getElementById('btn-ai-settings'),
            closeModal: document.getElementById('btn-close-modal'),
            saveApiKey: document.getElementById('btn-save-api-key'),
            ajouterCout: document.getElementById('btn-ajouter-cout'),
            simulerOffre: document.getElementById('btn-simuler-offre'),
            exporter: document.getElementById('btn-exporter-csv'),
            importer: document.getElementById('btn-importer-csv'),
            inputCsv: document.getElementById('input-csv'),
            grouper: document.getElementById('btn-grouper-selection'),
            supprimer: document.getElementById('btn-supprimer-selection'),
        },
        modals: {
            offre: document.getElementById('offre-modal'),
            ai: document.getElementById('ai-settings-modal'),
        },
        apiKeyInput: document.getElementById('gemini-api-key'),
    };

    const init = async () => {
        const status = await DataManager.init();
        config = DataManager.getConfig();

        UIManager.setStatut(status);
        UIManager.initialiserSelects(config);
        UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);

        initDragAndDrop();
        attachEventListeners();
    };
    
    const initDragAndDrop = () => {
        new Sortable(DOM.listeOffresContainer, {
            group: 'shared-offers',
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            onEnd: handleDragEnd,
            onMove: handleDragMove,
        });

        new Sortable(DOM.poubelleZone, {
            group: 'shared-offers',
            onAdd: handleDropInTrash,
            onMove: (evt) => {
                DOM.poubelleZone.classList.add('drag-over');
            },
            onUnchoose: () => {
                 DOM.poubelleZone.classList.remove('drag-over');
            }
        });
    };

    const handleDragMove = (evt) => {
        document.querySelectorAll('.offre-item').forEach(el => el.classList.remove('drop-target'));
        if (evt.to === DOM.listeOffresContainer && evt.related.classList.contains('offre-item')) {
            evt.related.classList.add('drop-target');
        }
        if (evt.to === DOM.poubelleZone) {
            DOM.poubelleZone.classList.add('drag-over');
        } else {
            DOM.poubelleZone.classList.remove('drag-over');
        }
        return true;
    };

    const handleDropInTrash = (evt) => {
        const offreId = parseInt(evt.item.dataset.id);
        evt.item.remove(); // Retirer l'élément de la poubelle visuellement
        if (confirm(`Êtes-vous sûr de vouloir supprimer cette offre ?`)) {
            DataManager.deleteOffre(offreId);
            UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
        }
    };
    
    const handleDragEnd = (evt) => {
        document.querySelectorAll('.offre-item').forEach(el => el.classList.remove('drop-target'));
        DOM.poubelleZone.classList.remove('drag-over');

        const { item, to, newIndex, oldIndex } = evt;
        const draggedId = parseInt(item.dataset.id);

        // Si l'élément est déposé sur un autre élément de la liste
        const dropTargetElement = document.elementFromPoint(evt.originalEvent.clientX, evt.originalEvent.clientY)?.closest('.offre-item');
        if (dropTargetElement && dropTargetElement !== item) {
            const targetId = parseInt(dropTargetElement.dataset.id);
            if(confirm(`Voulez-vous grouper cette offre avec "${DataManager.getOffreById(targetId).prestataire}" ?`)) {
                 handleGrouperOffres([draggedId, targetId]);
            }
             // On rafraîchit pour annuler le changement visuel si l'utilisateur annule
            UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
            return;
        }

        // Si l'ordre est simplement changé
        if (to === DOM.listeOffresContainer && newIndex !== oldIndex) {
            const offres = DataManager.getOffres();
            const [movedItem] = offres.splice(oldIndex, 1);
            offres.splice(newIndex, 0, movedItem);
            DataManager.setOffres(offres);
        }
    };

    const attachEventListeners = () => {
        // ... (Listeners existants pour simulation, IA, etc.)
        DOM.formSimulation.addEventListener('submit', (e) => { e.preventDefault(); lancerSimulation(); });
        DOM.buttons.aiSettings.addEventListener('click', () => UIManager.toggleModal('ai', true));
        DOM.buttons.closeModal.addEventListener('click', () => UIManager.toggleModal('ai', false));
        DOM.buttons.saveApiKey.addEventListener('click', handleSaveApiKey);
        DOM.modals.ai.addEventListener('click', (e) => { if (e.target === DOM.modals.ai) UIManager.toggleModal('ai', false); });

        // Nouveaux listeners pour la modale d'offre
        DOM.buttons.ajouterOffre.addEventListener('click', () => UIManager.toggleOfferModal(true));
        DOM.buttons.closeOffreModal.addEventListener('click', () => UIManager.toggleOfferModal(false));
        DOM.buttons.annulerModal.addEventListener('click', () => UIManager.toggleOfferModal(false));
        DOM.modals.offre.addEventListener('click', (e) => { if (e.target === DOM.modals.offre) UIManager.toggleOfferModal(false); });
        
        DOM.formOffre.addEventListener('submit', handleFormOffreSubmit);
        DOM.listeOffresContainer.addEventListener('click', handleListeOffresClick);
        // ... (Le reste des listeners)
        DOM.typeContratSelect.addEventListener('change', handleTypeContratChange);
        DOM.questionnaireContainer.addEventListener('click', handleQuestionnaireClick);
        DOM.fabricantSelect.addEventListener('change', () => UIManager.majSelectModele(DOM.fabricantSelect.value, config.MODELES_COPIEURS));
        Object.values(DOM.sliders).forEach(slider => { slider.addEventListener('input', (e) => { document.getElementById(`valeur-${e.target.id}`).textContent = e.target.value; }); });
        DOM.buttons.ajouterCout.addEventListener('click', UIManager.ajouterChampCout);
        DOM.coutsAdditionnelsContainer.addEventListener('click', (e) => { if (e.target.closest('.btn-remove-cout')) e.target.closest('.cout-additionnel-item').remove(); });
        DOM.buttons.simulerOffre.addEventListener('click', handleSimulerOffre);
        DOM.buttons.grouper.addEventListener('click', () => handleGrouperOffres(Array.from(document.querySelectorAll('.offre-checkbox:checked')).map(cb => parseInt(cb.dataset.id))));
        DOM.buttons.supprimer.addEventListener('click', handleSupprimerSelection);
        DOM.buttons.importer.addEventListener('click', () => DOM.buttons.inputCsv.click());
        DOM.buttons.exporter.addEventListener('click', handleExporterOffres);
        DOM.buttons.inputCsv.addEventListener('change', handleFichierImport);
    };

    // ... (Logique de simulation)
    async function lancerSimulation() { /* ... */ }

    // --- Gestionnaires d'Événements ---

    function handleSaveApiKey() { /* ... */ }

    function handleFormOffreSubmit(e) {
        e.preventDefault();
        // ... Logique de soumission
        UIManager.toggleOfferModal(false); // Fermer la modale après sauvegarde
    }

    function handleListeOffresClick(e) {
        const target = e.target;
        const offreId = parseInt(target.closest('[data-id]')?.dataset.id);
        if (!offreId) return;
        const offre = DataManager.getOffreById(offreId);
        if (!offre) return;

        if (target.closest('.btn-edit')) {
            UIManager.toggleOfferModal(true, offre);
        } 
        else if (target.closest('.btn-ungroup')) {
            if (confirm("Voulez-vous dégrouper ces offres ?")) {
                const groupe = DataManager.getOffreById(offreId);
                if (groupe && groupe.isGroup) {
                    groupe.children.forEach(childId => {
                        const enfant = DataManager.getOffreById(childId);
                        if(enfant) enfant.parent = null;
                    });
                    DataManager.deleteOffre(offreId);
                    UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
                }
            }
        }
        // ... le reste de la logique (delete, duplicate, ressenti)
    }

    function handleGrouperOffres(idsAGrouper) {
        if (idsAGrouper.length < 2) { alert("Veuillez sélectionner au moins deux offres à grouper."); return; }
        const nomGroupe = prompt("Entrez un nom pour cette offre groupée :", "Lot Copieurs");
        if (!nomGroupe) return;
        const groupeId = Date.now();
        const offres = DataManager.getOffres();
        offres.forEach(offre => { if (idsAGrouper.includes(offre.id)) offre.parent = groupeId; });
        const offreGroupe = {
            id: groupeId, prestataire: nomGroupe, modele: "Offre Groupée", isGroup: true, children: idsAGrouper, parent: null,
            gti_heures: 0, duree: 0, location: 0, coutNb: 0, coutCouleur: 0, notes: "", ressenti: 50, coutsAdditionnels: []
        };
        DataManager.addOffre(offreGroupe);
        UIManager.afficherListeOffres(DataManager.getOffres(), config.MODELES_COPIEURS);
    }
    
    // ... (Le reste des handlers)

    return { init };
})();

App.init();
