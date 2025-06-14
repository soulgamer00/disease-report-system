<!-- src/routes/(app)/symptoms/edit/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import {
    symptomFormState,
    updateSymptom,
    loadSymptomById,
    checkSymptomNameAvailability,
    clearSymptomFormErrors,
    validateSymptomData
  } from '$lib/stores/symptomStore';
  import { authState, userRole } from '$lib/stores/auth';
  import { apiClient } from '$lib/api/client';
  import type { UpdateSymptomData, Symptom } from '$lib/api/types';

  // Get symptom ID from URL
  $: symptomId = parseInt($page.params.id);

  // Reactive subscriptions
  $: formState = $symptomFormState;
  $: user = $authState.user;
  $: role = $userRole;

  // Component state
  let currentSymptom: Symptom | null = null;
  let formData: UpdateSymptomData = {};
  let originalData: Symptom | null = null;
  let isLoading = true;
  let loadError: string | null = null;

  // Form display values
  let displayDiseaseId = 0;
  let displayName = '';

  // Disease options
  let diseaseOptions: Array<{ id: number; thaiName: string; engName?: string }> = [];
  let loadingDiseases = false;

  // Validation
  let fieldErrors: Record<string, string> = {};
  let isFormValid = false;
  let hasChanges = false;

  // Name availability checking
  let nameAvailable = true;
  let checkingNameAvailability = false;
  let nameCheckTimeout: any = null;

  // Reactive declarations for character counts
  $: nameCharCount = getCharacterCount(displayName, 255);

  onMount(async () => {
    // Check permissions - Only SUPERUSER can manage symptoms
    if (!role.isSuperuser) {
      goto('/dashboard');
      return;
    }

    // Validate symptom ID
    if (isNaN(symptomId) || symptomId <= 0) {
      goto('/symptoms');
      return;
    }

    try {
      // Load symptom data and disease options
      await Promise.all([
        loadSymptomData(),
        loadDiseaseOptions()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
      loadError = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
    } finally {
      isLoading = false;
    }
  });

  // Load symptom data
  async function loadSymptomData() {
    const symptom = await loadSymptomById(symptomId);

    if (symptom) {
      currentSymptom = symptom;
      originalData = { ...symptom };

      // Initialize form with current values
      displayDiseaseId = symptom.diseaseId;
      displayName = symptom.name;

      nameAvailable = true;
      validateForm();
    } else {
      loadError = 'ไม่พบข้อมูลอาการที่ต้องการแก้ไข';
    }
  }

  // Load disease options
  async function loadDiseaseOptions() {
    try {
      loadingDiseases = true;
      const response = await apiClient.getActiveDiseases();
      
      if (response.success && response.data) {
        diseaseOptions = response.data.map(disease => ({
          id: disease.id,
          thaiName: disease.thaiName,
          engName: disease.engName || undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load disease options:', error);
    } finally {
      loadingDiseases = false;
    }
  }

  // Check for changes
  $: if (originalData) {
    hasChanges = (
      displayDiseaseId !== originalData.diseaseId ||
      displayName !== originalData.name
    );

    // Update form data with only changed values
    formData = {};
    if (displayDiseaseId !== originalData.diseaseId) formData.diseaseId = displayDiseaseId;
    if (displayName !== originalData.name) formData.name = displayName;
  }

  // Form validation
  function validateForm(): boolean {
    if (!displayName.trim() || displayDiseaseId === 0) {
      isFormValid = false;
      return false;
    }

    const tempData = {
      diseaseId: displayDiseaseId,
      name: displayName
    };

    const errors = validateSymptomData(tempData);

    // Additional validation for name availability
    if (displayName.trim() && !nameAvailable) {
      errors.name = 'ชื่ออาการนี้มีอยู่ในโรคนี้แล้ว';
    }

    fieldErrors = errors;
    isFormValid = Object.keys(errors).length === 0 && nameAvailable;

    return isFormValid;
  }

  // Name availability checking with debounce
  async function checkNameAvailability() {
    if (checkingNameAvailability || !originalData) return;

    // Skip if name is empty
    if (!displayName.trim()) {
      nameAvailable = true;
      return;
    }

    // Skip if name and disease haven't changed
    if (displayName === originalData.name && displayDiseaseId === originalData.diseaseId) {
      nameAvailable = true;
      return;
    }

    try {
      checkingNameAvailability = true;

      const result = await checkSymptomNameAvailability(
        displayDiseaseId,
        displayName.trim(),
        symptomId // Exclude current symptom from check
      );

      if (result) {
        nameAvailable = result.isAvailable;
        validateForm();
      }
    } catch (error) {
      console.error('Name availability check failed:', error);
      // Don't block form submission if check fails
      nameAvailable = true;
    } finally {
      checkingNameAvailability = false;
    }
  }

  function scheduleNameCheck() {
    if (nameCheckTimeout) {
      clearTimeout(nameCheckTimeout);
    }

    nameCheckTimeout = setTimeout(() => {
      checkNameAvailability();
    }, 500); // 500ms debounce
  }

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      delete fieldErrors[field];
      fieldErrors = { ...fieldErrors };
    }
  }

  // Form handlers
  function handleDiseaseChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    displayDiseaseId = parseInt(target.value);
    clearFieldError('diseaseId');
    scheduleNameCheck();
    validateForm();
  }

  function handleNameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    displayName = target.value;
    clearFieldError('name');
    scheduleNameCheck();
    validateForm();
  }

  // Form submission
  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!validateForm() || !hasChanges) {
      return;
    }

    clearSymptomFormErrors();

    const result = await updateSymptom(symptomId, formData);

    if (result) {
      goto('/symptoms');
    }
  }

  function handleCancel() {
    goto('/symptoms');
  }

  // Character count helpers
  function getCharacterCount(text: string, max: number): { count: number; max: number; isNearLimit: boolean; isOverLimit: boolean } {
    const count = text.length;
    return {
      count,
      max,
      isNearLimit: count >= max * 0.8,
      isOverLimit: count > max
    };
  }

  // Utility functions
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getSelectedDiseaseName(diseaseId: number): string {
    const disease = diseaseOptions.find(d => d.id === diseaseId);
    return disease ? disease.thaiName : '';
  }

  function getStatusBadge(isActive: boolean): { class: string; text: string } {
    return isActive
      ? { class: 'badge-success', text: 'ใช้งาน' }
      : { class: 'badge-danger', text: 'ไม่ใช้งาน' };
  }
</script>

<svelte:head>
  <title>แก้ไขอาการ - ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
</svelte:head>

<div class="symptom-edit-page">
  <header class="page-header">
    <div class="header-content">
      <div class="breadcrumb">
        <button class="breadcrumb-link" on:click={() => goto('/symptoms')}>
          จัดการอาการโรค
        </button>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">แก้ไขอาการ</span>
      </div>

      <div class="title-section">
        <h1>แก้ไขข้อมูลอาการ</h1>
        <p>แก้ไขข้อมูลอาการของโรคติดต่อโดยแมลงในระบบ</p>
      </div>
    </div>
  </header>

  {#if isLoading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>กำลังโหลดข้อมูลอาการ...</p>
    </div>

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
      <button class="btn btn-primary" on:click={() => goto('/symptoms')}>
        กลับไปหน้ารายการ
      </button>
    </div>

  {:else if currentSymptom}
    {@const status = getStatusBadge(currentSymptom.isActive)} <div class="form-container">
      <div class="current-data-section">
        <h2>ข้อมูลปัจจุบัน</h2>
        <div class="current-data-grid">
          <div class="data-item">
            <span class="data-label">ชื่ออาการ:</span>
            <span class="data-value">{currentSymptom.name}</span>
          </div>
          <div class="data-item">
            <span class="data-label">โรค:</span>
            <span class="data-value">
              {currentSymptom.disease.thaiName}
              {#if currentSymptom.disease.engName}
                ({currentSymptom.disease.engName})
              {/if}
            </span>
          </div>
          <div class="data-item">
            <span class="data-label">สถานะ:</span>
            <span class="data-value status-{currentSymptom.isActive ? 'active' : 'inactive'}">
              {status.text}
            </span>
          </div>
          <div class="data-item">
            <span class="data-label">แก้ไขล่าสุด:</span>
            <span class="data-value">{formatDate(currentSymptom.updatedAt)}</span>
          </div>
          <div class="data-item">
            <span class="data-label">ผู้แก้ไข:</span>
            <span class="data-value">{currentSymptom.updatedBy || 'ไม่ระบุ'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">สร้างเมื่อ:</span>
            <span class="data-value">{formatDate(currentSymptom.createdAt)}</span>
          </div>
        </div>
      </div>

      <form class="symptom-form" on:submit={handleSubmit}>
        <div class="form-section">
          <h2>แก้ไขข้อมูล</h2>

          <div class="form-group">
            <label for="disease-select" class="required">โรค</label>
            <select
              id="disease-select"
              bind:value={displayDiseaseId}
              on:change={handleDiseaseChange}
              class:error={fieldErrors.diseaseId}
              disabled={formState.isSubmitting || loadingDiseases}
            >
              <option value={0} disabled>เลือกโรค</option>
              {#each diseaseOptions as disease (disease.id)}
                <option value={disease.id}>
                  {disease.thaiName}
                  {#if disease.engName}
                    ({disease.engName})
                  {/if}
                </option>
              {/each}
            </select>

            <span class="field-help">เลือกโรคที่อาการนี้เกี่ยวข้อง</span>

            {#if fieldErrors.diseaseId}
              <span class="error-message">{fieldErrors.diseaseId}</span>
            {/if}
          </div>

          <div class="form-group">
            <label for="symptom-name" class="required">ชื่ออาการ</label>
            <div class="input-with-status">
              <input
                id="symptom-name"
                type="text"
                placeholder="เช่น ไข้สูง, ปวดหัว, ผื่นแดง"
                value={displayName}
                on:input={handleNameInput}
                class:error={fieldErrors.name}
                class:checking={checkingNameAvailability}
                class:available={displayName.trim() && nameAvailable}
                class:unavailable={displayName.trim() && !nameAvailable}
                disabled={formState.isSubmitting}
                maxlength="255"
              />

              {#if checkingNameAvailability}
                <div class="input-status checking">
                  <div class="spinner"></div>
                </div>
              {:else if displayName.trim() && (displayName !== originalData?.name || displayDiseaseId !== originalData?.diseaseId)}
                <div class="input-status {nameAvailable ? 'available' : 'unavailable'}">
                  {#if nameAvailable}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  {/if}
                </div>
              {/if}
            </div>

            <div class="field-meta">
              <span class="field-help">ชื่ออาการในภาษาไทย</span>
              <span class="char-count" class:near-limit={nameCharCount.isNearLimit} class:over-limit={nameCharCount.isOverLimit}>
                {nameCharCount.count}/{nameCharCount.max}
              </span>
            </div>

            {#if fieldErrors.name}
              <span class="error-message">{fieldErrors.name}</span>
            {/if}
          </div>
        </div>

        {#if hasChanges}
          <div class="changes-section">
            <h3>การเปลี่ยนแปลง</h3>
            <div class="changes-grid">
              {#if formData.diseaseId && formData.diseaseId !== originalData?.diseaseId}
                <div class="change-item">
                  <span class="change-label">โรค:</span>
                  <span class="change-old">{originalData?.disease.thaiName}</span>
                  <span class="change-arrow">→</span>
                  <span class="change-new">{getSelectedDiseaseName(formData.diseaseId)}</span>
                </div>
              {/if}

              {#if formData.name && formData.name !== originalData?.name}
                <div class="change-item">
                  <span class="change-label">ชื่ออาการ:</span>
                  <span class="change-old">{originalData?.name}</span>
                  <span class="change-arrow">→</span>
                  <span class="change-new">{formData.name}</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}

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
  .symptom-edit-page {
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
    max-width: 500px;
    margin: 0 auto;
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

  /* Current Data Section */
  .current-data-section {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-lg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .current-data-section h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-lg);
  }

  .current-data-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-md);
  }

  .data-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .data-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .data-value {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
  }

  .data-value.status-active {
    color: var(--success);
  }

  .data-value.status-inactive {
    color: var(--danger);
  }

  /* Form */
  .symptom-form {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

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

  /* Form Groups */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
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

  /* Input with status */
  .input-with-status {
    position: relative;
  }

  .input-status {
    position: absolute;
    right: var(--spacing-md);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .input-status.checking {
    color: var(--text-secondary);
  }

  .input-status.available {
    color: var(--success);
  }

  .input-status.unavailable {
    color: var(--danger);
  }

  .input.checking,
  .input.available,
  .input.unavailable {
    padding-right: 48px;
  }

  /* Field meta info */
  .field-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .field-help {
    font-size: 12px;
    color: var(--text-secondary);
    flex: 1;
  }

  .char-count {
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .char-count.near-limit {
    color: var(--warning);
  }

  .char-count.over-limit {
    color: var(--danger);
  }

  .error-message {
    font-size: 12px;
    color: var(--danger);
    font-weight: 500;
  }

  /* Changes Section */
  .changes-section {
    padding: var(--spacing-lg) var(--spacing-xl);
    background: rgba(22, 160, 133, 0.05);
    border-top: 2px solid var(--primary);
  }

  .changes-section h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .changes-section h3::before {
    content: '📝';
    font-size: 20px;
  }

  .changes-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .change-item {
    display: grid;
    grid-template-columns: 120px 1fr auto 1fr;
    gap: var(--spacing-sm);
    align-items: center;
    padding: var(--spacing-sm);
    background: white;
    border-radius: var(--border-radius);
    font-size: 14px;
  }

  .change-label {
    font-weight: 500;
    color: var(--text-primary);
  }

  .change-old {
    color: var(--text-secondary);
    text-decoration: line-through;
    font-style: italic;
  }

  .change-arrow {
    color: var(--primary);
    font-weight: bold;
    text-align: center;
  }

  .change-new {
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

  .input-status .spinner {
    border-color: var(--text-secondary);
    border-top-color: var(--primary);
  }

  .loading-container .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--gray-200);
    border-top: 3px solid var(--primary);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .symptom-edit-page {
      padding: var(--spacing-md);
    }

    .current-data-grid {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .field-meta {
      flex-direction: column;
      align-items: flex-start;
    }

    .change-item {
      grid-template-columns: 1fr;
      gap: var(--spacing-xs);
      text-align: left;
    }

    .change-arrow {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .title-section h1 {
      font-size: 24px;
    }

    .form-section,
    .current-data-section {
      padding: var(--spacing-lg);
    }

    .form-actions {
      padding: var(--spacing-lg);
    }

    .breadcrumb {
      flex-wrap: wrap;
    }

    .changes-section {
      padding: var(--spacing-lg);
    }
  }
</style>