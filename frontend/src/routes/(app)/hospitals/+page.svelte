<!-- src/routes/(app)/hospitals/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { 
    hospitalState, 
    hospitalStatsState,
    loadHospitals, 
    loadHospitalStats,
    deleteHospital,
    clearHospitalErrors 
  } from '$lib/stores/hospitals';
  import { userRole } from '$lib/stores/auth';
  import type { HospitalQueryParams } from '$lib/api/types';

  // ===== Reactive State =====
  $: hospitals = $hospitalState.hospitals;
  $: pagination = $hospitalState.pagination;
  $: isLoading = $hospitalState.isLoading;
  $: error = $hospitalState.error;
  $: stats = $hospitalStatsState.stats;
  $: statsLoading = $hospitalStatsState.isLoading;
  $: role = $userRole;

  // ===== Filter State =====
  let filters: HospitalQueryParams = {
    page: 1,
    limit: 20,
    search: '',
    organizationType: '',
    healthServiceType: '',
    affiliation: '',
    isActive: true,
    sortBy: 'hospitalName',
    sortOrder: 'asc',
  };

  let searchTimeout: number;
  let showDeleteModal = false;
  let hospitalToDelete: { id: number; name: string } | null = null;
  let isDeleting = false;

  // ===== Lifecycle =====
  onMount(() => {
    console.log('DEBUG (hospitals/+page.svelte): Component mounted');
    clearHospitalErrors();
    
    // Load initial data
    loadHospitals(filters);
    
    // Load stats for admin/superuser
    if (role.isAdmin || role.isSuperuser) {
      loadHospitalStats();
    }
  });

  // ===== Search Handler =====
  function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filters.page = 1; // Reset to first page on search
      loadHospitals(filters);
    }, 300); // Debounce search
  }

  // ===== Filter Handlers =====
  function handleFilterChange() {
    filters.page = 1; // Reset to first page on filter change
    loadHospitals(filters);
  }

  function handlePageChange(newPage: number) {
    filters.page = newPage;
    loadHospitals(filters);
  }

  function handleSort(column: string) {
    if (filters.sortBy === column) {
      filters.sortOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      filters.sortBy = column as any;
      filters.sortOrder = 'asc';
    }
    loadHospitals(filters);
  }

  // ===== Action Handlers =====
  function handleCreate() {
    goto('/hospitals/create');
  }

  function handleEdit(id: number) {
    goto(`/hospitals/edit/${id}`);
  }

  function handleDeleteClick(hospital: { id: number; hospitalName: string | null }) {
    hospitalToDelete = {
      id: hospital.id,
      name: hospital.hospitalName || 'โรงพยาบาลไม่ระบุชื่อ'
    };
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!hospitalToDelete) return;
    
    isDeleting = true;
    const success = await deleteHospital(hospitalToDelete.id);
    
    if (success) {
      showDeleteModal = false;
      hospitalToDelete = null;
      // Reload current page
      loadHospitals(filters);
    }
    isDeleting = false;
  }

  function cancelDelete() {
    showDeleteModal = false;
    hospitalToDelete = null;
  }

  // ===== Utility Functions =====
  function getStatusBadge(isActive: boolean) {
    return isActive ? 'badge-success' : 'badge-danger';
  }

  function getStatusText(isActive: boolean) {
    return isActive ? 'ใช้งาน' : 'ไม่ใช้งาน';
  }
</script>

<svelte:head>
  <title>จัดการโรงพยาบาล - ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
</svelte:head>

<div class="hospital-list">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="header-title">
        <h1>จัดการโรงพยาบาล</h1>
        <p>จัดการข้อมูลโรงพยาบาลในระบบ</p>
      </div>
      
      {#if role.isSuperuser}
        <button class="btn btn-primary" on:click={handleCreate}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          เพิ่มโรงพยาบาล
        </button>
      {/if}
    </div>
  </div>

  <!-- Statistics Cards (Admin/Superuser only) -->
  {#if (role.isAdmin || role.isSuperuser) && stats}
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3>โรงพยาบาลทั้งหมด</h3>
          <p class="stat-number">{stats.totalHospitals.toLocaleString()}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3>ใช้งานอยู่</h3>
          <p class="stat-number success">{stats.activeHospitals.toLocaleString()}</p>
        </div>
      </div>

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
          <h3>มีผู้ใช้งาน</h3>
          <p class="stat-number info">{stats.withUsers.toLocaleString()}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3>ผู้ป่วยทั้งหมด</h3>
          <p class="stat-number primary">{stats.totalPatients.toLocaleString()}</p>
        </div>
      </div>
    </div>
  {:else if statsLoading}
    <div class="stats-grid">
      {#each Array(4) as _}
        <div class="stat-card skeleton">
          <div class="stat-icon skeleton-item"></div>
          <div class="stat-content">
            <div class="skeleton-text"></div>
            <div class="skeleton-number"></div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Filters -->
  <div class="filters-section">
    <div class="search-box">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        type="text"
        placeholder="ค้นหาโรงพยาบาล รหัส หรือประเภท..."
        bind:value={filters.search}
        on:input={handleSearch}
      />
    </div>

    <div class="filter-group">
      <select bind:value={filters.organizationType} on:change={handleFilterChange}>
        <option value="">ประเภทองค์กร: ทั้งหมด</option>
        <option value="โรงพยาบาลชุมชน">โรงพยาบาลชุมชน</option>
        <option value="โรงพยาบาลทั่วไป">โรงพยาบาลทั่วไป</option>
        <option value="โรงพยาบาลศูนย์">โรงพยาบาลศูนย์</option>
        <option value="โรงพยาบาลส่งเสริมสุขภาพตำบล">โรงพยาบาลส่งเสริมสุขภาพตำบล</option>
      </select>

      <select bind:value={filters.isActive} on:change={handleFilterChange}>
        <option value={true}>สถานะ: ใช้งาน</option>
        <option value={false}>สถานะ: ไม่ใช้งาน</option>
        <option value={undefined}>สถานะ: ทั้งหมด</option>
      </select>

      <select bind:value={filters.limit} on:change={handleFilterChange}>
        <option value={10}>แสดง 10 รายการ</option>
        <option value={20}>แสดง 20 รายการ</option>
        <option value={50}>แสดง 50 รายการ</option>
        <option value={100}>แสดง 100 รายการ</option>
      </select>
    </div>
  </div>

  <!-- Error Display -->
  {#if error}
    <div class="alert alert-error">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      {error}
    </div>
  {/if}

  <!-- Loading State -->
  {#if isLoading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>กำลังโหลดข้อมูลโรงพยาบาล...</p>
    </div>
  {:else}
    <!-- Desktop Table -->
    <div class="table-container hidden md:block">
      <table class="data-table">
        <thead>
          <tr>
            <th class="sortable" on:click={() => handleSort('hospitalCode5Digit')}>
              รหัส รพ.
              {#if filters.sortBy === 'hospitalCode5Digit'}
                <svg class="sort-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  {#if filters.sortOrder === 'asc'}
                    <polyline points="18,15 12,9 6,15"/>
                  {:else}
                    <polyline points="6,9 12,15 18,9"/>
                  {/if}
                </svg>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('hospitalName')}>
              ชื่อโรงพยาบาล
              {#if filters.sortBy === 'hospitalName'}
                <svg class="sort-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  {#if filters.sortOrder === 'asc'}
                    <polyline points="18,15 12,9 6,15"/>
                  {:else}
                    <polyline points="6,9 12,15 18,9"/>
                  {/if}
                </svg>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('organizationType')}>
              ประเภทองค์กร
              {#if filters.sortBy === 'organizationType'}
                <svg class="sort-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  {#if filters.sortOrder === 'asc'}
                    <polyline points="18,15 12,9 6,15"/>
                  {:else}
                    <polyline points="6,9 12,15 18,9"/>
                  {/if}
                </svg>
              {/if}
            </th>
            <th>ผู้ใช้งาน</th>
            <th>ผู้ป่วย</th>
            <th>สถานะ</th>
            {#if role.isSuperuser}
              <th>จัดการ</th>
            {/if}
          </tr>
        </thead>
        <tbody>
          {#each hospitals as hospital}
            <tr>
              <td>
                <span class="hospital-code">{hospital.hospitalCode5Digit}</span>
              </td>
              <td>
                <div class="hospital-name">
                  <span class="name">{hospital.hospitalName || 'ไม่ระบุชื่อ'}</span>
                  {#if hospital.affiliation}
                    <span class="affiliation">{hospital.affiliation}</span>
                  {/if}
                </div>
              </td>
              <td>
                <span class="org-type">{hospital.organizationType || '-'}</span>
              </td>
              <td>
                <span class="count-badge users">
                  {hospital._count?.users || 0}
                </span>
              </td>
              <td>
                <span class="count-badge patients">
                  {hospital._count?.patientVisits || 0}
                </span>
              </td>
              <td>
                <span class="badge {getStatusBadge(hospital.isActive)}">
                  {getStatusText(hospital.isActive)}
                </span>
              </td>
              {#if role.isSuperuser}
                <td>
                  <div class="action-buttons">
                    <button
                      class="btn-icon btn-edit"
                      on:click={() => handleEdit(hospital.id)}
                      title="แก้ไข"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      class="btn-icon btn-delete"
                      on:click={() => handleDeleteClick(hospital)}
                      title="ลบ"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                      </svg>
                    </button>
                  </div>
                </td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>

      {#if hospitals.length === 0}
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          <h3>ไม่พบข้อมูลโรงพยาบาล</h3>
          <p>ลองปรับเปลี่ยนเงื่อนไขการค้นหา หรือเพิ่มโรงพยาบาลใหม่</p>
          {#if role.isSuperuser}
            <button class="btn btn-primary" on:click={handleCreate}>
              เพิ่มโรงพยาบาลใหม่
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Mobile Cards -->
    <div class="mobile-cards block md:hidden">
      {#each hospitals as hospital}
        <div class="hospital-card">
          <div class="card-header">
            <div class="hospital-info">
              <h3>{hospital.hospitalName || 'ไม่ระบุชื่อ'}</h3>
              <span class="hospital-code">รหัส: {hospital.hospitalCode5Digit}</span>
            </div>
            <span class="badge {getStatusBadge(hospital.isActive)}">
              {getStatusText(hospital.isActive)}
            </span>
          </div>
          
          <div class="card-body">
            <div class="info-row">
              <span class="label">ประเภทองค์กร:</span>
              <span class="value">{hospital.organizationType || '-'}</span>
            </div>
            
            {#if hospital.affiliation}
              <div class="info-row">
                <span class="label">สังกัด:</span>
                <span class="value">{hospital.affiliation}</span>
              </div>
            {/if}
            
            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-label">ผู้ใช้งาน</span>
                <span class="stat-value users">{hospital._count?.users || 0}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">ผู้ป่วย</span>
                <span class="stat-value patients">{hospital._count?.patientVisits || 0}</span>
              </div>
            </div>
          </div>
          
          {#if role.isSuperuser}
            <div class="card-actions">
              <button
                class="btn btn-secondary btn-sm"
                on:click={() => handleEdit(hospital.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                แก้ไข
              </button>
              <button
                class="btn btn-danger btn-sm"
                on:click={() => handleDeleteClick(hospital)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                </svg>
                ลบ
              </button>
            </div>
          {/if}
        </div>
      {/each}

      {#if hospitals.length === 0}
        <div class="empty-state-mobile">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          <h4>ไม่พบข้อมูลโรงพยาบาล</h4>
          <p>ลองปรับเปลี่ยนเงื่อนไขการค้นหา</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Pagination -->
  {#if pagination && pagination.pages > 1}
    <div class="pagination">
      <button
        class="btn btn-secondary"
        disabled={!pagination.hasPrev}
        on:click={() => handlePageChange(pagination.page - 1)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="15,18 9,12 15,6"/>
        </svg>
        ก่อนหน้า
      </button>

      <div class="page-info">
        หน้า {pagination.page} จาก {pagination.pages}
        <span class="total-info">({pagination.total.toLocaleString()} รายการ)</span>
      </div>

      <button
        class="btn btn-secondary"
        disabled={!pagination.hasNext}
        on:click={() => handlePageChange(pagination.page + 1)}
      >
        ถัดไป
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="9,18 15,12 9,6"/>
        </svg>
      </button>
    </div>
  {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && hospitalToDelete}
  <div class="modal-overlay" on:click={cancelDelete}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>ยืนยันการลบโรงพยาบาล</h3>
        <button class="btn-close" on:click={cancelDelete}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="warning-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <p>คุณแน่ใจหรือไม่ที่จะลบโรงพยาบาล:</p>
        <p class="hospital-name-highlight">"{hospitalToDelete.name}"</p>
        <p class="warning-text">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
      </div>
      
      <div class="modal-actions">
        <button class="btn btn-secondary" on:click={cancelDelete} disabled={isDeleting}>
          ยกเลิก
        </button>
        <button class="btn btn-danger" on:click={confirmDelete} disabled={isDeleting}>
          {#if isDeleting}
            <div class="spinner small"></div>
            กำลังลบ...
          {:else}
            ลบโรงพยาบาล
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
<style>
  /* CSS Variables */
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
  }

  /* Layout */
  .hospital-list {
    min-height: 100vh;
    background: var(--background);
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Header */
  .page-header {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-title h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .header-title p {
    color: var(--text-secondary);
    font-size: 14px;
  }

  /* Statistics Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    background: rgba(22, 160, 133, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
  }

  .stat-content h3 {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  .stat-number {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .stat-number.success { color: var(--success); }
  .stat-number.info { color: var(--info); }
  .stat-number.primary { color: var(--primary); }

  /* Skeleton Loading */
  .skeleton {
    opacity: 0.7;
  }

  .skeleton-item {
    background: var(--gray-200);
    animation: pulse 1.5s ease-in-out infinite;
  }

  .skeleton-text {
    height: 14px;
    background: var(--gray-200);
    border-radius: 4px;
    margin-bottom: 8px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .skeleton-number {
    height: 24px;
    background: var(--gray-200);
    border-radius: 4px;
    width: 60%;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Filters */
  .filters-section {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .search-box {
    position: relative;
    margin-bottom: 16px;
  }

  .search-box svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
  }

  .search-box input {
    width: 100%;
    padding: 12px 12px 12px 40px;
    border: 1px solid var(--gray-300);
    border-radius: 8px;
    font-size: 16px;
  }

  .filter-group {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .filter-group select {
    padding: 8px 12px;
    border: 1px solid var(--gray-300);
    border-radius: 8px;
    font-size: 14px;
    min-width: 160px;
  }

  /* Table */
  .table-container {
    background: var(--card-bg);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th {
    background: var(--gray-100);
    padding: 16px;
    text-align: left;
    font-weight: 600;
    color: var(--text-primary);
    border-bottom: 1px solid var(--gray-200);
  }

  .data-table th.sortable {
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .data-table th.sortable:hover {
    background: var(--gray-200);
  }

  .sort-icon {
    opacity: 0.6;
  }

  .data-table td {
    padding: 16px;
    border-bottom: 1px solid var(--gray-200);
    vertical-align: top;
  }

  .data-table tr:hover {
    background: var(--gray-100);
  }

  /* Table Content */
  .hospital-code {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: var(--primary);
  }

  .hospital-name .name {
    font-weight: 500;
    color: var(--text-primary);
    display: block;
  }

  .hospital-name .affiliation {
    font-size: 12px;
    color: var(--text-secondary);
    display: block;
    margin-top: 2px;
  }

  .org-type {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 24px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .count-badge.users {
    background: rgba(52, 152, 219, 0.1);
    color: var(--info);
  }

  .count-badge.patients {
    background: rgba(22, 160, 133, 0.1);
    color: var(--primary);
  }

  /* Badges */
  .badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
  }

  .badge-success {
    background: rgba(39, 174, 96, 0.1);
    color: var(--success);
  }

  .badge-danger {
    background: rgba(231, 76, 60, 0.1);
    color: var(--danger);
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .btn-icon {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .btn-edit {
    background: rgba(52, 152, 219, 0.1);
    color: var(--info);
  }

  .btn-edit:hover {
    background: rgba(52, 152, 219, 0.2);
  }

  .btn-delete {
    background: rgba(231, 76, 60, 0.1);
    color: var(--danger);
  }

  .btn-delete:hover {
    background: rgba(231, 76, 60, 0.2);
  }

  /* Mobile Cards */
  .mobile-cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .hospital-card {
    background: var(--card-bg);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .card-header {
    padding: 16px;
    border-bottom: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .hospital-info h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .hospital-info .hospital-code {
    font-size: 12px;
    color: var(--text-secondary);
    font-family: 'Courier New', monospace;
  }

  .card-body {
    padding: 16px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .info-row .label {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .info-row .value {
    font-size: 14px;
    color: var(--text-primary);
  }

  .stats-row {
    display: flex;
    gap: 24px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--gray-200);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-label {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 18px;
    font-weight: 600;
  }

  .stat-value.users {
    color: var(--info);
  }

  .stat-value.patients {
    color: var(--primary);
  }

  .card-actions {
    padding: 16px;
    border-top: 1px solid var(--gray-200);
    display: flex;
    gap: 8px;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    min-height: 44px;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover {
    background: #128a71;
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
    padding: 6px 12px;
    font-size: 12px;
    min-height: 32px;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 64px 24px;
    color: var(--text-secondary);
  }

  .empty-state svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state h3 {
    font-size: 18px;
    margin-bottom: 8px;
    color: var(--text-primary);
  }

  .empty-state p {
    margin-bottom: 24px;
  }

  .empty-state-mobile {
    text-align: center;
    padding: 48px 24px;
    color: var(--text-secondary);
  }

  .empty-state-mobile svg {
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .empty-state-mobile h4 {
    font-size: 16px;
    margin-bottom: 8px;
    color: var(--text-primary);
  }

  /* Pagination */
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--card-bg);
    border-radius: 12px;
    padding: 16px 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .page-info {
    font-size: 14px;
    color: var(--text-primary);
  }

  .total-info {
    color: var(--text-secondary);
    font-size: 12px;
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
    padding: 16px;
  }

  .modal {
    background: var(--card-bg);
    border-radius: 12px;
    max-width: 400px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  }

  .modal-header {
    padding: 20px;
    border-bottom: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .btn-close {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
  }

  .btn-close:hover {
    background: var(--gray-100);
  }

  .modal-body {
    padding: 20px;
    text-align: center;
  }

  .warning-icon {
    margin-bottom: 16px;
  }

  .warning-icon svg {
    color: var(--warning);
  }

  .modal-body p {
    margin-bottom: 12px;
    color: var(--text-primary);
  }

  .hospital-name-highlight {
    font-weight: 600;
    color: var(--primary);
    font-size: 16px;
  }

  .warning-text {
    color: var(--danger);
    font-size: 14px;
    font-weight: 500;
  }

  .modal-actions {
    padding: 20px;
    border-top: 1px solid var(--gray-200);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  /* Loading */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    color: var(--text-secondary);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--gray-200);
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  .spinner.small {
    width: 16px;
    height: 16px;
    border-width: 2px;
    margin-bottom: 0;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Alert */
  .alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    font-size: 14px;
  }

  .alert-error {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.2);
    color: var(--danger);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hospital-list {
      padding: 16px;
    }

    .page-header {
      padding: 16px;
    }

    .header-content {
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .filters-section {
      padding: 16px;
    }

    .filter-group {
      flex-direction: column;
    }

    .filter-group select {
      min-width: auto;
    }

    .pagination {
      padding: 12px 16px;
      flex-direction: column;
      gap: 8px;
      text-align: center;
    }

    .modal {
      margin: 16px;
    }

    .modal-actions {
      flex-direction: column;
    }
  }

  @media (max-width: 640px) {
    .card-actions {
      flex-direction: column;
    }

    .stats-row {
      justify-content: space-around;
    }
  }

  /* Utility Classes */
  .hidden {
    display: none;
  }

  .block {
    display: block;
  }

  @media (min-width: 768px) {
    .md\:block {
      display: block;
    }

    .md\:hidden {
      display: none;
    }
  }
</style>