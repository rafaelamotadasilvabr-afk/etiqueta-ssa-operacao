const awbInput = document.getElementById('awbCompleta');
const motivoSelect = document.getElementById('motivo');
const slaInput = document.getElementById('slaCarga');
const previewSla = document.getElementById('previewSla');
const qtdDisplay = document.getElementById('qtdDisplay');
const menosBtn = document.getElementById('menos');
const maisBtn = document.getElementById('mais');
const novaAwbBtn = document.getElementById('novaAwb');
const imprimirBtn = document.getElementById('imprimir');

const previewMotivo = document.getElementById('previewMotivo');
const previewAwb = document.getElementById('previewAwb');
const previewCompleta = document.getElementById('previewCompleta');
const previewVolume = document.getElementById('previewVolume');
const barcodePreview = document.getElementById('barcodePreview');
const barcodeHuman = document.getElementById('barcodeHuman');
const previewDate = document.getElementById('previewDate');
const previewLabel = document.getElementById('previewLabel');
const printRoot = document.getElementById('printRoot');
const awbError = document.getElementById('awbError');

let quantidade = 1;

function onlyDigits(value){
  return String(value || '').replace(/\D/g, '');
}

function parseAwbCompleta(value){
  const digits = onlyDigits(value);

  if(digits.length !== 15 || !digits.startsWith('577')){
    return {
      valid:false,
      completa:digits,
      awb:'00000000',
      prefix:'577',
      volumeCode:'0000'
    };
  }

  return {
    valid:true,
    completa:digits,
    prefix:digits.slice(0,3),
    awb:digits.slice(3,11),
    volumeCode:digits.slice(11,15)
  };
}

function barcodeForVolume(volumeIndex){
  const parsed = parseAwbCompleta(awbInput.value);
  if(!parsed.valid) return '';
  return `${parsed.prefix}${parsed.awb}${String(volumeIndex).padStart(4,'0')}`;
}

function brDate(){
  return new Intl.DateTimeFormat('pt-BR').format(new Date());
}

function formatSla(){
  const value = slaInput.value;
  if(!value) return '—';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function renderBarcode(svgElement, code, humanText){
  if(!window.JsBarcode || !code){
    svgElement.innerHTML = '';
    return;
  }

  JsBarcode(svgElement, code, {
    format:'CODE128',
    displayValue:false,
    width:2,
    height:62,
    margin:0,
    background:'#ffffff',
    lineColor:'#000000'
  });

  if(humanText !== undefined){
    humanText.textContent = parseAwbCompleta(code).awb || '00000000';
  }
}

function fitReasonText(element){
  const text = element.textContent || '';
  if(text.length > 34){
    element.style.fontSize = '20px';
  }else if(text.length > 25){
    element.style.fontSize = '23px';
  }else{
    element.style.fontSize = '';
  }
}

function validateAwb(showError=false){
  const parsed = parseAwbCompleta(awbInput.value);
  awbError.hidden = true;
  awbError.textContent = '';

  if(showError && awbInput.value && !parsed.valid){
    awbError.textContent = 'AWB inválida. Use 15 números iniciando por 577.';
    awbError.hidden = false;
  }

  return parsed.valid;
}

function updatePreview(){
  const parsed = parseAwbCompleta(awbInput.value);
  const motivo = motivoSelect.value || 'SELECIONE O MOTIVO';

  previewMotivo.textContent = motivo;
  previewSla.textContent = formatSla();
  fitReasonText(previewMotivo);

  previewAwb.textContent = parsed.valid ? parsed.awb : '00000000';
  previewCompleta.textContent = parsed.valid ? parsed.completa : '—';
  previewVolume.textContent = `1 / ${quantidade}`;
  qtdDisplay.textContent = quantidade;
  previewDate.textContent = brDate();

  const barcode = parsed.valid ? barcodeForVolume(1) : '577000000000001';
  renderBarcode(barcodePreview, barcode);
  barcodeHuman.textContent = parsed.valid ? parsed.awb : '00000000';
}

function setQuantidade(next){
  quantidade = Math.max(1, Math.min(999, Number(next) || 1));
  updatePreview();
}

function resetForm(){
  awbInput.value = '';
  motivoSelect.value = '';
  slaInput.value = '';
  quantidade = 1;
  awbError.hidden = true;
  updatePreview();
  awbInput.focus();
}

function cloneLabelForPrint(volumeIndex){
  const parsed = parseAwbCompleta(awbInput.value);
  const clone = previewLabel.cloneNode(true);

  clone.removeAttribute('id');

  const motivo = motivoSelect.value || 'SELECIONE O MOTIVO';
  const reason = clone.querySelector('.reason-value');
  reason.textContent = motivo;

  if(motivo.length > 34) reason.style.fontSize = '20px';
  else if(motivo.length > 25) reason.style.fontSize = '23px';

  clone.querySelector('.awb-value').textContent = parsed.awb;
  clone.querySelector('.sla-value').textContent = formatSla();
  clone.querySelector('.awb-completa span').textContent = parsed.completa;
  clone.querySelector('.volume-value').textContent = `${volumeIndex} / ${quantidade}`;
  clone.querySelector('.barcode-human').textContent = parsed.awb;
  clone.querySelector('.label-footer span:last-child').textContent = brDate();

  const oldSvg = clone.querySelector('svg');
  const newSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  oldSvg.replaceWith(newSvg);

  renderBarcode(newSvg, barcodeForVolume(volumeIndex));

  return clone;
}

function printLabels(){
  const validAwb = validateAwb(true);
  const motivo = motivoSelect.value;

  if(!validAwb){
    awbInput.focus();
    return;
  }

  if(!motivo){
    alert('Selecione o motivo da pendência.');
    motivoSelect.focus();
    return;
  }

  printRoot.innerHTML = '';

  for(let i=1; i<=quantidade; i++){
    const page = document.createElement('section');
    page.className = 'print-page';
    page.appendChild(cloneLabelForPrint(i));
    printRoot.appendChild(page);
  }

  setTimeout(() => window.print(), 100);
}

awbInput.addEventListener('input', () => {
  const digits = onlyDigits(awbInput.value).slice(0,15);
  if(awbInput.value !== digits) awbInput.value = digits;
  validateAwb(false);
  updatePreview();
});

awbInput.addEventListener('blur', () => validateAwb(true));

awbInput.addEventListener('keydown', (event) => {
  if(event.key === 'Enter'){
    event.preventDefault();
    if(validateAwb(true)){
      motivoSelect.focus();
    }
  }
});

motivoSelect.addEventListener('change', updatePreview);
slaInput.addEventListener('input', updatePreview);
slaInput.addEventListener('change', updatePreview);
menosBtn.addEventListener('click', () => setQuantidade(quantidade - 1));
maisBtn.addEventListener('click', () => setQuantidade(quantidade + 1));
novaAwbBtn.addEventListener('click', resetForm);
imprimirBtn.addEventListener('click', printLabels);

updatePreview();
awbInput.focus();
