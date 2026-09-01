const warehouses = [
  { city: "Los Angeles", code: "LAX", available: 8420, reserved: 610, fill: 74, note: "Normal activity" },
  { city: "Zaragoza", code: "ZAZ", available: 5190, reserved: 438, fill: 66, note: "1 low-stock alert" },
];

const kpis = [
  { label: "Shipments today", value: "486", detail: "312 dispatched" },
  { label: "Returns pending", value: "37", detail: "9 require review" },
  { label: "On-time carriers", value: "94%", detail: "Across 8 partners" },
  { label: "Inventory units", value: "13,610", detail: "Available globally" },
];

const shipments = [
  { id: "TF-28491", route: "Los Angeles → Phoenix", carrier: "UPS", status: "In transit", tone: "moving" },
  { id: "TF-28477", route: "Zaragoza → Madrid", carrier: "SEUR", status: "Delivered", tone: "complete" },
  { id: "TF-28452", route: "Zaragoza → Valencia", carrier: "MRW", status: "Review", tone: "review" },
];

function renderWarehouses() {
  const container = document.querySelector("#warehouse-grid");
  container.innerHTML = warehouses.map((warehouse) => `
    <article class="warehouse-card">
      <div class="warehouse-head">
        <div><span class="warehouse-code">${warehouse.code}</span><h3>${warehouse.city}</h3></div>
        <span class="warehouse-note">${warehouse.note}</span>
      </div>
      <dl>
        <div><dt>Available</dt><dd>${warehouse.available.toLocaleString("en-US")}</dd></div>
        <div><dt>Reserved</dt><dd>${warehouse.reserved.toLocaleString("en-US")}</dd></div>
      </dl>
      <div class="capacity"><span style="width: ${warehouse.fill}%"></span></div>
      <small>${warehouse.fill}% storage capacity in use</small>
    </article>
  `).join("");
}

function renderKpis() {
  const container = document.querySelector("#kpi-grid");
  container.innerHTML = kpis.map((kpi) => `
    <div><dt>${kpi.label}</dt><dd>${kpi.value}</dd><span>${kpi.detail}</span></div>
  `).join("");
}

function renderShipments() {
  const container = document.querySelector("#shipment-rows");
  container.innerHTML = shipments.map((shipment) => `
    <tr>
      <th scope="row">${shipment.id}</th>
      <td>${shipment.route}</td>
      <td>${shipment.carrier}</td>
      <td><span class="badge badge-${shipment.tone}">${shipment.status}</span></td>
    </tr>
  `).join("");
}

renderWarehouses();
renderKpis();
renderShipments();
