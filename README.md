# ContractPicker

Application web pour comparer et organiser des offres de contrats.

## Fonctionnalités

- Création et gestion d'offres de contrats
- Regroupement d'offres similaires
- Dissociation des groupes sans perte de données
- Personnalisation des champs avec des templates
- Sélection d'icônes pour les offres
- Export et import des données au format JSON avec conservation des templates
- Gestion des coûts supplémentaires
- Console de débogage et de logs intégrée

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