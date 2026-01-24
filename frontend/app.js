/**
 * ECHELON Narrative Detection Agent
 * Frontend Application Logic
 */

// Configuration
const API_BASE_URL = 'http://localhost:8000';
const ENDPOINTS = {
    narratives: `${API_BASE_URL}/api/narratives`,
    health: `${API_BASE_URL}/api/health`,
    explain: `${API_BASE_URL}/api/explain`
};

// State
let narrativesData = null;
let narrativeChart = null;

// DOM Elements
const elements = {
    loadingOverlay: document.getElementById('loadingOverlay'),
    errorBanner: document.getElementById('errorBanner'),
    errorMessage: document.getElementById('errorMessage'),
    errorClose: document.getElementById('errorClose'),
    refreshBtn: document.getElementById('refreshBtn'),
    lastUpdated: document.getElementById('lastUpdated'),

    // Stats
    activeNarratives: document.getElementById('activeNarratives'),
    marketBias: document.getElementById('marketBias'),
    biasIcon: document.getElementById('biasIcon'),
    narrativeVolatility: document.getElementById('narrativeVolatility'),
    signalConfidence: document.getElementById('signalConfidence'),

    // Lists
    narrativesList: document.getElementById('narrativesList'),
    narrativesGrid: document.getElementById('narrativesGrid'),
    chartLegend: document.getElementById('chartLegend'),

    // Sections
    timelineContainer: document.getElementById('timelineContainer'),
    signalsContainer: document.getElementById('signalsContainer'),
    validNarratives: document.getElementById('validNarratives'),
    discardedNoise: document.getElementById('discardedNoise'),

    // Detail Panel
    detailPanel: document.getElementById('detailPanel'),
    detailTitle: document.getElementById('detailTitle'),
    detailContent: document.getElementById('detailContent'),
    detailClose: document.getElementById('detailClose')
};

// ============================================
// API Functions
// ============================================

async function fetchNarratives() {
    showLoading(true);
    hideError();

    try {
        const response = await fetch(ENDPOINTS.narratives);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        narrativesData = data;

        updateDashboard(data);
        updateLastUpdated();

    } catch (error) {
        console.error('Failed to fetch narratives:', error);
        showError(`Failed to connect to backend: ${error.message}. Make sure the API is running on ${API_BASE_URL}`);
    } finally {
        showLoading(false);
    }
}

// ============================================
// UI Update Functions
// ============================================

function updateDashboard(data) {
    const { narratives, noise, metadata } = data;

    // Update stats cards
    updateStatsCards(narratives);

    // Update narrative chart
    updateNarrativeChart(narratives);

    // Update narratives list
    renderNarrativesList(narratives);

    // Update full narratives grid
    renderNarrativesGrid(narratives);

    // Update timeline
    renderTimeline(narratives);

    // Update signals
    renderSignals(narratives);

    // Update noise analysis
    renderNoiseAnalysis(narratives, noise);
}

function updateStatsCards(narratives) {
    // Active narratives count
    elements.activeNarratives.textContent = narratives.length;

    // Market bias - aggregate sentiment
    const sentimentCounts = { Bullish: 0, Bearish: 0, Neutral: 0 };
    narratives.forEach(n => sentimentCounts[n.sentiment]++);

    let bias = 'Neutral';
    if (sentimentCounts.Bullish > sentimentCounts.Bearish + sentimentCounts.Neutral) {
        bias = 'Bullish';
    } else if (sentimentCounts.Bearish > sentimentCounts.Bullish + sentimentCounts.Neutral) {
        bias = 'Bearish';
    }

    elements.marketBias.textContent = bias;
    elements.biasIcon.style.color = bias === 'Bullish' ? 'var(--bullish)' :
        bias === 'Bearish' ? 'var(--bearish)' : 'var(--neutral)';

    // Narrative volatility - variance in confidence scores
    const confidences = narratives.map(n => n.confidence);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length || 0;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length || 0;
    const volatility = Math.min(Math.sqrt(variance) * 2, 1); // Normalize
    elements.narrativeVolatility.textContent = volatility < 0.3 ? 'Low' : volatility < 0.6 ? 'Medium' : 'High';

    // Signal confidence - average confidence
    elements.signalConfidence.textContent = `${Math.round(avgConfidence * 100)}%`;
}

function updateNarrativeChart(narratives) {
    const ctx = document.getElementById('narrativeChart').getContext('2d');

    // Destroy existing chart
    if (narrativeChart) {
        narrativeChart.destroy();
    }

    // Prepare data - each narrative has a timeline
    const colors = [
        'rgba(0, 212, 255, 1)',
        'rgba(123, 97, 255, 1)',
        'rgba(0, 255, 136, 1)',
        'rgba(255, 170, 0, 1)',
        'rgba(255, 71, 87, 1)'
    ];

    const datasets = narratives.map((narrative, idx) => {
        const color = colors[idx % colors.length];
        const timeline = narrative.timeline || [];

        // Create data points with confidence as Y value
        const dataPoints = timeline.map(day => ({
            x: day,
            y: narrative.confidence * (0.8 + Math.random() * 0.4) // Add some variance
        }));

        return {
            label: narrative.name,
            data: dataPoints,
            borderColor: color,
            backgroundColor: color.replace('1)', '0.1)'),
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
        };
    });

    narrativeChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Days',
                        color: '#a0a0b0'
                    },
                    grid: {
                        color: 'rgba(42, 42, 58, 0.5)'
                    },
                    ticks: {
                        color: '#666680'
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Narrative Strength',
                        color: '#a0a0b0'
                    },
                    grid: {
                        color: 'rgba(42, 42, 58, 0.5)'
                    },
                    ticks: {
                        color: '#666680',
                        callback: value => `${Math.round(value * 100)}%`
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(20, 20, 31, 0.95)',
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                    borderWidth: 1,
                    titleColor: '#ffffff',
                    bodyColor: '#a0a0b0',
                    callbacks: {
                        label: context => {
                            return `${context.dataset.label}: ${Math.round(context.parsed.y * 100)}%`;
                        }
                    }
                }
            }
        }
    });

    // Update legend
    updateChartLegend(narratives, colors);
}

function updateChartLegend(narratives, colors) {
    elements.chartLegend.innerHTML = narratives.map((n, idx) => `
        <div class="legend-item">
            <span class="legend-dot" style="background: ${colors[idx % colors.length]}"></span>
            <span>${n.name}</span>
        </div>
    `).join('');
}

function renderNarrativesList(narratives) {
    elements.narrativesList.innerHTML = narratives.map(n => `
        <div class="narrative-card" onclick="showNarrativeDetail('${n.id}')">
            <div class="narrative-info">
                <h3>
                    <span class="narrative-id">${n.id}</span>
                    ${n.name}
                </h3>
                <div class="narrative-meta">
                    <span class="meta-item">
                        <span class="sentiment-tag ${n.sentiment.toLowerCase()}">${n.sentiment}</span>
                    </span>
                    <span class="meta-item">
                        <span class="stage-tag ${n.stage.toLowerCase()}">${n.stage}</span>
                    </span>
                    <span class="meta-item">Sources: ${n.sources.join(', ')}</span>
                </div>
            </div>
            <div class="narrative-metrics">
                <div class="metric">
                    <div class="metric-value" style="color: var(--accent-primary)">${Math.round(n.confidence * 100)}%</div>
                    <div class="metric-label">Confidence</div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color: var(--accent-secondary)">${Math.round(n.coherence * 100)}%</div>
                    <div class="metric-label">Coherence</div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color: var(--accent-tertiary)">${Math.round(n.persistence * 100)}%</div>
                    <div class="metric-label">Persistence</div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderNarrativesGrid(narratives) {
    elements.narrativesGrid.innerHTML = narratives.map(n => `
        <div class="narrative-full-card">
            <div class="narrative-full-header">
                <div>
                    <div class="narrative-full-title">${n.name}</div>
                    <span class="narrative-id">${n.id}</span>
                </div>
                <div>
                    <span class="sentiment-tag ${n.sentiment.toLowerCase()}">${n.sentiment}</span>
                    <span class="stage-tag ${n.stage.toLowerCase()}">${n.stage}</span>
                </div>
            </div>
            <div class="narrative-full-body">
                <div class="bars-container">
                    <div class="bar-item">
                        <span class="bar-label">Confidence</span>
                        <div class="bar-track">
                            <div class="bar-fill confidence" style="width: ${n.confidence * 100}%"></div>
                        </div>
                        <span class="bar-value">${Math.round(n.confidence * 100)}%</span>
                    </div>
                    <div class="bar-item">
                        <span class="bar-label">Coherence</span>
                        <div class="bar-track">
                            <div class="bar-fill coherence" style="width: ${n.coherence * 100}%"></div>
                        </div>
                        <span class="bar-value">${Math.round(n.coherence * 100)}%</span>
                    </div>
                    <div class="bar-item">
                        <span class="bar-label">Persistence</span>
                        <div class="bar-track">
                            <div class="bar-fill persistence" style="width: ${n.persistence * 100}%"></div>
                        </div>
                        <span class="bar-value">${Math.round(n.persistence * 100)}%</span>
                    </div>
                </div>
                <p class="narrative-description">${n.description}</p>
            </div>
        </div>
    `).join('');
}

function renderTimeline(narratives) {
    // Group narratives by timeline periods
    const periods = {};
    narratives.forEach(n => {
        (n.timeline || []).forEach(day => {
            if (!periods[day]) periods[day] = [];
            periods[day].push(n.name);
        });
    });

    const sortedDays = Object.keys(periods).sort((a, b) => a - b);

    elements.timelineContainer.innerHTML = sortedDays.map(day => `
        <div class="timeline-item">
            <div class="timeline-period">Day ${day}</div>
            <div class="timeline-narratives">
                ${periods[day].map(name => `
                    <span class="timeline-tag">${name}</span>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function renderSignals(narratives) {
    elements.signalsContainer.innerHTML = narratives.map(n => {
        // Generate mini chart data from timeline
        const timeline = n.timeline || [];
        const maxDay = Math.max(...timeline, 1);
        const barHeights = [];
        for (let i = 1; i <= maxDay; i++) {
            barHeights.push(timeline.includes(i) ? 30 + Math.random() * 30 : 5);
        }

        return `
            <div class="signal-card">
                <div class="signal-header">
                    <span class="signal-name">${n.name}</span>
                    <span class="sentiment-tag ${n.sentiment.toLowerCase()}">${n.sentiment}</span>
                </div>
                <div class="signal-value">${Math.round(n.confidence * 100)}%</div>
                <div class="signal-chart">
                    ${barHeights.map(h => `
                        <div class="signal-bar" style="height: ${h}px"></div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function renderNoiseAnalysis(narratives, noise) {
    // Valid narratives
    elements.validNarratives.innerHTML = narratives.map(n => `
        <div class="noise-item" style="border-left: 3px solid var(--bullish)">
            <div style="font-weight: 600; margin-bottom: 4px;">${n.name}</div>
            <div class="noise-text">${n.description}</div>
            <div style="margin-top: 8px; font-size: 0.75rem; color: var(--accent-tertiary);">
                Confidence: ${Math.round(n.confidence * 100)}% | Coherence: ${Math.round(n.coherence * 100)}%
            </div>
        </div>
    `).join('') || '<p style="color: var(--text-muted)">No valid narratives detected</p>';

    // Discarded noise
    elements.discardedNoise.innerHTML = noise.map(item => `
        <div class="noise-item">
            <div class="noise-reason">${item.reason}</div>
            ${item.texts.map(t => `<div class="noise-text">"${t}"</div>`).join('')}
        </div>
    `).join('') || '<p style="color: var(--text-muted)">No noise detected</p>';
}

// ============================================
// Detail Panel
// ============================================

function showNarrativeDetail(id) {
    const narrative = narrativesData?.narratives.find(n => n.id === id);
    if (!narrative) return;

    // Compute DNA metrics
    const dnaMetrics = computeNarrativeDNA(narrative);

    elements.detailTitle.textContent = narrative.name;
    elements.detailContent.innerHTML = `
        <div class="detail-section">
            <div class="detail-section-title">Overview</div>
            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <span class="sentiment-tag ${narrative.sentiment.toLowerCase()}">${narrative.sentiment}</span>
                <span class="stage-tag ${narrative.stage.toLowerCase()}">${narrative.stage}</span>
            </div>
            <p style="color: var(--text-secondary); line-height: 1.7;">${narrative.description}</p>
        </div>
        
        <!-- Narrative DNA Fingerprint -->
        ${renderNarrativeDNA(narrative, dnaMetrics)}
        
        <div class="detail-section">
            <div class="detail-section-title">Lifecycle Stage</div>
            <div style="font-size: 1.25rem; font-weight: 600; color: var(--accent-primary);">${narrative.stage}</div>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 8px;">
                ${getStageDescription(narrative.stage)}
            </p>
        </div>
        
        <div class="detail-section">
            <div class="detail-section-title">Metrics</div>
            <div class="bars-container">
                <div class="bar-item">
                    <span class="bar-label">Confidence</span>
                    <div class="bar-track">
                        <div class="bar-fill confidence" style="width: ${narrative.confidence * 100}%"></div>
                    </div>
                    <span class="bar-value">${Math.round(narrative.confidence * 100)}%</span>
                </div>
                <div class="bar-item">
                    <span class="bar-label">Coherence</span>
                    <div class="bar-track">
                        <div class="bar-fill coherence" style="width: ${narrative.coherence * 100}%"></div>
                    </div>
                    <span class="bar-value">${Math.round(narrative.coherence * 100)}%</span>
                </div>
                <div class="bar-item">
                    <span class="bar-label">Persistence</span>
                    <div class="bar-track">
                        <div class="bar-fill persistence" style="width: ${narrative.persistence * 100}%"></div>
                    </div>
                    <span class="bar-value">${Math.round(narrative.persistence * 100)}%</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <div class="detail-section-title">Timeline Presence</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${(narrative.timeline || []).map(day => `
                    <span style="
                        padding: 4px 12px;
                        background: var(--bg-tertiary);
                        border-radius: 4px;
                        font-family: var(--font-mono);
                        font-size: 0.85rem;
                    ">Day ${day}</span>
                `).join('')}
            </div>
        </div>
        
        <div class="detail-section">
            <div class="detail-section-title">Sources</div>
            <div style="display: flex; gap: 8px;">
                ${narrative.sources.map(s => `
                    <span style="
                        padding: 4px 12px;
                        background: var(--accent-primary);
                        background: rgba(0, 212, 255, 0.15);
                        color: var(--accent-primary);
                        border-radius: 4px;
                        font-size: 0.85rem;
                    ">${s}</span>
                `).join('')}
            </div>
        </div>
    `;

    elements.detailPanel.classList.add('open');
}

// ============================================
// Narrative DNA Visualization
// ============================================

/**
 * Compute derived DNA metrics from narrative data.
 * These metrics characterize the narrative's internal properties.
 * 
 * @param {Object} narrative - Narrative object from API
 * @returns {Object} DNA metrics: coherence, persistence, stability, velocity
 */
function computeNarrativeDNA(narrative) {
    const timeline = narrative.timeline || [];

    // Coherence: Direct from API
    const coherence = narrative.coherence;

    // Persistence: Direct from API
    const persistence = narrative.persistence;

    // Stability: Derived from timeline smoothness
    // Stable timeline = evenly distributed mentions
    // Spiky timeline = clustered mentions
    const stability = computeTimelineStability(timeline);

    // Velocity: Derived from timeline trend
    const velocity = computeTimelineVelocity(timeline);

    return { coherence, persistence, stability, velocity };
}

/**
 * Compute timeline stability from variance.
 * Stability = 1 - normalized variance
 * 
 * @param {Array} timeline - Array of day numbers
 * @returns {number} Stability score (0-1)
 */
function computeTimelineStability(timeline) {
    if (!timeline || timeline.length < 2) {
        return 0.5; // Default for insufficient data
    }

    // Calculate gaps between consecutive days
    const sortedDays = [...timeline].sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < sortedDays.length; i++) {
        gaps.push(sortedDays[i] - sortedDays[i - 1]);
    }

    if (gaps.length === 0) return 1.0;

    // Calculate variance of gaps
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / gaps.length;

    // Normalize variance (assume max variance of 9 for 7-day window)
    const normalizedVariance = Math.min(variance / 9, 1);

    // Stability = 1 - variance (high variance = low stability)
    return Math.max(0, 1 - normalizedVariance);
}

/**
 * Compute timeline velocity (trend direction).
 * Uses simple linear regression on timeline density.
 * 
 * @param {Array} timeline - Array of day numbers
 * @returns {Object} Velocity info: symbol, label, cssClass
 */
function computeTimelineVelocity(timeline) {
    if (!timeline || timeline.length < 2) {
        return { symbol: '→', label: 'Stable', cssClass: 'stable' };
    }

    const sortedDays = [...timeline].sort((a, b) => a - b);
    const minDay = sortedDays[0];
    const maxDay = sortedDays[sortedDays.length - 1];
    const midPoint = (minDay + maxDay) / 2;

    // Count mentions in first half vs second half
    const firstHalf = sortedDays.filter(d => d <= midPoint).length;
    const secondHalf = sortedDays.filter(d => d > midPoint).length;

    // Calculate trend ratio
    const ratio = secondHalf / Math.max(firstHalf, 1);

    if (ratio > 1.5) {
        return { symbol: '↑↑', label: 'Rising Fast', cssClass: 'rising-fast' };
    } else if (ratio > 1.1) {
        return { symbol: '↑', label: 'Rising', cssClass: 'rising' };
    } else if (ratio < 0.7) {
        return { symbol: '↓', label: 'Declining', cssClass: 'declining' };
    } else {
        return { symbol: '→', label: 'Stable', cssClass: 'stable' };
    }
}

/**
 * Render the Narrative DNA card HTML.
 * 
 * @param {Object} narrative - Narrative object
 * @param {Object} dna - Computed DNA metrics
 * @returns {string} HTML for DNA card
 */
function renderNarrativeDNA(narrative, dna) {
    return `
        <div class="dna-card">
            <div class="dna-header">
                <span class="dna-icon">◈</span>
                <span class="dna-title">Narrative DNA</span>
            </div>
            <div class="dna-metrics">
                <div class="dna-row">
                    <span class="dna-label">Coherence</span>
                    <div class="dna-bar-container">
                        <div class="dna-bar coherence" style="width: ${dna.coherence * 100}%"></div>
                    </div>
                    <span class="dna-value">${Math.round(dna.coherence * 100)}%</span>
                </div>
                <div class="dna-row">
                    <span class="dna-label">Persistence</span>
                    <div class="dna-bar-container">
                        <div class="dna-bar persistence" style="width: ${dna.persistence * 100}%"></div>
                    </div>
                    <span class="dna-value">${Math.round(dna.persistence * 100)}%</span>
                </div>
                <div class="dna-row">
                    <span class="dna-label">Stability</span>
                    <div class="dna-bar-container">
                        <div class="dna-bar stability" style="width: ${dna.stability * 100}%"></div>
                    </div>
                    <span class="dna-value">${Math.round(dna.stability * 100)}%</span>
                </div>
                <div class="dna-velocity-row">
                    <span class="dna-label">Velocity</span>
                    <span class="dna-velocity-value ${dna.velocity.cssClass}">
                        ${dna.velocity.symbol} ${dna.velocity.label}
                    </span>
                </div>
            </div>
        </div>
    `;
}

function getStageDescription(stage) {
    const descriptions = {
        'Early': 'This narrative is just emerging. Limited data points but showing initial patterns.',
        'Growth': 'The narrative is building momentum. Increasing mentions and strengthening coherence.',
        'Acceleration': 'Mature narrative with widespread presence. High persistence across time periods.',
        'Decay': 'This narrative is fading. Declining mentions and fragmenting coherence.'
    };
    return descriptions[stage] || '';
}

function closeDetailPanel() {
    elements.detailPanel.classList.remove('open');
}

// ============================================
// Navigation
// ============================================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const sectionId = item.dataset.section;

            // Update nav
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Update sections
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(`${sectionId}-section`).classList.add('active');
        });
    });
}

// ============================================
// Utility Functions
// ============================================

function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.remove('hidden');
    } else {
        elements.loadingOverlay.classList.add('hidden');
    }
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorBanner.style.display = 'flex';
}

function hideError() {
    elements.errorBanner.style.display = 'none';
}

function updateLastUpdated() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    elements.lastUpdated.textContent = `Last updated: ${timeStr}`;
}

// ============================================
// Event Listeners
// ============================================

function initEventListeners() {
    elements.refreshBtn.addEventListener('click', fetchNarratives);
    elements.errorClose.addEventListener('click', hideError);
    elements.detailClose.addEventListener('click', closeDetailPanel);

    // Close detail panel on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDetailPanel();
        }
    });

    // Initialize explanation interface
    initExplanationInterface();
}

// ============================================
// Explanation Interface
// ============================================

function initExplanationInterface() {
    const questionInput = document.getElementById('questionInput');
    const askBtn = document.getElementById('askBtn');
    const exampleBtns = document.querySelectorAll('.example-btn');
    const interrogationBtns = document.querySelectorAll('.interrogation-btn');

    if (!questionInput || !askBtn) return;

    // Ask button click
    askBtn.addEventListener('click', () => {
        const question = questionInput.value.trim();
        if (question) {
            askQuestion(question);
        }
    });

    // Enter key in input
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const question = questionInput.value.trim();
            if (question) {
                askQuestion(question);
            }
        }
    });

    // Example question buttons
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.dataset.question;
            questionInput.value = question;
            askQuestion(question);
        });
    });

    // Interrogation mode buttons
    // These are the exact questions a human analyst would ask
    interrogationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.dataset.question;
            questionInput.value = question;
            askQuestion(question);
        });
    });
}

async function askQuestion(question) {
    const responseContainer = document.getElementById('explanationResponse');
    const askBtn = document.getElementById('askBtn');

    // Show loading state
    askBtn.disabled = true;
    askBtn.textContent = 'Thinking...';
    responseContainer.innerHTML = `
        <div class="response-placeholder">
            <div class="loading-spinner" style="width: 32px; height: 32px;"></div>
            <span>Generating explanation...</span>
        </div>
    `;

    try {
        const response = await fetch(ENDPOINTS.explain, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        displayExplanation(data);

    } catch (error) {
        console.error('Failed to get explanation:', error);
        responseContainer.innerHTML = `
            <div class="unsupported-response">
                <p style="color: var(--accent-danger);">
                    Failed to get explanation: ${error.message}
                </p>
                <p style="color: var(--text-muted); margin-top: 8px;">
                    Make sure the backend is running on ${API_BASE_URL}
                </p>
            </div>
        `;
    } finally {
        askBtn.disabled = false;
        askBtn.textContent = 'Ask';
    }
}

function displayExplanation(data) {
    const responseContainer = document.getElementById('explanationResponse');
    const { question_type, explanation, is_supported } = data;

    // Format the question type for display
    const typeLabels = {
        'narrative_explanation': 'Narrative Explanation',
        'comparison': 'Comparison Analysis',
        'noise_justification': 'Noise Justification',
        'lifecycle_reasoning': 'Lifecycle Reasoning',
        'unsupported': 'Unsupported Question'
    };

    const typeLabel = typeLabels[question_type] || question_type;

    // Convert markdown-like formatting to HTML
    const formattedExplanation = formatExplanation(explanation);

    responseContainer.innerHTML = `
        <div class="${is_supported ? '' : 'unsupported-response'}">
            <span class="question-type-badge">${typeLabel}</span>
            <div class="explanation-text">
                ${formattedExplanation}
            </div>
        </div>
    `;
}

function formatExplanation(text) {
    // Simple markdown-like formatting
    return text
        // Bold
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Headers
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        // Lists
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
        // Tables (simple conversion)
        .replace(/\|([^|]+)\|([^|]+)\|([^|]*)\|/g, (match, c1, c2, c3) => {
            if (c1.includes('---')) return '';
            return `<tr><td>${c1.trim()}</td><td>${c2.trim()}</td>${c3 ? `<td>${c3.trim()}</td>` : ''}</tr>`;
        })
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        // Wrap lists
        .replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>')
        // Wrap in paragraph
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

// ============================================
// Initialization
// ============================================

function init() {
    initNavigation();
    initEventListeners();
    fetchNarratives();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
