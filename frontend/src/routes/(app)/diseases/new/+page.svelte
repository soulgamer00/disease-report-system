<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    diseaseFormState,
    createDisease,
    checkDiseaseNameAvailability,
    clearDiseaseFormErrors,
    validateDiseaseData
  } from '$lib/stores/diseaseStore';
  import { authState, userRole } from '$lib/stores/auth';
  import type { CreateDiseaseData } from '$lib/api/types';

  // Reactive subscriptions
  $: formState = $diseaseFormState;
  $: user = $authState.user;
  $: role = $userRole;

  // Form data
  let formData: CreateDiseaseData = {
    thaiName: '',
    engName: '',
    daName: '',
    details: '',
    imageUrl: ''
  };

  // Validation state
  let fieldErrors: Record<string, string> = {};
  let isFormValid = false;
  let hasData = false;

  // Name availability checking
  let thaiNameAvailable = true;
  let engNameAvailable = true;
  let checkingNameAvailability = false;
  let nameCheckTimeout: any = null;

  onMount(() => {
    // Check permissions - Only SUPERUSER can manage diseases
    if (!role.isSuperuser) {
      goto('/dashboard');
      return;
    }

    clearDiseaseFormErrors();
  });

  // Check for any data
  $: hasData = formData.thaiName.trim() !== '' ||
               formData.engName.trim() !== '' ||
               formData.daName.trim() !== '' ||
               formData.details.trim() !== '' ||
               formData.imageUrl.trim() !== '';

  // Reactive declarations for character counts (แก้ไขตรงนี้)
  $: thaiNameCharCount = getCharacterCount(formData.thaiName, 100);
  $: engNameCharCount = getCharacterCount(formData.engName, 100);
  $: daNameCharCount = getCharacterCount(formData.daName, 25);
  $: detailsCharCount = getCharacterCount(formData.details, 1000);


  // Form validation
  function validateForm(): boolean {
    const errors = validateDiseaseData(formData);

    // Additional validation for name availability
    if (formData.thaiName.trim() && !thaiNameAvailable) {
      errors.thaiName = 'ชื่อโรคนี้มีอยู่ในระบบแล้ว';
    }

    if (formData.engName.trim() && !engNameAvailable) {
      errors.engName = 'ชื่อโรคภาษาอังกฤษนี้มีอยู่ในระบบแล้ว';
    }

    fieldErrors = errors;
    isFormValid = Object.keys(errors).length === 0 && thaiNameAvailable && engNameAvailable;

    return isFormValid;
  }

  // Name availability checking with debounce
  async function checkNameAvailability() {
    if (checkingNameAvailability) return;

    // Skip if thai name is empty
    if (!formData.thaiName.trim()) {
      thaiNameAvailable = true;
      engNameAvailable = true;
      return;
    }

    try {
      checkingNameAvailability = true;

      const result = await checkDiseaseNameAvailability(
        formData.thaiName.trim(),
        formData.engName?.trim() || undefined
      );

      if (result) {
        thaiNameAvailable = result.availability.thaiNameAvailable;
        engNameAvailable = result.availability.engNameAvailable;
        validateForm();
      }
    } catch (error) {
      console.error('Name availability check failed:', error);
      // Don't block form submission if check fails
      thaiNameAvailable = true;
      engNameAvailable = true;
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
  function handleThaiNameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    formData.thaiName = target.value;
    clearFieldError('thaiName');
    scheduleNameCheck();
    validateForm();
  }

  function handleEngNameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    formData.engName = target.value;
    clearFieldError('engName');
    scheduleNameCheck();
    validateForm();
  }

  function handleDaNameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    formData.daName = target.value;
    clearFieldError('daName');
    validateForm();
  }

  function handleDetailsInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    formData.details = target.value;
    clearFieldError('details');
    validateForm();
  }

  function handleImageUrlInput(event: Event) {
    const target = event.target as HTMLInputElement;
    formData.imageUrl = target.value;
    clearFieldError('imageUrl');
    validateForm();
  }

  // Form submission
  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    clearDiseaseFormErrors();

    // Clean up empty fields
    const cleanData: CreateDiseaseData = {
      thaiName: formData.thaiName.trim(),
      engName: formData.engName.trim() || undefined,
      daName: formData.daName.trim() || undefined,
      details: formData.details.trim() || undefined,
      imageUrl: formData.imageUrl.trim() || undefined
    };

    const result = await createDisease(cleanData);

    if (result) {
      goto('/diseases');
    }
  }

  function handleCancel() {
    goto('/diseases');
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
</script>

<svelte:head>
  <title>เพิ่มโรคใหม่ - ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
</svelte:head>

<div class="disease-form-page">
  <header class="page-header">
    <div class="header-content">
      <div class="breadcrumb">
        <button class="breadcrumb-link" on:click={() => goto('/diseases')}>
          จัดการข้อมูลโรค
        </button>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">เพิ่มโรคใหม่</span>
      </div>

      <div class="title-section">
        <h1>เพิ่มข้อมูลโรคใหม่</h1>
        <p>เพิ่มข้อมูลโรคติดต่อโดยแมลงเข้าสู่ระบบ</p>
      </div>
    </div>
  </header>

  <div class="form-container">
    <form class="disease-form" on:submit={handleSubmit}>
      <div class="form-section">
        <h2>ข้อมูลพื้นฐาน</h2>

        <div class="form-grid">
          <div class="form-group">
            <label for="thai-name" class="required">ชื่อโรคภาษาไทย</label>
            <div class="input-with-status">
              <input
                id="thai-name"
                type="text"
                placeholder="เช่น ไข้เลือดออก"
                value={formData.thaiName}
                on:input={handleThaiNameInput}
                class:error={fieldErrors.thaiName}
                class:checking={checkingNameAvailability}
                class:available={formData.thaiName.trim() && thaiNameAvailable}
                class:unavailable={formData.thaiName.trim() && !thaiNameAvailable}
                disabled={formState.isSubmitting}
                maxlength="100"
              />

              {#if checkingNameAvailability}
                <div class="input-status checking">
                  <div class="spinner"></div>
                </div>
              {:else if formData.thaiName.trim()}
                <div class="input-status {thaiNameAvailable ? 'available' : 'unavailable'}">
                  {#if thaiNameAvailable}
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
              <span class="field-help">ชื่อโรคในภาษาไทยที่ใช้ในการแสดงผล</span>
              <span class="char-count" class:near-limit={thaiNameCharCount.isNearLimit} class:over-limit={thaiNameCharCount.isOverLimit}>
                {thaiNameCharCount.count}/{thaiNameCharCount.max}
              </span>
            </div>

            {#if fieldErrors.thaiName}
              <span class="error-message">{fieldErrors.thaiName}</span>
            {/if}
          </div>

          <div class="form-group">
            <label for="eng-name">ชื่อโรคภาษาอังกฤษ</label>
            <div class="input-with-status">
              <input
                id="eng-name"
                type="text"
                placeholder="เช่น Dengue Fever"
                value={formData.engName}
                on:input={handleEngNameInput}
                class:error={fieldErrors.engName}
                class:available={formData.engName.trim() && engNameAvailable}
                class:unavailable={formData.engName.trim() && !engNameAvailable}
                disabled={formState.isSubmitting}
                maxlength="100"
              />

              {#if formData.engName.trim() && !checkingNameAvailability}
                <div class="input-status {engNameAvailable ? 'available' : 'unavailable'}">
                  {#if engNameAvailable}
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
              <span class="field-help">ชื่อโรคในภาษาอังกฤษ (ไม่บังคับ)</span>
              <span class="char-count" class:near-limit={engNameCharCount.isNearLimit} class:over-limit={engNameCharCount.isOverLimit}>
                {engNameCharCount.count}/{engNameCharCount.max}
              </span>
            </div>

            {#if fieldErrors.engName}
              <span class="error-message">{fieldErrors.engName}</span>
            {/if}
          </div>
        </div>

        <div class="form-group">
          <label for="da-name">รหัสโรค</label>
          <input
            id="da-name"
            type="text"
            placeholder="เช่น DF, CHIK, ZIKA"
            value={formData.daName}
            on:input={handleDaNameInput}
            class:error={fieldErrors.daName}
            disabled={formState.isSubmitting}
            maxlength="25"
          />

          <div class="field-meta">
            <span class="field-help">รหัสย่อของโรค (ไม่บังคับ)</span>
            <span class="char-count" class:near-limit={daNameCharCount.isNearLimit} class:over-limit={daNameCharCount.isOverLimit}>
              {daNameCharCount.count}/{daNameCharCount.max}
            </span>
          </div>

          {#if fieldErrors.daName}
            <span class="error-message">{fieldErrors.daName}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="details">รายละเอียดโรค</label>
          <textarea
            id="details"
            placeholder="อธิบายลักษณะของโรค อาการ วิธีการแพร่กระจาย และข้อมูลสำคัญอื่นๆ"
            value={formData.details}
            on:input={handleDetailsInput}
            class:error={fieldErrors.details}
            disabled={formState.isSubmitting}
            rows="5"
            maxlength="1000"
          ></textarea>

          <div class="field-meta">
            <span class="field-help">รายละเอียดและข้อมูลเพิ่มเติมเกี่ยวกับโรค (ไม่บังคับ)</span>
            <span class="char-count" class:near-limit={detailsCharCount.isNearLimit} class:over-limit={detailsCharCount.isOverLimit}>
              {detailsCharCount.count}/{detailsCharCount.max}
            </span>
          </div>

          {#if fieldErrors.details}
            <span class="error-message">{fieldErrors.details}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="image-url">URL รูปภาพ</label>
          <input
            id="image-url"
            type="url"
            placeholder="https://example.com/disease-image.jpg"
            value={formData.imageUrl}
            on:input={handleImageUrlInput}
            class:error={fieldErrors.imageUrl}
            disabled={formState.isSubmitting}
          />
          <span class="field-help">ลิงก์รูปภาพประกอบของโรค (ไม่บังคับ)</span>

          {#if fieldErrors.imageUrl}
            <span class="error-message">{fieldErrors.imageUrl}</span>
          {/if}
        </div>
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
          disabled={!isFormValid || formState.isSubmitting}
        >
          {#if formState.isSubmitting}
            <div class="spinner"></div>
            กำลังเพิ่ม...
          {:else}
            เพิ่มข้อมูลโรค
          {/if}
        </button>
      </div>
    </form>
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
  .disease-form-page {
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

  .disease-form {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
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
  .form-group textarea {
    padding: var(--spacing-md);
    border: 1px solid var(--gray-300);
    border-radius: var(--border-radius);
    font-size: 16px;
    min-height: 48px;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .form-group textarea {
    min-height: 120px;
    resize: vertical;
    font-family: inherit;
    line-height: 1.5;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
  }

  .form-group input:disabled,
  .form-group textarea:disabled {
    background: var(--gray-100);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .form-group input.error,
  .form-group textarea.error {
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

  .input.checking {
    padding-right: 48px;
  }

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

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .disease-form-page {
      padding: var(--spacing-md);
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .field-meta {
      flex-direction: column;
      align-items: flex-start;
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
  }
</style>