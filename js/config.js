// js/config.js
export const MODELES_COPIEURS_DEFAUT = {
    "Canon imageRUNNER ADVANCE DX C3826i": { fabricant: "Canon", format: "A3", score_modele: 85, prix_indicatif: 3500 },
    "Ricoh IM C3000": { fabricant: "Ricoh", format: "A3", score_modele: 88, prix_indicatif: 3800 },
    "Sharp BP-70C31": { fabricant: "Sharp", format: "A3", score_modele: 82, prix_indicatif: 3200 },
    "Canon imageRUNNER ADVANCE DX C5840i": { fabricant: "Canon", format: "A4", score_modele: 90, prix_indicatif: 2500 },
    "Ricoh IM C530FB": { fabricant: "Ricoh", format: "A4", score_modele: 87, prix_indicatif: 2200 },
    "Sharp BP-50C26": { fabricant: "Sharp", format: "A4", score_modele: 84, prix_indicatif: 2000 },
};
export const MEMOS_EXPERTS = {
    copieur: {
        titre: "Points de vigilance sur un contrat copieur",
        points: ["Vérifiez toujours si une **assurance** est incluse ou si elle est à votre charge.","Demandez la date de **première mise en service** du matériel reconditionné.","Clarifiez les conditions de **résiliation anticipée** (pénalités, préavis).","Le coût des **agrafes** n'est quasiment jamais inclus dans le coût/page."]
    }
};
export const CONTRATS_TYPES = {
    copieur: {
        prestataire: "Référence Marché", modele: "Ricoh IM C3000", gti_heures: 8, duree: 48, location: 95.00, coutNb: 0.008, coutCouleur: 0.08, notes: "Contrat type basé sur une moyenne observée du marché.", coutsAdditionnels: []
    }
};
export const QUESTIONNAIRES = {
    copieur: [
        { q: "Le vendeur vous impose-t-il un volume minimum de pages à payer chaque mois ?", desc: "Coût du forfait minimum non atteint", periodicite: 1 },
        { q: "Y a-t-il des frais uniques pour l'installation ou la mise en réseau ?", desc: "Frais d'installation", periodicite: 0 },
        { q: "Le contrat spécifie-t-il des frais de restitution en fin de période ?", desc: "Frais de restitution/effacement DD", periodicite: 0 },
        { q: "La formation des utilisateurs est-elle facturée en supplément ?", desc: "Formation utilisateurs", periodicite: 0 },
        { q: "Existe-t-il un supplément pour une facturation détaillée ou un portail web ?", desc: "Supplément facturation", periodicite: 12 },
    ]
};
export const NOMS_SIMULES = ["Buro-Tech Solutions", "PrintExpress Services", "Copy-Concept", "Solutions Bureautiques de l'Ouest", "Atlantic Print", "Docu-Process","Office-Partner Pro", "Gestion Documentaire SA", "Le Copieur Français","Normandie Bureautique"];
export const ANALYSE_TEMPLATES = {
    recommandation: "L'offre **{prestataire}** se distingue comme le choix le plus pertinent avec un score de **{score_final}**.",
    point_fort_cout: "Son principal avantage est son **coût global très compétitif**.",
    point_fort_qualite: "Son principal avantage est son **excellent service après-vente** (GTI de {gti_heures}h).",
    point_fort_modele: "Son principal avantage est la **qualité supérieure du matériel** proposé ({modele}).",
    challenger: "L'offre de **{prestataire_challenger}** est une alternative intéressante, notamment sur le critère de **{point_fort_challenger}**.",
    conclusion_generale: "En fonction de vos priorités, {prestataire} offre le meilleur compromis global."
};
