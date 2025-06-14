<script lang="ts">
  import { onMount } from 'svelte';
  import { patientActions } from '$lib/stores/patientStore';
  import { patientApi, debounce } from '$lib/api/patients/client';
  import type { DiseaseOption, HospitalOption } from '$lib/api/patients/client';

  // Form state
  let searchTerm = '';
  let selectedDisease: string | number = ''; // Change to string | number to match disease.id type
  let selectedHospital = '';
  let selectedGender = '';
  let selectedCondition = '';
  let dateFrom = '';
  let dateTo = '';

  // Reference data
  let diseases: DiseaseOption[] = [];
  let hospitals: HospitalOption[] = [];
  let loading = false;

  // Load reference data
  onMount(async () => {
    loading = true;
    try {
      const [diseaseRes, hospitalRes] = await Promise.all([
        patientApi.getDiseases(),
        patientApi.getHospitals()
      ]);
      
      if (diseaseRes.success && diseaseRes.data) {
        diseases = diseaseRes.data;
      }
      
      if (hospitalRes.success && hospitalRes.data) {
        hospitals = hospitalRes.data;
      }
    } catch (error) {
      console.error('Failed to load reference data:', error);
      // Optionally, set an error state here to display in the UI
    } finally {
      loading = false;
    }
  });

  // Debounced search
  const debouncedSearch = debounce(() => {
    applyFilters(); // Apply all filters including search term
  }, 300);

  // Handle search input (triggers debounced search)
  function handleSearchInput(): void {
    debouncedSearch();
  }

  // Apply all filters
  function applyFilters(): void {
    const filters: Record<string, string | number | boolean> = {};
    
    // Add search term
    if (searchTerm) filters.search = searchTerm;

    // Add other filters
    if (selectedDisease) filters.diseaseId = parseInt(selectedDisease as string); // Ensure it's a number
    if (selectedHospital) filters.hospitalCode = selectedHospital;
    if (selectedGender) filters.gender = selectedGender;
    if (selectedCondition) filters.patientCondition = selectedCondition;
    if (dateFrom) filters.illnessDateFrom = dateFrom;
    if (dateTo) filters.illnessDateTo = dateTo;

    // Reset pagination to first page on new search/filter
    patientActions.applyFilters(filters);
  }

  // Clear all filters
  function clearFilters(): void {
    searchTerm = '';
    selectedDisease = '';
    selectedHospital = '';
    selectedGender = '';
    selectedCondition = '';
    dateFrom = '';
    dateTo = '';
    
    // Apply empty filters to reset the list
    patientActions.applyFilters({});
  }

  // Gender options
  const genderOptions = [
    { value: 'M', label: 'ชาย' },
    { value: 'F', label: 'หญิง' }
  ];

  // Condition options
  const conditionOptions = [
    { value: 'ยังรักษาตัวอยู่', label: 'ยังรักษาตัวอยู่' },
    { value: 'หายจากโรคแล้ว', label: 'หายจากโรคแล้ว' },
    { value: 'เสียชีวิต', label: 'เสียชีวิต' },
    { value: 'ไม่ทราบ', label: 'ไม่ทราบ' }
  ];
</script>

<div class="filters-section">
  <div class="search-box">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
    <input
      type="text"
      placeholder="ค้นหาด้วยชื่อ, เลขบัตรประชาชน, HN, หรือเบอร์โทร..."
      bind:value={searchTerm}
      on:input={handleSearchInput}
      disabled={loading}
    />
  </div>

  <div class="filter-group-row">
    <div class="filter-group">
      <label for="disease-filter" class="filter-label">โรค:</label>
      <select 
        id="disease-filter"
        bind:value={selectedDisease} 
        on:change={applyFilters}
        disabled={loading}
      >
        <option value="">ทุกโรค</option>
        {#each diseases as disease}
          <option value={disease.id.toString()}>
            {disease.thaiName}
            {#if disease.engName}({disease.engName}){/if}
          </option>
        {/each}
      </select>
    </div>

    <div class="filter-group">
      <label for="hospital-filter" class="filter-label">โรงพยาบาล:</label>
      <select 
        id="hospital-filter"
        bind:value={selectedHospital} 
        on:change={applyFilters}
        disabled={loading}
      >
        <option value="">ทุกโรงพยาบาล</option>
        {#each hospitals as hospital}
          <option value={hospital.hospitalCode5Digit}>
            {hospital.hospitalName || hospital.hospitalCode5Digit}
          </option>
        {/each}
      </select>
    </div>

    <!--<div class="filter-group">
      <label for="gender-filter" class="filter-label">เพศ:</label>
      <select 
        id="gender-filter"
        bind:value={selectedGender} 
        on:change={applyFilters}
      >
        <option value="">ทั้งหมด</option>
        {#each genderOptions as gender}
          <option value={gender.value}>{gender.label}</option>
        {/each}
      </select>
    </div>-->

    <div class="filter-group">
      <label for="condition-filter" class="filter-label">สภาพผู้ป่วย:</label>
      <select 
        id="condition-filter"
        bind:value={selectedCondition} 
        on:change={applyFilters}
      >
        <option value="">ทุกสภาพ</option>
        {#each conditionOptions as condition}
          <option value={condition.value}>{condition.label}</option>
        {/each}
      </select>
    </div>

    <div class="filter-group date-range-group">
      <label class="filter-label">วันที่เจ็บป่วย:</label>
      <div class="date-inputs">
        <input
          type="date"
          bind:value={dateFrom}
          on:change={applyFilters}
        />
        <span class="date-separator">ถึง</span>
        <input
          type="date"
          bind:value={dateTo}
          on:change={applyFilters}
        />
      </div>
    </div>
    
    <div class="filter-group clear-button-group">
      <button 
        type="button" 
        class="btn btn-secondary clear-filters-btn" 
        on:click={clearFilters}
        disabled={loading}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 3l18 18"/>
          <path d="M21 3L3 21"/>
        </svg>
        ล้างตัวกรอง
      </button>
    </div>
  </div>
</div>

<style>
  /* CSS Variables - Duplicated for self-contained component, consider importing a shared SCSS/CSS file for production */
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

  /* Filters Section (consistent with hospitals page) */
  .filters-section {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Search Box */
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
    padding: 12px 12px 12px 40px; /* Left padding for icon */
    border: 1px solid var(--gray-300);
    border-radius: 8px;
    font-size: 16px;
    color: var(--text-primary);
  }

  .search-box input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(22, 160, 133, 0.2);
  }

  /* Filter Group Row */
  .filter-group-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
  }

  .filter-label {
    margin-bottom: 6px;
    font-weight: 500;
    color: var(--text-primary);
    font-size: 14px;
  }

  .filter-group select,
  .filter-group input[type="date"] {
    padding: 8px 12px;
    border: 1px solid var(--gray-300);
    border-radius: 8px;
    font-size: 14px;
    color: var(--text-primary);
    background-color: var(--card-bg);
  }

  .filter-group select:focus,
  .filter-group input[type="date"]:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(22, 160, 133, 0.2);
  }

  /* Date Range Specific Styles */
  .date-range-group .date-inputs {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap; /* Allow date inputs to wrap */
  }

  .date-range-group .date-inputs input {
    flex: 1; /* Allow inputs to grow/shrink */
    min-width: 120px; /* Ensure they don't get too small */
  }

  .date-separator {
    color: var(--text-secondary);
    font-size: 14px;
    white-space: nowrap; /* Prevent "ถึง" from wrapping */
  }

  /* Clear Filters Button */
  .clear-button-group {
    display: flex;
    align-items: flex-end; /* Align to the bottom of the grid row */
  }

  .clear-filters-btn {
    width: 100%; /* Make button full width in its grid column */
  }

  /* Buttons (reused from global styles) */
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
    min-height: 44px; /* Consistent button height */
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

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .filters-section {
      padding: 16px;
    }

    .search-box input {
      font-size: 14px;
      padding: 10px 10px 10px 36px;
    }

    .search-box svg {
      width: 18px;
      height: 18px;
      left: 10px;
    }

    .filter-group-row {
      grid-template-columns: 1fr; /* Stack filters vertically */
      gap: 12px;
    }

    .filter-group select,
    .filter-group input[type="date"] {
      padding: 10px 12px; /* Adjust padding for smaller screens */
      font-size: 13px;
    }

    .date-range-group .date-inputs {
      flex-direction: column; /* Stack date inputs */
      align-items: stretch;
      gap: 10px;
    }

    .date-range-group .date-inputs input {
      width: 100%; /* Full width for stacked inputs */
      min-width: unset;
    }

    .date-separator {
      align-self: center; /* Center "ถึง" when stacked */
      margin: 0;
    }

    .clear-button-group {
      align-items: center; /* Center the clear button if needed */
    }

    .clear-filters-btn {
      min-height: 40px; /* Slightly smaller button height */
      font-size: 13px;
    }
  }
</style>