// js/data.js
import { CryptoManager } from './crypto.js';
const loadDefaultConfig = () => import('./config.js').catch(() => null);

export const DataManager = (() => {
    let offres = [];
    let config = {};
    const _sauvegarderOffres = () => localStorage.setItem('offresCopieurs_v3', JSON.stringify(offres));
    const _chargerOffres = () => {
        const data = localStorage.getItem('offresCopieurs_v3');
        if (data) {
            offres = JSON.parse(data);
            offres.forEach(offre => {
                if (offre.isGroup === undefined) offre.isGroup = false;
                if (offre.children === undefined) offre.children = [];
                if (offre.parent === undefined) offer.parent = null;
            });
        }
    };
    return {
        init: async () => {
            let status = 'fallback';
            const decryptedConfig = await CryptoManager.decryptAndLoadConfig();
            if (decryptedConfig) {
                config = decryptedConfig;
                status = 'secure';
            } else {
                const DefaultConfigModule = await loadDefaultConfig();
                if (DefaultConfigModule) {
                    config = {
                        MODELES_COPIEURS: DefaultConfigModule.MODELES_COPIEURS_DEFAUT,
                        MEMOS_EXPERTS: DefaultConfigModule.MEMOS_EXPERTS,
                        CONTRATS_TYPES: DefaultConfigModule.CONTRATS_TYPES,
                        QUESTIONNAIRES: DefaultConfigModule.QUESTIONNAIRES,
                        NOMS_SIMULES: DefaultConfigModule.NOMS_SIMULES,
                        ANALYSE_TEMPLATES: DefaultConfigModule.ANALYSE_TEMPLATES,
                    };
                    status = 'local';
                } else {
                    config = { MODELES_COPIEURS: {}, MEMOS_EXPERTS: {}, CONTRATS_TYPES: {}, QUESTIONNAIRES: {}, NOMS_SIMULES: [], ANALYSE_TEMPLATES: {} };
                }
            }
            _chargerOffres();
            console.log(`DataManager initialisé en mode : ${status}`);
            return status;
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
        deleteOffre: (id) => { offres = offres.filter(o => o.id !== id); _sauvegarderOffres(); },
    };
})();
