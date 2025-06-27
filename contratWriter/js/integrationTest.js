/**
 * Final Integration Test for ContractPicker
 * This test verifies that all template manager functions are working correctly
 */

console.log('🚀 Starting ContractPicker Integration Test...');

// Test 1: Check if all required functions are globally available
function testGlobalFunctions() {
    console.log('\n📋 Test 1: Global Function Availability');
    
    const requiredFunctions = [
        'openSimpleTemplateEditor',
        'setCurrentTemplate',
        'closeTemplateModal', 
        'deleteTemplateWithConfirm'
    ];
    
    let allAvailable = true;
    
    requiredFunctions.forEach(funcName => {
        const isAvailable = typeof window[funcName] === 'function';
        console.log(`${isAvailable ? '✅' : '❌'} ${funcName}: ${isAvailable ? 'Available' : 'Missing'}`);
        if (!isAvailable) allAvailable = false;
    });
    
    return allAvailable;
}

// Test 2: Check if ContractPicker object is properly initialized
function testContractPickerObject() {
    console.log('\n📋 Test 2: ContractPicker Object');
    
    if (!window.ContractPicker) {
        console.log('❌ ContractPicker object not found');
        return false;
    }
    
    const requiredMethods = [
        'getCurrentTemplate',
        'openSimpleTemplateEditor',
        'setCurrentTemplate',
        'updateOffersTotalSummary',
        'calculateExtraCosts'
    ];
    
    let allMethodsAvailable = true;
    
    requiredMethods.forEach(method => {
        const isAvailable = typeof window.ContractPicker[method] === 'function';
        console.log(`${isAvailable ? '✅' : '❌'} ContractPicker.${method}: ${isAvailable ? 'Available' : 'Missing'}`);
        if (!isAvailable) allMethodsAvailable = false;
    });
    
    return allMethodsAvailable;
}

// Test 3: Run template manager tests if available
function testTemplateManagerTests() {
    console.log('\n📋 Test 3: Template Manager Tests');
    
    if (typeof window.runTemplateManagerTests !== 'function') {
        console.log('❌ runTemplateManagerTests function not available');
        return false;
    }
    
    try {
        const results = window.runTemplateManagerTests();
        const success = results.failed === 0;
        console.log(`${success ? '✅' : '❌'} Template Manager Tests: ${results.passed} passed, ${results.failed} failed`);
        return success;
    } catch (error) {
        console.log(`❌ Error running template manager tests: ${error.message}`);
        return false;
    }
}

// Run all tests
function runIntegrationTests() {
    console.log('🧪 Running Integration Tests...\n');
    
    const test1 = testGlobalFunctions();
    const test2 = testContractPickerObject();
    const test3 = testTemplateManagerTests();
    
    const allTestsPassed = test1 && test2 && test3;
    
    console.log('\n📊 Integration Test Results:');
    console.log(`Global Functions: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`ContractPicker Object: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Template Manager Tests: ${test3 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allTestsPassed;
}

// Export for use in other files
window.runIntegrationTests = runIntegrationTests;

// Auto-run after page loads
window.addEventListener('load', () => {
    setTimeout(() => {
        runIntegrationTests();
    }, 4000); // Wait 4 seconds for full initialization
});

console.log('✅ Integration test suite loaded. Tests will run automatically after page load.');
