<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { reportsAPI, formatNumber, formatRate, formatPercentage, type ReportFilters, type IncidenceRatesResponse } from '$lib/reports/api';
  import { CHART_COLORS, CHART_DEFAULTS, UI_TEXT } from '$lib/reports/constants';
  import { REPORTS_CONFIG } from '$lib/reports/config';
  
  Chart.register(...registerables);
  
  export let diseaseId: string;
  export let filters: ReportFilters;
  
  let loading = true;
  let error: string | null = null;
  let data: IncidenceRatesResponse['data'] | null = null;
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
      const response = await reportsAPI.getIncidenceRates({ ...filters, diseaseId });
      data = response.data;
      initChart();
    } catch (err) {
      error = err instanceof Error ? err.message : UI_TEXT.ERROR.GENERIC;
    } finally {
      loading = false;
    }
  }
  
  function initChart() {
    if (!data || !chartCanvas || data.hospitals.length === 0) return;
    
    chartInstance?.destroy();
    
    const ctx = chartCanvas.getContext('2d');
    if (!ctx) return;
    
    const hospitalsWithData = data.hospitals.filter(h => h.patients > 0);
    if (hospitalsWithData.length === 0) return;
    
    const hospitalNames = hospitalsWithData.map(h => 
      h.hospitalName.length > REPORTS_CONFIG.MAX_HOSPITAL_NAME_LENGTH 
        ? h.hospitalName.substring(0, REPORTS_CONFIG.MAX_HOSPITAL_NAME_LENGTH) + '...' 
        : h.hospitalName
    );
    const incidenceRates = hospitalsWithData.map(h => h.incidenceRate);
    const mortalityRates = hospitalsWithData.map(h => h.mortalityRate);
    
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: hospitalNames,
        datasets: [
          {
            label: 'อัตราป่วย (ต่อแสนประชากร)',
            data: incidenceRates,
            backgroundColor: CHART_COLORS.PRIMARY,
            borderColor: CHART_COLORS.PRIMARY.replace('0.8', '1'),
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'อัตราตาย (ต่อแสนประชากร)',
            data: mortalityRates,
            backgroundColor: CHART_COLORS.DANGER,
            borderColor: CHART_COLORS.DANGER.replace('0.8', '1'),
            borderWidth: 1,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        ...CHART_DEFAULTS.COMMON,
        plugins: {
          ...CHART_DEFAULTS.COMMON.plugins,
          title: {
            display: true,
            text: 'อัตราการป่วยและตาย แยกตามโรงพยาบาล',
            font: { size: 16, weight: 'bold' }
          },
          legend: { position: 'top' }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            title: { display: true, text: 'อัตราต่อแสนประชากร' },
            ticks: { font: { family: "'Noto Sans Thai', sans-serif" } }
          },
          x: {
            title: { display: true, text: 'โรงพยาบาล' },
            ticks: { font: { family: "'Noto Sans Thai', sans-serif" } }
          }
        }
      }
    });
  }
  
  // Helper functions
  $: highestIncidenceHospital = data ? data.hospitals
    .filter(h => h.patients > 0)
    .reduce((max, hospital) => hospital.incidenceRate > max.incidenceRate ? hospital : max, { hospitalName: '', incidenceRate: 0 }) : null;
    
  $: severityLevel = data ? 
    data.summary.caseFatalityRate === 0 ? 'ไม่มีการเสียชีวิต' :
    data.summary.caseFatalityRate < 1 ? 'ต่ำ' :
    data.summary.caseFatalityRate < 5 ? 'ปานกลาง' : 'สูง' : 'ไม่มีข้อมูล';
</script>

<div class="report-card">
  <div class="card-header">
    <h3>⚕️ อัตราการป่วยและตาย</h3>
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
      <p>{UI_TEXT.LOADING.INCIDENCE_RATES}</p>
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
      <div class="summary-card incidence">
        <div class="card-value">{formatRate(data.summary.incidenceRate)}</div>
        <div class="card-label">อัตราป่วย/แสนประชากร</div>
      </div>
      <div class="summary-card mortality">
        <div class="card-value">{formatRate(data.summary.mortalityRate)}</div>
        <div class="card-label">อัตราตาย/แสนประชากร</div>
      </div>
      <div class="summary-card fatality">
        <div class="card-value">{formatPercentage(data.summary.caseFatalityRate)}</div>
        <div class="card-label">อัตราป่วยตาย</div>
      </div>
    </div>
    
    <!-- Key Insights -->
    <div class="insights-section">
      <h4>💡 ข้อมูลเชิงลึก</h4>
      <div class="insights-grid">
        <div class="insight-item primary">
          <div class="insight-icon">🏥</div>
          <div class="insight-content">
            <div class="insight-label">โรงพยาบาลที่มีอัตราป่วยสูงสุด</div>
            <div class="insight-value">
              {highestIncidenceHospital?.hospitalName ? 
                `${highestIncidenceHospital.hospitalName} (${formatRate(highestIncidenceHospital.incidenceRate)}/แสน)` : 
                'ไม่มีข้อมูล'}
            </div>
          </div>
        </div>
        <div class="insight-item secondary">
          <div class="insight-icon">💔</div>
          <div class="insight-content">
            <div class="insight-label">ผู้เสียชีวิต</div>
            <div class="insight-value">{formatNumber(data.summary.deaths)} คน</div>
          </div>
        </div>
        <div class="insight-item tertiary">
          <div class="insight-icon">📊</div>
          <div class="insight-content">
            <div class="insight-label">ระดับความรุนแรง</div>
            <div class="insight-value">{severityLevel} ({formatPercentage(data.summary.caseFatalityRate)})</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Chart Container -->
    {#if data.hospitals.filter(h => h.patients > 0).length > 0}
      <div class="chart-container">
        <canvas bind:this={chartCanvas}></canvas>
      </div>
    {:else}
      <div class="no-chart">
        <div class="no-chart-icon">📊</div>
        <p>ไม่มีข้อมูลโรงพยาบาลสำหรับแสดงกราฟ</p>
      </div>
    {/if}
    
    <!-- Detailed Table -->
    <div class="table-section">
      <div class="table-header">
        <h4>🏥 รายละเอียดตามโรงพยาบาล</h4>
        <span class="table-subtitle">แสดง {data.hospitals.filter(h => h.patients > 0).length} จาก {data.hospitals.length} โรงพยาบาล</span>
      </div>
      <div class="table-wrapper">
        <table class="hospitals-table">
          <thead>
            <tr>
              <th>โรงพยาบาล</th>
              <th>ประชากร</th>
              <th>ผู้ป่วย</th>
              <th>เสียชีวิต</th>
              <th>อัตราป่วย/แสน</th>
              <th>อัตราตาย/แสน</th>
              <th>อัตราป่วยตาย</th>
            </tr>
          </thead>
          <tbody>
            {#each data.hospitals.filter(h => h.patients > 0) as hospital}
              <tr class="hospital-row">
                <td class="hospital-name-cell">
                  <div class="hospital-name" title={hospital.hospitalName}>{hospital.hospitalName}</div>
                  <div class="hospital-code">{hospital.hospitalCode}</div>
                </td>
                <td class="population-cell">
                  {#if hospital.population > 0}
                    <span class="population-value">{formatNumber(hospital.population)}</span>
                  {:else}
                    <span class="no-data">ไม่มีข้อมูล</span>
                  {/if}
                </td>
                <td class="patients-cell">
                  <span class="patients-value">{formatNumber(hospital.patients)}</span>
                </td>
                <td class="deaths-cell">
                  <span class="deaths-value">{formatNumber(hospital.deaths)}</span>
                </td>
                <td class="rate-cell">
                  <span class="incidence-rate">{formatRate(hospital.incidenceRate)}</span>
                </td>
                <td class="rate-cell">
                  <span class="mortality-rate">{formatRate(hospital.mortalityRate)}</span>
                </td>
                <td class="rate-cell">
                  <span class="fatality-rate">{formatPercentage(hospital.caseFatalityRate)}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
    
    {#if data.summary.totalPopulation === 0}
      <div class="warning-banner">
        <span class="warning-icon">⚠️</span>
        <span>ไม่มีข้อมูลประชากร อัตราต่อแสนประชากรอาจไม่แม่นยำ</span>
      </div>
    {/if}
    
  {:else}
    <div class="empty-state">
      <div class="empty-icon">⚕️</div>
      <h3>ไม่มีข้อมูลอัตราการป่วยและตาย</h3>
      <p>ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
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
  .summary-card.incidence { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
  .summary-card.mortality { background: linear-gradient(135deg, #ef4444, #dc2626); }
  .summary-card.fatality { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
  
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
  
  .hospitals-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  
  .hospitals-table th {
    background: #f9fafb;
    color: #374151;
    font-weight: 600;
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
  }
  
  .hospitals-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .hospital-row:hover {
    background: #f9fafb;
  }
  
  .hospital-name {
    font-weight: 500;
    color: #374151;
  }
  
  .hospital-code {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .population-value, .patients-value, .deaths-value {
    font-weight: 600;
    color: #374151;
  }
  
  .no-data {
    color: #9ca3af;
    font-style: italic;
  }
  
  .incidence-rate {
    font-weight: 500;
    color: #3b82f6;
  }
  
  .mortality-rate {
    font-weight: 500;
    color: #ef4444;
  }
  
  .fatality-rate {
    font-weight: 500;
    color: #8b5cf6;
  }
  
  .warning-banner {
    background: #fef3c7;
    border: 1px solid #fbbf24;
    color: #92400e;
    padding: 0.75rem;
    border-radius: 6px;
    margin-top: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
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
    
    .chart-container {
      min-height: 250px;
    }
    
    .table-header {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }
    
    .hospitals-table {
      font-size: 0.8rem;
    }
    
    .hospitals-table th, .hospitals-table td {
      padding: 0.5rem;
    }
  }
</style>