const categories = [
  "carrier_last_mile",
  "carrier_international",
  "warehouse_supplies",
  "packaging_materials",
  "reverse_logistics",
  "fleet_maintenance",
  "it_and_wms_software",
  "cleaning_and_facilities",
];

const requestedApiPort = new URLSearchParams(window.location.search).get("apiPort");
const parsedApiPort = requestedApiPort !== null && /^\d+$/.test(requestedApiPort)
  ? Number(requestedApiPort)
  : 0;
const apiPort = parsedApiPort >= 1 && parsedApiPort <= 65535 ? parsedApiPort : 8000;
const apiBaseUrl = (
  window.TRACKFLOW_API_BASE_URL
  ?? `${window.location.protocol === "http:" || window.location.protocol === "https:" ? window.location.protocol : "http:"}//${window.location.hostname || "localhost"}:${apiPort}`
).replace(/\/$/, "");

const rows = document.querySelector("#supplier-rows");
const directoryState = document.querySelector("#directory-state");
const countryFilter = document.querySelector("#country-filter");
const categoryFilter = document.querySelector("#category-filter");
const form = document.querySelector("#supplier-form");
const formState = document.querySelector("#form-state");

for (const category of categories) {
  const option = document.createElement("option");
  option.value = category;
  option.textContent = formatLabel(category);
  categoryFilter.append(option);

  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = "categories";
  checkbox.value = category;
  label.append(checkbox, document.createTextNode(formatLabel(category)));
  document.querySelector("#category-options").append(label);
}

countryFilter.addEventListener("change", loadSuppliers);
categoryFilter.addEventListener("change", loadSuppliers);
form.addEventListener("submit", createSupplier);

async function loadSuppliers() {
  const parameters = new URLSearchParams();
  if (countryFilter.value) parameters.set("country", countryFilter.value);
  if (categoryFilter.value) parameters.set("category", categoryFilter.value);
  setState(directoryState, "Loading suppliers…");
  try {
    const suppliers = await request(`/suppliers${parameters.size ? `?${parameters}` : ""}`);
    renderSuppliers(suppliers);
    setState(directoryState, `${suppliers.length} supplier${suppliers.length === 1 ? "" : "s"} shown.`);
  } catch (error) {
    rows.replaceChildren();
    setState(directoryState, errorMessage(error), true);
  }
}

async function createSupplier(event) {
  event.preventDefault();
  const selectedCategories = [...form.querySelectorAll('input[name="categories"]:checked')]
    .map((checkbox) => checkbox.value);
  if (selectedCategories.length === 0) {
    setState(formState, "Select at least one category.", true);
    return;
  }

  const data = new FormData(form);
  const optionalValue = (name) => data.get(name).trim() || null;
  const payload = {
    name: data.get("name").trim(),
    country: data.get("country"),
    categories: selectedCategories,
    rate_per_shipment: Number(data.get("rate_per_shipment")),
    currency: data.get("currency"),
    status: data.get("status"),
    service_zone: optionalValue("service_zone"),
    contact_email: optionalValue("contact_email"),
    notes: optionalValue("notes"),
  };

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setState(formState, "Registering supplier…");
  try {
    await request("/suppliers", { method: "POST", body: JSON.stringify(payload) });
    form.reset();
    setState(formState, "Supplier registered successfully.");
    await loadSuppliers();
  } catch (error) {
    setState(formState, errorMessage(error), true);
  } finally {
    button.disabled = false;
  }
}

function renderSuppliers(suppliers) {
  rows.replaceChildren();
  if (suppliers.length === 0) {
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "supplier-empty";
    cell.textContent = "No suppliers match the selected filters.";
    const row = document.createElement("tr");
    row.append(cell);
    rows.append(row);
    return;
  }
  for (const supplier of suppliers) rows.append(supplierRow(supplier));
}

function supplierRow(supplier) {
  const row = document.createElement("tr");
  if (supplier.status === "suspended") row.className = "supplier-suspended";
  row.append(
    textCell(supplier.name, "Supplier", true),
    textCell(supplier.country, "Country"),
    textCell(supplier.categories.map(formatLabel).join(", "), "Categories"),
  );

  const rateCell = document.createElement("td");
  rateCell.dataset.label = "Rate";
  const rateForm = document.createElement("form");
  rateForm.className = "inline-rate-form";
  const rateInput = document.createElement("input");
  rateInput.type = "number";
  rateInput.min = "0.01";
  rateInput.step = "0.01";
  rateInput.required = true;
  rateInput.value = String(supplier.rate_per_shipment);
  rateInput.setAttribute("aria-label", `Rate for ${supplier.name}`);
  const currency = document.createElement("span");
  currency.textContent = supplier.currency;
  const rateButton = actionButton("Save rate");
  rateForm.append(rateInput, currency, rateButton);
  rateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    rateButton.disabled = true;
    try {
      const updated = await request(`/suppliers/${supplier.id}/rate`, {
        method: "PATCH",
        body: JSON.stringify({ rate_per_shipment: Number(rateInput.value) }),
      });
      rateInput.value = String(updated.rate_per_shipment);
      setState(directoryState, `${supplier.name}'s rate was updated.`);
    } catch (error) {
      setState(directoryState, errorMessage(error), true);
    } finally {
      rateButton.disabled = false;
    }
  });
  rateCell.append(rateForm);

  const statusCell = document.createElement("td");
  statusCell.dataset.label = "Status";
  const badge = document.createElement("span");
  badge.className = `badge badge-${supplier.status}`;
  badge.textContent = formatLabel(supplier.status);
  statusCell.append(badge);

  const actionsCell = document.createElement("td");
  actionsCell.dataset.label = "Actions";
  const nextStatus = supplier.status === "active" ? "suspended" : "active";
  const statusButton = actionButton(nextStatus === "active" ? "Activate" : "Suspend");
  statusButton.addEventListener("click", async () => {
    statusButton.disabled = true;
    try {
      await request(`/suppliers/${supplier.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadSuppliers();
    } catch (error) {
      setState(directoryState, errorMessage(error), true);
      statusButton.disabled = false;
    }
  });
  actionsCell.append(statusButton);
  row.append(rateCell, statusCell, actionsCell);
  return row;
}

function textCell(value, label, isHeading = false) {
  const cell = document.createElement(isHeading ? "th" : "td");
  if (isHeading) cell.scope = "row";
  cell.dataset.label = label;
  cell.textContent = String(value);
  return cell;
}

function actionButton(label) {
  const button = document.createElement("button");
  button.type = "submit";
  button.className = "button button-small button-secondary";
  button.textContent = label;
  return button;
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!response.ok) throw new Error(await responseMessage(response));
  return response.json();
}

async function responseMessage(response) {
  try {
    const body = await response.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) return body.detail.map((item) => item.msg).join(" ");
  } catch {
    // Fall through to the status-based message.
  }
  return `Request failed with status ${response.status}.`;
}

function formatLabel(value) {
  return String(value).replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function setState(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("state-error", isError);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

loadSuppliers();
