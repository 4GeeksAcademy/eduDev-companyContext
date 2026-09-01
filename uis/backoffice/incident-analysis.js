const requestedApiPort = new URLSearchParams(window.location.search).get("apiPort");
const parsedApiPort = requestedApiPort !== null && /^\d+$/.test(requestedApiPort)
  ? Number(requestedApiPort)
  : 0;
const apiPort = parsedApiPort >= 1 && parsedApiPort <= 65535 ? parsedApiPort : 8000;
const apiBaseUrl = (
  window.TRACKFLOW_API_BASE_URL
  ?? `${window.location.protocol === "http:" || window.location.protocol === "https:" ? window.location.protocol : "http:"}//${window.location.hostname || "localhost"}:${apiPort}`
).replace(/\/$/, "");

const form = document.querySelector("#analysis-form");
const fileInput = document.querySelector("#incident-file");
const analyzeButton = document.querySelector("#analyze-button");
const exportButton = document.querySelector("#export-button");
const state = document.querySelector("#analysis-state");
const panel = document.querySelector("#results-panel");
const results = document.querySelector("#analysis-results");
const invalidNotice = document.querySelector("#invalid-notice");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const [file] = fileInput.files;
  if (!file) {
    setState("Select a CSV file before starting the analysis.", true);
    return;
  }

  analyzeButton.disabled = true;
  panel.classList.add("hidden");
  setState("Analyzing the file…");
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${apiBaseUrl}/api/incidents/analyze`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error(await responseMessage(response));
    const summary = await response.json();
    renderSummary(summary);
    setState("Analysis complete. Only aggregate results are shown.");
  } catch (error) {
    setState(error instanceof Error ? error.message : "The analysis could not be completed.", true);
  } finally {
    analyzeButton.disabled = false;
  }
});

exportButton.addEventListener("click", async () => {
  exportButton.disabled = true;
  try {
    const response = await fetch(`${apiBaseUrl}/api/incidents/results/export`);
    if (!response.ok) throw new Error(await responseMessage(response));
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "results.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    setState(error instanceof Error ? error.message : "The export could not be downloaded.", true);
  } finally {
    exportButton.disabled = false;
  }
});

function renderSummary(summary) {
  results.replaceChildren(
    metricCard("Totals", [
      ["Records processed", summary.total_records, true],
      ["Valid records", summary.valid_records],
      ["Invalid records", summary.invalid_records],
    ]),
    metricCard("Satisfaction", [
      ["Average score", summary.satisfaction.average === null ? "N/A" : `${summary.satisfaction.average.toFixed(2)} / 5`, true],
      ["Scored closed incidents", `${summary.satisfaction.scored_incidents} of ${summary.satisfaction.closed_incidents}`],
      ...Object.entries(summary.satisfaction.scores).map(([score, count]) => [`Score ${score}`, count]),
    ]),
    metricCard("Categories", Object.entries(summary.categories)),
    metricCard("Statuses", Object.entries(summary.statuses)),
    metricCard("Countries", Object.entries(summary.countries)),
    metricCard(
      "Invalid record reasons",
      Object.entries(summary.invalid_reasons).filter(([, count]) => count > 0).map(([reason, count]) => [formatLabel(reason), count]),
      true,
    ),
  );

  if (summary.invalid_records > 0) {
    invalidNotice.textContent = `${summary.invalid_records} invalid record${summary.invalid_records === 1 ? " was" : "s were"} excluded from operational metrics. Review the reason counts below.`;
    invalidNotice.classList.remove("hidden");
  } else {
    invalidNotice.classList.add("hidden");
    invalidNotice.textContent = "";
  }
  panel.classList.remove("hidden");
}

function metricCard(title, metrics, fullWidth = false) {
  const card = document.createElement("article");
  card.className = `metric-card${fullWidth ? " full-width" : ""}`;
  const heading = document.createElement("h3");
  heading.textContent = title;
  const list = document.createElement("dl");
  list.className = "metric-list";

  if (metrics.length === 0) metrics = [["No issues found", 0]];
  for (const [label, value, highlighted = false] of metrics) {
    const row = document.createElement("div");
    if (highlighted) row.className = "metric-highlight";
    const term = document.createElement("dt");
    term.textContent = formatLabel(label);
    const description = document.createElement("dd");
    description.textContent = String(value);
    row.append(term, description);
    list.append(row);
  }
  card.append(heading, list);
  return card;
}

function formatLabel(value) {
  return String(value).toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function setState(message, isError = false) {
  state.textContent = message;
  state.classList.toggle("state-error", isError);
}

async function responseMessage(response) {
  try {
    const body = await response.json();
    return body.detail ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}
