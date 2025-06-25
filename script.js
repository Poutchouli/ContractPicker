document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const addOfferBtn = document.getElementById('add-offer-btn');
    const groupOffersBtn = document.getElementById('group-offers-btn');
    const offersContainer = document.getElementById('offers-container');

    let nextOfferId = 2;
    let nextGroupId = 1;

    // --- Add Offer ---
    addOfferBtn.addEventListener('click', () => {
        const offerCard = document.createElement('div');
        offerCard.className = 'offer-card';
        offerCard.dataset.id = nextOfferId++;
        offerCard.innerHTML = `
            <div class="offer-header">
                <input type="checkbox" class="offer-group-checkbox" title="Sélectionner pour regrouper">
                <input type="text" placeholder="Nom de l'offre (ex: Contrat A)" class="offer-name">
                <button class="delete-offer-btn" title="Supprimer l'offre" aria-label="Supprimer l'offre">🗑️</button>
            </div>
            <div class="offer-inputs">
                <input type="number" placeholder="Coût Total (€)" class="offer-cost">
                <select class="offer-cost-type">
                    <option value="one">Paiement unique</option>
                    <option value="monthly">Mensuel</option>
                    <option value="quarterly">Trimestriel</option>
                    <option value="yearly">Annuel</option>
                </select>
                <input type="number" placeholder="Délai Interv. (heures)" class="offer-sla">
                <input type="number" placeholder="Score Matériel (/100)" class="offer-quality">
                <input type="number" placeholder="Votre Ressenti (/100)" class="offer-feeling">
            </div>
            <div class="contract-details">
                <textarea class="contract-note" placeholder="Note sur le contrat (ex: particularités, remarques...)" rows="2"></textarea>
                <div class="contract-meta">
                    <input type="number" class="contract-engagement" min="0" placeholder="Durée d'engagement (mois)">
                    <input type="number" class="contract-penalty" min="0" placeholder="Pénalités de résiliation (€)">
                    <input type="number" class="contract-cancel-delay" min="0" placeholder="Préavis avant résiliation (jours)">
                </div>
            </div>
            <div class="extra-costs-list"></div>
            <button class="add-extra-cost-btn" type="button">+ Ajouter un coût supplémentaire</button>
        `;
        offersContainer.appendChild(offerCard);
    });

    // --- Extra Costs: Add/Remove (event delegation) ---
    offersContainer.addEventListener('click', (e) => {
        // Delete Offer
        if (e.target.classList.contains('delete-offer-btn')) {
            e.target.closest('.offer-card')?.remove();
        }
        // Add Extra Cost
        if (e.target.classList.contains('add-extra-cost-btn')) {
            const offerCard = e.target.closest('.offer-card');
            if (!offerCard) return;
            const list = offerCard.querySelector('.extra-costs-list');
            const row = document.createElement('div');
            row.className = 'extra-cost-row';
            row.innerHTML = `
                <input type="number" class="extra-cost-amount" placeholder="Montant (€)">
                <input type="text" class="extra-cost-note" placeholder="Description">
                <button class="remove-extra-cost-btn" type="button" title="Supprimer">🗑️</button>
            `;
            list.appendChild(row);
        }
        // Remove Extra Cost
        if (e.target.classList.contains('remove-extra-cost-btn')) {
            e.target.closest('.extra-cost-row')?.remove();
        }
    });

    // --- Group Offers ---
    groupOffersBtn.addEventListener('click', () => {
        const selected = Array.from(offersContainer.querySelectorAll('.offer-group-checkbox:checked'));
        if (selected.length < 2) {
            alert('Sélectionnez au moins deux offres à regrouper.');
            return;
        }
        const groupMemberIds = [];
        const groupMemberNames = [];
        selected.forEach(checkbox => {
            const card = checkbox.closest('.offer-card');
            groupMemberIds.push(card.dataset.id);
            groupMemberNames.push(card.querySelector('.offer-name').value || `Offre ${card.dataset.id}`);
            card.classList.add('hidden');
            checkbox.checked = false;
        });
        // Create grouped offer card
        const template = document.getElementById('grouped-offer-template');
        const groupedCard = template.content.cloneNode(true).firstElementChild;
        groupedCard.dataset.groupId = `group-${nextGroupId++}`;
        groupedCard.dataset.memberIds = JSON.stringify(groupMemberIds);
        groupedCard.querySelector('.lot-title').textContent = `Lot: ${groupMemberNames.join(' + ')}`;
        groupedCard.querySelector('.ungroup-btn').addEventListener('click', () => {
            JSON.parse(groupedCard.dataset.memberIds).forEach(id => {
                const offerToUnhide = offersContainer.querySelector(`.offer-card[data-id="${id}"]`);
                if (offerToUnhide) offerToUnhide.classList.remove('hidden');
            });
            groupedCard.remove();
        });
        offersContainer.appendChild(groupedCard);
    });
});