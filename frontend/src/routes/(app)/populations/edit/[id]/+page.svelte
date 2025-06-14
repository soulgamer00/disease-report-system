<!-- src/routes/(app)/populations/edit/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { 
    populationFormState,
    accessibleHospitalsState,
    updatePopulation,
    loadPopulationById,
    loadAccessibleHospitals,
    clearPopulationFormErrors,
    validatePopulationData
  } from '$lib/stores/populationStore';
  import { authState, userRole } from '$lib/stores/auth';
  import type { UpdatePopulationData, Population } from '$lib/api/types';

  // Get population ID from URL
  $: populationId = parseInt($page.params.id);

  // Reactive subscriptions
  $: formState = $populationFormState;
  $: hospitals = $accessibleHospitalsState.hospitals;
  $: hospitalsLoading = $accessibleHospitalsState.isLoading;
  $: user = $authState.user;
  $: role = $userRole;

  // Component state
  let currentPopulation: Population | null = null;
  let formData: UpdatePopulationData = {};
  let originalData: Population | null = null;
  let isLoading = true;
  let loadError: string | null = null;

  // Form display values
  let displayYear: number | undefined;
  let displayPopulation: number | undefined;
  let displayHospitalCode = '';
  let selectedHospitalName = '';

  // Dropdown state
  let filteredHospitals: typeof hospitals = [];
  let hospitalSearchTerm = '';
  let showHospitalDropdown = false;

  // Validation
  let fieldErrors: Record<string, string> = {};
  let isFormValid = false;
  let hasChanges = false;

  onMount(async () => {
    // Check permissions
    if (!role.isAdmin && !role.isSuperuser) {
      goto('/dashboard');
      return;
    }

    // Validate population ID
    if (isNaN(populationId) || populationId <= 0) {
      goto('/populations');
      return;
    }

    try {
      // Load data in parallel
      const [population] = await Promise.all([
        loadPopulationById(populationId),
        loadAccessibleHospitals()
      ]);

      if (population) {
        currentPopulation = population;
        originalData = { ...population };
        
        // Initialize form with current values
        displayYear = population.year;
        displayPopulation = population.population;
        displayHospitalCode = population.hospitalCode;
        selectedHospitalName = population.hospital.hospitalName || population.hospitalCode;
        
        updateFilteredHospitals();
        validateForm();
      } else {
        loadError = 'ไม่พบข้อมูลประชากรที่ต้องการแก้ไข';
      }
    } catch (error) {
      console.error('Failed to load population data:', error);
      loadError = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
    } finally {
      isLoading = false;
    }
  });

  // Watch for changes to update filtered hospitals
  $: if (hospitalSearchTerm !== undefined) {
    updateFilteredHospitals();
  }

  // Check for changes
  $: if (originalData) {
    hasChanges = (
      displayYear !== originalData.year ||
      displayPopulation !== originalData.population ||
      displayHospitalCode !== originalData.hospitalCode
    );
    
    // Update form data with only changed values
    formData = {};
    if (displayYear !== originalData.year) formData.year = displayYear;
    if (displayPopulation !== originalData.population) formData.population = displayPopulation;
    if (displayHospitalCode !== originalData.hospitalCode) formData.hospitalCode = displayHospitalCode;
  }

  function updateFilteredHospitals() {
    if (!hospitalSearchTerm) {
      filteredHospitals = hospitals.slice(0, 10);
    } else {
      filteredHospitals = hospitals
        .filter(hospital => 
          hospital.hospitalName?.toLowerCase().includes(hospitalSearchTerm.toLowerCase()) ||
          hospital.hospitalCode5Digit.toLowerCase().includes(hospitalSearchTerm.toLowerCase())
        )
        .slice(0, 10);
    }
  }

  // Form validation
  function validateForm(): boolean {
    if (!displayYear || !displayPopulation || !displayHospitalCode) {
      isFormValid = false;
      return false;
    }

    const tempData = {
      year: displayYear,
      population: displayPopulation,
      hospitalCode: displayHospitalCode
    };

    const errors = validatePopulationData(tempData);
    fieldErrors = errors;
    isFormValid = Object.keys(errors).length === 0;
    
    return isFormValid;
  }

  // Hospital selection
  function selectHospital(hospital: typeof hospitals[0]) {
    displayHospitalCode = hospital.hospitalCode5Digit;
    selectedHospitalName = hospital.hospitalName || hospital.hospitalCode5Digit;
    hospitalSearchTerm = '';
    showHospitalDropdown = false;
    clearFieldError('hospitalCode');
    validateForm();
  }

  function handleHospitalSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    hospitalSearchTerm = target.value;
    showHospitalDropdown = true;
    
    if (selectedHospitalName && !selectedHospitalName.toLowerCase().includes(hospitalSearchTerm.toLowerCase())) {
      displayHospitalCode = '';
      selectedHospitalName = '';
    }
    validateForm();
  }

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      delete fieldErrors[field];
      fieldErrors = { ...fieldErrors };
    }
  }

  // Form handlers
  function handleYearChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    displayYear = parseInt(target.value);
    clearFieldError('year');
    validateForm();
  }

  function handlePopulationInput(event: Event) {
    const target = event.target as HTMLInputElement;
    displayPopulation = parseInt(target.value) || 0;
    clearFieldError('population');
    validateForm();
  }

  // Form submission
  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!validateForm() || !hasChanges) {
      return;
    }

    clearPopulationFormErrors();

    const result = await updatePopulation(populationId, formData);
    
    if (result) {
      goto('/populations');
    }
  }

  function handleCancel() {
    goto('/populations');
  }

  // Click outside handler
  function handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.hospital-selector')) {
      showHospitalDropdown = false;
    }
  }

  // Utility functions
  function formatNumber(num: number): string {
    return new Intl.NumberFormat('th-TH').format(num);
  }

  // Available years
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: 12 }, 
    (_, i) => currentYear + 1 - i
  );
</script>

<svelte:head>
  <title>แก้ไขข้อมูลประชากร - ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
</svelte:head>

<svelte:window on:click={handleClickOutside} />

<div class="population-edit-page">
  <!-- Header -->
  <header class="page-header">
    <div class="header-content">
      <div class="breadcrumb">
        <button class="breadcrumb-link" on:click={() => goto('/populations')}>
          จัดการข้อมูลประชากร
        </button>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">แก้ไขข้อมูล</span>
      </div>
      
      <div class="title-section">
        <h1>แก้ไขข้อมูลประชากร</h1>
        <p>แก้ไขข้อมูลประชากรสำหรับการคำนวณอัตราป่วยต่อแสนประชากร</p>
      </div>
    </div>
  </header>

  <!-- Loading State -->
  {#if isLoading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>กำลังโหลดข้อมูลประชากร...</p>
    </div>
  
  <!-- Error State -->
  {:else if loadError}
    <div class="error-container">
      <div class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h3>เกิดข้อผิดพลาด</h3>
      <p>{loadError}</p>
      <button class="btn btn-primary" on:click={() => goto('/populations')}>
        กลับไปหน้ารายการ
      </button>
    </div>

  <!-- Edit Form -->
  {:else if currentPopulation}
    <div class="form-container">
      <!-- Current Data Display -->
      <div class="current-data-section">
        <h2>ข้อมูลปัจจุบัน</h2>
        <div class="current-data-grid">
          <div class="data-item">
            <span class="data-label">ปี:</span>
            <span class="data-value">{currentPopulation.year}</span>
          </div>
          <div class="data-item">
            <span class="data-label">โรงพยาบาล:</span>
            <span class="data-value">
              {currentPopulation.hospital.hospitalName || 'ไม่ระบุชื่อ'}
            </span>
          </div>
          <div class="data-item">
            <span class="data-label">รหัสโรงพยาบาล:</span>
            <span class="data-value">{currentPopulation.hospitalCode}</span>
          </div>
          <div class="data-item">
            <span class="data-label">จำนวนประชากร:</span>
            <span class="data-value">{formatNumber(currentPopulation.population)} คน</span>
          </div>
          <div class="data-item">
            <span class="data-label">แก้ไขล่าสุด:</span>
            <span class="data-value">
              {new Date(currentPopulation.updatedAt).toLocaleDateString('th-TH')}
            </span>
          </div>
          <div class="data-item">
            <span class="data-label">ผู้แก้ไข:</span>
            <span class="data-value">{currentPopulation.updatedBy || 'ไม่ระบุ'}</span>
          </div>
        </div>
      </div>

      <!-- Edit Form -->
      <form class="population-form" on:submit={handleSubmit}>
        <div class="form-section">
          <h2>แก้ไขข้อมูล</h2>
          
          <div class="form-grid">
            <!-- Year Selection -->
            <div class="form-group">
              <label for="year" class="required">ปี</label>
              <select 
                id="year"
                bind:value={displayYear}
                on:change={handleYearChange}
                class:error={fieldErrors.year}
                disabled={formState.isSubmitting}
              >
                <option value="">เลือกปี</option>
                {#each availableYears as year}
                  <option value={year}>{year}</option>
                {/each}
              </select>
              {#if fieldErrors.year}
                <span class="error-message">{fieldErrors.year}</span>
              {/if}
              <span class="field-help">เลือกปีที่ต้องการบันทึกข้อมูลประชากร</span>
            </div>

            <!-- Hospital Selection -->
            <div class="form-group">
              <label for="hospital" class="required">โรงพยาบาล</label>
              <div class="hospital-selector">
                <input
                  id="hospital"
                  type="text"
                  placeholder="ค้นหาโรงพยาบาล..."
                  value={selectedHospitalName || hospitalSearchTerm}
                  on:input={handleHospitalSearch}
                  on:focus={() => showHospitalDropdown = true}
                  class:error={fieldErrors.hospitalCode}
                  disabled={formState.isSubmitting}
                  autocomplete="off"
                />
                
                {#if showHospitalDropdown}
                  <div class="hospital-dropdown">
                    {#if hospitalsLoading}
                      <div class="dropdown-loading">
                        <div class="spinner"></div>
                        <span>กำลังโหลดรายชื่อโรงพยาบาล...</span>
                      </div>
                    {:else if filteredHospitals.length > 0}
                      {#each filteredHospitals as hospital}
                        <button
                          type="button"
                          class="hospital-option"
                          class:selected={hospital.hospitalCode5Digit === displayHospitalCode}
                          on:click={() => selectHospital(hospital)}
                        >
                          <div class="hospital-info">
                            <span class="hospital-name">
                              {hospital.hospitalName || 'ไม่ระบุชื่อ'}
                            </span>
                            <span class="hospital-code">{hospital.hospitalCode5Digit}</span>
                          </div>
                          {#if hospital.hasPopulationData}
                            <span class="hospital-badge">มีข้อมูล</span>
                          {/if}
                        </button>
                      {/each}
                    {:else}
                      <div class="dropdown-empty">
                        <span>ไม่พบโรงพยาบาลที่ตรงกับการค้นหา</span>
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
              {#if fieldErrors.hospitalCode}
                <span class="error-message">{fieldErrors.hospitalCode}</span>
              {/if}
              <span class="field-help">เลือกโรงพยาบาลที่ต้องการบันทึกข้อมูลประชากร</span>
            </div>
          </div>

          <!-- Population Input -->
          <div class="form-group population-group">
            <label for="population" class="required">จำนวนประชากร</label>
            <div class="population-input">
              <input
                id="population"
                type="number"
                placeholder="เช่น 145000"
                bind:value={displayPopulation}
                on:input={handlePopulationInput}
                class:error={fieldErrors.population}
                disabled={formState.isSubmitting}
                min="1"
                max="100000000"
                step="1"
              />
              <span class="population-unit">คน</span>
            </div>
            {#if displayPopulation && displayPopulation > 0}
              <div class="population-preview">
                <span class="preview-label">จำนวนประชากร:</span>
                <span class="preview-value">{formatNumber(displayPopulation)} คน</span>
              </div>
            {/if}
            {#if fieldErrors.population}
              <span class="error-message">{fieldErrors.population}</span>
            {/if}
            <span class="field-help">ใส่จำนวนประชากรทั้งหมดในพื้นที่ของโรงพยาบาล</span>
          </div>
        </div>

        <!-- Changes Summary -->
        {#if hasChanges}
          <div class="changes-section">
            <h3>การเปลี่ยนแปลง</h3>
            <div class="changes-grid">
              {#if formData.year && formData.year !== originalData?.year}
                <div class="change-item">
                  <span class="change-label">ปี:</span>
                  <span class="change-old">{originalData?.year}</span>
                  <span class="change-arrow">→</span>
                  <span class="change-new">{formData.year}</span>
                </div>
              {/if}
              
              {#if formData.hospitalCode && formData.hospitalCode !== originalData?.hospitalCode}
                <div class="change-item">
                  <span class="change-label">โรงพยาบาล:</span>
                  <span class="change-old">{originalData?.hospitalCode}</span>
                  <span class="change-arrow">→</span>
                  <span class="change-new">{formData.hospitalCode}</span>
                </div>
              {/if}
              
              {#if formData.population && formData.population !== originalData?.population}
                <div class="change-item">
                  <span class="change-label">ประชากร:</span>
                  <span class="change-old">{originalData?.population ? formatNumber(originalData.population) : 0} คน</span>
                  <span class="change-arrow">→</span>
                  <span class="change-new">{formatNumber(formData.population)} คน</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Form Errors -->
        {#if formState.error}
          <div class="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{formState.error}</span>
          </div>
        {/if}

        {#if Object.keys(formState.validationErrors).length > 0}
          <div class="alert alert-warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <div>
              <p>กรุณาตรวจสอบข้อมูลต่อไปนี้:</p>
              <ul>
                {#each Object.values(formState.validationErrors) as error}
                  <li>{error}</li>
                {/each}
              </ul>
            </div>
          </div>
        {/if}

        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            type="button" 
            class="btn btn-secondary"
            on:click={handleCancel}
            disabled={formState.isSubmitting}
          >
            ยกเลิก
          </button>
          
          <button 
            type="submit" 
            class="btn btn-primary"
            disabled={!isFormValid || !hasChanges || formState.isSubmitting}
          >
            {#if formState.isSubmitting}
              <div class="spinner"></div>
              กำลังบันทึก...
            {:else}
              บันทึกการแก้ไข
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>

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
  .population-edit-page {
    min-height: 100vh;
    background: var(--background);
    padding: var(--spacing-lg);
  }

  /* Header */
  .page-header {
    margin-bottom: var(--spacing-xl);
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    font-size: 14px;
  }

  .breadcrumb-link {
    background: none;
    border: none;
    color: var(--primary);
    cursor: pointer;
    text-decoration: underline;
    font-size: inherit;
  }

  .breadcrumb-link:hover {
    color: #128a71;
  }

  .breadcrumb-separator {
    color: var(--text-secondary);
  }

  .breadcrumb-current {
    color: var(--text-primary);
    font-weight: 500;
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

  /* Loading & Error States */
  .loading-container,
  .error-container {
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
    margin: 0 auto;
    max-width: 500px;
  }

  .error-icon {
    color: var(--danger);
  }

  .error-container h3 {
    color: var(--text-primary);
    margin: 0;
  }

  .error-container p {
    color: var(--text-secondary);
    margin: 0;
  }

  /* Form Container */
  .form-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .current-data-section,
  .population-form {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: var(--spacing-lg);
  }

  /* Current Data Section */
  .current-data-section {
    padding: var(--spacing-xl);
  }

  .current-data-section h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-lg);
  }

  .current-data-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
  }

  .data-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .data-label {
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .data-value {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
  }

  /* Form Sections */
  .form-section {
    padding: var(--spacing-xl);
    border-bottom: 1px solid var(--gray-200);
  }

  .form-section h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-lg);
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg);
  }

  /* Form Groups */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .form-group label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .form-group label.required::after {
    content: ' *';
    color: var(--danger);
  }

  .form-group input,
  .form-group select {
    padding: var(--spacing-md);
    border: 1px solid var(--gray-300);
    border-radius: var(--border-radius);
    font-size: 16px;
    min-height: 48px;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
  }

  .form-group input:disabled,
  .form-group select:disabled {
    background: var(--gray-100);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .form-group input.error,
  .form-group select.error {
    border-color: var(--danger);
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
  }

  .field-help {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .error-message {
    font-size: 12px;
    color: var(--danger);
    font-weight: 500;
  }

  /* Population Group */
  .population-group {
    grid-column: 1 / -1;
  }

  .population-input {
    position: relative;
    display: flex;
    align-items: center;
  }

  .population-input input {
    flex: 1;
    padding-right: 60px;
  }

  .population-unit {
    position: absolute;
    right: var(--spacing-md);
    color: var(--text-secondary);
    font-size: 14px;
    pointer-events: none;
  }

  .population-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    background: var(--gray-100);
    border-radius: var(--border-radius);
    margin-top: var(--spacing-sm);
  }

  .preview-label {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .preview-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--primary);
  }

  /* Hospital Selector */
  .hospital-selector {
    position: relative;
  }

  .hospital-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--card-bg);
    border: 1px solid var(--gray-300);
    border-top: none;
    border-radius: 0 0 var(--border-radius) var(--border-radius);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 100;
    max-height: 300px;
    overflow-y: auto;
  }

  .hospital-option {
    width: 100%;
    padding: var(--spacing-md);
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.15s ease;
  }

  .hospital-option:hover {
    background: var(--gray-100);
  }

  .hospital-option.selected {
    background: rgba(22, 160, 133, 0.1);
    color: var(--primary);
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

  .hospital-badge {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--success);
    color: white;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 500;
  }

  .dropdown-loading,
  .dropdown-empty {
    padding: var(--spacing-lg);
    text-align: center;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
  }

  /* Changes Section */
  .changes-section {
    padding: var(--spacing-xl);
    background: rgba(22, 160, 133, 0.05);
    border-bottom: 1px solid var(--gray-200);
  }

  .changes-section h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--primary);
    margin-bottom: var(--spacing-md);
  }

  .changes-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .change-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-sm);
    background: var(--card-bg);
    border-radius: var(--border-radius);
  }

  .change-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    min-width: 80px;
  }

  .change-old {
    font-size: 14px;
    color: var(--text-secondary);
    text-decoration: line-through;
  }

  .change-arrow {
    color: var(--primary);
    font-weight: 600;
  }

  .change-new {
    font-size: 14px;
    color: var(--primary);
    font-weight: 500;
  }

  /* Alerts */
  .alert {
    display: flex;
    align-items: flex-start;
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

  .alert-warning {
    background: rgba(243, 156, 18, 0.1);
    border: 1px solid rgba(243, 156, 18, 0.2);
    color: var(--warning);
  }

  .alert ul {
    margin: var(--spacing-xs) 0 0 var(--spacing-md);
    padding: 0;
  }

  .alert li {
    font-size: 14px;
  }

  /* Form Actions */
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    padding: var(--spacing-xl);
    background: var(--gray-100);
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-xl);
    border: none;
    border-radius: var(--border-radius);
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    min-height: 48px;
    text-decoration: none;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #128a71;
    box-shadow: 0 4px 15px rgba(22, 160, 133, 0.3);
  }

  .btn-secondary {
    background: var(--gray-200);
    color: var(--text-primary);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--gray-300);
  }

  /* Spinner */
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-container .spinner,
  .dropdown-loading .spinner {
    border-color: var(--text-secondary);
    border-top-color: var(--primary);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .population-edit-page {
      padding: var(--spacing-md);
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .current-data-grid {
      grid-template-columns: 1fr;
    }

    .change-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }

    .change-label {
      min-width: auto;
    }
  }

  @media (max-width: 640px) {
    .title-section h1 {
      font-size: 24px;
    }

    .form-section,
    .current-data-section,
    .changes-section,
    .form-actions {
      padding: var(--spacing-lg);
    }

    .breadcrumb {
      flex-wrap: wrap;
    }
  }
</style>