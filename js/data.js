export const DataManager = (() => {
    let offres = [];
    let config = {};
  
    const _sauvegarderOffres = () => localStorage.setItem('offresCopieurs_v4', JSON.stringify(offres));
  
    const _chargerOffres = () => {
      const data = localStorage.getItem('offresCopieurs_v4');
      if (data) {
        offres = JSON.parse(data);
        offres.forEach(offre => {
          offre.isGroup = offre.isGroup || false;
          offre.children = offre.children || [];
          offre.parent = offre.parent === undefined ? null : offre.parent;
          offre.remise_percent = offre.remise_percent || 0;
        });
      }
    };
  
    const _chargerCSV = async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fichier non trouvé: ${url}`);
        const text = await response.text();
        const lignes = text.split('\n').filter(l => l.trim() !== '');
        const headers = lignes.shift().split(';').map(h => h.trim());
        return lignes.map(ligne => {
          const valeurs = ligne.split(';');
          const obj = {};
          headers.forEach((header, index) => {
            const valeur = valeurs[index]?.trim() || '';
            obj[header] = isNaN(valeur) ? valeur : parseFloat(valeur);
          });
          return obj;
        });
      } catch (error) {
        console.error(`Erreur lors du chargement du CSV ${url}:`, error);
        return [];
      }
    };
  
    return {
      init: async () => {
        try {
          const [modelesData, questionsData, memosData, simulationsData] = await Promise.all([
            _chargerCSV('data/modeles.csv'),
            _chargerCSV('data/questions.csv'),
            _chargerCSV('data/memos.csv'),
            _chargerCSV('data/simulations.csv')
          ]);
  
          config.MODELES_COPIEURS = modelesData.reduce((acc, curr) => {
            acc[curr.nom_modele] = curr;
            return acc;
          }, {});
  
          config.QUESTIONS = questionsData.reduce((acc, curr) => {
            if (!acc[curr.type_contrat]) acc[curr.type_contrat] = [];
            acc[curr.type_contrat].push({
              q: curr.question,
              desc: curr.description_cout,
              periodicite: curr.periodicite_mois
            });
            return acc;
          }, {});
  
          config.MEMOS_EXPERTS = memosData.reduce((acc, curr) => {
            if (!acc[curr.type_contrat]) acc[curr.type_contrat] = { titre: curr.titre, points: [] };
            acc[curr.type_contrat].points.push(curr.point);
            return acc;
          }, {});
  
          config.CONTRATS_TYPES = simulationsData.reduce((acc, curr) => {
            if (!acc[curr.type_contrat]) acc[curr.type_contrat] = {
              prestataire: curr.nom_prestataire,
              fabricant: curr.fabricant,
              modele: curr.nom_modele,
              gti_heures: parseInt(curr.gti_heures),
              duree: parseInt(curr.duree),
              location: parseFloat(curr.location),
              coutNb: parseFloat(curr.cout_nb),
              coutCouleur: parseFloat(curr.cout_couleur),
              notes: curr.notes || "",
              coutsAdditionnels: [],
            };
            return acc;
          }, {});
  
          config.NOMS_SIMULES = simulationsData.map(item => item.nom_prestataire);
  
          _chargerOffres();
          return 'local';
        } catch (err) {
          console.error("Erreur lors de l'initialisation :", err);
          return 'fallback';
        }
      },
  
      getConfig: () => config,
      getOffres: () => offres,
      getOffreById: (id) => offres.find(o => o.id === id),
      setOffres: (nouvellesOffres) => { offres = nouvellesOffres; _sauvegarderOffres(); },
      addOffre: (offre) => { offres.push(offre); _sauvegarderOffres(); },
      updateOffre: (id, donnees) => {
        const index = offres.findIndex(o => o.id == id);
        if (index !== -1) {
          offres[index] = { ...offres[index], ...donnees };
          _sauvegarderOffres();
          return true;
        }
        return false;
      },
      deleteOffre: (id, forceDeleteChildren = false) => {
        const offreASupprimer = offres.find(o => o.id === id);
        let childrenToDelete = [];
  
        if (offreASupprimer && offreASupprimer.isGroup && forceDeleteChildren) {
          childrenToDelete = [...offreASupprimer.children];
        } else if (offreASupprimer && offreASupprimer.isGroup) {
          offreASupprimer.children.forEach(childId => {
            const enfant = offres.find(o => o.id === childId);
            if (enfant) enfant.parent = null;
          });
        }
  
        offres = offres.filter(o => o.id !== id && !childrenToDelete.includes(o.id));
  
        offres.forEach(g => {
          if (g.isGroup) {
            g.children = g.children.filter(childId => childId !== id);
          }
        });
  
        _sauvegarderOffres();
      }
    };
  })();
  