import {
    formatNumber,
    formatCurrency,
    getPercentageValues,
    updateChart,
    createTransactionTable,
    updateTransactionLogs,
    analyzeResults,
    createCalendarView,
    toggleChartView,
    updatePerformanceChart,
    validateForm,
    updatePokeballNavigation
} from './analysis-functions.js';

/**
 * Initialize Pokeball navigation and set up observers
 * The Pokeball icon links directly to the X (Twitter) profile
 */
document.addEventListener('DOMContentLoaded', () => {
    const pokeball = document.getElementById('nav-pokeball');
    if (!pokeball) {
        console.warn('Navigation pokeball element not found');
        return;
    }

    // Set up initial navigation
    updatePokeballNavigation();
});

/**
 * Initialize the analysis form and chart controls
 * Sets up event listeners for form submission, field validation,
 * and chart view toggling
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize analysis form
    initializeAnalysisForm();
    
    // Initialize chart view controls
    initializeChartControls();
});

/**
 * Set up the analysis form with validation and auto-submission
 */
function initializeAnalysisForm() {
    const form = document.getElementById('analysisForm');
    if (!form) {
        console.warn('Analysis form not found');
        return;
    }

    // Set up form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await analyzeResults();
    });

    // Set up field validation
    const fields = form.querySelectorAll('input, select');
    if (fields.length) {
        fields.forEach(field => {
            field.addEventListener('input', validateForm);
        });
        validateForm();
    }

    // Auto-submit form with default values after a short delay
    setTimeout(() => {
        form.dispatchEvent(new Event('submit'));
    }, 500);
}

/**
 * Initialize chart view toggle controls
 */
function initializeChartControls() {
    const toggleOptions = document.querySelectorAll('.toggle-option');
    if (!toggleOptions.length) {
        console.warn('Chart toggle options not found');
        return;
    }

    // Set up click handlers for view options
    toggleOptions.forEach(option => {
        option.addEventListener('click', () => {
            toggleChartView(option.dataset.value);
        });
    });
    
    // Set initial view to dollar
    const dollarOption = document.querySelector('.toggle-option[data-value="dollar"]');
    if (dollarOption) {
        dollarOption.classList.add('active');
    }
}

// Make functions globally accessible
// Export only core investment comparison functions
window.toggleChartView = toggleChartView;
window.analyzeResults = analyzeResults;
window.toggleTransactions = function(type) {
    const logSection = document.querySelector(`.log-section:has(#${type}Transactions)`);
    if (!logSection) return;
    
    logSection.classList.toggle('collapsed');
    
    const toggleIcon = logSection.querySelector('.toggle-icon');
    if (toggleIcon) {
        toggleIcon.style.transform = logSection.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0deg)';
    }
};