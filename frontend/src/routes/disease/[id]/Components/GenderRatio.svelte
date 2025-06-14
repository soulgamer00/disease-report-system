<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { reportsAPI, formatNumber, formatPercentage, type ReportFilters, type GenderRatioResponse } from '$lib/reports/api';
  import { CHART_COLORS, CHART_DEFAULTS, UI_TEXT } from '$lib/reports/constants';
  
  Chart.register(...registerables);
  
  export let diseaseId: string;
  export let filters: ReportFilters;
  
  let loading = true;
  let error: string | null = null;
  let data: GenderRatioResponse['data'] | null = null;
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
      const response = await reportsAPI.getGenderRatio({ ...filters, diseaseId });
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
    
    // Prepare chart data - only include categories with values > 0
    const chartData = [];
    const chartLabels = [];
    const chartColors = [];
    
    if (data.summary.male > 0) {
      chartData.push(data.summary.male);
      chartLabels.push('ชาย');
      chartColors.push(CHART_COLORS.MALE);
    }
    
    if (data.summary.female > 0) {
      chartData.push(data.summary.female);
      chartLabels.push('หญิง');
      chartColors.push(CHART_COLORS.FEMALE);
    }
    
    if (data.summary.other > 0) {
      chartData.push(data.summary.other);
      chartLabels.push('อื่นๆ');
      chartColors.push(CHART_COLORS.OTHER);
    }
    
    if (data.summary.notSpecified > 0) {
      chartData.push(data.summary.notSpecified);
      chartLabels.push('ไม่ระบุ');
      chartColors.push(CHART_COLORS.INFO);
    }
    
    if (chartData.length === 0) return;
    
    chartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: chartColors,
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        ...CHART_DEFAULTS.COMMON,
        ...CHART_DEFAULTS.PIE,
        plugins: {
          ...CHART_DEFAULTS.PIE.plugins,
          title: {
            display: true,
            text: 'สัดส่วนตามเพศ',
            font: { size: 16, weight: 'bold' }
          }
        }
      }
    });
  }
  
  function getRatioDisplay(): string {
    if (!data || (data.ratio.male === 0 && data.ratio.female === 0)) {
      return 'ไม่สามารถคำนวณได้';
    }
    
    if (data.ratio.female === 0) {
      return `${data.ratio.male} : 0`;
    }
    
    if (data.ratio.male === 0) {
      return `0 : ${data.ratio.female}`;
    }
    
    return `${data.ratio.male} : ${data.ratio.female}`;
  }
</script>

<div class="report-card">
  <div class="card-header">
    <h3>👥 อัตราส่วนเพศ</h3>
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
      <p>{UI_TEXT.LOADING.GENDER_RATIO}</p>
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
        <div class="card-value">{formatNumber(data.summary.total)}</div>
        <div class="card-label">ผู้ป่วยทั้งหมด</div>
      </div>
      <div class="summary-card ratio">
        <div class="card-value">{getRatioDisplay()}</div>
        <div class="card-label">อัตราส่วน ชาย : หญิง</div>
      </div>
    </div>
    
    {#if !data.summary.hasPopulationData}
      <div class="warning-banner">
        <span class="warning-icon">⚠️</span>
        <span>ไม่มีข้อมูลประชากร อัตราต่อแสนประชากรอาจไม่แม่นยำ</span>
      </div>
    {/if}
    
    <!-- Gender Statistics -->
    <div class="gender-stats">
      {#if data.summary.male > 0}
        <div class="gender-stat male">
          <div class="gender-icon">👨</div>
          <div class="gender-data">
            <div class="gender-count">{formatNumber(data.summary.male)}</div>
            <div class="gender-label">ชาย ({formatPercentage(data.percentages.male)})</div>
          </div>
        </div>
      {/if}
      
      {#if data.summary.female > 0}
        <div class="gender-stat female">
          <div class="gender-icon">👩</div>
          <div class="gender-data">
            <div class="gender-count">{formatNumber(data.summary.female)}</div>
            <div class="gender-label">หญิง ({formatPercentage(data.percentages.female)})</div>
          </div>
        </div>
      {/if}
      
      {#if data.summary.other > 0}
        <div class="gender-stat other">
          <div class="gender-icon">🏳️‍🌈</div>
          <div class="gender-data">
            <div class="gender-count">{formatNumber(data.summary.other)}</div>
            <div class="gender-label">อื่นๆ ({formatPercentage(data.percentages.other)})</div>
          </div>
        </div>
      {/if}
      
      {#if data.summary.notSpecified > 0}
        <div class="gender-stat not-specified">
          <div class="gender-icon">❓</div>
          <div class="gender-data">
            <div class="gender-count">{formatNumber(data.summary.notSpecified)}</div>
            <div class="gender-label">ไม่ระบุ ({formatPercentage(data.percentages.notSpecified)})</div>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Chart Container -->
    <div class="chart-container">
      <canvas bind:this={chartCanvas}></canvas>
    </div>
    
  {:else}
    <div class="empty-state">
      <div class="empty-icon">👥</div>
      <h3>ไม่มีข้อมูลอัตราส่วนเพศ</h3>
      <p>ไม่พบข้อมูลการกระจายตามเพศในช่วงเวลาที่เลือก</p>
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
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .summary-card {
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    color: white;
  }
  
  .summary-card.total {
    background: linear-gradient(135deg, #0d7b5f, #10b981);
  }
  
  .summary-card.ratio {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  }
  
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
  
  .gender-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .gender-stat {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    border: 2px solid;
    background: rgba(255, 255, 255, 0.8);
  }
  
  .gender-stat.male {
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(59, 130, 246, 0.05);
  }
  
  .gender-stat.female {
    border-color: rgba(236, 72, 153, 0.3);
    background: rgba(236, 72, 153, 0.05);
  }
  
  .gender-stat.other {
    border-color: rgba(139, 92, 246, 0.3);
    background: rgba(139, 92, 246, 0.05);
  }
  
  .gender-stat.not-specified {
    border-color: rgba(107, 114, 128, 0.3);
    background: rgba(107, 114, 128, 0.05);
  }
  
  .gender-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }
  
  .gender-data {
    flex: 1;
  }
  
  .gender-count {
    font-size: 1.25rem;
    font-weight: 700;
    color: #374151;
    margin-bottom: 0.25rem;
  }
  
  .gender-label {
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .chart-container {
    flex: 1;
    min-height: 300px;
    position: relative;
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
      grid-template-columns: 1fr;
    }
    
    .gender-stats {
      grid-template-columns: 1fr;
    }
    
    .chart-container {
      min-height: 250px;
    }
  }
</style>