<script lang="ts">
  import { onMount } from 'svelte';
  import { patientStore, patientActions, patientList, patientStats } from '$lib/stores/patientStore';
  import { userRole } from '$lib/stores/auth'; // ✅ เพิ่ม auth store
  import PatientSearch from './components/PatientSearch.svelte';
  import PatientTable from './components/PatientTable.svelte';
  import PatientFormModal from './components/PatientFormModal.svelte';
  import PatientImportExport from './components/PatientImportExport.svelte';

  // Reactive data from stores
  $: ({ patients, loading, error, pagination } = $patientList);
  $: stats = $patientStats;
  $: ({ showCreateModal, showEditModal, showViewModal } = $patientStore.ui);

  // ✅ Role-based permissions
  $: role = $userRole;
  $: canCreatePatient = role.isAdmin || role.isSuperuser;
  $: canExportData = true; // ทุก role สามารถ export ได้
  $: canImportData = role.isAdmin || role.isSuperuser;

  // Load initial data
  onMount(async () => {
    await patientActions.loadPatients();
  });

  // Handle pagination
  function handlePageChange(page: number): void {
    patientActions.changePage(page);
  }

  // Handle sorting
  function handleSort(sortBy: string, sortOrder: 'asc' | 'desc'): void {
    patientActions.changeSorting(sortBy, sortOrder);
  }

  // Modal handlers
  function openCreateModal(): void {
    patientActions.openCreateModal();
  }

  function closeModals(): void {
    patientActions.closeAllModals();
    // After closing modal, reload patients to ensure data is up-to-date
    patientActions.loadPatients();
  }
</script>

<svelte:head>
  <title>จัดการข้อมูลผู้ป่วย | ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
</svelte:head>

<div class="patient-list">
  <div class="page-header">
    <div class="header-content">
      <div class="header-title">
        <h1>จัดการข้อมูลผู้ป่วย</h1>
        <p>ระบบบันทึกและติดตามผู้ป่วยโรคติดต่อโดยแมลง</p>
      </div>
      
      <!-- ✅ แสดงปุ่มเฉพาะ ADMIN/SUPERUSER -->
      {#if canCreatePatient}
        <button class="btn btn-primary" on:click={openCreateModal}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          เพิ่มผู้ป่วยใหม่
        </button>
      {/if}
    </div>
  </div>

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
        <h3>ผู้ป่วยทั้งหมด</h3>
        <p class="stat-number">{stats.total.toLocaleString()}</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <polyline points="17 11 19 13 23 9"/>
        </svg>
      </div>
      <div class="stat-content">
        <h3>ชาย</h3>
        <p class="stat-number info">{stats.byGender.male.toLocaleString()}</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <path d="M18 8h-1a4 4 0 0 1-4-4V3"/>
          <path d="M22 12h-1a4 4 0 0 1-4-4V7"/>
        </svg>
      </div>
      <div class="stat-content">
        <h3>หญิง</h3>
        <p class="stat-number primary">{stats.byGender.female.toLocaleString()}</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div class="stat-content">
        <h3>รักษาอยู่</h3>
        <p class="stat-number warning">{stats.byCondition.active.toLocaleString()}</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <div class="stat-content">
        <h3>หายแล้ว</h3>
        <p class="stat-number success">{stats.byCondition.recovered.toLocaleString()}</p>
      </div>
    </div>
  </div>

  <PatientSearch />

  <!-- ✅ ส่ง role ไปยัง ImportExport component -->
  {#if canExportData}
    <div class="action-section">
      <PatientImportExport {canImportData} />
    </div>
  {/if}

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

  <div class="table-section">
    {#if loading}
      <div class="loading-container">
        <div class="spinner"></div>
        <p>กำลังโหลดข้อมูลผู้ป่วย...</p>
      </div>
    {:else}
      <!-- ✅ ส่ง role ไปยัง PatientTable -->
      <PatientTable 
        {patients} 
        {pagination}
        {canCreatePatient}
        on:pageChange={(e) => handlePageChange(e.detail)}
        on:sort={(e) => handleSort(e.detail.sortBy, e.detail.sortOrder)}
      />
    {/if}
  </div>

  <!-- ✅ แสดง Modal เฉพาะเมื่อมีสิทธิ์ -->
  {#if canCreatePatient && (showCreateModal || showEditModal)}
    <PatientFormModal 
      mode={showCreateModal ? 'create' : 'edit'}
      on:close={closeModals}
    />
  {/if}
</div>

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
  .patient-list {
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
    background: rgba(22, 160, 133, 0.1); /* Default icon background */
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary); /* Default icon color */
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

  /* Specific stat-number colors */
  .stat-number.success { color: var(--success); }
  .stat-number.info { color: var(--info); }
  .stat-number.warning { color: var(--warning); } /* Added for 'รักษาอยู่' */
  .stat-number.primary { color: var(--primary); }

  /* Action Section */
  .action-section {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap; /* Allow wrapping on small screens */
    justify-content: flex-start; /* Align items to start */
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

  /* Loading State */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    color: var(--text-secondary);
    background: var(--card-bg); /* Add background for loading container */
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Alert (Error Display) */
  .alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px; /* Consistent margin */
    font-size: 14px;
  }

  .alert-error {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.2);
    color: var(--danger);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .patient-list {
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

    .action-section {
      flex-direction: column;
      align-items: stretch;
    }

    .btn {
      width: 100%; /* Make buttons full width on small screens */
    }
  }

  @media (max-width: 640px) {
    .stat-card {
      flex-direction: column;
      text-align: center;
    }
    .stat-icon {
      margin-bottom: 8px;
    }
  }
</style>