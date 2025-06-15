<label class="inline-flex items-center">
                    <input
                      type="radio"
                      bind:group={formData.gender}
                      value="M"
                      class="form-radio h-4 w-4 text-blue-600"
                    />
                    <span class="ml-2">ชาย</span>
                  </label>
                  <label class="inline-flex items-center">
                    <input
                      type="radio"
                      bind:group={formData.gender}
                      value="F"
                      class="form-radio h-4 w-4 text-blue-600"
                    />
                    <span class="ml-2">หญิง</span>
                  </label>
                </div>
                {#if validationErrors.gender}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.gender}</p>
                {/if}
              </div>

              <!-- Birthday -->
              <div>
                <label for="birthday" class="block text-sm font-medium text-gray-700">
                  วันเกิด <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="birthday"
                  bind:value={formData.birthday}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.birthday ? 'border-red-300' : ''}"
                />
                {#if validationErrors.birthday}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.birthday}</p>
                {/if}
              </div>

              <!-- Age -->
              <div>
                <label for="ageAtIllness" class="block text-sm font-medium text-gray-700">
                  อายุขณะป่วย <span class="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="ageAtIllness"
                  bind:value={formData.ageAtIllness}
                  min="0"
                  max="150"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.ageAtIllness ? 'border-red-300' : ''}"
                  placeholder="25"
                />
                {#if validationErrors.ageAtIllness}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.ageAtIllness}</p>
                {/if}
              </div>

              <!-- Nationality -->
              <div>
                <label for="nationality" class="block text-sm font-medium text-gray-700">
                  สัญชาติ <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nationality"
                  bind:value={formData.nationality}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.nationality ? 'border-red-300' : ''}"
                  placeholder="ไทย"
                />
                {#if validationErrors.nationality}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.nationality}</p>
                {/if}
              </div>

              <!-- Marital Status -->
              <div>
                <label for="maritalStatus" class="block text-sm font-medium text-gray-700">
                  สถานภาพ <span class="text-red-500">*</span>
                </label>
                <select
                  id="maritalStatus"
                  bind:value={formData.maritalStatus}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.maritalStatus ? 'border-red-300' : ''}"
                >
                  <option value="">เลือกสถานภาพ</option>
                  <option value="SINGLE">โสด</option>
                  <option value="MARRIED">แต่งงาน</option>
                  <option value="DIVORCED">หย่าร้าง</option>
                  <option value="WIDOWED">หม้าย</option>
                  <option value="SEPARATED">แยกกันอยู่</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
                {#if validationErrors.maritalStatus}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.maritalStatus}</p>
                {/if}
              </div>

              <!-- Occupation -->
              <div>
                <label for="occupation" class="block text-sm font-medium text-gray-700">
                  อาชีพ <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="occupation"
                  bind:value={formData.occupation}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.occupation ? 'border-red-300' : ''}"
                  placeholder="เกษตรกร"
                />
                {#if validationErrors.occupation}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.occupation}</p>
                {/if}
              </div>

              <!-- Phone Number -->
              <div>
                <label for="phoneNumber" class="block text-sm font-medium text-gray-700">
                  เบอร์โทรศัพท์ <span class="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  bind:value={formData.phoneNumber}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.phoneNumber ? 'border-red-300' : ''}"
                  placeholder="0812345678"
                />
                {#if validationErrors.phoneNumber}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.phoneNumber}</p>
                {/if}
              </div>
            </div>
          </div>
          {/if}

          <!-- Step 2: ที่อยู่ -->
          {#if currentStep === 2}
          <div class="space-y-6">
            
            <!-- Current Address -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                ที่อยู่ปัจจุบัน
              </h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="currentHouseNumber" class="block text-sm font-medium text-gray-700">
                    บ้านเลขที่ <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="currentHouseNumber"
                    bind:value={formData.currentHouseNumber}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.currentHouseNumber ? 'border-red-300' : ''}"
                    placeholder="123"
                  />
                  {#if validationErrors.currentHouseNumber}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.currentHouseNumber}</p>
                  {/if}
                </div>

                <div>
                  <label for="currentVillageNumber" class="block text-sm font-medium text-gray-700">
                    หมู่ <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="currentVillageNumber"
                    bind:value={formData.currentVillageNumber}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.currentVillageNumber ? 'border-red-300' : ''}"
                    placeholder="1"
                  />
                  {#if validationErrors.currentVillageNumber}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.currentVillageNumber}</p>
                  {/if}
                </div>

                <div class="md:col-span-2">
                  <label for="currentRoadName" class="block text-sm font-medium text-gray-700">
                    ถนน <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="currentRoadName"
                    bind:value={formData.currentRoadName}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.currentRoadName ? 'border-red-300' : ''}"
                    placeholder="สายหลัก"
                  />
                  {#if validationErrors.currentRoadName}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.currentRoadName}</p>
                  {/if}
                </div>

                <div>
                  <label for="currentSubDistrict" class="block text-sm font-medium text-gray-700">
                    ตำบล/แขวง <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="currentSubDistrict"
                    bind:value={formData.currentSubDistrict}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.currentSubDistrict ? 'border-red-300' : ''}"
                    placeholder="ท่าโรง"
                  />
                  {#if validationErrors.currentSubDistrict}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.currentSubDistrict}</p>
                  {/if}
                </div>

                <div>
                  <label for="currentDistrict" class="block text-sm font-medium text-gray-700">
                    อำเภอ/เขต <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="currentDistrict"
                    bind:value={formData.currentDistrict}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.currentDistrict ? 'border-red-300' : ''}"
                    placeholder="วิเชียรบุรี"
                  />
                  {#if validationErrors.currentDistrict}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.currentDistrict}</p>
                  {/if}
                </div>

                <div class="md:col-span-2">
                  <label for="currentProvince" class="block text-sm font-medium text-gray-700">
                    จังหวัด <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="currentProvince"
                    bind:value={formData.currentProvince}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.currentProvince ? 'border-red-300' : ''}"
                    placeholder="เพชรบูรณ์"
                  />
                  {#if validationErrors.currentProvince}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.currentProvince}</p>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Sick Address -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-medium text-gray-900 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  </svg>
                  ที่อยู่ขณะเจ็บป่วย
                </h4>
                
                <button
                  type="button"
                  on:click={copyCurrentToSickAddress}
                  class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  คัดลอกจากที่อยู่ปัจจุบัน
                </button>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="addressSickHouseNumber" class="block text-sm font-medium text-gray-700">
                    บ้านเลขที่ <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressSickHouseNumber"
                    bind:value={formData.addressSickHouseNumber}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.addressSickHouseNumber ? 'border-red-300' : ''}"
                    placeholder="123"
                  />
                  {#if validationErrors.addressSickHouseNumber}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.addressSickHouseNumber}</p>
                  {/if}
                </div>

                <div>
                  <label for="addressSickVillageNumber" class="block text-sm font-medium text-gray-700">
                    หมู่ <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressSickVillageNumber"
                    bind:value={formData.addressSickVillageNumber}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.addressSickVillageNumber ? 'border-red-300' : ''}"
                    placeholder="1"
                  />
                  {#if validationErrors.addressSickVillageNumber}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.addressSickVillageNumber}</p>
                  {/if}
                </div>

                <div class="md:col-span-2">
                  <label for="addressSickRoadName" class="block text-sm font-medium text-gray-700">
                    ถนน <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressSickRoadName"
                    bind:value={formData.addressSickRoadName}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.addressSickRoadName ? 'border-red-300' : ''}"
                    placeholder="สายหลัก"
                  />
                  {#if validationErrors.addressSickRoadName}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.addressSickRoadName}</p>
                  {/if}
                </div>

                <div>
                  <label for="addressSickSubDistrict" class="block text-sm font-medium text-gray-700">
                    ตำบล/แขวง <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressSickSubDistrict"
                    bind:value={formData.addressSickSubDistrict}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.addressSickSubDistrict ? 'border-red-300' : ''}"
                    placeholder="ท่าโรง"
                  />
                  {#if validationErrors.addressSickSubDistrict}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.addressSickSubDistrict}</p>
                  {/if}
                </div>

                <div>
                  <label for="addressSickDistrict" class="block text-sm font-medium text-gray-700">
                    อำเภอ/เขต <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressSickDistrict"
                    bind:value={formData.addressSickDistrict}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.addressSickDistrict ? 'border-red-300' : ''}"
                    placeholder="วิเชียรบุรี"
                  />
                  {#if validationErrors.addressSickDistrict}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.addressSickDistrict}</p>
                  {/if}
                </div>

                <div class="md:col-span-2">
                  <label for="addressSickProvince" class="block text-sm font-medium text-gray-700">
                    จังหวัด <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressSickProvince"
                    bind:value={formData.addressSickProvince}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.addressSickProvince ? 'border-red-300' : ''}"
                    placeholder="เพชรบูรณ์"
                  />
                  {#if validationErrors.addressSickProvince}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.addressSickProvince}</p>
                  {/if}
                </div>
              </div>
            </div>
          </div>
          {/if}

          <!-- Step 3: การเจ็บป่วย -->
          {#if currentStep === 3}
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Disease -->
              <div>
                <label for="diseaseId" class="block text-sm font-medium text-gray-700">
                  โรค <span class="text-red-500">*</span>
                </label>
                <select
                  id="diseaseId"
                  bind:value={formData.diseaseId}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.diseaseId ? 'border-red-300' : ''}"
                >
                  <option value={undefined}>เลือกโรค</option>
                  {#each diseases as disease}
                    <option value={disease.id}>{disease.thaiName}</option>
                  {/each}
                </select>
                {#if validationErrors.diseaseId}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.diseaseId}</p>
                {/if}
              </div>

              <!-- Treatment Hospital -->
              <div>
                <label for="treatmentHospital" class="block text-sm font-medium text-gray-700">
                  โรงพยาบาลหลัก <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="treatmentHospital"
                  bind:value={formData.treatmentHospital}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.treatmentHospital ? 'border-red-300' : ''}"
                  placeholder="โรงพยาบาลวิเชียรบุรี"
                />
                {#if validationErrors.treatmentHospital}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.treatmentHospital}</p>
                {/if}
              </div>

              <!-- Treatment Area -->
              <div>
                <label for="treatmentArea" class="block text-sm font-medium text-gray-700">
                  พื้นที่รักษา <span class="text-red-500">*</span>
                </label>
                <select
                  id="treatmentArea"
                  bind:value={formData.treatmentArea}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.treatmentArea ? 'border-red-300' : ''}"
                >
                  <option value="">เลือกพื้นที่รักษา</option>
                  <option value="เทศบาล">เทศบาล</option>
                  <option value="อบต.">อบต.</option>
                  <option value="ไม่ทราบ">ไม่ทราบ</option>
                </select>
                {#if validationErrors.treatmentArea}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.treatmentArea}</p>
                {/if}
              </div>

              <!-- Illness Date -->
              <div>
                <label for="illnessDate" class="block text-sm font-medium text-gray-700">
                  วันที่เจ็บป่วย <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="illnessDate"
                  bind:value={formData.illnessDate}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.illnessDate ? 'border-red-300' : ''}"
                />
                {#if validationErrors.illnessDate}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.illnessDate}</p>
                {/if}
              </div>

              <!-- Treatment Date -->
              <div>
                <label for="treatmentDate" class="block text-sm font-medium text-gray-700">
                  วันที่เริ่มรักษา <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="treatmentDate"
                  bind:value={formData.treatmentDate}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.treatmentDate ? 'border-red-300' : ''}"
                />
                {#if validationErrors.treatmentDate}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.treatmentDate}</p>
                {/if}
              </div>

              <!-- Diagnosis Date -->
              <div>
                <label for="diagnosisDate" class="block text-sm font-medium text-gray-700">
                  วันที่วินิจฉัย <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="diagnosisDate"
                  bind:value={formData.diagnosisDate}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.diagnosisDate ? 'border-red-300' : ''}"
                />
                {#if validationErrors.diagnosisDate}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.diagnosisDate}</p>
                {/if}
              </div>
            </div>

            <!-- Symptoms -->
            <div>
              <label for="symptomsOfDisease" class="block text-sm font-medium text-gray-700">
                อาการที่พบ <span class="text-red-500">*</span>
              </label>
              <textarea
                id="symptomsOfDisease"
                bind:value={formData.symptomsOfDisease}
                rows="4"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                       {validationErrors.symptomsOfDisease ? 'border-red-300' : ''}"
                placeholder="ระบุอาการที่พบในผู้ป่วย..."
              ></textarea>
              {#if validationErrors.symptomsOfDisease}
                <p class="mt-1 text-sm text-red-600">{validationErrors.symptomsOfDisease}</p>
              {/if}
              
              <!-- Symptoms suggestions -->
              {#if symptoms.length > 0}
                <div class="mt-2">
                  <p class="text-sm text-gray-600 mb-2">อาการที่พบบ่อยในโรคนี้:</p>
                  <div class="flex flex-wrap gap-2">
                    {#each symptoms as symptom}
                      <button
                        type="button"
                        on:click={() => {
                          if (formData.symptomsOfDisease) {
                            formData.symptomsOfDisease += `, ${symptom.name}`;
                          } else {
                            formData.symptomsOfDisease = symptom.name;
                          }
                        }}
                        class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        + {symptom.name}
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          </div>
          {/if}

          <!-- Step 4: ผลตรวจ -->
          {#if currentStep === 4}
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Lab Result -->
              <div>
                <label for="labResult" class="block text-sm font-medium text-gray-700">
                  ผลตรวจ <span class="text-red-500">*</span>
                </label>
                <!-- frontend/src/lib/components/patients/PatientForm.svelte -->
<!-- ✏️ Patient Form Component - ฟอร์ม 5 tabs สำหรับเพิ่ม/แก้ไข -->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { patientDetail, patientActions } from '$lib/stores/patientStore';
  import { patientApi, type CreatePatientData, type UpdatePatientData, type DiseaseOption, type HospitalOption } from '$lib/api/patients/client';

  // ========== EVENT DISPATCHER ==========
  const dispatch = createEventDispatcher<{
    save: { patient: any };
    cancel: void;
    close: void;
  }>();

  // ========== PROPS ==========
  export let show = false;
  export let mode: 'create' | 'edit' = 'create';
  export let patientId: number | null = null;

  // ========== STATE ==========
  let currentStep = 1;
  let isSubmitting = false;
  let validationErrors: Record<string, string> = {};
  let formData: Partial<CreatePatientData> = {};

  // Reference data
  let diseases: DiseaseOption[] = [];
  let hospitals: HospitalOption[] = [];
  let symptoms: Array<{id: number, name: string}> = [];

  // ========== FORM STEPS CONFIG ==========
  const formSteps = [
    { 
      id: 1, 
      title: 'ข้อมูลส่วนตัว', 
      description: 'ข้อมูลพื้นฐานของผู้ป่วย',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      requiredFields: ['idCardCode', 'namePrefix', 'patientName', 'gender', 'birthday', 'ageAtIllness', 'nationality', 'maritalStatus', 'occupation', 'phoneNumber']
    },
    { 
      id: 2, 
      title: 'ที่อยู่', 
      description: 'ที่อยู่ปัจจุบันและที่อยู่ขณะป่วย',
      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
      requiredFields: ['currentHouseNumber', 'currentVillageNumber', 'currentRoadName', 'currentProvince', 'currentDistrict', 'currentSubDistrict', 'addressSickHouseNumber', 'addressSickVillageNumber', 'addressSickRoadName', 'addressSickProvince', 'addressSickDistrict', 'addressSickSubDistrict']
    },
    { 
      id: 3, 
      title: 'การเจ็บป่วย', 
      description: 'ข้อมูลการเจ็บป่วยและการรักษา',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      requiredFields: ['diseaseId', 'symptomsOfDisease', 'treatmentArea', 'treatmentHospital', 'illnessDate', 'treatmentDate', 'diagnosisDate']
    },
    { 
      id: 4, 
      title: 'ผลตรวจ', 
      description: 'ผลการตรวจและสถานะผู้ป่วย',
      icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      requiredFields: ['labResult', 'ns1Result', 'patientType', 'patientCondition']
    },
    { 
      id: 5, 
      title: 'หมายเหตุ', 
      description: 'ข้อมูลเพิ่มเติมและหมายเหตุ',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      requiredFields: ['receivingProvince', 'hospitalCode', 'remarks']
    }
  ];

  // ========== REACTIVE STATEMENTS ==========
  $: currentStepData = formSteps.find(step => step.id === currentStep);
  $: isFirstStep = currentStep === 1;
  $: isLastStep = currentStep === formSteps.length;
  $: canProceed = validateCurrentStep();
  $: progressPercentage = ((currentStep - 1) / (formSteps.length - 1)) * 100;

  // ========== LIFECYCLE ==========
  onMount(async () => {
    await loadReferenceData();
    
    if (mode === 'edit' && patientId) {
      await loadPatientData();
    } else {
      resetForm();
    }
  });

  // ========== FUNCTIONS ==========

  /**
   * 📋 Load reference data for dropdowns
   */
  async function loadReferenceData() {
    try {
      const [diseasesResponse, hospitalsResponse] = await Promise.all([
        patientApi.getDiseases(),
        patientApi.getHospitals()
      ]);

      if (diseasesResponse.success && diseasesResponse.data) {
        diseases = diseasesResponse.data;
      }

      if (hospitalsResponse.success && hospitalsResponse.data) {
        hospitals = hospitalsResponse.data;
      }
    } catch (error) {
      console.error('Failed to load reference data:', error);
    }
  }

  /**
   * 📥 Load patient data for editing
   */
  async function loadPatientData() {
    if (!patientId) return;

    const patient = $patientDetail.patient;
    if (patient && patient.id === patientId) {
      populateFormData(patient);
    } else {
      await patientActions.loadPatientById(patientId);
      // จะต้องรอให้ store update แล้ว populate form
    }
  }

  /**
   * 📝 Populate form with patient data
   */
  function populateFormData(patient: any) {
    formData = {
      // Tab 1: Personal Info
      idCardCode: patient.idCardCode || '',
      patientHn: patient.patientHn || '',
      namePrefix: patient.namePrefix || '',
      patientName: patient.patientName || '',
      gender: patient.gender || 'M',
      birthday: patient.birthday || '',
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
      diseaseId: patient.diseaseId || undefined,
      symptomsOfDisease: patient.symptomsOfDisease || '',
      treatmentArea: patient.treatmentArea || '',
      treatmentHospital: patient.treatmentHospital || '',
      illnessDate: patient.illnessDate || '',
      treatmentDate: patient.treatmentDate || '',
      diagnosisDate: patient.diagnosisDate || '',
      
      // Tab 4: Lab Results
      labResult: patient.labResult || '',
      ns1Result: patient.ns1Result || '',
      patientType: patient.patientType || '',
      patientCondition: patient.patientCondition || '',
      deathDate: patient.deathDate || '',
      causeOfDeath: patient.causeOfDeath || '',
      
      // Tab 5: Notes
      receivingProvince: patient.receivingProvince || '',
      hospitalCode: patient.hospitalCode || '',
      remarks: patient.remarks || '',
    };
  }

  /**
   * 🧹 Reset form to initial state
   */
  function resetForm() {
    formData = {
      // Set default values
      gender: 'M',
      nationality: 'ไทย',
      maritalStatus: 'SINGLE',
      treatmentArea: 'เทศบาล',
      labResult: 'Pending',
      ns1Result: 'Pending',
      patientType: 'OPD',
      patientCondition: 'ยังรักษาตัวอยู่',
    };
    validationErrors = {};
    currentStep = 1;
  }

  /**
   * ✅ Validate current step
   */
  function validateCurrentStep(): boolean {
    if (!currentStepData) return false;
    
    const requiredFields = currentStepData.requiredFields;
    const errors: Record<string, string> = {};

    // Check required fields
    requiredFields.forEach(field => {
      const value = formData[field as keyof CreatePatientData];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field] = 'ข้อมูลนี้จำเป็นต้องระบุ';
      }
    });

    // Step-specific validations
    if (currentStep === 1) {
      // Validate Thai ID card
      if (formData.idCardCode && !validateThaiIdCard(formData.idCardCode)) {
        errors.idCardCode = 'รูปแบบเลขบัตรประชาชนไม่ถูกต้อง';
      }
      
      // Validate phone number
      if (formData.phoneNumber && !validateThaiPhone(formData.phoneNumber)) {
        errors.phoneNumber = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
      }
      
      // Validate age
      if (formData.ageAtIllness && (formData.ageAtIllness < 0 || formData.ageAtIllness > 150)) {
        errors.ageAtIllness = 'อายุต้องอยู่ระหว่าง 0-150 ปี';
      }
    }

    if (currentStep === 3) {
      // Validate dates
      if (formData.illnessDate && formData.treatmentDate) {
        if (new Date(formData.treatmentDate) < new Date(formData.illnessDate)) {
          errors.treatmentDate = 'วันที่รักษาต้องไม่ก่อนวันที่เจ็บป่วย';
        }
      }
    }

    if (currentStep === 4) {
      // If patient died, death date is required
      if (formData.patientCondition === 'เสียชีวิต' && !formData.deathDate) {
        errors.deathDate = 'ต้องระบุวันที่เสียชีวิต';
      }
    }

    validationErrors = errors;
    return Object.keys(errors).length === 0;
  }

  /**
   * ➡️ Go to next step
   */
  function nextStep() {
    if (canProceed && !isLastStep) {
      currentStep++;
    }
  }

  /**
   * ⬅️ Go to previous step
   */
  function previousStep() {
    if (!isFirstStep) {
      currentStep--;
    }
  }

  /**
   * 🎯 Go to specific step
   */
  function goToStep(step: number) {
    currentStep = step;
  }

  /**
   * 💾 Submit form
   */
  async function submitForm() {
    if (!validateCurrentStep()) return;

    isSubmitting = true;
    try {
      if (mode === 'create') {
        const success = await patientActions.createPatient(formData as CreatePatientData);
        if (success) {
          dispatch('save', { patient: formData });
          closeForm();
        }
      } else if (mode === 'edit' && patientId) {
        const success = await patientActions.updatePatient(patientId, formData as UpdatePatientData);
        if (success) {
          dispatch('save', { patient: formData });
          closeForm();
        }
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      isSubmitting = false;
    }
  }

  /**
   * ❌ Close form
   */
  function closeForm() {
    dispatch('close');
    resetForm();
  }

  /**
   * 🚫 Cancel form
   */
  function cancelForm() {
    dispatch('cancel');
    closeForm();
  }

  /**
   * 📋 Copy current address to sick address
   */
  function copyCurrentToSickAddress() {
    formData.addressSickHouseNumber = formData.currentHouseNumber;
    formData.addressSickVillageNumber = formData.currentVillageNumber;
    formData.addressSickRoadName = formData.currentRoadName;
    formData.addressSickProvince = formData.currentProvince;
    formData.addressSickDistrict = formData.currentDistrict;
    formData.addressSickSubDistrict = formData.currentSubDistrict;
  }

  /**
   * 🔍 Load symptoms when disease changes
   */
  async function onDiseaseChange() {
    if (formData.diseaseId) {
      try {
        const response = await patientApi.getSymptomsByDisease(formData.diseaseId);
        if (response.success && response.data) {
          symptoms = response.data;
        }
      } catch (error) {
        console.error('Failed to load symptoms:', error);
      }
    } else {
      symptoms = [];
    }
  }

  // ========== VALIDATION HELPERS ==========
  function validateThaiIdCard(idCard: string): boolean {
    if (!/^\d{13}$/.test(idCard)) return false;
    
    const digits = idCard.split('').map(Number);
    const checkDigit = digits[12];
    let sum = 0;
    
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (13 - i);
    }
    
    const remainder = sum % 11;
    const calculatedCheckDigit = remainder < 2 ? (1 - remainder) : (11 - remainder);
    
    return calculatedCheckDigit === checkDigit;
  }

  function validateThaiPhone(phone: string): boolean {
    return /^(\+66|0)[0-9]{8,9}$/.test(phone);
  }

  // ========== REACTIVE DISEASE CHANGE ==========
  $: if (formData.diseaseId) {
    onDiseaseChange();
  }
</script>

<!-- ========== MODAL OVERLAY ========== -->
{#if show}
<div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
  <!-- Backdrop -->
  <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

    <!-- Modal Panel -->
    <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
      
      <!-- ========== MODAL HEADER ========== -->
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              {mode === 'create' ? 'เพิ่มผู้ป่วยใหม่' : 'แก้ไขข้อมูลผู้ป่วย'}
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              {currentStepData?.description}
            </p>
          </div>
          
          <button
            type="button"
            on:click={closeForm}
            class="text-gray-400 hover:text-gray-500"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="mt-4">
          <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>ขั้นตอน {currentStep} จาก {formSteps.length}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style="width: {progressPercentage}%"
            ></div>
          </div>
        </div>

        <!-- Step Navigation -->
        <div class="mt-4 flex justify-center">
          <nav class="flex space-x-4">
            {#each formSteps as step}
              <button
                type="button"
                on:click={() => goToStep(step.id)}
                class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                       {currentStep === step.id 
                         ? 'bg-blue-100 text-blue-700' 
                         : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={step.icon}></path>
                </svg>
                {step.title}
              </button>
            {/each}
          </nav>
        </div>
      </div>

      <!-- ========== FORM CONTENT ========== -->
      <form on:submit|preventDefault={submitForm} class="bg-white">
        <div class="px-4 py-5 sm:p-6">
          
          <!-- Step 1: ข้อมูลส่วนตัว -->
          {#if currentStep === 1}
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- ID Card -->
              <div>
                <label for="idCardCode" class="block text-sm font-medium text-gray-700">
                  เลขบัตรประชาชน <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="idCardCode"
                  bind:value={formData.idCardCode}
                  maxlength="13"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.idCardCode ? 'border-red-300' : ''}"
                  placeholder="1234567890123"
                />
                {#if validationErrors.idCardCode}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.idCardCode}</p>
                {/if}
              </div>

              <!-- Patient HN -->
              <div>
                <label for="patientHn" class="block text-sm font-medium text-gray-700">
                  เลข HN
                </label>
                <input
                  type="text"
                  id="patientHn"
                  bind:value={formData.patientHn}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="HN123456"
                />
              </div>

              <!-- Name Prefix -->
              <div>
                <label for="namePrefix" class="block text-sm font-medium text-gray-700">
                  คำนำหน้า <span class="text-red-500">*</span>
                </label>
                <select
                  id="namePrefix"
                  bind:value={formData.namePrefix}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.namePrefix ? 'border-red-300' : ''}"
                >
                  <option value="">เลือกคำนำหน้า</option>
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                  <option value="เด็กหญิง">เด็กหญิง</option>
                  <option value="เด็กชาย">เด็กชาย</option>
                </select>
                {#if validationErrors.namePrefix}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.namePrefix}</p>
                {/if}
              </div>

              <!-- Patient Name -->
              <div>
                <label for="patientName" class="block text-sm font-medium text-gray-700">
                  ชื่อ-นามสกุล <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="patientName"
                  bind:value={formData.patientName}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.patientName ? 'border-red-300' : ''}"
                  placeholder="สมชาย ใจดี"
                />
                {#if validationErrors.patientName}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.patientName}</p>
                {/if}
              </div>

              <!-- Gender -->
              <div>
                <label class="block text-sm font-medium text-gray-700">
                  เพศ <span class="text-red-500">*</span>
                </label>
                <div class="mt-2 space-x-4">
                  <label class="inline-flex items-center">
                    <input
                      type="radio"
                      bind:group={formData.gender}
                      value="M"
                      class="form-radio h-4 w-4 text-blue-600"
                    />
                    <span class="ml-2">ชาย</span>
                  </label>
                  <label class="inline-flex items-center">
                    <input
                      type="radio"
                      bind:group={formData.gender}
                      value="F"
                      class="form-radio h-4 w-4 text-blue-600"
                    />
                    <span class="ml-2">หญิง</span>
                  </label>
                </div>
                {#if validationErrors.gender}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.gender}</p>
                {/if}
              </div>

              <!-- Birthday -->
              <div>
                <label for="birthday" class="block text-sm font-medium text-gray-700">
                  วันเกิด <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="birthday"
                  bind:value={formData.birthday}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.birthday ? 'border-red-300' : ''}"
                />
                {#if validationErrors.birthday}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.birthday}</p>
                {/if}
              </div>

              <!-- Age -->
              <div>
                <label for="ageAtIllness" class="block text-sm font-medium text-gray-700">
                  อายุขณะป่วย <span class="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="ageAtIllness"
                  bind:value={formData.ageAtIllness}
                  min="0"
                  max="150"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.ageAtIllness ? 'border-red-300' : ''}"
                  placeholder="25"
                />
                {#if validationErrors.ageAtIllness}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.ageAtIllness}</p>
                {/if}
              </div>

              <!-- Nationality -->
              <div>
                <label for="nationality" class="block text-sm font-medium text-gray-700">
                  สัญชาติ <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nationality"
                  bind:value={formData.nationality}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.nationality ? 'border-red-300' : ''}"
                  placeholder="ไทย"
                />
                {#if validationErrors.nationality}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.nationality}</p>
                {/if}
              </div>

              <!-- Marital Status -->
              <div>
                <label for="maritalStatus" class="block text-sm font-medium text-gray-700">
                  สถานภาพ <span class="text-red-500">*</span>
                </label>
                <select
                  id="maritalStatus"
                  bind:value={formData.maritalStatus}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.maritalStatus ? 'border-red-300' : ''}"
                >
                  <option value="">เลือกสถานภาพ</option>
                  <option value="SINGLE">โสด</option>
                  <option value="MARRIED">แต่งงาน</option>
                  <option value="DIVORCED">หย่าร้าง</option>
                  <option value="WIDOWED">หม้าย</option>
                  <option value="SEPARATED">แยกกันอยู่</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
                {#if validationErrors.maritalStatus}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.maritalStatus}</p>
                {/if}
              </div>

              <!-- Occupation -->
              <div>
                <label for="occupation" class="block text-sm font-medium text-gray-700">
                  อาชีพ <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="occupation"
                  bind:value={formData.occupation}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.occupation ? 'border-red-300' : ''}"
                  placeholder="เกษตรกร"
                />
                {#if validationErrors.occupation}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.occupation}</p>
                {/if}
              </div>

              <!-- Phone Number -->
              <div>
                <label for="phoneNumber" class="block text-sm font-medium text-gray-700">
                  เบอร์โทรศัพท์ <span class="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  bind:value={formData.phoneNumber}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.phoneNumber ? 'border-red-300' : ''}"
                  placeholder="0812345678"
                />
                {#if validationErrors.phoneNumber}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.phoneNumber}</p>
                {/if}
              </div>
            </div>
          </div>
          {/if}

          <!-- Step 2: ที่อยู่ -->
          {#if currentStep === 2}
          <div class="space-y-6">
            
            <!-- Current Address -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                ที่อยู่ปัจจุบัน
              </h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="currentHouseNumber" class="block text-sm font-medium text-gray-700">
                    บ้านเลขที่ <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="currentHouseNumber"
                    bind:value={formData.currentHouseNumber}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.currentHouseNumber ? 'border-red-300' : ''}"
                    placeholder="123"
                  />
                  {#if validationErrors.currentHouseNumber}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.currentHouseNumber}</p>
                  {/if}
                </div>

                <div>
                  <label for="currentVillageNumber" class="block text-sm font-medium text-gray-700">
                    หมู่ <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="currentVillageNumber"
                    bind:value={formData.currentVillageNumber}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.currentVillageNumber ? 'border-red-300' : ''}"
                    placeholder="1"
                  />
                  {#if validationErrors.currentVillageNumber}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.currentVillageNumber}</p>
                  {/if}
                </div>

                <div class="md:col-span-2">
                  <label for="currentRoadName" class="block text-sm font-medium text-gray-700">
                    ถนน <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="currentRoadName"
                    bind:value={formData.currentRoadName}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.currentRoadName ? 'border-red-300' : ''}"
                    placeholder="สายหลัก"
                  />
                  {#if validationErrors.currentRoadName}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.currentRoadName}</p>
                  {/if}
                </div>

                <div>
                  <label for="currentSubDistrict" class="block text-sm font-medium text-gray-700">
                    ตำบล/แขวง <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="currentSubDistrict"
                    bind:value={formData.currentSubDistrict}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.currentSubDistrict ? 'border-red-300' : ''}"
                    placeholder="ท่าโรง"
                  />
                  {#if validationErrors.currentSubDistrict}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.currentSubDistrict}</p>
                  {/if}
                </div>

                <div>
                  <label for="currentDistrict" class="block text-sm font-medium text-gray-700">
                    อำเภอ/เขต <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="currentDistrict"
                    bind:value={formData.currentDistrict}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.currentDistrict ? 'border-red-300' : ''}"
                    placeholder="วิเชียรบุรี"
                  />
                  {#if validationErrors.currentDistrict}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.currentDistrict}</p>
                  {/if}
                </div>

                <div class="md:col-span-2">
                  <label for="currentProvince" class="block text-sm font-medium text-gray-700">
                    จังหวัด <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="currentProvince"
                    bind:value={formData.currentProvince}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.currentProvince ? 'border-red-300' : ''}"
                    placeholder="เพชรบูรณ์"
                  />
                  {#if validationErrors.currentProvince}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.currentProvince}</p>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Sick Address -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-medium text-gray-900 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  </svg>
                  ที่อยู่ขณะเจ็บป่วย
                </h4>
                
                <button
                  type="button"
                  on:click={copyCurrentToSickAddress}
                  class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  คัดลอกจากที่อยู่ปัจจุบัน
                </button>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="addressSickHouseNumber" class="block text-sm font-medium text-gray-700">
                    บ้านเลขที่ <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressSickHouseNumber"
                    bind:value={formData.addressSickHouseNumber}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.addressSickHouseNumber ? 'border-red-300' : ''}"
                    placeholder="123"
                  />
                  {#if validationErrors.addressSickHouseNumber}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.addressSickHouseNumber}</p>
                  {/if}
                </div>

                <div>
                  <label for="addressSickVillageNumber" class="block text-sm font-medium text-gray-700">
                    หมู่ <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressSickVillageNumber"
                    bind:value={formData.addressSickVillageNumber}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.addressSickVillageNumber ? 'border-red-300' : ''}"
                    placeholder="1"
                  />
                  {#if validationErrors.addressSickVillageNumber}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.addressSickVillageNumber}</p>
                  {/if}
                </div>

                <div class="md:col-span-2">
                  <label for="addressSickRoadName" class="block text-sm font-medium text-gray-700">
                    ถนน <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressSickRoadName"
                    bind:value={formData.addressSickRoadName}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.addressSickRoadName ? 'border-red-300' : ''}"
                    placeholder="สายหลัก"
                  />
                  {#if validationErrors.addressSickRoadName}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.addressSickRoadName}</p>
                  {/if}
                </div>

                <div>
                  <label for="addressSickSubDistrict" class="block text-sm font-medium text-gray-700">
                    ตำบล/แขวง <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressSickSubDistrict"
                    bind:value={formData.addressSickSubDistrict}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.addressSickSubDistrict ? 'border-red-300' : ''}"
                    placeholder="ท่าโรง"
                  />
                  {#if validationErrors.addressSickSubDistrict}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.addressSickSubDistrict}</p>
                  {/if}
                </div>

                <div>
                  <label for="addressSickDistrict" class="block text-sm font-medium text-gray-700">
                    อำเภอ/เขต <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressSickDistrict"
                    bind:value={formData.addressSickDistrict}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.addressSickDistrict ? 'border-red-300' : ''}"
                    placeholder="วิเชียรบุรี"
                  />
                  {#if validationErrors.addressSickDistrict}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.addressSickDistrict}</p>
                  {/if}
                </div>

                <div class="md:col-span-2">
                  <label for="addressSickProvince" class="block text-sm font-medium text-gray-700">
                    จังหวัด <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressSickProvince"
                    bind:value={formData.addressSickProvince}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           {validationErrors.addressSickProvince ? 'border-red-300' : ''}"
                    placeholder="เพชรบูรณ์"
                  />
                  {#if validationErrors.addressSickProvince}
                    <p class="mt-1 text-sm text-red-600">{validationErrors.addressSickProvince}</p>
                  {/if}
                </div>
              </div>
            </div>
          </div>
          {/if}

          <!-- Step 3: การเจ็บป่วย -->
          {#if currentStep === 3}
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Disease -->
              <div>
                <label for="diseaseId" class="block text-sm font-medium text-gray-700">
                  โรค <span class="text-red-500">*</span>
                </label>
                <select
                  id="diseaseId"
                  bind:value={formData.diseaseId}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.diseaseId ? 'border-red-300' : ''}"
                >
                  <option value={undefined}>เลือกโรค</option>
                  {#each diseases as disease}
                    <option value={disease.id}>{disease.thaiName}</option>
                  {/each}
                </select>
                {#if validationErrors.diseaseId}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.diseaseId}</p>
                {/if}
              </div>

              <!-- Treatment Hospital -->
              <div>
                <label for="treatmentHospital" class="block text-sm font-medium text-gray-700">
                  โรงพยาบาลหลัก <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="treatmentHospital"
                  bind:value={formData.treatmentHospital}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.treatmentHospital ? 'border-red-300' : ''}"
                  placeholder="โรงพยาบาลวิเชียรบุรี"
                />
                {#if validationErrors.treatmentHospital}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.treatmentHospital}</p>
                {/if}
              </div>

              <!-- Treatment Area -->
              <div>
                <label for="treatmentArea" class="block text-sm font-medium text-gray-700">
                  พื้นที่รักษา <span class="text-red-500">*</span>
                </label>
                <select
                  id="treatmentArea"
                  bind:value={formData.treatmentArea}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.treatmentArea ? 'border-red-300' : ''}"
                >
                  <option value="">เลือกพื้นที่รักษา</option>
                  <option value="เทศบาล">เทศบาล</option>
                  <option value="อบต.">อบต.</option>
                  <option value="ไม่ทราบ">ไม่ทราบ</option>
                </select>
                {#if validationErrors.treatmentArea}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.treatmentArea}</p>
                {/if}
              </div>

              <!-- Illness Date -->
              <div>
                <label for="illnessDate" class="block text-sm font-medium text-gray-700">
                  วันที่เจ็บป่วย <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="illnessDate"
                  bind:value={formData.illnessDate}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.illnessDate ? 'border-red-300' : ''}"
                />
                {#if validationErrors.illnessDate}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.illnessDate}</p>
                {/if}
              </div>

              <!-- Treatment Date -->
              <div>
                <label for="treatmentDate" class="block text-sm font-medium text-gray-700">
                  วันที่เริ่มรักษา <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="treatmentDate"
                  bind:value={formData.treatmentDate}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.treatmentDate ? 'border-red-300' : ''}"
                />
                {#if validationErrors.treatmentDate}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.treatmentDate}</p>
                {/if}
              </div>

              <!-- Diagnosis Date -->
              <div>
                <label for="diagnosisDate" class="block text-sm font-medium text-gray-700">
                  วันที่วินิจฉัย <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="diagnosisDate"
                  bind:value={formData.diagnosisDate}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.diagnosisDate ? 'border-red-300' : ''}"
                />
                {#if validationErrors.diagnosisDate}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.diagnosisDate}</p>
                {/if}
              </div>
            </div>

            <!-- Symptoms -->
            <div>
              <label for="symptomsOfDisease" class="block text-sm font-medium text-gray-700">
                อาการที่พบ <span class="text-red-500">*</span>
              </label>
              <textarea
                id="symptomsOfDisease"
                bind:value={formData.symptomsOfDisease}
                rows="4"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                       {validationErrors.symptomsOfDisease ? 'border-red-300' : ''}"
                placeholder="ระบุอาการที่พบในผู้ป่วย..."
              ></textarea>
              {#if validationErrors.symptomsOfDisease}
                <p class="mt-1 text-sm text-red-600">{validationErrors.symptomsOfDisease}</p>
              {/if}
              
              <!-- Symptoms suggestions -->
              {#if symptoms.length > 0}
                <div class="mt-2">
                  <p class="text-sm text-gray-600 mb-2">อาการที่พบบ่อยในโรคนี้:</p>
                  <div class="flex flex-wrap gap-2">
                    {#each symptoms as symptom}
                      <button
                        type="button"
                        on:click={() => {
                          if (formData.symptomsOfDisease) {
                            formData.symptomsOfDisease += `, ${symptom.name}`;
                          } else {
                            formData.symptomsOfDisease = symptom.name;
                          }
                        }}
                        class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        + {symptom.name}
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          </div>
          {/if}

          <!-- Step 4: ผลตรวจ -->
          {#if currentStep === 4}
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Lab Result -->
              <div>
                <select
                  id="labResult"
                  bind:value={formData.labResult}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.labResult ? 'border-red-300' : ''}"
                >
                  <option value="">เลือกผลตรวจ</option>
                  <option value="Positive">Positive (บวก)</option>
                  <option value="Negative">Negative (ลบ)</option>
                  <option value="Pending">Pending (รอผล)</option>
                  <option value="Inconclusive">Inconclusive (ไม่ชัดเจน)</option>
                  <option value="Not Tested">Not Tested (ไม่ได้ตรวจ)</option>
                </select>
                {#if validationErrors.labResult}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.labResult}</p>
                {/if}
              </div>

              <!-- NS1 Result -->
              <div>
                <label for="ns1Result" class="block text-sm font-medium text-gray-700">
                  ผล NS1 <span class="text-red-500">*</span>
                </label>
                <select
                  id="ns1Result"
                  bind:value={formData.ns1Result}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.ns1Result ? 'border-red-300' : ''}"
                >
                  <option value="">เลือกผล NS1</option>
                  <option value="Positive">Positive (บวก)</option>
                  <option value="Negative">Negative (ลบ)</option>
                  <option value="Pending">Pending (รอผล)</option>
                  <option value="Inconclusive">Inconclusive (ไม่ชัดเจน)</option>
                  <option value="Not Tested">Not Tested (ไม่ได้ตรวจ)</option>
                </select>
                {#if validationErrors.ns1Result}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.ns1Result}</p>
                {/if}
              </div>

              <!-- Patient Type -->
              <div>
                <label for="patientType" class="block text-sm font-medium text-gray-700">
                  ประเภทผู้ป่วย <span class="text-red-500">*</span>
                </label>
                <select
                  id="patientType"
                  bind:value={formData.patientType}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.patientType ? 'border-red-300' : ''}"
                >
                  <option value="">เลือกประเภทผู้ป่วย</option>
                  <option value="IPD">IPD (ผู้ป่วยใน)</option>
                  <option value="OPD">OPD (ผู้ป่วยนอก)</option>
                  <option value="ACF">ACF (Active Case Finding)</option>
                </select>
                {#if validationErrors.patientType}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.patientType}</p>
                {/if}
              </div>

              <!-- Patient Condition -->
              <div>
                <label for="patientCondition" class="block text-sm font-medium text-gray-700">
                  สภาพผู้ป่วย <span class="text-red-500">*</span>
                </label>
                <select
                  id="patientCondition"
                  bind:value={formData.patientCondition}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.patientCondition ? 'border-red-300' : ''}"
                >
                  <option value="">เลือกสภาพผู้ป่วย</option>
                  <option value="ไม่ทราบ">ไม่ทราบ</option>
                  <option value="เสียชีวิต">เสียชีวิต</option>
                  <option value="หายจากโรคแล้ว">หายจากโรคแล้ว</option>
                  <option value="ยังรักษาตัวอยู่">ยังรักษาตัวอยู่</option>
                </select>
                {#if validationErrors.patientCondition}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.patientCondition}</p>
                {/if}
              </div>

              <!-- Death Date (conditional) -->
              {#if formData.patientCondition === 'เสียชีวิต'}
              <div>
                <label for="deathDate" class="block text-sm font-medium text-gray-700">
                  วันที่เสียชีวิต <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="deathDate"
                  bind:value={formData.deathDate}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.deathDate ? 'border-red-300' : ''}"
                />
                {#if validationErrors.deathDate}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.deathDate}</p>
                {/if}
              </div>

              <div>
                <label for="causeOfDeath" class="block text-sm font-medium text-gray-700">
                  สาเหตุการเสียชีวิต
                </label>
                <textarea
                  id="causeOfDeath"
                  bind:value={formData.causeOfDeath}
                  rows="3"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ระบุสาเหตุการเสียชีวิต..."
                ></textarea>
              </div>
              {/if}
            </div>
          </div>
          {/if}

          <!-- Step 5: หมายเหตุ -->
          {#if currentStep === 5}
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Receiving Province -->
              <div>
                <label for="receivingProvince" class="block text-sm font-medium text-gray-700">
                  จังหวัดที่รับผิดชอบ <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="receivingProvince"
                  bind:value={formData.receivingProvince}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.receivingProvince ? 'border-red-300' : ''}"
                  placeholder="เพชรบูรณ์"
                />
                {#if validationErrors.receivingProvince}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.receivingProvince}</p>
                {/if}
              </div>

              <!-- Hospital Code -->
              <div>
                <label for="hospitalCode" class="block text-sm font-medium text-gray-700">
                  รหัสโรงพยาบาล <span class="text-red-500">*</span>
                </label>
                <select
                  id="hospitalCode"
                  bind:value={formData.hospitalCode}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.hospitalCode ? 'border-red-300' : ''}"
                >
                  <option value="">เลือกโรงพยาบาล</option>
                  {#each hospitals as hospital}
                    <option value={hospital.hospitalCode5Digit}>
                      {hospital.hospitalName} ({hospital.hospitalCode5Digit})
                    </option>
                  {/each}
                </select>
                {#if validationErrors.hospitalCode}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.hospitalCode}</p>
                {/if}
              </div>
            </div>

            <!-- Remarks -->
            <div>
              <label for="remarks" class="block text-sm font-medium text-gray-700">
                หมายเหตุ <span class="text-red-500">*</span>
              </label>
              <textarea
                id="remarks"
                bind:value={formData.remarks}
                rows="4"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                       {validationErrors.remarks ? 'border-red-300' : ''}"
                placeholder="ระบุหมายเหตุเพิ่มเติม..."
              ></textarea>
              {#if validationErrors.remarks}
                <p class="mt-1 text-sm text-red-600">{validationErrors.remarks}</p>
              {/if}
            </div>
          </div>
          {/if}
        </div>

        <!-- ========== FORM FOOTER ========== -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
          
          <!-- Next/Submit Button -->
          {#if isLastStep}
            <button
              type="submit"
              disabled={isSubmitting || !canProceed}
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isSubmitting}
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังบันทึก...
              {:else}
                {mode === 'create' ? 'บันทึกข้อมูล' : 'อัปเดตข้อมูล'}
              {/if}
            </button>
          {:else}
            <button
              type="button"
              on:click={nextStep}
              disabled={!canProceed}
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ถัดไป
              <svg class="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          {/if}

          <!-- Previous Button -->
          {#if !isFirstStep}
            <button
              type="button"
              on:click={previousStep}
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              <svg class="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              ย้อนกลับ
            </button>
          {/if}

          <!-- Cancel Button -->
          <button
            type="button"
            on:click={cancelForm}
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
{/if}

<style>
  /* Form styling */
  .form-radio {
    color: #3b82f6;
  }
  
  .form-radio:focus {
    ring-color: #3b82f6;
    ring-offset-width: 2px;
  }
  
  /* Step indicator styles */
  .step-complete {
    @apply bg-blue-600 text-white;
  }
  
  .step-current {
    @apply bg-blue-100 text-blue-600 border-blue-300;
  }
  
  .step-pending {
    @apply bg-gray-100 text-gray-400;
  }
  
  /* Animation for step transitions */
  .step-content {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
                <!-- frontend/src/lib/components/patients/PatientForm.svelte -->
<!-- ✏️ Patient Form Component - ฟอร์ม 5 tabs สำหรับเพิ่ม/แก้ไข -->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { patientDetail, patientActions } from '$lib/stores/patientStore';
  import { patientApi, type CreatePatientData, type UpdatePatientData, type DiseaseOption, type HospitalOption } from '$lib/api/patients/client';
  import { OCCUPATION_OPTIONS } from '$lib/constants/occupations';

  // ========== EVENT DISPATCHER ==========
  const dispatch = createEventDispatcher<{
    save: { patient: any };
    cancel: void;
    close: void;
  }>();

  // ========== PROPS ==========
  export let show = false;
  export let mode: 'create' | 'edit' = 'create';
  export let patientId: number | null = null;

  // ========== STATE ==========
  let currentStep = 1;
  let isSubmitting = false;
  let validationErrors: Record<string, string> = {};
  let formData: Partial<CreatePatientData> = {};

  // Reference data
  let diseases: DiseaseOption[] = [];
  let hospitals: HospitalOption[] = [];
  let symptoms: Array<{id: number, name: string}> = [];

  // ========== FORM STEPS CONFIG ==========
  const formSteps = [
    { 
      id: 1, 
      title: 'ข้อมูลส่วนตัว', 
      description: 'ข้อมูลพื้นฐานของผู้ป่วย',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      requiredFields: ['idCardCode', 'namePrefix', 'patientName', 'gender', 'birthday', 'ageAtIllness', 'nationality', 'maritalStatus', 'occupation', 'phoneNumber']
    },
    { 
      id: 2, 
      title: 'ที่อยู่', 
      description: 'ที่อยู่ปัจจุบันและที่อยู่ขณะป่วย',
      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
      requiredFields: ['currentHouseNumber', 'currentVillageNumber', 'currentRoadName', 'currentProvince', 'currentDistrict', 'currentSubDistrict', 'addressSickHouseNumber', 'addressSickVillageNumber', 'addressSickRoadName', 'addressSickProvince', 'addressSickDistrict', 'addressSickSubDistrict']
    },
    { 
      id: 3, 
      title: 'การเจ็บป่วย', 
      description: 'ข้อมูลการเจ็บป่วยและการรักษา',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      requiredFields: ['diseaseId', 'symptomsOfDisease', 'treatmentArea', 'treatmentHospital', 'illnessDate', 'treatmentDate', 'diagnosisDate']
    },
    { 
      id: 4, 
      title: 'ผลตรวจ', 
      description: 'ผลการตรวจและสถานะผู้ป่วย',
      icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      requiredFields: ['labResult', 'ns1Result', 'patientType', 'patientCondition']
    },
    { 
      id: 5, 
      title: 'หมายเหตุ', 
      description: 'ข้อมูลเพิ่มเติมและหมายเหตุ',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      requiredFields: ['receivingProvince', 'hospitalCode', 'remarks']
    }
  ];

  // ========== REACTIVE STATEMENTS ==========
  $: currentStepData = formSteps.find(step => step.id === currentStep);
  $: isFirstStep = currentStep === 1;
  $: isLastStep = currentStep === formSteps.length;
  $: canProceed = validateCurrentStep();
  $: progressPercentage = ((currentStep - 1) / (formSteps.length - 1)) * 100;

  // ========== LIFECYCLE ==========
  onMount(async () => {
    await loadReferenceData();
    
    if (mode === 'edit' && patientId) {
      await loadPatientData();
    } else {
      resetForm();
    }
  });

  // ========== FUNCTIONS ==========

  /**
   * 📋 Load reference data for dropdowns
   */
  async function loadReferenceData() {
    try {
      const [diseasesResponse, hospitalsResponse] = await Promise.all([
        patientApi.getDiseases(),
        patientApi.getHospitals()
      ]);

      if (diseasesResponse.success && diseasesResponse.data) {
        diseases = diseasesResponse.data;
      }

      if (hospitalsResponse.success && hospitalsResponse.data) {
        hospitals = hospitalsResponse.data;
      }
    } catch (error) {
      console.error('Failed to load reference data:', error);
    }
  }

  /**
   * 📥 Load patient data for editing
   */
  async function loadPatientData() {
    if (!patientId) return;

    const patient = $patientDetail.patient;
    if (patient && patient.id === patientId) {
      populateFormData(patient);
    } else {
      await patientActions.loadPatientById(patientId);
      // จะต้องรอให้ store update แล้ว populate form
    }
  }

  /**
   * 📝 Populate form with patient data
   */
  function populateFormData(patient: any) {
    formData = {
      // Tab 1: Personal Info
      idCardCode: patient.idCardCode || '',
      patientHn: patient.patientHn || '',
      namePrefix: patient.namePrefix || '',
      patientName: patient.patientName || '',
      gender: patient.gender || 'M',
      birthday: patient.birthday || '',
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
      diseaseId: patient.diseaseId || undefined,
      symptomsOfDisease: patient.symptomsOfDisease || '',
      treatmentArea: patient.treatmentArea || '',
      treatmentHospital: patient.treatmentHospital || '',
      illnessDate: patient.illnessDate || '',
      treatmentDate: patient.treatmentDate || '',
      diagnosisDate: patient.diagnosisDate || '',
      
      // Tab 4: Lab Results
      labResult: patient.labResult || '',
      ns1Result: patient.ns1Result || '',
      patientType: patient.patientType || '',
      patientCondition: patient.patientCondition || '',
      deathDate: patient.deathDate || '',
      causeOfDeath: patient.causeOfDeath || '',
      
      // Tab 5: Notes
      receivingProvince: patient.receivingProvince || '',
      hospitalCode: patient.hospitalCode || '',
      remarks: patient.remarks || '',
    };
  }

  /**
   * 🧹 Reset form to initial state
   */
  function resetForm() {
    formData = {
      // Set default values
      gender: 'M',
      nationality: 'ไทย',
      maritalStatus: 'SINGLE',
      treatmentArea: 'เทศบาล',
      labResult: 'Pending',
      ns1Result: 'Pending',
      patientType: 'OPD',
      patientCondition: 'ยังรักษาตัวอยู่',
    };
    validationErrors = {};
    currentStep = 1;
  }

  /**
   * ✅ Validate current step
   */
  function validateCurrentStep(): boolean {
    if (!currentStepData) return false;
    
    const requiredFields = currentStepData.requiredFields;
    const errors: Record<string, string> = {};

    // Check required fields
    requiredFields.forEach(field => {
      const value = formData[field as keyof CreatePatientData];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field] = 'ข้อมูลนี้จำเป็นต้องระบุ';
      }
    });

    // Step-specific validations
    if (currentStep === 1) {
      // Validate Thai ID card
      if (formData.idCardCode && !validateThaiIdCard(formData.idCardCode)) {
        errors.idCardCode = 'รูปแบบเลขบัตรประชาชนไม่ถูกต้อง';
      }
      
      // Validate phone number
      if (formData.phoneNumber && !validateThaiPhone(formData.phoneNumber)) {
        errors.phoneNumber = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
      }
      
      // Validate age
      if (formData.ageAtIllness && (formData.ageAtIllness < 0 || formData.ageAtIllness > 150)) {
        errors.ageAtIllness = 'อายุต้องอยู่ระหว่าง 0-150 ปี';
      }
    }

    if (currentStep === 3) {
      // Validate dates
      if (formData.illnessDate && formData.treatmentDate) {
        if (new Date(formData.treatmentDate) < new Date(formData.illnessDate)) {
          errors.treatmentDate = 'วันที่รักษาต้องไม่ก่อนวันที่เจ็บป่วย';
        }
      }
    }

    if (currentStep === 4) {
      // If patient died, death date is required
      if (formData.patientCondition === 'เสียชีวิต' && !formData.deathDate) {
        errors.deathDate = 'ต้องระบุวันที่เสียชีวิต';
      }
    }

    validationErrors = errors;
    return Object.keys(errors).length === 0;
  }

  /**
   * ➡️ Go to next step
   */
  function nextStep() {
    if (canProceed && !isLastStep) {
      currentStep++;
    }
  }

  /**
   * ⬅️ Go to previous step
   */
  function previousStep() {
    if (!isFirstStep) {
      currentStep--;
    }
  }

  /**
   * 🎯 Go to specific step
   */
  function goToStep(step: number) {
    currentStep = step;
  }

  /**
   * 💾 Submit form
   */
  async function submitForm() {
    if (!validateCurrentStep()) return;

    isSubmitting = true;
    try {
      if (mode === 'create') {
        const success = await patientActions.createPatient(formData as CreatePatientData);
        if (success) {
          dispatch('save', { patient: formData });
          closeForm();
        }
      } else if (mode === 'edit' && patientId) {
        const success = await patientActions.updatePatient(patientId, formData as UpdatePatientData);
        if (success) {
          dispatch('save', { patient: formData });
          closeForm();
        }
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      isSubmitting = false;
    }
  }

  /**
   * ❌ Close form
   */
  function closeForm() {
    dispatch('close');
    resetForm();
  }

  /**
   * 🚫 Cancel form
   */
  function cancelForm() {
    dispatch('cancel');
    closeForm();
  }

  /**
   * 📋 Copy current address to sick address
   */
  function copyCurrentToSickAddress() {
    formData.addressSickHouseNumber = formData.currentHouseNumber;
    formData.addressSickVillageNumber = formData.currentVillageNumber;
    formData.addressSickRoadName = formData.currentRoadName;
    formData.addressSickProvince = formData.currentProvince;
    formData.addressSickDistrict = formData.currentDistrict;
    formData.addressSickSubDistrict = formData.currentSubDistrict;
  }

  /**
   * 🔍 Load symptoms when disease changes
   */
  async function onDiseaseChange() {
    if (formData.diseaseId) {
      try {
        const response = await patientApi.getSymptomsByDisease(formData.diseaseId);
        if (response.success && response.data) {
          symptoms = response.data;
        }
      } catch (error) {
        console.error('Failed to load symptoms:', error);
      }
    } else {
      symptoms = [];
    }
  }

  // ========== VALIDATION HELPERS ==========
  function validateThaiIdCard(idCard: string): boolean {
    if (!/^\d{13}$/.test(idCard)) return false;
    
    const digits = idCard.split('').map(Number);
    const checkDigit = digits[12];
    let sum = 0;
    
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (13 - i);
    }
    
    const remainder = sum % 11;
    const calculatedCheckDigit = remainder < 2 ? (1 - remainder) : (11 - remainder);
    
    return calculatedCheckDigit === checkDigit;
  }

  function validateThaiPhone(phone: string): boolean {
    return /^(\+66|0)[0-9]{8,9}$/.test(phone);
  }

  // ========== REACTIVE DISEASE CHANGE ==========
  $: if (formData.diseaseId) {
    onDiseaseChange();
  }
</script>

<!-- ========== MODAL OVERLAY ========== -->
{#if show}
<div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
  <!-- Backdrop -->
  <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

    <!-- Modal Panel -->
    <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
      
      <!-- ========== MODAL HEADER ========== -->
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              {mode === 'create' ? 'เพิ่มผู้ป่วยใหม่' : 'แก้ไขข้อมูลผู้ป่วย'}
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              {currentStepData?.description}
            </p>
          </div>
          
          <button
            type="button"
            on:click={closeForm}
            class="text-gray-400 hover:text-gray-500"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="mt-4">
          <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>ขั้นตอน {currentStep} จาก {formSteps.length}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style="width: {progressPercentage}%"
            ></div>
          </div>
        </div>

        <!-- Step Navigation -->
        <div class="mt-4 flex justify-center">
          <nav class="flex space-x-4">
            {#each formSteps as step}
              <button
                type="button"
                on:click={() => goToStep(step.id)}
                class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                       {currentStep === step.id 
                         ? 'bg-blue-100 text-blue-700' 
                         : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={step.icon}></path>
                </svg>
                {step.title}
              </button>
            {/each}
          </nav>
        </div>
      </div>

      <!-- ========== FORM CONTENT ========== -->
      <form on:submit|preventDefault={submitForm} class="bg-white">
        <div class="px-4 py-5 sm:p-6">
          
          <!-- Step 1: ข้อมูลส่วนตัว -->
          {#if currentStep === 1}
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- ID Card -->
              <div>
                <label for="idCardCode" class="block text-sm font-medium text-gray-700">
                  เลขบัตรประชาชน <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="idCardCode"
                  bind:value={formData.idCardCode}
                  maxlength="13"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.idCardCode ? 'border-red-300' : ''}"
                  placeholder="1234567890123"
                />
                {#if validationErrors.idCardCode}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.idCardCode}</p>
                {/if}
              </div>

              <!-- Patient HN -->
              <div>
                <label for="patientHn" class="block text-sm font-medium text-gray-700">
                  เลข HN
                </label>
                <input
                  type="text"
                  id="patientHn"
                  bind:value={formData.patientHn}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="HN123456"
                />
              </div>

              <!-- Name Prefix -->
              <div>
                <label for="namePrefix" class="block text-sm font-medium text-gray-700">
                  คำนำหน้า <span class="text-red-500">*</span>
                </label>
                <select
                  id="namePrefix"
                  bind:value={formData.namePrefix}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.namePrefix ? 'border-red-300' : ''}"
                >
                  <option value="">เลือกคำนำหน้า</option>
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                  <option value="เด็กหญิง">เด็กหญิง</option>
                  <option value="เด็กชาย">เด็กชาย</option>
                </select>
                {#if validationErrors.namePrefix}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.namePrefix}</p>
                {/if}
              </div>

              <!-- Patient Name -->
              <div>
                <label for="patientName" class="block text-sm font-medium text-gray-700">
                  ชื่อ-นามสกุล <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="patientName"
                  bind:value={formData.patientName}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                         {validationErrors.patientName ? 'border-red-300' : ''}"
                  placeholder="สมชาย ใจดี"
                />
                {#if validationErrors.patientName}
                  <p class="mt-1 text-sm text-red-600">{validationErrors.patientName}</p>
                {/if}
              </div>

              <!-- Gender -->
              <div>
                <label class="block text-sm font-medium text-gray-700">
                  เพศ <span class="text-red-500">*</span>
                </label>
                <div class="mt-2 space-x-4">
                  <label class="inline-flex items-center">