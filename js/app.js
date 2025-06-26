/**
 * Main application entry point
 * This file is a fallback that redirects to the actual application in the contratWriter directory
 */

console.log('Redirecting to the main application...');

// Check if we're not already in the contratWriter directory
if (!window.location.href.includes('contratWriter')) {
    // Redirect to the ContratWriter application
    window.location.href = '../contratWriter/';
}
