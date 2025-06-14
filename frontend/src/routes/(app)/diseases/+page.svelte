<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    diseaseState,
    diseaseStatsState,
    diseaseSummary,
    canManageDiseases,
    loadDiseases,
    loadDiseaseStats,
    deleteDisease,
    updateDiseaseFilters,
    clearDiseaseErrors
  } from '$lib/stores/diseaseStore';
  import { authState, userRole } from '$lib/stores/auth';
  import type { DiseaseQueryParams } from '$lib/api/types';

  // Reactive subscriptions
  $: diseases = $diseaseState.diseases;
  $: isLoading = $diseaseState.isLoading;
  $: error = $diseaseState.error;
  $: pagination = $diseaseState.pagination;
  $: filters = $diseaseState.filters;
  $: stats = $diseaseStatsState.stats;
  $: statsLoading = $diseaseStatsState.isLoading;
  $: summary = $diseaseSummary;
  $: permissions = $canManageDiseases;
  $: user = $authState.user;
  $: role = $userRole;

  // Local state
  let searchTerm = '';
  let selectedStatus: boolean | undefined = true; // Default to active diseases
  let showFilters = false;
  let showDeleteModal = false;
  let diseaseToDelete: { id: number; thaiName: string; symptomCount: number } | null = null;

  onMount(async () => {
    // Check permissions - Only SUPERUSER can access disease management
    if (!role.isSuperuser) {
      goto('/dashboard');
      return;
    }

    // Load initial data
    await Promise.all([
      loadDiseases(),
      loadDiseaseStats()
    ]);
  });

  // Handle search and filters
  async function handleSearch() {
    const searchFilters: Partial<DiseaseQueryParams> = {
      page: 1, // Reset to first page
    };

    if (searchTerm.trim()) {
      searchFilters.search = searchTerm.trim();
    }

    if (selectedStatus !== undefined) {
      searchFilters.isActive = selectedStatus;
    }

    await updateDiseaseFilters(searchFilters);
  }

  async function clearFilters() {
    searchTerm = '';
    selectedStatus = true;
    showFilters = false;

    await updateDiseaseFilters({
      page: 1,
      search: undefined,
      isActive: true,
    });
  }

  // Pagination
  async function goToPage(page: number) {
    await updateDiseaseFilters({ page });
  }

  async function changePageSize(limit: number) {
    await updateDiseaseFilters({ page: 1, limit });
  }

  // Sorting
  async function handleSort(sortBy: 'thaiName' | 'engName' | 'createdAt' | 'updatedAt') {
    const newOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    await updateDiseaseFilters({ sortBy, sortOrder: newOrder });
  }

  // CRUD Operations
  function handleCreate() {
    goto('/diseases/new');
  }

  function handleEdit(id: number) {
    goto(`/diseases/edit/${id}`);
  }

  function handleView(id: number) {
    goto(`/diseases/${id}`);
  }

  function confirmDelete(disease: any) {
    diseaseToDelete = {
      id: disease.id,
      thaiName: disease.thaiName,
      symptomCount: disease.symptoms?.length || 0
    };
    showDeleteModal = true;
  }

  async function handleDelete() {
    if (!diseaseToDelete) return;

    const success = await deleteDisease(diseaseToDelete.id);

    if (success) {
      showDeleteModal = false;
      diseaseToDelete = null;
      // Show success message
      console.log('Disease deleted successfully');
    }
  }

  function cancelDelete() {
    showDeleteModal = false;
    diseaseToDelete = null;
  }

  // Utility functions
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

  function getStatusBadge(isActive: boolean): { class: string; text: string } {
    return isActive
      ? { class: 'badge-success', text: 'ใช้งาน' }
      : { class: 'badge-danger', text: 'ไม่ใช้งาน' };
  }

  // Error handling
  function handleErrorClose() {
    clearDiseaseErrors();
  }
</script>

<svelte:head>
  <title>จัดการข้อมูลโรค - ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
</svelte:head>

<div class="disease-management">
  <header class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1>จัดการข้อมูลโรค</h1>
        <p>จัดการข้อมูลโรคติดต่อโดยแมลงและอาการที่เกี่ยวข้อง</p>
      </div>

      {#if permissions.canCreate}
        <button class="btn btn-primary" on:click={handleCreate}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          เพิ่มโรคใหม่
        </button>
      {/if}
    </div>
  </header>

  {#if stats && !statsLoading}
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon disease">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>โรคทั้งหมด</h3>
            <p class="stat-number">{stats.totalDiseases}</p>
            <span class="stat-detail">ใช้งาน {stats.activeDiseases} โรค</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon symptoms">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>โรคที่มีอาการ</h3>
            <p class="stat-number">{stats.withSymptoms}</p>
            <span class="stat-detail">ไม่มีอาการ {stats.withoutSymptoms} โรค</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon recent">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>เพิ่มล่าสุด</h3>
            <p class="stat-number">
              {#if stats.mostRecentDisease}
                {stats.mostRecentDisease.thaiName}
              {:else}
                -
              {/if}
            </p>
            <span class="stat-detail">
              {#if stats.mostRecentDisease}
                {formatDate(stats.mostRecentDisease.createdAt)}
              {:else}
                ไม่มีข้อมูล
              {/if}
            </span>
          </div>
        </div>
      </div>
    </section>
  {/if}

  <section class="search-section">
    <div class="search-bar">
      <div class="search-input">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="ค้นหาชื่อโรค (ไทย/อังกฤษ)..."
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
            <label for="status-filter">สถานะ</label>
            <select id="status-filter" bind:value={selectedStatus} on:change={handleSearch}>
              <option value={undefined}>ทุกสถานะ</option>
              <option value={true}>ใช้งาน</option>
              <option value={false}>ไม่ใช้งาน</option>
            </select>
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

  <section class="data-section">
    {#if isLoading}
      <div class="loading-container">
        <div class="spinner"></div>
        <p>กำลังโหลดข้อมูลโรค...</p>
      </div>
    {:else if summary.isEmpty}
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <h3>ไม่พบข้อมูลโรค</h3>
        <p>ยังไม่มีข้อมูลโรคที่ตรงกับเงื่อนไขการค้นหา</p>
        {#if permissions.canCreate}
          <button class="btn btn-primary" on:click={handleCreate}>
            เพิ่มข้อมูลโรคแรก
          </button>
        {/if}
      </div>
    {:else}
      <div class="table-container hidden md:block">
        <table class="data-table">
          <thead>
            <tr>
              <th>
                <button class="sort-btn" on:click={() => handleSort('thaiName')}>
                  ชื่อโรค (ไทย) {getSortIcon('thaiName')}
                </button>
              </th>
              <th>
                <button class="sort-btn" on:click={() => handleSort('engName')}>
                  ชื่อโรค (อังกฤษ) {getSortIcon('engName')}
                </button>
              </th>
              <th>อาการ</th>
              <th>สถานะ</th>
              <th>
                <button class="sort-btn" on:click={() => handleSort('updatedAt')}>
                  อัปเดตล่าสุด {getSortIcon('updatedAt')}
                </button>
              </th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {#each diseases as disease (disease.id)}
              {@const status = getStatusBadge(disease.isActive)}
              <tr>
                <td>
                  <div class="disease-name">
                    <span class="thai-name">{disease.thaiName}</span>
                    {#if disease.daName}
                      <span class="da-code">({disease.daName})</span>
                    {/if}
                  </div>
                </td>
                <td>
                  <span class="eng-name">
                    {disease.engName || '-'}
                  </span>
                </td>
                <td>
                  <div class="symptom-count">
                    <span class="count-number">{disease.symptoms?.length || 0}</span>
                    <span class="count-label">อาการ</span>
                  </div>
                </td>
                <td>
                  <span class="badge {status.class}">{status.text}</span>
                </td>
                <td class="date-cell">
                  {formatDate(disease.updatedAt)}
                </td>
                <td class="actions-cell">
                  <div class="action-buttons">
                    <button
                      class="btn-icon"
                      title="ดูรายละเอียด"
                      on:click={() => handleView(disease.id)}
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
                        on:click={() => handleEdit(disease.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    {/if}

                    {#if permissions.canDelete && disease.isActive}
                      <button
                        class="btn-icon delete"
                        title="ลบ"
                        on:click={() => confirmDelete(disease)}
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

      <div class="cards-container block md:hidden">
        {#each diseases as disease (disease.id)}
          {@const status = getStatusBadge(disease.isActive)}
          <div class="disease-card">
            <div class="card-header">
              <div class="disease-info">
                <h3 class="thai-name">{disease.thaiName}</h3>
                {#if disease.engName}
                  <span class="eng-name">{disease.engName}</span>
                {/if}
                {#if disease.daName}
                  <span class="da-code">({disease.daName})</span>
                {/if}
              </div>

              <span class="badge {status.class}">{status.text}</span>
            </div>

            <div class="card-body">
              <div class="symptom-info">
                <span class="symptom-label">จำนวนอาการ:</span>
                <span class="symptom-count">{disease.symptoms?.length || 0} อาการ</span>
              </div>

              {#if disease.details}
                <div class="details-info">
                  <p class="details-text">{disease.details.substring(0, 100)}{disease.details.length > 100 ? '...' : ''}</p>
                </div>
              {/if}

              <div class="meta-info">
                <span class="updated-date">
                  อัปเดต {formatDate(disease.updatedAt)}
                </span>
              </div>
            </div>

            <div class="card-footer">
              <div class="card-actions">
                <button
                  class="btn btn-outline btn-sm"
                  on:click={() => handleView(disease.id)}
                >
                  ดูรายละเอียด
                </button>

                {#if permissions.canEdit}
                  <button
                    class="btn btn-primary btn-sm"
                    on:click={() => handleEdit(disease.id)}
                  >
                    แก้ไข
                  </button>
                {/if}
              </div>

              {#if permissions.canDelete && disease.isActive}
                <button
                  class="btn btn-danger btn-sm"
                  on:click={() => confirmDelete(disease)}
                >
                  ลบ
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}

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

{#if showDeleteModal && diseaseToDelete}
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
          <p>คุณต้องการลบข้อมูลโรคนี้หรือไม่?</p>
          <div class="delete-details">
            <p><strong>ชื่อโรค:</strong> {diseaseToDelete.thaiName}</p>
            <p><strong>จำนวนอาการ:</strong> {diseaseToDelete.symptomCount} อาการ</p>
          </div>
          <p class="warning-note">
            ⚠️ การลบข้อมูลนี้จะทำให้อาการทั้งหมดของโรคนี้ถูกลบด้วย และไม่สามารถยกเลิกได้
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
  .disease-management {
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
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .stat-icon.disease {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
  }

  .stat-icon.symptoms {
    background: linear-gradient(135deg, #27ae60, #219a52);
  }

  .stat-icon.recent {
    background: linear-gradient(135deg, #3498db, #2980b9);
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

  .filter-group select {
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

  .disease-name {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .thai-name {
    font-weight: 500;
    color: var(--text-primary);
  }

  .da-code {
    font-size: 12px;
    color: var(--text-secondary);
    font-family: 'Courier New', monospace;
  }

  .eng-name {
    color: var(--text-secondary);
    font-style: italic;
  }

  .symptom-count {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .count-number {
    font-weight: 600;
    color: var(--primary);
  }

  .count-label {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .action-buttons {
    display: flex;
    gap: var(--spacing-xs);
  }

  /* Badges */
  .badge {
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .badge-success {
    background: rgba(39, 174, 96, 0.1);
    color: var(--success);
  }

  .badge-danger {
    background: rgba(231, 76, 60, 0.1);
    color: var(--danger);
  }

  /* Mobile Cards */
  .cards-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .disease-card {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: var(--spacing-md);
    background: var(--gray-100);
  }

  .disease-info h3 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: 16px;
    color: var(--text-primary);
  }

  .card-body {
    padding: var(--spacing-md);
  }

  .symptom-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }

  .symptom-label {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .symptom-count {
    font-size: 16px;
    font-weight: 600;
    color: var(--primary);
  }

  .details-info {
    margin-bottom: var(--spacing-md);
  }

  .details-text {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0;
  }

  .meta-info {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .card-footer {
    padding: var(--spacing-md);
    border-top: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-actions {
    display: flex;
    gap: var(--spacing-sm);
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
    .disease-management {
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