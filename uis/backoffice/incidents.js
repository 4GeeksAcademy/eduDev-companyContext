import { protectedFetch } from './auth.js';
import { guardSession } from './session-guard.js';

export const enums = {
  status: ['open', 'in_progress', 'resolved', 'discarded'],
  origin: ['customer', 'branch', 'internal'],
  branch: ['central', 'la_warehouse', 'la_office', 'zaragoza_warehouse', 'zaragoza_office'],
  category: ['lost_parcel', 'delivery_failure', 'inventory_discrepancy', 'carrier_issue', 'returns_issue', 'warehouse_incident', 'system_failure', 'client_complaint', 'other'],
};
const fields = ['title', 'description', 'category', 'status', 'origin', 'branch'];
const branchLabels = ['Central', 'Los Angeles — Warehouse', 'Los Angeles — Office', 'Zaragoza — Warehouse', 'Zaragoza — Office'];
export const label = value => branchLabels[enums.branch.indexOf(value)] ?? String(value).replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
export const branchHighlighted = origin => origin === 'branch';
export const renderText = (node, value) => { node.textContent = String(value ?? ''); return node; };
export function validate(values) {
  const errors = {};
  for (const field of fields) {
    if (typeof values[field] !== 'string' || !values[field].trim()) errors[field] = `${label(field)} is required.`;
    else if (enums[field] && !enums[field].includes(values[field])) errors[field] = `Select a valid ${field}.`;
  }
  return errors;
}
export function nextStatuses(status) {
  return [status, ...({ open: ['in_progress', 'discarded'], in_progress: ['resolved', 'discarded'] }[status] ?? [])];
}
export function queryFor(filters = {}) {
  const query = new URLSearchParams();
  for (const key of ['status', 'origin', 'branch', 'category']) {
    if (enums[key].includes(filters[key])) query.set(key, filters[key]);
  }
  return query.size ? `?${query}` : '';
}

// Small controller seam: requests and UI notifications are injected, not a simulated DOM.
export function createController(fetcher, notify) {
  let saving = false, listVersion = 0, summaryVersion = 0, filters = {};
  const updating = new Set();
  async function request(path, options) {
    const response = await fetcher(path, options);
    if (!response.ok) {
      const error = { fields: {} };
      if (response.status === 400) {
        try {
          const body = await response.json();
          for (const field of fields) {
            if (Object.hasOwn(body.errors ?? {}, field)) error.fields[field] = `Check ${label(field).toLowerCase()} and try again.`;
          }
        } catch { /* Never expose response text, even when JSON is malformed. */ }
      }
      throw error;
    }
    return response.json();
  }
  const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const api = {
    async submit(values) {
      if (saving) return;
      const errors = validate(values);
      notify('formErrors', errors);
      if (Object.keys(errors).length) return;
      saving = true; notify('saving', true);
      try {
        await request('/api/incidents', json('POST', Object.fromEntries(fields.map(key => [key, values[key]]))));
        notify('reset');
        void api.loadList(filters); void api.loadSummary();
      } catch (error) {
        notify('formError', { message: 'Unable to register the incident. Check the fields and retry.', fields: error?.fields ?? {} });
      } finally { saving = false; notify('saving', false); }
    },
    async loadList(current = filters) {
      filters = { ...current };
      const version = ++listVersion;
      notify('listLoading');
      try {
        const records = await request(`/api/incidents${queryFor(filters)}`);
        if (!Array.isArray(records)) throw Error();
        if (version === listVersion) notify('list', records);
      } catch { if (version === listVersion) notify('listError'); }
    },
    async loadSummary() {
      const version = ++summaryVersion;
      notify('summaryLoading');
      try {
        const summary = await request('/api/incidents/summary');
        if (!summary || typeof summary !== 'object' || Array.isArray(summary)) throw Error();
        if (version === summaryVersion) notify('summary', summary);
      } catch { if (version === summaryVersion) notify('summaryError'); }
    },
    async update(record, status) {
      if (updating.has(record.id) || status === record.status || !nextStatuses(record.status).includes(status)) return;
      updating.add(record.id); notify('rowSaving', { id: record.id });
      try {
        await request(`/api/incidents/${encodeURIComponent(record.id)}/status`, json('PATCH', { status }));
        void api.loadList(filters); void api.loadSummary();
      } catch { notify('rowError', { id: record.id, status: record.status }); }
      finally { updating.delete(record.id); notify('rowDone', { id: record.id }); }
    },
  };
  return api;
}

export function initialize() {
  const get = id => document.getElementById(id);
  const element = (tag, text) => renderText(document.createElement(tag), text);
  const form = get('incident-form');
  const controls = Object.fromEntries(fields.map(key => [key, form.elements.namedItem(key)]));
  const rowControls = new Map();
  function options(select, key, prompt) {
    select.append(new Option(prompt, ''));
    for (const value of enums[key]) select.append(new Option(label(value), value));
  }
  for (const key of Object.keys(enums)) {
    options(controls[key], key, `Select ${key}`);
    options(get(`filter-${key}`), key, `All ${key === 'status' ? 'statuses' : key === 'category' ? 'categories' : key === 'branch' ? 'branches' : 'origins'}`);
  }
  controls.status.value = 'open';
  function highlight() {
    get('branch-field').classList.toggle('branch-highlight', branchHighlighted(controls.origin.value));
    get('branch-hint').textContent = branchHighlighted(controls.origin.value)
      ? 'Branch-origin incident: select the reporting warehouse or office. Branch is required.'
      : 'Select the responsible location, including Central. Branch is always required.';
  }
  function fieldErrors(errors) {
    for (const key of fields) {
      controls[key].setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
      renderText(get(`${key}-error`), errors[key] ?? '');
    }
  }
  const filterValues = () => Object.fromEntries(Object.keys(enums).map(key => [key, get(`filter-${key}`).value]));
  function renderRows(records) {
    const container = get('incident-list'); container.replaceChildren(); rowControls.clear();
    renderText(get('list-state'), records.length ? `${records.length} incidents.` : queryFor(filterValues()) ? 'No incidents match these filters.' : 'No incidents registered yet.');
    for (const record of records) {
      const card = element('article', ''); card.className = 'incident-card';
      card.append(element('h3', record.title));
      const facts = element('dl', '');
      for (const key of ['category', 'origin', 'branch', 'status', 'created_at', 'updated_at']) {
        facts.append(element('dt', label(key)), element('dd', enums[key] ? label(record[key]) : record[key]));
      }
      const details = element('details', ''); details.append(element('summary', 'Description and generated ID'), element('p', record.description), element('p', `ID: ${record.id}`));
      card.append(facts, details);
      const allowed = nextStatuses(record.status);
      if (allowed.length > 1) {
        const select = element('select', ''); select.setAttribute('aria-label', `Update status for ${record.title}`);
        for (const status of allowed) select.append(new Option(label(status), status));
        select.value = record.status;
        const state = element('p', ''); state.setAttribute('role', 'status');
        select.addEventListener('change', () => { void controller.update(record, select.value); });
        rowControls.set(record.id, { select, state });
        card.append(select, state);
      } else card.append(element('p', 'Terminal status — read-only.'));
      container.append(card);
    }
  }
  function renderSummary(data) {
    const container = get('summary-content'); container.replaceChildren();
    const count = value => Number.isFinite(value) && value >= 0 ? value : 0;
    container.append(element('p', `Total incidents: ${count(data.total)}`));
    for (const key of ['status', 'category', 'origin', 'branch']) {
      const card = element('div', ''); card.className = 'summary-card'; card.append(element('h3', `By ${key}`));
      const list = element('dl', '');
      for (const value of enums[key]) list.append(element('dt', label(value)), element('dd', count(data[`by_${key}`]?.[value])));
      card.append(list); container.append(card);
    }
  }
  const controller = createController(protectedFetch, (type, data) => {
    switch (type) {
      case 'saving': get('submit-incident').disabled = data; renderText(get('form-state'), data ? 'Registering incident…' : get('form-state').textContent); break;
      case 'formErrors': fieldErrors(data); renderText(get('form-state'), Object.keys(data).length ? 'Check the highlighted fields.' : ''); if (Object.keys(data).length) controls[Object.keys(data)[0]].focus(); break;
      case 'formError': fieldErrors(data.fields); renderText(get('form-state'), data.message); break;
      case 'reset': form.reset(); controls.status.value = 'open'; fieldErrors({}); highlight(); renderText(get('form-state'), 'Incident registered successfully.'); break;
      case 'listLoading': get('incident-list').replaceChildren(); get('list-retry').hidden = true; renderText(get('list-state'), 'Loading incidents…'); break;
      case 'list': renderRows(data); break;
      case 'listError': renderText(get('list-state'), 'Unable to load incidents. Please retry.'); get('list-retry').hidden = false; break;
      case 'summaryLoading': get('summary-content').replaceChildren(); get('summary-retry').hidden = true; renderText(get('summary-state'), 'Loading summary…'); break;
      case 'summary': renderText(get('summary-state'), 'All incidents, independent of list filters.'); renderSummary(data); break;
      case 'summaryError': renderText(get('summary-state'), 'Unable to load summary. Please retry.'); get('summary-retry').hidden = false; break;
      case 'rowSaving': { const row = rowControls.get(data.id); if (row) { row.select.disabled = true; renderText(row.state, 'Updating status…'); } break; }
      case 'rowError': { const row = rowControls.get(data.id); if (row) { row.select.value = data.status; renderText(row.state, 'Unable to update status. Previous status restored. Retry your selection.'); } break; }
      case 'rowDone': { const row = rowControls.get(data.id); if (row) row.select.disabled = false; break; }
    }
  });
  controls.origin.addEventListener('change', highlight); highlight();
  form.addEventListener('submit', event => { event.preventDefault(); void controller.submit(Object.fromEntries(fields.map(key => [key, controls[key].value]))); });
  for (const key of Object.keys(enums)) get(`filter-${key}`).addEventListener('change', () => { void controller.loadList(filterValues()); });
  get('list-retry').addEventListener('click', () => { void controller.loadList(filterValues()); });
  get('summary-retry').addEventListener('click', () => { void controller.loadSummary(); });
  void controller.loadList(); void controller.loadSummary();
}
if (typeof document !== 'undefined') guardSession(initialize);
