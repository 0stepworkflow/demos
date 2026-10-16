/* Appointment request form (FormSubmit AJAX). Independent of main.js. */
(function () {
  'use strict';

  var form = document.getElementById('request-form');
  if (!form) return;

  var panel = document.getElementById('request-panel');
  var success = document.getElementById('request-success');
  var successText = document.getElementById('request-success-text');
  var again = document.getElementById('request-again');
  var submitBtn = document.getElementById('request-submit');
  var statusEl = document.getElementById('request-status');
  var originalLabel = submitBtn ? submitBtn.textContent : 'Send request';
  var RED = 'border-red-600';
  var touched = {};

  function $(id) { return document.getElementById(id); }
  function val(id) { var el = $(id); return el ? el.value.replace(/^\s+|\s+$/g, '') : ''; }
  function checkedValue(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  // Each field: id (control or fieldset), error id, check() returns message or ''
  var fields = [
    { id: 'rf-name', check: function () { return val('rf-name') ? '' : 'Enter your name.'; } },
    { id: 'rf-phone', check: function () {
        var v = val('rf-phone');
        if (!v) return 'Enter your phone number.';
        var d = v.replace(/\D/g, '').length;
        return (d < 10 || d > 15) ? 'Enter a 10-digit phone number.' : '';
      } },
    { id: 'rf-email', check: function () {
        var v = val('rf-email');
        if (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Enter a valid email, like name@example.com.';
        }
        return checkedValue('contact_method') === 'Email' ? 'Add your email, or pick Call or Text.' : '';
      } },
    { id: 'rf-contact-method', group: true, check: function () { return ''; } },
    { id: 'rf-dog', check: function () { return val('rf-dog') ? '' : 'Enter your dog’s name.'; } },
    { id: 'rf-breed', check: function () { return val('rf-breed') ? '' : 'Enter the breed (or "mix").'; } },
    { id: 'rf-size', group: true, check: function () { return checkedValue('size') ? '' : 'Pick a size.'; } }
  ];

  function errEl(f) { return $(f.id + '-error'); }

  function setError(f, msg) {
    var el = $(f.id), p = errEl(f);
    if (!el || !p) return;
    if (msg) {
      p.textContent = msg;
      el.setAttribute('aria-invalid', 'true');
      if (!f.group) el.classList.add(RED);
    } else {
      p.textContent = '';
      el.removeAttribute('aria-invalid');
      if (!f.group) el.classList.remove(RED);
    }
  }

  function validateField(f) {
    var msg = f.check();
    setError(f, msg);
    return !msg;
  }

  function firstFocusable(f) {
    var el = $(f.id);
    if (!el) return null;
    if (f.group) return el.querySelector('input[type="radio"]');
    return el;
  }

  function validateAll() {
    var firstBad = null, i, ok;
    for (i = 0; i < fields.length; i++) {
      ok = validateField(fields[i]);
      touched[fields[i].id] = true;
      if (!ok && !firstBad) firstBad = fields[i];
    }
    return firstBad;
  }

  function setStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    if (isError) statusEl.classList.add('text-red-700');
    else statusEl.classList.remove('text-red-700');
  }

  fields.forEach(function (f) {
    var el = $(f.id);
    if (!el) return;
    if (f.group) {
      var radios = el.querySelectorAll('input[type="radio"]');
      Array.prototype.forEach.call(radios, function (r) {
        r.addEventListener('change', function () {
          touched[f.id] = true;
          setError(f, '');
          setStatus('', false);
          // contact method change can affect the email requirement
          if (f.id === 'rf-contact-method' && touched['rf-email']) validateField(fields[2]);
        });
      });
    } else {
      el.addEventListener('blur', function () {
        touched[f.id] = true;
        validateField(f);
      });
      el.addEventListener('input', function () {
        setError(f, '');
        setStatus('', false);
        if (f.id === 'rf-email') touched[f.id] = touched[f.id] || false;
      });
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitBtn && submitBtn.disabled) return;

    var firstBad = validateAll();
    if (firstBad) {
      setStatus('Fix the highlighted fields and try again.', true);
      var target = firstFocusable(firstBad);
      if (target && target.focus) target.focus();
      return;
    }
    setStatus('', false);

    var honey = form.querySelector('input[name="_honey"]');
    if (honey && honey.value) {
      showSuccess();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    setStatus('', false);

    var name = val('rf-name');
    var dog = val('rf-dog');

    fetch(form.action, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        var flag = data ? data.success : undefined;
        var okFlag = !!flag && flag !== 'false';
        if (res.ok && okFlag) {
          showSuccess(name, dog);
        } else {
          fail();
        }
      });
    }).catch(fail);
  });

  function fail() {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
    setStatus('Couldn’t send your request. Try again, or call (832) 433-5378.', true);
  }

  function showSuccess(name, dog) {
    if (successText) {
      successText.textContent = (name && dog)
        ? 'Thanks, ' + name + '! We’ll reach out soon to confirm ' + dog + '’s visit.'
        : 'Thanks! We’ll reach out soon to confirm your visit.';
    }
    form.reset();
    touched = {};
    fields.forEach(function (f) { setError(f, ''); });
    setStatus('', false);
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
    var h = panel ? panel.offsetHeight : 0;
    if (panel) panel.classList.add('hidden');
    if (success) {
      success.style.minHeight = h ? h + 'px' : '';
      success.style.display = 'flex';
      success.style.flexDirection = 'column';
      success.style.justifyContent = 'center';
      success.style.alignItems = 'center';
      success.classList.remove('hidden');
      success.focus();
    }
  }

  if (again) {
    again.addEventListener('click', function () {
      if (success) {
        success.classList.add('hidden');
        success.style.minHeight = '';
        success.style.display = '';
      }
      if (panel) panel.classList.remove('hidden');
      var first = $('rf-name');
      if (first) first.focus();
    });
  }
})();
