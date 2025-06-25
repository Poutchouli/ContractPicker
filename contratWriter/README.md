# 📊 Outil de Normalisation et d'Export de Contrats

Cet outil web permet de saisir, comparer et normaliser des offres de contrats, puis de les exporter facilement au format CSV pour traitement dans Excel, Google Sheets, etc.

## Fonctionnalités principales

- **Ajout et édition d'offres de contrat** : Saisissez les informations essentielles de chaque offre (nom, coût, type de paiement, SLA, qualité, ressenti, notes, engagement, pénalités, préavis).
- **Gestion des coûts supplémentaires** : Ajoutez des coûts récurrents ou ponctuels à chaque offre, avec fréquence et période personnalisables.
- **Clonage d'une offre** : Dupliquez rapidement une offre existante pour gagner du temps lors de la saisie.
- **Regroupement d'offres** : Sélectionnez plusieurs offres pour les regrouper et obtenir des totaux et moyennes consolidés.
- **Export CSV** : Exportez toutes vos offres saisies en un clic, au format CSV, pour analyse ou archivage.

## Utilisation

1. **Ouvrez `index.html` dans votre navigateur.**
2. **Saisissez vos offres** : Ajoutez, éditez, regroupez, clonez, ajoutez des coûts supplémentaires.
3. **Exportez** : Cliquez sur le bouton "Exporter en CSV" pour télécharger vos données.

## Champs disponibles pour chaque offre

- Nom de l'offre
- Coût total
- Type de paiement (unique, mensuel, trimestriel, annuel)
- Délai d'intervention (SLA)
- Score matériel (/100)
- Ressenti (/100)
- Note libre
- Durée d'engagement (mois)
- Pénalités de résiliation
- Préavis avant résiliation
- Coûts supplémentaires (montant, fréquence, période, note)

## Structure du projet

- `index.html` : Interface utilisateur
- `script.js` : Logique de gestion des offres et export
- `style.css` : Styles

## Export

- **CSV** : Compatible Excel, Google Sheets, LibreOffice, etc.

---

Aucune donnée n'est envoyée sur Internet. L'outil fonctionne 100% localement dans votre navigateur.
