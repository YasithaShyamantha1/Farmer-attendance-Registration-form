let html5QrCode = null;
const qrRegionId = "qr-reader";
const startBtn = document.getElementById('start-scan');
const stopBtn = document.getElementById('stop-scan');
const formCard = document.getElementById('form-card');
const scannerCard = document.getElementById('scanner-card');
const alerts = document.getElementById('alerts');

function showAlert(msg, type='success', duration=5000){
  const icon = type === 'success' ? '<i class="bi bi-check-circle-fill"></i>' : '<i class="bi bi-exclamation-circle-fill"></i>';
  alerts.innerHTML = `<div class="alert alert-${type} alert-lg">${icon} ${msg}</div>`;
  setTimeout(()=> alerts.innerHTML = '', duration);
}

function startScanner(){
  if (html5QrCode) return;
  Html5Qrcode.getCameras().then(cameras => {
    if (!cameras || cameras.length === 0){
      showAlert('No camera found', 'danger');
      return;
    }
    const cameraId = cameras[0].id;
    html5QrCode = new Html5Qrcode(qrRegionId);
    html5QrCode.start(cameraId, { fps: 10, qrbox: 250 }, onScanSuccess, onScanFail)
      .then(() => {
        startBtn.disabled = true;
        stopBtn.disabled = false;
      })
      .catch(err => showAlert('Could not start camera: ' + err, 'danger'));
  }).catch(err => showAlert('Camera error: ' + err, 'danger'));
}

function stopScanner(){
  if (!html5QrCode) return;
  html5QrCode.stop().then(()=>{
    html5QrCode.clear();
    html5QrCode = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }).catch(err => console.warn('Stop error', err));
}

function onScanFail(error){
  // no-op for regular frame failures
}

function onScanSuccess(decodedText, decodedResult){
  stopScanner();
  document.getElementById('scannedData').value = decodedText;
  openFormWithScannedData(decodedText);
}

function openFormWithScannedData(scanned){
  scannerCard.classList.add('d-none');
  formCard.classList.remove('d-none');
}

function closeForm(){
  formCard.classList.add('d-none');
  scannerCard.classList.remove('d-none');
  document.getElementById('entry-form').reset();
}

function toggleFields(){
  const isFarmer = document.getElementById('role-farmer').checked;
  document.getElementById('farmer-fields').classList.toggle('d-none', !isFarmer);
  document.getElementById('officer-fields').classList.toggle('d-none', isFarmer);
}

document.getElementsByName('role').forEach(r => r.addEventListener('change', toggleFields));

startBtn.addEventListener('click', startScanner);
stopBtn.addEventListener('click', stopScanner);

document.getElementById('cancel-btn').addEventListener('click', ()=>{
  closeForm();
});

document.getElementById('entry-form').addEventListener('submit', function(e){
  e.preventDefault();
  const role = document.querySelector('input[name="role"]:checked').value;
  const payload = { role };
  payload.scannedData = document.getElementById('scannedData').value || null;

  if (role === 'Farmer'){
    payload.name = document.getElementById('name').value || null;
    payload.nic = document.getElementById('nic').value || null;
    payload.address = document.getElementById('address').value || null;
    payload.phone = document.getElementById('phone').value || null;
  } else {
    payload.name = document.getElementById('name_officer').value || null;
    payload.nic = document.getElementById('nic_officer').value || null;
    payload.designation = document.getElementById('designation').value || null;
    payload.institution = document.getElementById('institution').value || null;
  }

  fetch('/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r=>r.json()).then(data => {
    if (data && data.success){
      showAlert('Entry saved successfully!', 'success', 3000);
      setTimeout(() => {
        document.getElementById('entry-form').reset();
        toggleFields();
        alerts.innerHTML = '';
      }, 2000);
    } else {
      showAlert('Save failed', 'danger');
    }
  }).catch(err => {
    console.error(err);
    showAlert('Network error', 'danger');
  });
});

// Show form by default (hide scanner) since user requested form-first flow
scannerCard.classList.add('d-none');
formCard.classList.remove('d-none');
toggleFields();
// hide scanner controls when not used
if (startBtn) startBtn.style.display = 'none';
if (stopBtn) stopBtn.style.display = 'none';
