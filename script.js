// Elements
const startBg = document.getElementById('start-bg');
const stopBg = document.getElementById('stop-bg');
const voiceSave = document.getElementById('voice-save');
const voiceStrength = document.getElementById('voice-strength');
const voiceVerify = document.getElementById('voice-verify');
const voiceStatus = document.getElementById('voice-status');

const strengthInput = document.getElementById('strength-input');
const strengthBar = document.getElementById('strength-bar');
const strengthScoreEl = document.getElementById('strength-score');
const checkStrengthBtn = document.getElementById('check-strength');

const websiteEl = document.getElementById('website');
const usernameEl = document.getElementById('username');
const passwordEl = document.getElementById('password');
const saveBtn = document.getElementById('save-password');

const savedSites = document.getElementById('saved-sites');
const verifyInput = document.getElementById('verify-password');
const verifyBtn = document.getElementById('verify-btn');
const verifyResult = document.getElementById('verify-result');

const passwordList = document.getElementById('password-list');
const clearAllBtn = document.getElementById('clear-all');

const totalEl = document.getElementById('total-passwords');
const weakEl = document.getElementById('weak-passwords');
const avgEl = document.getElementById('avg-score');
const lastCheckEl = document.getElementById('last-check');

// Background animation (color cycling)
let bgInterval = null;
let colorIdx = 0;
const colors = [
  ['#667eea', '#764ba2'],
  ['#2ed573', '#1e90ff'],
  ['#ff6b6b', '#ee5a52'],
  ['#f39c12', '#e74c3c']
];
startBg.addEventListener('click', () => {
  clearInterval(bgInterval);
  bgInterval = setInterval(() => {
    colorIdx = (colorIdx + 1) % colors.length;
    document.body.style.background = `linear-gradient(135deg, ${colors[colorIdx][0]}, ${colors[colorIdx][1]})`;
  }, 2500);
});
stopBg.addEventListener('click', () => {
  clearInterval(bgInterval);
});

// Voice helpers
function speak(text){
  try{
    const u = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    voiceStatus.textContent = 'Speaking...';
    u.onend = () => voiceStatus.textContent = 'Ready';
  }catch(e){
    voiceStatus.textContent = 'Not supported';
  }
}
voiceSave.addEventListener('click', ()=> speak('Save password button pressed'));
voiceStrength.addEventListener('click', ()=> speak('Password strength check'));
voiceVerify.addEventListener('click', ()=> speak('Verify password'));

// Password scoring
function calculateScore(pwd){
  let score = 0;
  if(!pwd) return 0;
  if(pwd.length >= 8) score += 30;
  if(/[A-Z]/.test(pwd)) score += 20;
  if(/[0-9]/.test(pwd)) score += 25;
  if(/[^A-Za-z0-9]/.test(pwd)) score += 25;
  return Math.min(score, 100);
}

// Live strength update
strengthInput.addEventListener('input', () => {
  const s = calculateScore(strengthInput.value);
  updateStrengthUI(s);
});

function updateStrengthUI(score){
  strengthBar.style.width = `${score}%`;
  if(score < 50) strengthBar.style.background = 'linear-gradient(90deg, #ff6b6b, #ff4757)';
  else if(score < 75) strengthBar.style.background = 'linear-gradient(90deg, #ffa502, #ffb86b)';
  else strengthBar.style.background = 'linear-gradient(90deg, #2ed573, #06d6a0)';
  strengthScoreEl.textContent = `${score}/100`;
}

// check button (voice + background reaction)
checkStrengthBtn.addEventListener('click', () => {
  const score = calculateScore(strengthInput.value);
  updateStrengthUI(score);
  speak(`Password strength is ${score} out of 100`);
  // subtle background reaction
  if(score < 50) document.body.style.filter = 'hue-rotate(-10deg) saturate(0.9)';
  else if(score < 75) document.body.style.filter = 'hue-rotate(10deg) saturate(1.05)';
  else document.body.style.filter = 'hue-rotate(50deg) saturate(1.15)';
  setTimeout(()=> document.body.style.filter = '', 900);
});

// Storage & CRUD
function loadPasswords(){
  return JSON.parse(localStorage.getItem('passwords') || '[]');
}
function savePasswords(arr){
  localStorage.setItem('passwords', JSON.stringify(arr));
}

// Save new password
saveBtn.addEventListener('click', () => {
  const w = websiteEl.value.trim(), u = usernameEl.value.trim(), p = passwordEl.value;
  if(!w || !u || !p){ alert('Please fill all fields'); return; }
  const arr = loadPasswords();
  arr.push({ website: w, username: u, password: p });
  savePasswords(arr);
  speak('Password saved');
  websiteEl.value = usernameEl.value = passwordEl.value = '';
  renderAll();
});

// Render list and dashboard
function renderAll(){
  const arr = loadPasswords();
  // list
  passwordList.innerHTML = '';
  savedSites.innerHTML = '<option>Select saved site</option>';
  let weakCount = 0, sum = 0;

  arr.forEach((item, idx) => {
    // List item
    const itemEl = document.createElement('div');
    itemEl.className = 'password-item';
    itemEl.innerHTML = `
      <div class="meta">
        <div><strong>${escapeHtml(item.website)}</strong></div>
        <div style="opacity:0.85">${escapeHtml(item.username)}</div>
      </div>
      <div class="actions">
        <div style="font-weight:700; margin-right:8px">${calculateScore(item.password) >= 50 ? 'Strong' : 'Weak'} • ${calculateScore(item.password)}</div>
        <button class="copyBtn">Copy</button>
        <button class="delBtn">Delete</button>
      </div>
    `;
    // copy
    itemEl.querySelector('.copyBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(item.password).then(()=> {
        speak('Password copied to clipboard');
        alert('Password copied to clipboard');
      });
    });
    // delete
    itemEl.querySelector('.delBtn').addEventListener('click', () => {
      if(!confirm('Delete this password?')) return;
      arr.splice(idx,1); savePasswords(arr); renderAll(); speak('Password deleted');
    });

    passwordList.appendChild(itemEl);

    // dropdown
    const opt = document.createElement('option');
    opt.value = item.website; opt.textContent = item.website;
    savedSites.appendChild(opt);

    // metrics
    const sc = calculateScore(item.password);
    sum += sc;
    if(sc < 50) weakCount++;
  });

  // dashboard
  totalEl.textContent = arr.length;
  weakEl.textContent = weakCount;
  avgEl.textContent = arr.length ? `${Math.round(sum / arr.length)}/100` : '0/100';
  lastCheckEl.textContent = new Date().toLocaleString();
}

// Clear all
clearAllBtn.addEventListener('click', () => {
  if(!confirm('Clear all saved passwords?')) return;
  localStorage.removeItem('passwords'); renderAll(); speak('All passwords cleared');
});

// Verify
verifyBtn.addEventListener('click', () => {
  const site = savedSites.value;
  const pwd = verifyInput.value;
  if(!site || site === 'Select saved site'){ alert('Select a saved site'); return; }
  const arr = loadPasswords();
  const found = arr.find(item => item.website === site && item.password === pwd);
  verifyResult.textContent = found ? '✅ Password Verified' : '❌ Incorrect Password';
  verifyResult.style.color = found ? '#2ed573' : '#ff6b6b';
  speak(found ? 'Password verified' : 'Password incorrect');
  setTimeout(()=> verifyResult.textContent = '', 3000);
});

// Utility: escape to avoid accidental HTML injection in DOM
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])});
}

// initial render
renderAll();
updateStrengthUI(0);

