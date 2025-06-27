// Simple syntax test
console.log('Testing if JavaScript syntax is working...');

// Test if template manager functions are globally available
setTimeout(() => {
    console.log('Testing template manager functions:');
    console.log('openSimpleTemplateEditor:', typeof window.openSimpleTemplateEditor);
    console.log('setCurrentTemplate:', typeof window.setCurrentTemplate);
    console.log('closeTemplateModal:', typeof window.closeTemplateModal);
    console.log('deleteTemplateWithConfirm:', typeof window.deleteTemplateWithConfirm);
    
    if (window.runTemplateManagerTests) {
        console.log('Running template manager tests...');
        window.runTemplateManagerTests();
    }
}, 3000);
