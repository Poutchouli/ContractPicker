/**
 * Universal Modal Manager - Handles all modals consistently
 * Provides unified escape key support, backdrop clicking, and modal state management
 */

class UniversalModalManager {
    constructor() {
        this.openModals = [];
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Global escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });
        
        // Setup existing modals
        this.setupExistingModals();
    }
    
    setupExistingModals() {
        // Template modal
        const templateModal = document.getElementById('template-modal');
        if (templateModal) {
            this.setupModal(templateModal, '.close-modal', '#close-modal-btn');
        }
        
        // Help modal
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            this.setupModal(helpModal, '.modal-close', null, true);
        }
        
        // Icon selector modal
        const iconModal = document.getElementById('icon-selector-modal');
        if (iconModal) {
            this.setupModal(iconModal, '.close-icon-modal');
        }
        
        // Language dropdown (not a modal but needs escape support)
        const languageDropdown = document.getElementById('language-dropdown');
        if (languageDropdown) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && languageDropdown.classList.contains('active')) {
                    languageDropdown.classList.remove('active');
                }
            });
        }
    }
    
    setupModal(modal, closeSelector, closeButtonSelector = null, isOverlay = false) {
        // Close button(s)
        const closeElements = modal.querySelectorAll(closeSelector);
        closeElements.forEach(closeEl => {
            closeEl.addEventListener('click', () => {
                this.closeModal(modal, isOverlay);
            });
        });
        
        // Additional close button if specified
        if (closeButtonSelector) {
            const closeBtn = modal.querySelector(closeButtonSelector);
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeModal(modal, isOverlay);
                });
            }
        }
        
        // Backdrop click (for overlay modals)
        if (isOverlay) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal, isOverlay);
                }
            });
        }
        
        // Track modal state changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    this.updateModalStack();
                }
            });
        });
        
        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
    
    openModal(modal, isOverlay = false) {
        if (isOverlay) {
            modal.classList.add('active');
        } else {
            modal.style.display = 'block';
        }
        this.updateModalStack();
    }
    
    closeModal(modal, isOverlay = false) {
        if (isOverlay) {
            modal.classList.remove('active');
        } else {
            modal.style.display = 'none';
        }
        this.updateModalStack();
    }
    
    closeTopModal() {
        if (this.openModals.length === 0) return;
        
        const topModal = this.openModals[this.openModals.length - 1];
        const isOverlay = topModal.classList.contains('modal-overlay');
        
        this.closeModal(topModal, isOverlay);
        
        // Log for debugging
        if (window.ContractPicker && window.ContractPicker.logInfo) {
            window.ContractPicker.logInfo("Modal fermée via touche Escape");
        }
    }
    
    updateModalStack() {
        // Update the list of currently open modals
        this.openModals = [];
        
        // Check overlay modals
        const overlayModals = document.querySelectorAll('.modal-overlay.active');
        overlayModals.forEach(modal => this.openModals.push(modal));
        
        // Check traditional modals
        const traditionalModals = document.querySelectorAll('.modal');
        traditionalModals.forEach(modal => {
            const style = window.getComputedStyle(modal);
            if (style.display !== 'none') {
                this.openModals.push(modal);
            }
        });
        
        // Sort by z-index to get proper stacking order
        this.openModals.sort((a, b) => {
            const aZ = parseInt(window.getComputedStyle(a).zIndex) || 0;
            const bZ = parseInt(window.getComputedStyle(b).zIndex) || 0;
            return aZ - bZ;
        });
    }
    
    closeAllModals() {
        // Close all modals
        const overlayModals = document.querySelectorAll('.modal-overlay.active');
        overlayModals.forEach(modal => {
            modal.classList.remove('active');
        });
        
        const traditionalModals = document.querySelectorAll('.modal');
        traditionalModals.forEach(modal => {
            modal.style.display = 'none';
        });
        
        // Close language dropdown if open
        const languageDropdown = document.getElementById('language-dropdown');
        if (languageDropdown && languageDropdown.classList.contains('active')) {
            languageDropdown.classList.remove('active');
        }
        
        this.updateModalStack();
    }
    
    isModalOpen() {
        return this.openModals.length > 0;
    }
}

// Initialize the modal manager
let modalManager;

export function initModalManager() {
    modalManager = new UniversalModalManager();
    return modalManager;
}

export function getModalManager() {
    return modalManager;
}

export function openModal(modalId, isOverlay = false) {
    const modal = document.getElementById(modalId);
    if (modal && modalManager) {
        modalManager.openModal(modal, isOverlay);
    }
}

export function closeModal(modalId, isOverlay = false) {
    const modal = document.getElementById(modalId);
    if (modal && modalManager) {
        modalManager.closeModal(modal, isOverlay);
    }
}

export function closeAllModals() {
    if (modalManager) {
        modalManager.closeAllModals();
    }
}
