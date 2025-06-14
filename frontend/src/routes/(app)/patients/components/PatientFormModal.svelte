<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { patientActions, patientStore } from '$lib/stores/patientStore';
  import { patientApi } from '$lib/api/patients/client';
  import type { CreatePatientData, UpdatePatientData, DiseaseOption, HospitalOption, SymptomOption } from '$lib/api/patients/client';

  export let mode: 'create' | 'edit' = 'create';

  const dispatch = createEventDispatcher<{ close: void }>();

  // Form state
  let currentStep = 1;
  let formData: Partial<CreatePatientData> = {};
  let errors: Record<string, string> = {}; // Currently not used for display for all fields, but good to keep for validation
  let loading = false;
  let saving = false;

  // Reference data
  let diseases: DiseaseOption[] = [];
  let hospitals: HospitalOption[] = [];
  let symptoms: SymptomOption[] = [];

  // Reactive data
  $: currentPatient = $patientStore.currentPatient;
  $: isEdit = mode === 'edit';
  $: modalTitle = isEdit ? 'แก้ไขข้อมูลผู้ป่วย' : 'เพิ่มผู้ป่วยใหม่';

  // ✅ FIXED: Reactive statement to clear death data when patient is not deceased
  $: if (formData.patientCondition && formData.patientCondition !== 'เสียชีวิต') {
    formData.deathDate = null;
    formData.causeOfDeath = null;
    // Force reactivity update
    formData = { ...formData };
  }

  // Form steps
  const steps = [
    { id: 1, title: 'ข้อมูลส่วนตัว', icon: '👤' },
    { id: 2, title: 'ที่อยู่', icon: '🏠' },
    { id: 3, title: 'การเจ็บป่วย', icon: '🏥' },
    { id: 4, title: 'ผลตรวจ', icon: '🧪' },
    { id: 5, title: 'หมายเหตุ', icon: '📝' }
  ];

  // Load initial data
  onMount(async () => {
    loading = true;
    try {
      const [diseaseRes, hospitalRes] = await Promise.all([
        patientApi.getDiseases(),
        patientApi.getHospitals()
      ]);
      
      if (diseaseRes.success && diseaseRes.data) diseases = diseaseRes.data;
      if (hospitalRes.success && hospitalRes.data) hospitals = hospitalRes.data;

      // If editing, populate form with current patient data
      if (isEdit && currentPatient) {
        populateFormFromPatient(currentPatient);
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
      errors.general = 'ไม่สามารถโหลดข้อมูลที่จำเป็นได้ กรุณาลองใหม่อีกครั้ง';
    } finally {
      loading = false;
    }
  });

  // ✅ FIXED: Populate form with patient data (for edit mode)
  function populateFormFromPatient(patient: any): void {
    formData = {
      // Tab 1: Personal Info
      idCardCode: patient.idCardCode || '',
      patientHn: patient.patientHn || '',
      namePrefix: patient.namePrefix || '',
      patientName: patient.patientName || '',
      gender: patient.gender || '',
      birthday: patient.birthday ? patient.birthday.split('T')[0] : '',
      ageAtIllness: patient.ageAtIllness || 0,
      nationality: patient.nationality || '',
      maritalStatus: patient.maritalStatus || '',
      occupation: patient.occupation || '',
      phoneNumber: patient.phoneNumber || '',
      
      // Tab 2: Address
      currentHouseNumber: patient.currentHouseNumber || '',
      currentVillageNumber: patient.currentVillageNumber || '',
      currentRoadName: patient.currentRoadName || '',
      currentProvince: patient.currentProvince || '',
      currentDistrict: patient.currentDistrict || '',
      currentSubDistrict: patient.currentSubDistrict || '',
      addressSickHouseNumber: patient.addressSickHouseNumber || '',
      addressSickVillageNumber: patient.addressSickVillageNumber || '',
      addressSickRoadName: patient.addressSickRoadName || '',
      addressSickProvince: patient.addressSickProvince || '',
      addressSickDistrict: patient.addressSickDistrict || '',
      addressSickSubDistrict: patient.addressSickSubDistrict || '',
      
      // Tab 3: Illness
      diseaseId: patient.diseaseId || 0,
      symptomsOfDisease: patient.symptomsOfDisease || '',
      treatmentArea: patient.treatmentArea || '',
      treatmentHospital: patient.treatmentHospital || '',
      illnessDate: patient.illnessDate ? patient.illnessDate.split('T')[0] : '',
      treatmentDate: patient.treatmentDate ? patient.treatmentDate.split('T')[0] : '',
      diagnosisDate: patient.diagnosisDate ? patient.diagnosisDate.split('T')[0] : '',
      
      // Tab 4: Lab Results
      labResult: patient.labResult || '',
      ns1Result: patient.ns1Result || '',
      patientType: patient.patientType || '',
      patientCondition: patient.patientCondition || '',
      // ✅ FIXED: Handle deathDate properly - use null instead of empty string
      deathDate: patient.deathDate ? patient.deathDate.split('T')[0] : null,
      causeOfDeath: patient.causeOfDeath || '',
      
      // Tab 5: Notes
      receivingProvince: patient.receivingProvince || '',
      hospitalCode: patient.hospitalCode || '',
      remarks: patient.remarks || ''
    };

    // Load symptoms for the selected disease
    if (formData.diseaseId) {
      loadSymptoms(formData.diseaseId);
    }
  }

  // Load symptoms when disease changes
  async function loadSymptoms(diseaseId: number): Promise<void> {
    if (!diseaseId) {
      symptoms = [];
      return;
    }

    try {
      const response = await patientApi.getSymptomsByDisease(diseaseId);
      if (response.success && response.data) {
        symptoms = response.data;
      }
    } catch (error) {
      console.error('Failed to load symptoms:', error);
      errors.symptoms = 'ไม่สามารถโหลดอาการได้';
    }
  }

  // Handle disease selection
  function handleDiseaseChange(): void {
    if (formData.diseaseId) {
      loadSymptoms(formData.diseaseId);
    } else {
      symptoms = [];
    }
  }

  // Copy current address to sick address
  function copyCurrentToSickAddress(): void {
    formData = {
      ...formData, // Keep existing data
      addressSickHouseNumber: formData.currentHouseNumber,
      addressSickVillageNumber: formData.currentVillageNumber,
      addressSickRoadName: formData.currentRoadName,
      addressSickProvince: formData.currentProvince,
      addressSickDistrict: formData.currentDistrict,
      addressSickSubDistrict: formData.currentSubDistrict,
    };
  }

  // Navigation
  function nextStep(): void {
    if (currentStep < 5) currentStep++;
  }

  function prevStep(): void {
    if (currentStep > 1) currentStep--;
  }

  function goToStep(step: number): void {
    currentStep = step;
  }

  // ✅ FIXED: Form submission with proper data cleaning
  async function handleSubmit(): Promise<void> {
    saving = true;
    errors = {}; // Clear previous errors

    try {
      // ✅ FIXED: Clean data before sending to prevent validation errors
      const cleanedData = { ...formData };
      
      // Remove death-related fields if patient is not deceased
      if (cleanedData.patientCondition !== 'เสียชีวิต') {
        delete cleanedData.deathDate;
        delete cleanedData.causeOfDeath;
      }
      
      // Convert null values to undefined for optional fields
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === null || cleanedData[key] === '') {
          if (['deathDate', 'causeOfDeath', 'patientHn'].includes(key)) {
            delete cleanedData[key];
          }
        }
      });

      let success = false;
      
      if (isEdit && currentPatient) {
        success = await patientActions.updatePatient(currentPatient.id, cleanedData as UpdatePatientData);
      } else {
        success = await patientActions.createPatient(cleanedData as CreatePatientData);
      }

      if (success) {
        closeModal();
      } else {
        // This 'else' block would catch if patientActions returns false
        // often indicating a validation error from the backend.
        // You might need to parse specific error messages from the store or API response.
        errors.general = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง';
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      // More detailed error handling for API errors, e.g., displaying specific validation messages
      if (error.response && error.response.data && error.response.data.message) {
        errors.general = `ข้อผิดพลาด: ${error.response.data.message}`;
      } else {
        errors.general = 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง';
      }
    } finally {
      saving = false;
    }
  }

  // Close modal
  function closeModal(): void {
    dispatch('close');
  }

  // Form options (unchanged)
  const genderOptions = [
    { value: 'M', label: 'ชาย' },
    { value: 'F', label: 'หญิง' }
  ];

  const maritalStatusOptions = [
    { value: 'SINGLE', label: 'โสด' },
    { value: 'MARRIED', label: 'สมรส' },
    { value: 'DIVORCED', label: 'หย่าร้าง' },
    { value: 'WIDOWED', label: 'ม่าย' },
    { value: 'SEPARATED', label: 'แยกกันอยู่' },
    { value: 'OTHER', label: 'อื่นๆ' }
  ];

  const namePrefixOptions = [
    { value: 'นาย', label: 'นาย' },
    { value: 'นาง', label: 'นาง' },
    { value: 'นางสาว', label: 'นางสาว' },
    { value: 'เด็กหญิง', label: 'เด็กหญิง' },
    { value: 'เด็กชาย', label: 'เด็กชาย' }
  ];

  const treatmentAreaOptions = [
    { value: 'เทศบาล', label: 'เทศบาล' },
    { value: 'อบต.', label: 'อบต.' },
    { value: 'ไม่ทราบ', label: 'ไม่ทราบ' }
  ];

  const patientTypeOptions = [
    { value: 'IPD', label: 'ผู้ป่วยใน (IPD)' },
    { value: 'OPD', label: 'ผู้ป่วยนอก (OPD)' },
    { value: 'ACF', label: 'Active Case Finding (ACF)' }
  ];

  const conditionOptions = [
    { value: 'ยังรักษาตัวอยู่', label: 'ยังรักษาตัวอยู่' },
    { value: 'หายจากโรคแล้ว', label: 'หายจากโรคแล้ว' },
    { value: 'เสียชีวิต', label: 'เสียชีวิต' },
    { value: 'ไม่ทราบ', label: 'ไม่ทราบ' }
  ];
</script>

<div class="modal-overlay">
  <div class="modal" on:click|stopPropagation>
    {#if loading}
      <div class="loading-container">
        <div class="spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    {:else}
      <div class="modal-header">
        <h3>{modalTitle}</h3>
        <button type="button" class="btn-close" on:click={closeModal}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="step-navigator">
        {#each steps as step}
          <button 
            type="button"
            class="step-btn {currentStep === step.id ? 'active' : ''} {currentStep > step.id ? 'completed' : ''}"
            on:click={() => goToStep(step.id)}
          >
            <span class="step-icon">{step.icon}</span>
            <span class="step-title">{step.title}</span>
          </button>
        {/each}
      </div>

      <form class="form-content" on:submit|preventDefault={handleSubmit}>
        {#if currentStep === 1}
          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label for="idCardCode">เลขบัตรประชาชน <span class="required">*</span></label>
                <input
                  id="idCardCode"
                  type="text"
                  bind:value={formData.idCardCode}
                  placeholder="1234567890123"
                  maxlength="13"
                  required
                />
                {#if errors.idCardCode}<p class="error-message">{errors.idCardCode}</p>{/if}
              </div>
              <div class="form-group">
                <label for="patientHn">เลข HN</label>
                <input
                  id="patientHn"
                  type="text"
                  bind:value={formData.patientHn}
                  placeholder="HN001"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="namePrefix">คำนำหน้า <span class="required">*</span></label>
                <select id="namePrefix" bind:value={formData.namePrefix} required>
                  <option value="">เลือกคำนำหน้า</option>
                  {#each namePrefixOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              </div>
              <div class="form-group flex-2">
                <label for="patientName">ชื่อ-นามสกุล <span class="required">*</span></label>
                <input
                  id="patientName"
                  type="text"
                  bind:value={formData.patientName}
                  placeholder="ชื่อ นามสกุล"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="gender">เพศ <span class="required">*</span></label>
                <select id="gender" bind:value={formData.gender} required>
                  <option value="">เลือกเพศ</option>
                  {#each genderOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              </div>
              <div class="form-group">
                <label for="birthday">วันเกิด <span class="required">*</span></label>
                <input
                  id="birthday"
                  type="date"
                  bind:value={formData.birthday}
                  required
                />
              </div>
              <div class="form-group">
                <label for="ageAtIllness">อายุขณะป่วย <span class="required">*</span></label>
                <input
                  id="ageAtIllness"
                  type="number"
                  bind:value={formData.ageAtIllness}
                  min="0"
                  max="150"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="nationality">สัญชาติ <span class="required">*</span></label>
                <input
                  id="nationality"
                  type="text"
                  bind:value={formData.nationality}
                  placeholder="ไทย"
                  required
                />
              </div>
              <div class="form-group">
                <label for="maritalStatus">สถานภาพ <span class="required">*</span></label>
                <select id="maritalStatus" bind:value={formData.maritalStatus} required>
                  <option value="">เลือกสถานภาพ</option>
                  {#each maritalStatusOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="occupation">อาชีพ <span class="required">*</span></label>
                <input
                  id="occupation"
                  type="text"
                  bind:value={formData.occupation}
                  placeholder="เกษตรกร, ค้าขาย, ..."
                  required
                />
              </div>
              <div class="form-group">
                <label for="phoneNumber">เบอร์โทรศัพท์ <span class="required">*</span></label>
                <input
                  id="phoneNumber"
                  type="tel"
                  bind:value={formData.phoneNumber}
                  placeholder="081-234-5678"
                  required
                />
              </div>
            </div>
          </div>

        {:else if currentStep === 2}
          <div class="form-section">
            <h3>ที่อยู่ปัจจุบัน</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="currentHouseNumber">บ้านเลขที่ <span class="required">*</span></label>
                <input
                  id="currentHouseNumber"
                  type="text"
                  bind:value={formData.currentHouseNumber}
                  placeholder="123"
                  required
                />
              </div>
              <div class="form-group">
                <label for="currentVillageNumber">หมู่ที่ <span class="required">*</span></label>
                <input
                  id="currentVillageNumber"
                  type="text"
                  bind:value={formData.currentVillageNumber}
                  placeholder="1"
                  required
                />
              </div>
              <div class="form-group flex-2">
                <label for="currentRoadName">ถนน <span class="required">*</span></label>
                <input
                  id="currentRoadName"
                  type="text"
                  bind:value={formData.currentRoadName}
                  placeholder="สายหลัก"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="currentProvince">จังหวัด <span class="required">*</span></label>
                <input
                  id="currentProvince"
                  type="text"
                  bind:value={formData.currentProvince}
                  placeholder="เพชรบูรณ์"
                  required
                />
              </div>
              <div class="form-group">
                <label for="currentDistrict">อำเภอ <span class="required">*</span></label>
                <input
                  id="currentDistrict"
                  type="text"
                  bind:value={formData.currentDistrict}
                  placeholder="วิเชียรบุรี"
                  required
                />
              </div>
              <div class="form-group">
                <label for="currentSubDistrict">ตำบล <span class="required">*</span></label>
                <input
                  id="currentSubDistrict"
                  type="text"
                  bind:value={formData.currentSubDistrict}
                  placeholder="ท่าโรง"
                  required
                />
              </div>
            </div>

            <h3>ที่อยู่ที่เกิดอาการป่วย</h3>
            
            <div class="copy-address">
              <button type="button" class="btn btn-secondary" on:click={copyCurrentToSickAddress}>
                📋 คัดลอกจากที่อยู่ปัจจุบัน
              </button>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="addressSickHouseNumber">บ้านเลขที่ <span class="required">*</span></label>
                <input
                  id="addressSickHouseNumber"
                  type="text"
                  bind:value={formData.addressSickHouseNumber}
                  placeholder="123"
                  required
                />
              </div>
              <div class="form-group">
                <label for="addressSickVillageNumber">หมู่ที่ <span class="required">*</span></label>
                <input
                  id="addressSickVillageNumber"
                  type="text"
                  bind:value={formData.addressSickVillageNumber}
                  placeholder="1"
                  required
                />
              </div>
              <div class="form-group flex-2">
                <label for="addressSickRoadName">ถนน <span class="required">*</span></label>
                <input
                  id="addressSickRoadName"
                  type="text"
                  bind:value={formData.addressSickRoadName}
                  placeholder="สายหลัก"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="addressSickProvince">จังหวัด <span class="required">*</span></label>
                <input
                  id="addressSickProvince"
                  type="text"
                  bind:value={formData.addressSickProvince}
                  placeholder="เพชรบูรณ์"
                  required
                />
              </div>
              <div class="form-group">
                <label for="addressSickDistrict">อำเภอ <span class="required">*</span></label>
                <input
                  id="addressSickDistrict"
                  type="text"
                  bind:value={formData.addressSickDistrict}
                  placeholder="วิเชียรบุรี"
                  required
                />
              </div>
              <div class="form-group">
                <label for="addressSickSubDistrict">ตำบล <span class="required">*</span></label>
                <input
                  id="addressSickSubDistrict"
                  type="text"
                  bind:value={formData.addressSickSubDistrict}
                  placeholder="ท่าโรง"
                  required
                />
              </div>
            </div>
          </div>

        {:else if currentStep === 3}
          <div class="form-section">
            <h3>ข้อมูลการเจ็บป่วย</h3>
            
            <div class="form-row">
              <div class="form-group flex-2">
                <label for="diseaseId">โรค <span class="required">*</span></label>
                <select 
                  id="diseaseId" 
                  bind:value={formData.diseaseId} 
                  on:change={handleDiseaseChange}
                  required
                >
                  <option value="">เลือกโรค</option>
                  {#each diseases as disease}
                    <option value={disease.id}>
                      {disease.thaiName}
                      {#if disease.engName}({disease.engName}){/if}
                    </option>
                  {/each}
                </select>
              </div>
              <div class="form-group">
                <label for="treatmentArea">พื้นที่รักษา <span class="required">*</span></label>
                <select id="treatmentArea" bind:value={formData.treatmentArea} required>
                  <option value="">เลือกพื้นที่</option>
                  {#each treatmentAreaOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="symptomsOfDisease">อาการที่พบ <span class="required">*</span></label>
                <textarea
                  id="symptomsOfDisease"
                  bind:value={formData.symptomsOfDisease}
                  placeholder="ระบุอาการที่พบ..."
                  rows="3"
                  required
                ></textarea>
                {#if symptoms.length > 0}
                  <div class="symptom-suggestions">
                    <p>อาการทั่วไป:</p>
                    <div class="symptom-buttons-container">
                      {#each symptoms as symptom}
                        <button 
                          type="button" 
                          class="symptom-btn"
                          on:click={() => {
                            if (formData.symptomsOfDisease) {
                              formData.symptomsOfDisease += ', ' + symptom.name;
                            } else {
                              formData.symptomsOfDisease = symptom.name;
                            }
                            formData = { ...formData }; // Ensure reactivity for textarea
                          }}
                        >
                          {symptom.name}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-2">
                <label for="treatmentHospital">โรงพยาบาลหลัก <span class="required">*</span></label>
                <input
                  id="treatmentHospital"
                  type="text"
                  bind:value={formData.treatmentHospital}
                  placeholder="โรงพยาบาลวิเชียรบุรี"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="illnessDate">วันที่เจ็บป่วย <span class="required">*</span></label>
                <input
                  id="illnessDate"
                  type="date"
                  bind:value={formData.illnessDate}
                  required
                />
              </div>
              <div class="form-group">
                <label for="treatmentDate">วันที่รักษา <span class="required">*</span></label>
                <input
                  id="treatmentDate"
                  type="date"
                  bind:value={formData.treatmentDate}
                  required
                />
              </div>
              <div class="form-group">
                <label for="diagnosisDate">วันที่วินิจฉัย <span class="required">*</span></label>
                <input
                  id="diagnosisDate"
                  type="date"
                  bind:value={formData.diagnosisDate}
                  required
                />
              </div>
            </div>
          </div>

        {:else if currentStep === 4}
          <div class="form-section">
            <h3>ผลตรวจและสถานะผู้ป่วย</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="labResult">ผลตรวจ <span class="required">*</span></label>
                <input
                  id="labResult"
                  type="text"
                  bind:value={formData.labResult}
                  placeholder="เช่น Positive, Negative, หรือผลตรวจอื่นๆ"
                  required
                />
              </div>
              <div class="form-group">
                <label for="ns1Result">ผล NS1 <span class="required">*</span></label>
                <input
                  id="ns1Result"
                  type="text"
                  bind:value={formData.ns1Result}
                  placeholder="เช่น Positive, Negative, หรือผลตรวจอื่นๆ"
                  required
                />
              </div>
              <div class="form-group">
                <label for="patientType">ประเภทผู้ป่วย <span class="required">*</span></label>
                <select id="patientType" bind:value={formData.patientType} required>
                  <option value="">เลือกประเภท</option>
                  {#each patientTypeOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="patientCondition">สภาพผู้ป่วย <span class="required">*</span></label>
                <select id="patientCondition" bind:value={formData.patientCondition} required>
                  <option value="">เลือกสภาพ</option>
                  {#each conditionOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              </div>
              
              {#if formData.patientCondition === 'เสียชีวิต'}
                <div class="form-group">
                  <label for="deathDate">วันที่เสียชีวิต</label>
                  <input
                    id="deathDate"
                    type="date"
                    bind:value={formData.deathDate}
                  />
                </div>
                <div class="form-group">
                  <label for="causeOfDeath">สาเหตุการเสียชีวิต</label>
                  <input
                    id="causeOfDeath"
                    type="text"
                    bind:value={formData.causeOfDeath}
                    placeholder="ระบุสาเหตุ..."
                  />
                </div>
              {/if}
            </div>
          </div>

        {:else if currentStep === 5}
          <div class="form-section">
            <h3>หมายเหตุและข้อมูลเพิ่มเติม</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="receivingProvince">จังหวัดที่รับผิดชอบ <span class="required">*</span></label>
                <input
                  id="receivingProvince"
                  type="text"
                  bind:value={formData.receivingProvince}
                  placeholder="เพชรบูรณ์"
                  required
                />
              </div>
              <div class="form-group">
                <label for="hospitalCode">รหัสโรงพยาบาล <span class="required">*</span></label>
                <select id="hospitalCode" bind:value={formData.hospitalCode} required>
                  <option value="">เลือกโรงพยาบาล</option>
                  {#each hospitals as hospital}
                    <option value={hospital.hospitalCode5Digit}>
                      {hospital.hospitalCode5Digit} - {hospital.hospitalName}
                    </option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="remarks">หมายเหตุ <span class="required">*</span></label>
                <textarea
                  id="remarks"
                  bind:value={formData.remarks}
                  placeholder="หมายเหตุเพิ่มเติม..."
                  rows="4"
                  required
                ></textarea>
              </div>
            </div>
          </div>
        {/if}

        {#if errors.general}
          <div class="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {errors.general}
          </div>
        {/if}

        <div class="form-navigation">
          <div class="nav-left">
            {#if currentStep > 1}
              <button type="button" class="btn btn-secondary" on:click={prevStep}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="15,18 9,12 15,6"/>
                </svg>
                ก่อนหน้า
              </button>
            {/if}
          </div>
          
          <div class="nav-center">
            <span class="step-indicator">ขั้นตอน {currentStep} จาก {steps.length}</span>
          </div>

          <div class="nav-right">
            {#if currentStep < steps.length}
              <button type="button" class="btn btn-primary" on:click={nextStep}>
                ถัดไป
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </button>
            {:else}
              <button type="submit" class="btn btn-success" disabled={saving}>
                {#if saving}
                  <div class="spinner small"></div>
                  กำลังบันทึก...
                {:else}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                {/if}
              </button>
            {/if}
          </div>
        </div>
      </form>
    {/if}
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

  /* Modal Overlay and Container */
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
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  }

  /* Loading State */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    color: var(--text-secondary);
    min-height: 300px; /* Ensure loading state has some height */
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
    margin-right: 8px; /* Space between spinner and text in button */
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Modal Header */
  .modal-header {
    padding: 20px;
    border-bottom: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
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

  /* Step Navigator */
  .step-navigator {
    display: flex;
    background: var(--gray-100);
    border-bottom: 1px solid var(--gray-200);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .step-btn {
    flex: 1;
    min-width: 120px;
    background: none;
    border: none;
    padding: 12px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: all 0.2s ease;
    color: var(--text-secondary);
  }

  .step-btn:hover {
    background: rgba(22, 160, 133, 0.1);
    color: var(--primary);
  }

  .step-btn.active {
    background: var(--primary);
    color: white;
    box-shadow: inset 0 -3px 0 0 var(--primary);
  }

  .step-btn.completed {
    background: var(--success);
    color: white;
  }

  .step-icon {
    font-size: 16px;
  }

  .step-title {
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  /* Form Content */
  .form-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .form-section h3 {
    margin: 0 0 16px 0;
    color: var(--text-primary);
    border-bottom: 2px solid var(--primary);
    padding-bottom: 8px;
    font-size: 18px;
    font-weight: 600;
  }

  .form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .form-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 180px;
  }

  .form-group.flex-2 {
    flex: 2;
  }

  .form-group label {
    margin-bottom: 6px;
    font-weight: 500;
    color: var(--text-primary);
    font-size: 14px;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 10px 12px;
    border: 1px solid var(--gray-300);
    border-radius: 8px;
    font-size: 15px;
    color: var(--text-primary);
    background-color: var(--card-bg);
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.2);
  }

  .form-group textarea {
    resize: vertical;
    min-height: 80px;
  }

  .required {
    color: var(--danger);
    margin-left: 4px;
  }

  .error-message {
    color: var(--danger);
    font-size: 12px;
    margin-top: 4px;
  }

  .copy-address {
    margin: 16px 0;
    text-align: right;
  }

  .symptom-suggestions {
    margin-top: 12px;
    padding: 12px;
    background: var(--gray-100);
    border-radius: 8px;
  }

  .symptom-suggestions p {
    margin: 0 0 10px 0;
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .symptom-buttons-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .symptom-btn {
    background: var(--card-bg);
    border: 1px solid var(--gray-300);
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-primary);
    transition: all 0.15s ease;
  }

  .symptom-btn:hover {
    background: rgba(22, 160, 133, 0.1);
    border-color: var(--primary);
    color: var(--primary);
  }

  /* Form Navigation */
  .form-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-top: 1px solid var(--gray-200);
    background: var(--gray-100);
    flex-wrap: wrap;
    gap: 12px;
  }

  .nav-left,
  .nav-right {
    flex: 1;
    display: flex;
  }

  .nav-right {
    justify-content: flex-end;
  }

  .nav-center {
    text-align: center;
    flex-grow: 1;
  }

  .step-indicator {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
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

  .btn-success {
    background: var(--success);
    color: white;
  }

  .btn-success:hover:not(:disabled) {
    background: #229954;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Alert */
  .alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    margin-top: 16px;
    margin-bottom: 0;
    font-size: 14px;
  }

  .alert-error {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.2);
    color: var(--danger);
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .modal {
      width: 95%;
      max-height: 95vh;
      margin: 0;
    }

    .form-row {
      flex-direction: column;
      gap: 12px;
    }

    .form-group {
      min-width: unset;
    }

    .step-navigator {
      padding: 0 8px;
    }

    .step-btn {
      min-width: 90px;
      padding: 10px 6px;
    }

    .step-title {
      font-size: 11px;
    }

    .form-navigation {
      flex-direction: column;
      align-items: stretch;
    }

    .nav-left,
    .nav-right,
    .nav-center {
      text-align: center;
      flex: none;
      width: 100%;
    }

    .btn {
      width: 100%;
    }

    .copy-address {
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .modal-header h3 {
      font-size: 18px;
    }

    .form-content {
      padding: 16px;
    }

    .form-section h3 {
      font-size: 16px;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      font-size: 14px;
      padding: 8px 10px;
    }

    .symptom-suggestions {
      padding: 10px;
    }
  }
</style>