# ContractPicker - Outil d'Aide à la Décision Stratégique

ContractPicker est un outil complet de comparaison et d'analyse d'offres de contrats. Il se compose de deux modules principaux :

## 🔧 Éditeur de Contrats (`contratWriter`)

L'éditeur permet de créer, personnaliser et comparer des offres de contrats avec des templates flexibles.

### Fonctionnalités principales :
- **Gestion de templates personnalisables** avec 4 types de champs (texte, nombre, nombre avec période, liste)
- **Création et modification d'offres** avec des champs dynamiques basés sur les templates
- **Regroupement d'offres** avec possibilité de dissociation sans perte de données
- **Export/Import JSON** préservant tous les templates et données
- **Gestion des coûts supplémentaires** avec calculs automatiques
- **Console d'erreur intégrée** pour le debugging et le monitoring
- **Interface intuitive** avec notifications et feedback utilisateur

### Types de champs supportés :
- **Texte** : Champs de saisie simple
- **Nombre** : Champs numériques avec validation
- **Nombre avec période** : Nombres avec fréquence (mensuel, trimestriel, annuel)
- **Liste** : Listes déroulantes avec options personnalisables

## 📊 Analyseur de Contrats (`contratAnalyze`)

L'analyseur permet d'importer et de comparer jusqu'à 10 fichiers JSON d'offres pour une analyse comparative avancée.

### Fonctionnalités principales :
- **Import multi-fichiers** (jusqu'à 10 fichiers JSON)
- **Vérification de compatibilité** des templates entre fichiers
- **Analyses visuelles** avec graphiques et statistiques
- **Intégration IA** (Google Gemini) pour des recommandations intelligentes
- **Export des résultats** d'analyse
- **Interface moderne** avec Tailwind CSS

## 🚀 Utilisation

### Workflow recommandé :
1. **Créer un template** dans l'éditeur avec les champs appropriés
2. **Saisir les offres** en utilisant le template créé
3. **Exporter en JSON** pour sauvegarder ou partager
4. **Analyser avec l'analyseur** en important plusieurs fichiers JSON
5. **Obtenir des recommandations** grâce à l'IA intégrée

### Démarrage rapide :
1. Ouvrez `contratWriter/index.html` pour commencer à créer des offres
2. Utilisez le gestionnaire de templates pour personnaliser les champs
3. Exportez vos données en JSON
4. Ouvrez `contratAnalyze/indexAnalyse.html` pour analyser plusieurs exports

## 🛠️ Technologies

- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Styling** : CSS custom + Tailwind CSS (analyseur)
- **Graphiques** : Chart.js
- **IA** : Google Gemini API
- **Stockage** : LocalStorage + Export/Import JSON

## Structure du projet

```
ContractPicker/
├── css/
│   ├── style.css               # Styles CSS centralisés
│   ├── extra-cost-section.css  # Styles pour la section des coûts supplémentaires
│   └── dropdown.css            # Styles pour les menus déroulants
├── js/
│   ├── app.js                  # Point d'entrée de l'application
│   ├── modules/
│   │   ├── contractManager.js  # Gestion des offres et des groupes
│   │   ├── iconSelector.js     # Sélecteur d'icônes
│   │   ├── csvManager.js       # Import/export de données JSON
│   │   ├── templateManager.js  # Gestion des templates de champs
│   │   └── extraCostManager.js # Gestion des coûts supplémentaires
│   └── utils/
│       ├── helpers.js          # Fonctions utilitaires générales
│       └── logger.js           # Console de logs et erreurs
├── data/
│   ├── memos.csv               # Données de mémos
│   ├── modeles.csv             # Données de modèles
│   ├── questions.csv           # Données de questions
│   └── simulations.csv         # Données de simulations
├── index.html                  # Page principale
├── LICENSE                     # Licence du projet
└── README.md                   # Documentation
```

## Console de débogage

Une console de débogage est disponible dans le coin supérieur droit de l'application. Elle permet de :

- Afficher les logs et erreurs de l'application
- Consulter les actions effectuées
- Tracer les problèmes potentiels

La console peut être :
- Déplacée par glisser-déposer de son en-tête
- Minimisée avec le bouton "_"
- Vidée avec le bouton "🗑️"

Les logs sont colorés selon leur niveau :
- 🔵 INFO : Messages informatifs généraux
- 🟠 WARN : Avertissements
- 🔴 ERROR : Erreurs
- 🟢 SUCCESS : Opérations réussies

## Utilisation

1. Ouvrez le fichier `index.html` dans un navigateur web
2. Utilisez les boutons de la barre d'outils pour ajouter, grouper, importer ou exporter des offres
3. Personnalisez les offres en remplissant les champs
4. Modifiez les templates via le bouton "Gestion des templates"
5. Ajoutez des coûts supplémentaires avec le bouton dédié

## API JavaScript

L'objet global `ContractPicker` expose les fonctions suivantes :

```javascript
// Créer une nouvelle offre
ContractPicker.createNewOffer(container);

// Mettre à jour le résumé des totaux
ContractPicker.updateOffersTotalSummary();

// Obtenir le template actuel
ContractPicker.getCurrentTemplate();

// Définir les compteurs d'ID
ContractPicker.setNextOfferId(id);
ContractPicker.setNextGroupId(id);

// Fonctions de journalisation
ContractPicker.log(message);    // alias pour info
ContractPicker.info(message);
ContractPicker.warn(message);
ContractPicker.error(message);
ContractPicker.success(message);
```

import { initContractManager, createNewOffer, groupSelectedOffers, setNextOfferId, setNextGroupId } from './modules/contractManager.js';

- **Performance optimisée** avec gestion d'erreurs robuste
- **Workflow complet** de la création à l'analyse

## ⌨️ Raccourcis clavier

- **Ctrl+N** - Ajouter une nouvelle offre
- **Ctrl+S** - Exporter les données
- **Ctrl+O** - Importer des données
- **Ctrl+G** - Grouper les offres sélectionnées
- **Ctrl+T** - Ouvrir le gestionnaire de templates

## 🔧 Fonctionnalités avancées

### Sauvegarde automatique
- Sauvegarde automatique toutes les 30 secondes
- Récupération en cas de fermeture accidentelle
- Validation d'intégrité des données

### Monitoring système
- Surveillance des performances en temps réel
- Détection automatique des erreurs
- Rapports de santé système
- Métriques d'utilisation

### Validation des données
- Vérification automatique de la cohérence
- Alertes pour les données manquantes
- Export sécurisé avec validation préalable

### Accessibilité
- Support complet du clavier
- Tooltips informatifs
- Interface adaptative
- Mode d'aide intégré

## 🚨 Dépannage

### Console d'erreur
Utilisez la console intégrée pour :
- Diagnostiquer les problèmes
- Suivre les opérations en cours
- Accéder aux logs détaillés

### Fonctions de diagnostic
```javascript
// Valider l'intégrité des données
ContractPicker.validateData();

// Récupérer depuis la sauvegarde automatique
ContractPicker.recoverFromAutoSave();

// Export sécurisé avec validation
ContractPicker.exportDataSafely();

// Rapport de statut système
SystemStatus.getStatusReport();
```

## 📈 Performance

L'application inclut :
- **Monitoring automatique** des temps d'exécution
- **Optimisation mémoire** avec nettoyage automatique
- **Indicateurs visuels** pour les opérations lentes
- **Mise en cache** des éléments fréquemment utilisés