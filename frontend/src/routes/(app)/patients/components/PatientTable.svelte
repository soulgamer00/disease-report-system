<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { patientActions } from '$lib/stores/patientStore';
  import { formatIdCard } from '$lib/api/patients/client';
  import type { Patient } from '$lib/api/patients/client';

  export let patients: Patient[];
  export let pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  export let canCreatePatient: boolean; // ✅ เพิ่ม prop สำหรับ role check

  const dispatch = createEventDispatcher<{
    pageChange: number;
    sort: { sortBy: string; sortOrder: 'asc' | 'desc' };
  }>();

  // Sorting state
  let currentSort = { field: 'patientName', order: 'asc' as 'asc' | 'desc' };

  // ✅ FIXED: Format date to Thai format (DD/MM/YYYY)
  function formatDate(dateString: string): string {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return '-';
      
      // Format to DD/MM/YYYY (Thai format)
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '-';
    }
  }

  // Handle column sort
  function handleSort(field: string): void {
    const newOrder = (currentSort.field === field && currentSort.order === 'asc') ? 'desc' : 'asc';
    currentSort = { field, order: newOrder };
    dispatch('sort', { sortBy: field, sortOrder: newOrder });
  }

  // Handle pagination
  function goToPage(page: number): void {
    if (page >= 1 && page <= pagination.pages) {
      dispatch('pageChange', page);
    }
  }

  // Patient actions
  function viewPatient(patientId: number): void {
    patientActions.openViewModal(patientId);
  }

  function editPatient(patientId: number): void {
    patientActions.openEditModal(patientId);
  }

  function deletePatient(patientId: number): void {
    patientActions.openDeleteConfirm(patientId);
  }

  // Format condition display
  function formatCondition(condition: string | null): string {
    switch (condition) {
      case 'ยังรักษาตัวอยู่': return 'ยังรักษาตัวอยู่';
      case 'หายจากโรคแล้ว': return 'หายจากโรคแล้ว';
      case 'เสียชีวิต': return 'เสียชีวิต';
      case 'ไม่ทราบ': return 'ไม่ทราบ';
      default: return condition || '-';
    }
  }

  // Get status badge class based on condition
  function getConditionBadge(condition: string | null) {
    switch (condition) {
      case 'ยังรักษาตัวอยู่': return 'badge-hold';
      case 'หายจากโรคแล้ว': return 'badge-success';
      case 'เสียชีวิต': return 'badge-danger';
      case 'ไม่ทราบ': return 'badge-no';
      default: return '';
    }
  }

  // Format gender display
  function formatGender(gender: string | null): string {
    switch (gender) {
      case 'M': return 'ชาย';
      case 'F': return 'หญิง';
      default: return gender || '-';
    }
  }

  // Generate page numbers for pagination
  function getPageNumbers(): number[] {
    const pages: number[] = [];
    const current = pagination.page;
    const total = pagination.pages;
    
    // Show first page
    if (current > 3) pages.push(1);
    
    // Show ellipsis if needed
    if (current > 4) pages.push(-1);
    
    // Show pages around current
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      pages.push(i);
    }
    
    // Show ellipsis if needed
    if (current < total - 3) pages.push(-2);
    
    // Show last page
    if (current < total - 2) pages.push(total);
    
    return pages;
  }

  $: pageNumbers = getPageNumbers();
</script>

<div class="table-container">
  <div class="data-table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th class="sortable" on:click={() => handleSort('patientName')}>
            ชื่อผู้ป่วย
            {#if currentSort.field === 'patientName'}
              <svg class="sort-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                {#if currentSort.order === 'asc'}
                  <polyline points="18,15 12,9 6,15"/>
                {:else}
                  <polyline points="6,9 12,15 18,9"/>
                {/if}
              </svg>
            {/if}
          </th>
          <th>เลขบัตรประชาชน</th>
          <th>เพศ / อายุ</th>
          <th>โรค</th>
          <th>โรงพยาบาล</th>
          <th class="sortable" on:click={() => handleSort('illnessDate')}>
            วันที่เจ็บป่วย
            {#if currentSort.field === 'illnessDate'}
              <svg class="sort-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                {#if currentSort.order === 'asc'}
                  <polyline points="18,15 12,9 6,15"/>
                {:else}
                  <polyline points="6,9 12,15 18,9"/>
                {/if}
              </svg>
            {/if}
          </th>
          <th>สภาพผู้ป่วย</th>
          <th>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        {#each patients as patient (patient.id)}
          <tr>
            <td>
              <div class="patient-name-display">
                <span class="name">{patient.patientName}</span>
                {#if patient.patientHn}
                  <span class="hn-code">HN: {patient.patientHn}</span>
                {/if}
              </div>
            </td>
            <td>
              <span class="id-card-code">{patient.idCardCode ? formatIdCard(patient.idCardCode) : '-'}</span>
            </td>
            <td>
              <span class="gender-text">{formatGender(patient.gender)}</span>
              {#if patient.ageAtIllness}
                <span class="age-text">({patient.ageAtIllness} ปี)</span>
              {/if}
            </td>
            <td>
              <div class="disease-info">
                <span class="main-disease">{patient.disease.thaiName}</span>
                {#if patient.disease.engName}
                  <span class="sub-disease">{patient.disease.engName}</span>
                {/if}
              </div>
            </td>
            <td>
              <div class="hospital-info">
                <span class="hospital-name-text">{patient.hospital.hospitalName || 'ไม่ระบุชื่อ'}</span>
                {#if patient.hospitalCode}
                  <span class="hospital-code-text">{patient.hospitalCode}</span>
                {/if}
              </div>
            </td>
            <td>
              <span class="date-text">{formatDate(patient.illnessDate)}</span>
            </td>
            <td>
              <span class="badge {getConditionBadge(patient.patientCondition)}">
                {formatCondition(patient.patientCondition)}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <!-- ✅ ทุกคนดูได้ -->
                <button
                  class="btn-icon btn-view"
                  on:click={() => viewPatient(patient.id)}
                  title="ดูรายละเอียด"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                
                <!-- ✅ เฉพาะ ADMIN/SUPERUSER แก้ไขได้ -->
                {#if canCreatePatient}
                  <button
                    class="btn-icon btn-edit"
                    on:click={() => editPatient(patient.id)}
                    title="แก้ไข"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    class="btn-icon btn-delete"
                    on:click={() => deletePatient(patient.id)}
                    title="ลบ"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                    </svg>
                  </button>
                {/if}
              </div>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="8" class="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              <h3>ไม่พบข้อมูลผู้ป่วย</h3>
              <p>ลองปรับเปลี่ยนเงื่อนไขการค้นหา หรือเพิ่มผู้ป่วยใหม่</p>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if pagination.pages > 1}
    <div class="pagination">
      <button
        class="btn btn-secondary"
        disabled={!pagination.hasPrev}
        on:click={() => goToPage(pagination.page - 1)}
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
        on:click={() => goToPage(pagination.page + 1)}
      >
        ถัดไป
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="9,18 15,12 9,6"/>
        </svg>
      </button>
    </div>
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

  /* Table Container */
  .table-container {
    background: var(--card-bg);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;
  }

  .data-table-wrapper {
    overflow-x: auto;
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
    white-space: nowrap; /* Prevent header text from wrapping */
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

  /* Table Content Styles */
  .patient-name-display .name {
    font-weight: 500;
    color: var(--text-primary);
    display: block;
  }

  .patient-name-display .hn-code {
    font-size: 12px;
    color: var(--text-secondary);
    display: block;
    margin-top: 2px;
  }

  .id-card-code {
    font-family: 'Courier New', monospace;
    color: var(--text-primary);
    font-weight: 500;
  }

  .gender-text {
    font-weight: 500;
    color: var(--text-primary);
  }

  .age-text {
    font-size: 12px;
    color: var(--text-secondary);
    margin-left: 4px;
  }

  .disease-info .main-disease {
    font-weight: 500;
    color: var(--text-primary);
    display: block;
  }

  .disease-info .sub-disease {
    font-size: 12px;
    color: var(--text-secondary);
    display: block;
    margin-top: 2px;
  }

  .hospital-info .hospital-name-text {
    font-weight: 500;
    color: var(--text-primary);
    display: block;
  }

  .hospital-info .hospital-code-text {
    font-size: 12px;
    color: var(--text-secondary);
    display: block;
    margin-top: 2px;
  }

  .date-text {
    white-space: nowrap;
    color: var(--text-primary);
    font-size: 14px;
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
  .badge-hold {
    background: rgba(244, 247, 106, 0.1);
    color: var(--success);
  }

  .badge-danger {
    background: rgba(231, 76, 60, 0.1);
    color: var(--danger);
  }
  .badge-no{
    background: rgba(80, 79, 79, 0.1);
    color: var(--danger);
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    gap: 8px;
    white-space: nowrap; /* Prevent buttons from wrapping */
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

  .btn-icon.btn-view {
    background: rgba(52, 152, 219, 0.1); /* info color */
    color: var(--info);
  }

  .btn-icon.btn-view:hover {
    background: rgba(52, 152, 219, 0.2);
  }

  .btn-icon.btn-edit {
    background: rgba(243, 156, 18, 0.1); /* warning color */
    color: var(--warning);
  }

  .btn-icon.btn-edit:hover {
    background: rgba(243, 156, 18, 0.2);
  }

  .btn-icon.btn-delete {
    background: rgba(231, 76, 60, 0.1);
    color: var(--danger);
  }

  .btn-icon.btn-delete:hover {
    background: rgba(231, 76, 60, 0.2);
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

  /* Pagination */
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--card-bg);
    border-radius: 12px; /* already set on table-container, but useful here if standalone */
    padding: 16px 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* already set on table-container */
    border-top: 1px solid var(--gray-200); /* Separator from table */
  }

  .page-info {
    font-size: 14px;
    color: var(--text-primary);
  }

  .total-info {
    color: var(--text-secondary);
    font-size: 12px;
  }

  /* Buttons - Reusing styles from hospitals/+page.svelte */
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

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .page-btn {
    background: var(--card-bg); /* Use card background for page buttons */
    border: 1px solid var(--gray-300);
    padding: 6px 12px;
    border-radius: 8px; /* More rounded */
    cursor: pointer;
    font-size: 14px;
    min-width: 40px;
    color: var(--text-primary);
    transition: all 0.15s ease;
  }

  .page-btn:hover:not(:disabled) {
    background: var(--gray-100); /* Lighter gray on hover */
    border-color: var(--primary);
  }

  .page-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-ellipsis {
    padding: 6px 8px;
    color: var(--text-secondary);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .data-table th,
    .data-table td {
      padding: 12px 8px; /* Slightly reduced padding */
      font-size: 14px;
    }
    
    .action-buttons {
      gap: 4px; /* Reduced gap for smaller buttons */
      flex-wrap: wrap; /* Allow buttons to wrap */
    }

    .btn-icon {
      width: 28px; /* Slightly smaller button size */
      height: 28px;
    }
    
    .pagination {
      flex-direction: column;
      gap: 12px;
      padding: 12px 16px; /* Reduced padding */
      text-align: center;
    }

    .pagination-controls {
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
    }
  }

  @media (max-width: 480px) {
    .data-table th,
    .data-table td {
      font-size: 13px;
      padding: 10px 6px;
    }

    .patient-name-display .name {
      font-size: 14px;
    }

    .patient-name-display .hn-code,
    .age-text,
    .disease-info .sub-disease,
    .hospital-info .hospital-code-text {
      font-size: 11px;
    }

    .badge {
      font-size: 11px;
      padding: 3px 6px;
    }

    .btn-icon {
      width: 24px; /* Even smaller button size */
      height: 24px;
    }

    .btn-icon svg {
      width: 14px; /* Smaller icon size */
      height: 14px;
    }

    .pagination .btn {
      min-height: 38px;
      padding: 6px 12px;
    }

    .page-btn {
      min-width: 36px;
      padding: 4px 10px;
    }
  }
</style>