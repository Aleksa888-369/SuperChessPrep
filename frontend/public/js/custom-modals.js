// ============================================
// CUSTOM MODALS - Alert & Confirm Functions
// ============================================

// Create modal overlay if it doesn't exist
function ensureModalOverlay() {
  let overlay = document.getElementById('customModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'customModalOverlay';
    overlay.className = 'custom-modal-overlay';
    document.body.appendChild(overlay);
  }
  return overlay;
}

// Custom Alert
function customAlert(message, title = 'Information', type = 'info') {
  return new Promise((resolve) => {
    const overlay = ensureModalOverlay();
    
    const iconMap = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    const icon = iconMap[type] || iconMap.info;
    
    // Clean previous content and remove all event listeners
    const newOverlay = overlay.cloneNode(false);
    overlay.parentNode.replaceChild(newOverlay, overlay);
    const cleanOverlay = newOverlay;
    
    cleanOverlay.innerHTML = `
      <div class="custom-modal-box ${type}">
        <div class="custom-modal-header">
          <span class="custom-modal-icon">${icon}</span>
          <h2 class="custom-modal-title">${title}</h2>
        </div>
        <div class="custom-modal-content">
          ${message}
        </div>
        <div class="custom-modal-footer">
          <button class="custom-modal-btn custom-modal-btn-ok">OK</button>
        </div>
      </div>
    `;
    
    cleanOverlay.classList.add('active');
    
    const closeModal = () => {
      cleanOverlay.classList.remove('active');
      setTimeout(() => {
        cleanOverlay.innerHTML = '';
      }, 300);
      resolve(true);
    };
    
    // Handle button click
    const okBtn = cleanOverlay.querySelector('.custom-modal-btn-ok');
    okBtn.addEventListener('click', closeModal, { once: true });
    
    // Handle overlay click
    cleanOverlay.addEventListener('click', (e) => {
      if (e.target === cleanOverlay) {
        closeModal();
      }
    }, { once: true });
    
    // Handle ESC key
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
    
    // Focus OK button
    setTimeout(() => okBtn.focus(), 100);
  });
}

// Custom Confirm
function customConfirm(message, title = 'Confirmation', options = {}) {
  return new Promise((resolve) => {
    const overlay = ensureModalOverlay();
    
    const {
      confirmText = 'OK',
      cancelText = 'Cancel',
      type = 'warning'
    } = options;
    
    // Clean previous content and remove all event listeners
    const newOverlay = overlay.cloneNode(false);
    overlay.parentNode.replaceChild(newOverlay, overlay);
    const cleanOverlay = newOverlay;
    
    cleanOverlay.innerHTML = `
      <div class="custom-modal-box ${type}">
        <div class="custom-modal-header">
          <span class="custom-modal-icon">⚠️</span>
          <h2 class="custom-modal-title">${title}</h2>
        </div>
        <div class="custom-modal-content">
          ${message}
        </div>
        <div class="custom-modal-footer">
          <button class="custom-modal-btn custom-modal-btn-cancel">${cancelText}</button>
          <button class="custom-modal-btn custom-modal-btn-confirm">${confirmText}</button>
        </div>
      </div>
    `;
    
    cleanOverlay.classList.add('active');
    
    const closeModal = (result) => {
      cleanOverlay.classList.remove('active');
      setTimeout(() => {
        cleanOverlay.innerHTML = '';
      }, 300);
      // Remove ESC handler
      document.removeEventListener('keydown', handleEsc);
      resolve(result);
    };
    
    // Handle buttons
    const cancelBtn = cleanOverlay.querySelector('.custom-modal-btn-cancel');
    const confirmBtn = cleanOverlay.querySelector('.custom-modal-btn-confirm');
    
    cancelBtn.addEventListener('click', () => closeModal(false), { once: true });
    confirmBtn.addEventListener('click', () => closeModal(true), { once: true });
    
    // Handle overlay click
    cleanOverlay.addEventListener('click', (e) => {
      if (e.target === cleanOverlay) {
        closeModal(false);
      }
    }, { once: true });
    
    // Handle ESC key
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeModal(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    
    // Focus confirm button
    setTimeout(() => confirmBtn.focus(), 100);
  });
}

// Success Alert
function showSuccess(message, title = 'Success') {
  return customAlert(message, title, 'success');
}

// Error Alert
function showError(message, title = 'Error') {
  return customAlert(message, title, 'error');
}

// Warning Alert
function showWarning(message, title = 'Warning') {
  return customAlert(message, title, 'warning');
}

// Confirm Delete
function confirmDelete(itemName = 'this item') {
  return customConfirm(
    `Are you sure you want to delete ${itemName}?<br><br><strong>This action cannot be undone.</strong>`,
    'Delete Confirmation',
    {
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning'
    }
  );
}

// Confirm Close
function confirmClose(itemName = 'this topic') {
  return customConfirm(
    `Are you sure you want to close ${itemName}?`,
    'Close Confirmation',
    {
      confirmText: 'Close',
      cancelText: 'Cancel',
      type: 'warning'
    }
  );
}

// Confirm Open
function confirmOpen(itemName = 'this topic') {
  return customConfirm(
    `Are you sure you want to reopen ${itemName}?`,
    'Reopen Confirmation',
    {
      confirmText: 'Reopen',
      cancelText: 'Cancel',
      type: 'info'
    }
  );
}