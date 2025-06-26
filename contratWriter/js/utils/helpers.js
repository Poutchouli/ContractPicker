/**
 * Module d'utilitaires génériques
 * Ce module contient des fonctions utilitaires utilisées dans plusieurs modules
 */
import { logInfo } from './logger.js';

/**
 * Affiche une notification à l'utilisateur
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification (info, success, warning, error)
 * @param {number} duration - Durée d'affichage en ms (par défaut 3000ms)
 */
export function showNotification(message, type = 'info', duration = 3000) {
    // Créer le conteneur de notifications s'il n'existe pas
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Ajouter une icône selon le type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '✅';
            break;
        case 'warning':
            icon = '⚠️';
            break;
        case 'error':
            icon = '❌';
            break;
        default:
            icon = 'ℹ️';
    }
    
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Ajouter la notification au conteneur
    notificationContainer.appendChild(notification);
    
    // Ajouter un gestionnaire pour fermer la notification
    const closeButton = notification.querySelector('.notification-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            notification.classList.add('notification-hiding');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Enregistrer dans la console d'erreurs/logs
    if (type === 'error') {
        console.error(message);
    } else if (type === 'warning') {
        console.warn(message);
    } else {
        logInfo(message);
    }
    
    // Fermer automatiquement après la durée spécifiée
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('notification-hiding');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, duration);
    
    return notification;
}

/**
 * Génère un identifiant unique
 * @returns {string} - Identifiant unique
 */
export function generateUniqueId() {
    return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formate un nombre en format monétaire
 * @param {number} value - Valeur à formater
 * @param {string} currency - Devise (EUR par défaut)
 * @returns {string} - Chaîne formatée
 */
export function formatCurrency(value, currency = 'EUR') {
    if (typeof value !== 'number') {
        if (typeof value === 'string') {
            value = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
        } else {
            return '0,00 €';
        }
    }
    
    return value.toLocaleString('fr-FR', {
        style: 'currency',
        currency: currency
    });
}

/**
 * Sauvegarde l'état de l'application dans le stockage local
 * @param {object} state - État à sauvegarder
 */
export function saveAppState(state) {
    try {
        localStorage.setItem('contractPickerState', JSON.stringify(state));
        logInfo('État de l\'application sauvegardé');
    } catch (e) {
        console.error('Erreur lors de la sauvegarde de l\'état:', e);
    }
}

/**
 * Charge l'état de l'application depuis le stockage local
 * @returns {object|null} - État chargé ou null en cas d'erreur
 */
export function loadAppState() {
    try {
        const savedState = localStorage.getItem('contractPickerState');
        
        if (savedState) {
            return JSON.parse(savedState);
        }
    } catch (e) {
        console.error('Erreur lors du chargement de l\'état:', e);
    }
    
    return null;
}

/**
 * Débogage : Affiche l'état des offres dans la console
 * @param {HTMLElement} container - Conteneur des offres
 */
export function debugOffersState(container) {
    if (!container) return;
    
    const offerCards = container.querySelectorAll('.offer-card');
    const groupedOfferCards = container.querySelectorAll('.grouped-offer-card');
    
    console.group('État des offres');
    console.log(`Nombre d'offres: ${offerCards.length}`);
    console.log(`Nombre de groupes: ${groupedOfferCards.length}`);
    
    const offersData = [];
    
    offerCards.forEach((card, index) => {
        const data = {
            id: card.dataset.id,
            index: index,
            selected: card.classList.contains('selected')
        };
        
        // Récupérer tous les champs
        const fields = {};
        card.querySelectorAll('[data-field]').forEach(input => {
            fields[input.dataset.field] = input.value;
        });
        
        data.fields = fields;
        offersData.push(data);
    });
    
    console.log('Données des offres:', offersData);
    console.groupEnd();
}

/**
 * Formate une date système (timestamp) pour l'affichage
 * @param {number} ts - Timestamp à formater
 * @returns {string} - Date formatée 
 */
export function formatSystime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString('fr-FR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
}

/**
 * Vérifie si un timestamp date de plus d'un mois
 * @param {number} ts - Timestamp à vérifier
 * @returns {boolean} - true si plus ancien qu'un mois
 */
export function isOlderThanOneMonth(ts) {
    if (!ts) return false;
    const now = Date.now();
    const oneMonth = 31 * 24 * 60 * 60 * 1000; // environ un mois en millisecondes
    return (now - ts) > oneMonth;
}
