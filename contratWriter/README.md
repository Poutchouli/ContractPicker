# 📊 Outil de Normalisation et d'Export de Contrats

Cet outil web permet de saisir, comparer et normaliser des offres de contrats, puis de les exporter facilement au format CSV pour partage ou analyse ultérieure.

## Fonctionnalités principales

- **Templates personnalisables** : Créez vos propres templates de contrats avec champs personnalisés et icônes.
- **Ajout et édition d'offres de contrat** : Saisissez les informations essentielles de chaque offre selon vos templates (nom, coût, type de paiement, SLA, qualité, ressenti, notes, engagement, pénalités, préavis).
- **Gestion des coûts supplémentaires** : Ajoutez des coûts récurrents ou ponctuels à chaque offre, avec fréquence et période personnalisables.
- **Personnalisation avec icônes** : Ajoutez des icônes personnalisées à vos templates et contrats (emojis prédéfinis ou images personnalisées).
- **Clonage d'une offre** : Dupliquez rapidement une offre existante pour gagner du temps lors de la saisie.
- **Regroupement d'offres** : Sélectionnez plusieurs offres pour les regrouper et obtenir des totaux et moyennes consolidés.
- **Export/Import CSV et JSON** : Exportez et importez toutes vos offres saisies en un clic au format CSV ou JSON, pour analyse ou archivage.
- **Console de débogage en temps réel** : Visualisez les messages d'information, avertissements et erreurs directement dans l'interface, avec possibilité de déplacer et redimensionner la console.

## Utilisation

1. **Ouvrez `index.html` dans votre navigateur.**
2. **Saisissez vos offres** : Ajoutez, éditez, regroupez, clonez, personnalisez avec des icônes et ajoutez des coûts supplémentaires.
3. **Exportez** : Cliquez sur le bouton "Exporter" et choisissez le format souhaité (CSV ou JSON) pour télécharger vos données.

## Gestion des templates

L'application permet de personnaliser les champs de saisie pour vos contrats :

- **Création de templates** : Ajoutez autant de champs que nécessaire avec différents types (texte, nombre, liste déroulante, zone de texte)
- **Personnalisation avec icônes** : Associez une icône (emoji ou image personnalisée) à chaque template et contrat
- **Nommage personnalisé** : Donnez des noms spécifiques à chaque champ selon votre domaine d'activité
- **Export/Import** : Sauvegardez et partagez vos templates entre différentes instances
- **Application facile** : Appliquez un template à toutes vos offres existantes en un clic

## Champs disponibles par défaut 

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

- `index.html` : Interface utilisateur principale
- `css/` : Styles et ressources visuelles
  - `style.css` : Feuilles de style principales
- `js/` : Scripts JavaScript organisés par modules et utilitaires
  - `app.js` : Application principale et point d'entrée
  - `modules/` : Modules fonctionnels
    - `contractManager.js` : Gestion des contrats (création, suppression, clonage)
    - `templateManager.js` : Gestion des templates personnalisables
    - `iconSelector.js` : Sélection d'icônes pour templates et contrats
    - `csvManager.js` : Import/export de données CSV/PNG
    - `extraCostManager.js` : Gestion des coûts supplémentaires pour les contrats
  - `utils/` : Utilitaires génériques
    - `helpers.js` : Fonctions utilitaires générales
    - `steganography.js` : Fonctions de stéganographie pour les PNG
    - `logger.js` : Console de débogage et journalisation en temps réel

## Export/Import avec stéganographie PNG

- **PNG avec données intégrées** : Les images exportées contiennent les données au format CSV cachées dans l'image
- **Dual-usage** : Utilisez l'image exportée comme visuel ET comme conteneur de données
- **Compatibilité ZIP** : Les fichiers PNG peuvent être ouverts comme des archives ZIP pour extraire les données CSV brutes
- **Sécurité visuelle** : Vos données contractuelles sensibles sont discrètement intégrées dans l'image

## Avantages du format PNG vs CSV

- **Visuel** : Identifiez facilement vos contrats grâce à leurs icônes associées
- **Confidentialité** : Les données ne sont pas immédiatement visibles lors du partage
- **Polyvalence** : Permet de partager via des outils qui n'acceptent pas les fichiers CSV (certaines messageries, etc.)
- **Intégrité** : L'icône et les données sont stockées dans un seul fichier

---

Aucune donnée n'est envoyée sur Internet. L'outil fonctionne 100% localement dans votre navigateur.
