// ============================================
// CONFIGURACIÓN
// ============================================
const OPENAI_API_KEY = ''; // ⚠️ CAMBIAR POR TU API KEY

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const currentBalance = document.getElementById('currentBalance');
const walletSelector = document.getElementById('walletSelector');
const createInvoicesBtn = document.getElementById('createInvoicesBtn');
const pendingInvoicesList = document.getElementById('pendingInvoicesList');
const paidInvoicesList = document.getElementById('paidInvoicesList');
const pendingCount = document.getElementById('pendingCount');
const paidCount = document.getElementById('paidCount');
const invoiceModal = document.getElementById('invoiceModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const copyQRBtn = document.getElementById('copyQRBtn');
const searchPending = document.getElementById('searchPending');
const searchPaid = document.getElementById('searchPaid');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const modalNote = document.getElementById('modalNote');
const analyzeBtn = document.getElementById('analyzeBtn');
const aiPrompt = document.getElementById('aiPrompt');
const aiStatus = document.getElementById('aiStatus');

// Wallet Config Modal
const walletConfigModal = document.getElementById('walletConfigModal');
const openWalletConfigBtn = document.getElementById('openWalletConfigBtn');
const closeWalletConfigBtn = document.getElementById('closeWalletConfigBtn');
const addWalletBtn = document.getElementById('addWalletBtn');
const walletName = document.getElementById('walletName');
const walletUrl = document.getElementById('walletUrl');
const walletKey = document.getElementById('walletKey');
const walletsList = document.getElementById('walletsList');
const aiConfigBtn = document.getElementById('aiConfigBtn');
const aiConfigPrompt = document.getElementById('aiConfigPrompt');
const aiConfigStatus = document.getElementById('aiConfigStatus');

// Split Payment Modal
const splitPaymentModal = document.getElementById('splitPaymentModal');
const openSplitPaymentBtn = document.getElementById('openSplitPaymentBtn');
const closeSplitPaymentBtn = document.getElementById('closeSplitPaymentBtn');
const splitTotalAmount = document.getElementById('splitTotalAmount');
const splitMemo = document.getElementById('splitMemo');
const splitInvoiceCount = document.getElementById('splitInvoiceCount');
const splitWalletsList = document.getElementById('splitWalletsList');
const addSplitWalletBtn = document.getElementById('addSplitWalletBtn');
const splitTotalAssigned = document.getElementById('splitTotalAssigned');
const previewSplitBtn = document.getElementById('previewSplitBtn');
const createSplitBtn = document.getElementById('createSplitBtn');
const splitPreview = document.getElementById('splitPreview');
const splitPreviewContent = document.getElementById('splitPreviewContent');
const aiSplitBtn = document.getElementById('aiSplitBtn');
const aiSplitPrompt = document.getElementById('aiSplitPrompt');
const aiSplitStatus = document.getElementById('aiSplitStatus');

// Payment Modal - MEJORADO
const paymentModal = document.getElementById('paymentModal');
const openPaymentBtn = document.getElementById('openPaymentBtn');
const closePaymentBtn = document.getElementById('closePaymentBtn');
const paymentWalletSelector = document.getElementById('paymentWalletSelector');
const startScanBtn = document.getElementById('startScanBtn');
const stopScanBtn = document.getElementById('stopScanBtn');
const qrReaderContainer = document.getElementById('qrReaderContainer');
const qrVideo = document.getElementById('qrVideo');
const qrCanvas = document.getElementById('qrCanvas');
const scanStatus = document.getElementById('scanStatus');
const manualInvoiceInput = document.getElementById('manualInvoiceInput');
const decodeManualBtn = document.getElementById('decodeManualBtn');
const paymentDetails = document.getElementById('paymentDetails');
const paymentInvoice = document.getElementById('paymentInvoice');
const paymentAmount = document.getElementById('paymentAmount');
const paymentDescription = document.getElementById('paymentDescription');
const paymentActions = document.getElementById('paymentActions');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
const paymentStatus = document.getElementById('paymentStatus');

// ============================================
// VARIABLES GLOBALES
// ============================================
let wallets = JSON.parse(localStorage.getItem('wallets')) || [];
let activeWalletId = localStorage.getItem('activeWalletId') || null;
let activeInvoices = {};
let invoiceCounter = 1;
let currentInvoice = null;
let monitoringInterval = null;
let splitWalletsConfig = [];

// Payment variables - MEJORADO
let paymentWalletId = null;
let currentPaymentRequest = null;
let qrStream = null;
let scanningAnimationFrame = null;
let isScanning = false;

// ============================================
// GESTIÓN DE WALLETS (sin cambios)
// ============================================
function saveWallets() {
    localStorage.setItem('wallets', JSON.stringify(wallets));
}

function getActiveWallet() {
    return wallets.find(w => w.id === activeWalletId);
}

function addWallet(name, url, key) {
    const wallet = {
        id: Date.now().toString(),
        name: name.trim(),
        url: url.trim().endsWith('/') ? url.trim() : url.trim() + '/',
        key: key.trim(),
        createdAt: new Date().toISOString()
    };
    
    wallets.push(wallet);
    saveWallets();
    updateWalletSelector();
    updateWalletsList();
    
    console.log('✅ Wallet agregada:', wallet.name);
    return wallet;
}

function deleteWallet(id) {
    const wallet = wallets.find(w => w.id === id);
    if (confirm(`¿Eliminar wallet "${wallet.name}"?`)) {
        wallets = wallets.filter(w => w.id !== id);
        
        if (activeWalletId === id) {
            activeWalletId = null;
            localStorage.setItem('activeWalletId', '');
        }
        
        saveWallets();
        updateWalletSelector();
        updateWalletsList();
        updateBalance();
        
        console.log('🗑️ Wallet eliminada:', wallet.name);
    }
}

function updateWalletSelector() {
    walletSelector.innerHTML = '<option value="">-- Selecciona una wallet --</option>';
    
    wallets.forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.id;
        option.textContent = wallet.name;
        if (wallet.id === activeWalletId) {
            option.selected = true;
        }
        walletSelector.appendChild(option);
    });
    
    const hasWallet = activeWalletId && getActiveWallet();
    document.getElementById('invoiceFormFields').style.display = hasWallet ? 'block' : 'none';
    document.getElementById('noWalletMessage').style.display = hasWallet ? 'none' : 'block';
    createInvoicesBtn.disabled = !hasWallet;
}

function updateWalletsList() {
    if (wallets.length === 0) {
        walletsList.innerHTML = `
            <div class="text-center text-gray-500 py-4 bg-gray-700 rounded">
                No hay wallets configuradas
            </div>
        `;
        return;
    }
    
    walletsList.innerHTML = '';
    
    wallets.forEach(wallet => {
        const isActive = wallet.id === activeWalletId;
        const div = document.createElement('div');
        div.className = `bg-gray-700 p-4 rounded-lg ${isActive ? 'ring-2 ring-green-500' : ''}`;
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <h5 class="font-bold text-lg">${wallet.name}</h5>
                        ${isActive ? '<span class="bg-green-600 text-xs px-2 py-1 rounded">ACTIVA</span>' : ''}
                    </div>
                    <p class="text-sm text-gray-400 mb-1">🌐 ${wallet.url}</p>
                    <p class="text-sm text-gray-400 font-mono">🔑 ${wallet.key.substring(0, 20)}...</p>
                </div>
                <div class="flex gap-2">
                    ${!isActive ? `<button onclick="activateWallet('${wallet.id}')" class="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 text-sm">Activar</button>` : ''}
                    <button onclick="deleteWallet('${wallet.id}')" class="bg-red-600 px-3 py-1 rounded hover:bg-red-700 text-sm">🗑️</button>
                </div>
            </div>
        `;
        walletsList.appendChild(div);
    });
}

function activateWallet(id) {
    activeWalletId = id;
    localStorage.setItem('activeWalletId', id);
    updateWalletSelector();
    updateWalletsList();
    updateBalance();
    
    if (!activeInvoices[id]) {
        activeInvoices[id] = [];
    }
    updateInvoicesList();
    
    console.log('✅ Wallet activada:', getActiveWallet().name);
}

window.deleteWallet = deleteWallet;
window.activateWallet = activateWallet;

// ============================================
// FUNCIONES DE LA API LNBITS (sin cambios en esta sección)
// ============================================
async function fetchData(action, type, body) {
    const wallet = getActiveWallet();
    if (!wallet) throw new Error('No hay wallet activa');
    
    try {
        const response = await fetch(wallet.url + 'api/v1/' + action, {
            method: type,
            headers: {
                "X-Api-Key": wallet.key,
                "Content-Type": "application/json"
            },
            body: body ? JSON.stringify(body) : undefined
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en fetchData:', error);
        throw error;
    }
}

async function getWalletBalance() {
    try {
        const data = await fetchData('wallet', 'GET');
        return data.balance / 1000;
    } catch (error) {
        console.error('Error obteniendo balance:', error);
        return 0;
    }
}

async function createInvoice(amount, memo) {
    const response = await fetchData('payments', 'POST', {
        out: false,
        amount: amount,
        memo: memo,
        expiry: 3600
    });
    
    return response;
}

async function checkInvoiceStatus(paymentHash) {
    const wallet = getActiveWallet();
    if (!wallet) return null;
    
    try {
        const response = await fetch(`${wallet.url}api/v1/payments/${paymentHash}`, {
            headers: {
                "X-Api-Key": wallet.key
            }
        });
        
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error verificando estado:', error);
        return null;
    }
}

// ============================================
// LECTOR QR MEJORADO - NUEVA IMPLEMENTACIÓN
// ============================================

function startQRScanning() {
    if (isScanning) return;
    
    isScanning = true;
    const canvas = qrCanvas;
    const context = canvas.getContext('2d');
    
    function scan() {
        if (!isScanning) return;
        
        if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
            canvas.height = qrVideo.videoHeight;
            canvas.width = qrVideo.videoWidth;
            context.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // Usar jsQR para decodificar
            if (typeof jsQR !== 'undefined') {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                
                if (code && code.data) {
                    console.log('✅ QR detectado:', code.data);
                    handleScannedInvoice(code.data);
                    stopQRScanning();
                    return;
                }
            }
        }
        
        scanningAnimationFrame = requestAnimationFrame(scan);
    }
    
    scan();
}

function stopQRScanning() {
    isScanning = false;
    
    if (scanningAnimationFrame) {
        cancelAnimationFrame(scanningAnimationFrame);
        scanningAnimationFrame = null;
    }
    
    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
        qrStream = null;
    }
    
    qrReaderContainer.classList.add('hidden');
    startScanBtn.classList.remove('hidden');
    stopScanBtn.classList.add('hidden');
}

function handleScannedInvoice(invoice) {
    showScanStatus('✅ QR Escaneado correctamente', 'bg-green-900 text-green-300');
    
    // Limpiar invoice
    invoice = invoice.trim();
    
    // Si es una URI lightning, extraer el bolt11
    if (invoice.toLowerCase().startsWith('lightning:')) {
        invoice = invoice.substring(10);
    }
    
    // Remover espacios y saltos de línea
    invoice = invoice.replace(/\s+/g, '');
    
    manualInvoiceInput.value = invoice;
    decodeInvoice(invoice);
}

// ============================================
// DECODIFICADOR DE INVOICE MEJORADO
// ============================================

function decodeInvoice(invoice) {
    try {
        // Limpiar invoice
        invoice = invoice.trim().replace(/\s+/g, '');
        
        if (invoice.toLowerCase().startsWith('lightning:')) {
            invoice = invoice.substring(10);
        }
        
        // Convertir a minúsculas para validación
        const invoiceLower = invoice.toLowerCase();
        
        if (!invoiceLower.startsWith('lnbc') && !invoiceLower.startsWith('lntb') && !invoiceLower.startsWith('lnbcrt')) {
            throw new Error('Invoice inválido. Debe comenzar con lnbc, lntb o lnbcrt');
        }
        
        currentPaymentRequest = invoice;
        
        // Intentar decodificar con light-bolt11-decoder si está disponible
        let decoded = { amount: null, description: 'Sin descripción' };
        
        if (typeof lightBolt11Decoder !== 'undefined') {
            try {
                const decodedInvoice = lightBolt11Decoder.decode(invoice);
                console.log('📋 Invoice decodificado:', decodedInvoice);
                
                // Extraer amount en satoshis
                if (decodedInvoice.sections) {
                    const amountSection = decodedInvoice.sections.find(s => s.name === 'amount');
                    if (amountSection) {
                        decoded.amount = Math.floor(amountSection.value / 1000); // convertir de millisats a sats
                    }
                    
                    const descSection = decodedInvoice.sections.find(s => s.name === 'description');
                    if (descSection) {
                        decoded.description = descSection.value;
                    }
                }
            } catch (e) {
                console.warn('Error con decoder, usando parser básico:', e);
                decoded = parseInvoiceBasic(invoice);
            }
        } else {
            decoded = parseInvoiceBasic(invoice);
        }
        
        // Mostrar detalles
        paymentInvoice.textContent = invoice;
        paymentAmount.textContent = decoded.amount ? `${decoded.amount} SATS` : 'N/A';
        paymentDescription.textContent = decoded.description || 'Sin descripción';
        
        paymentDetails.classList.remove('hidden');
        paymentActions.classList.remove('hidden');
        updateConfirmButton();
        
        showPaymentStatus('✅ Invoice decodificado correctamente', 'bg-green-900 text-green-300');
        
    } catch (error) {
        console.error('Error decoding invoice:', error);
        showPaymentStatus('❌ Error: ' + error.message, 'bg-red-900 text-red-300');
        currentPaymentRequest = null;
        paymentDetails.classList.add('hidden');
        paymentActions.classList.add('hidden');
    }
}

function parseInvoiceBasic(invoice) {
    const result = {
        amount: null,
        description: 'Sin descripción'
    };
    
    try {
        // Intentar extraer monto del formato lnbc
        const match = invoice.match(/lnbc?rt?(\d+)([munp]?)/i);
        if (match) {
            let amount = parseInt(match[1]);
            const multiplier = match[2].toLowerCase();
            
            // Convertir a satoshis
            switch(multiplier) {
                case 'm': amount = amount * 100000; break;
                case 'u': amount = amount * 100; break;
                case 'n': amount = amount * 0.1; break;
                case 'p': amount = amount * 0.0001; break;
                default: amount = amount * 100000000; break;
            }
            
            result.amount = Math.round(amount);
        }
    } catch (error) {
        console.error('Error parsing amount:', error);
    }
    
    return result;
}

// ============================================
// REALIZAR PAGO - FUNCIÓN CORREGIDA
// ============================================

async function makePayment(walletId, bolt11) {
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) throw new Error('Wallet no encontrada');
    
    console.log('💸 Intentando pago desde:', wallet.name);
    console.log('📋 Invoice:', bolt11.substring(0, 50) + '...');
    
    try {
        const response = await fetch(wallet.url + 'api/v1/payments', {
            method: 'POST',
            headers: {
                "X-Api-Key": wallet.key,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                out: true,
                bolt11: bolt11
            })
        });
        
        const responseText = await response.text();
        console.log('📡 Respuesta del servidor:', responseText);
        
        if (!response.ok) {
            let errorMsg = `Error HTTP ${response.status}`;
            try {
                const errorData = JSON.parse(responseText);
                errorMsg = errorData.detail || errorData.message || errorMsg;
            } catch (e) {
                errorMsg = responseText || errorMsg;
            }
            throw new Error(errorMsg);
        }
        
        const result = JSON.parse(responseText);
        console.log('✅ Pago exitoso:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error en makePayment:', error);
        throw error;
    }
}

// ============================================
// FUNCIONES DE UI PARA PAGOS
// ============================================

function updatePaymentWalletSelector() {
    paymentWalletSelector.innerHTML = '<option value="">-- Selecciona una wallet --</option>';
    
    wallets.forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.id;
        option.textContent = wallet.name;
        if (wallet.id === activeWalletId) {
            option.selected = true;
            paymentWalletId = activeWalletId;
        }
        paymentWalletSelector.appendChild(option);
    });
    
    updateConfirmButton();
}

function resetPaymentForm() {
    manualInvoiceInput.value = '';
    paymentDetails.classList.add('hidden');
    paymentActions.classList.add('hidden');
    currentPaymentRequest = null;
    confirmPaymentBtn.disabled = true;
    paymentStatus.classList.add('hidden');
    scanStatus.classList.add('hidden');
}

function updateConfirmButton() {
    const hasWallet = paymentWalletId && wallets.find(w => w.id === paymentWalletId);
    const hasInvoice = currentPaymentRequest && currentPaymentRequest.length > 0;
    confirmPaymentBtn.disabled = !hasWallet || !hasInvoice;
}

function showScanStatus(message, colorClass) {
    scanStatus.textContent = message;
    scanStatus.className = `text-sm text-center p-2 rounded ${colorClass}`;
    scanStatus.classList.remove('hidden');
}

function showPaymentStatus(message, colorClass) {
    paymentStatus.textContent = message;
    paymentStatus.className = `text-sm text-center p-3 rounded ${colorClass}`;
    paymentStatus.classList.remove('hidden');
}

// ============================================
// EVENT LISTENERS PARA PAGOS
// ============================================

openPaymentBtn.addEventListener('click', () => {
    paymentModal.classList.remove('hidden');
    updatePaymentWalletSelector();
    resetPaymentForm();
});

closePaymentBtn.addEventListener('click', () => {
    stopQRScanning();
    paymentModal.classList.add('hidden');
});

paymentWalletSelector.addEventListener('change', (e) => {
    paymentWalletId = e.target.value;
    updateConfirmButton();
});

startScanBtn.addEventListener('click', async () => {
    try {
        showScanStatus('📷 Iniciando cámara...', 'bg-yellow-900 text-yellow-300');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        qrStream = stream;
        qrVideo.srcObject = stream;
        
        await qrVideo.play();
        
        qrReaderContainer.classList.remove('hidden');
        startScanBtn.classList.add('hidden');
        stopScanBtn.classList.remove('hidden');
        
        showScanStatus('✅ Cámara activa. Enfoca el código QR', 'bg-green-900 text-green-300');
        
        startQRScanning();
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        showScanStatus('❌ Error al acceder a la cámara: ' + error.message, 'bg-red-900 text-red-300');
    }
});

stopScanBtn.addEventListener('click', () => {
    stopQRScanning();
});

decodeManualBtn.addEventListener('click', () => {
    const invoice = manualInvoiceInput.value.trim();
    
    if (!invoice) {
        alert('⚠️ Pega un invoice primero');
        return;
    }
    
    decodeInvoice(invoice);
});

confirmPaymentBtn.addEventListener('click', async () => {
    if (!paymentWalletId || !currentPaymentRequest) {
        alert('⚠️ Selecciona una wallet y escanea/pega un invoice');
        return;
    }
    
    const wallet = wallets.find(w => w.id === paymentWalletId);
    if (!wallet) {
        alert('❌ Wallet no encontrada');
        return;
    }
    
    if (!confirm(`¿Confirmar pago desde "${wallet.name}"?\n\nRevisa el monto y descripción antes de confirmar.`)) {
        return;
    }
    
    try {
        confirmPaymentBtn.disabled = true;
        confirmPaymentBtn.textContent = '⏳ Procesando pago...';
        showPaymentStatus('⏳ Enviando pago...', 'bg-yellow-900 text-yellow-300');
        
        const result = await makePayment(paymentWalletId, currentPaymentRequest);
        
        showPaymentStatus('✅ ¡Pago realizado exitosamente!', 'bg-green-900 text-green-300');
        
        // Actualizar balance
        if (activeWalletId === paymentWalletId) {
            setTimeout(() => updateBalance(), 1000);
        }
        
        // Esperar 3 segundos y cerrar
        setTimeout(() => {
            paymentModal.classList.add('hidden');
            resetPaymentForm();
        }, 3000);
        
    } catch (error) {
        console.error('Error making payment:', error);
        showPaymentStatus('❌ Error al realizar el pago: ' + error.message, 'bg-red-900 text-red-300');
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.textContent = '✅ Confirmar Pago';
    }
});

// ============================================
// RESTO DEL CÓDIGO (UI, Facturas, etc.)
// Se mantiene igual que antes
// ============================================

function updateBalance() {
    if (!activeWalletId || !getActiveWallet()) {
        currentBalance.textContent = '-- SATS';
        return;
    }
    
    getWalletBalance().then(balance => {
        currentBalance.textContent = `${balance} SATS`;
    }).catch(error => {
        console.error('Error actualizando balance:', error);
        currentBalance.textContent = 'Error';
    });
}

function createQRCode(payment_request) {
    const qrDiv = document.getElementById('qrCode');
    qrDiv.innerHTML = '';
    
    if (typeof QRCode === 'undefined') {
        qrDiv.innerHTML = '<p class="text-red-500 text-sm">Error: Librería QR no cargada</p>';
        return;
    }
    
    try {
        new QRCode(qrDiv, {
            text: payment_request,
            width: 256,
            height: 256
        });
    } catch (error) {
        console.error('Error creando QR:', error);
        qrDiv.innerHTML = `<p class="text-red-500 text-sm">Error: ${error.message}</p>`;
    }
}

function showInvoiceModal(invoice) {
    currentInvoice = invoice;
    
    document.getElementById('modalStatus').textContent = invoice.paid ? '✅ PAGADA' : '⏳ PENDIENTE';
    document.getElementById('modalInvoiceNumber').textContent = `#${invoice.invoiceNumber}`;
    document.getElementById('modalAmount').textContent = `${invoice.amount} SATS`;
    document.getElementById('modalMemo').textContent = invoice.memo;
    modalNote.value = invoice.note || '';
    
    if (invoice.payment_request) {
        createQRCode(invoice.payment_request);
    } else {
        document.getElementById('qrCode').innerHTML = '<p class="text-red-500">Error: No hay código de pago</p>';
    }
    
    invoiceModal.classList.remove('hidden');
}

function filterInvoices(invoices, searchText) {
    return invoices.filter(invoice => {
        const searchLower = searchText.toLowerCase();
        const noteMatch = invoice.note ? invoice.note.toLowerCase().includes(searchLower) : false;
        return invoice.invoiceNumber.toString().includes(searchText) || 
               invoice.memo.toLowerCase().includes(searchLower) || 
               noteMatch;
    });
}

function updateInvoicesList() {
    if (!activeWalletId) {
        pendingInvoicesList.innerHTML = '<div class="text-center text-gray-500 py-8">Selecciona una wallet</div>';
        paidInvoicesList.innerHTML = '<div class="text-center text-gray-500 py-8">Selecciona una wallet</div>';
        pendingCount.textContent = '0';
        paidCount.textContent = '0';
        return;
    }
    
    const invoices = activeInvoices[activeWalletId] || [];
    const pendingSearch = searchPending.value;
    const paidSearch = searchPaid.value;

    const pendingInvoices = invoices.filter(invoice => !invoice.paid);
    const paidInvoices = invoices.filter(invoice => invoice.paid);

    const filteredPending = filterInvoices(pendingInvoices, pendingSearch);
    const filteredPaid = filterInvoices(paidInvoices, paidSearch);

    pendingCount.textContent = pendingInvoices.length;
    paidCount.textContent = paidInvoices.length;

    pendingInvoicesList.innerHTML = '';
    paidInvoicesList.innerHTML = '';

    function createInvoiceElement(invoice) {
        const element = document.createElement('div');
        element.className = 'bg-gray-700 p-3 rounded flex justify-between items-center cursor-pointer hover:bg-gray-600 transition-colors border border-gray-600 hover:border-gray-500';
        element.innerHTML = `
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-gray-400 text-xs">#${invoice.invoiceNumber}</span>
                    <p class="font-bold text-green-400">${invoice.amount} SATS</p>
                </div>
                <p class="text-sm text-gray-300">${invoice.memo}</p>
                ${invoice.note ? `<p class="text-xs text-gray-400 mt-1">📝 ${invoice.note}</p>` : ''}
            </div>
        `;
        element.onclick = () => showInvoiceModal(invoice);
        return element;
    }

    if (filteredPending.length === 0) {
        pendingInvoicesList.innerHTML = '<div class="text-center text-gray-500 py-8">No hay facturas pendientes</div>';
    } else {
        filteredPending.forEach(invoice => {
            pendingInvoicesList.appendChild(createInvoiceElement(invoice));
        });
    }

    if (filteredPaid.length === 0) {
        paidInvoicesList.innerHTML = '<div class="text-center text-gray-500 py-8">No hay facturas pagadas</div>';
    } else {
        filteredPaid.forEach(invoice => {
            paidInvoicesList.appendChild(createInvoiceElement(invoice));
        });
    }
}

function startMonitoring() {
    if (monitoringInterval) clearInterval(monitoringInterval);
    
    monitoringInterval = setInterval(async () => {
        if (!activeWalletId) return;
        
        const invoices = activeInvoices[activeWalletId] || [];
        
        for (let i = 0; i < invoices.length; i++) {
            if (!invoices[i].paid) {
                const status = await checkInvoiceStatus(invoices[i].payment_hash);
                if (status && status.paid) {
                    invoices[i].paid = true;
                    updateInvoicesList();
                    updateBalance();
                    
                    if (!invoiceModal.classList.contains('hidden') && 
                        currentInvoice?.payment_hash === invoices[i].payment_hash) {
                        document.getElementById('modalStatus').textContent = '✅ PAGADA';
                    }
                }
            }
        }
    }, 3000);
}

// ============================================
// INTEGRACIÓN CON OPENAI (sin cambios)
// ============================================
async function analyzeWithAI(userMessage) {
    showAIStatus('🤔 Analizando tu solicitud...', 'bg-yellow-900 text-yellow-300');
    
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { 
                        role: "system", 
                        content: `Eres un asistente especializado en gestión de wallets Lightning y facturas.

Puedes ayudar con:
1. Crear facturas: extraer amount_sats, memo, invoice_count
2. Cambiar wallet: detectar nombre de wallet y devolver wallet_switch
3. Configurar wallet: extraer wallet_name, wallet_url, wallet_key

Formato de respuesta:
- Para facturas: {"action": "create_invoice", "amount_sats": 1000, "memo": "Café", "invoice_count": 5}
- Para cambiar wallet: {"action": "switch_wallet", "wallet_name": "Mi Tienda"}
- Para configurar: {"action": "configure_wallet", "wallet_name": "Tienda", "wallet_url": "http://...", "wallet_key": "abc123..."}

Responde SOLO con JSON válido, sin texto adicional.`
                    },
                    { 
                        role: "user", 
                        content: userMessage 
                    }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content.trim();
        
        console.log('🤖 Respuesta de IA:', aiResponse);
        
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Formato inválido');
        
        const result = JSON.parse(jsonMatch[0]);
        
        if (result.action === 'create_invoice') {
            fillFormFromAI(result);
            showAIStatus('✅ Formulario listo. Revisa y confirma', 'bg-green-900 text-green-300');
        } else if (result.action === 'switch_wallet') {
            const wallet = wallets.find(w => 
                w.name.toLowerCase().includes(result.wallet_name.toLowerCase())
            );
            if (wallet) {
                activateWallet(wallet.id);
                showAIStatus(`✅ Cambiado a wallet: ${wallet.name}`, 'bg-green-900 text-green-300');
            } else {
                showAIStatus(`❌ Wallet "${result.wallet_name}" no encontrada`, 'bg-red-900 text-red-300');
            }
        }
        
        return result;

    } catch (error) {
        console.error('Error con OpenAI:', error);
        showAIStatus('❌ Error: ' + error.message, 'bg-red-900 text-red-300');
        throw error;
    }
}

async function analyzeConfigWithAI(userMessage) {
    showAIConfigStatus('🤔 Analizando configuración...', 'bg-yellow-900 text-yellow-300');
    
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { 
                        role: "system", 
                        content: `Extrae información de configuración de wallet Lightning Network.

Busca: wallet_name, wallet_url (con http:// o https://), wallet_key (string largo)

Ejemplos:
- "Nueva wallet 'Mi Tienda' servidor chirilicas.com puerto 5000 key abc123..." 
  → {"wallet_name": "Mi Tienda", "wallet_url": "http://chirilicas.com:5000/", "wallet_key": "abc123..."}

Responde SOLO con JSON válido.`
                    },
                    { 
                        role: "user", 
                        content: userMessage 
                    }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        const aiResponse = data.choices[0].message.content.trim();
        
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Formato inválido');
        
        const config = JSON.parse(jsonMatch[0]);
        
        if (config.wallet_name) walletName.value = config.wallet_name;
        if (config.wallet_url) walletUrl.value = config.wallet_url;
        if (config.wallet_key) walletKey.value = config.wallet_key;
        
        showAIConfigStatus('✅ Configuración extraída. Revisa y agrega', 'bg-green-900 text-green-300');
        
        return config;

    } catch (error) {
        console.error('Error con OpenAI:', error);
        showAIConfigStatus('❌ Error: ' + error.message, 'bg-red-900 text-red-300');
        throw error;
    }
}

function fillFormFromAI(data) {
    if (data.amount_sats) document.getElementById('amount').value = data.amount_sats;
    if (data.memo) document.getElementById('memo').value = data.memo;
    if (data.invoice_count) {
        const count = Math.min(Math.max(1, data.invoice_count), 50);
        document.getElementById('invoiceCount').value = count;
    }

    const form = document.getElementById('invoiceForm');
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    form.classList.add('ring-4', 'ring-green-500');
    setTimeout(() => form.classList.remove('ring-4', 'ring-green-500'), 2000);
}

function showAIStatus(message, colorClass) {
    aiStatus.textContent = message;
    aiStatus.className = `text-sm text-center p-2 rounded ${colorClass}`;
    aiStatus.classList.remove('hidden');
}

function showAIConfigStatus(message, colorClass) {
    aiConfigStatus.textContent = message;
    aiConfigStatus.className = `text-sm text-center p-2 rounded ${colorClass}`;
    aiConfigStatus.classList.remove('hidden');
}

// ============================================
// EVENT LISTENERS GENERALES
// ============================================

walletSelector.addEventListener('change', (e) => {
    if (e.target.value) {
        activateWallet(e.target.value);
    }
});

openWalletConfigBtn.addEventListener('click', () => {
    walletConfigModal.classList.remove('hidden');
});

closeWalletConfigBtn.addEventListener('click', () => {
    walletConfigModal.classList.add('hidden');
});

addWalletBtn.addEventListener('click', () => {
    const name = walletName.value.trim();
    const url = walletUrl.value.trim();
    const key = walletKey.value.trim();
    
    if (!name || !url || !key) {
        alert('⚠️ Completa todos los campos');
        return;
    }
    
    addWallet(name, url, key);
    
    walletName.value = '';
    walletUrl.value = '';
    walletKey.value = '';
    aiConfigPrompt.value = '';
    aiConfigStatus.classList.add('hidden');
    
    alert(`✅ Wallet "${name}" agregada correctamente`);
});

aiConfigBtn.addEventListener('click', async () => {
    const prompt = aiConfigPrompt.value.trim();
    
    if (!prompt) {
        alert('Escribe una solicitud para configurar');
        return;
    }

    if (OPENAI_API_KEY === 'TU_API_KEY_AQUI') {
        alert('⚠️ Configura tu API Key de OpenAI primero');
        return;
    }

    aiConfigBtn.disabled = true;
    aiConfigBtn.textContent = '⏳ Analizando...';
    
    try {
        await analyzeConfigWithAI(prompt);
    } catch (error) {
        console.error(error);
    } finally {
        aiConfigBtn.disabled = false;
        aiConfigBtn.textContent = '✨ Configurar con IA';
    }
});

analyzeBtn.addEventListener('click', async () => {
    const prompt = aiPrompt.value.trim();
    
    if (!prompt) {
        alert('Escribe una solicitud');
        return;
    }

    if (OPENAI_API_KEY === 'TU_API_KEY_AQUI') {
        alert('⚠️ Configura tu API Key de OpenAI');
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = '⏳ Analizando...';
    
    try {
        await analyzeWithAI(prompt);
    } catch (error) {
        console.error(error);
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = '✨ Analizar con IA';
    }
});

createInvoicesBtn.addEventListener('click', async () => {
    if (!activeWalletId) {
        alert('⚠️ Selecciona una wallet primero');
        return;
    }
    
    const amount = parseInt(document.getElementById('amount').value);
    const memo = document.getElementById('memo').value.trim();
    const count = parseInt(document.getElementById('invoiceCount').value);

    if (!amount || !memo || count < 1 || count > 50) {
        alert('⚠️ Completa todos los campos correctamente (máx 50)');
        return;
    }

    try {
        createInvoicesBtn.disabled = true;
        createInvoicesBtn.textContent = '⏳ Creando...';
        
        if (!activeInvoices[activeWalletId]) {
            activeInvoices[activeWalletId] = [];
        }
        
        for (let i = 0; i < count; i++) {
            const invoice = await createInvoice(amount, memo);
            activeInvoices[activeWalletId].push({
                ...invoice,
                payment_request: invoice.bolt11 || invoice.payment_request,
                memo: memo,
                amount: amount,
                invoiceNumber: invoiceCounter++,
                paid: false,
                note: ''
            });
        }
        
        updateInvoicesList();
        updateBalance();
        alert(`✅ ${count} factura(s) creada(s)`);
        
        document.getElementById('amount').value = '';
        document.getElementById('memo').value = '';
        document.getElementById('invoiceCount').value = '1';
        aiPrompt.value = '';
        aiStatus.classList.add('hidden');
        
    } catch (error) {
        console.error(error);
        alert('❌ Error al crear facturas: ' + error.message);
    } finally {
        createInvoicesBtn.disabled = false;
        createInvoicesBtn.textContent = '📝 Crear Facturas';
    }
});

closeModalBtn.addEventListener('click', () => {
    invoiceModal.classList.add('hidden');
    currentInvoice = null;
});

copyQRBtn.addEventListener('click', async () => {
    if (!currentInvoice?.payment_request) {
        alert('No hay código para copiar');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(currentInvoice.payment_request);
        copyQRBtn.textContent = '✅ ¡Copiado!';
        copyQRBtn.classList.add('bg-green-500');
        copyQRBtn.classList.remove('bg-blue-500');
        
        setTimeout(() => {
            copyQRBtn.textContent = '📋 Copiar Código';
            copyQRBtn.classList.remove('bg-green-500');
            copyQRBtn.classList.add('bg-blue-500');
        }, 2000);
    } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = currentInvoice.payment_request;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('✅ Copiado');
    }
});

saveNoteBtn.addEventListener('click', () => {
    if (currentInvoice && activeWalletId) {
        const noteText = modalNote.value.trim();
        const invoice = activeInvoices[activeWalletId].find(
            inv => inv.payment_hash === currentInvoice.payment_hash
        );
        if (invoice) {
            invoice.note = noteText;
            updateInvoicesList();
            alert('✅ Nota guardada');
        }
    }
});

searchPending.addEventListener('input', updateInvoicesList);
searchPaid.addEventListener('input', updateInvoicesList);

// ============================================
// SPLIT PAYMENT (código simplificado)
// ============================================

openSplitPaymentBtn.addEventListener('click', () => {
    splitPaymentModal.classList.remove('hidden');
    updateSplitWalletsList();
});

closeSplitPaymentBtn.addEventListener('click', () => {
    splitPaymentModal.classList.add('hidden');
});

addSplitWalletBtn.addEventListener('click', () => {
    if (wallets.length === 0) {
        alert('⚠️ No hay wallets configuradas');
        return;
    }
    
    splitWalletsConfig.push({
        id: Date.now().toString(),
        walletId: wallets[0].id,
        type: 'percentage',
        value: 50
    });
    
    updateSplitWalletsList();
});

function updateSplitWalletsList() {
    if (splitWalletsConfig.length === 0) {
        splitWalletsList.innerHTML = '<div class="text-center text-gray-400 py-4">Agrega wallets para dividir el pago</div>';
        updateSplitTotal();
        return;
    }
    
    splitWalletsList.innerHTML = '';
    
    splitWalletsConfig.forEach((split, index) => {
        const wallet = wallets.find(w => w.id === split.walletId);
        if (!wallet) return;
        
        const div = document.createElement('div');
        div.className = 'bg-gray-800 p-3 rounded flex gap-3 items-center';
        div.innerHTML = `
            <select class="bg-gray-700 text-white px-3 py-2 rounded flex-1 border border-gray-600 split-wallet-select" data-index="${index}">
                ${wallets.map(w => `<option value="${w.id}" ${w.id === split.walletId ? 'selected' : ''}>${w.name}</option>`).join('')}
            </select>
            <select class="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 split-type-select" data-index="${index}">
                <option value="percentage" ${split.type === 'percentage' ? 'selected' : ''}>Porcentaje %</option>
                <option value="fixed" ${split.type === 'fixed' ? 'selected' : ''}>Cantidad Fija</option>
            </select>
            <input type="number" class="bg-gray-700 text-white px-3 py-2 rounded w-24 border border-gray-600 split-value-input" data-index="${index}" value="${split.value}" min="0">
            <button class="bg-red-600 px-3 py-2 rounded hover:bg-red-700 split-remove-btn" data-index="${index}">🗑️</button>
        `;
        
        splitWalletsList.appendChild(div);
    });
    
    document.querySelectorAll('.split-wallet-select').forEach(select => {
        select.addEventListener('change', (e) => {
            splitWalletsConfig[parseInt(e.target.dataset.index)].walletId = e.target.value;
            updateSplitTotal();
        });
    });
    
    document.querySelectorAll('.split-type-select').forEach(select => {
        select.addEventListener('change', (e) => {
            splitWalletsConfig[parseInt(e.target.dataset.index)].type = e.target.value;
            updateSplitTotal();
        });
    });
    
    document.querySelectorAll('.split-value-input').forEach(input => {
        input.addEventListener('input', (e) => {
            splitWalletsConfig[parseInt(e.target.dataset.index)].value = parseFloat(e.target.value) || 0;
            updateSplitTotal();
        });
    });
    
    document.querySelectorAll('.split-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            splitWalletsConfig.splice(parseInt(e.target.dataset.index), 1);
            updateSplitWalletsList();
        });
    });
    
    updateSplitTotal();
}

function updateSplitTotal() {
    const totalAmount = parseFloat(splitTotalAmount.value) || 0;
    let totalAssigned = 0;
    let totalPercentage = 0;
    
    splitWalletsConfig.forEach(split => {
        if (split.type === 'percentage') {
            totalPercentage += split.value;
            totalAssigned += (totalAmount * split.value / 100);
        } else {
            totalAssigned += split.value;
        }
    });
    
    const isValid = (totalPercentage <= 100) && (totalAssigned <= totalAmount);
    
    splitTotalAssigned.textContent = `${Math.round(totalAssigned)} SATS (${Math.round(totalPercentage)}%)`;
    splitTotalAssigned.className = `font-bold ${isValid ? 'text-green-400' : 'text-red-400'}`;
    
    createSplitBtn.disabled = !isValid || splitWalletsConfig.length === 0 || totalAmount === 0;
}

splitTotalAmount.addEventListener('input', updateSplitTotal);
splitMemo.addEventListener('input', updateSplitTotal);

previewSplitBtn.addEventListener('click', () => {
    const totalAmount = parseFloat(splitTotalAmount.value) || 0;
    const memo = splitMemo.value.trim();
    const count = parseInt(splitInvoiceCount.value) || 1;
    
    if (totalAmount === 0 || !memo || splitWalletsConfig.length === 0) {
        alert('⚠️ Completa todos los campos y agrega al menos una wallet');
        return;
    }
    
    splitPreviewContent.innerHTML = '';
    
    const previewHTML = [`<div class="font-bold text-orange-400 mb-2">Se crearán ${splitWalletsConfig.length * count} facturas:</div>`];
    
    splitWalletsConfig.forEach((split) => {
        const wallet = wallets.find(w => w.id === split.walletId);
        let amount = split.type === 'percentage' ? Math.round(totalAmount * split.value / 100) : split.value;
        
        previewHTML.push(`
            <div class="bg-gray-800 p-2 rounded">
                <div class="flex justify-between">
                    <span class="text-gray-400">${wallet.name}:</span>
                    <span class="font-bold text-green-400">${amount} SATS × ${count} facturas</span>
                </div>
                <div class="text-xs text-gray-500">${split.type === 'percentage' ? split.value + '%' : 'Cantidad fija'}</div>
            </div>
        `);
    });
    
    splitPreviewContent.innerHTML = previewHTML.join('');
    splitPreview.classList.remove('hidden');
});

async function fetchDataForWallet(wallet, action, type, body) {
    try {
        const response = await fetch(wallet.url + 'api/v1/' + action, {
            method: type,
            headers: {
                "X-Api-Key": wallet.key,
                "Content-Type": "application/json"
            },
            body: body ? JSON.stringify(body) : undefined
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en fetchDataForWallet:', error);
        throw error;
    }
}

createSplitBtn.addEventListener('click', async () => {
    const totalAmount = parseFloat(splitTotalAmount.value) || 0;
    const memo = splitMemo.value.trim();
    const count = parseInt(splitInvoiceCount.value) || 1;
    
    if (!confirm(`¿Crear ${splitWalletsConfig.length * count} facturas distribuidas entre ${splitWalletsConfig.length} wallets?`)) {
        return;
    }
    
    try {
        createSplitBtn.disabled = true;
        createSplitBtn.textContent = '⏳ Creando...';
        
        let successCount = 0;
        
        for (const split of splitWalletsConfig) {
            const wallet = wallets.find(w => w.id === split.walletId);
            if (!wallet) continue;
            
            let amount = split.type === 'percentage' ? Math.round(totalAmount * split.value / 100) : split.value;
            
            for (let i = 0; i < count; i++) {
                try {
                    const invoice = await fetchDataForWallet(wallet, 'payments', 'POST', {
                        out: false,
                        amount: amount,
                        memo: `${memo} [Split ${split.type === 'percentage' ? split.value + '%' : amount + ' SATS'}]`,
                        expiry: 3600
                    });
                    
                    if (!activeInvoices[wallet.id]) {
                        activeInvoices[wallet.id] = [];
                    }
                    
                    activeInvoices[wallet.id].push({
                        ...invoice,
                        payment_request: invoice.bolt11 || invoice.payment_request,
                        memo: `${memo} [Split]`,
                        amount: amount,
                        invoiceNumber: invoiceCounter++,
                        paid: false,
                        note: `Split Payment - ${wallet.name}`
                    });
                    
                    successCount++;
                } catch (error) {
                    console.error(`Error creando factura para ${wallet.name}:`, error);
                }
            }
        }
        
        updateInvoicesList();
        updateBalance();
        
        alert(`✅ ${successCount} facturas creadas exitosamente`);
        
        splitTotalAmount.value = '';
        splitMemo.value = '';
        splitInvoiceCount.value = '1';
        splitWalletsConfig = [];
        updateSplitWalletsList();
        splitPreview.classList.add('hidden');
        
        splitPaymentModal.classList.add('hidden');
        
    } catch (error) {
        console.error('Error en split payment:', error);
        alert('❌ Error al crear split payment');
    } finally {
        createSplitBtn.disabled = false;
        createSplitBtn.textContent = '✅ Crear Split Payment';
    }
});

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Multi-Wallet Manager con IA y Split Payment iniciado');
    console.log('💼 Wallets configuradas:', wallets.length);
    console.log('📷 jsQR disponible:', typeof jsQR !== 'undefined');
    console.log('📋 QRCode disponible:', typeof QRCode !== 'undefined');
    
    updateWalletSelector();
    updateWalletsList();
    updateBalance();
    updateInvoicesList();
    startMonitoring();
    
    if (typeof jsQR === 'undefined') {
        console.error('❌ jsQR no cargado - el escáner QR no funcionará');
    }
    
    if (typeof QRCode === 'undefined') {
        console.error('❌ QRCode no cargado');
    }
});