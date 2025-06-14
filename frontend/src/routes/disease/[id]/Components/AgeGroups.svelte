<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { reportsAPI, formatNumber, formatPercentage, formatRate, type ReportFilters, type AgeGroupsResponse } from '$lib/reports/api';
  import { CHART_COLORS, CHART_DEFAULTS, UI_TEXT } from '$lib/reports/constants';
  
  Chart.register(...registerables);
  
  export let diseaseId: string;
  export let filters: ReportFilters;
  
  let loading = true;
  let error: string | null = null;
  let data: AgeGroupsResponse['data'] | null = null;
  let chartCanvas: HTMLCanvasElement;
  let chartInstance: Chart | null = null;
  
  $: if (diseaseId && filters) loadData();
  
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
      const response = await reportsAPI.getAgeGroups({ ...filters, diseaseId });
      data = response.data;
      initChart();
    } catch (err) {
      error = err instanceof Error ? err.message : UI_TEXT.ERROR.GENERIC;
    } finally {
      loading = false;
    }
  }
  
  function initChart() {
    if (!data || !chartCanvas) return;
    
    chartInstance?.destroy();
    
    const ctx = chartCanvas.getContext('2d');
    if (!ctx) return;
    
    const ageGroupsWithData = data.ageGroups.filter(g => g.count > 0);
    if (ageGroupsWithData.length === 0) return;
    
    const labels = ageGroupsWithData.map(g => g.ageGroup);
    const counts = ageGroupsWithData.map(g => g.count);
    const colors = ageGroupsWithData.map((_, i) => CHART_COLORS.AGE_GRADIENT[i % CHART_COLORS.AGE_GRADIENT.length]);
    
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'จำนวนผู้ป่วย',
          data: counts,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.8', '1')),
          borderWidth: 1
        }]
      },
      options: {
        ...CHART_DEFAULTS.COMMON,
        ...CHART_DEFAULTS.BAR,
        plugins: {
          ...CHART_DEFAULTS.COMMON.plugins,
          title: {
            display: true,
            text: 'การกระจายตามกลุ่มอายุ',
            font: { size: 16, weight: 'bold' }
          },
          legend: { display: false }
        },
        scales: {
          ...CHART_DEFAULTS.BAR.scales,
          y: {
            ...CHART_DEFAULTS.BAR.scales.y,
            title: { display: true, text: 'จำนวนผู้ป่วย (คน)' }
          },
          x: {
            ...CHART_DEFAULTS.BAR.scales.x,
            title: { display: true, text: 'กลุ่มอายุ' }
          }
        }
      }
    });
  }
  
  // Helper functions
  $: mostAffected = data ? data.ageGroups.filter(g => g.count > 0).reduce((max, g) => g.count > max.count ? g : max, { ageGroup: '', count: 0, percentage: 0, incidenceRate: 0 }) : null;
  $: highestIncidence = data ? data.ageGroups.filter(g => g.count > 0).reduce((max, g) => g.incidenceRate > max.incidenceRate ? g : max, { ageGroup: '', count: 0, percentage: 0, incidenceRate: 0 }) : null;
</script>

<div class="report-card">
  <div class="card-header">
    <h3>📊 การกระจายตามกลุ่มอายุ</h3>
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
      <p>{UI_TEXT.LOADING.AGE_GROUPS}</p>
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
      <div class="summary-card primary">
        <div class="card-value">{formatNumber(data.summary.totalPatients)}</div>
        <div class="card-label">ผู้ป่วยทั้งหมด</div>
      </div>
      <div class="summary-card secondary">
        <div class="card-value">{formatNumber(data.summary.totalPopulation)}</div>
        <div class="card-label">ประชากรทั้งหมด</div>
      </div>
      <div class="summary-card info">
        <div class="card-value">{data.ageGroups.filter(g => g.count > 0).length}</div>
        <div class="card-label">กลุ่มอายุที่พบ</div>
      </div>
    </div>
    
    {#if !data.summary.hasPopulationData}
      <div class="warning-banner">
        <span class="warning-icon">⚠️</span>
        <span>ไม่มีข้อมูลประชากร อัตราต่อแสนประชากรอาจไม่แม่นยำ</span>
      </div>
    {/if}
    
    <!-- Key Insights -->
    <div class="insights-section">
      <h4>💡 ข้อมูลเชิงลึก</h4>
      <div class="insights-grid">
        <div class="insight-item primary">
          <div class="insight-icon">🎯</div>
          <div class="insight-content">
            <div class="insight-label">กลุ่มอายุที่พบมากที่สุด</div>
            <div class="insight-value">
              {mostAffected ? `${mostAffected.ageGroup} (${formatNumber(mostAffected.count)} คน)` : 'ไม่มีข้อมูล'}
            </div>
          </div>
        </div>
        <div class="insight-item secondary">
          <div class="insight-icon">📈</div>
          <div class="insight-content">
            <div class="insight-label">อัตราป่วยสูงสุด</div>
            <div class="insight-value">
              {highestIncidence ? `${highestIncidence.ageGroup} (${formatRate(highestIncidence.incidenceRate)}/แสน)` : 'ไม่มีข้อมูล'}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Chart -->
    {#if data.ageGroups.filter(g => g.count > 0).length > 0}
      <div class="chart-container">
        <canvas bind:this={chartCanvas}></canvas>
      </div>
    {:else}
      <div class="no-chart">
        <div class="no-chart-icon">📊</div>
        <p>ไม่มีข้อมูลกลุ่มอายุสำหรับแสดงกราฟ</p>
      </div>
    {/if}
    
    <!-- Data Table -->
    <div class="data-table-container">
      <div class="table-header">
        <h4>📋 รายละเอียดตามกลุ่มอายุ</h4>
        <span class="table-subtitle">แสดง {data.ageGroups.filter(g => g.count > 0).length} จาก {data.ageGroups.length} กลุ่มอายุ</span>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>กลุ่มอายุ</th>
              <th>จำนวน</th>
              <th>ร้อยละ</th>
              <th>อัตรา/แสนประชากร</th>
              <th>สัดส่วน</th>
            </tr>
          </thead>
          <tbody>
            {#each data.ageGroups.filter(g => g.count > 0) as group, index}
              <tr>
                <td class="age-group-name">{group.ageGroup}</td>
                <td><span class="count-value">{formatNumber(group.count)}</span> คน</td>
                <td class="percentage-value">{formatPercentage(group.percentage)}</td>
                <td class="rate-value">{formatRate(group.incidenceRate)}</td>
                <td class="bar-cell">
                  <div class="percentage-bar">
                    <div 
                      class="percentage-fill" 
                      style="width: {group.percentage}%; background-color: {CHART_COLORS.AGE_GRADIENT[index % CHART_COLORS.AGE_GRADIENT.length]}"
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
      <div class="empty-icon">📊</div>
      <h3>ไม่มีข้อมูลกลุ่มอายุ</h3>
      <p>ไม่พบข้อมูลการกระจายตามกลุ่มอายุในช่วงเวลาที่เลือก</p>
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
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-icon, .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 1rem;
  }
  
  .btn-primary {
    background: #0d7b5f;
    color: white;
  }
  
  .btn-primary:hover {
    background: #0a6b52;
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
  
  .summary-card.primary { background: linear-gradient(135deg, #0d7b5f, #10b981); }
  .summary-card.secondary { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
  .summary-card.info { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
  
  .card-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }
  
  .card-label {
    font-size: 0.875rem;
    opacity: 0.9;
  }
  
  .warning-banner {
    background: #fef3c7;
    border: 1px solid #fbbf24;
    color: #92400e;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
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
  
  .insight-icon {
    font-size: 2rem;
    flex-shrink: 0;
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
  
  .chart-container {
    flex: 1;
    min-height: 300px;
    margin-bottom: 1.5rem;
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
  
  .data-table-container {
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
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  
  .data-table th {
    background: #f9fafb;
    color: #374151;
    font-weight: 600;
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  
  .data-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .data-table tr:hover {
    background: #f9fafb;
  }
  
  .age-group-name { font-weight: 500; color: #374151; }
  .count-value { font-weight: 600; color: #374151; }
  .percentage-value { font-weight: 500; color: #059669; }
  .rate-value { font-weight: 500; color: #3b82f6; }
  
  .bar-cell {
    width: 100px;
    min-width: 100px;
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
    border-radius: 0.25rem;
    transition: width 0.3s ease;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .report-card {
      padding: 1rem;
    }
    
    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .disease-info {
      text-align: left;
    }
    
    .summary-cards {
      grid-template-columns: 1fr;
    }
    
    .insights-grid {
      grid-template-columns: 1fr;
    }
    
    .table-wrapper {
      max-height: 250px;
    }
    
    .data-table th,
    .data-table td {
      padding: 0.5rem;
      font-size: 0.8rem;
    }
    
    .bar-cell {
      width: 80px;
      min-width: 80px;
    }
  }
  
  @media (max-width: 480px) {
    .card-value {
      font-size: 1.25rem;
    }
    
    .chart-container {
      min-height: 250px;
    }
  }
</style>