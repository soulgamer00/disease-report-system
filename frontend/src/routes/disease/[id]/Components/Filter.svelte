<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { reportsAPI, type ReportFilters } from '$lib/reports/api';
  import { FILTER_OPTIONS, UI_TEXT } from '$lib/reports/constants';
  import { REPORTS_CONFIG } from '$lib/reports/config';
  
  const dispatch = createEventDispatcher<{ filterChange: ReportFilters }>();
  
  export let diseaseId = '';
  export let filters: ReportFilters = {
    diseaseId,
    year: REPORTS_CONFIG.DEFAULT_YEAR,
    hospital: 'all',
    gender: 'all',
    ageGroup: 'all',
    occupation: 'all'
  };
  
  let loading = { hospitals: true, overall: true };
  let error: string | null = null;
  let hospitals = [{ value: 'all', label: 'ทั้งหมด' }];
  
  // Reactive: active filters count
  $: activeFilters = Object.values(filters).filter(v => v !== 'all').length;
  $: hasActiveFilters = activeFilters > 1; // > 1 because diseaseId is always active
  
  onMount(async () => {
    await loadHospitals();
    filters.diseaseId = diseaseId;
    loading.overall = false;
    handleFilterChange();
  });
  
  async function loadHospitals() {
    try {
      loading.hospitals = true;
      const hospitalData = await reportsAPI.getHospitals();
      hospitals = [{ value: 'all', label: 'ทั้งหมด' }, ...hospitalData];
    } catch (err) {
      error = err instanceof Error ? err.message : UI_TEXT.ERROR.NETWORK;
      hospitals = [{ value: 'all', label: 'ทั้งหมด' }];
    } finally {
      loading.hospitals = false;
    }
  }
  
  function handleFilterChange() {
    dispatch('filterChange', { ...filters, diseaseId });
  }
  
  function resetFilters() {
    filters = {
      diseaseId,
      year: REPORTS_CONFIG.DEFAULT_YEAR,
      hospital: 'all',
      gender: 'all',
      ageGroup: 'all',
      occupation: 'all'
    };
    handleFilterChange();
  }
</script>

<div class="filter-container">
  <div class="filter-header">
    <div class="filter-title-section">
      <h3>🔍 ตัวกรองข้อมูล</h3>
      {#if hasActiveFilters}
        <span class="active-count">{activeFilters - 1} ตัวกรอง</span>
      {/if}
    </div>
    <button 
      class="reset-btn" 
      on:click={resetFilters}
      disabled={loading.overall || !hasActiveFilters}
    >
      รีเซ็ต
    </button>
  </div>
  
  {#if loading.overall}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <span>{UI_TEXT.LOADING.FILTERS}</span>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-message">{error}</div>
    </div>
  {:else}
    <div class="filters-grid">
      <!-- Year Filter -->
      <div class="filter-group">
        <label for="year-filter">📅 ปี</label>
        <select id="year-filter" bind:value={filters.year} on:change={handleFilterChange}>
          {#each FILTER_OPTIONS.YEARS as year}
            <option value={year}>{year === 'all' ? 'ทั้งหมด' : `ปี ${year}`}</option>
          {/each}
        </select>
      </div>
      
      <!-- Hospital Filter -->
      <div class="filter-group">
        <label for="hospital-filter">
          🏥 โรงพยาบาล
          {#if loading.hospitals}<span class="loading-text">(กำลังโหลด...)</span>{/if}
        </label>
        <select 
          id="hospital-filter" 
          bind:value={filters.hospital} 
          on:change={handleFilterChange}
          disabled={loading.hospitals}
        >
          {#each hospitals as hospital}
            <option value={hospital.value}>{hospital.label}</option>
          {/each}
        </select>
      </div>
      
      <!-- Gender Filter -->
      <div class="filter-group">
        <label for="gender-filter">👥 เพศ</label>
        <select id="gender-filter" bind:value={filters.gender} on:change={handleFilterChange}>
          {#each FILTER_OPTIONS.GENDERS as gender}
            <option value={gender.value}>{gender.label}</option>
          {/each}
        </select>
      </div>
      
      <!-- Occupation Filter -->
      <div class="filter-group">
        <label for="occupation-filter">💼 อาชีพ</label>
        <select id="occupation-filter" bind:value={filters.occupation} on:change={handleFilterChange}>
          {#each FILTER_OPTIONS.OCCUPATIONS as occupation}
            <option value={occupation.value}>{occupation.label}</option>
          {/each}
        </select>
      </div>
    </div>
    
    <!-- Active Filters Display -->
    {#if hasActiveFilters}
      <div class="active-filters">
        <div class="active-filters-title">ตัวกรองที่เลือก:</div>
        <div class="active-filters-list">
          {#if filters.year !== 'all'}<span class="filter-tag">📅 ปี {filters.year}</span>{/if}
          {#if filters.hospital !== 'all'}<span class="filter-tag">🏥 {hospitals.find(h => h.value === filters.hospital)?.label}</span>{/if}
          {#if filters.gender !== 'all'}<span class="filter-tag">👥 {FILTER_OPTIONS.GENDERS.find(g => g.value === filters.gender)?.label}</span>{/if}
          {#if filters.occupation !== 'all'}<span class="filter-tag">💼 {FILTER_OPTIONS.OCCUPATIONS.find(o => o.value === filters.occupation)?.label}</span>{/if}
        </div>
      </div>
    {:else}
      <div class="no-filters">ไม่มีตัวกรอง - แสดงข้อมูลทั้งหมด</div>
    {/if}
  {/if}
</div>

<style>
  .filter-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .filter-title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .filter-title-section h3 {
    color: #0d7b5f;
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .active-count {
    background: linear-gradient(135deg, #0d7b5f, #10b981);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .reset-btn {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .reset-btn:hover:not(:disabled) {
    background: #e5e7eb;
  }
  
  .reset-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
  }
  
  .filter-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }
  
  .loading-text {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 400;
  }
  
  .filter-group select {
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.875rem;
    background: white;
    color: #374151;
    transition: border-color 0.2s ease;
  }
  
  .filter-group select:focus {
    outline: none;
    border-color: #0d7b5f;
    box-shadow: 0 0 0 3px rgba(13, 123, 95, 0.1);
  }
  
  .filter-group select:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }
  
  .active-filters {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .active-filters-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.75rem;
  }
  
  .active-filters-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .filter-tag {
    background: linear-gradient(135deg, #0d7b5f, #10b981);
    color: white;
    padding: 0.375rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .no-filters {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    color: #6b7280;
    font-style: italic;
    font-size: 0.875rem;
  }
  
  .loading-state, .error-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 2rem;
    color: #6b7280;
  }
  
  .error-state {
    flex-direction: column;
    text-align: center;
  }
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }
  
  .loading-spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #0d7b5f;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    .filter-container {
      padding: 1rem;
    }
    
    .filter-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
    
    .filters-grid {
      grid-template-columns: 1fr;
    }
    
    .active-filters-list {
      justify-content: center;
    }
  }
</style>