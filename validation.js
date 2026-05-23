document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lead-form');
  const formContainer = document.getElementById('form-container');
  const successContainer = document.getElementById('success-container');
  const commentsField = document.getElementById('comments');
  const charCount = document.getElementById('char-count');
  const volumeSelect = document.getElementById('volume');
  const productSelect = document.getElementById('product_type');
  const warningBanner = document.getElementById('volume-warning');
  const resetBtn = document.getElementById('btn-reset');

  // ── Helper: show error on a field ──────────────────────────────────
  function showError(fieldId, message) {
    const errorEl = document.getElementById('error-' + fieldId);
    if (errorEl) {
      errorEl.textContent = message;
    }
    // For groups (services, current_3pl) the field itself may not exist;
    // set aria-invalid on the actual input or group container.
    const field = document.getElementById(fieldId);
    if (field) {
      field.setAttribute('aria-invalid', 'true');
    } else {
      // Try group container
      const group = document.getElementById(fieldId + '-group') ||
                    document.getElementById(fieldId.replace('_', '-') + '-group');
      if (group) {
        group.setAttribute('aria-invalid', 'true');
      }
    }
  }

  // ── Helper: clear error on a field ─────────────────────────────────
  function clearError(fieldId) {
    const errorEl = document.getElementById('error-' + fieldId);
    if (errorEl) {
      errorEl.textContent = '';
    }
    const field = document.getElementById(fieldId);
    if (field) {
      field.removeAttribute('aria-invalid');
    } else {
      const group = document.getElementById(fieldId + '-group') ||
                    document.getElementById(fieldId.replace('_', '-') + '-group');
      if (group) {
        group.removeAttribute('aria-invalid');
      }
    }
  }

  // ── Individual field validators ────────────────────────────────────
  function validateCompany() {
    const val = document.getElementById('company').value.trim();
    if (val.length < 2) {
      showError('company', 'El nombre de la empresa debe tener al menos 2 caracteres');
      return false;
    }
    clearError('company');
    return true;
  }

  function validateContact() {
    const val = document.getElementById('contact').value.trim();
    const words = val.split(/\s+/).filter(w => w.length > 0);
    if (words.length < 2) {
      showError('contact', 'Ingresa nombre y apellido del contacto');
      return false;
    }
    clearError('contact');
    return true;
  }

  function validateEmail() {
    const val = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      showError('email', 'Ingresa un email corporativo válido (ejemplo: <nombre@empresa.com>)');
      return false;
    }
    clearError('email');
    return true;
  }

  function validatePhone() {
    const val = document.getElementById('phone').value.trim();
    const phoneRegex = /^\+\d{1,3}\s[\d\s().-]{6,20}$/;
    const digits = val.replace(/\D/g, '');

    if (!phoneRegex.test(val) || digits.length < 7) {
      showError('phone', 'El teléfono debe incluir código de país (ejemplo: +1 213 555 0147)');
      return false;
    }
    clearError('phone');
    return true;
  }

  function validateWebsite() {
    const val = document.getElementById('website').value.trim();
    if (val) {
      try {
        const url = new URL(val);
        const hasValidProtocol = url.protocol === 'http:' || url.protocol === 'https:';
        const hasValidHostname = url.hostname.includes('.');

        if (!hasValidProtocol || !hasValidHostname) {
          throw new Error('Invalid website URL');
        }
      } catch (error) {
        showError('website', 'Si incluyes sitio web, debe ser una URL válida');
        return false;
      }
    }
    clearError('website');
    return true;
  }

  function validateCountry() {
    const val = document.getElementById('country').value;
    if (!val) {
      showError('country', 'Selecciona el país de operación principal');
      return false;
    }
    clearError('country');
    return true;
  }

  function validateProductType() {
    const val = document.getElementById('product_type').value;
    if (!val) {
      showError('product_type', 'Selecciona el tipo de producto que manejas');
      return false;
    }
    clearError('product_type');
    return true;
  }

  function validateVolume() {
    const val = document.getElementById('volume').value;
    if (!val) {
      showError('volume', 'Selecciona el volumen mensual estimado');
      return false;
    }
    clearError('volume');
    return true;
  }

  function validateServices() {
    const checked = document.querySelectorAll('input[name="services"]:checked');
    if (checked.length === 0) {
      showError('services', 'Selecciona al menos un servicio de interés');
      return false;
    }
    clearError('services');
    return true;
  }

  function validateCurrent3pl() {
    const checked = document.querySelector('input[name="current_3pl"]:checked');
    if (!checked) {
      showError('current_3pl', 'Indica si actualmente trabajas con otro proveedor logístico');
      return false;
    }
    clearError('current_3pl');
    return true;
  }

  function validateComments() {
    const val = document.getElementById('comments').value;
    if (val.length > 500) {
      const remaining = 500 - val.length;
      showError('comments', 'Los comentarios no pueden exceder 500 caracteres (quedan ' + remaining + ')');
      return false;
    }
    clearError('comments');
    return true;
  }

  function validatePrivacy() {
    const checked = document.getElementById('privacy').checked;
    if (!checked) {
      showError('privacy', 'Debes aceptar la política de privacidad para continuar');
      return false;
    }
    clearError('privacy');
    return true;
  }

  // ── Validate all fields (used on submit) ───────────────────────────
  function validateAll() {
    const results = [
      validateCompany(),
      validateContact(),
      validateEmail(),
      validatePhone(),
      validateWebsite(),
      validateCountry(),
      validateProductType(),
      validateVolume(),
      validateServices(),
      validateCurrent3pl(),
      validateComments(),
      validatePrivacy()
    ];
    return results.every(Boolean);
  }

  // ── Blur event listeners for real-time validation ──────────────────
  document.getElementById('company').addEventListener('blur', validateCompany);
  document.getElementById('contact').addEventListener('blur', validateContact);
  document.getElementById('email').addEventListener('blur', validateEmail);
  document.getElementById('phone').addEventListener('blur', validatePhone);
  document.getElementById('website').addEventListener('blur', validateWebsite);
  document.getElementById('country').addEventListener('change', validateCountry);
  document.getElementById('product_type').addEventListener('change', validateProductType);
  document.getElementById('volume').addEventListener('change', validateVolume);

  // Services checkboxes: validate on change
  document.querySelectorAll('input[name="services"]').forEach(cb => {
    cb.addEventListener('change', validateServices);
  });

  // Current 3PL radios: validate on change
  document.querySelectorAll('input[name="current_3pl"]').forEach(rb => {
    rb.addEventListener('change', validateCurrent3pl);
  });

  document.getElementById('privacy').addEventListener('change', validatePrivacy);

  // ── Comments character counter ─────────────────────────────────────
  function updateCharCounter() {
    const len = commentsField.value.length;
    charCount.textContent = len + '/500';
    if (len > 450) {
      charCount.classList.add('text-red-600');
      charCount.classList.remove('text-outline');
    } else {
      charCount.classList.remove('text-red-600');
      charCount.classList.add('text-outline');
    }
  }

  commentsField.addEventListener('input', () => {
    updateCharCounter();
    validateComments();
  });

  // ── Low-volume warning toggle ──────────────────────────────────────
  function toggleVolumeWarning() {
    if (volumeSelect.value === '0-100' && productSelect.value !== '') {
      warningBanner.classList.remove('hidden');
      warningBanner.classList.add('flex');
    } else {
      warningBanner.classList.add('hidden');
      warningBanner.classList.remove('flex');
    }
  }

  volumeSelect.addEventListener('change', toggleVolumeWarning);
  productSelect.addEventListener('change', toggleVolumeWarning);

  // ── Form submit handler ────────────────────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateAll()) {
      // Scroll to first error
      const firstError = document.querySelector('.error-msg:not(:empty)');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // All valid: hide form, show success
    formContainer.classList.add('hidden');
    successContainer.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Reset handler ──────────────────────────────────────────────────
  resetBtn.addEventListener('click', () => {
    form.reset();

    // Clear all errors
    document.querySelectorAll('.error-msg').forEach(el => {
      el.textContent = '';
    });
    document.querySelectorAll('[aria-invalid]').forEach(el => {
      el.removeAttribute('aria-invalid');
    });

    // Hide warning
    warningBanner.classList.add('hidden');
    warningBanner.classList.remove('flex');

    // Reset counter
    charCount.textContent = '0/500';
    charCount.classList.remove('text-red-600');
    charCount.classList.add('text-outline');
  });
});
