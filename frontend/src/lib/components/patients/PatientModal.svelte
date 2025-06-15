{:else if currentStep === 2}
          <!-- Tab 2: Address Information -->
          <div class="form-section">
            <h3>ที่อยู่ปัจจุบัน</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="currentHouseNumber">บ้านเลขที่ *</label>
                <input
                  id="currentHouseNumber"
                  type="text"
                  bind:value={formData.currentHouseNumber}
                  placeholder="123"
                  class:error={errors.currentHouseNumber}
                  required
                />
                {#if errors.currentHouseNumber}
                  <span class="error-message">{errors.currentHouseNumber}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="currentVillageNumber">หมู่ที่ *</label>
                <input
                  id="currentVillageNumber"
                  type="text"
                  bind:value={formData.currentVillageNumber}
                  placeholder="1"
                  class:error={errors.currentVillageNumber}
                  required
                />
                {#if errors.currentVillageNumber}
                  <span class="error-message">{errors.currentVillageNumber}</span>
                {/if}
              </div>
              <div class="form-group flex-2">
                <label for="currentRoadName">ถนน *</label>
                <input
                  id="currentRoadName"
                  type="text"
                  bind:value={formData.currentRoadName}
                  placeholder="สายหลัก"
                  class:error={errors.currentRoadName}
                  required
                />
                {#if errors.currentRoadName}
                  <span class="error-message">{errors.currentRoadName}</span>
                {/if}
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="currentProvince">จังหวัด *</label>
                <input
                  id="currentProvince"
                  type="text"
                  bind:value={formData.currentProvince}
                  placeholder="เพชรบูรณ์"
                  class:error={errors.currentProvince}
                  required
                />
                {#if errors.currentProvince}
                  <span class="error-message">{errors.currentProvince}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="currentDistrict">อำเภอ *</label>
                <input
                  id="currentDistrict"
                  type="text"
                  bind:value={formData.currentDistrict}
                  placeholder="วิเชียรบุรี"
                  class:error={errors.currentDistrict}
                  required
                />
                {#if errors.currentDistrict}
                  <span class="error-message">{errors.currentDistrict}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="currentSubDistrict">ตำบล *</label>
                <input
                  id="currentSubDistrict"
                  type="text"
                  bind:value={formData.currentSubDistrict}
                  placeholder="ท่าโรง"
                  class:error={errors.currentSubDistrict}
                  required
                />
                {#if errors.currentSubDistrict}
                  <span class="error-message">{errors.currentSubDistrict}</span>
                {/if}
              </div>
            </div>

            <h3>ที่อยู่ที่เกิดอาการป่วย</h3>
            
            <div class="copy-address">
              <button type="button" class="btn-copy" on:click={copyCurrentToSickAddress}>
                📋 คัดลอกจากที่อยู่ปัจจุบัน
              </button>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="addressSickHouseNumber">บ้านเลขที่ *</label>
                <input
                  id="addressSickHouseNumber"
                  type="text"
                  bind:value={formData.addressSickHouseNumber}
                  placeholder="123"
                  class:error={errors.addressSickHouseNumber}
                  required
                />
                {#if errors.addressSickHouseNumber}
                  <span class="error-message">{errors.addressSickHouseNumber}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="addressSickVillageNumber">หมู่ที่ *</label>
                <input
                  id="addressSickVillageNumber"
                  type="text"
                  bind:value={formData.addressSickVillageNumber}
                  placeholder="1"
                  class:error={errors.addressSickVillageNumber}
                  required
                />
                {#if errors.addressSickVillageNumber}
                  <span class="error-message">{errors.addressSickVillageNumber}</span>
                {/if}
              </div>
              <div class="form-group flex-2">
                <label for="addressSickRoadName">ถนน *</label>
                <input
                  id="addressSickRoadName"
                  type="text"
                  bind:value={formData.addressSickRoadName}
                  placeholder="สายหลัก"
                  class:error={errors.addressSickRoadName}
                  required
                />
                {#if errors.addressSickRoadName}
                  <span class="error-message">{errors.addressSickRoadName}</span>
                {/if}
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="addressSickProvince">จังหวัด *</label>
                <input
                  id="addressSickProvince"
                  type="text"
                  bind:value={formData.addressSickProvince}
                  placeholder="เพชรบูรณ์"
                  class:error={errors.addressSickProvince}
                  required
                />
                {#if errors.addressSickProvince}
                  <span class="error-message">{errors.addressSickProvince}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="addressSickDistrict">อำเภอ *</label>
                <input
                  id="addressSickDistrict"
                  type="text"
                  bind:value={formData.addressSickDistrict}
                  placeholder="วิเชียรบุรี"
                  class:error={errors.addressSickDistrict}
                  required
                />
                {#if errors.addressSickDistrict}
                  <span class="error-message">{errors.addressSickDistrict}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="addressSickSubDistrict">ตำบล *</label>
                <input
                  id="addressSickSubDistrict"
                  type="text"
                  bind:value={formData.addressSickSubDistrict}
                  placeholder="ท่าโรง"
                  class:error={errors.addressSickSubDistrict}
                  required
                />
                {#if errors.addressSickSubDistrict}
                  <span class="error-message">{errors.addressSickSubDistrict}</span>
                {/if}
              </div>
            </div>
          </div>

        {:else if currentStep === 3}
          <!-- Tab 3: Illness Information -->
          <div class="form-section">
            <h3>ข้อมูลการเจ็บป่วย</h3>
            
            <div class="form-row">
              <div class="form-group flex-2">
                <label for="diseaseId">โรค *</label>
                <select 
                  id="diseaseId" 
                  bind:value={formData.diseaseId} 
                  on:change={handleDiseaseChange}
                  class:error={errors.diseaseId}
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
                {#if errors.diseaseId}
                  <span class="error-message">{errors.diseaseId}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="treatmentArea">พื้นที่รักษา *</label>
                <select id="treatmentArea" bind:value={formData.treatmentArea} class:error={errors.treatmentArea} required>
                  <option value="">เลือกพื้นที่</option>
                  {#each treatmentAreaOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
                {#if errors.treatmentArea}
                  <span class="error-message">{errors.treatmentArea}</span>
                {/if}
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="symptomsOfDisease">อาการที่พบ *</label>
                <textarea
                  id="symptomsOfDisease"
                  bind:value={formData.symptomsOfDisease}
                  placeholder="ระบุอาการที่พบ..."
                  rows="3"
                  class:error={errors.symptomsOfDisease}
                  required
                ></textarea>
                {#if errors.symptomsOfDisease}
                  <span class="error-message">{errors.symptomsOfDisease}</span>
                {/if}
                {#if symptoms.length > 0}
                  <div class="symptom-suggestions">
                    <p>อาการทั่วไป:</p>
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
                        }}
                      >
                        {symptom.name}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-2">
                <label for="treatmentHospital">โรงพยาบาลหลัก *</label>
                <input
                  id="treatmentHospital"
                  type="text"
                  bind:value={formData.treatmentHospital}
                  placeholder="โรงพยาบาลวิเชียรบุรี"
                  class:error={errors.treatmentHospital}
                  required
                />
                {#if errors.treatmentHospital}
                  <span class="error-message">{errors.treatmentHospital}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="hospitalCode">รหัสโรงพยาบาล *</label>
                <select id="hospitalCode" bind:value={formData.hospitalCode} class:error={errors.hospitalCode} required>
                  <option value="">เลือกโรงพยาบาล</option>
                  {#each hospitals as hospital}
                    <option value={hospital.hospitalCode5Digit}>
                      {hospital.hospitalCode5Digit} - {hospital.hospitalName}
                    </option>
                  {/each}
                </select>
                {#if errors.hospitalCode}
                  <span class="error-message">{errors.hospitalCode}</span>
                {/if}
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="illnessDate">วันที่เจ็บป่วย *</label>
                <input
                  id="illnessDate"
                  type="date"
                  bind:value={formData.illnessDate}
                  class:error={errors.illnessDate}
                  required
                />
                {#if errors.illnessDate}
                  <span class="error-message">{errors.illnessDate}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="treatmentDate">วันที่รักษา *</label>
                <input
                  id="treatmentDate"
                  type="date"
                  bind:value={formData.treatmentDate}
                  class:error={errors.treatmentDate}
                  required
                />
                {#if errors.treatmentDate}
                  <span class="error-message">{errors.treatmentDate}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="diagnosisDate">วันที่วินิจฉัย *</label>
                <input
                  id="diagnosisDate"
                  type="date"
                  bind:value={formData.diagnosisDate}
                  class:error={errors.diagnosisDate}
                  required
                />
                {#if errors.diagnosisDate}
                  <span class="error-message">{errors.diagnosisDate}</span>
                {/if}
              </div>
            </div>
          </div>

        {:else if currentStep === 4}
          <!-- Tab 4: Lab Results -->
          <div class="form-section">
            <h3>ผลตรวจและสถานะผู้ป่วย</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="labResult">ผลตรวจ *</label>
                <select id="labResult" bind:value={formData.labResult} class:error={errors.labResult} required>
                  <option value="">เลือกผลตรวจ</option>
                  {#each labResultOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
                {#if errors.labResult}
                  <span class="error-message">{errors.labResult}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="ns1Result">ผล NS1 *</label>
                <select id="ns1Result" bind:value={formData.ns1Result} class:error={errors.ns1Result} required>
                  <option value="">เลือกผล NS1</option>
                  {#each labResultOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
                {#if errors.ns1Result}
                  <span class="error-message">{errors.ns1Result}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="patientType">ประเภทผู้ป่วย *</label>
                <select id="patientType" bind:value={formData.patientType} class:error={errors.patientType} required>
                  <option value="">เลือกประเภท</option>
                  {#each patientTypeOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
                {#if errors.patientType}
                  <span class="error-message">{errors.patientType}</span>
                {/if}
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="patientCondition">สภาพผู้ป่วย *</label>
                <select id="patientCondition" bind:value={formData.patientCondition} class:error={errors.patientCondition} required>
                  <option value="">เลือกสภาพ</option>
                  {#each conditionOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
                {#if errors.patientCondition}
                  <span class="error-message">{errors.patientCondition}</span>
                {/if}
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
          <!-- Tab 5: Notes -->
          <div class="form-section">
            <h3>หมายเหตุและข้อมูลเพิ่มเติม</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="receivingProvince">จังหวัดที่รับผิดชอบ *</label>
                <input
                  id="receivingProvince"
                  type="text"
                  bind:value={formData.receivingProvince}
                  placeholder="เพชรบูรณ์"
                  class:error={errors.receivingProvince}
                  required
                />
                {#if errors.receivingProvince}
                  <span class="error-message">{errors.receivingProvince}</span>
                {/if}
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="remarks">หมายเหตุ *</label>
                <textarea
                  id="remarks"
                  bind:value={formData.remarks}
                  placeholder="หมายเหตุเพิ่มเติม..."
                  rows="4"
                  class:error={errors.remarks}
                  required
                ></textarea>
                {#if errors.remarks}
                  <span class="error-message">{errors.remarks}</span>
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <!-- Navigation Buttons -->
        <div class="form-navigation">
          <div class="nav-left">
            {#if currentStep > 1}
              <button type="button" class="btn-secondary" on:click={prevStep}>
                ← ก่อนหน้า
              </button>
            {/if}
          </div>
          
          <div class="nav-center">
            <span class="step-indicator">ขั้นตอน {currentStep} จาก {steps.length}</span>
          </div>

          <div class="nav-right">
            {#if currentStep < steps.length}
              <button type="button" class="btn-primary" on:click={() => {
                if (validateCurrentStep()) {
                  nextStep();
                }
              }}>
                ถัดไป →
              </button>
            {:else}
              <button type="submit" class="btn-success" disabled={saving}>
                {#if saving}
                  กำลังบันทึก...
                {:else}
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
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .loading-state {
    padding: 40px;
    text-align: center;
    color: #6c757d;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e9ecef;
  }

  .modal-header h2 {
    margin: 0;
    color: #2c3e50;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    color: #6c757d;
  }

  .close-btn:hover {
    color: #e74c3c;
  }

  .step-navigator {
    display: flex;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
  }

  .step-btn {
    flex: 1;
    background: none;
    border: none;
    padding: 12px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
  }

  .step-btn:hover {
    background: rgba(22, 160, 133, 0.1);
  }

  .step-btn.active {
    background: #16a085;
    color: white;
  }

  .step-btn.completed {
    background: #27ae60;
    color: white;
  }

  .step-icon {
    font-size: 16px;
  }

  .step-title {
    font-size: 12px;
    font-weight: 500;
  }

  .form-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .form-section h3 {
    margin: 0 0 16px 0;
    color: #2c3e50;
    border-bottom: 2px solid #16a085;
    padding-bottom: 8px;
  }

  .form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-group {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .form-group.flex-2 {
    flex: 2;
  }

  .form-group label {
    margin-bottom: 4px;
    font-weight: 500;
    color: #2c3e50;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #16a085;
    box-shadow: 0 0 0 2px rgba(22, 160, 133, 0.2);
  }

  .form-group input.error,
  .form-group select.error,
  .form-group textarea.error {
    border-color: #e74c3c;
  }

  .error-message {
    color: #e74c3c;
    font-size: 12px;
    margin-top: 4px;
  }

  .copy-address {
    margin: 16px 0;
  }

  .btn-copy {
    background: #6c757d;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .btn-copy:hover {
    background: #5a6268;
  }

  .symptom-suggestions {
    margin-top: 8px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .symptom-suggestions p {
    margin: 0 0 8px 0;
    font-size: 12px;
    color: #6c757d;
  }

  .symptom-btn {
    background: white;
    border: 1px solid #ddd;
    padding: 4px 8px;
    margin: 2px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }

  .symptom-btn:hover {
    background: #e3f2fd;
    border-color: #16a085;
  }

  .form-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-top: 1px solid #e9ecef;
    background: #f8f9fa;
  }

  .nav-left,
  .nav-right {
    flex: 1;
  }

  .nav-right {
    text-align: right;
  }

  .nav-center {
    text-align: center;
  }

  .step-indicator {
    color: #6c757d;
    font-size: 14px;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-secondary:hover {
    background: #5a6268;
  }

  .btn-primary {
    background: #16a085;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-primary:hover {
    background: #138d75;
  }

  .btn-success {
    background: #27ae60;
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }

  .btn-success:hover:not(:disabled) {
    background: #229954;
  }

  .btn-success:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .modal-content {
      width: 95%;
      max-height: 95vh;
    }

    .form-row {
      flex-direction: column;
      gap: 12px;
    }

    .step-navigator {
      overflow-x: auto;
    }

    .step-btn {
      min-width: 80px;
    }

    .form-navigation {
      flex-direction: column;
      gap: 12px;
    }

    .nav-left,
    .nav-center,
    .nav-right {
      text-align: center;
    }
  }
</style><!-- frontend/src/routes/patients/components/PatientFormModal.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { patientActions, patientStore } from '$lib/stores/patientStore';
  import { patientApi } from '$lib/api/patients/client';
  import type { CreatePatientData, UpdatePatientData, DiseaseOption, HospitalOption, SymptomOption } from '$lib/api/patients/client';
  import { OCCUPATION_OPTIONS } from '$lib/constants/occupations';

  export let mode: 'create' | 'edit' = 'create';

  const dispatch = createEventDispatcher<{ close: void }>();

  // Form state
  let currentStep = 1;
  let formData: Partial<CreatePatientData> = {};
  let errors: Record<string, string> = {};
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
    } finally {
      loading = false;
    }
  });

  // Populate form with patient data (for edit mode)
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
      deathDate: patient.deathDate ? patient.deathDate.split('T')[0] : '',
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
    formData.addressSickHouseNumber = formData.currentHouseNumber;
    formData.addressSickVillageNumber = formData.currentVillageNumber;
    formData.addressSickRoadName = formData.currentRoadName;
    formData.addressSickProvince = formData.currentProvince;
    formData.addressSickDistrict = formData.currentDistrict;
    formData.addressSickSubDistrict = formData.currentSubDistrict;
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

  // ✅ FIXED: Form validation to ensure all required fields are filled
  function validateCurrentStep(): boolean {
    const stepErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!formData.idCardCode?.trim()) stepErrors.idCardCode = 'เลขบัตรประชาชนจำเป็น';
      if (!formData.namePrefix?.trim()) stepErrors.namePrefix = 'คำนำหน้าจำเป็น';
      if (!formData.patientName?.trim()) stepErrors.patientName = 'ชื่อผู้ป่วยจำเป็น';
      if (!formData.gender?.trim()) stepErrors.gender = 'เพศจำเป็น';
      if (!formData.birthday?.trim()) stepErrors.birthday = 'วันเกิดจำเป็น';
      if (!formData.ageAtIllness || formData.ageAtIllness <= 0) stepErrors.ageAtIllness = 'อายุจำเป็น';
      if (!formData.nationality?.trim()) stepErrors.nationality = 'สัญชาติจำเป็น';
      if (!formData.maritalStatus?.trim()) stepErrors.maritalStatus = 'สถานภาพจำเป็น';
      if (!formData.occupation?.trim()) stepErrors.occupation = 'อาชีพจำเป็น';
      if (!formData.phoneNumber?.trim()) stepErrors.phoneNumber = 'เบอร์โทรศัพท์จำเป็น';
    } else if (currentStep === 2) {
      if (!formData.currentHouseNumber?.trim()) stepErrors.currentHouseNumber = 'บ้านเลขที่ปัจจุบันจำเป็น';
      if (!formData.currentVillageNumber?.trim()) stepErrors.currentVillageNumber = 'หมู่ปัจจุบันจำเป็น';
      if (!formData.currentRoadName?.trim()) stepErrors.currentRoadName = 'ถนนปัจจุบันจำเป็น';
      if (!formData.currentProvince?.trim()) stepErrors.currentProvince = 'จังหวัดปัจจุบันจำเป็น';
      if (!formData.currentDistrict?.trim()) stepErrors.currentDistrict = 'อำเภอปัจจุบันจำเป็น';
      if (!formData.currentSubDistrict?.trim()) stepErrors.currentSubDistrict = 'ตำบลปัจจุบันจำเป็น';
      if (!formData.addressSickHouseNumber?.trim()) stepErrors.addressSickHouseNumber = 'บ้านเลขที่ที่ป่วยจำเป็น';
      if (!formData.addressSickVillageNumber?.trim()) stepErrors.addressSickVillageNumber = 'หมู่ที่ป่วยจำเป็น';
      if (!formData.addressSickRoadName?.trim()) stepErrors.addressSickRoadName = 'ถนนที่ป่วยจำเป็น';
      if (!formData.addressSickProvince?.trim()) stepErrors.addressSickProvince = 'จังหวัดที่ป่วยจำเป็น';
      if (!formData.addressSickDistrict?.trim()) stepErrors.addressSickDistrict = 'อำเภอที่ป่วยจำเป็น';
      if (!formData.addressSickSubDistrict?.trim()) stepErrors.addressSickSubDistrict = 'ตำบลที่ป่วยจำเป็น';
    } else if (currentStep === 3) {
      if (!formData.diseaseId || formData.diseaseId <= 0) stepErrors.diseaseId = 'โรคจำเป็น';
      if (!formData.symptomsOfDisease?.trim()) stepErrors.symptomsOfDisease = 'อาการจำเป็น';
      if (!formData.treatmentArea?.trim()) stepErrors.treatmentArea = 'พื้นที่รักษาจำเป็น';
      if (!formData.treatmentHospital?.trim()) stepErrors.treatmentHospital = 'โรงพยาบาลหลักจำเป็น';
      console.log('DEBUG: illnessDate (from input):', formData.illnessDate);
      console.log('DEBUG: treatmentDate (from input):', formData.treatmentDate);
      console.log('DEBUG: diagnosisDate (from input):', formData.diagnosisDate);

      if (!formData.illnessDate?.trim()) stepErrors.illnessDate = 'วันที่เจ็บป่วยจำเป็น';
      if (!formData.treatmentDate?.trim()) stepErrors.treatmentDate = 'วันที่รักษาจำเป็น';
      if (!formData.diagnosisDate?.trim()) stepErrors.diagnosisDate = 'วันที่วินิจฉัยจำเป็น';
      if (!formData.hospitalCode?.trim()) stepErrors.hospitalCode = 'รหัสโรงพยาบาลจำเป็น';
    } else if (currentStep === 4) {
      if (!formData.labResult?.trim()) stepErrors.labResult = 'ผลตรวจจำเป็น';
      if (!formData.ns1Result?.trim()) stepErrors.ns1Result = 'ผล NS1 จำเป็น';
      if (!formData.patientType?.trim()) stepErrors.patientType = 'ประเภทผู้ป่วยจำเป็น';
      if (!formData.patientCondition?.trim()) stepErrors.patientCondition = 'สภาพผู้ป่วยจำเป็น';
    } else if (currentStep === 5) {
      if (!formData.receivingProvince?.trim()) stepErrors.receivingProvince = 'จังหวัดที่รับผิดชอบจำเป็น';
      if (!formData.remarks?.trim()) stepErrors.remarks = 'หมายเหตุจำเป็น';
    }

    errors = stepErrors;
    return Object.keys(stepErrors).length === 0;
  }

  // Form submission
  async function handleSubmit(): Promise<void> {
    // Validate all steps before submission
    let allValid = true;
    for (let step = 1; step <= 5; step++) {
      currentStep = step;
      if (!validateCurrentStep()) {
        allValid = false;
        break;
      }
    }

    if (!allValid) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วนในทุกขั้นตอน');
      return;
    }

    saving = true;
    errors = {};

    try {
      let success = false;
      
      if (isEdit && currentPatient) {
        success = await patientActions.updatePatient(currentPatient.id, formData as UpdatePatientData);
      } else {
        // ✅ FIXED: Ensure all required fields are provided for creation
        const completeData: CreatePatientData = {
          // Tab 1: Personal Information
          idCardCode: formData.idCardCode || '',
          patientHn: formData.patientHn,
          namePrefix: formData.namePrefix || '',
          patientName: formData.patientName || '',
          gender: formData.gender || '',
          birthday: formData.birthday || '',
          ageAtIllness: formData.ageAtIllness || 0,
          nationality: formData.nationality || '',
          maritalStatus: formData.maritalStatus || '',
          occupation: formData.occupation || '',
          phoneNumber: formData.phoneNumber || '',
          
          // Tab 2: Address Information
          currentHouseNumber: formData.currentHouseNumber || '',
          currentVillageNumber: formData.currentVillageNumber || '',
          currentRoadName: formData.currentRoadName || '',
          currentProvince: formData.currentProvince || '',
          currentDistrict: formData.currentDistrict || '',
          currentSubDistrict: formData.currentSubDistrict || '',
          addressSickHouseNumber: formData.addressSickHouseNumber || '',
          addressSickVillageNumber: formData.addressSickVillageNumber || '',
          addressSickRoadName: formData.addressSickRoadName || '',
          addressSickProvince: formData.addressSickProvince || '',
          addressSickDistrict: formData.addressSickDistrict || '',
          addressSickSubDistrict: formData.addressSickSubDistrict || '',
          
          // Tab 3: Medical Information
          diseaseId: formData.diseaseId || 0,
          symptomsOfDisease: formData.symptomsOfDisease || '',
          treatmentArea: formData.treatmentArea || '',
          treatmentHospital: formData.treatmentHospital || '',
          illnessDate: formData.illnessDate || '',
          treatmentDate: formData.treatmentDate || '',
          diagnosisDate: formData.diagnosisDate || '',
          
          // Tab 4: Lab Results
          labResult: formData.labResult || '',
          ns1Result: formData.ns1Result || '',
          patientType: formData.patientType || '',
          patientCondition: formData.patientCondition || '',
          deathDate: formData.deathDate,
          causeOfDeath: formData.causeOfDeath,
          
          // Tab 5: Notes
          receivingProvince: formData.receivingProvince || '',
          hospitalCode: formData.hospitalCode || '',
          remarks: formData.remarks || '',
        };

        success = await patientActions.createPatient(completeData);
      }

      if (success) {
        closeModal();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      saving = false;
    }
  }

  // Close modal
  function closeModal(): void {
    dispatch('close');
  }

  // Form options
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

  const labResultOptions = [
    { value: 'Positive', label: 'บวก (Positive)' },
    { value: 'Negative', label: 'ลบ (Negative)' },
    { value: 'Pending', label: 'รอผล (Pending)' },
    { value: 'Inconclusive', label: 'ไม่ชัดเจน (Inconclusive)' },
    { value: 'Not Tested', label: 'ไม่ได้ตรวจ (Not Tested)' }
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

<div class="modal-overlay" on:click={closeModal}>
  <div class="modal-content" on:click|stopPropagation>
    {#if loading}
      <div class="loading-state">
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    {:else}
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>{modalTitle}</h2>
        <button type="button" class="close-btn" on:click={closeModal}>×</button>
      </div>

      <!-- Step Navigator -->
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

      <!-- Form Content -->
      <form class="form-content" on:submit|preventDefault={handleSubmit}>
        {#if currentStep === 1}
          <!-- Tab 1: Personal Information -->
          <div class="form-section">
            <h3>ข้อมูลส่วนตัว</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="idCardCode">เลขบัตรประชาชน *</label>
                <input
                  id="idCardCode"
                  type="text"
                  bind:value={formData.idCardCode}
                  placeholder="1234567890123"
                  maxlength="13"
                  class:error={errors.idCardCode}
                  required
                />
                {#if errors.idCardCode}
                  <span class="error-message">{errors.idCardCode}</span>
                {/if}
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
                <label for="namePrefix">คำนำหน้า *</label>
                <select id="namePrefix" bind:value={formData.namePrefix} class:error={errors.namePrefix} required>
                  <option value="">เลือกคำนำหน้า</option>
                  {#each namePrefixOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
                {#if errors.namePrefix}
                  <span class="error-message">{errors.namePrefix}</span>
                {/if}
              </div>
              <div class="form-group flex-2">
                <label for="patientName">ชื่อ-นามสกุล *</label>
                <input
                  id="patientName"
                  type="text"
                  bind:value={formData.patientName}
                  placeholder="ชื่อ นามสกุล"
                  class:error={errors.patientName}
                  required
                />
                {#if errors.patientName}
                  <span class="error-message">{errors.patientName}</span>
                {/if}
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="gender">เพศ *</label>
                <select id="gender" bind:value={formData.gender} class:error={errors.gender} required>
                  <option value="">เลือกเพศ</option>
                  {#each genderOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
                {#if errors.gender}
                  <span class="error-message">{errors.gender}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="birthday">วันเกิด *</label>
                <input
                  id="birthday"
                  type="date"
                  bind:value={formData.birthday}
                  class:error={errors.birthday}
                  required
                />
                {#if errors.birthday}
                  <span class="error-message">{errors.birthday}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="ageAtIllness">อายุขณะป่วย *</label>
                <input
                  id="ageAtIllness"
                  type="number"
                  bind:value={formData.ageAtIllness}
                  min="0"
                  max="150"
                  class:error={errors.ageAtIllness}
                  required
                />
                {#if errors.ageAtIllness}
                  <span class="error-message">{errors.ageAtIllness}</span>
                {/if}
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="nationality">สัญชาติ *</label>
                <input
                  id="nationality"
                  type="text"
                  bind:value={formData.nationality}
                  placeholder="ไทย"
                  class:error={errors.nationality}
                  required
                />
                {#if errors.nationality}
                  <span class="error-message">{errors.nationality}</span>
                {/if}
              </div>
              <div class="form-group">
                <label for="maritalStatus">สถานภาพ *</label>
                <select id="maritalStatus" bind:value={formData.maritalStatus} class:error={errors.maritalStatus} required>
                  <option value="">เลือกสถานภาพ</option>
                  {#each maritalStatusOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
                {#if errors.maritalStatus}
                  <span class="error-message">{errors.maritalStatus}</span>
                {/if}
              </div>
            </div>

            <div class="form-row">
             <div class="form-group">
  <label for="occupation">อาชีพ *</label>
  <select
    id="occupation"
    bind:value={formData.occupation}
    class:error={errors.occupation}
    required
  >
    <option value="">เลือกอาชีพ</option>
    {#each OCCUPATION_OPTIONS as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  {#if errors.occupation}
    <span class="error-message">{errors.occupation}</span>
  {/if}
</div>
              <div class="form-group">
                <label for="phoneNumber">เบอร์โทรศัพท์ *</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  bind:value={formData.phoneNumber}
                  placeholder="081-234-5678"
                  class:error={errors.phoneNumber}
                  required
                />
                {#if errors.phoneNumber}
                  <span class="error-message">{errors.phoneNumber}</span>
                {/if}
              </div>
            </div>
          </div>