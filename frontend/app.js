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

    // War Room
    chatHistory: document.getElementById('chatHistory'),
    chatInput: document.getElementById('chatInput'),
    sendBtn: document.getElementById('sendBtn'),

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

async function sendExplanationRequest() {
    const question = elements.chatInput.value.trim();
    if (!question) return;

    // Add user message via logic (implemented in updateUI)
    appendChatMessage('user', question);
    elements.chatInput.value = '';

    // Add loading indicator
    const loadingId = appendChatMessage('system', 'Analyzing strategic context...');

    try {
        const response = await fetch(ENDPOINTS.explain, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });

        if (!response.ok) throw new Error('Failed to get explanation');

        const data = await response.json();

        // Remove loading
        removeChatMessage(loadingId);

        // Add bot response
        appendChatMessage('system', data.explanation);

    } catch (error) {
        console.error('Explanation error:', error);
        removeChatMessage(loadingId);
        appendChatMessage('system', "I encountered an error analyzing that request. Please try again.");
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
    // Active narratives count (strength > 15)
    const activeCount = narratives.filter(n => n.strength > 15).length;
    elements.activeNarratives.textContent = activeCount;

    // Market bias - aggregate sentiment weighted by strength
    const sentimentCounts = { Bullish: 0, Bearish: 0, Neutral: 0 };
    narratives.forEach(n => {
        sentimentCounts[n.sentiment] += n.strength;
    });

    let bias = 'Neutral';
    if (sentimentCounts.Bullish > sentimentCounts.Bearish + sentimentCounts.Neutral) {
        bias = 'Bullish';
    } else if (sentimentCounts.Bearish > sentimentCounts.Bullish + sentimentCounts.Neutral) {
        bias = 'Bearish';
    }

    elements.marketBias.textContent = bias;
    elements.biasIcon.style.color = bias === 'Bullish' ? 'var(--bullish)' :
        bias === 'Bearish' ? 'var(--bearish)' : 'var(--neutral)';

    // Dominant narratives count (strength > 60)
    const dominantCount = narratives.filter(n => n.strength > 60).length;
    elements.narrativeVolatility.textContent = `${dominantCount} Dominant`;

    // Signal confidence - average strength of active narratives
    const activeNarratives = narratives.filter(n => n.strength > 15);
    const avgStrength = activeNarratives.reduce((sum, n) => sum + n.strength, 0) / activeNarratives.length || 0;
    elements.signalConfidence.textContent = `${Math.round(avgStrength)}%`;
}

function updateNarrativeChart(narratives) {
    const ctx = document.getElementById('narrativeChart').getContext('2d');

    // Destroy existing chart
    if (narrativeChart) {
        narrativeChart.destroy();
    }

    // Get top 5 active narratives by strength
    const top5 = narratives
        .filter(n => n.strength > 15)
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 5);

    // Prepare data - each narrative has a timeline
    const colors = [
        'rgba(0, 212, 255, 1)',
        'rgba(123, 97, 255, 1)',
        'rgba(0, 255, 136, 1)',
        'rgba(255, 170, 0, 1)',
        'rgba(255, 71, 87, 1)'
    ];

    const datasets = top5.map((narrative, idx) => {
        const color = colors[idx % colors.length];
        const timeline = narrative.timeline || [];

        // Create data points with strength as Y value (normalized 0-1)
        const dataPoints = timeline.map((day, dayIdx) => ({
            x: formatDate(day),
            y: (narrative.strength / 100) * (0.9 + (dayIdx % 3) * 0.03)
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
            labels: getLastDays(14).map(d => formatDate(d)),
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
                    type: 'category',
                    title: {
                        display: true,
                        text: 'Timeline',
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

    // Update legend with top 5 names
    updateChartLegend(top5, colors);
}

function updateChartLegend(narratives, colors) {
    elements.chartLegend.innerHTML = narratives.map((n, idx) => `
        <div class="legend-item">
            <span class="legend-dot" style="background: ${colors[idx % colors.length]}"></span>
            <span>${n.name} (${n.strength}%)</span>
        </div>
    `).join('');
}

function renderNarrativesList(narratives) {
<<<<<<< HEAD
    elements.narrativesList.innerHTML = narratives.map(n => `
        <div class="narrative-card" onclick="showNarrativeDetail('${n.id}')">
            <div class="card-header-section">
                <div class="card-label">WHAT</div>
                <h3 class="card-title">${n.name}</h3>
                <div class="narrative-meta">
                    <span class="status-tag ${(n.narrative_status || 'Emerging').toLowerCase()}">${n.narrative_status || 'Emerging'}</span>
                    <span class="stage-tag ${n.stage.toLowerCase()}">${n.stage}</span>
                </div>
            </div>
            
            <div class="card-body-section">
                <div class="card-label">WHY</div>
                <p class="card-reasoning">Detected due to strong signal coherence (${Math.round(n.coherence * 100)}%) across ${n.sources.length} distinct data sources.</p>
            </div>

            <div class="card-footer-section">
                <div class="card-label">EVIDENCE</div>
                <div class="mini-metrics-row">
                    <span class="mini-metric">Coh: <strong>${Math.round(n.coherence * 100)}%</strong></span>
                    <span class="mini-metric">Per: <strong>${Math.round(n.persistence * 100)}%</strong></span>
                    <span class="mini-metric">Src: <strong>${n.sources.length}</strong></span>
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
                    <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
                        <span class="narrative-id">${n.id}</span>
                        <span class="status-tag ${(n.narrative_status || 'Emerging').toLowerCase()}">${n.narrative_status || 'Emerging'}</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">
                            Sources: <span style="color: var(--accent-primary);">${n.sources.join(', ')}</span>
                        </span>
=======
    // Sort by strength and show only active narratives
    const activeNarratives = narratives
        .filter(n => n.strength > 15)
        .sort((a, b) => b.strength - a.strength);

    elements.narrativesList.innerHTML = activeNarratives.map(n => {
        const momentumIcon = n.momentum === '+' ? '↑' : '↓';
        const momentumColor = n.momentum === '+' ? 'var(--bullish)' : 'var(--bearish)';

        return `
            <div class="narrative-card" onclick="showNarrativeDetail('${n.id}')">
                <div class="narrative-info">
                    <h3>
                        <span class="narrative-id">${n.id}</span>
                        ${n.name}
                        <span style="font-size: 0.9rem; color: ${momentumColor}; margin-left: 4px;">${momentumIcon}</span>
                    </h3>
                    <div class="narrative-meta">
                        <span class="meta-item">
                            <span class="sentiment-tag ${n.sentiment.toLowerCase()}">${n.sentiment}</span>
                        </span>
                        <span class="meta-item">
                            <span class="stage-tag ${n.stage.toLowerCase()}">${n.stage}</span>
                        </span>
                        <span class="meta-item">Sources: ${n.sources.slice(0, 2).join(', ')}</span>
                    </div>
                </div>
                <div class="narrative-metrics">
                    <div class="metric">
                        <div class="metric-value" style="color: var(--accent-primary)">${n.strength}%</div>
                        <div class="metric-label">Strength</div>
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
        `;
    }).join('');
}

function renderNarrativesGrid(narratives) {
    // Sort by strength and show all narratives with strength indicator
    const sortedNarratives = [...narratives].sort((a, b) => b.strength - a.strength);

    elements.narrativesGrid.innerHTML = sortedNarratives.map(n => {
        const momentumIcon = n.momentum === '+' ? '↑' : '↓';
        const momentumColor = n.momentum === '+' ? 'var(--bullish)' : 'var(--bearish)';
        const isWeak = n.strength <= 15;
        const cardOpacity = isWeak ? '0.6' : '1';

        return `
            <div class="narrative-full-card" style="opacity: ${cardOpacity}">
                <div class="narrative-full-header">
                    <div>
                        <div class="narrative-full-title">
                            ${n.name}
                            <span style="font-size: 0.9rem; color: ${momentumColor}; margin-left: 4px;">${momentumIcon}</span>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
                            <span class="narrative-id">${n.id}</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">
                                Sources: <span style="color: var(--accent-primary);">${n.sources.slice(0, 2).join(', ')}</span>
                            </span>
                        </div>
                    </div>
                    <div>
                        <span class="sentiment-tag ${n.sentiment.toLowerCase()}">${n.sentiment}</span>
                        <span class="stage-tag ${n.stage.toLowerCase()}">${n.stage}</span>
>>>>>>> 261a5fe (feat: multi-narrative system and reactbits UI upgrade)
                    </div>
                </div>
                <div class="narrative-full-body">
                    <div class="bars-container">
                        <div class="bar-item">
                            <span class="bar-label">Strength</span>
                            <div class="bar-track">
                                <div class="bar-fill confidence" style="width: ${n.strength}%"></div>
                            </div>
                            <span class="bar-value">${n.strength}%</span>
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
        `;
    }).join('');
}

function renderTimeline(narratives) {
    // Group narratives by timeline periods
    const periods = {};
    narratives.forEach(n => {
        (n.timeline || []).forEach(day => {
            if (!periods[day]) periods[day] = [];
            periods[day].push(n);
        });
    });

    const sortedDays = Object.keys(periods).sort().reverse(); // Reverse to show newest top

    elements.timelineContainer.innerHTML = sortedDays.map(day => `
        <div class="timeline-item">
            <div class="timeline-period">${formatDate(day)}</div>
            <div class="timeline-narratives">
                ${periods[day].map(n => `
                    <div class="timeline-entry">
                        <span class="timeline-tag">${n.name}</span>
                        <span class="status-dot ${(n.narrative_status || 'Emerging').toLowerCase()}" title="${n.narrative_status}"></span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function renderSignals(narratives) {
    // Get active narratives (strength > 15) and sort by strength
    const activeNarratives = narratives
        .filter(n => n.strength > 15)
        .sort((a, b) => b.strength - a.strength);

    // Take top 5 for display
    const top5 = activeNarratives.slice(0, 5);
    const hiddenCount = activeNarratives.length - 5;

    let html = '';

    // Add indicator for hidden narratives
    if (hiddenCount > 0) {
        html += `
            <div style="
                text-align: center;
                padding: 12px;
                background: var(--bg-tertiary);
                border-radius: 8px;
                margin-bottom: 16px;
                color: var(--text-secondary);
                font-size: 0.9rem;
            ">
                Showing top 5 of <span style="color: var(--accent-primary); font-weight: 600;">${activeNarratives.length}</span> active narratives
            </div>
        `;
    }

    html += top5.map(n => {
        // Generate mini chart data from timeline
        const timeline = n.timeline || [];
        const lastDays = getLastDays(14);

        const barHeights = lastDays.map((day, idx) => {
            // Deterministic heights based on strength and position
            return timeline.includes(day) ? 20 + (n.strength / 3) : 5;
        });

        const momentumIcon = n.momentum === '+' ? '↑' : '↓';
        const momentumColor = n.momentum === '+' ? 'var(--bullish)' : 'var(--bearish)';

        return `
            <div class="signal-card">
                <div class="signal-header">
                    <span class="signal-name">${n.name}</span>
                    <span class="sentiment-tag ${n.sentiment.toLowerCase()}">${n.sentiment}</span>
                </div>
                <div class="signal-value">
                    ${n.strength}%
                    <span style="font-size: 0.9rem; color: ${momentumColor}; margin-left: 4px;">${momentumIcon}</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px;">
                    ${n.stage} • ${n.sources.slice(0, 2).join(', ')}
                </div>
                <div class="signal-chart">
                    ${barHeights.map(h => `
                        <div class="signal-bar" style="height: ${h}px"></div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    elements.signalsContainer.innerHTML = html;
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
            ${item.texts.map(t => {
        const cleanText = t.length > 100 ? t.substring(0, 97) + '...' : t;
        return `<div class="noise-text">"${cleanText}"</div>`;
    }).join('')}
        </div>
    `).join('') || '<p style="color: var(--text-muted)">No noise detected</p>';
}

// Chat UI Functions
function appendChatMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    const id = 'msg-' + Date.now();
    messageDiv.id = id;

    // Parse markdown-like basic formatting
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
        <div class="message-content">
            ${formattedText}
        </div>
    `;

    elements.chatHistory.appendChild(messageDiv);
    elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;
    return id;
}

function removeChatMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// ============================================
// Detail Panel
// ============================================

async function showNarrativeDetail(id) {
    const narrative = narrativesData?.narratives.find(n => n.id === id);
    if (!narrative) return;

    // Switch to War Room (Narrative Explanations) View
    const warRoomTab = document.querySelector('[data-section="war-room"]');
    if (warRoomTab) warRoomTab.click();

    // Show initial state in War Room
    renderExplanationView(narrative, null, true);

    // Fetch deep dive explanation
    try {
        const response = await fetch(ENDPOINTS.explain, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: `Why is ${narrative.name} classified as ${narrative.stage} stage?`
            })
        });

        if (!response.ok) throw new Error('Explanation service unavailable');

        const data = await response.json();
        renderExplanationView(narrative, data, false);

    } catch (error) {
        console.error("Explanation error:", error);
        renderExplanationView(narrative, { explanation: `**Analysis Error**\n\nCould not generate deep dive: ${error.message}` }, false);
    }
}

function renderExplanationView(narrative, explanationData, isLoading) {
    const container = elements.chatHistory;

    if (isLoading) {
        container.innerHTML = `
            <div class="explanation-loading">
                <div class="loading-spinner"></div>
                <div style="margin-top: 12px; color: var(--accent-primary);">Generating deep dive analysis for <strong>${narrative.name}</strong>...</div>
            </div>
        `;
        return;
    }

    // Render Full Report
    // Markdown-to-HTML helper for simple bolding
    const formatText = (text) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

    container.innerHTML = `
        <div class="explanation-report">
            <div class="report-header">
                <div class="report-title">${narrative.name}</div>
                <div class="report-badges">
                    <span class="badg status ${narrative.narrative_status.toLowerCase()}">${narrative.narrative_status}</span>
                    <span class="badg stage ${narrative.stage.toLowerCase()}">${narrative.stage}</span>
                </div>
            </div>

            <div class="report-section analysis">
                <h3><span class="icon">🧠</span> Autonomous Reasoning</h3>
                <div class="report-text">${formatText(explanationData.explanation)}</div>
            </div>

            <div class="report-grid">
                <div class="report-card metric-card">
                    <h4>Confidence</h4>
                    <div class="big-value">${Math.round(narrative.confidence * 100)}%</div>
                    <div class="sub-text">Signal Strength</div>
                </div>
                <div class="report-card metric-card">
                    <h4>Coherence</h4>
                    <div class="big-value">${Math.round(narrative.coherence * 100)}%</div>
                    <div class="sub-text">Semantic Density</div>
                </div>
                <div class="report-card metric-card">
                     <h4>Persistence</h4>
                    <div class="big-value">${Math.round(narrative.persistence * 100)}%</div>
                    <div class="sub-text">Temporal Reach</div>
                </div>
            </div>
        </div>
    `;
}

function closeDetailPanel() {
    // Deprecated but kept to prevent errors if called
    if (elements.detailPanel) elements.detailPanel.classList.remove('open');
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

function getLastDays(numDays) {
    const days = [];
    for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
}

function formatDate(dateStr) {
    // Convert YYYY-MM-DD to MMM DD (e.g. Jan 24)
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================
// Event Listeners
// ============================================

function initEventListeners() {
    elements.refreshBtn.addEventListener('click', fetchNarratives);
    elements.errorClose.addEventListener('click', hideError);
    elements.detailClose.addEventListener('click', closeDetailPanel);

    // War Room Input listeners removed per redesign

    // Close detail panel on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDetailPanel();
        }
    });

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
