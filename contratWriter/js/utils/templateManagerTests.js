/**
 * Template Manager Test Suite
 * Simple tests to verify template manager functionality
 */

function runTemplateManagerTests() {
    console.log('🧪 Running Template Manager Tests...');
    
    const tests = [
        {
            name: 'Check if openSimpleTemplateEditor is globally available',
            test: () => typeof window.openSimpleTemplateEditor === 'function'
        },
        {
            name: 'Check if setCurrentTemplate is globally available',
            test: () => typeof window.setCurrentTemplate === 'function'
        },
        {
            name: 'Check if closeTemplateModal is globally available',
            test: () => typeof window.closeTemplateModal === 'function'
        },
        {
            name: 'Check if deleteTemplateWithConfirm is globally available',
            test: () => typeof window.deleteTemplateWithConfirm === 'function'
        },
        {
            name: 'Check if template management functions are working',
            test: () => {
                try {
                    // Try to get current template
                    const currentTemplate = window.ContractPicker?.getCurrentTemplate();
                    return currentTemplate && currentTemplate.id === 'default';
                } catch (error) {
                    console.error('Template test error:', error);
                    return false;
                }
            }
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        try {
            const result = test.test();
            if (result) {
                console.log(`✅ ${test.name}`);
                passed++;
            } else {
                console.log(`❌ ${test.name}`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${test.name} - Error: ${error.message}`);
            failed++;
        }
    });
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All template manager tests passed!');
        if (window.ContractPicker && window.ContractPicker.success) {
            window.ContractPicker.success('Template manager tests passed');
        }
    } else {
        console.log('⚠️ Some template manager tests failed');
        if (window.ContractPicker && window.ContractPicker.error) {
            window.ContractPicker.error(`${failed} template manager tests failed`);
        }
    }
    
    return { passed, failed };
}

// Auto-run tests when page loads
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('🔄 Auto-running template manager tests after 3 second delay...');
        runTemplateManagerTests();
    }, 3000); // Wait 3 seconds for everything to initialize
});

// Make test function globally available
window.runTemplateManagerTests = runTemplateManagerTests;
