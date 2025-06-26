/**
 * Module de sélection d'icônes
 * Ce module s'occupe de l'affichage et de la sélection d'icônes pour les offres
 */
import { logInfo } from '../utils/logger.js';

// Liste des icônes disponibles par catégorie
const iconCategories = [
    {
        name: 'Général',
        icons: ['📄', '📝', '📋', '📊', '📈', '📉', '📑', '📰', '📃', '📜', '📯', '📘', '📙', '📚', '📓', '📔', '📕', '📗', '📖']
    },
    {
        name: 'Business',
        icons: ['💼', '🗂️', '📁', '📂', '🗄️', '📈', '📉', '💰', '💵', '💶', '💷', '💸', '💳', '🧾', '📒', '🏢', '🏣', '🏦', '🏪', '🏬', '🏭', '🏗️']
    },
    {
        name: 'Communication',
        icons: ['📱', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💻', '🖥️', '🖱️', '🖨️', '⌨️', '💿', '💾', '💽', '📀', '🧮']
    },
    {
        name: 'Transport',
        icons: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚛', '🚚', '🚜', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚔', '🚍', '🚘', '🚖', '✈️', '🚀']
    },
    {
        name: 'Objets',
        icons: ['🔑', '🗝️', '🔨', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🔫', '🏹', '🛡️', '🔧', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🧰', '🧲', '⚗️']
    }
];

let onIconSelectCallback = null;

/**
 * Initialise le sélecteur d'icônes
 */
export function initIconSelector() {
    // Initialiser la modal si elle n'existe pas
    let modalContainer = document.getElementById('icon-selector-modal');
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'icon-selector-modal';
        modalContainer.className = 'modal-container';
        document.body.appendChild(modalContainer);
    }
    
    logInfo('Sélecteur d\'icônes initialisé');
}

/**
 * Ouvre la modal de sélection d'icônes
 * @param {Function} callback - Fonction à appeler avec l'icône sélectionnée
 */
export function openIconSelector(callback) {
    if (typeof callback !== 'function') {
        console.error('Le callback doit être une fonction');
        return;
    }
    
    onIconSelectCallback = callback;
    
    // Récupérer ou créer la modal
    let modalContainer = document.getElementById('icon-selector-modal');
    
    if (!modalContainer) {
        initIconSelector();
        modalContainer = document.getElementById('icon-selector-modal');
    }
    
    // Générer le contenu de la modal
    modalContainer.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Sélectionner une icône</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="icon-search">
                    <input type="text" id="icon-search-input" placeholder="Rechercher une icône...">
                </div>
                <div class="icon-categories">
                    ${iconCategories.map((category, index) => `
                        <div class="icon-category">
                            <h3>${category.name}</h3>
                            <div class="icon-grid">
                                ${category.icons.map(icon => `
                                    <div class="icon-item" data-icon="${icon}">${icon}</div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Ajouter les gestionnaires d'événements
    modalContainer.querySelector('.modal-close').addEventListener('click', () => {
        modalContainer.style.display = 'none';
    });
    
    const iconItems = modalContainer.querySelectorAll('.icon-item');
    iconItems.forEach(item => {
        item.addEventListener('click', () => {
            const selectedIcon = item.dataset.icon;
            if (onIconSelectCallback) {
                onIconSelectCallback(selectedIcon);
                logInfo(`Icône ${selectedIcon} sélectionnée`);
            }
            modalContainer.style.display = 'none';
        });
    });
    
    const searchInput = modalContainer.querySelector('#icon-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchText = e.target.value.toLowerCase();
            
            iconItems.forEach(item => {
                const icon = item.dataset.icon;
                // Recherche simple: mettre en surbrillance les résultats
                if (searchText && icon) {
                    if (icon.includes(searchText)) {
                        item.classList.add('highlight');
                    } else {
                        item.classList.remove('highlight');
                    }
                } else {
                    item.classList.remove('highlight');
                }
            });
        });
    }
    
    // Afficher la modal
    modalContainer.style.display = 'flex';
}
