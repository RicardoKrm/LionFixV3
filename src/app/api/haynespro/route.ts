import { NextRequest, NextResponse } from "next/server";

const DEFAULT_HAYNES_URL = "https://www.workshopdata.com/touch/site/layout/login";

function buildHaynesProPortalHtml(targetUrl: string): string {
  const safeTargetUrl = targetUrl.replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HaynesPro WorkshopData™ Car & Commercial Edition</title>
  <style>
    :root {
      --hp-blue: #00549f;
      --hp-blue-dark: #003b73;
      --hp-red: #e30613;
      --hp-bg: #f1f5f9;
      --hp-card: #ffffff;
      --hp-text: #0f172a;
      --hp-muted: #475569;
      --hp-border: #cbd5e1;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--hp-bg);
      color: var(--hp-text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    /* Header HaynesPro WorkshopData */
    .hp-header {
      background: linear-gradient(90deg, #003b73 0%, #00549f 100%);
      color: #fff;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      border-bottom: 3px solid var(--hp-red);
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    }
    .hp-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .hp-logo-badge {
      background: #fff;
      color: var(--hp-blue-dark);
      font-weight: 900;
      font-size: 16px;
      padding: 6px 12px;
      border-radius: 6px;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .hp-logo-badge span {
      color: var(--hp-red);
    }
    .hp-title {
      font-size: 15px;
      font-weight: 700;
    }
    .hp-subtitle {
      font-size: 11px;
      opacity: 0.85;
      display: block;
    }
    .hp-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .hp-nav-btn {
      background: rgba(255,255,255,0.12);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.25);
      padding: 7px 13px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .hp-nav-btn:hover, .hp-nav-btn.active {
      background: #fff;
      color: var(--hp-blue-dark);
    }
    .hp-launch-btn {
      background: var(--hp-red);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(227,6,19,0.4);
    }
    .hp-launch-btn:hover {
      background: #c20410;
    }
    /* Main Container */
    .hp-main {
      padding: 20px;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 20px;
      flex: 1;
    }
    @media (max-width: 960px) {
      .hp-main { grid-template-columns: 1fr; }
    }
    .hp-card {
      background: var(--hp-card);
      border: 1px solid var(--hp-border);
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      overflow: hidden;
      margin-bottom: 16px;
    }
    .hp-card-header {
      background: #f8fafc;
      padding: 12px 16px;
      border-bottom: 1px solid var(--hp-border);
      font-weight: 700;
      font-size: 13px;
      color: var(--hp-blue-dark);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .hp-card-body {
      padding: 16px;
    }
    .hp-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--hp-muted);
      margin-bottom: 5px;
    }
    .hp-input {
      width: 100%;
      padding: 9px 11px;
      border: 1px solid var(--hp-border);
      border-radius: 6px;
      font-size: 13px;
      margin-bottom: 12px;
      outline: none;
    }
    .hp-input:focus {
      border-color: var(--hp-blue);
      box-shadow: 0 0 0 2px rgba(0,84,159,0.15);
    }
    .hp-btn-primary {
      width: 100%;
      background: var(--hp-blue);
      color: #fff;
      border: none;
      padding: 10px 14px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .hp-btn-primary:hover {
      background: var(--hp-blue-dark);
    }
    .hp-btn-outline {
      width: 100%;
      background: #f8fafc;
      color: var(--hp-blue-dark);
      border: 1px solid var(--hp-blue);
      padding: 9px 14px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      margin-top: 8px;
    }
    .hp-btn-outline:hover {
      background: #e0f2fe;
    }
    /* Vehicle Selector Grid */
    .vehicle-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    .vehicle-item {
      border: 1px solid var(--hp-border);
      border-radius: 8px;
      padding: 11px 13px;
      cursor: pointer;
      background: #fff;
      transition: all 0.15s;
      text-align: left;
    }
    .vehicle-item:hover, .vehicle-item.selected {
      border-color: var(--hp-blue);
      background: #f0f9ff;
      box-shadow: 0 2px 6px rgba(0,84,159,0.12);
    }
    .vehicle-item .v-make {
      font-size: 11px;
      font-weight: 800;
      color: var(--hp-blue);
      text-transform: uppercase;
    }
    .vehicle-item .v-model {
      font-size: 13px;
      font-weight: 700;
      color: var(--hp-text);
      margin: 2px 0;
    }
    .vehicle-item .v-engine {
      font-size: 11px;
      color: var(--hp-muted);
      font-family: monospace;
    }
    /* Technical Modules Grid */
    .tech-modules {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 14px;
      margin-top: 14px;
    }
    .module-box {
      border: 1px solid var(--hp-border);
      border-radius: 8px;
      padding: 14px;
      background: #fcfdff;
    }
    .module-box h4 {
      margin: 0 0 8px 0;
      font-size: 13px;
      color: var(--hp-blue-dark);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .module-tag {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 99px;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 700;
    }
    .spec-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .spec-table td {
      padding: 6px 4px;
      border-bottom: 1px solid #f1f5f9;
    }
    .spec-table td:last-child {
      text-align: right;
      font-family: monospace;
      font-weight: 700;
      color: var(--hp-blue-dark);
    }
    .converter-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 8px;
      align-items: center;
      margin-bottom: 10px;
    }
    .badge-live {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #dcfce7;
      color: #166534;
      font-size: 11px;
      padding: 3px 9px;
      border-radius: 999px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <!-- BARRA OFICIAL HAYNESPRO -->
  <header class="hp-header">
    <div class="hp-brand">
      <div class="hp-logo-badge">Haynes<span>Pro</span></div>
      <div>
        <span class="hp-title">WorkshopData™ Car & Commercial Edition</span>
        <span class="hp-subtitle">Base de Datos OEM • VESA™ • SmartFIX™ • Tiempos y Pares de Apriete</span>
      </div>
    </div>
    <div class="hp-nav">
      <button class="hp-launch-btn" onclick="openStandaloneHaynes('${safeTargetUrl}')">
        ↗ Abrir Sesión HaynesPro en Ventana Nueva del Navegador
      </button>
    </div>
  </header>

  <div class="hp-main">
    <!-- COLUMNA IZQUIERDA: ACCESO A CUENTA Y CONVERSORES -->
    <div>
      <!-- LOGIN DIRECTO -->
      <div class="hp-card">
        <div class="hp-card-header">
          <span>Acceso a Cuenta WorkshopData™</span>
          <span class="badge-live">● Online</span>
        </div>
        <div class="hp-card-body">
          <form onsubmit="handleHaynesLogin(event)">
            <label class="hp-label">Usuario / Licencia Distribuidor</label>
            <input type="text" id="hp-user" class="hp-input" placeholder="taller@lionfix.cl" />
            <label class="hp-label">Contraseña</label>
            <input type="password" id="hp-pass" class="hp-input" placeholder="••••••••" />
            <button type="submit" class="hp-btn-primary">
              Iniciar Sesión en Ventana Independiente
            </button>
            <button type="button" class="hp-btn-outline" onclick="openStandaloneHaynes('https://www.workshopdata.com/touch/site/layout/market?language=es')">
              Entrar al Portal Demo / Selección de Idioma
            </button>
          </form>
          <p style="font-size:11px; color:#64748b; margin:12px 0 0 0; line-height:1.45;">
            Al iniciar sesión se abre una <strong>ventana nueva independiente del navegador</strong> con sesión propia para evitar bloqueos de cookies de terceros.
          </p>
        </div>
      </div>

      <!-- CONVERSOR DE UNIDADES HAYNESPRO -->
      <div class="hp-card">
        <div class="hp-card-header">
          <span>Conversor Técnico WorkshopData</span>
          <span style="font-size:11px; color:#64748b;">Nm ⇄ Ft·Lbs / Bar ⇄ PSI</span>
        </div>
        <div class="hp-card-body">
          <label class="hp-label">Torque: Newton-Metro (Nm) a Libras-Pie (Ft·Lbs)</label>
          <div class="converter-row">
            <input type="number" id="nm-in" class="hp-input" style="margin:0" value="180" oninput="convTorque('nm')" />
            <span style="font-weight:700; color:#64748b;">=</span>
            <input type="number" id="ft-in" class="hp-input" style="margin:0" value="132.8" oninput="convTorque('ft')" />
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; color:#64748b; margin-bottom:14px;">
            <span>Nm (Newton-metro)</span>
            <span>Ft·Lbs (Libras-pie)</span>
          </div>

          <label class="hp-label">Presión: Bar a PSI</label>
          <div class="converter-row">
            <input type="number" id="bar-in" class="hp-input" style="margin:0" value="2.5" step="0.1" oninput="convPress('bar')" />
            <span style="font-weight:700; color:#64748b;">=</span>
            <input type="number" id="psi-in" class="hp-input" style="margin:0" value="36.3" step="0.1" oninput="convPress('psi')" />
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; color:#64748b;">
            <span>Bar</span>
            <span>PSI (Libras/pulg²)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- COLUMNA DERECHA: BUSCADOR POR VIN / MOTOR Y DATOS TÉCNICOS INTERACTIVOS -->
    <div>
      <div class="hp-card">
        <div class="hp-card-header">
          <span>Identificación de Vehículo (VIN / Código de Motor / TecDoc / KBA)</span>
          <span style="font-size:11px; color:#00549f; font-weight:700;">Catálogo Integrado</span>
        </div>
        <div class="hp-card-body">
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <input
              type="text"
              id="vin-search"
              class="hp-input"
              style="flex:1; margin:0; min-width:220px;"
              placeholder="Ingresa VIN (17 dígitos), código de motor (ej. OM651, 1GD-FTV, PUMA) o modelo..."
              oninput="filterVehicles(this.value)"
            />
            <button
              type="button"
              class="hp-btn-primary"
              style="width:auto; padding:0 18px;"
              onclick="searchExternalVin()"
            >
              Buscar en WorkshopData Cloud ↗
            </button>
          </div>

          <div class="vehicle-list" id="vehicle-grid"></div>
        </div>
      </div>

      <!-- FICHA TÉCNICA HAYNESPRO DEL VEHÍCULO SELECCIONADO -->
      <div class="hp-card">
        <div class="hp-card-header">
          <span id="active-v-title">Datos Técnicos OEM — Mercedes-Benz Sprinter 415/515 CDI (OM651)</span>
          <button
            type="button"
            class="hp-launch-btn"
            style="padding:5px 12px; font-size:11px;"
            onclick="openStandaloneHaynes('${safeTargetUrl}')"
          >
            Abrir Diagramas Completos en Ventana Nueva ↗
          </button>
        </div>
        <div class="hp-card-body">
          <div class="tech-modules" id="active-v-modules"></div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const VEHICLES = [
      {
        id: "om651",
        make: "Mercedes-Benz",
        model: "Sprinter 315 / 415 / 515 CDI (906/907)",
        engine: "OM651.955 • 2143 cc • 110 kW (150 HP)",
        torques: [
          ["Culata Etapa 1 / 2 / 3", "60 Nm + 90° + 90°"],
          ["Bancada de Cigüeñal", "65 Nm + 90°"],
          ["Tapas de Biela", "25 Nm + 90°"],
          ["Inyectores Piezoeléctricos (Brida)", "7 Nm + 90° + 90°"],
          ["Tuercas de Rueda", "180 Nm"],
          ["Portacaliper Freno Del.", "170 Nm"]
        ],
        fluids: [
          ["Aceite Motor (con filtro)", "11.5 L (MB 229.52 5W-30)"],
          ["Refrigerante Motor", "10.0 L (MB 325.5)"],
          ["Caja Manual 6 Vel.", "1.8 L (MB 235.10)"],
          ["Diferencial Trasero", "1.6 L (75W-90)"],
          ["Líquido de Frenos", "1.2 L (DOT 4+)"]
        ],
        vesa: [
          ["P0299 - Presión Turbo Baja", "Verificar solenoide vacío Y77/1 y mangueras intercooler"],
          ["P2002 - Eficiencia DPF bajo umbral", "Revisar sensor presión diferencial B28/8 y regeneración"],
          ["Distribución", "Cadena Dúplex trasera (revisar tensor hidráulico)"]
        ]
      },
      {
        id: "1gd",
        make: "Toyota",
        model: "Hilux 2.8 D-4D 4x4 (GUN126)",
        engine: "1GD-FTV • 2755 cc • 150 kW (204 HP)",
        torques: [
          ["Culata Etapa 1 / 2 / 3", "49 Nm + 90° + 90°"],
          ["Bancadas de Cigüeñal", "50 Nm + 90°"],
          ["Tapas de Biela", "35 Nm + 90°"],
          ["Polea Damper Cigüeñal", "260 Nm"],
          ["Tuercas de Rueda", "110 Nm"],
          ["Tuerca Maza Delantera", "274 Nm"]
        ],
        fluids: [
          ["Aceite Motor (con filtro)", "7.5 L (5W-30 ACEA C2)"],
          ["Refrigerante SLLC", "8.6 L (Rosa Long Life)"],
          ["Caja Manual / Automática", "2.2 L / 9.5 L (ATF WS)"],
          ["Diferencial Trasero", "3.2 L (75W-85 GL-5)"]
        ],
        vesa: [
          ["P2463 - Acumulación Hollín DPF", "Verificar 5to inyector de escape y sensor temp. EGT"],
          ["P0087 - Presión Riel Baja", "Comprobar válvula SCV en bomba de alta presión"],
          ["Distribución", "Cadena doble con patines guía hidráulicos"]
        ]
      },
      {
        id: "puma22",
        make: "Peugeot / Citroën",
        model: "Boxer / Jumper 2.2 BlueHDi",
        engine: "DW12RUD / Puma 2.2 • 103 kW (140 HP)",
        torques: [
          ["Culata Etapa 1 / 2 / 3", "20 Nm + 40 Nm + 260°"],
          ["Tapas de Biela", "25 Nm + 70°"],
          ["Volante Motor Bimasa", "48 Nm + 45°"],
          ["Tuercas de Rueda (Chasis Light/Heavy)", "160 Nm / 180 Nm"]
        ],
        fluids: [
          ["Aceite Motor (con filtro)", "6.2 L (0W-30 B71 2312)"],
          ["Refrigerante", "9.5 L (Glysantin G33)"],
          ["Transmisión Manual ML6C", "2.4 L (75W-80)"],
          ["Depósito AdBlue (UREA)", "15.0 L (ISO 22241)"]
        ],
        vesa: [
          ["P20EE - Eficiencia SCR NOx", "Comprobar presión bomba AdBlue (5 bar) e inyector urea"],
          ["P0234 - Sobrepresión Turbo", "Revisar actuador electrónico de geometría variable"]
        ]
      },
      {
        id: "amarok",
        make: "Volkswagen",
        model: "Amarok 2.0 BiTDI 4Motion",
        engine: "CDCA / CNEA • 1968 cc • 132 kW (180 HP)",
        torques: [
          ["Culata Etapa 1 / 2 / 3 / 4", "35 Nm + 60 Nm + 90° + 90°"],
          ["Tornillo Inyector Common Rail", "12 Nm + 270°"],
          ["Ruedas Aleación", "180 Nm"],
          ["Perno Caliper Freno", "190 Nm"]
        ],
        fluids: [
          ["Aceite Motor", "7.0 L (VW 507 00 5W-30)"],
          ["Caja Automática ZF 8HP45", "9.0 L (ATF G 060 162)"],
          ["Refrigerante", "9.0 L (G12++ / G13)"]
        ],
        vesa: [
          ["Correa Distribución", "Reemplazo cada 120.000 km con bomba de agua"],
          ["P0401 - Flujo EGR Insuficiente", "Limpieza o reemplazo de enfriador + válvula EGR"]
        ]
      }
    ];

    let selectedId = VEHICLES[0].id;

    function openStandaloneHaynes(url) {
      const target = url || "${safeTargetUrl}";
      const w = Math.min(1440, window.screen.availWidth - 80);
      const h = Math.min(900, window.screen.availHeight - 80);
      const left = Math.max(20, Math.round((window.screen.availWidth - w) / 2));
      const top = Math.max(20, Math.round((window.screen.availHeight - h) / 2));
      window.open(
        target,
        "HaynesProSession_" + Date.now(),
        "popup=yes,width=" + w + ",height=" + h + ",left=" + left + ",top=" + top + ",menubar=yes,toolbar=yes,location=yes,status=yes,resizable=yes,scrollbars=yes,noopener=yes,noreferrer=yes"
      );
    }

    function handleHaynesLogin(e) {
      e.preventDefault();
      openStandaloneHaynes("https://www.workshopdata.com/touch/site/layout/login");
    }

    function searchExternalVin() {
      openStandaloneHaynes("https://www.workshopdata.com/touch/site/layout/market?language=es");
    }

    function selectVehicle(id) {
      selectedId = id;
      renderVehicles(document.getElementById("vin-search").value);
      renderActiveModules();
    }

    function filterVehicles(q) {
      renderVehicles(q);
    }

    function renderVehicles(query = "") {
      const grid = document.getElementById("vehicle-grid");
      const q = (query || "").toLowerCase();
      const list = VEHICLES.filter(v =>
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.engine.toLowerCase().includes(q)
      );
      grid.innerHTML = list.map(v => \`
        <div class="vehicle-item \${v.id === selectedId ? 'selected' : ''}" onclick="selectVehicle('\${v.id}')">
          <div class="v-make">\${v.make}</div>
          <div class="v-model">\${v.model}</div>
          <div class="v-engine">\${v.engine}</div>
        </div>
      \`).join("");
    }

    function renderActiveModules() {
      const v = VEHICLES.find(x => x.id === selectedId) || VEHICLES[0];
      document.getElementById("active-v-title").textContent = "Datos Técnicos OEM — " + v.make + " " + v.model;
      const container = document.getElementById("active-v-modules");
      container.innerHTML = \`
        <div class="module-box">
          <h4><span>🔧 Pares de Apriete OEM</span><span class="module-tag">Torque</span></h4>
          <table class="spec-table">
            \${v.torques.map(r => \`<tr><td>\${r[0]}</td><td>\${r[1]}</td></tr>\`).join("")}
          </table>
        </div>
        <div class="module-box">
          <h4><span>💧 Capacidades y Lubricantes</span><span class="module-tag">SmartLUBE</span></h4>
          <table class="spec-table">
            \${v.fluids.map(r => \`<tr><td>\${r[0]}</td><td>\${r[1]}</td></tr>\`).join("")}
          </table>
        </div>
        <div class="module-box">
          <h4><span>⚡ Diagnóstico VESA™ & SmartFIX™</span><span class="module-tag">Boletines</span></h4>
          <table class="spec-table">
            \${v.vesa.map(r => \`<tr><td><strong>\${r[0]}</strong></td><td style="font-family:sans-serif; font-weight:500; color:#334155;">\${r[1]}</td></tr>\`).join("")}
          </table>
        </div>
      \`;
    }

    function convTorque(source) {
      const nm = document.getElementById("nm-in");
      const ft = document.getElementById("ft-in");
      if (source === "nm") {
        ft.value = (parseFloat(nm.value || 0) * 0.737562).toFixed(1);
      } else {
        nm.value = (parseFloat(ft.value || 0) / 0.737562).toFixed(1);
      }
    }

    function convPress(source) {
      const bar = document.getElementById("bar-in");
      const psi = document.getElementById("psi-in");
      if (source === "bar") {
        psi.value = (parseFloat(bar.value || 0) * 14.5038).toFixed(1);
      } else {
        bar.value = (parseFloat(psi.value || 0) / 14.5038).toFixed(2);
      }
    }

    renderVehicles();
    renderActiveModules();
  </script>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url") || DEFAULT_HAYNES_URL;
  let targetUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  // Si la URL es de workshopdata.com o haynespro.com (que bloquean iframes de terceros y sesiones cross-site),
  // renderizamos el portal interactivo HaynesPro WorkshopData directamente en el visor con lanzador de sesión independiente.
  const lower = targetUrl.toLowerCase();
  if (
    lower.includes("workshopdata.com") ||
    lower.includes("haynespro.com") ||
    lower.includes("infopro-digital")
  ) {
    return new NextResponse(buildHaynesProPortalHtml(targetUrl), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  // Para cualquier otra URL técnica personalizada, hacer proxy seguro
  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });
    const finalUrl = response.url || targetUrl;
    const finalOrigin = new URL(finalUrl).origin;
    let html = await response.text();
    html = html.replace(/(href|src|action)=["']\/(?!\/)/gi, `$1="${finalOrigin}/`);
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (m) => `${m}<base href="${finalUrl}" />`);
    }
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return new NextResponse(buildHaynesProPortalHtml(targetUrl), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
