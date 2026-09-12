// Data Model & Constants
const BUILT_IN_PROFILE = {
  branch: 'CSE',
  cgpa: '8.1',
  gradYear: '2027',
  backlogs: '1',
  skills: 'Git, Python, SQL'
};

const ROLES = [
  { id: 'CF01', title: 'Data Operations Intern', allowedBranches: ['CSE', 'IT'], minCgpa: 7.5, allowedGradYears: [2027], maxBacklogs: 1, requiredSkills: ['Python', 'SQL'] },
  { id: 'CF02', title: 'QA Automation Intern', allowedBranches: ['CSE', 'ECE', 'IT'], minCgpa: 7.0, allowedGradYears: [2027, 2028], maxBacklogs: 1, requiredSkills: ['Git'] },
  { id: 'CF03', title: 'Embedded Systems Intern', allowedBranches: ['ECE', 'EEE'], minCgpa: 7.5, allowedGradYears: [2027], maxBacklogs: 1, requiredSkills: ['Git'] },
  { id: 'CF04', title: 'Machine Learning Intern', allowedBranches: ['CSE', 'IT'], minCgpa: 8.5, allowedGradYears: [2027], maxBacklogs: 1, requiredSkills: ['Python'] },
  { id: 'CF05', title: 'Platform Engineering Intern', allowedBranches: ['CSE', 'ECE'], minCgpa: 7.0, allowedGradYears: [2026], maxBacklogs: 0, requiredSkills: ['Docker', 'Git'] },
];

// Pure Functions (Validation & Eligibility)

function normalizeProfile(rawInput) {
  const branch = (rawInput.branch || '').trim();
  const cgpa = Number(rawInput.cgpa);
  const gradYear = Number(rawInput.gradYear);
  const backlogs = Number(rawInput.backlogs);
  
  const rawSkills = (rawInput.skills || '').split(',');
  const normalizedSkills = [];
  const seenSkills = new Set();
  
  for (const skill of rawSkills) {
    const trimmed = skill.trim();
    if (trimmed) {
      const lower = trimmed.toLowerCase();
      if (!seenSkills.has(lower)) {
        seenSkills.add(lower);
        normalizedSkills.push(trimmed);
      }
    }
  }

  return {
    rawBranch: rawInput.branch,
    rawCgpa: rawInput.cgpa,
    rawGradYear: rawInput.gradYear,
    rawBacklogs: rawInput.backlogs,
    branch,
    branchLower: branch.toLowerCase(),
    cgpa,
    gradYear,
    backlogs,
    skills: normalizedSkills,
    skillsLower: new Set(normalizedSkills.map(s => s.toLowerCase()))
  };
}

function validateProfile(profile) {
  if (!profile.branch) return 'INVALID_BRANCH';
  if (!isFinite(profile.cgpa) || profile.cgpa < 0 || profile.cgpa > 10 || profile.rawCgpa.trim() === '') return 'INVALID_CGPA';
  if (!Number.isInteger(profile.gradYear) || profile.gradYear < 2000 || profile.gradYear > 2100 || profile.rawGradYear.trim() === '') return 'INVALID_GRADUATION_YEAR';
  if (!Number.isInteger(profile.backlogs) || profile.backlogs < 0 || profile.rawBacklogs.trim() === '') return 'INVALID_BACKLOG_COUNT';
  return null;
}

function evaluateRole(profile, role) {
  const failureReasons = [];
  
  // 1. Branch
  const allowedBranchesLower = role.allowedBranches.map(b => b.toLowerCase());
  if (!allowedBranchesLower.includes(profile.branchLower)) {
    failureReasons.push('BRANCH_NOT_ALLOWED');
  }
  
  // 2. CGPA
  if (profile.cgpa < role.minCgpa) {
    failureReasons.push('CGPA_BELOW_MINIMUM');
  }
  
  // 3. Graduation Year
  if (!role.allowedGradYears.includes(profile.gradYear)) {
    failureReasons.push('GRADUATION_YEAR_NOT_ALLOWED');
  }
  
  // 4. Backlogs
  if (profile.backlogs > role.maxBacklogs) {
    failureReasons.push('TOO_MANY_ACTIVE_BACKLOGS');
  }
  
  // 5. Skills
  const missingSkills = [];
  for (const reqSkill of role.requiredSkills) {
    if (!profile.skillsLower.has(reqSkill.toLowerCase())) {
      missingSkills.push(reqSkill);
    }
  }
  // Sort missing skills case-insensitively alphabetical
  missingSkills.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  for (const skill of missingSkills) {
    failureReasons.push(`MISSING_SKILL: ${skill}`);
  }
  
  return {
    role,
    isEligible: failureReasons.length === 0,
    failureReasons
  };
}

function evaluateAllRoles(profile, roles) {
  const results = roles.map(role => evaluateRole(profile, role));
  
  const eligible = [];
  const ineligible = [];
  
  for (const res of results) {
    if (res.isEligible) eligible.push(res);
    else ineligible.push(res);
  }
  
  const sortFn = (a, b) => {
    const titleCmp = a.role.title.toLowerCase().localeCompare(b.role.title.toLowerCase());
    if (titleCmp !== 0) return titleCmp;
    return a.role.id.localeCompare(b.role.id);
  };
  
  eligible.sort(sortFn);
  ineligible.sort(sortFn);
  
  return { eligible, ineligible };
}

// DOM Rendering & State Sync

const DOM = {
  branch: document.getElementById('branch'),
  cgpa: document.getElementById('cgpa'),
  gradYear: document.getElementById('gradYear'),
  backlogs: document.getElementById('backlogs'),
  skills: document.getElementById('skills'),
  btnEvaluate: document.getElementById('btnEvaluate'),
  btnLoadSample: document.getElementById('btnLoadSample'),
  btnReset: document.getElementById('btnReset'),
  validationBanner: document.getElementById('validationBanner'),
  resultsSummary: document.getElementById('resultsSummary'),
  resultsList: document.getElementById('resultsList'),
};

function getFormValues() {
  return {
    branch: DOM.branch.value,
    cgpa: DOM.cgpa.value,
    gradYear: DOM.gradYear.value,
    backlogs: DOM.backlogs.value,
    skills: DOM.skills.value
  };
}

function setFormValues(profileObj) {
  DOM.branch.value = profileObj.branch;
  DOM.cgpa.value = profileObj.cgpa;
  DOM.gradYear.value = profileObj.gradYear;
  DOM.backlogs.value = profileObj.backlogs;
  DOM.skills.value = profileObj.skills;
}

function renderValidationMessage(message) {
  if (message) {
    DOM.validationBanner.textContent = message;
    DOM.validationBanner.classList.add('active');
  } else {
    DOM.validationBanner.textContent = '';
    DOM.validationBanner.classList.remove('active');
  }
}

function renderResults(eligible, ineligible) {
  DOM.resultsList.innerHTML = '';
  
  DOM.resultsSummary.textContent = `Eligible: ${eligible.length} | Ineligible: ${ineligible.length}`;
  
  const allResults = [...eligible, ...ineligible];
  
  allResults.forEach(res => {
    const card = document.createElement('div');
    card.className = 'role-card';
    
    const badgeClass = res.isEligible ? 'badge-eligible' : 'badge-ineligible';
    const badgeText = res.isEligible ? 'Eligible' : 'Ineligible';
    
    let reasonsHtml = '';
    if (!res.isEligible && res.failureReasons.length > 0) {
      reasonsHtml = '<ul class="failure-reasons">';
      res.failureReasons.forEach(reason => {
        reasonsHtml += `<li>${reason}</li>`;
      });
      reasonsHtml += '</ul>';
    }
    
    card.innerHTML = `
      <div class="role-header">
        <div class="role-title-wrap">
          <span class="role-title">${res.role.title}</span>
          <span class="role-id">${res.role.id}</span>
        </div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      ${reasonsHtml}
    `;
    
    DOM.resultsList.appendChild(card);
  });
}

function clearResults() {
  DOM.resultsList.innerHTML = '';
  DOM.resultsSummary.textContent = '';
}

function handleEvaluate() {
  const rawValues = getFormValues();
  const profile = normalizeProfile(rawValues);
  const validationError = validateProfile(profile);
  
  if (validationError) {
    renderValidationMessage(validationError);
    clearResults();
    return;
  }
  
  renderValidationMessage(null); // Clear any previous errors
  const { eligible, ineligible } = evaluateAllRoles(profile, ROLES);
  renderResults(eligible, ineligible);
}

function handleReset() {
  setFormValues(BUILT_IN_PROFILE);
  renderValidationMessage(null);
  handleEvaluate();
}

function handleLoadSample() {
  setFormValues(BUILT_IN_PROFILE);
  handleEvaluate();
}

// Action Wiring
DOM.btnEvaluate.addEventListener('click', handleEvaluate);
DOM.btnReset.addEventListener('click', handleReset);
DOM.btnLoadSample.addEventListener('click', handleLoadSample);

// Initialize on load
handleReset();
