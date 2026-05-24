const STORAGE_KEY = "sis-client-dashboard-v1";
const PRIME_CHECKLIST_KEY = "sis-prime-checklist-v1";

const statuses = [
  "Nuevo lead",
  "Contactado",
  "Cotización enviada",
  "Seguimiento",
  "Cerrado",
];

const packageValues = {
  "Pro Automation": 2997,
  "Premium Growth System": 4997,
  "Prime Operating System": 7497,
};

const sampleLeads = [
  {
    id: crypto.randomUUID(),
    business: "Rivera Roofing",
    contact: "Carlos Rivera",
    phone: "+1 787 555 1010",
    niche: "Contractor",
    package: "Prime Operating System",
    value: packageValues["Prime Operating System"],
    status: "Cotización enviada",
    nextAction: "Enviar demo del sistema de captación",
    notes: "Quiere recibir leads de Google y Facebook en un CRM con seguimiento por WhatsApp.",
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    business: "Elite Smile Clinic",
    contact: "Dra. Morales",
    phone: "+1 787 555 2020",
    niche: "Clínica",
    package: "Premium Growth System",
    value: packageValues["Premium Growth System"],
    status: "Contactado",
    nextAction: "Agendar llamada de diagnóstico",
    notes: "Necesita automatizar citas, recordatorios y preguntas frecuentes.",
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    business: "Prime Auto Deals",
    contact: "Luis",
    phone: "+1 787 555 3030",
    niche: "Dealer",
    package: "Pro Automation",
    value: packageValues["Pro Automation"],
    status: "Nuevo lead",
    nextAction: "Enviar mensaje de presentación",
    notes: "Buen prospecto para WhatsApp IA y pipeline de ventas.",
    createdAt: new Date().toISOString(),
  },
];

let leads = loadLeads();

const form = document.querySelector("#leadForm");
const pipeline = document.querySelector("#pipeline");
const template = document.querySelector("#leadCardTemplate");
const searchInput = document.querySelector("#searchInput");
const packageFilter = document.querySelector("#packageFilter");
const statusFilter = document.querySelector("#statusFilter");
const packageSelect = form.elements.package;
const valueInput = form.elements.value;
const primeChecks = document.querySelectorAll("[data-prime-check]");
const resetPrimeChecklist = document.querySelector("#resetPrimeChecklist");
const customSelects = [];

statuses.forEach((status) => {
  const option = document.createElement("option");
  option.value = status;
  option.textContent = status;
  statusFilter.appendChild(option);
});

function initCustomSelect(select) {
  const wrapper = document.createElement("div");
  const toggle = document.createElement("button");
  const menu = document.createElement("div");

  select.classList.add("custom-select-source");
  wrapper.className = "custom-select";
  toggle.className = "custom-select-toggle";
  toggle.type = "button";
  menu.className = "custom-select-menu";

  const syncLabel = () => {
    toggle.textContent = select.options[select.selectedIndex]?.textContent || "";
    menu.querySelectorAll(".custom-select-option").forEach((button, index) => {
      button.classList.toggle("is-selected", index === select.selectedIndex);
    });
  };

  Array.from(select.options).forEach((option) => {
    const item = document.createElement("button");
    item.className = "custom-select-option";
    item.type = "button";
    item.textContent = option.textContent;

    item.addEventListener("click", () => {
      select.value = option.value || option.textContent;
      syncLabel();
      wrapper.classList.remove("is-open");
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    if (option.selected) item.classList.add("is-selected");
    menu.appendChild(item);
  });

  toggle.addEventListener("click", () => {
    customSelects.forEach((item) => {
      if (item.wrapper !== wrapper) item.wrapper.classList.remove("is-open");
    });
    wrapper.classList.toggle("is-open");
  });

  wrapper.append(toggle, menu);
  select.after(wrapper);
  syncLabel();
  customSelects.push({ select, wrapper, syncLabel });
}

document.querySelectorAll(".lead-form select, .toolbar select").forEach(initCustomSelect);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".custom-select")) {
    customSelects.forEach(({ wrapper }) => wrapper.classList.remove("is-open"));
  }
});

function loadLeads() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return sampleLeads;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : sampleLeads;
  } catch {
    return sampleLeads;
  }
}

function saveLeads() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function getPackageValue(packageName) {
  return packageValues[packageName] || packageValues["Pro Automation"];
}

function updateEstimatedValue() {
  valueInput.value = getPackageValue(packageSelect.value);
}

function loadPrimeChecklist() {
  const saved = localStorage.getItem(PRIME_CHECKLIST_KEY);
  if (!saved) return {};

  try {
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function savePrimeChecklist() {
  const checklist = {};
  primeChecks.forEach((check) => {
    checklist[check.dataset.primeCheck] = check.checked;
  });
  localStorage.setItem(PRIME_CHECKLIST_KEY, JSON.stringify(checklist));
}

function initPrimeChecklist() {
  const checklist = loadPrimeChecklist();
  primeChecks.forEach((check) => {
    check.checked = Boolean(checklist[check.dataset.primeCheck]);
    check.addEventListener("change", savePrimeChecklist);
  });

  resetPrimeChecklist?.addEventListener("click", () => {
    primeChecks.forEach((check) => {
      check.checked = false;
    });
    savePrimeChecklist();
  });
}

function filteredLeads() {
  const query = normalize(searchInput.value);
  const packageValue = packageFilter.value;
  const statusValue = statusFilter.value;

  return leads.filter((lead) => {
    const matchesPackage = packageValue === "all" || lead.package === packageValue;
    const matchesStatus = statusValue === "all" || lead.status === statusValue;
    const haystack = [
      lead.business,
      lead.contact,
      lead.phone,
      lead.niche,
      lead.package,
      lead.status,
      lead.nextAction,
      lead.notes,
    ]
      .map(normalize)
      .join(" ");

    return matchesPackage && matchesStatus && (!query || haystack.includes(query));
  });
}

function renderMetrics(visibleLeads) {
  const totalValue = visibleLeads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
  const quotes = visibleLeads.filter((lead) => lead.status === "Cotización enviada").length;
  const won = visibleLeads.filter((lead) => lead.status === "Cerrado").length;

  document.querySelector("#metricTotal").textContent = visibleLeads.length;
  document.querySelector("#metricValue").textContent = money(totalValue);
  document.querySelector("#metricQuotes").textContent = quotes;
  document.querySelector("#metricWon").textContent = won;
}

function render() {
  const visibleLeads = filteredLeads();
  renderMetrics(visibleLeads);
  pipeline.innerHTML = "";

  statuses.forEach((status) => {
    const column = document.createElement("section");
    column.className = "pipeline-column";
    column.dataset.status = status;

    const statusLeads = visibleLeads.filter((lead) => lead.status === status);
    const statusValue = statusLeads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);

    column.innerHTML = `
      <div class="pipeline-heading">
        <div>
          <h2>${status}</h2>
          <span>${statusLeads.length} oportunidades</span>
        </div>
        <strong>${money(statusValue)}</strong>
      </div>
      <div class="pipeline-list"></div>
    `;

    const list = column.querySelector(".pipeline-list");
    statusLeads.forEach((lead) => list.appendChild(renderLead(lead)));
    pipeline.appendChild(column);
  });
}

function renderLead(lead) {
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector(".lead-card");
  const title = fragment.querySelector("h3");
  const meta = fragment.querySelector(".lead-meta");
  const tags = fragment.querySelector(".lead-tags");
  const notes = fragment.querySelector(".lead-notes");
  const next = fragment.querySelector(".lead-next");
  const statusSelect = fragment.querySelector(".status-select");
  const callLink = fragment.querySelector(".call-link");
  const deleteButton = fragment.querySelector(".delete-lead");

  title.textContent = lead.business;
  meta.textContent = [lead.contact, lead.phone].filter(Boolean).join(" · ") || "Sin contacto";
  tags.innerHTML = `
    <span>${lead.niche}</span>
    <span>${lead.package}</span>
    <strong>${money(lead.value)}</strong>
  `;
  notes.textContent = lead.notes || "Sin notas todavía.";
  next.textContent = lead.nextAction ? `Próxima acción: ${lead.nextAction}` : "Próxima acción pendiente.";
  callLink.href = lead.phone ? `tel:${lead.phone.replace(/[^\d+]/g, "")}` : "#";

  statuses.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    option.selected = lead.status === status;
    statusSelect.appendChild(option);
  });

  statusSelect.addEventListener("change", () => {
    lead.status = statusSelect.value;
    saveLeads();
    render();
  });
  initCustomSelect(statusSelect);

  deleteButton.addEventListener("click", () => {
    leads = leads.filter((item) => item.id !== lead.id);
    saveLeads();
    render();
  });

  return card;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const lead = Object.fromEntries(formData.entries());

  leads.unshift({
    id: crypto.randomUUID(),
    ...lead,
    value: getPackageValue(lead.package),
    status: "Nuevo lead",
    createdAt: new Date().toISOString(),
  });

  form.reset();
  updateEstimatedValue();
  customSelects.forEach(({ syncLabel }) => syncLabel());
  saveLeads();
  render();
});

packageSelect.addEventListener("change", updateEstimatedValue);
window.addEventListener("pageshow", updateEstimatedValue);
searchInput.addEventListener("input", render);
packageFilter.addEventListener("change", render);
statusFilter.addEventListener("change", render);

document.querySelector("#resetDemo").addEventListener("click", () => {
  leads = sampleLeads.map((lead) => ({ ...lead, id: crypto.randomUUID() }));
  saveLeads();
  render();
});

document.querySelector("#exportCsv").addEventListener("click", () => {
  const headers = ["Negocio", "Contacto", "Teléfono", "Nicho", "Paquete", "Valor", "Estado", "Próxima acción", "Notas"];
  const rows = leads.map((lead) => [
    lead.business,
    lead.contact,
    lead.phone,
    lead.niche,
    lead.package,
    lead.value,
    lead.status,
    lead.nextAction,
    lead.notes,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sis-clientes.csv";
  link.click();
  URL.revokeObjectURL(url);
});

updateEstimatedValue();
initPrimeChecklist();
render();
