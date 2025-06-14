<!-- frontend/src/lib/components/patients/PatientList.svelte -->
<!-- 📋 Patient List Component - ตาราง + ค้นหา + กรอง + pagination -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { patientStore, patientActions, patientList, patientFilters, selectedPatients, patientStats } from '$lib/stores/patientStore';
  import { formatDate, formatPhoneNumber, formatIdCard, debounce } from '$lib/api/patients/client';
  import type { PatientQueryParams } from '$lib/api/patients/client';

  // ========== PROPS ==========
  export let showStats = true;
  export let allowBulkActions = true;
  export let allowExport = true;

  // ========== STATE ==========
  let searchTerm = '';
  let selectedDisease: number | undefined = undefined;
  let selectedHospital = '';
  let selectedGender: 'M' | 'F' | undefined = undefined;
  let selectedCondition = '';
  let dateFrom = '';
  let dateTo = '';

  // Reference data
  let diseases: Array<{id: number, thaiName: string}> = [];
  let hospitals: Array<{hospitalCode5Digit: string, hospitalName: string}> = [];

  // UI states
  let showAdvancedFilter = false;
  let isExporting = false;

  // ========== REACTIVE STATEMENTS ==========
  $: filteredCount = $patientList.patients.length;
  $: totalCount = $patientList.pagination.total;
  $: hasSelection = $selectedPatients.selectedCount > 0;

  // ========== DEBOUNCED SEARCH ==========
  const debouncedSearch = debounce((term: string) => {
    patientActions.searchPatients(term);
  }, 500);

  $: if (searchTerm !== $patientFilters.filters.search) {
    debouncedSearch(searchTerm);
  }

  // ========== LIFECYCLE ==========
  onMount(async () => {
    // Load initial data
    await patientActions.loadPatients();
    
    // Load reference data (จะต้องเพิ่ม API calls เหล่านี้)
    // diseases = await loadDiseases();
    // hospitals = await loadHospitals();
  });

  // ========== FUNCTIONS ==========

  /**
   * 🔍 Apply advanced filters
   */
  async function applyFilters() {
    const filters: Partial<PatientQueryParams> = {};
    
    if (selectedDisease) filters.diseaseId = selectedDisease;
    if (selectedHospital) filters.hospitalCode = selectedHospital;
    if (selectedGender) filters.gender = selectedGender;
    if (selectedCondition) filters.patientCondition = selectedCondition;
    if (dateFrom) filters.illnessDateFrom = dateFrom;
    if (dateTo) filters.illnessDateTo = dateTo;

    await patientActions.applyFilters(filters);
  }

  /**
   * 🧹 Clear all filters
   */
  async function clearFilters() {
    searchTerm = '';
    selectedDisease = undefined;
    selectedHospital = '';
    selectedGender = undefined;
    selectedCondition = '';
    dateFrom = '';
    dateTo = '';
    
    await patientActions.applyFilters({});
  }

  /**
   * 🔄 Change sorting
   */
  async function handleSort(field: string) {
    const currentSort = $patientFilters.sorting;
    const newOrder = currentSort.sortBy === field && currentSort.sortOrder === 'asc' ? 'desc' : 'asc';
    await patientActions.changeSorting(field, newOrder);
  }

  /**
   * 📄 Handle pagination
   */
  async function handlePageChange(newPage: number) {
    await patientActions.changePage(newPage);
  }

  /**
   * 🎯 Handle row selection
   */
  function handleRowSelect(patientId: number, checked: boolean) {
    if (checked) {
      patientActions.togglePatientSelection(patientId);
    } else {
      patientActions.togglePatientSelection(patientId);
    }
  }

  /**
   * 🎯 Handle select all
   */
  function handleSelectAll(checked: boolean) {
    if (checked) {
      patientActions.selectAllPatients();
    } else {
      patientActions.clearSelection();
    }
  }

  /**
   * 📤 Handle export
   */
  async function handleExport(format: 'csv' | 'excel') {
    isExporting = true;
    try {
      // จะเพิ่ม export logic ที่นี่
      console.log('Exporting as', format);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      isExporting = false;
    }
  }

  /**
   * 👁️ View patient details
   */
  function viewPatient(patientId: number) {
    patientActions.openViewModal(patientId);
  }

  /**
   * ✏️ Edit patient
   */
  function editPatient(patientId: number) {
    patientActions.openEditModal(patientId);
  }

  /**
   * 🗑️ Delete patient
   */
  function deletePatient(patientId: number) {
    patientActions.openDeleteConfirm(patientId);
  }

  /**
   * 📊 Get condition badge class
   */
  function getConditionBadgeClass(condition: string | null): string {
    switch (condition) {
      case 'ยังรักษาตัวอยู่':
        return 'bg-blue-100 text-blue-800';
      case 'หายจากโรคแล้ว':
        return 'bg-green-100 text-green-800';
      case 'เสียชีวิต':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<!-- ========== TEMPLATE ========== -->
<div class="patient-list-container space-y-6">
  
  <!-- ========== STATS SECTION ========== -->
  {#if showStats}
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div class="bg-white p-4 rounded-lg shadow-sm border">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">ผู้ป่วยทั้งหมด</p>
          <p class="text-2xl font-bold text-gray-900">{$patientStats.total.toLocaleString()}</p>
        </div>
        <div class="p-3 bg-blue-100 rounded-full">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
      </div>
    </div>

    <div class="bg-white p-4 rounded-lg shadow-sm border">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">ชาย/หญิง</p>
          <p class="text-lg font-semibold text-gray-900">
            {$patientStats.byGender.male}/{$patientStats.byGender.female}
          </p>
        </div>
        <div class="p-3 bg-purple-100 rounded-full">
          <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
      </div>
    </div>

    <div class="bg-white p-4 rounded-lg shadow-sm border">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">ยังรักษา</p>
          <p class="text-2xl font-bold text-blue-600">{$patientStats.byCondition.active}</p>
        </div>
        <div class="p-3 bg-blue-100 rounded-full">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        </div>
      </div>
    </div>

    <div class="bg-white p-4 rounded-lg shadow-sm border">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">หายแล้ว</p>
          <p class="text-2xl font-bold text-green-600">{$patientStats.byCondition.recovered}</p>
        </div>
        <div class="p-3 bg-green-100 rounded-full">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>
    </div>
  </div>
  {/if}

  <!-- ========== SEARCH & FILTER SECTION ========== -->
  <div class="bg-white p-6 rounded-lg shadow-sm border space-y-4">
    
    <!-- Search Bar -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="flex-1">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="ค้นหาชื่อผู้ป่วย, เลขบัตรประชาชน, HN, เบอร์โทร..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div class="flex gap-2">
        <button
          type="button"
          on:click={() => showAdvancedFilter = !showAdvancedFilter}
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
        >
          <svg class="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"></path>
          </svg>
          กรองข้อมูล
        </button>

        {#if allowExport}
        <div class="relative">
          <button
            type="button"
            disabled={isExporting}
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {#if isExporting}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {:else}
              <svg class="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            {/if}
            ส่งออกข้อมูล
          </button>
        </div>
        {/if}
      </div>
    </div>

    <!-- Advanced Filters -->
    {#if showAdvancedFilter}
    <div class="border-t pt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">โรค</label>
        <select bind:value={selectedDisease} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
          <option value={undefined}>ทุกโรค</option>
          {#each diseases as disease}
            <option value={disease.id}>{disease.thaiName}</option>
          {/each}
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">โรงพยาบาล</label>
        <select bind:value={selectedHospital} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
          <option value="">ทุกโรงพยาบาล</option>
          {#each hospitals as hospital}
            <option value={hospital.hospitalCode5Digit}>{hospital.hospitalName}</option>
          {/each}
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">เพศ</label>
        <select bind:value={selectedGender} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
          <option value={undefined}>ทุกเพศ</option>
          <option value="M">ชาย</option>
          <option value="F">หญิง</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">สภาพผู้ป่วย</label>
        <select bind:value={selectedCondition} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
          <option value="">ทุกสภาพ</option>
          <option value="ยังรักษาตัวอยู่">ยังรักษาตัวอยู่</option>
          <option value="หายจากโรคแล้ว">หายจากโรคแล้ว</option>
          <option value="เสียชีวิต">เสียชีวิต</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">วันที่เจ็บป่วย (จาก)</label>
        <input
          type="date"
          bind:value={dateFrom}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">วันที่เจ็บป่วย (ถึง)</label>
        <input
          type="date"
          bind:value={dateTo}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div class="md:col-span-3 lg:col-span-6 flex gap-2">
        <button
          type="button"
          on:click={applyFilters}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
        >
          ใช้ตัวกรอง
        </button>
        <button
          type="button"
          on:click={clearFilters}
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
        >
          ล้างตัวกรอง
        </button>
      </div>
    </div>
    {/if}
  </div>

  <!-- ========== BULK ACTIONS ========== -->
  {#if allowBulkActions && hasSelection}
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <span class="text-sm font-medium text-blue-800">
          เลือกแล้ว {$selectedPatients.selectedCount} รายการ
        </span>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          on:click={() => handleExport('excel')}
          class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
        >
          ส่งออกที่เลือก
        </button>
        <button
          type="button"
          on:click={patientActions.clearSelection}
          class="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
        >
          ยกเลิกการเลือก
        </button>
      </div>
    </div>
  </div>
  {/if}

  <!-- ========== DATA TABLE ========== -->
  <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
    
    {#if $patientList.loading}
      <!-- Loading State -->
      <div class="p-8 text-center">
        <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-gray-500 mt-2">กำลังโหลดข้อมูล...</p>
      </div>
    
    {:else if $patientList.error}
      <!-- Error State -->
      <div class="p-8 text-center">
        <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <p class="text-red-600 font-medium">เกิดข้อผิดพลาด</p>
        <p class="text-gray-500">{$patientList.error}</p>
        <button
          type="button"
          on:click={() => patientActions.loadPatients()}
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          ลองใหม่
        </button>
      </div>
    
    {:else if $patientList.patients.length === 0}
      <!-- Empty State -->
      <div class="p-8 text-center">
        <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-4.172a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H4"></path>
        </svg>
        <p class="text-gray-500 font-medium">ไม่พบข้อมูลผู้ป่วย</p>
        <p class="text-gray-400">ลองเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่มข้อมูลใหม่</p>
      </div>
    
    {:else}
      <!-- Data Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              {#if allowBulkActions}
              <th class="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={$selectedPatients.selectedCount > 0 && $selectedPatients.selectedCount === $patientList.patients.length}
                  on:change={(e) => handleSelectAll(e.currentTarget.checked)}
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              {/if}
              
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  on:click={() => handleSort('patientName')}>
                <div class="flex items-center">
                  ชื่อผู้ป่วย
                  <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                </div>
              </th>
              
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ข้อมูลส่วนตัว
              </th>
              
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                โรค
              </th>
              
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  on:click={() => handleSort('illnessDate')}>
                <div class="flex items-center">
                  วันที่เจ็บป่วย
                  <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                </div>
              </th>
              
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สภาพผู้ป่วย
              </th>
              
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                โรงพยาบาล
              </th>
              
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                การดำเนินการ
              </th>
            </tr>
          </thead>
          
          <tbody class="bg-white divide-y divide-gray-200">
            {#each $patientList.patients as patient (patient.id)}
            <tr class="hover:bg-gray-50">
              {#if allowBulkActions}
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={$selectedPatients.selectedIds.includes(patient.id)}
                  on:change={(e) => handleRowSelect(patient.id, e.currentTarget.checked)}
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              {/if}
              
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{patient.patientName}</div>
                {#if patient.idCardCode}
                  <div class="text-sm text-gray-500">{formatIdCard(patient.idCardCode)}</div>
                {/if}
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {#if patient.gender}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {patient.gender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}">
                      {patient.gender === 'M' ? 'ชาย' : 'หญิง'}
                    </span>
                  {/if}
                  {#if patient.ageAtIllness}
                    <span class="ml-1 text-gray-500">{patient.ageAtIllness} ปี</span>
                  {/if}
                </div>
                {#if patient.phoneNumber}
                  <div class="text-sm text-gray-500">{formatPhoneNumber(patient.phoneNumber)}</div>
                {/if}
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{patient.disease.thaiName}</div>
                {#if patient.disease.engName}
                  <div class="text-sm text-gray-500">{patient.disease.engName}</div>
                {/if}
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{formatDate(patient.illnessDate)}</div>
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getConditionBadgeClass(patient.patientCondition)}">
                  {patient.patientCondition || 'ไม่ทราบ'}
                </span>
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{patient.hospital.hospitalName || '-'}</div>
                <div class="text-sm text-gray-500">{patient.hospitalCode}</div>
              </td>
              
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2">
                  <button
                    type="button"
                    on:click={() => viewPatient(patient.id)}
                    class="text-blue-600 hover:text-blue-900"
                    title="ดูรายละเอียด">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  </button>
                  
                  <button
                    type="button"
                    on:click={() => editPatient(patient.id)}
                    class="text-green-600 hover:text-green-900"
                    title="แก้ไข">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  
                  <button
                    type="button"
                    on:click={() => deletePatient(patient.id)}
                    class="text-red-600 hover:text-red-900"
                    title="ลบ">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- ========== PAGINATION ========== -->
      <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            type="button"
            disabled={!$patientList.pagination.hasPrev}
            on:click={() => handlePageChange($patientList.pagination.page - 1)}
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ก่อนหน้า
          </button>
          <button
            type="button"
            disabled={!$patientList.pagination.hasNext}
            on:click={() => handlePageChange($patientList.pagination.page + 1)}
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ถัดไป
          </button>
        </div>
        
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              แสดง
              <span class="font-medium">{($patientList.pagination.page - 1) * $patientList.pagination.limit + 1}</span>
              ถึง
              <span class="font-medium">{Math.min($patientList.pagination.page * $patientList.pagination.limit, $patientList.pagination.total)}</span>
              จาก
              <span class="font-medium">{$patientList.pagination.total.toLocaleString()}</span>
              รายการ
            </p>
          </div>
          
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <!-- Previous button -->
              <button
                type="button"
                disabled={!$patientList.pagination.hasPrev}
                on:click={() => handlePageChange($patientList.pagination.page - 1)}
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              
              <!-- Page numbers -->
              {#each Array.from({length: Math.min(5, $patientList.pagination.pages)}, (_, i) => {
                const start = Math.max(1, $patientList.pagination.page - 2);
                return start + i;
              }) as page}
                {#if page <= $patientList.pagination.pages}
                  <button
                    type="button"
                    on:click={() => handlePageChange(page)}
                    class="relative inline-flex items-center px-4 py-2 border text-sm font-medium
                           {page === $patientList.pagination.page 
                             ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                             : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}"
                  >
                    {page}
                  </button>
                {/if}
              {/each}
              
              <!-- Next button -->
              <button
                type="button"
                disabled={!$patientList.pagination.hasNext}
                on:click={() => handlePageChange($patientList.pagination.page + 1)}
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Next</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .patient-list-container {
    @apply max-w-full mx-auto p-4;
  }
  
  /* Custom scrollbar for table */
  .overflow-x-auto::-webkit-scrollbar {
    height: 8px;
  }
  
  .overflow-x-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  .overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
</style>