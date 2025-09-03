// Initialize the map
var map = L.map("map").setView([-15.78, -47.93], 5);
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
    // Add more mappings as needed
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

// Load CSV file and parse it
fetch("Escola Quilombo.csv")
  .then((response) => response.text())
  .then((csvText) => {
    const parsed = Papa.parse(csvText, { header: true });
    const parsedData = parsed.data;

    parsedData.forEach((item) => {
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
          // Build popup content with all fields
          let popupContent = `<b>${
            item["Nome da escola (ou extensão se for o caso)"] || "Escola"
          }</b><br>`;
          popupContent += `<b>Comunidade:</b> ${item.Comunidade || ""}<br>`;
          popupContent += `<b>Abrangência:</b> ${item.Abrangência || ""}<br>`;
          popupContent += `<b>Nível:</b> ${item.Nível || ""}<br>`;
          popupContent += `<b>Quantidade de estudantes:</b> ${
            item["Quantidade de estudantes"] || ""
          }<br>`;
          popupContent += `<b>Quantidade de professores efetivos:</b> ${
            item["Quantidade de professores efetivos"] || ""
          }<br>`;
          popupContent += `<b>Quantidade de professores temporários:</b> ${
            item["Quantidade de professores temporários"] || ""
          }<br>`;
          popupContent += `<b>Professores formados pela LEdoC:</b> ${
            item["Professores formados pela LEdoC trabalhando na escola"] || ""
          }<br>`;
          popupContent += `<b>Melhor forma de chegar:</b> ${
            item["Qual a melhor forma de chegar até a escola?"] || ""
          }<br>`;
          popupContent += `<b>Distância até a sede:</b> ${
            item["Distância até a sede "] || ""
          }<br>`;
          popupContent += `<b>Turnos em que a escola funciona:</b> ${
            item["Turnos em que a escola funciona"] || ""
          }<br>`;
          popupContent += `<b>Distância até a CRE:</b> ${
            item["Distância até a CRE"] || ""
          }<br>`;
          popupContent += `<b>Tempo de deslocamento da escola até a CRE:</b> ${
            item["Tempo de deslocamento da escola até a CRE"] || ""
          }<br>`;
          popupContent += `<b>Quantidade de estudantes transportados:</b> ${
            item[
              "Quantidade de estudantes transportados pelo transporte da escola"
            ] || ""
          }<br>`;
          popupContent += `<b>Tempo médio de deslocamento dos estudantes:</b> ${
            item["Tempo médio de deslocamento dos estudantes"] || ""
          }<br>`;
          popupContent += `<b>Localização:</b> ${
            item[
              "Se possível, insira aqui o link com o localizador da escola, ou as coordenadas de latitude e longitude da escola"
            ] || ""
          }<br>`;
          popupContent += `<b>Comentários:</b> ${
            item["Se tiver sugestoes ou comentários, escreva aqui"] || ""
          }<br>`;

          const marker = L.marker(coords).addTo(map);
          marker.bindPopup(popupContent);
        }
      }
    });
  })
  .catch((error) => {
    console.error("Erro ao carregar CSV:", error);
  });

// Usage example:
// const csvText = ... // load your CSV as string
// const parsedData = parseAndFixCsv(csvText);
