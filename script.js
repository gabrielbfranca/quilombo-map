// Initialize the map
var map = L.map("map", {
  zoomControl: false, // disable default position
}).setView([-15.78, -47.93], 5);

L.control.zoom({ position: "bottomright" }).addTo(map);

const CSV =
  // Add base map tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

// Example function to parse and rename columns
function parseAndFixCsv(csvText) {
  // Split lines and get headers
  const lines = csvText.trim().split("\n");
  const rawHeaders = lines[0].split(",");
  const rows = lines.slice(1);

  // Map raw headers to better names
  const headerMap = {
    "Nome da escola (ou extensão se for o caso)": "Nome da escola",
    "Quantidade de estudantes": "Quantidade de estudantes",
    "Quantidade de professores efetivos": "Quantidade de professores efetivos",
    "Quantidade de professores temporários":
      "Quantidade de professores temporários",
    "Professores formados pela LEdoC trabalhando na escola":
      "Professores formados pela LEdoC",
    "Qual a melhor forma de chegar até a escola?": "Melhor forma de chegar",
    "Distância até a sede ": "Distância até a sede",
    "Turnos em que a escola funciona": "Turnos em que a escola funciona",
    "Distância até a CRE": "Distância até a CRE",
    "Tempo de deslocamento da escola até a CRE":
      "Tempo de deslocamento da escola até a CRE",
    "Quantidade de estudantes transportados pelo transporte da escola":
      "Quantidade de estudantes transportados",
    "Tempo médio de deslocamento dos estudantes":
      "Tempo médio de deslocamento dos estudantes",
    "Se possível, insira aqui o link com o localizador da escola, ou as coordenadas de latitude e longitude da escola":
      "Localização",
  };

  // Build new headers
  const headers = rawHeaders.map(
    (h) => headerMap[h.replace(/"/g, "")] || h.replace(/"/g, "")
  );

  // Parse rows
  const data = rows.map((line) => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] ? values[i].replace(/"/g, "") : "";
    });
    return obj;
  });

  return data;
}

let allMarkers = [];
let allData = [];

let currentFiltered = [];
let selectedIndices = new Set();
let lastClickedIndex = null;

// --- Adicionar variáveis de seleção por retângulo ---
let isSelecting = false;
let selectStartPoint = null;
let selectionRect = null;

function addMarkers(data) {
  // Remove previous markers
  allMarkers.forEach((marker) => map.removeLayer(marker));
  allMarkers = [];

  data.forEach((item, idx) => {
    if (
      item[
        "Se possível, insira aqui o link com o localizador da escola, ou as coordenadas de latitude e longitude da escola"
      ]
    ) {
      const coords = item[
        "Se possível, insira aqui o link com o localizador da escola, ou as coordenadas de latitude e longitude da escola"
      ]
        .split(",")
        .map((v) => Number(v.trim()));
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        // Build styled popup content
        let popupContent = `
          <div style="font-family: Arial, sans-serif; max-width: 300px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
              <h3 style="margin: 0; font-size: 1.2em; font-weight: bold; flex: 1;">
                🏫 ${
                  item["Nome da escola (ou extensão se for o caso)"] || "Escola"
                }
              </h3>
              
            </div>
            
            <div style="padding: 12px;">
              <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #007cba;">
                <strong style="color: #495057;">📍 Comunidade:</strong><br>
                <span style="color: #6c757d;">${
                  item.Comunidade || "Não informado"
                }</span>
              </div>
              
              <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #28a745;">
                <strong style="color: #495057;">🏛️ Abrangência:</strong> <span style="color: #6c757d;">${
                  item.Abrangência || "Não informado"
                }</span><br>
                <strong style="color: #495057;">📚 Nível:</strong> <span style="color: #6c757d;">${
                  item.Nível || "Não informado"
                }</span>
              </div>
              
              <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #ffc107;">
                <strong style="color: #495057;">👥 Estudantes:</strong> <span style="color: #6c757d;">${
                  item["Quantidade de estudantes"] || "Não informado"
                }</span><br>
                <strong style="color: #495057;">👨‍🏫 Professores:</strong> <span style="color: #6c757d;">${
                  item["Quantidade de professores efetivos"] || "0"
                } efetivos, ${
          item["Quantidade de professores temporários"] || "0"
        } temporários</span>
              </div>
              
              <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #17a2b8;">
                <strong style="color: #495057;">⏰ Turnos:</strong><br>
                <span style="color: #6c757d;">${
                  item["Turnos em que a escola funciona"] || "Não informado"
                }</span>
              </div>
              
              <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #dc3545;">
                <strong style="color: #495057;">🚗 Acesso:</strong><br>
                <span style="color: #6c757d;">${
                  item["Qual a melhor forma de chegar até a escola?"] ||
                  "Não informado"
                }</span>
              </div>
              
              ${
                item["Professores formados pela LEdoC trabalhando na escola"]
                  ? `
                <div style="margin-bottom: 8px; padding: 8px; background: #e8f5e8; border-radius: 6px; border-left: 4px solid #28a745;">
                  <strong style="color: #155724;">🎓 Professores LEdoC:</strong> <span style="color: #155724;">${item["Professores formados pela LEdoC trabalhando na escola"]}</span>
                </div>
              `
                  : ""
              }
              
              ${
                item["Se tiver sugestoes ou comentários, escreva aqui"]
                  ? `
                <div style="margin-top: 12px; padding: 8px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
                  <strong style="color: #856404;">💬 Comentários:</strong><br>
                  <em style="color: #856404;">"${item["Se tiver sugestoes ou comentários, escreva aqui"]}"</em>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `;

        // create marker without using bindPopup so we control when popups open
        const marker = L.marker(coords).addTo(map);

        // create a popup instance but don't bind it automatically to the marker
        const popup = L.popup({
          maxWidth: 350,
          className: "custom-popup",
        }).setContent(popupContent);

        // open popup on marker click unless suppressed by list clicks
        marker.on("click", function () {
          if (window._suppressMarkerPopup) return;
          popup.setLatLng(marker.getLatLng());
          popup.openOn(map);
        });

        // store popup and item refs for later use
        marker._customPopup = popup;
        marker._item = item;
        marker._resultIndex = idx;

        allMarkers.push(marker);
      }
    }
  });
}

// Load CSV file and parse it
let comunidadesList = [];
let escolasList = []; // Add this line

fetch("Escola Quilombo.csv")
  .then((response) => response.text())
  .then((csvText) => {
    const parsed = Papa.parse(csvText, { header: true });
    allData = parsed.data;
    addMarkers(allData);

    // Custom autocomplete for comunidade
    comunidadesList = [
      ...new Set(allData.map((item) => item.Comunidade).filter(Boolean)),
    ];

    // Custom autocomplete for escola - Add this block
    escolasList = [
      ...new Set(
        allData
          .map((item) => item["Nome da escola (ou extensão se for o caso)"])
          .filter(Boolean)
      ),
    ];
  })
  .catch((error) => {
    console.error("Erro ao carregar CSV:", error);
  });

// Custom autocomplete logic
const comunidadeInput = document.getElementById("searchComunidade");
const suggestionsBox = document.getElementById("comunidade-suggestions");

comunidadeInput.addEventListener("input", function () {
  const value = this.value.toLowerCase();
  if (!value) {
    suggestionsBox.style.display = "none";
    return;
  }
  const matches = comunidadesList.filter((com) =>
    com.toLowerCase().includes(value)
  );
  if (matches.length === 0) {
    suggestionsBox.style.display = "none";
    return;
  }
  suggestionsBox.innerHTML = matches
    .map(
      (com) =>
        `<div class="suggestion-item" style="padding:6px;cursor:pointer;">${com}</div>`
    )
    .join("");
  suggestionsBox.style.display = "block";
  suggestionsBox.style.top =
    comunidadeInput.offsetTop + comunidadeInput.offsetHeight + "px";
  suggestionsBox.style.left = comunidadeInput.offsetLeft + "px";
});

suggestionsBox.addEventListener("mousedown", function (e) {
  if (e.target.classList.contains("suggestion-item")) {
    comunidadeInput.value = e.target.textContent;
    suggestionsBox.style.display = "none";
    // Remove this line: applyFilters();
  }
});

// Hide suggestions when clicking outside
document.addEventListener("click", function (e) {
  if (e.target !== comunidadeInput && e.target !== suggestionsBox) {
    suggestionsBox.style.display = "none";
  }
});

document.getElementById("filterHeader").addEventListener("click", function () {
  const filterContent = document.getElementById("filterContent");
  const minimizeBtn = document.getElementById("minimizeBtn");

  if (filterContent.style.display === "none") {
    filterContent.style.display = "block";
    minimizeBtn.textContent = "−";
  } else {
    filterContent.style.display = "none";
    minimizeBtn.textContent = "+";
  }
});

function getCheckedValues(className) {
  return Array.from(
    document.querySelectorAll("input." + className + ":checked")
  ).map((cb) => cb.value);
}

function showCustomAlert() {
  document.getElementById("customAlert").style.display = "flex";
}

document.getElementById("closeAlertBtn").onclick = function () {
  document.getElementById("customAlert").style.display = "none";
};

function applyFilters() {
  // If "Mostrar todas as escolas" is checked, show everything
  const showAll =
    document.getElementById("showAll") &&
    document.getElementById("showAll").checked;
  let filtered;

  if (showAll) {
    filtered = allData.slice();
  } else {
    const query = document.getElementById("search").value.toLowerCase();
    const comunidadeQuery = document
      .getElementById("searchComunidade")
      .value.toLowerCase();
    const checkedNiveis = getCheckedValues("nivel");
    const checkedExtensao = getCheckedValues("extensao");
    const checkedAbrangencia = getCheckedValues("abrangencia");
    const checkedTurnos = getCheckedValues("turno");

    filtered = allData.filter((item) => {
      const matchesText =
        (item["Nome da escola (ou extensão se for o caso)"] || "")
          .toLowerCase()
          .includes(query);
      const matchesComunidade =
        comunidadeQuery === "" ||
        (item.Comunidade || "").toLowerCase().includes(comunidadeQuery);
      const matchesNivel =
        checkedNiveis.length === 0 ||
        checkedNiveis.some((nivel) => (item.Nível || "").includes(nivel));
      const matchesExtensao =
        checkedExtensao.length === 0 ||
        checkedExtensao.includes(item["A escola é extensão?"]);
      const matchesAbrangencia =
        checkedAbrangencia.length === 0 ||
        checkedAbrangencia.includes(item.Abrangência);
      const matchesTurnos =
        checkedTurnos.length === 0 ||
        checkedTurnos.some((turno) =>
          (item["Turnos em que a escola funciona"] || "").includes(turno)
        );
      return (
        matchesText &&
        matchesComunidade &&
        matchesNivel &&
        matchesExtensao &&
        matchesAbrangencia &&
        matchesTurnos
      );
    });
  }

  // keep reference to filtered for selection handling
  currentFiltered = filtered;

  addMarkers(filtered);

  // Show results list
  const resultsList = document.getElementById("resultsList");
  const resultItems = document.getElementById("resultItems");
  
  if (filtered.length > 0) {
    resultsList.style.display = "block";
    // render items as minimized cards with a hidden .details section that can be toggled
    resultItems.innerHTML = filtered
      .map(
        (item, index) => `
          <div class="result-card" data-index="${index}" style="
            padding: 12px 16px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background 0.15s;
            display:flex;
            flex-direction:column;
          ">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <div>
                <strong style="color: #333;">🏫 ${item["Nome da escola (ou extensão se for o caso)"] || "Escola"}</strong><br>
                <small style="color: #666;">${item.Comunidade || "Comunidade desconhecida"}</small>
              </div>
              <button class="toggle-details" style="border:0;background:transparent;font-size:18px;cursor:pointer;">▾</button>
            </div>

            <div class="details" style="display:none;margin-top:10px;padding-top:8px;border-top:1px dashed #eee;color:#444;">
              <div><strong>📍 Comunidade:</strong> ${item.Comunidade || "Não informado"}</div>
              <div><strong>🏛️ Abrangência:</strong> ${item.Abrangência || "Não informado"} <br> <strong>Nível:</strong> ${item.Nível || "Não informado"}</div>
              <div><strong>👥 Estudantes:</strong> ${item["Quantidade de estudantes"] || "Não informado"}</div>
              <div><strong>👨‍🏫 Professores:</strong> ${item["Quantidade de professores efetivos"] || "0"} efetivos, ${item["Quantidade de professores temporários"] || "0"} temporários</div>
              <div><strong>⏰ Turnos:</strong> ${item["Turnos em que a escola funciona"] || "Não informado"}</div>
              <div><strong>🚗 Acesso:</strong> ${item["Qual a melhor forma de chegar até a escola?"] || "Não informado"}</div>
              ${item["Professores formados pela LEdoC trabalhando na escola"] ? `<div><strong>🎓 Professores LEdoC:</strong> ${item["Professores formados pela LEdoC trabalhando na escola"]}</div>` : ""}
              ${item["Se tiver sugestoes ou comentários, escreva aqui"] ? `<div style="margin-top:6px;color:#856404;"><em>💬 ${item["Se tiver sugestoes ou comentários, escreva aqui"]}</em></div>` : ""}
            </div>
          </div>
        `
      )
      .join("");

    // clear previous selection state
    selectedIndices.clear();
    lastClickedIndex = null;
    // remove any selected class if present
    document.querySelectorAll("#resultItems .result-card.selected").forEach(n => n.classList.remove("selected"));

    const group = new L.featureGroup(allMarkers);
    map.fitBounds(group.getBounds(), { padding: [20, 20] });
  } else {
    resultsList.style.display = "none";
    map.setView([-15.78, -47.93], 5);
    showCustomAlert();
  }
}

// Remove these event listeners for real-time search:
// document.getElementById("searchComunidade").addEventListener("input", applyFilters);
// document.getElementById("search").addEventListener("input", applyFilters);
// ["nivel", "extensao", "abrangencia", "turno"].forEach((className) => {
//   document.querySelectorAll("input." + className).forEach((cb) => cb.addEventListener("change", applyFilters));
// });

// Replace with button click event:
document.getElementById("applyFilters").addEventListener("click", applyFilters);

// Add clear functionality
document.getElementById("clearFilters").addEventListener("click", function () {
  document.getElementById("search").value = "";
  document.getElementById("searchComunidade").value = "";
  const showAll = document.getElementById("showAll");
  if (showAll) {
    showAll.checked = false;
  }
  document
    .querySelectorAll("#filterContent input[type='checkbox']")
    .forEach((cb) => (cb.checked = false));
  document.querySelectorAll("#filterContent input[type='checkbox']").forEach((cb) => (cb.disabled = false));
  document.getElementById("search").disabled = false;
  document.getElementById("searchComunidade").disabled = false;
  document.getElementById("resultsList").style.display = "none";
  addMarkers(allData); // Show all markers
});

// Add school autocomplete logic
const escolaInput = document.getElementById("search");
const escolaSuggestionsBox = document.getElementById("escola-suggestions");

escolaInput.addEventListener("input", function () {
  const value = this.value.toLowerCase();
  if (!value) {
    escolaSuggestionsBox.style.display = "none";
    return;
  }
  const matches = escolasList.filter((escola) =>
    escola.toLowerCase().includes(value)
  );
  if (matches.length === 0) {
    escolaSuggestionsBox.style.display = "none";
    return;
  }
  escolaSuggestionsBox.innerHTML = matches
    .map(
      (escola) =>
        `<div class="suggestion-item" style="padding:6px;cursor:pointer;">${escola}</div>`
    )
    .join("");
  escolaSuggestionsBox.style.display = "block";
  escolaSuggestionsBox.style.top =
    escolaInput.offsetTop + escolaInput.offsetHeight + "px";
  escolaSuggestionsBox.style.left = escolaInput.offsetLeft + "px";
});

escolaSuggestionsBox.addEventListener("mousedown", function (e) {
  if (e.target.classList.contains("suggestion-item")) {
    escolaInput.value = e.target.textContent;
    escolaSuggestionsBox.style.display = "none";
  }
});

// Hide escola suggestions when clicking outside
document.addEventListener("click", function (e) {
  if (e.target !== escolaInput && e.target !== escolaSuggestionsBox) {
    escolaSuggestionsBox.style.display = "none";
  }
});

// Add this near other DOM listeners (after DOM elements exist)
const showAllCheckbox = document.getElementById("showAll");
if (showAllCheckbox) {
  showAllCheckbox.addEventListener("change", function () {
    const disabled = this.checked;
    // disable search inputs and other filter checkboxes when "show all" is checked
    const schoolInput = document.getElementById("search");
    const comunidadeInput = document.getElementById("searchComunidade");
    if (schoolInput) schoolInput.disabled = disabled;
    if (comunidadeInput) comunidadeInput.disabled = disabled;

    document.querySelectorAll("#filterContent input[type='checkbox']").forEach((cb) => {
      if (cb.id !== "showAll") cb.disabled = disabled;
    });
  });
}

// add delegated click handler for selecting items and double-click to open popup
const resultItemsContainer = document.getElementById("resultItems");
if (resultItemsContainer) {
  resultItemsContainer.addEventListener("click", function (e) {
    const card = e.target.closest(".result-card");
    if (!card) return;

    const isToggle =
      e.target.classList.contains("toggle-details") ||
      e.target.closest(".toggle-details");

    const idx = Number(card.dataset.index);
    if (isNaN(idx)) return;

    // Decide mobile/touch behavior: single tap should pan to marker (but NOT open popup)
    const isTouchOrSmall =
      window.innerWidth <= 600 || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

    if (isToggle) {
      // toggle details only
      const btn = e.target.classList.contains("toggle-details")
        ? e.target
        : e.target.closest(".toggle-details");
      const details = card.querySelector(".details");
      const isExpanded = details.style.display === "block";
      details.style.display = isExpanded ? "none" : "block";
      btn.textContent = isExpanded ? "▾" : "▴";
      return;
    }

    if (isTouchOrSmall) {
      // single tap on mobile/touch: pan to marker but do NOT open popup
      goToMarker(idx);

      // expand details visually
      const details = card.querySelector(".details");
      const btn = card.querySelector(".toggle-details");
      if (details && details.style.display !== "block") {
        details.style.display = "block";
        if (btn) btn.textContent = "▴";
      }

      // single-select visually
      selectedIndices.clear();
      selectedIndices.add(idx);
      lastClickedIndex = idx;
      document.querySelectorAll("#resultItems .result-card").forEach((el) => {
        const i = Number(el.dataset.index);
        if (selectedIndices.has(i)) el.classList.add("selected");
        else el.classList.remove("selected");
      });
      return;
    }

    // Desktop behavior: prevent marker popup from opening due to incidental marker click
    window._suppressMarkerPopup = true;
    setTimeout(() => {
      window._suppressMarkerPopup = false;
    }, 250);

    // Otherwise handle selection (Shift/Ctrl/Cmd behavior remains)
    if (e.shiftKey && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, idx);
      const end = Math.max(lastClickedIndex, idx);
      for (let i = start; i <= end; i++) selectedIndices.add(i);
    } else if (e.ctrlKey || e.metaKey) {
      if (selectedIndices.has(idx)) selectedIndices.delete(idx);
      else selectedIndices.add(idx);
      lastClickedIndex = idx;
    } else {
      selectedIndices.clear();
      selectedIndices.add(idx);
      lastClickedIndex = idx;
    }
    // update visual states
    document.querySelectorAll("#resultItems .result-card").forEach((el) => {
      const i = Number(el.dataset.index);
      if (selectedIndices.has(i)) el.classList.add("selected");
      else el.classList.remove("selected");
    });
  });

  // dblclick still opens popup and centers map (keeps previous behavior)
  resultItemsContainer.addEventListener("dblclick", function (e) {
    const card = e.target.closest(".result-card");
    if (!card) return;
    const idx = Number(card.dataset.index);
    showSchoolPopup(idx);
  });
}

// minimize / expand results list
const minimizeBtn = document.getElementById("minimizeResultsBtn");
const resultsListEl = document.getElementById("resultsList");
const resultsHeader = document.getElementById("resultsHeader");
const resultItemsEl = document.getElementById("resultItems");
if (minimizeBtn && resultsListEl && resultItemsEl) {
  minimizeBtn.addEventListener("click", function () {
    const isExpanded = minimizeBtn.getAttribute("aria-expanded") === "true";
    if (isExpanded) {
      // minimize
      resultsListEl.classList.add("collapsed");
      resultItemsEl.style.display = "none";
      minimizeBtn.textContent = "+";
      minimizeBtn.setAttribute("aria-expanded", "false");
    } else {
      // expand
      resultsListEl.classList.remove("collapsed");
      resultItemsEl.style.display = "block";
      minimizeBtn.textContent = "−";
      minimizeBtn.setAttribute("aria-expanded", "true");
    }
  });

  // also toggle when header is tapped (except when clicking inside items)
  resultsHeader.addEventListener("click", function (e) {
    if (e.target === minimizeBtn) return;
    minimizeBtn.click();
  });
}

// helper: pan/center to a marker without opening its popup
function goToMarker(index) {
  for (const marker of allMarkers) {
    if (marker._resultIndex === index) {
      const latlng = marker.getLatLng();
      // Pan (do not open popup). Optionally adjust zoom level if too far out:
      // if (map.getZoom() < 12) map.setView(latlng, 12, { animate: true });
      map.panTo(latlng, { animate: true });
      return marker;
    }
  }
  return null;
}

// helper to get selected data objects
function getSelectedSchools() {
  return Array.from(selectedIndices)
    .sort((a,b)=>a-b)
    .map(i => currentFiltered[i]);
}

// update showSchoolPopup to open the custom popup instance
function showSchoolPopup(index) {
  const item = currentFiltered[index];
  if (!item) return;

  const coords = item[
    "Se possível, insira aqui o link com o localizador da escola, ou as coordenadas de latitude e longitude da escola"
  ]
    .split(",")
    .map((v) => Number(v.trim()));

  for (const marker of allMarkers) {
    const ll = marker.getLatLng();
    if (Math.abs(ll.lat - coords[0]) < 1e-6 && Math.abs(ll.lng - coords[1]) < 1e-6) {
      // use custom popup if present
      if (marker._customPopup) {
        marker._customPopup.setLatLng(marker.getLatLng());
        marker._customPopup.openOn(map);
      } else {
        // fallback if needed
        marker.openPopup && marker.openPopup();
      }
      map.panTo(marker.getLatLng());
      return;
    }
  }
}

// --- Seleção por arrastar (SHIFT + drag) ---
map.on("mousedown", function (e) {
  if (!e.originalEvent.shiftKey) return; // segura Shift para selecionar
  isSelecting = true;
  selectStartPoint = e.containerPoint;
  // cria retângulo temporário
  selectionRect = L.rectangle([map.containerPointToLatLng(selectStartPoint), map.containerPointToLatLng(selectStartPoint)], {
    color: "#007cba",
    weight: 1,
    fillOpacity: 0.15,
    interactive: false
  }).addTo(map);
  // desabilitar dragging do mapa enquanto seleciona
  map.dragging.disable();
});

map.on("mousemove", function (e) {
  if (!isSelecting || !selectionRect) return;
  const p1 = selectStartPoint;
  const p2 = e.containerPoint;
  const bounds = L.latLngBounds(map.containerPointToLatLng(p1), map.containerPointToLatLng(p2));
  selectionRect.setBounds(bounds);
});

map.on("mouseup", function (e) {
  if (!isSelecting) return;
  isSelecting = false;
  map.dragging.enable();

  if (!selectionRect) return;
  const bounds = selectionRect.getBounds();

  // Encontrar markers dentro dos bounds; usar allMarkers que foram criados para o conjunto atual
  const matchedItems = [];
  const matchedIndices = [];

  allMarkers.forEach((marker) => {
    const ll = marker.getLatLng();
    if (bounds.contains(ll)) {
      // se marker._item existir (setado em addMarkers), adiciona ao array
      if (marker._item) {
        matchedItems.push(marker._item);
        // se marker._resultIndex existir use-o, senão use posição em matchedItems
        matchedIndices.push(typeof marker._resultIndex === "number" ? marker._resultIndex : matchedItems.length - 1);
      }
    }
  });

  // remover retângulo de seleção
  map.removeLayer(selectionRect);
  selectionRect = null;

  if (matchedItems.length > 0) {
    // mostrar lista lateral com os itens selecionados
    populateResultsList(matchedItems);

    // marca visualmente os cards correspondentes (seleção única múltipla por padrão)
    // aqui selecionamos todos (multi-seleção)
    selectedIndices.clear();
    for (let i = 0; i < matchedItems.length; i++) selectedIndices.add(i);
    document.querySelectorAll("#resultItems .result-card").forEach(el => {
      const i = Number(el.dataset.index);
      if (selectedIndices.has(i)) el.classList.add("selected");
      else el.classList.remove("selected");
    });

    // ajustar mapa para mostrar a área selecionada
    map.fitBounds(bounds.pad(0.1));
  } else {
    // nada selecionado -> ocultar lista e mostrar alerta modal
    const resultsList = document.getElementById("resultsList");
    if (resultsList) resultsList.style.display = "none";
    showCustomAlert(); // usa o modal já existente
  }
});

// --- Função que popula a lista lateral (reutilizável) ---
function populateResultsList(list) {
  currentFiltered = list.slice();
  const resultsList = document.getElementById("resultsList");
  const resultItems = document.getElementById("resultItems");
  if (!resultsList || !resultItems) return;

  if (list.length === 0) {
    resultsList.style.display = "none";
    return;
  }

  resultsList.style.display = "block";
  resultItems.innerHTML = list
    .map(
      (item, index) => `
      <div class="result-card" data-index="${index}" style="
        padding: 12px 16px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: background 0.15s;
        display:flex;
        flex-direction:column;
      ">
        <strong style="color: #333;">🏫 ${item["Nome da escola (ou extensão se for o caso)"] || "Escola"}</strong>
        <small style="color: #666;">${item.Comunidade || "Comunidade desconhecida"}</small>
      </div>
    `
    )
    .join("");

  // reset selection visual state
  selectedIndices.clear();
  lastClickedIndex = null;
  document.querySelectorAll("#resultItems .result-card.selected").forEach(n => n.classList.remove("selected"));
}

// Expor função de seleção para debug se precisar
window.getSelectedSchools = function() {
  return Array.from(selectedIndices).sort((a,b)=>a-b).map(i => currentFiltered[i]);
};

const applyBtn = document.getElementById("applyFilters");
if (applyBtn) {
  applyBtn.addEventListener("click", function () {
    // keep existing behavior (applyFilters is already wired elsewhere)
    // On small screens, minimize the filter box so the map/results are visible
    if (window.innerWidth <= 600) {
      const filterContent = document.getElementById("filterContent");
      const minimizeBtn = document.getElementById("minimizeBtn");
      const filterBox = document.getElementById("filterBox");

      if (filterContent) filterContent.style.display = "none";
      if (minimizeBtn) minimizeBtn.textContent = "+";
      if (filterBox) filterBox.classList.add("collapsed-filter");
    }
  });
}
