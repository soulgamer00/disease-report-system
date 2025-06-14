<!-- src/routes/disease/[id]/+page.svelte -->
<!-- 📊 Disease Report Dashboard with Correct Logic -->

<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    publicApi, 
    type Disease, 
    type ReportFilters, 
    type PopulationStats,
    type AgeGroupsReport,
    type GenderRatioReport,
    type IncidenceRatesReport,
    type OccupationReport,
    handleApiError 
  } from '$lib/services/api';
  
  // Chart.js imports
  import Chart from 'chart.js/auto';

  // ========== STATE MANAGEMENT ==========
  let disease: Disease | null = null;
  let populationData: PopulationStats | null = null;
  let isLoading = true;
  let error: string | null = null;
  let reportError: string | null = null;

  // Report data state
  let ageGroupsData: AgeGroupsReport | null = null;
  let genderRatioData: GenderRatioReport | null = null;
  let incidenceRatesData: IncidenceRatesReport | null = null;
  let occupationData: OccupationReport | null = null;
  let reportsLoading = false;

  // Chart instances
  let ageGroupsChart: Chart | null = null;
  let genderChart: Chart | null = null;
  let incidenceChart: Chart | null = null;
  let occupationChart: Chart | null = null;
  
  // Chart elements
  let ageGroupsChartElement: HTMLCanvasElement;
  let genderChartElement: HTMLCanvasElement;
  let incidenceChartElement: HTMLCanvasElement;
  let occupationChartElement: HTMLCanvasElement;

  // Dynamic filter options
  let availableYears: string[] = [];
  let availableHospitals: Array<{value: string; label: string}> = [];

  // ✅ ตรรกะที่ถูกต้อง: Default = ปีปัจจุบัน + ทั้งหมด
  let filters: ReportFilters = {
    diseaseId: '',
    year: new Date().getFullYear().toString(), // ปีปัจจุบัน
    hospital: 'all',
    gender: 'all',
    ageGroup: 'all',
    occupation: 'all'
  };

  // ========== REACTIVE STATEMENTS ==========
  $: diseaseId = $page.params.id;
  $: if (diseaseId) {
    filters.diseaseId = diseaseId;
    loadPageData();
  }

  // ✅ คำนวณ Population และ Incidence Rate ที่ถูกต้องตาม Filter
  $: currentPopulation = calculateCurrentPopulation(filters);
  $: currentIncidenceRate = calculateCurrentIncidenceRate();

  // ========== CHART CONFIGURATION ==========
  const chartColors = {
    primary: '#0d7b5f',
    secondary: '#10b981',
    accent: '#3b82f6',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    success: '#22c55e',
    purple: '#8b5cf6',
    pink: '#ec4899',
    indigo: '#6366f1'
  };

  const gradientColors = [
    'rgba(13, 123, 95, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(6, 182, 212, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(99, 102, 241, 0.8)'
  ];

  // ========== CALCULATION FUNCTIONS (ตรรกะที่ถูกต้อง) ==========
  
  function calculateCurrentPopulation(filters: ReportFilters): number {
    if (!populationData) return 0;
    
    const selectedYear = parseInt(filters.year);
    
    if (filters.hospital === 'all') {
      // กรณีเลือก "ทั้งหมด" = ประชากรทั้งหมดของปีที่เลือก
      if (selectedYear === populationData.currentYear) {
        return populationData.totalCurrentPopulation;
      } else {
        // หาประชากรรวมของปีที่เลือกจาก hospitalBreakdown
        return populationData.hospitalBreakdown
          .filter(h => h.year === selectedYear)
          .reduce((sum, h) => sum + h.population, 0);
      }
    } else {
      // กรณีเลือกรพ.เฉพาะ = ประชากรของรพ.นั้นในปีที่เลือก
      const hospital = populationData.hospitalBreakdown
        .find(h => h.hospitalCode === filters.hospital && h.year === selectedYear);
      return hospital ? hospital.population : 0;
    }
  }

  function calculateCurrentIncidenceRate(): number {
    if (!ageGroupsData || currentPopulation === 0) return 0;
    
    // ใช้ข้อมูลผู้ป่วยที่ filter แล้วจาก ageGroupsData
    const totalPatients = ageGroupsData.summary.totalPatients;
    return publicApi.utils.calculateIncidenceRate(totalPatients, currentPopulation);
  }

  function getCurrentScope(): string {
    if (filters.hospital === 'all') {
      return `ทั้งหมด ปี ${filters.year}`;
    } else {
      const hospital = availableHospitals.find(h => h.value === filters.hospital);
      return `${hospital?.label || 'รพ.ที่เลือก'} ปี ${filters.year}`;
    }
  }

  function getPopulationDisplay(): string {
    const scope = getCurrentScope();
    return `ประชากร${scope}: ${formatNumber(currentPopulation)} คน`;
  }

  // ========== DATA LOADING FUNCTIONS ==========
  
  async function loadDiseaseInfo(): Promise<void> {
    if (!diseaseId) {
      throw new Error('ไม่พบรหัสโรค');
    }

    console.log(`🦠 Loading disease info for ID: ${diseaseId}`);
    
    const response = await publicApi.disease(diseaseId);
    
    if (!response.success) {
      throw new Error(response.message || 'ไม่พบข้อมูลโรค');
    }
    
    disease = response.data;
    console.log('✅ Disease loaded:', disease);
  }

  async function loadPopulationData(): Promise<void> {
    try {
      console.log('👥 Loading population data...');
      
      const response = await publicApi.populationStats();
      
      if (!response.success) {
        throw new Error(response.message || 'ไม่สามารถโหลดข้อมูลประชากรได้');
      }
      
      populationData = response.data;
      console.log('✅ Population data loaded:', populationData);
      
      // ✅ Update available years from actual population data
      if (populationData.availableYears.length > 0) {
        // เรียงปีจากมากไปน้อย และใส่ "ทั้งหมด" ด้านหน้า
        const sortedYears = [...populationData.availableYears].sort((a, b) => b - a);
        availableYears = ['all', ...sortedYears.map(y => y.toString())];
      }
      
    } catch (err) {
      console.warn('⚠️ Failed to load population data:', err);
      // Continue without population data
      availableYears = ['all', new Date().getFullYear().toString()];
    }
  }

  async function loadFilterOptions(): Promise<void> {
    try {
      console.log('🔧 Loading filter options...');
      
      const hospitals = await publicApi.hospitals();
      
      if (hospitals.success) {
        availableHospitals = [
          { value: 'all', label: 'ทั้งหมด' },
          ...hospitals.data.map(h => ({
            value: h.value || h.code || '',
            label: h.label || 'ไม่ระบุชื่อ'
          }))
        ];
      }
      
      console.log('✅ Filter options loaded');
    } catch (err) {
      console.warn('⚠️ Failed to load filter options:', err);
    }
  }

  async function loadReportsData(): Promise<void> {
    if (!diseaseId) return;
    
    try {
      reportsLoading = true;
      reportError = null;
      
      console.log('📊 Loading reports with filters:', filters);
      
      const reports = await publicApi.reports.all(filters);
      
      if (!reports.ageGroups.success) throw new Error(`Age Groups: ${reports.ageGroups.message}`);
      if (!reports.genderRatio.success) throw new Error(`Gender Ratio: ${reports.genderRatio.message}`);
      if (!reports.incidenceRates.success) throw new Error(`Incidence Rates: ${reports.incidenceRates.message}`);
      if (!reports.occupation.success) throw new Error(`Occupation: ${reports.occupation.message}`);
      
      ageGroupsData = reports.ageGroups.data;
      genderRatioData = reports.genderRatio.data;
      incidenceRatesData = reports.incidenceRates.data;
      occupationData = reports.occupation.data;
      
      console.log('✅ All reports loaded successfully');
      
      // Create charts after data is loaded
      setTimeout(() => {
        createCharts();
      }, 100);
      
    } catch (err) {
      console.error('❌ Failed to load reports:', err);
      reportError = handleApiError(err);
    } finally {
      reportsLoading = false;
    }
  }

  // ========== CHART CREATION ==========
  function createCharts(): void {
    try {
      destroyCharts();
      
      if (ageGroupsData && ageGroupsChartElement) {
        createAgeGroupsChart();
      }
      
      if (genderRatioData && genderChartElement) {
        createGenderChart();
      }
      
      if (incidenceRatesData && incidenceChartElement) {
        createIncidenceChart();
      }
      
      if (occupationData && occupationChartElement) {
        createOccupationChart();
      }
    } catch (error) {
      console.error('Error creating charts:', error);
    }
  }

  function createAgeGroupsChart(): void {
    const ctx = ageGroupsChartElement.getContext('2d');
    if (!ctx || !ageGroupsData) return;

    const validGroups = ageGroupsData.ageGroups.filter(g => g.count > 0);
    
    ageGroupsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: validGroups.map(g => g.ageGroup),
        datasets: [{
          label: 'จำนวนผู้ป่วย',
          data: validGroups.map(g => g.count),
          backgroundColor: validGroups.map((_, i) => gradientColors[i % gradientColors.length]),
          borderColor: chartColors.primary,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `การกระจายตามกลุ่มอายุ - ${getCurrentScope()}`,
            font: { size: 16, weight: 'bold' }
          },
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: chartColors.primary,
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                const total = validGroups.reduce((sum, g) => sum + g.count, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                const group = validGroups[context.dataIndex];
                return [
                  `จำนวน: ${value.toLocaleString()} คน (${percentage}%)`,
                  `อัตราป่วย: ${group.incidenceRate.toFixed(2)}/แสน`
                ];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'จำนวนผู้ป่วย (คน)'
            },
            ticks: {
              callback: function(value) {
                return parseInt(value as string).toLocaleString() + ' คน';
              }
            }
          },
          x: {
            title: {
              display: true,
              text: 'กลุ่มอายุ'
            }
          }
        }
      }
    });
  }

  function createGenderChart(): void {
    const ctx = genderChartElement.getContext('2d');
    if (!ctx || !genderRatioData) return;

    const genderData = [
      { label: 'ชาย', value: genderRatioData.summary.male, color: chartColors.primary },
      { label: 'หญิง', value: genderRatioData.summary.female, color: chartColors.secondary },
      ...(genderRatioData.summary.other > 0 ? 
        [{ label: 'อื่นๆ', value: genderRatioData.summary.other, color: chartColors.accent }] : [])
    ].filter(g => g.value > 0);

    genderChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: genderData.map(g => g.label),
        datasets: [{
          data: genderData.map(g => g.value),
          backgroundColor: genderData.map(g => g.color),
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `อัตราส่วนเพศ - ${getCurrentScope()}`,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: { size: 14 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            callbacks: {
              label: function(context) {
                const value = context.parsed;
                const total = genderRatioData!.summary.total;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value.toLocaleString()} คน (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  function createIncidenceChart(): void {
    const ctx = incidenceChartElement.getContext('2d');
    if (!ctx || !incidenceRatesData) return;

    // ✅ แสดงเฉพาะโรงพยาบาลที่มีผู้ป่วย และเรียงตาม incidence rate
    const validHospitals = incidenceRatesData.hospitals
      .filter(h => h.patients > 0)
      .sort((a, b) => b.incidenceRate - a.incidenceRate)
      .slice(0, 10); // แสดง top 10

    incidenceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: validHospitals.map(h => h.hospitalName.length > 15 ? 
          h.hospitalName.substring(0, 15) + '...' : h.hospitalName),
        datasets: [
          {
            label: 'จำนวนผู้ป่วย',
            data: validHospitals.map(h => h.patients),
            backgroundColor: chartColors.primary,
            borderColor: chartColors.primary,
            borderWidth: 3,
            tension: 0.4,
            fill: false,
            pointBackgroundColor: chartColors.primary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            yAxisID: 'y'
          },
          {
            label: 'อัตราป่วย/แสนประชากร',
            data: validHospitals.map(h => h.incidenceRate),
            backgroundColor: chartColors.warning,
            borderColor: chartColors.warning,
            borderWidth: 3,
            tension: 0.4,
            fill: false,
            pointBackgroundColor: chartColors.warning,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          title: {
            display: true,
            text: `อัตราการป่วยตามโรงพยาบาล - ${filters.year}`,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top',
            labels: { usePointStyle: true, padding: 20 }
          }
        },
        scales: {
          x: { 
            grid: { display: false },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'จำนวนผู้ป่วย' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'อัตราป่วย/แสน' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  function createOccupationChart(): void {
    const ctx = occupationChartElement.getContext('2d');
    if (!ctx || !occupationData) return;

    const topOccupations = occupationData.occupations.slice(0, 8);

    occupationChart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: topOccupations.map(o => o.occupation),
        datasets: [{
          data: topOccupations.map(o => o.count),
          backgroundColor: topOccupations.map((_, i) => gradientColors[i % gradientColors.length]),
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `การกระจายตามอาชีพ - ${getCurrentScope()}`,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'bottom',
            labels: { padding: 15, usePointStyle: true, font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed.r;
                const total = occupationData!.summary.totalPatients;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value.toLocaleString()} คน (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: { display: false },
            grid: { color: 'rgba(0, 0, 0, 0.1)' }
          }
        }
      }
    });
  }

  function destroyCharts(): void {
    [ageGroupsChart, genderChart, incidenceChart, occupationChart].forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    ageGroupsChart = genderChart = incidenceChart = occupationChart = null;
  }

  // ========== MAIN PAGE LOADER ==========
  async function loadPageData(): Promise<void> {
    try {
      isLoading = true;
      error = null;
      
      console.log(`🚀 Loading disease page for ID: ${diseaseId}`);
      
      await Promise.all([
        loadDiseaseInfo(),
        loadPopulationData(),
        loadFilterOptions()
      ]);
      
      await loadReportsData();
      
    } catch (err) {
      console.error('❌ Page load error:', err);
      error = handleApiError(err);
    } finally {
      isLoading = false;
    }
  }

  // ========== EVENT HANDLERS ==========
  async function handleFilterChange(): Promise<void> {
    console.log('🔄 Filters changed:', filters);
    console.log('🧮 Current population:', currentPopulation);
    console.log('📊 Current incidence rate:', currentIncidenceRate);
    await loadReportsData();
  }

  function goBack(): void {
    goto('/');
  }

  function goToLogin(): void {
    goto('/login');
  }

  // ========== LIFECYCLE ==========
  onMount(() => {
    if (diseaseId) {
      loadPageData();
    } else {
      error = 'ไม่พบรหัสโรคในลิงค์';
      isLoading = false;
    }
  });

  afterUpdate(() => {
    if (!reportsLoading && ageGroupsData && genderRatioData && incidenceRatesData && occupationData) {
      setTimeout(createCharts, 50);
    }
  });

  // ========== UTILITY FUNCTIONS ==========
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getDiseaseIcon(disease: Disease): string {
    return disease.imageUrl || '🦠';
  }

  function formatNumber(num: number): string {
    return num.toLocaleString('th-TH');
  }
</script>

<svelte:head>
  <title>
    {disease ? `${disease.thaiName} - รายงานโรค` : 'กำลังโหลด...'} | ระบบเฝ้าระวังโรค
  </title>
</svelte:head>

<div class="disease-page">
  <!-- Navigation -->
  <nav class="nav-bar">
    <button class="back-btn" on:click={goBack}>
      ← กลับหน้าหลัก
    </button>
    
    <div class="nav-title">
      {#if disease}
        <span class="disease-nav-name">{disease.thaiName}</span>
      {:else}
        <span class="loading-text">กำลังโหลด...</span>
      {/if}
    </div>
    
    <button class="login-btn" on:click={goToLogin}>
      🔐 เข้าสู่ระบบ
    </button>
  </nav>

  <div class="container">
    {#if isLoading}
      <!-- Loading State -->
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-content">
          <h3>กำลังโหลดข้อมูลโรค...</h3>
          <p>กรุณารอสักครู่</p>
        </div>
      </div>
      
    {:else if error}
      <!-- Error State -->
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-content">
          <h2>เกิดข้อผิดพลาด</h2>
          <p class="error-message">{error}</p>
          <div class="error-actions">
            <button class="btn btn-primary" on:click={goBack}>
              กลับหน้าหลัก
            </button>
            <button class="btn btn-secondary" on:click={() => window.location.reload()}>
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
      
    {:else if disease}
      <!-- Disease Information -->
      <div class="disease-info">
        <div class="disease-header">
          <div class="disease-icon">{getDiseaseIcon(disease)}</div>
          <div class="disease-details">
            <h1 class="disease-title">{disease.thaiName}</h1>
            <p class="disease-subtitle">{disease.engName || ''}</p>
            <div class="disease-meta">
              <span class="disease-code">รหัสโรค: {disease.daName || disease.id}</span>
              <span class="disease-id">ID: {disease.id}</span>
            </div>
          </div>
        </div>
        
        {#if disease.details}
          <div class="disease-description">
            <h3>รายละเอียดโรค</h3>
            <p>{disease.details}</p>
          </div>
        {/if}
        
        <!-- ✅ Population Summary ที่ถูกต้องตาม Filter -->
        {#if populationData}
          <div class="population-summary">
            <div class="population-card">
              <div class="population-header">
                <h4>📊 ข้อมูลประชากรปัจจุบัน</h4>
              </div>
              <div class="population-content">
                <div class="population-stat highlight">
                  <span class="stat-label">{getPopulationDisplay()}</span>
                </div>
                <div class="population-stat">
                  <span class="stat-label">ขอบเขต:</span>
                  <span class="stat-value">{getCurrentScope()}</span>
                </div>
                {#if ageGroupsData}
                  <div class="population-stat highlight">
                    <span class="stat-label">อัตราป่วย:</span>
                    <span class="stat-value">{currentIncidenceRate.toFixed(2)} ต่อแสนประชากร</span>
                  </div>
                  <div class="population-stat">
                    <span class="stat-label">ผู้ป่วยทั้งหมด:</span>
                    <span class="stat-value">{formatNumber(ageGroupsData.summary.totalPatients)} คน</span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}
        
        <div class="disease-metadata">
          <div class="meta-grid">
            <div class="meta-item">
              <strong>สร้างเมื่อ:</strong> 
              <span>{formatDate(disease.createdAt)}</span>
            </div>
            <div class="meta-item">
              <strong>อัปเดตล่าสุด:</strong> 
              <span>{formatDate(disease.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Filters Section -->
      <div class="filters-section">
        <div class="filters-header">
          <h3>🔍 ตัวกรองข้อมูล</h3>
          <div class="current-scope">
            <span class="scope-label">ขอบเขตปัจจุบัน:</span>
            <span class="scope-value">{getCurrentScope()}</span>
          </div>
        </div>
        
        <div class="filters-grid">
          <div class="filter-group">
            <label for="year-filter">📅 ปี</label>
            <select 
              id="year-filter" 
              bind:value={filters.year} 
              on:change={handleFilterChange}
              class="filter-select"
            >
              {#each availableYears as year}
                <option value={year}>
                  {year === 'all' ? 'ทั้งหมด' : `ปี ${year}`}
                </option>
              {/each}
            </select>
          </div>
          
          <div class="filter-group">
            <label for="hospital-filter">🏥 โรงพยาบาล</label>
            <select 
              id="hospital-filter" 
              bind:value={filters.hospital} 
              on:change={handleFilterChange}
              class="filter-select"
            >
              {#each availableHospitals as hospital}
                <option value={hospital.value}>{hospital.label}</option>
              {/each}
            </select>
          </div>
          
          <div class="filter-group">
            <label for="gender-filter">👥 เพศ</label>
            <select 
              id="gender-filter" 
              bind:value={filters.gender} 
              on:change={handleFilterChange}
              class="filter-select"
            >
              <option value="all">ทั้งหมด</option>
              <option value="ชาย">ชาย</option>
              <option value="หญิง">หญิง</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Reports Section with Charts -->
      <div class="reports-section">
        <div class="reports-header">
          <h2 class="reports-title">📊 รายงานและสถิติ</h2>
          <div class="reports-subtitle">
            ข้อมูลสำหรับ: <strong>{disease.thaiName}</strong> - <span class="scope-text">{getCurrentScope()}</span>
          </div>
        </div>
        
        {#if reportsLoading}
          <div class="reports-loading">
            <div class="loading-spinner small"></div>
            <span>กำลังโหลดรายงาน...</span>
          </div>
          
        {:else if reportError}
          <div class="reports-error">
            <div class="error-icon">⚠️</div>
            <p>{reportError}</p>
            <button class="btn btn-primary" on:click={loadReportsData}>
              ลองใหม่
            </button>
          </div>
          
        {:else}
          <!-- Charts Grid -->
          <div class="charts-grid">
            <!-- Age Groups Chart -->
            {#if ageGroupsData}
              <div class="chart-card">
                <div class="chart-header">
                  <h4>📊 การกระจายตามกลุ่มอายุ</h4>
                  <div class="chart-summary">
                    <span class="summary-stat">
                      <strong>{ageGroupsData.summary.totalPatients.toLocaleString()}</strong> ผู้ป่วย
                    </span>
                    <span class="summary-stat">
                      อัตราป่วย: <strong>{currentIncidenceRate.toFixed(2)}</strong>/แสน
                    </span>
                  </div>
                </div>
                <div class="chart-container">
                  <canvas bind:this={ageGroupsChartElement}></canvas>
                </div>
                <div class="chart-insights">
                  {#if ageGroupsData.ageGroups.length > 0}
                    {@const topGroup = ageGroupsData.ageGroups.reduce((max, g) => g.count > max.count ? g : max)}
                    <div class="insight-item">
                      <span class="insight-icon">🎯</span>
                      <span class="insight-text">
                        กลุ่มที่พบมากที่สุด: <strong>{topGroup.ageGroup}</strong> 
                        ({topGroup.count.toLocaleString()} คน, {topGroup.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
            
            <!-- Gender Ratio Chart -->
            {#if genderRatioData}
              <div class="chart-card">
                <div class="chart-header">
                  <h4>👥 อัตราส่วนเพศ</h4>
                  <div class="chart-summary">
                    <span class="summary-stat">
                      อัตราส่วน <strong>{genderRatioData.ratio.male.toFixed(1)}:{genderRatioData.ratio.female.toFixed(1)}</strong>
                    </span>
                  </div>
                </div>
                <div class="chart-container">
                  <canvas bind:this={genderChartElement}></canvas>
                </div>
                <div class="gender-stats-summary">
                  <div class="gender-stat-item">
                    <span class="gender-label male">ชาย</span>
                    <span class="gender-value">{genderRatioData.summary.male.toLocaleString()} คน</span>
                    <span class="gender-percent">({genderRatioData.percentages.male.toFixed(1)}%)</span>
                  </div>
                  <div class="gender-stat-item">
                    <span class="gender-label female">หญิง</span>
                    <span class="gender-value">{genderRatioData.summary.female.toLocaleString()} คน</span>
                    <span class="gender-percent">({genderRatioData.percentages.female.toFixed(1)}%)</span>
                  </div>
                  {#if genderRatioData.summary.other > 0}
                    <div class="gender-stat-item">
                      <span class="gender-label other">อื่นๆ</span>
                      <span class="gender-value">{genderRatioData.summary.other.toLocaleString()} คน</span>
                      <span class="gender-percent">({genderRatioData.percentages.other.toFixed(1)}%)</span>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
            
            <!-- Incidence Rates Chart -->
            {#if incidenceRatesData}
              <div class="chart-card wide">
                <div class="chart-header">
                  <h4>⚕️ อัตราการป่วยตามโรงพยาบาล</h4>
                  <div class="chart-summary">
                    <span class="summary-stat">
                      อัตราเฉลี่ย <strong>{incidenceRatesData.summary.incidenceRate.toFixed(2)}</strong>/แสน
                    </span>
                    <span class="summary-stat">
                      ผู้เสียชีวิต <strong>{incidenceRatesData.summary.deaths.toLocaleString()}</strong> คน
                    </span>
                    <span class="summary-stat">
                      CFR <strong>{incidenceRatesData.summary.caseFatalityRate.toFixed(2)}</strong>%
                    </span>
                  </div>
                </div>
                <div class="chart-container">
                  <canvas bind:this={incidenceChartElement}></canvas>
                </div>
                <div class="chart-insights">
                  {#if incidenceRatesData.hospitals.length > 0}
                    {@const topHospital = incidenceRatesData.hospitals.reduce((max, h) => h.incidenceRate > max.incidenceRate ? h : max)}
                    <div class="insight-item">
                      <span class="insight-icon">🏥</span>
                      <span class="insight-text">
                        อัตราป่วยสูงสุด: <strong>{topHospital.hospitalName}</strong> 
                        ({topHospital.incidenceRate.toFixed(2)}/แสน)
                      </span>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
            
            <!-- Occupation Chart -->
            {#if occupationData}
              <div class="chart-card">
                <div class="chart-header">
                  <h4>💼 การกระจายตามอาชีพ</h4>
                  <div class="chart-summary">
                    <span class="summary-stat">
                      <strong>{occupationData.summary.uniqueOccupations}</strong> อาชีพ
                    </span>
                  </div>
                </div>
                <div class="chart-container">
                  <canvas bind:this={occupationChartElement}></canvas>
                </div>
                <div class="occupation-top-list">
                  <h5>อาชีพที่พบมากที่สุด:</h5>
                  <div class="top-occupations">
                    {#each occupationData.occupations.slice(0, 3) as occupation, index}
                      <div class="occupation-item">
                        <span class="rank">#{index + 1}</span>
                        <span class="occupation-name">{occupation.occupation}</span>
                        <span class="occupation-count">{occupation.count.toLocaleString()} คน ({occupation.percentage.toFixed(1)}%)</span>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .disease-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  }

  .nav-bar {
    background: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .back-btn, .login-btn {
    padding: 0.5rem 1rem;
    border: 2px solid #0d7b5f;
    border-radius: 8px;
    background: transparent;
    color: #0d7b5f;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .back-btn:hover, .login-btn:hover {
    background: #0d7b5f;
    color: white;
  }

  .nav-title {
    flex: 1;
    text-align: center;
  }

  .disease-nav-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: #0d7b5f;
  }

  .loading-text {
    color: #64748b;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  .loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .loading-spinner {
    width: 3rem;
    height: 3rem;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #0d7b5f;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .loading-spinner.small {
    width: 1.5rem;
    height: 1.5rem;
    border-width: 2px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .error-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .btn-primary {
    background: #0d7b5f;
    color: white;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .disease-info {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .disease-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .disease-icon {
    font-size: 4rem;
  }

  .disease-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #0d7b5f;
    margin: 0 0 0.5rem 0;
  }

  .disease-subtitle {
    font-size: 1.25rem;
    color: #64748b;
    margin: 0 0 1rem 0;
  }

  .disease-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .disease-description {
    margin-bottom: 1.5rem;
  }

  .population-summary {
    margin: 1.5rem 0;
  }

  .population-card {
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border: 2px solid #bbf7d0;
    border-radius: 12px;
    overflow: hidden;
  }

  .population-header {
    background: #059669;
    color: white;
    padding: 1rem;
  }

  .population-header h4 {
    margin: 0;
    font-size: 1.125rem;
  }

  .population-content {
    padding: 1.5rem;
  }

  .population-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #bbf7d0;
  }

  .population-stat:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .population-stat.highlight {
    background: #dcfce7;
    padding: 1rem;
    border-radius: 8px;
    border: 2px solid #22c55e;
    font-weight: 600;
  }

  .stat-label {
    color: #374151;
    font-weight: 500;
  }

  .stat-value {
    color: #059669;
    font-weight: 600;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .meta-item {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .filters-section {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .filters-header h3 {
    color: #0d7b5f;
    margin: 0;
  }

  .current-scope {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .scope-label {
    color: #6b7280;
  }

  .scope-value {
    color: #0d7b5f;
    font-weight: 600;
    background: #f0f8f5;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
  }

  .filter-group label {
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .filter-select {
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    color: #374151;
    transition: border-color 0.2s ease;
  }

  .filter-select:focus {
    outline: none;
    border-color: #0d7b5f;
  }

  .reports-section {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .reports-header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .reports-title {
    color: #0d7b5f;
    margin: 0 0 0.5rem 0;
  }

  .scope-text {
    color: #059669;
    font-weight: 600;
  }

  .reports-loading, .reports-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .chart-card {
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .chart-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
  }

  .chart-card.wide {
    grid-column: 1 / -1;
  }

  .chart-header {
    background: linear-gradient(135deg, #0d7b5f 0%, #10b981 100%);
    color: white;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .chart-header h4 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .chart-summary {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .summary-stat {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    backdrop-filter: blur(10px);
  }

  .chart-container {
    height: 350px;
    padding: 1.5rem;
    position: relative;
  }

  .chart-insights {
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
    border-top: 1px solid #f59e0b;
  }

  .insight-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #92400e;
    font-size: 0.875rem;
  }

  .insight-icon {
    font-size: 1rem;
  }

  .gender-stats-summary {
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .gender-stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .gender-label {
    font-weight: 600;
    font-size: 0.875rem;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
  }

  .gender-label.male {
    background: #0d7b5f;
    color: white;
  }

  .gender-label.female {
    background: #10b981;
    color: white;
  }

  .gender-label.other {
    background: #3b82f6;
    color: white;
  }

  .gender-value, .gender-percent {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .occupation-top-list {
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-top: 1px solid #e5e7eb;
  }

  .occupation-top-list h5 {
    margin: 0 0 1rem 0;
    color: #374151;
    font-size: 0.875rem;
  }

  .top-occupations {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .occupation-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .rank {
    background: #0d7b5f;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    min-width: 2rem;
    text-align: center;
  }

  .occupation-name {
    flex: 1;
    font-weight: 500;
    color: #374151;
  }

  .occupation-count {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 600;
  }

  /* Responsive Design */
  @media (max-width: 1200px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }
    
    .chart-card.wide {
      grid-column: 1;
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }

    .nav-bar {
      padding: 1rem;
      flex-direction: column;
      gap: 1rem;
    }

    .disease-header {
      flex-direction: column;
      text-align: center;
    }

    .disease-title {
      font-size: 2rem;
    }

    .filters-grid {
      grid-template-columns: 1fr;
    }

    .filters-header {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .charts-grid {
      grid-template-columns: 1fr;
    }

    .chart-container {
      height: 300px;
      padding: 1rem;
    }

    .chart-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .chart-summary {
      justify-content: flex-start;
    }

    .gender-stats-summary {
      flex-direction: column;
      align-items: flex-start;
    }

    .meta-grid {
      grid-template-columns: 1fr;
    }

    .population-stat {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
  }

  @media (max-width: 480px) {
    .disease-icon {
      font-size: 3rem;
    }

    .disease-title {
      font-size: 1.75rem;
    }

    .chart-container {
      height: 250px;
      padding: 0.75rem;
    }

    .chart-header h4 {
      font-size: 1rem;
    }

    .summary-stat {
      font-size: 0.75rem;
      padding: 0.375rem 0.75rem;
    }

    .population-content {
      padding: 1rem;
    }

    .disease-info,
    .filters-section,
    .reports-section {
      padding: 1.5rem;
    }
  }
</style>