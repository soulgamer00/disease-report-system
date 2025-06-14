<!-- src/routes/(app)/populations/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    populationState, 
    populationStatsState,
    accessibleHospitalsState,
    populationSummary,
    canManagePopulations,
    loadPopulations,
    loadPopulationStats,
    loadAccessibleHospitals,
    deletePopulation,
    updateFilters,
    clearPopulationErrors
  } from '$lib/stores/populationStore';
  import { authState, userRole } from '$lib/stores/auth';
  import type { PopulationQueryParams } from '$lib/api/types';

  // Reactive subscriptions
  $: populations = $populationState.populations;
  $: isLoading = $populationState.isLoading;
  $: error = $populationState.error;
  $: pagination = $populationState.pagination;
  $: filters = $populationState.filters;
  $: stats = $populationStatsState.stats;
  $: statsLoading = $populationStatsState.isLoading;
  $: hospitals = $accessibleHospitalsState.hospitals;
  $: summary = $populationSummary;
  $: permissions = $canManagePopulations;
  $: user = $authState.user;
  $: role = $userRole;

  // Local state
  let searchTerm = '';
  let selectedYear: number | undefined;
  let selectedHospital = '';
  let minPopulation: number | undefined;
  let maxPopulation: number | undefined;
  let showFilters = false;
  let showDeleteModal = false;
  let populationToDelete: { id: number; year: number; hospitalName: string } | null = null;

  // Current year for default
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: 10 }, 
    (_, i) => currentYear - i
  );

  onMount(async () => {
    // Check permissions
    if (!role.isAdmin && !role.isSuperuser) {
      goto('/dashboard');
      return;
    }

    // Load initial data
    await Promise.all([
      loadPopulations(),
      loadPopulationStats(),
      loadAccessibleHospitals()
    ]);
  });

  // Handle search and filters
  async function handleSearch() {
    const searchFilters: Partial<PopulationQueryParams> = {
      page: 1, // Reset to first page
    };

    if (selectedYear) searchFilters.year = selectedYear;
    if (selectedHospital) searchFilters.hospitalCode = selectedHospital;
    if (minPopulation) searchFilters.minPopulation = minPopulation;
    if (maxPopulation) searchFilters.maxPopulation = maxPopulation;

    await updateFilters(searchFilters);
  }

  async function clearFilters() {
    searchTerm = '';
    selectedYear = undefined;
    selectedHospital = '';
    minPopulation = undefined;
    maxPopulation = undefined;
    showFilters = false;
    
    await updateFilters({
      page: 1,
      year: undefined,
      hospitalCode: undefined,
      minPopulation: undefined,
      maxPopulation: undefined,
    });
  }

  // Pagination
  async function goToPage(page: number) {
    await updateFilters({ page });
  }

  async function changePageSize(limit: number) {
    await updateFilters({ page: 1, limit });
  }

  // Sorting
  async function handleSort(sortBy: 'year' | 'population' | 'hospitalCode' | 'createdAt') {
    const newOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    await updateFilters({ sortBy, sortOrder: newOrder });
  }

  // CRUD Operations
  function handleCreate() {
    goto('/populations/new');
  }

  function handleEdit(id: number) {
    goto(`/populations/edit/${id}`);
  }

  function handleView(id: number) {
    goto(`/populations/${id}`);
  }

  function confirmDelete(population: any) {
    populationToDelete = {
      id: population.id,
      year: population.year,
      hospitalName: population.hospital.hospitalName || 'ไม่ระบุชื่อ'
    };
    showDeleteModal = true;
  }

  async function handleDelete() {
    if (!populationToDelete) return;

    const success = await deletePopulation(populationToDelete.id);
    
    if (success) {
      showDeleteModal = false;
      populationToDelete = null;
      // Show success message
      console.log('Population deleted successfully');
    }
  }

  function cancelDelete() {
    showDeleteModal = false;
    populationToDelete = null;
  }

  // Utility functions
  function formatNumber(num: number): string {
    return new Intl.NumberFormat('th-TH').format(num);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getSortIcon(column: string): string {
    if (filters.sortBy !== column) return '↕️';
    return filters.sortOrder === 'asc' ? '↑' : '↓';
  }

  // Error handling
  function handleErrorClose() {
    clearPopulationErrors();
  }
</script>

<svelte:head>
  <title>จัดการข้อมูลประชากร - ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
</svelte:head>

<div class="population-management">
  <!-- Header -->
  <header class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1>จัดการข้อมูลประชากร</h1>
        <p>สำหรับการคำนวณอัตราป่วยต่อแสนประชากร</p>
      </div>
      
      {#if permissions.canCreate}
        <button class="btn btn-primary" on:click={handleCreate}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          เพิ่มข้อมูลประชากร
        </button>
      {/if}
    </div>
  </header>

  <!-- Statistics Cards -->
  {#if stats && !statsLoading}
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>ประชากรปี {stats.currentYear.year}</h3>
            <p class="stat-number">{formatNumber(stats.currentYear.totalPopulation)}</p>
            <span class="stat-detail">{stats.currentYear.hospitalCount} โรงพยาบาล</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2v6"/>
              <path d="M12 18v4"/>
              <path d="M4.93 4.93l4.24 4.24"/>
              <path d="M14.83 14.83l4.24 4.24"/>
              <path d="M2 12h6"/>
              <path d="M16 12h6"/>
              <path d="M4.93 19.07l4.24-4.24"/>
              <path d="M14.83 9.17l4.24-4.24"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>การเปลี่ยนแปลง</h3>
            <p class="stat-number">
              {#if stats.populationChange !== null}
                {stats.populationChange > 0 ? '+' : ''}{formatNumber(stats.populationChange)}
              {:else}
                -
              {/if}
            </p>
            <span class="stat-detail">เทียบกับปีก่อน</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 11H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h4"/>
              <path d="M15 11h4a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-4"/>
              <path d="M12 11V7a4 4 0 1 0-8 0v4"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>ข้อมูลทั้งหมด</h3>
            <p class="stat-number">{formatNumber(stats.totalRecords)}</p>
            <span class="stat-detail">รายการข้อมูล</span>
          </div>
        </div>
      </div>
    </section>
  {/if}

  <!-- Search and Filters -->
  <section class="search-section">
    <div class="search-bar">
      <div class="search-input">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="ค้นหาตามปี หรือชื่อโรงพยาบาล..."
          bind:value={searchTerm}
          on:input={handleSearch}
        />
      </div>
      
      <button 
        class="btn btn-outline"
        class:active={showFilters}
        on:click={() => showFilters = !showFilters}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
        </svg>
        ตัวกรอง
      </button>
    </div>

    {#if showFilters}
      <div class="filters-panel">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="year-filter">ปี</label>
            <select id="year-filter" bind:value={selectedYear} on:change={handleSearch}>
              <option value={undefined}>ทุกปี</option>
              {#each availableYears as year}
                <option value={year}>{year}</option>
              {/each}
            </select>
          </div>

          <div class="filter-group">
            <label for="hospital-filter">โรงพยาบาล</label>
            <select id="hospital-filter" bind:value={selectedHospital} on:change={handleSearch}>
              <option value="">ทุกโรงพยาบาล</option>
              {#each hospitals as hospital}
                <option value={hospital.hospitalCode5Digit}>
                  {hospital.hospitalName || hospital.hospitalCode5Digit}
                </option>
              {/each}
            </select>
          </div>

          <div class="filter-group">
            <label for="min-population">ประชากรต่ำสุด</label>
            <input
              id="min-population"
              type="number"
              placeholder="เช่น 10000"
              bind:value={minPopulation}
              on:input={handleSearch}
            />
          </div>

          <div class="filter-group">
            <label for="max-population">ประชากรสูงสุด</label>
            <input
              id="max-population"
              type="number"
              placeholder="เช่น 500000"
              bind:value={maxPopulation}
              on:input={handleSearch}
            />
          </div>
        </div>

        <div class="filters-actions">
          <button class="btn btn-secondary" on:click={clearFilters}>
            ล้างตัวกรอง
          </button>
        </div>
      </div>
    {/if}
  </section>

  <!-- Error Message -->
  {#if error}
    <div class="alert alert-error">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <span>{error}</span>
      <button class="close-btn" on:click={handleErrorClose}>×</button>
    </div>
  {/if}

  <!-- Data Table / Cards -->
  <section class="data-section">
    {#if isLoading}
      <div class="loading-container">
        <div class="spinner"></div>
        <p>กำลังโหลดข้อมูลประชากร...</p>
      </div>
    {:else if summary.isEmpty}
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <h3>ไม่พบข้อมูลประชากร</h3>
        <p>ยังไม่มีข้อมูลประชากรที่ตรงกับเงื่อนไขการค้นหา</p>
        {#if permissions.canCreate}
          <button class="btn btn-primary" on:click={handleCreate}>
            เพิ่มข้อมูลประชากรแรก
          </button>
        {/if}
      </div>
    {:else}
      <!-- Desktop Table -->
      <div class="table-container hidden md:block">
        <table class="data-table">
          <thead>
            <tr>
              <th>
                <button class="sort-btn" on:click={() => handleSort('year')}>
                  ปี {getSortIcon('year')}
                </button>
              </th>
              <th>โรงพยาบาล</th>
              <th>
                <button class="sort-btn" on:click={() => handleSort('population')}>
                  จำนวนประชากร {getSortIcon('population')}
                </button>
              </th>
              <th>
                <button class="sort-btn" on:click={() => handleSort('createdAt')}>
                  วันที่เพิ่ม {getSortIcon('createdAt')}
                </button>
              </th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {#each populations as population (population.id)}
              <tr>
                <td class="year-cell">
                  <span class="year-badge">{population.year}</span>
                </td>
                <td>
                  <div class="hospital-info">
                    <span class="hospital-name">
                      {population.hospital.hospitalName || 'ไม่ระบุชื่อ'}
                    </span>
                    <span class="hospital-code">{population.hospitalCode}</span>
                  </div>
                </td>
                <td class="population-cell">
                  <span class="population-number">
                    {formatNumber(population.population)}
                  </span>
                  <span class="population-unit">คน</span>
                </td>
                <td class="date-cell">
                  {formatDate(population.createdAt)}
                </td>
                <td class="actions-cell">
                  <div class="action-buttons">
                    <button 
                      class="btn-icon" 
                      title="ดูรายละเอียด"
                      on:click={() => handleView(population.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                    
                    {#if permissions.canEdit}
                      <button 
                        class="btn-icon edit" 
                        title="แก้ไข"
                        on:click={() => handleEdit(population.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    {/if}
                    
                    {#if permissions.canDelete && role.isSuperuser}
                      <button 
                        class="btn-icon delete" 
                        title="ลบ"
                        on:click={() => confirmDelete(population)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M3 6h18"/>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="cards-container block md:hidden">
        {#each populations as population (population.id)}
          <div class="population-card">
            <div class="card-header">
              <span class="year-badge">{population.year}</span>
              <div class="card-actions">
                <button 
                  class="btn-icon" 
                  on:click={() => handleView(population.id)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                
                {#if permissions.canEdit}
                  <button 
                    class="btn-icon edit" 
                    on:click={() => handleEdit(population.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                {/if}
              </div>
            </div>
            
            <div class="card-body">
              <div class="hospital-info">
                <h4>{population.hospital.hospitalName || 'ไม่ระบุชื่อ'}</h4>
                <span class="hospital-code">{population.hospitalCode}</span>
              </div>
              
              <div class="population-info">
                <span class="population-label">จำนวนประชากร</span>
                <span class="population-value">
                  {formatNumber(population.population)} คน
                </span>
              </div>
              
              <div class="meta-info">
                <span class="created-date">
                  เพิ่มเมื่อ {formatDate(population.createdAt)}
                </span>
              </div>
            </div>
            
            {#if permissions.canDelete && role.isSuperuser}
              <div class="card-footer">
                <button 
                  class="btn btn-danger btn-sm" 
                  on:click={() => confirmDelete(population)}
                >
                  ลบข้อมูล
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <!-- Pagination -->
    {#if pagination && pagination.pages > 1}
      <div class="pagination-container">
        <div class="pagination-info">
          <span>
            แสดง {((pagination.page - 1) * pagination.limit) + 1} - 
            {Math.min(pagination.page * pagination.limit, pagination.total)} 
            จาก {pagination.total} รายการ
          </span>
        </div>
        
        <div class="pagination-controls">
          <button 
            class="btn btn-outline"
            disabled={!pagination.hasPrev}
            on:click={() => goToPage(pagination.page - 1)}
          >
            ก่อนหน้า
          </button>
          
          <div class="page-numbers">
            {#each Array.from({length: Math.min(5, pagination.pages)}, (_, i) => {
              const start = Math.max(1, pagination.page - 2);
              return start + i;
            }) as pageNum}
              {#if pageNum <= pagination.pages}
                <button 
                  class="page-btn"
                  class:active={pageNum === pagination.page}
                  on:click={() => goToPage(pageNum)}
                >
                  {pageNum}
                </button>
              {/if}
            {/each}
          </div>
          
          <button 
            class="btn btn-outline"
            disabled={!pagination.hasNext}
            on:click={() => goToPage(pagination.page + 1)}
          >
            ถัดไป
          </button>
        </div>
        
        <div class="page-size-selector">
          <label for="page-size">แสดง:</label>
          <select 
            id="page-size" 
            value={pagination.limit}
            on:change={(e) => changePageSize(Number(e.target.value))}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span>รายการ</span>
        </div>
      </div>
    {/if}
  </section>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && populationToDelete}
  <div class="modal-overlay" on:click|self={cancelDelete}>
    <div class="modal">
      <div class="modal-header">
        <h3>ยืนยันการลบข้อมูล</h3>
        <button class="modal-close" on:click={cancelDelete}>×</button>
      </div>
      
      <div class="modal-body">
        <div class="warning-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        
        <div class="warning-content">
          <p>คุณต้องการลบข้อมูลประชากรนี้หรือไม่?</p>
          <div class="delete-details">
            <p><strong>ปี:</strong> {populationToDelete.year}</p>
            <p><strong>โรงพยาบาล:</strong> {populationToDelete.hospitalName}</p>
          </div>
          <p class="warning-note">
            ⚠️ การลบข้อมูลนี้จะส่งผลต่อการคำนวณอัตราป่วยและไม่สามารถยกเลิกได้
          </p>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={cancelDelete}>
          ยกเลิก
        </button>
        <button class="btn btn-danger" on:click={handleDelete}>
          ลบข้อมูล
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* CSS Variables - Design System */
  :root {
    --primary: #16a085;
    --background: #f8f9fa;
    --card-bg: #ffffff;
    --text-primary: #2c3e50;
    --text-secondary: #7f8c8d;
    --success: #27ae60;
    --warning: #f39c12;
    --danger: #e74c3c;
    --info: #3498db;
    --gray-100: #f1f3f4;
    --gray-200: #e9ecef;
    --gray-300: #dee2e6;
    --border-radius: 8px;
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
  }

  /* Layout */
  .population-management {
    min-height: 100vh;
    background: var(--background);
    padding: var(--spacing-lg);
  }

  /* Header */
  .page-header {
    margin-bottom: var(--spacing-xl);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-lg);
  }

  .title-section h1 {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .title-section p {
    color: var(--text-secondary);
    font-size: 16px;
  }

  /* Statistics */
  .stats-section {
    margin-bottom: var(--spacing-xl);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-lg);
  }

  .stat-card {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    background: rgba(22, 160, 133, 0.1);
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    flex-shrink: 0;
  }

  .stat-content h3 {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
  }

  .stat-number {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .stat-detail {
    font-size: 12px;
    color: var(--text-secondary);
  }

  /* Search and Filters */
  .search-section {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .search-bar {
    display: flex;
    gap: var(--spacing-md);
    align-items: center;
  }

  .search-input {
    flex: 1;
    position: relative;
  }

  .search-input svg {
    position: absolute;
    left: var(--spacing-md);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
  }

  .search-input input {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) 48px;
    border: 1px solid var(--gray-300);
    border-radius: var(--border-radius);
    font-size: 16px;
    min-height: 44px;
  }

  .search-input input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
  }

  .filters-panel {
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--gray-200);
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .filter-group label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .filter-group select,
  .filter-group input {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--gray-300);
    border-radius: var(--border-radius);
    font-size: 14px;
    min-height: 40px;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-lg);
    border: none;
    border-radius: var(--border-radius);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    min-height: 44px;
    text-decoration: none;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover {
    background: #128a71;
    box-shadow: 0 4px 15px rgba(22, 160, 133, 0.3);
  }

  .btn-outline {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--gray-300);
  }

  .btn-outline:hover {
    background: var(--gray-100);
  }

  .btn-outline.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .btn-secondary {
    background: var(--gray-200);
    color: var(--text-primary);
  }

  .btn-secondary:hover {
    background: var(--gray-300);
  }

  .btn-danger {
    background: var(--danger);
    color: white;
  }

  .btn-danger:hover {
    background: #c0392b;
  }

  .btn-sm {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 12px;
    min-height: 36px;
  }

  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: var(--border-radius);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-icon:hover {
    background: var(--gray-100);
    color: var(--text-primary);
  }

  .btn-icon.edit:hover {
    background: rgba(52, 152, 219, 0.1);
    color: var(--info);
  }

  .btn-icon.delete:hover {
    background: rgba(231, 76, 60, 0.1);
    color: var(--danger);
  }

  /* Table */
  .table-container {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th,
  .data-table td {
    padding: var(--spacing-md);
    text-align: left;
    border-bottom: 1px solid var(--gray-200);
  }

  .data-table th {
    background: var(--gray-100);
    font-weight: 600;
    color: var(--text-primary);
  }

  .sort-btn {
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .year-badge {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-md);
    background: var(--primary);
    color: white;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .hospital-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .hospital-name {
    font-weight: 500;
    color: var(--text-primary);
  }

  .hospital-code {
    font-size: 12px;
    color: var(--text-secondary);
    font-family: 'Courier New', monospace;
  }

  .population-cell {
    text-align: right;
  }

  .population-number {
    font-weight: 600;
    color: var(--text-primary);
  }

  .population-unit {
    font-size: 12px;
    color: var(--text-secondary);
    margin-left: var(--spacing-xs);
  }

  .action-buttons {
    display: flex;
    gap: var(--spacing-xs);
  }

  /* Mobile Cards */
  .cards-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .population-card {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    background: var(--gray-100);
  }

  .card-actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  .card-body {
    padding: var(--spacing-md);
  }

  .card-body .hospital-info h4 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: 16px;
    color: var(--text-primary);
  }

  .population-info {
    margin: var(--spacing-md) 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .population-label {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .population-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .meta-info {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .card-footer {
    padding: var(--spacing-md);
    border-top: 1px solid var(--gray-200);
    background: var(--gray-100);
  }

  /* Loading States */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    gap: var(--spacing-md);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--gray-200);
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    text-align: center;
    gap: var(--spacing-md);
    background: var(--card-bg);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .empty-state svg {
    color: var(--text-secondary);
  }

  .empty-state h3 {
    color: var(--text-primary);
    margin: 0;
  }

  .empty-state p {
    color: var(--text-secondary);
    margin: 0;
  }

  /* Alerts */
  .alert {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-lg);
  }

  .alert-error {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.2);
    color: var(--danger);
  }

  .close-btn {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 18px;
    margin-left: auto;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Pagination */
  .pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--spacing-lg);
    padding: var(--spacing-lg);
    background: var(--card-bg);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .page-numbers {
    display: flex;
    gap: var(--spacing-xs);
  }

  .page-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--gray-300);
    background: white;
    color: var(--text-primary);
    cursor: pointer;
    border-radius: var(--border-radius);
    font-size: 14px;
    transition: all 0.15s ease;
  }

  .page-btn:hover {
    background: var(--gray-100);
  }

  .page-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .page-size-selector {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 14px;
    color: var(--text-secondary);
  }

  .page-size-selector select {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 1px solid var(--gray-300);
    border-radius: var(--border-radius);
    font-size: 14px;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: var(--spacing-lg);
  }

  .modal {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--gray-200);
  }

  .modal-header h3 {
    margin: 0;
    color: var(--text-primary);
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-body {
    padding: var(--spacing-lg);
  }

  .warning-icon {
    display: flex;
    justify-content: center;
    margin-bottom: var(--spacing-md);
    color: var(--warning);
  }

  .warning-content p {
    margin-bottom: var(--spacing-md);
    text-align: center;
  }

  .delete-details {
    background: var(--gray-100);
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-md);
  }

  .delete-details p {
    margin: var(--spacing-xs) 0;
    font-size: 14px;
  }

  .warning-note {
    font-size: 14px;
    color: var(--warning);
    text-align: center;
    font-weight: 500;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    border-top: 1px solid var(--gray-200);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .population-management {
      padding: var(--spacing-md);
    }

    .header-content {
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-md);
    }

    .search-bar {
      flex-direction: column;
    }

    .filters-grid {
      grid-template-columns: 1fr;
    }

    .pagination-container {
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-md);
    }

    .pagination-controls {
      justify-content: center;
    }

    .pagination-info,
    .page-size-selector {
      text-align: center;
    }
  }

  @media (max-width: 640px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .stat-card {
      flex-direction: column;
      text-align: center;
    }

    .page-numbers {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
  }
</style>