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

function addMarkers(data) {
  // Remove previous markers
  allMarkers.forEach((marker) => map.removeLayer(marker));
  allMarkers = [];

  data.forEach((item) => {
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

        const marker = L.marker(coords).addTo(map);
        marker.bindPopup(popupContent, {
          maxWidth: 350,
          className: "custom-popup",
        });
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

  addMarkers(filtered);

  // Show results list
  const resultsList = document.getElementById("resultsList");
  const resultItems = document.getElementById("resultItems");
  
  if (filtered.length > 0) {
    resultsList.style.display = "block";
    resultItems.innerHTML = filtered
      .map(
        (item, index) => `
          <div class="result-card" style="
            padding: 12px 16px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background 0.2s;
          " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='transparent'" onclick="showSchoolPopup(${index}, ${JSON.stringify(filtered).replace(/"/g, '&quot;')})">
            <strong style="color: #333;">🏫 ${item["Nome da escola (ou extensão se for o caso)"] || "Escola"}</strong><br>
            <small style="color: #666;">${item.Comunidade || "Comunidade desconhecida"}</small>
          </div>
        `
      )
      .join("");
    
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

function showSchoolPopup(index, filteredData) {
  const item = filteredData[index];
  
  // Find and click the corresponding marker
  const coords = item[
    "Se possível, insira aqui o link com o localizador da escola, ou as coordenadas de latitude e longitude da escola"
  ]
    .split(",")
    .map((v) => Number(v.trim()));
  
  // Find marker and open popup
  allMarkers.forEach((marker) => {
    if (marker.getLatLng().lat === coords[0] && marker.getLatLng().lng === coords[1]) {
      marker.openPopup();
    }
  });
}
