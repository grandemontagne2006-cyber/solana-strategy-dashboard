/**
 * Global Dragon Swarm v8.0 (vTOTAL) - Obsidian Terminal Engine
 * ============================================================
 * Data-binding kernel for the Institutional Terminal interface.
 */

function updateTerminalField(id, value, isStatus = false) {
    const el = document.getElementById(id);
    if (!el) return;
    
    if (isStatus) {
        el.textContent = value.toUpperCase();
        el.className = 'status-pill ' + (value.toLowerCase().includes('online') || value.toLowerCase().includes('sync') || value.toLowerCase().includes('active') ? 'status-ok' : 'status-warn');
    } else {
        el.textContent = value;
    }
}

function updateGateRing(ringId, valId, score, passed) {
    const ring = document.getElementById(ringId);
    const val = document.getElementById(valId);
    if (!ring || !val) return;
    
    // SVG Dasharray is 100 (PI * 2 * 16 approx 100)
    const offset = 100 - score;
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = passed ? 'var(--term-green)' : 'var(--term-red)';
    val.textContent = Math.round(score);
}

async function syncTerminal() {
    const statusEl = document.getElementById('syncStatus');
    const container = document.body;

    try {
        // 1. Data Ingestion (CORS-immune Bridge)
        // Note: index.html must include <script src="data/latest_signal_v6.js"></script>
        let data = window.DRAGON_DATA;
        
        if (!data) {
            statusEl.textContent = 'WAITING_FOR_SIGNAL...';
            statusEl.className = 'status-pill status-warn';
            return;
        }

        // 2. Dragon Vitals
        updateTerminalField('dragonScore', data.dragon_vitals.score.toFixed(1));
        
        const regimeLabel = document.getElementById('dragonRegime');
        if (regimeLabel) {
            const rawRegime = data.dragon_vitals.regime || 'NEUTRAL';
            regimeLabel.textContent = rawRegime.replace(/_/g, ' ');
            // Clear old classes
            regimeLabel.classList.remove('regime-1', 'regime-1-5', 'regime-2', 'regime-2-5', 'regime-3');
            // Apply new class
            const regimeKey = rawRegime.toLowerCase().replace(/\./g, '-');
            regimeLabel.classList.add(regimeKey);
        }
        
        updateTerminalField('dragonConviction', (data.dragon_vitals.conviction * 100).toFixed(0) + '%');
        
        // Gate Engine v2.0 Vitals
        if (data.dragon_vitals.gate_cgs !== undefined) {
            updateTerminalField('dragonCGS', data.dragon_vitals.gate_cgs.toFixed(1));
            updateTerminalField('dragonHVI', data.dragon_vitals.hvi !== undefined ? Math.round(data.dragon_vitals.hvi) : '50');
            updateTerminalField('deploymentMode', data.dragon_vitals.deployment_mode);
            updateTerminalField('tacticalDeploy', (data.dragon_vitals.tactical_pct * 100).toFixed(0) + '%');
            
            const modeEl = document.getElementById('deploymentMode');
            if (modeEl) {
                const mode = data.dragon_vitals.deployment_mode;
                modeEl.style.borderColor = mode === 'FORTRESS' ? 'var(--term-red)' : (mode === 'OFFENSIVE' ? 'var(--term-highlight)' : 'var(--term-blue)');
                modeEl.style.color = modeEl.style.borderColor;
            }
            
            const vetoEl = document.getElementById('vetoIndicator');
            if (vetoEl) {
                vetoEl.style.display = data.dragon_vitals.pnl_master_veto ? 'block' : 'none';
            }
        }

        // 360° Panopticon Monitor v2.2 (Overclock status)
        if (data.dragon_vitals.rvol !== undefined) {
            const rvol = data.dragon_vitals.rvol;
            const rvolEl = document.getElementById('panRVol');
            const overclockActive = data.dragon_vitals.overclock_active || false;
            
            if (rvolEl) {
                rvolEl.textContent = rvol.toFixed(1) + 'x';
                rvolEl.style.color = (rvol > 3.0 || overclockActive) ? 'var(--term-red)' : 'var(--term-highlight)';
                if (overclockActive) rvolEl.classList.add('glow-red');
                else rvolEl.classList.remove('glow-red');
            }
            
            // Overclock Button State
            const ocBtn = document.getElementById('overclock-btn');
            if (ocBtn) {
                ocBtn.textContent = overclockActive ? 'RESTORE NORMAL' : 'IGNITE OVERCLOCK';
                if (overclockActive) ocBtn.classList.add('active');
                else ocBtn.classList.remove('active');
            }

            const panRegimeEl = document.getElementById('panRegime');
            if (panRegimeEl) {
                const pRegime = data.dragon_vitals.panopticon_regime || 'SEARCHING...';
                const isVeto = data.dragon_vitals.hard_veto || false;
                panRegimeEl.textContent = isVeto ? 'MARKET FRACTURE' : pRegime.toUpperCase();
                panRegimeEl.style.color = isVeto ? 'var(--term-red)' : (pRegime.includes('1.8') || pRegime.includes('Oasis') ? 'var(--term-green)' : 'var(--term-dim)');
            }
        }
        
        // 3. Market Ticker
        updateTerminalField('priceBTC', '$' + data.market_prices.BTC.toLocaleString());
        updateTerminalField('priceSOL', '$' + data.market_prices.SOL.toFixed(2));
        updateTerminalField('priceGOLD', '$' + data.market_prices.GOLD.toLocaleString());
        if (data.market_prices.OIL) {
            updateTerminalField('priceOIL', '$' + data.market_prices.OIL.toFixed(2));
        }
        
        // 4. Intelligence Swarm Matrix
        const swarmGrid = document.getElementById('swarmGrid');
        if (swarmGrid) {
            swarmGrid.innerHTML = '';
            Object.entries(data.swarm_matrix).forEach(([layer, info]) => {
                const card = document.createElement('div');
                card.className = 'terminal-card';
                card.innerHTML = `
                    <div class="card-header">
                        <span>[ LAYER_${layer.toUpperCase()} ]</span>
                        <span class="highlight">${info.score.toFixed(1)}</span>
                    </div>
                    <div class="card-body">> ${info.reasoning}</div>
                `;
                swarmGrid.appendChild(card);
            });
        }

        // 5. STRATEGIC BATTLE PLAN (TARGETS)
        const posGrid = document.getElementById('posGrid');
        if (posGrid && data.tactical_weapons && data.tactical_weapons.positions) {
            posGrid.innerHTML = data.tactical_weapons.positions.map(pos => {
                const rawSymbol = pos.symbol || 'UNKNOWN';
                const isShort = rawSymbol.toLowerCase().includes('_short');
                const displaySymbol = rawSymbol.replace(/_short/gi, '');
                const sideText = isShort ? 'SHORT' : 'LONG';
                const sideColor = isShort ? 'var(--term-red)' : 'var(--term-green)';
                
                return `
                    <div class="pos-card" style="padding: 10px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px; background: rgba(255,255,255,0.02);">
                        <div class="terminal-row" style="margin-bottom: 4px;">
                            <span class="highlight" style="font-size: 0.9rem;">${displaySymbol}</span>
                            <span style="color: ${sideColor}; font-weight: 800; font-size: 0.7rem;">${sideText} ${pos.leverage}x</span>
                        </div>
                        <div class="terminal-row">
                            <span style="font-size: 0.65rem; color: var(--term-dim);">ALLOCATION_WEIGHT:</span>
                            <span class="highlight" style="font-size: 0.7rem;">${pos.weight}%</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 6. LIVE ON-CHAIN AUDIT (REALITY)
        const livePositions = document.getElementById('livePositions');
        if (livePositions && (data.portfolio || data.tactical_weapons)) {
            let positions = data.portfolio.positions || [];
            
            // SOVEREIGN UPGRADE: If no perps, use the tactical armor positions
            if (positions.length === 0 && data.tactical_weapons.positions) {
                positions = data.tactical_weapons.positions;
            }

            if (positions.length === 0) {
                livePositions.innerHTML = '<div class="terminal-row" style="opacity: 0.5;">NO LIVE POSITIONS DETECTED 在链上</div>';
            } else {
                livePositions.innerHTML = positions.map(pos => {
                    const isArmor = pos.side === 'ARMOR';
                    const displaySymbol = (pos.symbol || pos.name || 'UNKNOWN').replace(/_short/gi, '');
                    const valText = pos.usd_value ? `$${pos.usd_value.toFixed(2)}` : `${pos.weight}%`;
                    const statusClass = isArmor ? 'status-ok' : 'status-ok'; // Keep green for both
                    const label = isArmor ? '[ ARMOR ]' : `[ ${pos.side} ]`;
                    
                    return `
                        <div class="terminal-row">
                            <span class="highlight">${displaySymbol} <span style="font-size: 0.5rem; color: var(--term-dim);">${label}</span></span>
                            <span class="${statusClass}">${valText}</span>
                        </div>
                    `;
                }).join('');
            }
        }

        // 7. Sovereign Equity HUD (Core Vitals Extension)
        if (data.portfolio || data.pnl) {
            const nav = (data.pnl ? data.pnl.total_value : data.portfolio.net_asset_value) || 0;
            const pnlPct = (data.portfolio ? data.portfolio.pct_pnl : 0) || 0;
            updateTerminalField('dragonNAV', '$' + nav.toLocaleString(undefined, {minimumFractionDigits: 2}));
            const pnlEl = document.getElementById('dragonPnL');
            if (pnlEl) {
                pnlEl.textContent = `(${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`;
                pnlEl.className = pnlPct >= 0 ? 'status-ok' : 'gate-alert';
            }
        }

        // 8. Armor Allocation (Yield Floor / Cash Hedge)
        const armorAlloc = document.getElementById('armorAlloc');
        if (armorAlloc && data.fortress_armor) {
            const actual = data.fortress_armor.actual_allocations || {};
            const target = data.fortress_armor.target_allocations || {};
            const actualPct = data.fortress_armor.actual_yield_floor || "0%";
            
            armorAlloc.innerHTML = `
                <div class="terminal-row" style="margin-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px;">
                    <span style="font-size: 0.65rem; color: var(--term-dim);">ON_CHAIN_YIELD:</span>
                    <span class="${parseFloat(actualPct) > 0 ? 'status-ok' : 'gate-alert'}" style="font-weight: 800;">${actualPct}</span>
                </div>
            `;
            
            // Show Actuals
            Object.entries(actual).forEach(([tok, pct]) => {
                if (pct > 0.1) {
                    const item = document.createElement('div');
                    item.className = 'terminal-row';
                    const isCash = tok === 'USDC_CASH';
                    item.innerHTML = `
                        <span style="color: ${isCash ? 'var(--term-dim)' : 'var(--term-blue)'}">[ ${tok} ]</span> 
                        <span class="${isCash ? '' : 'highlight'}">${pct.toFixed(1)}%</span>
                    `;
                    armorAlloc.appendChild(item);
                }
            });
            
            // Show Targets if Reality is behind
            if (parseFloat(actualPct) < 1) {
                const targetBox = document.createElement('div');
                targetBox.style.marginTop = '8px';
                targetBox.style.opacity = '0.4';
                targetBox.style.fontSize = '0.6rem';
                targetBox.innerHTML = `> PENDING_TARGET: ${data.fortress_armor.target_yield_floor} sFLP`;
                armorAlloc.appendChild(targetBox);
            }
        }

        // 9. Wizard Narrative Terminal
        const narrativeLog = document.getElementById('narrativeLog');
        if (narrativeLog && narrativeLog.textContent !== data.narrative) {
            narrativeLog.textContent = data.narrative;
        }

        // 10. Self-Evolving Wisdom Terminal
        const evolutionLog = document.getElementById('evolutionLog');
        if (evolutionLog && evolutionLog.textContent !== data.evolution) {
            evolutionLog.textContent = data.evolution || '> Connecting to 12-hour strategic mirror...';
        }
        
        // 11. Sovereign Gate Engine v2.0 (Rings)
        if (data.gate_scores && data.gate_status) {
            updateGateRing('ringG1', 'valG1', data.gate_scores.G1, data.gate_status.liquidity);
            updateGateRing('ringG2', 'valG2', data.gate_scores.G2, data.gate_status.inflation);
            updateGateRing('ringG3', 'valG3', data.gate_scores.G3, data.gate_status.risk);
            if (data.gate_scores.G4 !== undefined) {
                updateGateRing('ringG4', 'valG4', data.gate_scores.G4, data.gate_status.crypto_alpha);
            }
        }

        // 12. Intermarket Correlation Seesaw
        if (data.intermarket_data && data.intermarket_data.correlation_matrix) {
            const corrGrid = document.getElementById('corrGrid');
            if (corrGrid) {
                corrGrid.innerHTML = '';
                Object.entries(data.intermarket_data.correlation_matrix).forEach(([pair, val]) => {
                    const cell = document.createElement('div');
                    cell.className = `corr-cell ${val > 0 ? 'corr-pos' : 'corr-neg'}`;
                    cell.innerHTML = `<span>${pair}</span><br><span class="highlight">${val.toFixed(2)}</span>`;
                    corrGrid.appendChild(cell);
                });
            }
        }
        
        // 12. PnL History Sparkline (Sovereign Memory)
        if (data.portfolio && data.portfolio.history) {
            const sparklineEl = document.getElementById('pnlSparkline');
            if (sparklineEl) {
                const history = data.portfolio.history;
                if (history.length > 1) {
                    const navs = history.map(h => h.nav);
                    const min = Math.min(...navs) * 0.999;
                    const max = Math.max(...navs) * 1.001;
                    const range = max - min;
                    const width = 200;
                    const height = 30;
                    const points = navs.map((n, i) => {
                        const x = (i / (navs.length - 1)) * width;
                        const y = height - ((n - min) / range) * height;
                        return `${x},${y}`;
                    }).join(' ');
                    
                    sparklineEl.innerHTML = `
                        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                            <polyline points="${points}" fill="none" stroke="var(--term-blue)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    `;
                } else {
                    sparklineEl.innerHTML = '<div style="font-size: 0.5rem; text-align: center; line-height: 30px; opacity: 0.3;">INITIALIZING_HISTORY...</div>';
                }
            }
        }
        
        // 13. Institutional Health Telemetry
        if (data.health_telemetry) {
            updateTerminalField('healthKey', data.health_telemetry.keychain);
            updateTerminalField('healthRPC', data.health_telemetry.rpc_latency);
            updateTerminalField('healthSentinel', data.health_telemetry.sentinel);
            updateTerminalField('healthPM2', data.health_telemetry.node_heartbeat);
        }
        
        // 14. System Metadata
        updateTerminalField('lastUpdate', new Date(data.timestamp).toLocaleTimeString());
        
        // Show live system status from backend meta
        const liveStatus = data.meta && data.meta.status ? data.meta.status : 'SYSTEM_SYNCHRONIZED';
        statusEl.textContent = liveStatus;
        statusEl.className = liveStatus === 'LIVE_MAINNET_ACTIVE' ? 'status-pill status-ok' : 'status-pill status-warn';

    } catch (err) {
        console.error('[DRAGON_TERMINAL] Sync Error:', err);
        statusEl.textContent = 'ERROR_SYNC';
        statusEl.className = 'status-pill status-warn';
    }
}

// Initial Kickoff & Persistent Heartbeat
syncTerminal();
setInterval(syncTerminal, 5000); // Institutional 5s polling

/**
 * ⚡ v10.2 Overclock Manual Command
 * Sends a pulse to the Orchestrator's local API (Port 5001)
 */
async function toggleManualOverclock() {
    const ocBtn = document.getElementById('overclock-btn');
    if (!ocBtn) return;

    const currentlyActive = ocBtn.classList.contains('active');
    const endpoint = currentlyActive ? '/normalize' : '/overclock';
    
    try {
        ocBtn.textContent = 'TRANSMITTING...';
        const response = await fetch(`http://localhost:5001${endpoint}`);
        const result = await response.json();
        console.log('[DASHBOARD_API]', result.status);
        // State will sync on the next terminal heartbeat
    } catch (err) {
        console.error('[DASHBOARD_API] Connection Error:', err);
        ocBtn.textContent = 'API_OFFLINE';
        setTimeout(() => {
            ocBtn.textContent = currentlyActive ? 'RESTORE NORMAL' : 'IGNITE OVERCLOCK';
        }, 2000);
    }
}
