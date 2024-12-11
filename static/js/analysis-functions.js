/**
 * Form Handling and Validation Functions
 * Core functions for managing form input, validation, and error handling
 */

/**
 * Retrieves and validates form data from the investment analysis form
 * @returns {Object} Validated form data containing:
 *  - ticker: Stock ticker symbol (string)
 *  - amount: Investment amount (number)
 *  - frequency: Investment frequency (Daily/Weekly/Monthly/Annual)
 *  - timeline: Investment timeline in months (number)
 *  - trailingPercentage: Trailing stop percentage (number)
 * @example
 * const formData = getFormData();
 * console.log(formData.ticker); // 'SPY'
 * console.log(formData.amount); // '100'
 */
function getFormData() {
    return {
        ticker: document.getElementById('ticker').value,
        amount: document.getElementById('amount').value,
        frequency: document.getElementById('frequency').value,
        timeline: document.getElementById('timeline').value,
        trailingPercentage: document.getElementById('trailingPercentage').value
    };
}

/**
 * Validates form input fields and manages submit button state
 * Checks if all required fields are filled with valid values
 * Updates button opacity and disabled state accordingly
 * @returns {void}
 */
function validateForm() {
    const form = document.getElementById('analysisForm');
    if (!form) {
        console.warn('Analysis form not found');
        return;
    }

    const submitButton = form.querySelector('.pixel-button');
    if (!submitButton) {
        console.warn('Submit button not found');
        return;
    }

    const fields = form.querySelectorAll('input, select');
    if (!fields.length) {
        console.warn('No form fields found');
        return;
    }

    const allFieldsValid = [...fields].every(field => 
        field && field.value && field.value.trim() !== ''
    );
    
    submitButton.disabled = !allFieldsValid;
    submitButton.style.opacity = allFieldsValid ? '1' : '0.5';
}

/**
 * Displays error messages for invalid form input
 * Shows red border and error text, auto-dismisses on next interaction
 * @param {string} message - Error message to display
 * @returns {void}
 */
function showError(message) {
    const tickerInput = document.getElementById('ticker');
    const errorMsg = document.getElementById('tickerError');
    
    if (!tickerInput || !errorMsg) {
        console.warn('Error display elements not found');
        return;
    }

    // Show error state
    tickerInput.style.borderColor = 'var(--pixel-red)';
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';

    // Setup auto-dismiss on next interaction
    tickerInput.onclick = function() {
        tickerInput.style.borderColor = '';
        errorMsg.style.display = 'none';
        tickerInput.onclick = null;
    };
}

/**
 * Formats timeline duration for display in chart titles and headers
 * Converts months into a human-readable string with years and months
 * @param {number|string} months - Number of months to format
 * @returns {string} Formatted timeline string
 * @example
 * formatTimelineTitle(18); // "Portfolio performance over the last 1 year and 6 months"
 * formatTimelineTitle(6);  // "Portfolio performance over the last 6 months"
 */
function formatTimelineTitle(months) {
    months = parseInt(months);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    let timeString = '';
    if (years > 0) {
        timeString += `${years} year${years > 1 ? 's' : ''}`;
        if (remainingMonths > 0) {
            timeString += ` and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
        }
    } else {
        timeString = `${months} month${months > 1 ? 's' : ''}`;
    }
    
    return `Portfolio performance over the last ${timeString}`;
}

/**
 * Utility Functions for Data Formatting and Processing
 * Core functions for number formatting, currency display, and data manipulation
 */

/**
 * Formats a number with 2 decimal places and thousand separators
 * @param {number} value - Number to format
 * @returns {string} Formatted number with commas and 2 decimal places
 * @example
 * formatNumber(1234.5678); // Returns "1,234.57"
 * formatNumber(0.1); // Returns "0.10"
 */
function formatNumber(value) {
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Formats a number as USD currency with $ symbol
 * @param {number} value - Number to format as currency
 * @returns {string} Formatted currency string
 * @example
 * formatCurrency(1234.56); // Returns "$1,234.56"
 * formatCurrency(0.1); // Returns "$0.10"
 */
function formatCurrency(value) {
    return '$' + formatNumber(value);
}

/**
 * Extracts percentage values from an array of data objects
 * Used for calculating performance metrics and statistics
 * @param {Array<Object>} data - Array of objects containing percentage values 
 * @returns {Array<number>} Array of extracted percentage values
 * @example
 * const data = [{percentage: 10}, {percentage: 20}];
 * getPercentageValues(data); // Returns [10, 20]
 */
function getPercentageValues(data) {
    return data.reduce((values, item) => {
        if (item.percentage) {
            values.push(item.percentage);
        }
        return values;
    }, []);
}

/**
 * Updates the performance comparison chart with new data
 * Handles both dollar and percentage view modes with proper formatting
 * @param {Object} data - Chart data containing performance metrics
 * @param {Array<string>} data.performance.dates - Array of date strings
 * @param {Array<number>} data.performance.trailing - Trailing buy strategy values
 * @param {Array<number>} data.performance.dca - DCA strategy values
 * @param {Array<number>} data.performance.lump - Buy & Hold strategy values
 * @param {Object} data.summary - Summary statistics for each strategy
 * @returns {void}
 * @throws {Error} When data is missing or invalid
 */
function updateChart(data) {
    if (!data) {
        console.warn('No data provided to updateChart');
        return;
    }

    const dates = data.performance.dates;
    const isPercentageView = window.isPercentageView;

    // Calculate percentage returns relative to invested amounts
    const calculatePercentageChange = (values, invested) => {
        if (!values || !invested || values.length === 0 || invested.length === 0) return [];
        
        return values.map((value, index) => {
            const investedAmount = invested[index];
            if (!investedAmount) return 0;
            
            const pct = ((value - investedAmount) / investedAmount) * 100;
            return pct;
        });
    };

    // Get colors based on final portfolio values ranking
    const getPerformanceColors = () => {
        const finalValues = [
            { name: 'trailing', value: data.summary.trailing_value },
            { name: 'dca', value: data.summary.dca_value },
            { name: 'lump', value: data.summary.lump_value }
        ].sort((a, b) => b.value - a.value);

        // Use exact CSS variable names as specified
        const colorMap = {
            [finalValues[0].name]: '#FFE169',    // Highest final value
            [finalValues[1].name]: '#DEE2E6',  // Second highest final value
            [finalValues[2].name]: '#76520E'   // Lowest final value
        };

        return colorMap;
    };

    const trailingValues = data.performance.trailing;
    const dcaValues = data.performance.dca;
    const lumpValues = data.performance.lump;

    const colors = getPerformanceColors();
    
    // Store colors globally for calendar use
    window.strategyColors = colors;

    const trace1 = {
        x: dates,
        y: isPercentageView 
            ? calculatePercentageChange(trailingValues, data.performance.trailing_invested)
            : trailingValues,
        name: 'Buy the Dip',
        type: 'scatter',
        mode: 'lines',
        line: {
            color: colors.trailing,
            width: 2
        },
        hovertemplate: isPercentageView 
            ? '%{y:.1f}%<br>%{x}<extra></extra>'
            : '$%{y:,.2f}<br>%{x}<extra></extra>'
    };

    const trace2 = {
        x: dates,
        y: isPercentageView 
            ? calculatePercentageChange(dcaValues, data.performance.dca_invested)
            : dcaValues,
        name: 'DCA',
        type: 'scatter',
        mode: 'lines',
        line: {
            color: colors.dca,
            width: 2
        },
        hovertemplate: isPercentageView 
            ? '%{y:.1f}%<br>%{x}<extra></extra>'
            : '$%{y:,.2f}<br>%{x}<extra></extra>'
    };

    const trace3 = {
        x: dates,
        y: isPercentageView 
            ? calculatePercentageChange(lumpValues, data.performance.lump_invested)
            : lumpValues,
        name: 'Buy & Hold',
        type: 'scatter',
        mode: 'lines',
        line: {
            color: colors.lump,
            width: 2
        },
        hovertemplate: isPercentageView 
            ? '%{y:.1f}%<br>%{x}<extra></extra>'
            : '$%{y:,.2f}<br>%{x}<extra></extra>'
    };

    const layout = {
        paper_bgcolor: '#58585B',
        plot_bgcolor: '#FFFFFF',
        font: {
            family: 'Pokemon DS',
            color: '#FFFFFF'
        },
        xaxis: {
            gridcolor: 'rgba(255,255,255,0.1)',
            tickcolor: '#FFFFFF',
            tickfont: { size: 10 }
        },
        yaxis: {
            gridcolor: 'rgba(255,255,255,0.1)',
            tickcolor: '#FFFFFF',
            tickformat: isPercentageView ? '.1f' : '.2f',
            tickprefix: isPercentageView ? '' : '$',
            ticksuffix: isPercentageView ? '%' : '',
            autorange: true,
            rangemode: 'tozero',  // Ensure range starts from zero
            tickfont: { size: 10 },
        },
        showlegend: true,
        legend: {
            bgcolor: 'rgba(0,0,0,0)',
            borderwidth: 0,
            font: { size: 12 },
            orientation: 'h',
            yanchor: 'top',
            y: 1.14,
            xanchor: 'center',
            x: 0.5,
            itemclick: 'toggleothers',
            itemdoubleclick: 'toggle'
        },
        hovermode: 'x unified',
        autosize: true,
        margin: {
            l: 50,
            r: 20,
            t: 40,
            b: 50
        },
        shapes: [{
            type: 'rect',
            xref: 'paper',
            yref: 'paper',
            x0: 0,
            y0: 0,
            x1: 1,
            y1: 1,
            line: { color: '#FFFFFF', width: 2 }
        }]
    };

    // Sort traces by final portfolio value
    const traces = [
        { trace: trace1, value: data.summary.trailing_value, name: 'Buy the Dip' },
        { trace: trace2, value: data.summary.dca_value, name: 'DCA' },
        { trace: trace3, value: data.summary.lump_value, name: 'Buy & Hold' }
    ].sort((a, b) => b.value - a.value);

    // Plot the sorted traces
    Plotly.newPlot('performanceChart', traces.map(t => t.trace), layout, {
        displayModeBar: false,
        responsive: true
    });
}

/**
 * Creates a detailed transaction table for a specific investment strategy
 * Includes summary statistics and transaction history with proper formatting
 * @param {Array<Object>} transactions - Array of transaction objects containing:
 *   - date: Transaction date (string)
 *   - price: Stock price at transaction (number)
 *   - shares: Number of shares bought (number)
 *   - amount: Investment amount (number)
 * @param {string} type - Strategy type ('trailing'|'dca'|'lump')
 * @returns {HTMLTableElement} Formatted transaction table with summary
 * @example
 * const transactions = [{
 *   date: '2024-01-01',
 *   price: 100.00,
 *   shares: 1.5,
 *   amount: 150.00
 * }];
 * const table = createTransactionTable(transactions, 'dca');
 */
function createTransactionTable(transactions, type) {
    // Calculate summary statistics
    let totalInvested = 0;
    let totalShares = 0;
    
    transactions.forEach(t => {
        totalInvested += t.amount;
        totalShares += t.shares;
    });
    
    // Update the summary div with strategy details
    const summaryDiv = document.getElementById(`${type}TransactionsSummary`);
    const strategyName = type === 'trailing' ? 'Buy the Dip' : 
                        type === 'dca' ? 'DCA' : 'Buy & Hold';
    
    // Get performance ranking from parent element
    const parentElement = summaryDiv.closest('.card-1, .card-2, .card-3');
    const rank = parentElement ? parseInt(parentElement.className.match(/card-(\d+)/)[1]) : null;
    
    // Set color scheme based on performance rank
    const titleColor = rank === 1 ? 'var(--pixel-gold)' : 
                      rank === 2 ? 'var(--pixel-silver)' : 
                      rank === 3 ? 'var(--pixel-bronze)' : 'var(--white)';
    
    // Render strategy summary
    summaryDiv.innerHTML = `
        <h3>${strategyName}</h3>
        <p>Total invested: ${formatCurrency(totalInvested)}</p>
        <p>Total buys: ${transactions.length}</p>
        <p>Total shares: ${totalShares.toFixed(4)}</p>
    `;

    // Create transaction history table
    const table = document.createElement('table');
    table.innerHTML = `
        <tr>
            <th>Date</th>
            <th>Price</th>
            <th>Shares</th>
            <th>Amount</th>
        </tr>
    `;

    // Add individual transaction rows
    transactions.forEach(t => {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${t.date}</td>
            <td>${formatCurrency(t.price)}</td>
            <td>${t.shares.toFixed(4)}</td>
            <td>${formatCurrency(t.amount)}</td>
        `;
    });

    return table;
}

function updateTransactionLogs(data) {
    // Sort strategies by end account value
    const strategies = [
        { 
            type: 'trailing', 
            value: data.summary.trailing_value,
            transactions: data.transactions.trailing 
        },
        { 
            type: 'dca', 
            value: data.summary.dca_value,
            transactions: data.transactions.dca 
        },
        { 
            type: 'lump', 
            value: data.summary.lump_value,
            transactions: [{
                date: data.performance.dates[0],
                price: data.summary.initial_price,
                shares: data.summary.total_investment / data.summary.initial_price,
                amount: data.summary.total_investment
            }]
        }
    ].sort((a, b) => b.value - a.value);

    // Update transaction logs in sorted order
    const transactionLogsContainer = document.querySelector('.transaction-logs');
    transactionLogsContainer.innerHTML = ''; // Clear existing logs

    strategies.forEach((strategy, index) => {
        const logSection = document.createElement('div');
        const summaryBorderColor = index === 0 ? 'var(--pixel-gold)' : 
                                 index === 1 ? 'var(--pixel-silver)' : 
                                 'var(--pixel-bronze)';
        logSection.className = `log-section card-${index + 1} collapsed`;
        logSection.style.border = 'none'; // Remove border from log-section
        
        const logContent = document.createElement('div');
        logContent.id = `${strategy.type}Transactions`;
        logContent.className = 'transaction-content';
        
        // Add summary div
        const summaryDiv = document.createElement('div');
        summaryDiv.id = `${strategy.type}TransactionsSummary`;
        summaryDiv.className = 'transaction-summary';
        summaryDiv.style.borderColor = summaryBorderColor;
        
        // Update h3 border-bottom color to match container
        const h3Style = document.createElement('style');
        h3Style.textContent = `
            #${strategy.type}TransactionsSummary h3 {
                border-bottom-color: ${summaryBorderColor};
            }
        `;
        document.head.appendChild(h3Style);
        
        // Add toggle section after summary
        const toggleSection = document.createElement('div');
        toggleSection.className = 'log-header';
        toggleSection.innerHTML = `
            <span>Transaction log</span>
            <span class="toggle-icon" style="transform: rotate(-90deg);">▼</span>
        `;
        toggleSection.onclick = () => {
            logSection.classList.toggle('collapsed');
            const toggleIcon = toggleSection.querySelector('.toggle-icon');
            if (toggleIcon) {
                toggleIcon.style.transform = logSection.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0deg)';
            }
        };
        
        logSection.appendChild(summaryDiv);
        logSection.appendChild(toggleSection);
        logSection.appendChild(logContent);
        transactionLogsContainer.appendChild(logSection);
        
        // Create and append transaction table
        logContent.appendChild(createTransactionTable(strategy.transactions, strategy.type));
    });
}

function renderStockSummaryCards(data) {
    const cardData = [
        {
            title: `Buy the Dip (${document.getElementById('trailingPercentage').value}%)`,
            value: data.summary.trailing_value, 
            return: `${data.summary.trailing_percentage_increase >= 0 ? '▲' : '▼'} ${data.summary.trailing_percentage_increase}%`, 
            profit: `${data.summary.trailing_dollar_increase >= 0 ? '+' : '-'}${formatCurrency(Math.abs(data.summary.trailing_dollar_increase))}` 
        },
        {
            title: "DCA",
            value: data.summary.dca_value, 
            return: `${data.summary.dca_percentage_increase >= 0 ? '▲' : '▼'} ${data.summary.dca_percentage_increase}%`,
            profit: `${data.summary.dca_dollar_increase >= 0 ? '+' : '-'}${formatCurrency(Math.abs(data.summary.dca_dollar_increase))}` 
        },
        {
            title: `Buy & Hold (${formatCurrency(data.summary.total_investment)})`,
            value: data.summary.lump_value,
            return: `${data.summary.lump_percentage_increase >= 0 ? '▲' : '▼'} ${data.summary.lump_percentage_increase}%`, 
            profit: `${data.summary.lump_dollar_increase >= 0 ? '+' : '-'}${formatCurrency(Math.abs(data.summary.lump_dollar_increase))}` 
        }
    ];

    cardData.sort((a, b) => b.value - a.value);

    const summaryCardsContainer = document.getElementById('stock-summary-cards');
    summaryCardsContainer.innerHTML = '';

    cardData.forEach((data, index) => {
        const cardHTML = `
            <div class="card-${index + 1}">
                <h3>${data.title}</h3>
                <p class="portfolio-value">${formatCurrency(data.value)}</p>
                <p class="metric">Return: <span>${data.return}</span></p>
                <p class="metric">Profit: <span>${data.profit}</span></p>
            </div>
        `;
        summaryCardsContainer.innerHTML += cardHTML;
    });
}

function updateResultsHeading(data, formData) {
    const heading = document.getElementById('results-heading');
    if (!heading) return;
    
    // Format timeline string
    const months = parseInt(formData.timeline);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    let timelineStr = '';
    if (years > 0) {
        timelineStr += `${years} year${years > 1 ? 's' : ''}`;
        if (remainingMonths > 0) timelineStr += ` and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    } else {
        timelineStr = `${months} month${months > 1 ? 's' : ''}`;
    }

    // Create heading with dynamic information
    const stockName = data.stock_info?.name || formData.ticker.toUpperCase();
    const ticker = formData.ticker.toUpperCase();
    
    heading.innerHTML = `
        <h3 class="perf-summary">Performance summary:</h3>
        <h2>${stockName} (${ticker})</h2>
        <h2>${formData.frequency} ${formatCurrency(formData.amount)} investment</h2>
        <h2>${timelineStr} with ${formData.trailingPercentage}% trailing stop</h2>
    `;
}

async function analyzeResults() {
    try {
// Update rolling returns table with historical performance data
function updateRollingReturnsTable(data) {
    const tableBody = document.querySelector('#rollingPeriodsTable tbody');
    const tableHead = document.querySelector('#rollingPeriodsTable thead tr');
    if (!tableBody || !tableHead || !data.summary || !data.summary.rolling_returns) {
        console.warn('Rolling returns table or data not found');
        return;
    }

    // Update lifetime subtitle
    const lifetimeDiv = document.getElementById('stockLifetime');
    if (lifetimeDiv && data.summary.lifetime) {
        const lifetime = data.summary.lifetime;
        let lifetimeText = 'Stock lifetime: ';
        if (lifetime.years > 0) {
            lifetimeText += `${lifetime.years} year${lifetime.years !== 1 ? 's' : ''}`;
            if (lifetime.months > 0) lifetimeText += ` and `;
        }
        if (lifetime.months > 0 || lifetime.years === 0) {
            lifetimeText += `${lifetime.months} month${lifetime.months !== 1 ? 's' : ''}`;
        }
        lifetimeDiv.textContent = lifetimeText;
    }

    // Sort strategies by final portfolio value
    const strategies = [
        { name: 'Buy the Dip', key: 'Buy the Dip', value: data.summary.trailing_value },
        { name: 'DCA', key: 'Dollar-Cost Averaging (DCA)', value: data.summary.dca_value },
        { name: 'Buy & Hold', key: 'Buy and Hold', value: data.summary.lump_value }
    ].sort((a, b) => b.value - a.value);

    // Update table header with sorted strategies
    tableHead.innerHTML = `
        <th>Rolling period</th>
        ${strategies.map(s => `<th>${s.name}</th>`).join('')}
    `;

    // Clear existing rows
    tableBody.innerHTML = '';

    // Define period order (excluding All-Time which will be added last)
    const periodOrder = ['1 Year', '5 Years', '10 Years', '15 Years', '20 Years', '25 Years'];
    
    // Get stock lifetime in months
    const lifetime = data.summary.lifetime;
    const lifetimeMonths = (lifetime.years * 12) + lifetime.months;

    // Filter periods based on lifetime
    const availablePeriods = Object.entries(data.summary.rolling_returns)
        .filter(([period]) => {
            if (period === 'All-Time') return false;  // Handle All-Time separately
            const periodMonths = {
                '1 Year': 12,
                '5 Years': 60,
                '10 Years': 120,
                '15 Years': 180,
                '20 Years': 240,
                '25 Years': 300
            }[period];
            return periodMonths <= lifetimeMonths;
        })
        .sort((a, b) => periodOrder.indexOf(a[0]) - periodOrder.indexOf(b[0]));

    // Add rows for available periods
    availablePeriods.forEach(([period, returns]) => {
        if (returns && typeof returns === 'object') {
            const row = document.createElement('tr');
            
            // Sort strategies by return value for this period
            const periodReturns = strategies.map(strategy => ({
                ...strategy,
                return: returns[strategy.key]
            })).sort((a, b) => b.return - a.return);

            // Create color map based on period performance ranking
            const colorMap = {
                [periodReturns[0].key]: 'var(--pixel-gold)',
                [periodReturns[1].key]: 'var(--pixel-silver)',
                [periodReturns[2].key]: 'var(--pixel-bronze)'
            };

            // Format return value with color based on period ranking
            const formatReturn = (value, strategyKey) => {
                const indicator = value >= 0 ? '▲' : '▼';
                const formattedValue = Math.abs(value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                return `<span style="color: ${colorMap[strategyKey]}">${indicator} ${formattedValue}%</span>`;
            };

            // Create row with period and returns in column order (based on final portfolio values)
            row.innerHTML = `
                <td>${period}</td>
                ${strategies.map(strategy => 
                    `<td>${formatReturn(returns[strategy.key], strategy.key)}</td>`
                ).join('')}
            `;
            tableBody.appendChild(row);
        }
    });

    // Always add All-Time as the last row if available
    const allTimeReturns = data.summary.rolling_returns['All-Time'];
    if (allTimeReturns && typeof allTimeReturns === 'object') {
        const allTimeRow = document.createElement('tr');
        
        // Sort strategies by All-Time return value
        const allTimePerformance = strategies.map(strategy => ({
            ...strategy,
            return: allTimeReturns[strategy.key]
        })).sort((a, b) => b.return - a.return);

        // Create color map based on All-Time performance ranking
        const colorMap = {
            [allTimePerformance[0].key]: 'var(--pixel-gold)',
            [allTimePerformance[1].key]: 'var(--pixel-silver)',
            [allTimePerformance[2].key]: 'var(--pixel-bronze)'
        };

        // Format return value with color based on All-Time ranking
        const formatReturn = (value, strategyKey) => {
            const indicator = value >= 0 ? '▲' : '▼';
            const formattedValue = Math.abs(value).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            return `<span style="color: ${colorMap[strategyKey]}">${indicator} ${formattedValue}%</span>`;
        };

        // Create All-Time row using the same strategy order (based on final portfolio values)
        allTimeRow.innerHTML = `
            <td>All-Time</td>
            ${strategies.map(strategy => 
                `<td>${formatReturn(allTimeReturns[strategy.key], strategy.key)}</td>`
            ).join('')}
        `;
        tableBody.appendChild(allTimeRow);
    }

    // Make the historical analysis section visible
    const historicalSection = document.getElementById('historicalAnalysis');
    if (historicalSection) {
        historicalSection.style.display = 'block';
    }
}
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(getFormData())
        });
        
        const data = await response.json();
        if (data.error) {
            showError(data.error);
            return;
        }
        
        window.lastChartData = data;
        document.getElementById('results').style.display = 'block';
        updateResultsHeading(data, getFormData());
        renderStockSummaryCards(data);
        updateChart(data);
        updateTransactionLogs(data);
        createCalendarView(data);
        updateRollingReturnsTable(data);
        
        // Store current values as placeholders and clear inputs
        const form = document.getElementById('analysisForm');
        const inputs = form.querySelectorAll('input, select');
        const formData = getFormData(); // Get the current values before clearing

        inputs.forEach(input => {
            const id = input.id;
            if (formData[id]) {
                // For select elements, store the text content instead of value
                if (input.tagName.toLowerCase() === 'select') {
                    const selectedOption = input.options[input.selectedIndex];
                    input.title = selectedOption.text; // Use title attribute for select elements
                } else {
                    input.placeholder = formData[id]; // Set the current value as placeholder
                }
            }
            input.value = ''; // Clear the input
        });
        
        // Update validation state
        validateForm();
    } catch (error) {
        console.error('Error analyzing results:', error);
        showError('Error analyzing results');
    }
}

async function validateAnalysisParams(params) {
    if (!params.ticker || !params.amount || !params.frequency || !params.trailingPercentage) {
        throw new Error('Missing required parameters for analysis');
    }
    
    const amount = parseFloat(params.amount);
    const trailingPercentage = parseFloat(params.trailingPercentage);
    
    if (isNaN(amount) || amount <= 0) {
        throw new Error('Investment amount must be a positive number');
    }
    
    if (isNaN(trailingPercentage) || trailingPercentage <= 0 || trailingPercentage >= 100) {
        throw new Error('Trailing percentage must be between 0 and 100');
    }
}

// Removed market analysis functionality

function addPerformanceClass(element, rank) {
    element.classList.remove('top-performer', 'mid-performer', 'low-performer');
    if (rank === 0) {
        element.classList.add('top-performer');
    } else if (rank === 1) {
        element.classList.add('mid-performer');
    } else {
        element.classList.add('low-performer');
    }
}

// Sort and style strategies based on returns
function sortAndStyleStrategies(strategies) {
    return strategies
        .sort((a, b) => b.return - a.return)
        .map((strategy, index) => {
            strategy.performanceClass = index === 0 ? 'top-performer' : 
                                      index === 1 ? 'mid-performer' : 
                                      'low-performer';
            return strategy;
        });
}


/**
 * Creates an interactive calendar view displaying transaction history
 * Organizes transactions by month with collapsible sections and weekday filtering
 * @param {Object} data - Performance and transaction data
 * @param {Array<string>} data.performance.dates - Array of transaction dates
 * @param {Object} data.transactions - Transaction data for each strategy
 * @param {Object} data.summary - Summary statistics and performance metrics
 * @returns {void}
 * @example
 * // Create calendar view with transaction data
 * createCalendarView({
 *   performance: { dates: ['2024-01-01', '2024-01-15'] },
 *   transactions: { trailing: [...], dca: [...], lump: [...] },
 *   summary: { ... }
 * });
 */
function createCalendarView(data) {
    const calendarDiv = document.getElementById('transactionCalendar');
    if (!calendarDiv) {
        console.warn('Calendar container not found');
        return;
    }
    calendarDiv.innerHTML = '';
    
    // Group dates by month/year for organized display
    const months = {};
    data.performance.dates.forEach(date => {
        const d = new Date(date);
        const monthYear = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
        if (!months[monthYear]) {
            months[monthYear] = {
                startDate: d,
                dates: []
            };
        }
        months[monthYear].dates.push(date);
    });

    // Create calendar months vertically
    Object.entries(months).forEach(([monthYear, monthData]) => {
        const monthSection = document.createElement('div');
        monthSection.className = 'month-section collapsed';
        
        const monthToggle = document.createElement('div');
        monthToggle.className = 'month-toggle';
        monthToggle.innerHTML = `
            <h3>${monthYear}</h3>
            <span class="toggle-icon">▼</span>
        `;
        monthToggle.onclick = () => monthSection.classList.toggle('collapsed');
        
        const monthGrid = document.createElement('div');
        monthGrid.className = 'month-grid';
        
        // Only weekdays
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        weekDays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header';
            dayHeader.textContent = day;
            monthGrid.appendChild(dayHeader);
        });

        // Calculate first weekday offset (Monday = 0)
        const firstDay = new Date(monthData.startDate.getFullYear(), monthData.startDate.getMonth(), 1);
        let firstDayOffset = firstDay.getDay() - 1; // -1 because Monday is now 0
        if (firstDayOffset === -1) firstDayOffset = 4; // Sunday becomes end of week
        
        // Adjust offset for weekends
        let effectiveOffset = firstDayOffset;
        if (firstDay.getDay() === 0) { // If first day is Sunday
            effectiveOffset = 0;
        } else if (firstDay.getDay() === 6) { // If first day is Saturday
            effectiveOffset = 0;
        }

        // Add empty cells for offset
        for (let i = 0; i < effectiveOffset; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            monthGrid.appendChild(emptyDay);
        }

        // Add days (skip weekends)
        const lastDay = new Date(monthData.startDate.getFullYear(), monthData.startDate.getMonth() + 1, 0);
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const currentDate = new Date(monthData.startDate.getFullYear(), monthData.startDate.getMonth(), d);
            if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue; // Skip weekends
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            const dateStr = currentDate.toISOString().split('T')[0];

            // Add day content (prices and transactions)
            const dailyData = data.daily_prices?.[dateStr];
            if (dailyData) {
                const priceChange = ((dailyData.close - dailyData.open) / dailyData.open * 100).toFixed(2);
                const priceDirection = dailyData.close >= dailyData.open ? '▲' : '▼';
                
                dayDiv.innerHTML = `
                    <div class="date">${d}</div>
                    <div class="price-info">
                        <div>Open: ${formatCurrency(dailyData.open)}</div>
                        <div>Close: ${formatCurrency(dailyData.close)}</div>
                        <div>Day's return: ${priceDirection} ${priceChange}%</div>
                    </div>
                `;

                // Add transactions
                [
                    { type: 'trailing', name: 'Buy the Dip', transactions: data.transactions.trailing },
                    { type: 'dca', name: 'DCA', transactions: data.transactions.dca }
                ].forEach(strategy => {
                    strategy.transactions.forEach(t => {
                        if (t.date === dateStr) {
                            const transactionDiv = document.createElement('div');
                            transactionDiv.className = `calendar-transaction ${strategy.type}`;
                            transactionDiv.style.borderLeft = `3px solid ${window.strategyColors[strategy.type]}`;
                            // Apply background color based on performance ranking
                            if (window.strategyColors[strategy.type] === '#FFE169') {
                                transactionDiv.style.backgroundColor = 'rgba(255, 225, 105, 0.3)';
                            } else if (window.strategyColors[strategy.type] === '#DEE2E6') {
                                transactionDiv.style.backgroundColor = 'rgba(222, 226, 230, 0.3)';
                            } else {
                                transactionDiv.style.backgroundColor = 'rgba(118, 82, 14, 0.3)';
                            }
                            transactionDiv.innerHTML = `
                                ${strategy.name}: ${formatCurrency(t.amount)}
                                Buy @ ${formatCurrency(t.price)}
                                Shares: ${t.shares.toFixed(2)}
                            `;
                            dayDiv.appendChild(transactionDiv);
                        }
                    });
                });

                // Add lump sum transaction
                if (dateStr === data.performance.dates[0]) {
                    const lumpDiv = document.createElement('div');
                    lumpDiv.className = 'calendar-transaction lump';
                    lumpDiv.style.borderLeft = `3px solid ${window.strategyColors.lump}`;
                    // Apply background color based on performance ranking
                    if (window.strategyColors.lump === '#FFE169') {
                        lumpDiv.style.backgroundColor = 'rgba(255, 225, 105, 0.3)';
                    } else if (window.strategyColors.lump === '#DEE2E6') {
                        lumpDiv.style.backgroundColor = 'rgba(222, 226, 230, 0.3)';
                    } else {
                        lumpDiv.style.backgroundColor = 'rgba(118, 82, 14, 0.3)';
                    }
                    lumpDiv.innerHTML = `
                        Buy & Hold: ${formatCurrency(data.summary.total_investment)}
                        Buy @ ${formatCurrency(data.summary.initial_price)}
                        Shares: ${(data.summary.total_investment / data.summary.initial_price).toFixed(2)}
                    `;
                    dayDiv.appendChild(lumpDiv);
                }
            }

            monthGrid.appendChild(dayDiv);
        }
        
        monthSection.appendChild(monthToggle);
        monthSection.appendChild(monthGrid);
        calendarDiv.appendChild(monthSection);
    });
}

/**
 * Cache for storing analysis results to prevent redundant calculations
 * @type {Map<string, Object>}
 */
const analysisCache = new Map();

/**
 * Toggles between dollar value and percentage return views in the performance chart
 * @param {string} view - View type ('dollar' or 'percentage')
 */
/**
 * Toggles between dollar value and percentage return views in the performance chart
 * @param {string} view - View type ('dollar' or 'percent')
 * @returns {void}
 */
function toggleChartView(view) {
    // Default to 'dollar' if view is undefined
    if (!view) {
        console.warn('View parameter is undefined, defaulting to dollar view');
        view = 'dollar';
    }
    
    // Ensure view parameter is valid
    if (view !== 'dollar' && view !== 'percent') {
        console.error('Invalid view parameter:', view);
        return;
    }
    
    const isPercentageView = view === 'percent';
    
    // Update the view state
    window.isPercentageView = isPercentageView;
    
    // Update button states
    const dollarOption = document.querySelector('.toggle-option[data-value="dollar"]');
    const percentOption = document.querySelector('.toggle-option[data-value="percent"]');
    
    if (!dollarOption || !percentOption) {
        console.error('Toggle buttons not found in the DOM');
        return;
    }
    
    dollarOption.classList.toggle('active', !isPercentageView);
    percentOption.classList.toggle('active', isPercentageView);
    
    // Update chart if data is available
    if (window.lastChartData) {
        updateChart(window.lastChartData);
    } else {
        console.warn('No chart data available');
    }
}

/**
 * Updates the performance chart with new data
 * @param {Object} data - Chart data object
 * @param {Array} data.dates - Array of dates for x-axis
 * @param {Array} data.values - Array of values for y-axis
 * @returns {void}
 */
function updatePerformanceChart(data) {
    if (!data || !data.dates || !data.values) {
        console.warn('Invalid chart data provided');
        return;
    }
    updateChart(data);
}

// Initialize view state
let isPercentageView = false;
window.isPercentageView = isPercentageView;

/**
 * Toggles the visibility of transaction sections
 * @param {string} section - Section identifier ('calendar' or transaction section ID)
 * @returns {void}
 * @throws {Error} If the specified section element is not found
 */
export function toggleTransactions(section) {
    const logSection = document.querySelector(section === 'calendar' 
        ? '#transactionCalendar' 
        : `.log-section:has(#${section}Transactions)`);
        
    if (!logSection) {
        console.error(`Transaction section '${section}' not found`);
        return;
    }

    if (section === 'calendar') {
        const calendarSection = logSection.closest('.log-section');
        if (calendarSection) {
            calendarSection.classList.toggle('collapsed');
        }
    } else {
        logSection.classList.toggle('collapsed');
    }
}

/**
 * Updates the Pokeball navigation link to X (Twitter)
 * @returns {void}
 */
export function updatePokeballNavigation() {
    const pokeball = document.getElementById('nav-pokeball');
    if (!pokeball) {
        console.warn('Pokeball navigation element not found');
        return;
    }
    
    pokeball.href = 'https://x.com/STCKdotfun';
    pokeball.target = '_blank';
}

// Event source for progress updates
export let progressEventSource = null;

// Export all functions
export {
    formatNumber,
    formatCurrency,
    getPercentageValues,
    formatTimelineTitle,
    updateChart,
    createTransactionTable,
    updateTransactionLogs,
    analyzeResults,
    analysisCache,
    getFormData,
    showError,
    createCalendarView,
    toggleChartView,
    updatePerformanceChart,
    validateForm
};