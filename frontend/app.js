/**
 * ECHELON Narrative Detection Agent
 * Frontend Application Logic
 */

// Configuration
const API_BASE_URL = 'http://localhost:8000';
const ENDPOINTS = {
    narratives: `${API_BASE_URL}/api/narratives`,
    health: `${API_BASE_URL}/api/health`
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

function getStageDescription(stage) {
    const descriptions = {
        'Early': 'This narrative is just emerging. Limited data points but showing initial patterns.',
        'Growth': 'The narrative is building momentum. Increasing mentions and strengthening coherence.',
        'Acceleration': 'Mature narrative with widespread presence. High persistence across time periods.'
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
