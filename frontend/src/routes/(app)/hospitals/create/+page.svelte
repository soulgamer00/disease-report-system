<!-- src/routes/(app)/hospitals/create/+page.svelte - Fixed Code Only -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    hospitalFormState,
    createHospital,
    checkHospitalCodeAvailability,
    resetHospitalFormState 
  } from '$lib/stores/hospitals';
  import { userRole } from '$lib/stores/auth';
  import type { CreateHospitalData } from '$lib/api/types';

  // ===== Form Data =====
  let formData: CreateHospitalData = {
    hospitalCode5Digit: '',
    hospitalName: '',
    hospitalCode9eDigit: '',
    hospitalCode9Digit: '',
    organizationType: '',
    healthServiceType: '',
    affiliation: '',
    departmentDivision: '',
  };

  let formErrors: Record<string, string> = {};
  let touchedFields: Record<string, boolean> = {};

  // ===== Reactive State =====
  $: isLoading = $hospitalFormState.isLoading;
  $: formError = $hospitalFormState.error;
  $: isCodeAvailable = $hospitalFormState.isCodeAvailable;
  $: isCheckingCode = $hospitalFormState.isCheckingCode;
  $: role = $userRole;

  // ✅ FIXED: Auto-check code availability for 5-9 character codes
  let codeCheckTimeout: number;
  $: if (formData.hospitalCode5Digit && (formData.hospitalCode5Digit.length >= 5 && formData.hospitalCode5Digit.length <= 9)) {
    clearTimeout(codeCheckTimeout);
    codeCheckTimeout = setTimeout(() => {
      if (!formErrors.hospitalCode5Digit) {
        checkHospitalCodeAvailability(formData.hospitalCode5Digit);
      }
    }, 300);
  }

  // ===== Lifecycle =====
  onMount(() => {
    console.log('DEBUG (hospitals/create): Component mounted');
    
    // Check permissions
    if (!role.isSuperuser) {
      console.log('DEBUG (hospitals/create): Insufficient permissions, redirecting');
      goto('/hospitals');
      return;
    }

    resetHospitalFormState();
  });

  // ===== Validation =====
  function validateField(field: string, value: string): string | null {
    switch (field) {
      case 'hospitalCode5Digit':
        if (!value) return 'รหัสโรงพยาบาลจำเป็นต้องระบุ';
        // ✅ FIXED: Support both 5-digit and 9e-digit codes
        if (value.length < 5) return 'รหัสโรงพยาบาลต้องมีอย่างน้อย 5 หลัก';
        if (value.length > 9) return 'รหัสโรงพยาบาลต้องไม่เกิน 9 หลัก';
        if (!/^[A-Z0-9]{5,9}$/.test(value)) return 'รหัสโรงพยาบาลต้องเป็นตัวอักษรพิมพ์ใหญ่และตัวเลขเท่านั้น';
        if (isCodeAvailable === false) return 'รหัสโรงพยาบาลนี้มีอยู่แล้วในระบบ';
        return null;

      case 'hospitalName':
        if (value && value.length < 2) return 'ชื่อโรงพยาบาลต้องมีอย่างน้อย 2 ตัวอักษร';
        if (value && value.length > 255) return 'ชื่อโรงพยาบาลต้องไม่เกิน 255 ตัวอักษร';
        if (value && !/^[\u0E00-\u0E7Fa-zA-Z0-9\s\-\(\)\.\,\/]+$/.test(value)) {
          return 'ชื่อโรงพยาบาลมีตัวอักษรที่ไม่อนุญาต';
        }
        return null;

      case 'hospitalCode9eDigit':
        if (value && value.length !== 9) return 'รหัส 9E ต้องมี 9 หลักเท่านั้น';
        if (value && !/^[A-Z0-9]{9}$/.test(value)) return 'รหัส 9E ต้องเป็นตัวอักษรพิมพ์ใหญ่และตัวเลขเท่านั้น';
        return null;

      case 'hospitalCode9Digit':
        if (value && value.length !== 9) return 'รหัส 9 หลักต้องมี 9 หลักเท่านั้น';
        if (value && !/^[A-Z0-9]{9}$/.test(value)) return 'รหัส 9 หลักต้องเป็นตัวอักษรพิมพ์ใหญ่และตัวเลขเท่านั้น';
        return null;

      case 'organizationType':
      case 'healthServiceType':
      case 'affiliation':
      case 'departmentDivision':
        if (value && value.length > 255) return 'ข้อมูลต้องไม่เกิน 255 ตัวอักษร';
        return null;

      default:
        return null;
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Validate all fields
    Object.keys(formData).forEach(field => {
      const value = formData[field as keyof CreateHospitalData] || '';
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });

    // Check code availability
    if (isCodeAvailable === false) {
      errors.hospitalCode5Digit = 'รหัสโรงพยาบาลนี้มีอยู่แล้วในระบบ';
      isValid = false;
    }

    if (isCheckingCode) {
      errors.hospitalCode5Digit = 'กำลังตรวจสอบรหัสโรงพยาบาล...';
      isValid = false;
    }

    formErrors = errors;
    return isValid;
  }

  // ===== Event Handlers =====
  function handleFieldChange(field: string, value: string) {
    formData[field as keyof CreateHospitalData] = value;
    touchedFields[field] = true;

    // Auto-capitalize codes
    if (field === 'hospitalCode5Digit' || field === 'hospitalCode9eDigit' || field === 'hospitalCode9Digit') {
      formData[field as keyof CreateHospitalData] = value.toUpperCase();
    }

    // Validate field
    const error = validateField(field, value);
    if (error) {
      formErrors[field] = error;
    } else {
      delete formErrors[field];
    }
    formErrors = { ...formErrors };
  }

  function handleFieldBlur(field: string) {
    touchedFields[field] = true;
    const value = formData[field as keyof CreateHospitalData] || '';
    const error = validateField(field, value);
    
    if (error) {
      formErrors[field] = error;
    } else {
      delete formErrors[field];
    }
    formErrors = { ...formErrors };
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    // Mark all fields as touched
    Object.keys(formData).forEach(field => {
      touchedFields[field] = true;
    });

    if (!validateForm()) {
      console.log('DEBUG (hospitals/create): Form validation failed');
      return;
    }

    console.log('DEBUG (hospitals/create): Submitting hospital creation');
    
    // Remove empty optional fields
    const cleanData: CreateHospitalData = {
      hospitalCode5Digit: formData.hospitalCode5Digit,
    };

    if (formData.hospitalName?.trim()) cleanData.hospitalName = formData.hospitalName.trim();
    if (formData.hospitalCode9eDigit?.trim()) cleanData.hospitalCode9eDigit = formData.hospitalCode9eDigit.trim();
    if (formData.hospitalCode9Digit?.trim()) cleanData.hospitalCode9Digit = formData.hospitalCode9Digit.trim();
    if (formData.organizationType?.trim()) cleanData.organizationType = formData.organizationType.trim();
    if (formData.healthServiceType?.trim()) cleanData.healthServiceType = formData.healthServiceType.trim();
    if (formData.affiliation?.trim()) cleanData.affiliation = formData.affiliation.trim();
    if (formData.departmentDivision?.trim()) cleanData.departmentDivision = formData.departmentDivision.trim();

    const success = await createHospital(cleanData);
    
    if (success) {
      console.log('DEBUG (hospitals/create): Hospital created successfully');
      goto('/hospitals');
    }
  }

  function handleCancel() {
    goto('/hospitals');
  }

  // ===== Utility Functions =====
  function getFieldError(field: string): string | null {
    return touchedFields[field] ? formErrors[field] || null : null;
  }

  function isFieldValid(field: string): boolean {
    return touchedFields[field] && !formErrors[field];
  }
</script>

<svelte:head>
  <title>เพิ่มโรงพยาบาลใหม่ - ระบบเฝ้าระวังโรคติดต่อโดยแมลง</title>
</svelte:head>

<div class="hospital-create">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="header-title">
        <button class="btn-back" on:click={handleCancel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
          กลับ
        </button>
        <div class="title-content">
          <h1>เพิ่มโรงพยาบาลใหม่</h1>
          <p>กรอกข้อมูลโรงพยาบาลที่ต้องการเพิ่มในระบบ</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Form Container -->
  <div class="form-container">
    <form on:submit={handleSubmit} class="hospital-form">
      <!-- Required Information Card -->
      <div class="form-card">
        <div class="card-header">
          <h2>ข้อมูลจำเป็น</h2>
          <span class="required-info">* ข้อมูลที่จำเป็นต้องกรอก</span>
        </div>
        
        <div class="card-body">
          <div class="form-grid">
            <!-- ✅ FIXED: Hospital Code (5-9 digits) -->
            <div class="form-group span-1">
              <label for="hospitalCode5Digit">
                รหัสโรงพยาบาล (5-9 หลัก) <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <input
                  id="hospitalCode5Digit"
                  type="text"
                  maxlength="9"
                  placeholder="เช่น VCH01 หรือ VCH010001"
                  value={formData.hospitalCode5Digit}
                  on:input={(e) => handleFieldChange('hospitalCode5Digit', e.currentTarget.value)}
                  on:blur={() => handleFieldBlur('hospitalCode5Digit')}
                  disabled={isLoading}
                  class:error={getFieldError('hospitalCode5Digit')}
                  class:success={isFieldValid('hospitalCode5Digit') && isCodeAvailable === true}
                  class:checking={isCheckingCode}
                />
                
                <!-- Code validation status -->
                {#if isCheckingCode}
                  <div class="input-status checking">
                    <div class="spinner small"></div>
                  </div>
                {:else if formData.hospitalCode5Digit.length >= 5 && isCodeAvailable === true}
                  <div class="input-status success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  </div>
                {:else if formData.hospitalCode5Digit.length >= 5 && isCodeAvailable === false}
                  <div class="input-status error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </div>
                {/if}
              </div>
              
              {#if getFieldError('hospitalCode5Digit')}
                <span class="error-message">{getFieldError('hospitalCode5Digit')}</span>
              {:else if isCodeAvailable === true && formData.hospitalCode5Digit.length >= 5}
                <span class="success-message">รหัสโรงพยาบาลพร้อมใช้งาน</span>
              {/if}
              <small class="field-hint">รหัสโรงพยาบาล 5-9 หลัก ประกอบด้วยตัวอักษรพิมพ์ใหญ่และตัวเลข</small>
            </div>

            <!-- Hospital Name -->
            <div class="form-group span-2">
              <label for="hospitalName">ชื่อโรงพยาบาล</label>
              <input
                id="hospitalName"
                type="text"
                placeholder="เช่น โรงพยาบาลพิษณุโลก"
                value={formData.hospitalName}
                on:input={(e) => handleFieldChange('hospitalName', e.currentTarget.value)}
                on:blur={() => handleFieldBlur('hospitalName')}
                disabled={isLoading}
                class:error={getFieldError('hospitalName')}
                class:success={isFieldValid('hospitalName')}
              />
              {#if getFieldError('hospitalName')}
                <span class="error-message">{getFieldError('hospitalName')}</span>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Optional Information Card -->
      <div class="form-card">
        <div class="card-header">
          <h2>ข้อมูลเพิ่มเติม</h2>
          <span class="optional-info">ข้อมูลเสริมสำหรับการจัดการ</span>
        </div>
        
        <div class="card-body">
          <div class="form-grid">
            <!-- 9E Code -->
            <div class="form-group">
              <label for="hospitalCode9eDigit">รหัส 9E หลัก</label>
              <input
                id="hospitalCode9eDigit"
                type="text"
                maxlength="9"
                placeholder="เช่น A12345678"
                value={formData.hospitalCode9eDigit}
                on:input={(e) => handleFieldChange('hospitalCode9eDigit', e.currentTarget.value)}
                on:blur={() => handleFieldBlur('hospitalCode9eDigit')}
                disabled={isLoading}
                class:error={getFieldError('hospitalCode9eDigit')}
                class:success={isFieldValid('hospitalCode9eDigit')}
              />
              {#if getFieldError('hospitalCode9eDigit')}
                <span class="error-message">{getFieldError('hospitalCode9eDigit')}</span>
              {/if}
            </div>

            <!-- 9 Digit Code -->
            <div class="form-group">
              <label for="hospitalCode9Digit">รหัส 9 หลัก</label>
              <input
                id="hospitalCode9Digit"
                type="text"
                maxlength="9"
                placeholder="เช่น 123456789"
                value={formData.hospitalCode9Digit}
                on:input={(e) => handleFieldChange('hospitalCode9Digit', e.currentTarget.value)}
                on:blur={() => handleFieldBlur('hospitalCode9Digit')}
                disabled={isLoading}
                class:error={getFieldError('hospitalCode9Digit')}
                class:success={isFieldValid('hospitalCode9Digit')}
              />
              {#if getFieldError('hospitalCode9Digit')}
                <span class="error-message">{getFieldError('hospitalCode9Digit')}</span>
              {/if}
            </div>

            <!-- Organization Type -->
            <div class="form-group">
              <label for="organizationType">ประเภทองค์กร</label>
              <select
                id="organizationType"
                value={formData.organizationType}
                on:change={(e) => handleFieldChange('organizationType', e.currentTarget.value)}
                on:blur={() => handleFieldBlur('organizationType')}
                disabled={isLoading}
                class:error={getFieldError('organizationType')}
                class:success={isFieldValid('organizationType')}
              >
                <option value="">เลือกประเภทองค์กร</option>
                <option value="โรงพยาบาลศูนย์">โรงพยาบาลศูนย์</option>
                <option value="โรงพยาบาลทั่วไป">โรงพยาบาลทั่วไป</option>
                <option value="โรงพยาบาลชุมชน">โรงพยาบาลชุมชน</option>
                <option value="โรงพยาบาลส่งเสริมสุขภาพตำบล">โรงพยาบาลส่งเสริมสุขภาพตำบล</option>
                <option value="สถานีอนามัย">สถานีอนามัย</option>
                <option value="คลินิก">คลินิก</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
              {#if getFieldError('organizationType')}
                <span class="error-message">{getFieldError('organizationType')}</span>
              {/if}
            </div>

            <!-- Health Service Type -->
            <div class="form-group">
              <label for="healthServiceType">ประเภทบริการสุขภาพ</label>
              <select
                id="healthServiceType"
                value={formData.healthServiceType}
                on:change={(e) => handleFieldChange('healthServiceType', e.currentTarget.value)}
                on:blur={() => handleFieldBlur('healthServiceType')}
                disabled={isLoading}
                class:error={getFieldError('healthServiceType')}
                class:success={isFieldValid('healthServiceType')}
              >
                <option value="">เลือกประเภทบริการ</option>
                <option value="บริการปฐมภูมิ">บริการปฐมภูมิ</option>
                <option value="บริการทุติยภูมิ">บริการทุติยภูมิ</option>
                <option value="บริการตติยภูมิ">บริการตติยภูมิ</option>
                <option value="บริการเฉพาะทาง">บริการเฉพาะทาง</option>
                <option value="บริการฉุกเฉิน">บริการฉุกเฉิน</option>
                <option value="บริการส่งเสริมป้องกัน">บริการส่งเสริมป้องกัน</option>
              </select>
              {#if getFieldError('healthServiceType')}
                <span class="error-message">{getFieldError('healthServiceType')}</span>
              {/if}
            </div>

            <!-- Affiliation -->
            <div class="form-group span-2">
              <label for="affiliation">สังกัด/หน่วยงานต้นสังกัด</label>
              <input
                id="affiliation"
                type="text"
                placeholder="เช่น กระทรวงสาธารณสุข, เทศบาล, องค์การบริหารส่วนตำบล"
                value={formData.affiliation}
                on:input={(e) => handleFieldChange('affiliation', e.currentTarget.value)}
                on:blur={() => handleFieldBlur('affiliation')}
                disabled={isLoading}
                class:error={getFieldError('affiliation')}
                class:success={isFieldValid('affiliation')}
              />
              {#if getFieldError('affiliation')}
                <span class="error-message">{getFieldError('affiliation')}</span>
              {/if}
            </div>

            <!-- Department Division -->
            <div class="form-group span-2">
              <label for="departmentDivision">แผนก/หน่วยงาน</label>
              <input
                id="departmentDivision"
                type="text"
                placeholder="เช่น แผนกอายุรกรรม, หน่วยเวชกรรมฉุกเฉิน"
                value={formData.departmentDivision}
                on:input={(e) => handleFieldChange('departmentDivision', e.currentTarget.value)}
                on:blur={() => handleFieldBlur('departmentDivision')}
                disabled={isLoading}
                class:error={getFieldError('departmentDivision')}
                class:success={isFieldValid('departmentDivision')}
              />
              {#if getFieldError('departmentDivision')}
                <span class="error-message">{getFieldError('departmentDivision')}</span>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Form Error -->
      {#if formError}
        <div class="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {formError}
        </div>
      {/if}

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary"
          on:click={handleCancel}
          disabled={isLoading}
        >
          ยกเลิก
        </button>
        
        <button
          type="submit"
          class="btn btn-primary"
          disabled={isLoading || isCheckingCode || Object.keys(formErrors).length > 0}
        >
          {#if isLoading}
            <div class="spinner small"></div>
            กำลังบันทึก...
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            บันทึกโรงพยาบาล
          {/if}
        </button>
      </div>
    </form>
  </div>
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
  .hospital-create {
    min-height: 100vh;
    background: var(--background);
    padding: 24px;
    max-width: 1000px;
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
    align-items: center;
    gap: 16px;
  }

  .btn-back {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--gray-200);
    border: none;
    border-radius: 8px;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 14px;
    transition: background 0.15s ease;
    min-height: 44px;
  }

  .btn-back:hover {
    background: var(--gray-300);
  }

  .title-content h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .title-content p {
    color: var(--text-secondary);
    font-size: 14px;
  }

  /* Form Container */
  .form-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .hospital-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Form Cards */
  .form-card {
    background: var(--card-bg);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .card-header {
    background: var(--gray-100);
    padding: 20px 24px;
    border-bottom: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .required-info {
    font-size: 12px;
    color: var(--danger);
    font-weight: 500;
  }

  .optional-info {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .card-body {
    padding: 24px;
  }

  /* Form Grid */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group.span-1 {
    grid-column: span 1;
  }

  .form-group.span-2 {
    grid-column: span 2;
  }

  /* Form Elements */
  label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .required {
    color: var(--danger);
    font-weight: 600;
  }

  .input-wrapper {
    position: relative;
  }

  input, select {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--gray-300);
    border-radius: 8px;
    font-size: 16px;
    background: var(--card-bg);
    min-height: 44px;
    box-sizing: border-box;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  input:focus, select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
  }

  input:disabled, select:disabled {
    background: var(--gray-100);
    cursor: not-allowed;
    opacity: 0.6;
  }

  input.error, select.error {
    border-color: var(--danger);
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
  }

  input.success, select.success {
    border-color: var(--success);
    box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
  }

  input.checking {
    border-color: var(--info);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  /* Input Status Icons */
  .input-status {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .input-status.success {
    color: var(--success);
  }

  .input-status.error {
    color: var(--danger);
  }

  .input-status.checking {
    color: var(--info);
  }

  /* Field Messages */
  .error-message {
    font-size: 12px;
    color: var(--danger);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .success-message {
    font-size: 12px;
    color: var(--success);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .field-hint {
    font-size: 12px;
    color: var(--text-secondary);
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
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

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Form Actions */
  .form-actions {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  /* Alert */
  .alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    font-size: 14px;
  }

  .alert-error {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.2);
    color: var(--danger);
  }

  /* Spinner */
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner.small {
    width: 16px;
    height: 16px;
    border-width: 2px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hospital-create {
      padding: 16px;
    }

    .page-header {
      padding: 16px;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-group.span-1,
    .form-group.span-2 {
      grid-column: span 1;
    }

    .card-body {
      padding: 16px;
    }

    .form-actions {
      padding: 16px;
      flex-direction: column;
    }

    .card-header {
      padding: 16px;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }

  @media (max-width: 640px) {
    .title-content h1 {
      font-size: 20px;
    }

    .btn-back {
      padding: 8px 12px;
      font-size: 12px;
    }

    input, select {
      font-size: 16px; /* Prevent zoom on iOS */
    }
  }
</style>