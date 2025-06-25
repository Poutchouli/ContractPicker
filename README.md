# 📊 Outil d'Aide à la Décision Stratégique pour Contrats

![Image d'un tableau de bord d'analyse de données](https://placehold.co/800x200/0d6efd/FFFFFF?text=Outil+d'Aide+%C3%A0+la+D%C3%A9cision)

## 🎯 Description du Projet

Cet outil est une application web locale, 100% côté client, pour saisir, normaliser, regrouper et exporter des offres de contrats (ex : copieurs, GED, etc). Il ne nécessite aucune installation serveur, aucun backend, ni PHP. Toutes les opérations (saisie, import/export CSV, regroupement) se font directement dans le navigateur.

## ✨ Fonctionnalités Clés

* **📝 Saisie et Normalisation d'Offres :** Ajoutez, modifiez et regroupez vos offres de contrats, avec gestion des coûts supplémentaires et lots.
* **📊 Export CSV en temps réel :** Toutes vos offres sont affichées en temps réel dans un champ texte CSV à copier/coller (aucun téléchargement de fichier, aucun backend, aucun bouton d'export).
* **🔗 Groupement d'Offres :** Regroupez plusieurs offres en lots pour comparer des ensembles.
* **🔄 Personnalisation des Types de Contrats :** Ajoutez/éditez les modèles et conseils via le fichier `data.csv`.
* **💡 Interface Moderne et Simple :** Tout se fait dans le navigateur, sans dépendance serveur.

---

## 🚫 Fonctionnalités Supprimées

* **Aucun scoring, pondération, graphique ou analyse IA** : L'outil ne calcule plus de score, ne fait plus de classement, ni de graphiques. Il n'y a plus d'analyse automatique ou d'intégration IA.
* **Aucun backend/PHP, aucun import/export par bouton** : Le fichier `export.php` est obsolète et n'est plus utilisé. L'export/import se fait uniquement via le champ texte CSV affiché en temps réel.

---

## 🛠️ Utilisation

1. **Ouvrez `index.html` dans votre navigateur.**
2. **Saisissez vos offres** : Ajoutez, modifiez, regroupez, ajoutez des coûts supplémentaires, etc.
3. **Exportez vos offres** : Sélectionnez et copiez le texte CSV affiché en temps réel dans le champ prévu à cet effet (collez-le dans Excel, Google Sheets, etc).
4. **Personnalisez les types de contrats** : Modifiez le fichier `data.csv` pour ajouter des modèles ou conseils.

---

## 📁 Structure du Projet

- `index.html` : Interface principale (tout se passe ici)
- `script.js` : Logique de gestion des offres, export CSV, etc.
- `style.css` : Styles modernes
- `data.csv` : Modèles/types de contrats et conseils (éditable)
- `export.php` : **Obsolète, peut être supprimé**

---

## ❓ FAQ

**Q : Comment exporter mes offres ?** R : Sélectionnez et copiez le texte CSV affiché en temps réel dans le champ prévu à cet effet.

**Q : Comment importer des offres ?** R : Il n'y a plus d'import automatique. Collez vos données manuellement dans les champs si besoin.

**Q : Dois-je installer un serveur ou du PHP ?** R : Non, tout fonctionne dans le navigateur. Ignorez/supprimez `export.php`.

**Q : Puis-je personnaliser les types de contrats ?** R : Oui, éditez `data.csv` (séparateur `;`).

---

## 📝 Personnalisation

- **Types de contrats et conseils** : Modifiez `data.csv` pour ajouter/supprimer des modèles ou conseils affichés dans l'interface.
- **Champs d'offre** : Modifiez `index.html` et `script.js` si vous souhaitez ajouter des champs personnalisés.

---

## 🗑️ Suppression de l'ancien export PHP et import/export CSV

Le fichier `export.php` n'est plus utilisé et peut être supprimé en toute sécurité. L'export/import se fait désormais uniquement via le champ texte CSV affiché en temps réel (aucun téléchargement de fichier, aucun backend, aucun bouton d'import/export).

---

## 📢 Remarques

- L'outil fonctionne 100% hors-ligne, aucune donnée n'est envoyée sur Internet.
- Compatible avec tous les navigateurs modernes.
- Pour toute suggestion ou bug, ouvrez une issue sur le dépôt Git.
