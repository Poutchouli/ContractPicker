/**
 * Contract Manager - Handles contract operations
 */
class ContractManager {
    constructor() {
        this.contracts = [];
        this.extraCosts = [];
        this.globalDiscount = 0;
        this.template = null;
    }

    // Set template
    setTemplate(template) {
        this.template = template;
        this.updateUI();
    }

    // Set data
    setData(data) {
        this.template = data.template;
        this.contracts = data.contracts || [];
        this.extraCosts = data.extraCosts || [];
        this.globalDiscount = data.globalDiscount || 0;
        this.updateUI();
    }

    // Add new contract
    addContract() {
        const contract = {
            id: 'contract_' + Date.now(),
            name: `Contrat ${this.contracts.length + 1}`,
            data: {},
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
        };

        this.contracts.push(contract);
        this.updateContractsList();
        this.saveData();
    }

    // Remove contract
    removeContract(contractId) {
        this.contracts = this.contracts.filter(c => c.id !== contractId);
        this.updateContractsList();
        this.saveData();
    }

    // Update contract data
    updateContract(contractId, fieldId, value) {
        const contract = this.contracts.find(c => c.id === contractId);
        if (contract) {
            contract.data[fieldId] = value;
            contract.modifiedAt = new Date().toISOString();
            this.calculateTotal();
            this.saveData();
        }
    }

    // Add extra cost
    addExtraCost() {
        const cost = {
            id: 'cost_' + Date.now(),
            name: 'Nouveau coût',
            amount: 0,
            period: 'monthly'
        };

        this.extraCosts.push(cost);
        this.updateExtraCostsList();
        this.saveData();
    }

    // Remove extra cost
    removeExtraCost(costId) {
        this.extraCosts = this.extraCosts.filter(c => c.id !== costId);
        this.updateExtraCostsList();
        this.saveData();
    }

    // Update extra cost
    updateExtraCost(costId, field, value) {
        const cost = this.extraCosts.find(c => c.id === costId);
        if (cost) {
            cost[field] = value;
            this.calculateTotal();
            this.saveData();
        }
    }

    // Update global discount
    updateGlobalDiscount(value) {
        this.globalDiscount = parseFloat(value) || 0;
        this.calculateTotal();
        this.saveData();
    }

    // Update UI
    updateUI() {
        if (!this.template) return;

        document.getElementById('currentTemplateName').textContent = this.template.name;
        document.getElementById('globalDiscount').value = this.globalDiscount;
        
        this.updateContractsList();
        this.updateExtraCostsList();
        this.calculateTotal();
    }

    // Update contracts list
    updateContractsList() {
        const container = document.getElementById('contractsList');
        container.innerHTML = '';

        this.contracts.forEach(contract => {
            const contractDiv = document.createElement('div');
            contractDiv.className = 'contract-item';
            
            let fieldsHTML = '';
            this.template.fields.forEach(field => {
                const value = contract.data[field.id] || '';
                
                if (field.type === 'select') {
                    const options = field.options.map(opt => 
                        `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
                    ).join('');
                    fieldsHTML += `
                        <div class="contract-field">
                            <label>${field.label}:</label>
                            <select onchange="contractManager.updateContract('${contract.id}', '${field.id}', this.value)">
                                <option value="">Sélectionner...</option>
                                ${options}
                            </select>
                        </div>
                    `;
                } else if (field.type === 'textarea') {
                    fieldsHTML += `
                        <div class="contract-field">
                            <label>${field.label}:</label>
                            <textarea onchange="contractManager.updateContract('${contract.id}', '${field.id}', this.value)">${value}</textarea>
                        </div>
                    `;
                } else {
                    fieldsHTML += `
                        <div class="contract-field">
                            <label>${field.label}:</label>
                            <input type="${field.type}" value="${value}" 
                                   onchange="contractManager.updateContract('${contract.id}', '${field.id}', this.value)">
                        </div>
                    `;
                }
            });

            contractDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4>${contract.name}</h4>
                    <button onclick="contractManager.removeContract('${contract.id}')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">×</button>
                </div>
                <div class="contract-fields">
                    ${fieldsHTML}
                </div>
            `;

            container.appendChild(contractDiv);
        });
    }

    // Update extra costs list
    updateExtraCostsList() {
        const container = document.getElementById('extraCostsList');
        container.innerHTML = '';

        this.extraCosts.forEach(cost => {
            const costDiv = document.createElement('div');
            costDiv.className = 'extra-cost-item';
            costDiv.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                    <input type="text" value="${cost.name}" placeholder="Nom du coût" 
                           onchange="contractManager.updateExtraCost('${cost.id}', 'name', this.value)" style="flex: 2;">
                    <input type="number" value="${cost.amount}" placeholder="Montant" 
                           onchange="contractManager.updateExtraCost('${cost.id}', 'amount', this.value)" style="flex: 1;">
                    <select onchange="contractManager.updateExtraCost('${cost.id}', 'period', this.value)" style="flex: 1;">
                        <option value="monthly" ${cost.period === 'monthly' ? 'selected' : ''}>Mensuel</option>
                        <option value="quarterly" ${cost.period === 'quarterly' ? 'selected' : ''}>Trimestriel</option>
                        <option value="yearly" ${cost.period === 'yearly' ? 'selected' : ''}>Annuel</option>
                        <option value="once" ${cost.period === 'once' ? 'selected' : ''}>Une fois</option>
                    </select>
                    <button onclick="contractManager.removeExtraCost('${cost.id}')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">×</button>
                </div>
            `;
            container.appendChild(costDiv);
        });
    }

    // Calculate total
    calculateTotal() {
        const period = document.getElementById('periodSelector').value;
        
        let contractsTotal = 0;
        let extraCostsTotal = 0;

        // Calculate contracts total
        this.contracts.forEach(contract => {
            this.template.fields.forEach(field => {
                if (field.type === 'number') {
                    const value = parseFloat(contract.data[field.id]) || 0;
                    // Convert to selected period
                    contractsTotal += this.convertToPeriod(value, 'monthly', period);
                }
            });
        });

        // Calculate extra costs total
        this.extraCosts.forEach(cost => {
            const amount = parseFloat(cost.amount) || 0;
            extraCostsTotal += this.convertToPeriod(amount, cost.period, period);
        });

        // Apply discount
        const subtotal = contractsTotal + extraCostsTotal;
        const discountAmount = (subtotal * this.globalDiscount) / 100;
        const finalTotal = subtotal - discountAmount;

        // Update display
        document.getElementById('contractsTotal').textContent = contractsTotal.toFixed(2) + ' €';
        document.getElementById('extraCostsTotal').textContent = extraCostsTotal.toFixed(2) + ' €';
        document.getElementById('discountTotal').textContent = '-' + discountAmount.toFixed(2) + ' €';
        document.getElementById('finalTotal').textContent = finalTotal.toFixed(2) + ' €';
    }

    // Convert amount between periods
    convertToPeriod(amount, fromPeriod, toPeriod) {
        // Convert to monthly first
        let monthlyAmount = amount;
        if (fromPeriod === 'quarterly') monthlyAmount = amount / 3;
        else if (fromPeriod === 'yearly') monthlyAmount = amount / 12;
        else if (fromPeriod === 'once') monthlyAmount = 0; // One-time costs don't repeat

        // Convert from monthly to target period
        if (toPeriod === 'monthly') return monthlyAmount;
        else if (toPeriod === 'quarterly') return monthlyAmount * 3;
        else if (toPeriod === 'yearly') return monthlyAmount * 12;
        
        return monthlyAmount;
    }

    // Save data
    saveData() {
        const data = {
            template: this.template,
            contracts: this.contracts,
            extraCosts: this.extraCosts,
            globalDiscount: this.globalDiscount
        };
        window.storage.save(data);
    }

    // Get data for export
    getData() {
        return {
            template: this.template,
            contracts: this.contracts,
            extraCosts: this.extraCosts,
            globalDiscount: this.globalDiscount
        };
    }
}

// Create global instance
window.contractManager = new ContractManager();
