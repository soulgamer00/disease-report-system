<!-- src/routes/(app)/symptoms/new/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    symptomFormState,
    createSymptom,
    bulkCreateSymptoms,
    checkSymptomNameAvailability,
    clearSymptomFormErrors,
    validateSymptomData,
    validateBulkSymptomData
  } from '$lib/stores/symptomStore';
  import { authState, userRole } from '$lib/stores/auth';
  import { apiClient } from '$lib/api/client';
  import type { CreateSymptomData, BulkCreateSymptomsData } from '$lib/api/types';

  // Reactive subscriptions
  $: formState = $symptomFormState;
  $: user = $authState.user;
  $: role = $userRole;

  // Form modes
  let formMode: 'single' | 'bulk' = 'single';

  // Single form data
  let singleFormData: CreateSymptomData = {
    diseaseId: 0,
    name: ''
  };

  // Bulk form data
  let bulkFormData: BulkCreateSymptomsData = {
    diseaseId: 0,
    symptoms: [{ name: '' }]
  };

  // Disease options
  let diseaseOptions: Array<{ id: number; thaiName: string; engName?: string }> = [];
  let loadingDiseases = false;

  // Validation state
  let singleFieldErrors: Record<string, string> = {};
  let bulkFieldErrors: Record<string, string> = {};
  let isSingleFormValid = false;
  let isBulkFormValid = false;

  // Name availability checking (for single mode)
  let nameAvailable = true;
  let checkingNameAvailability = false;
  let nameCheckTimeout: any = null;

  onMount(async () => {
    // Check permissions - Only SUPERUSER can manage symptoms
    if (!role.isSuperuser) {
      goto('/dashboard');
      return;
    }

    clearSymptomFormErrors();
    await loadDiseaseOptions();
  });

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

  // Single form validation
  function validateSingleForm(): boolean {
    const errors = validateSymptomData(singleFormData);

    // Additional validation for name availability
    if (singleFormData.name.trim() && !nameAvailable) {
      errors.name = 'ชื่ออาการนี้มีอยู่ในโรคนี้แล้ว';
    }

    singleFieldErrors = errors;
    isSingleFormValid = Object.keys(errors).length === 0 && nameAvailable;

    return isSingleFormValid;
  }

  // Bulk form validation
  function validateBulkForm(): boolean {
    const errors = validateBulkSymptomData(bulkFormData);
    bulkFieldErrors = errors;
    isBulkFormValid = Object.keys(errors).length === 0;

    return isBulkFormValid;
  }

  // Name availability checking with debounce (single mode)
  async function checkNameAvailability() {
    if (checkingNameAvailability || !singleFormData.diseaseId || !singleFormData.name.trim()) {
      nameAvailable = true;
      return;
    }

    try {
      checkingNameAvailability = true;

      const result = await checkSymptomNameAvailability(
        singleFormData.diseaseId,
        singleFormData.name.trim()
      );

      if (result) {
        nameAvailable = result.isAvailable;
        validateSingleForm();
      }
    } catch (error) {
      console.error('Name availability check failed:', error);
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
    }, 500);
  }

  // Form handlers - Single mode
  function clearSingleFieldError(field: string) {
    if (singleFieldErrors[field]) {
      delete singleFieldErrors[field];
      singleFieldErrors = { ...singleFieldErrors };
    }
  }

  function clearBulkFieldError(field: string) {
    if (bulkFieldErrors[field]) {
      delete bulkFieldErrors[field];
      bulkFieldErrors = { ...bulkFieldErrors };
    }
  }

  function handleSingleDiseaseChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    singleFormData.diseaseId = parseInt(target.value);
    clearSingleFieldError('diseaseId');
    scheduleNameCheck();
    validateSingleForm();
  }

  function handleSingleNameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    singleFormData.name = target.value;
    clearSingleFieldError('name');
    scheduleNameCheck();
    validateSingleForm();
  }

  // Form handlers - Bulk mode
  function handleBulkDiseaseChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    bulkFormData.diseaseId = parseInt(target.value);
    clearBulkFieldError('diseaseId');
    validateBulkForm();
  }

  function handleBulkSymptomInput(index: number, event: Event) {
    const target = event.target as HTMLInputElement;
    bulkFormData.symptoms[index].name = target.value;
    clearBulkFieldError('symptoms');
    validateBulkForm();
  }

  function addBulkSymptom() {
    if (bulkFormData.symptoms.length < 50) {
      bulkFormData.symptoms = [...bulkFormData.symptoms, { name: '' }];
    }
  }

  function removeBulkSymptom(index: number) {
    if (bulkFormData.symptoms.length > 1) {
      bulkFormData.symptoms = bulkFormData.symptoms.filter((_, i) => i !== index);
      validateBulkForm();
    }
  }

  // Form mode switching
  function switchToSingle() {
    formMode = 'single';
    clearSymptomFormErrors();
  }

  function switchToBulk() {
    formMode = 'bulk';
    clearSymptomFormErrors();
  }

  // Form submission
  async function handleSingleSubmit(event: Event) {
    event.preventDefault();

    if (!validateSingleForm()) {
      return;
    }

    clearSymptomFormErrors();

    const result = await createSymptom(singleFormData);

    if (result) {
      goto('/symptoms');
    }
  }

  async function handleBulkSubmit(event: Event) {
    event.preventDefault();

    if (!validateBulkForm()) {
      return;
    }

    clearSymptomFormErrors();

    // Filter out empty symptoms
    const cleanedSymptoms = bulkFormData.symptoms.filter(s => s.name.trim() !== '');

    if (cleanedSymptoms.length === 0) {
      bulkFieldErrors.symptoms = 'กรุณาระบุอาการอย่างน้อย 1 อาการ';
      return;
    }

    const cleanData: BulkCreateSymptomsData = {
      diseaseId: bulkFormData.diseaseId,
      symptoms: cleanedSymptoms.map(s => ({ name: s.name.trim() }))
    };

    const result = await bulkCreateSymptoms(cleanData);

    if (result) {
      goto('/symptoms');
    }
  }

  function handleCancel() {
    goto('/symptoms');
  }

  // Get selected disease name
  function getSelectedDiseaseName(diseaseId: number): string {
    const disease = diseaseOptions.find(d => d.id === diseaseId);
    return disease ? disease.thaiName : '';
  }
</script>

<svelte:head>
  <title>เพิ่มอาการใหม่ - ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
</svelte:head>

<div class="symptom-form-page">
  <header class="page-header">
    <div class="header-content">
      <div class="breadcrumb">
        <button class="breadcrumb-link" on:click={() => goto('/symptoms')}>
          จัดการอาการโรค
        </button>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">เพิ่มอาการใหม่</span>
      </div>

      <div class="title-section">
        <h1>เพิ่มอาการโรคใหม่</h1>
        <p>เพิ่มอาการของโรคติดต่อโดยแมลงเข้าสู่ระบบ</p>
      </div>
    </div>
  </header>

  <div class="form-container">
    <!-- Form Mode Selection -->
    <div class="mode-selector">
      <div class="mode-tabs">
        <button
          class="mode-tab"
          class:active={formMode === 'single'}
          on:click={switchToSingle}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          เพิ่มทีละอาการ
        </button>
        
        <button
          class="mode-tab"
          class:active={formMode === 'bulk'}
          on:click={switchToBulk}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 12l2 2 4-4"/>
            <path d="M9 12l2 2 4-4" transform="translate(0, 6)"/>
          </svg>
          เพิ่มหลายอาการ
        </button>
      </div>
      
      <div class="mode-description">
        {#if formMode === 'single'}
          <p>เพิ่มอาการทีละอาการพร้อมตรวจสอบความซ้ำ</p>
        {:else}
          <p>เพิ่มหลายอาการพร้อมกันสำหรับโรคเดียวกัน (สูงสุด 50 อาการ)</p>
        {/if}
      </div>
    </div>

    {#if formMode === 'single'}
      <!-- Single Symptom Form -->
      <form class="symptom-form" on:submit={handleSingleSubmit}>
        <div class="form-section">
          <h2>เพิ่มอาการใหม่</h2>

          <div class="form-group">
            <label for="single-disease" class="required">เลือกโรค</label>
            <select
              id="single-disease"
              value={singleFormData.diseaseId}
              on:change={handleSingleDiseaseChange}
              class:error={singleFieldErrors.diseaseId}
              disabled={formState.isSubmitting || loadingDiseases}
            >
              <option value={0}>-- เลือกโรค --</option>
              {#each diseaseOptions as disease}
                <option value={disease.id}>
                  {disease.thaiName}
                  {#if disease.engName}
                    ({disease.engName})
                  {/if}
                </option>
              {/each}
            </select>

            {#if singleFieldErrors.diseaseId}
              <span class="error-message">{singleFieldErrors.diseaseId}</span>
            {/if}
          </div>

          <div class="form-group">
            <label for="single-name" class="required">ชื่ออาการ</label>
            <div class="input-with-status">
              <input
                id="single-name"
                type="text"
                placeholder="เช่น ไข้สูง, ปวดหัว, ปวดกล้ามเนื้อ"
                value={singleFormData.name}
                on:input={handleSingleNameInput}
                class:error={singleFieldErrors.name}
                class:checking={checkingNameAvailability}
                class:available={singleFormData.name.trim() && nameAvailable}
                class:unavailable={singleFormData.name.trim() && !nameAvailable}
                disabled={formState.isSubmitting}
                maxlength="255"
              />

              {#if checkingNameAvailability}
                <div class="input-status checking">
                  <div class="spinner"></div>
                </div>
              {:else if singleFormData.name.trim() && singleFormData.diseaseId}
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
              <span class="field-help">ชื่ออาการของโรคที่เลือก</span>
              <span class="char-count">
                {singleFormData.name.length}/255
              </span>
            </div>

            {#if singleFieldErrors.name}
              <span class="error-message">{singleFieldErrors.name}</span>
            {/if}
          </div>

          {#if singleFormData.diseaseId && singleFormData.name.trim()}
            <div class="preview-section">
              <h3>ตัวอย่าง</h3>
              <div class="preview-card">
                <div class="preview-disease">
                  <strong>โรค:</strong> {getSelectedDiseaseName(singleFormData.diseaseId)}
                </div>
                <div class="preview-symptom">
                  <strong>อาการ:</strong> {singleFormData.name}
                </div>
              </div>
            </div>
          {/if}
        </div>

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
            disabled={!isSingleFormValid || formState.isSubmitting}
          >
            {#if formState.isSubmitting}
              <div class="spinner"></div>
              กำลังเพิ่ม...
            {:else}
              เพิ่มอาการ
            {/if}
          </button>
        </div>
      </form>

    {:else}
      <!-- Bulk Symptoms Form -->
      <form class="symptom-form" on:submit={handleBulkSubmit}>
        <div class="form-section">
          <h2>เพิ่มหลายอาการพร้อมกัน</h2>

          <div class="form-group">
            <label for="bulk-disease" class="required">เลือกโรค</label>
            <select
              id="bulk-disease"
              value={bulkFormData.diseaseId}
              on:change={handleBulkDiseaseChange}
              class:error={bulkFieldErrors.diseaseId}
              disabled={formState.isSubmitting || loadingDiseases}
            >
              <option value={0}>-- เลือกโรค --</option>
              {#each diseaseOptions as disease}
                <option value={disease.id}>
                  {disease.thaiName}
                  {#if disease.engName}
                    ({disease.engName})
                  {/if}
                </option>
              {/each}
            </select>

            {#if bulkFieldErrors.diseaseId}
              <span class="error-message">{bulkFieldErrors.diseaseId}</span>
            {/if}
          </div>

          <div class="form-group">
            <div class="symptoms-header">
              <label class="required">อาการต่างๆ</label>
              <button
                type="button"
                class="btn btn-outline btn-sm"
                on:click={addBulkSymptom}
                disabled={bulkFormData.symptoms.length >= 50 || formState.isSubmitting}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                เพิ่มอาการ
              </button>
            </div>

            <div class="symptoms-list">
              {#each bulkFormData.symptoms as symptom, index (index)}
                <div class="symptom-input-row">
                  <div class="symptom-number">
                    {index + 1}.
                  </div>
                  
                  <input
                    type="text"
                    placeholder="ชื่ออาการ เช่น ไข้สูง, ปวดหัว"
                    value={symptom.name}
                    on:input={(e) => handleBulkSymptomInput(index, e)}
                    disabled={formState.isSubmitting}
                    maxlength="255"
                  />

                  {#if bulkFormData.symptoms.length > 1}
                    <button
                      type="button"
                      class="btn-icon delete"
                      title="ลบอาการนี้"
                      on:click={() => removeBulkSymptom(index)}
                      disabled={formState.isSubmitting}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  {/if}
                </div>
              {/each}
            </div>

            <div class="field-meta">
              <span class="field-help">
                เพิ่มอาการหลายอาการสำหรับโรคที่เลือก (สูงสุด 50 อาการ)
              </span>
              <span class="symptom-count">
                {bulkFormData.symptoms.length}/50 อาการ
              </span>
            </div>

            {#if bulkFieldErrors.symptoms}
              <span class="error-message">{bulkFieldErrors.symptoms}</span>
            {/if}
          </div>

          {#if bulkFormData.diseaseId && bulkFormData.symptoms.some(s => s.name.trim())}
            <div class="preview-section">
              <h3>ตัวอย่าง</h3>
              <div class="preview-card">
                <div class="preview-disease">
                  <strong>โรค:</strong> {getSelectedDiseaseName(bulkFormData.diseaseId)}
                </div>
                <div class="preview-symptoms">
                  <strong>อาการที่จะเพิ่ม:</strong>
                  <ul class="symptom-preview-list">
                    {#each bulkFormData.symptoms.filter(s => s.name.trim()) as symptom, index}
                      <li>{symptom.name}</li>
                    {/each}
                  </ul>
                </div>
              </div>
            </div>
          {/if}
        </div>

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
            disabled={!isBulkFormValid || formState.isSubmitting}
          >
            {#if formState.isSubmitting}
              <div class="spinner"></div>
              กำลังเพิ่ม...
            {:else}
              เพิ่ม {bulkFormData.symptoms.filter(s => s.name.trim()).length} อาการ
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </div>
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
  .symptom-form-page {
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

  /* Form Container */
  .form-container {
    max-width: 800px;
    margin: 0 auto;
  }

  /* Mode Selector */
  .mode-selector {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .mode-tabs {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }

  .mode-tab {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-lg);
    border: 1px solid var(--gray-300);
    background: white;
    color: var(--text-primary);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 14px;
    font-weight: 500;
  }

  .mode-tab:hover {
    background: var(--gray-100);
  }

  .mode-tab.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .mode-description {
    font-size: 14px;
    color: var(--text-secondary);
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

  .char-count,
  .symptom-count {
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .error-message {
    font-size: 12px;
    color: var(--danger);
    font-weight: 500;
  }

  /* Bulk Symptoms */
  .symptoms-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }

  .symptoms-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .symptom-input-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .symptom-number {
    width: 32px;
    text-align: right;
    font-weight: 500;
    color: var(--text-primary);
    flex-shrink: 0;
  }

  .symptom-input-row input {
    flex: 1;
    margin: 0;
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
    flex-shrink: 0;
  }

  .btn-icon:hover {
    background: var(--gray-100);
    color: var(--text-primary);
  }

  .btn-icon.delete:hover {
    background: rgba(231, 76, 60, 0.1);
    color: var(--danger);
  }

  /* Preview Section */
  .preview-section {
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--gray-200);
  }

  .preview-section h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
  }

  .preview-card {
    background: var(--gray-100);
    border-radius: var(--border-radius);
    padding: var(--spacing-md);
    font-size: 14px;
  }

  .preview-disease,
  .preview-symptom {
    margin-bottom: var(--spacing-sm);
  }

  .preview-disease:last-child,
  .preview-symptom:last-child {
    margin-bottom: 0;
  }

  .preview-symptoms {
    margin-bottom: var(--spacing-sm);
  }

  .symptom-preview-list {
    margin: var(--spacing-sm) 0 0 var(--spacing-lg);
    padding: 0;
  }

  .symptom-preview-list li {
    margin-bottom: var(--spacing-xs);
    color: var(--text-primary);
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

  .btn-outline {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--gray-300);
  }

  .btn-outline:hover:not(:disabled) {
    background: var(--gray-100);
  }

  .btn-sm {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 14px;
    min-height: 36px;
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

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .symptom-form-page {
      padding: var(--spacing-md);
    }

    .mode-tabs {
      flex-direction: column;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .field-meta {
      flex-direction: column;
      align-items: flex-start;
    }

    .symptoms-header {
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-sm);
    }

    .symptom-input-row {
      flex-wrap: wrap;
    }

    .symptom-number {
      width: auto;
    }
  }

  @media (max-width: 640px) {
    .title-section h1 {
      font-size: 24px;
    }

    .form-section {
      padding: var(--spacing-lg);
    }

    .form-actions {
      padding: var(--spacing-lg);
    }

    .breadcrumb {
      flex-wrap: wrap;
    }

    .mode-selector {
      padding: var(--spacing-md);
    }
  }
</style>