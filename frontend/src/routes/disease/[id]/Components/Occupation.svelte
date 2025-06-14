<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { reportsAPI, formatNumber, formatPercentage, type ReportFilters, type OccupationResponse } from '$lib/reports/api';
  import { CHART_COLORS, CHART_DEFAULTS, UI_TEXT, getColorByIndex } from '$lib/reports/constants';
  import { REPORTS_CONFIG } from '$lib/reports/config';
  
  Chart.register(...registerables);
  
  export let diseaseId: string;
  export let filters: ReportFilters;
  
  let loading = true;
  let error: string | null = null;
  let data: OccupationResponse['data'] | null = null;
  let chartCanvas: HTMLCanvasElement;
  let chartInstance: Chart | null = null;
  let showTop = 10; // Show top 10 occupations by default
  
  $: if (diseaseId && filters) loadData();
  $: displayOccupations = data ? data.occupations.slice(0, showTop) : [];
  
  onMount(() => {
    if (diseaseId && filters) loadData();
  });
  
  onDestroy(() => {
    chartInstance?.destroy();
  });
  
  async function loadData() {
    try {
      loading = true;
      error = null;
      const response = await reportsAPI.getOccupation({ ...filters, diseaseId });
      data = response.data;
      initChart();
    } catch (err) {
      error = err instanceof Error ? err.message : UI_TEXT.ERROR.GENERIC;
    } finally {
      loading = false;
    }
  }
  
  function initChart() {
    if (!data || !chartCanvas || data.occupations.length === 0) return;
    
    chartInstance?.destroy();
    
    const ctx = chartCanvas.getContext('2d');
    if (!ctx) return;
    
    const topOccupations = data.occupations.slice(0, showTop);
    const occupationNames = topOccupations.map(occ => 
      occ.occupation.length > REPORTS_CONFIG.MAX_OCCUPATION_NAME_LENGTH 
        ? occ.occupation.substring(0, REPORTS_CONFIG.MAX_OCCUPATION_NAME_LENGTH) + '...' 
        : occ.occupation
    );
    const occupationCounts = topOccupations.map(occ => occ.count);
    const colors = topOccupations.map((_, index) => getColorByIndex(index));
    
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: occupationNames,
        datasets: [{
          label: 'จำนวนผู้ป่วย',
          data: occupationCounts,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bar chart
        ...CHART_DEFAULTS.COMMON,
        plugins: {
          ...CHART_DEFAULTS.COMMON.plugins,
          title: {
            display: true,
            text: `การกระจายตามอาชีพ (${showTop} อันดับแรก)`,
            font: { size: 16, weight: 'bold' }
          },
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: { display: true, text: 'จำนวนผู้ป่วย (คน)' },
            ticks: { stepSize: 1, font: { family: "'Noto Sans Thai', sans-serif" } }
          },
          y: {
            title: { display: true, text: 'อาชีพ' },
            ticks: { font: { family: "'Noto Sans Thai', sans-serif" } }
          }
        }
      }
    });
  }
  
  function handleShowTopChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    showTop = parseInt(target.value);
    initChart();
  }
  
  // Helper functions
  $: topOccupation = data?.occupations[0] || null;
  $: diversityLevel = data ? (
    data.summary.uniqueOccupations >= 15 ? 'สูง' :
    data.summary.uniqueOccupations >= 8 ? 'ปานกลาง' : 'ต่ำ'
  ) : 'ไม่มีข้อมูล';
  $: secondRankOccupation = data && data.occupations.length >= 2 ? 
    `${data.occupations[1].occupation} (${formatPercentage(data.occupations[1].percentage)})` : 'ไม่มีข้อมูล';
</script>

<div class="report-card">
  <div class="card-header">
    <h3>💼 การกระจายตามอาชีพ</h3>
    {#if data?.disease}
      <div class="disease-info">
        <span class="disease-name">{data.disease.thaiName}</span>
        <span class="disease-code">({data.disease.daName})</span>
      </div>
    {/if}
  </div>
  
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>{UI_TEXT.LOADING.OCCUPATION}</p>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{error}</p>
      <button class="btn btn-primary" on:click={loadData}>ลองใหม่</button>
    </div>
  {:else if data}
    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card total">
        <div class="card-value">{formatNumber(data.summary.totalPatients)}</div>
        <div class="card-label">ผู้ป่วยทั้งหมด</div>
      </div>
      <div class="summary-card unique">
        <div class="card-value">{data.summary.uniqueOccupations}</div>
        <div class="card-label">อาชีพที่พบ</div>
      </div>
      <div class="summary-card top">
        <div class="card-value">{formatNumber(topOccupation?.count || 0)}</div>
        <div class="card-label">อาชีพที่พบมากที่สุด</div>
      </div>
      <div class="summary-card diversity">
        <div class="card-value">{diversityLevel}</div>
        <div class="card-label">ความหลากหลาย</div>
      </div>
    </div>
    
    <!-- Key Insights -->
    <div class="insights-section">
      <h4>💡 ข้อมูลเชิงลึก</h4>
      <div class="insights-grid">
        <div class="insight-item primary">
          <div class="insight-icon">🥇</div>
          <div class="insight-content">
            <div class="insight-label">อาชีพที่พบมากที่สุด</div>
            <div class="insight-value">
              {topOccupation ? `${topOccupation.occupation} (${formatPercentage(topOccupation.percentage)})` : 'ไม่มีข้อมูล'}
            </div>
          </div>
        </div>
        <div class="insight-item secondary">
          <div class="insight-icon">📊</div>
          <div class="insight-content">
            <div class="insight-label">ความหลากหลายอาชีพ</div>
            <div class="insight-value">{data.summary.uniqueOccupations} อาชีพ - ระดับ{diversityLevel}</div>
          </div>
        </div>
        <div class="insight-item tertiary">
          <div class="insight-icon">📈</div>
          <div class="insight-content">
            <div class="insight-label">การกระจายตัว</div>
            <div class="insight-value">อาชีพอันดับ 2: {secondRankOccupation}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Chart and Controls -->
    <div class="chart-section">
      <div class="chart-controls">
        <label for="showTop" class="control-label">แสดงจำนวน:</label>
        <select id="showTop" bind:value={showTop} on:change={handleShowTopChange} class="control-select">
          <option value={5}>5 อันดับแรก</option>
          <option value={10}>10 อันดับแรก</option>
          <option value={15}>15 อันดับแรก</option>
          <option value={20}>20 อันดับแรก</option>
          <option value={data.occupations.length}>ทั้งหมด ({data.occupations.length})</option>
        </select>
      </div>
      
      <div class="chart-container">
        {#if data.occupations.length > 0}
          <canvas bind:this={chartCanvas}></canvas>
        {:else}
          <div class="no-chart">
            <div class="no-chart-icon">📊</div>
            <p>ไม่มีข้อมูลอาชีพสำหรับแสดงกราฟ</p>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Detailed Table -->
    <div class="table-section">
      <div class="table-header">
        <h4>📋 รายละเอียดตามอาชีพ</h4>
        <span class="table-subtitle">แสดง {displayOccupations.length} จาก {data.occupations.length} อาชีพ</span>
      </div>
      <div class="table-wrapper">
        <table class="occupation-table">
          <thead>
            <tr>
              <th>อันดับ</th>
              <th>อาชีพ</th>
              <th>จำนวนผู้ป่วย</th>
              <th>เปอร์เซ็นต์</th>
              <th>สัดส่วน</th>
            </tr>
          </thead>
          <tbody>
            {#each displayOccupations as occupation, index}
              <tr class="occupation-row">
                <td class="rank-cell">
                  <span class="rank-badge rank-{index + 1}">{index + 1}</span>
                </td>
                <td class="occupation-cell">
                  <div class="occupation-name" title={occupation.occupation}>{occupation.occupation}</div>
                </td>
                <td class="count-cell">
                  <span class="count-value">{formatNumber(occupation.count)}</span>
                  <span class="count-unit">คน</span>
                </td>
                <td class="percentage-cell">
                  <span class="percentage-value">{formatPercentage(occupation.percentage)}</span>
                </td>
                <td class="bar-cell">
                  <div class="percentage-bar">
                    <div 
                      class="percentage-fill" 
                      style="width: {occupation.percentage}%; background-color: {getColorByIndex(index)}"
                    ></div>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
    
  {:else}
    <div class="empty-state">
      <div class="empty-icon">💼</div>
      <h3>ไม่มีข้อมูลอาชีพ</h3>
      <p>ไม่พบข้อมูลการกระจายตามอาชีพในช่วงเวลาที่เลือก</p>
    </div>
  {/if}
</div>

<style>
  .report-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .card-header h3 {
    color: #0d7b5f;
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .disease-info {
    text-align: right;
    font-size: 0.9rem;
  }
  
  .disease-name {
    color: #374151;
    font-weight: 500;
  }
  
  .disease-code {
    color: #6b7280;
  }
  
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .summary-card {
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    color: white;
  }
  
  .summary-card.total { background: linear-gradient(135deg, #0d7b5f, #10b981); }
  .summary-card.unique { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
  .summary-card.top { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .summary-card.diversity { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
  
  .card-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }
  
  .card-label {
    font-size: 0.875rem;
    opacity: 0.9;
  }
  
  .insights-section {
    margin-bottom: 1.5rem;
  }
  
  .insights-section h4 {
    margin: 0 0 1rem 0;
    color: #374151;
    font-size: 1.125rem;
  }
  
  .insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .insight-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid;
  }
  
  .insight-item.primary { background: #fef3c7; border-color: #f59e0b; }
  .insight-item.secondary { background: #dbeafe; border-color: #3b82f6; }
  .insight-item.tertiary { background: #e0e7ff; border-color: #8b5cf6; }
  
  .insight-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }
  
  .insight-content {
    flex: 1;
  }
  
  .insight-label {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }
  
  .insight-value {
    font-weight: 600;
    color: #374151;
  }
  
  .chart-section {
    margin-bottom: 1.5rem;
  }
  
  .chart-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .control-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }
  
  .control-select {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
  }
  
  .chart-container {
    min-height: 300px;
    position: relative;
  }
  
  .no-chart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: #6b7280;
    text-align: center;
  }
  
  .no-chart-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  .table-section {
    margin-top: auto;
  }
  
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .table-header h4 {
    margin: 0;
    color: #374151;
    font-size: 1.125rem;
  }
  
  .table-subtitle {
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .table-wrapper {
    overflow-x: auto;
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }
  
  .occupation-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  
  .occupation-table th {
    background: #f9fafb;
    color: #374151;
    font-weight: 600;
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
  }
  
  .occupation-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .occupation-row:hover {
    background: #f9fafb;
  }
  
  .rank-badge {
    display: inline-block;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    text-align: center;
    line-height: 1.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
  }
  
  .rank-badge.rank-1 { background: #f59e0b; }
  .rank-badge.rank-2 { background: #9ca3af; }
  .rank-badge.rank-3 { background: #d97706; }
  .rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) { background: #6b7280; }
  
  .occupation-name {
    font-weight: 500;
    color: #374151;
  }
  
  .count-value {
    font-weight: 600;
    color: #374151;
  }
  
  .count-unit {
    color: #6b7280;
    font-size: 0.8rem;
    margin-left: 0.25rem;
  }
  
  .percentage-value {
    font-weight: 500;
    color: #059669;
  }
  
  .percentage-bar {
    width: 100%;
    height: 0.5rem;
    background: #e5e7eb;
    border-radius: 0.25rem;
    overflow: hidden;
  }
  
  .percentage-fill {
    height: 100%;
    transition: width 0.3s ease;
  }
  
  /* Loading, Error, Empty States */
  .loading-state, .error-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    color: #6b7280;
  }
  
  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #0d7b5f;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-icon, .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 1rem;
  }
  
  .btn-primary {
    background: #0d7b5f;
    color: white;
  }
  
  .btn-primary:hover {
    background: #0a5a44;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .report-card {
      padding: 1rem;
    }
    
    .card-header {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }
    
    .summary-cards {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .insights-grid {
      grid-template-columns: 1fr;
    }
    
    .chart-controls {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .chart-container {
      min-height: 250px;
    }
    
    .table-header {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }
    
    .occupation-table {
      font-size: 0.8rem;
    }
    
    .occupation-table th, .occupation-table td {
      padding: 0.5rem;
    }
  }
</style>