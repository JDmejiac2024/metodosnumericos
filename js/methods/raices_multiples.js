// js/methods/raicesMultiples.js

let chartInstance = null;
let raicesEncontradasGlobal = []; 
let raicesUnicasGlobal = []; // Para evitar duplicados en la gráfica y resumen

function calcularRaicesMultiples() {
    const funcStr = document.getElementById('func').value;
    
    const deriv1Input = document.getElementById('deriv1');
    const deriv2Input = document.getElementById('deriv2');
    
    const xMinInput = parseFloat(document.getElementById('xMin').value);
    const xMaxInput = parseFloat(document.getElementById('xMax').value);
    const pasoInput = parseFloat(document.getElementById('paso').value);
    let tol = parseFloat(document.getElementById('tol').value) || 0.0001;
    
    const tablasContainer = document.getElementById('tablas-container');
    const msgError = document.getElementById('error-msg');
    const pasoDiv = document.getElementById('paso-a-paso');
    const rootResult = document.getElementById('root-result');

    tablasContainer.innerHTML = '';
    msgError.textContent = '';
    pasoDiv.textContent = '';
    rootResult.textContent = '';
    raicesEncontradasGlobal = [];
    raicesUnicasGlobal = [];

    if (!funcStr || isNaN(xMinInput) || isNaN(xMaxInput) || isNaN(pasoInput)) {
        msgError.textContent = "Error: Faltan datos (Función o configuración de rango).";
        return;
    }

    if (pasoInput <= 0) {
        msgError.textContent = "Error: El paso debe ser mayor a 0.";
        return;
    }

    if (tol > 0.00001) tol = 0.00001; 

    try {
        // --- CÁLCULO AUTOMÁTICO DE DERIVADAS ---
        let deriv1Str = math.derivative(funcStr, 'x').toString();
        let deriv1Visual = deriv1Str;
        try { deriv1Visual = math.rationalize(deriv1Str).toString(); } catch (e) {} 
        deriv1Visual = deriv1Visual.replace(/\s*\*\s*/g, '').replace(/\s+/g, ' '); 
        deriv1Input.value = deriv1Visual; 

        let deriv2Str = math.derivative(deriv1Str, 'x').toString();
        let deriv2Visual = deriv2Str;
        try { deriv2Visual = math.rationalize(deriv2Str).toString(); } catch (e) {} 
        deriv2Visual = deriv2Visual.replace(/\s*\*\s*/g, '').replace(/\s+/g, ' '); 
        deriv2Input.value = deriv2Visual; 

        const f = (x) => math.evaluate(funcStr, { x: x });
        const df = (x) => math.evaluate(deriv1Str, { x: x });
        const d2f = (x) => math.evaluate(deriv2Str, { x: x });

        let pasosLog = "--- ETAPA 1: ESCANEO DE INTERVALOS ---\n";
        pasosLog += `Rango: [${xMinInput}, ${xMaxInput}], Paso: ${pasoInput}\n\n`;

        // --- 1. ESCANEO DE LA FUNCIÓN ---
        let evaluaciones = [];
        for (let x = xMinInput; x <= xMaxInput; x += pasoInput) {
            let x_round = parseFloat(x.toFixed(4)); 
            let f_val = f(x_round);
            evaluaciones.push({ x: x_round, f: f_val });
            pasosLog += `  f(${x_round}) = ${f_val.toFixed(4)}\n`;
        }

        // --- 2. BÚSQUEDA DE CAMBIOS DE SIGNO ---
        let intervalosDetectados = [];
        pasosLog += `\nBuscando cambios de signo...\n`;
        for (let i = 0; i < evaluaciones.length - 1; i++) {
            let actual = evaluaciones[i];
            let siguiente = evaluaciones[i+1];

            if (actual.f * siguiente.f <= 0) {
                intervalosDetectados.push([actual.x, siguiente.x]);
                pasosLog += `  -> Cambio detectado entre [${actual.x} y ${siguiente.x}]\n`;
            }
        }

        if (intervalosDetectados.length === 0) {
            msgError.textContent = "No se encontraron cambios de signo en el rango proporcionado.";
            pasoDiv.textContent = pasosLog;
            return;
        }

        // --- 3. APLICAR MÉTODO A CADA EXTREMO DEL INTERVALO ---
        pasosLog += `\n--- ETAPA 2: CÁLCULO DE RAÍCES ---\n`;
        let htmlTablas = "";
        let maxIter = 100;
        let numeroTabla = 1;

        intervalosDetectados.forEach((intervalo) => {
            // Evaluamos ambos límites del intervalo: x0 y x1
            let extremos = [intervalo[0], intervalo[1]];

            extremos.forEach((xi_inicial) => {
                let xi = xi_inicial; 
                let error = 100;
                let iter = 0;
                let xi_new = 0;
                
                pasosLog += `\nGenerando Tabla ${numeroTabla} (Iniciando en xi = ${xi})...\n`;

                htmlTablas += `
                    <div style="margin-bottom: 20px; border: 1px solid var(--border); padding: 10px; border-radius: 5px;">
                    <h4 style="color: var(--primary-dark); margin-bottom: 10px;">Tabla ${numeroTabla}: Iniciando en x_i = ${xi_inicial} (Intervalo [${intervalo[0]}, ${intervalo[1]}])</h4>
                    <table class="tabla-raiz" id="tabla-raiz-${numeroTabla}" style="width: 100%; border-collapse: collapse;">
                        <thead style="background-color: var(--primary-dark); color: white;">
                            <tr>
                                <th style="padding: 8px;">i</th>
                                <th style="padding: 8px;">xi</th>
                                <th style="padding: 8px;">f(xi)</th>
                                <th style="padding: 8px;">f'(xi)</th>
                                <th style="padding: 8px;">f''(xi)</th>
                                <th style="padding: 8px;">xr</th>
                                <th style="padding: 8px;">Tol</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                let filasTabla = "";

                while (error > tol && iter < maxIter) {
                    const f_xi = f(xi);
                    
                    if (Math.abs(f_xi) < 1e-12) {
                        error = 0;
                        filasTabla += `<tr>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center;">${iter + 1}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center;">${xi.toFixed(4)}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center;">0.0000</td>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center;">-</td>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center;">-</td>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center; font-weight:bold; color:#2C3E50">${xi.toFixed(4)}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center;">0.0000</td>
                        </tr>`;
                        break; 
                    }

                    const df_xi = df(xi);
                    const d2f_xi = d2f(xi);

                    const numerador = f_xi * df_xi;
                    const denominador = Math.pow(df_xi, 2) - (f_xi * d2f_xi);

                    if (Math.abs(denominador) < 1e-12) {
                        if(Math.abs(f_xi) < tol * 10) { error = 0; break; }
                        pasosLog += `  CRITICAL: Denominador 0 en iteración ${iter+1}.\n`;
                        break;
                    }

                    xi_new = xi - (numerador / denominador);

                    let tolCalculada = 0;
                    if (iter > 0) {
                        let xiVisual = parseFloat(xi.toFixed(4));
                        let xi_newVisual = parseFloat(xi_new.toFixed(4));
                        tolCalculada = Math.abs(xiVisual - xi_newVisual);
                        if (Math.abs(tolCalculada) < 1e-10) tolCalculada = 0;
                        error = tolCalculada;
                        if (parseFloat(error.toFixed(4)) === 0) error = 0; 
                    } else {
                        error = 100;
                    }

                    filasTabla += `
                        <tr>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center;">${iter + 1}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center;">${xi.toFixed(4)}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center;">${f_xi.toFixed(4)}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center;">${df_xi.toFixed(4)}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center;">${d2f_xi.toFixed(4)}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center; font-weight:bold; color:#2C3E50">${xi_new.toFixed(4)}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #ddd; text-align:center;">${iter === 0 ? '-' : tolCalculada.toFixed(4)}</td>
                        </tr>
                    `;

                    xi = xi_new;
                    iter++;
                }

                htmlTablas += filasTabla + `</tbody></table></div>`;
                raicesEncontradasGlobal.push(xi); 
                pasosLog += `  -> Raíz convergente: ${xi.toFixed(4)}\n`;
                
                numeroTabla++;
            });
        });

        tablasContainer.innerHTML = htmlTablas;

        // --- FILTRO DE RAÍCES ÚNICAS ---
        // Como ambas tablas de un intervalo apuntan a la misma raíz, filtramos los duplicados
        raicesEncontradasGlobal.forEach(r => {
            if (!raicesUnicasGlobal.some(ru => Math.abs(ru - r) < 1e-3)) {
                raicesUnicasGlobal.push(r);
            }
        });

        pasosLog += `\n--- FIN DEL PROCESO ---\nSe calcularon ${numeroTabla - 1} tablas y se encontraron ${raicesUnicasGlobal.length} raíces únicas.`;
        pasoDiv.textContent = pasosLog;
        
        // Mostrar solo las raíces únicas en el resumen superior
        let resumenTexto = "Raíces únicas encontradas: ";
        rootResult.textContent = resumenTexto + raicesUnicasGlobal.map(r => r.toFixed(4)).join(", ");
        
        generarGrafica(funcStr, xMinInput, xMaxInput);

    } catch (e) {
        msgError.textContent = "Error matemático: Revisa la sintaxis de la función original.";
        console.error(e);
    }
}

function borrarDatos() {
    document.getElementById('func').value = '';
    document.getElementById('deriv1').value = '';
    document.getElementById('deriv2').value = '';
    document.getElementById('xMin').value = '-5';
    document.getElementById('xMax').value = '5';
    document.getElementById('paso').value = '1';
    document.getElementById('tol').value = '0.0001';
    document.getElementById('tablas-container').innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">Inicia el cálculo para generar las tablas.</p>';
    document.getElementById('error-msg').textContent = '';
    document.getElementById('paso-a-paso').textContent = '';
    document.getElementById('root-result').textContent = '';
    raicesEncontradasGlobal = [];
    raicesUnicasGlobal = [];
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}

function generarGrafica(funcStr, minX, maxX) {
    const ctx = document.getElementById('graficaError').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    const f = (x) => {
        try { return math.evaluate(funcStr, {x: x}); } 
        catch { return null; }
    };

    let labels = [];
    let dataY = [];
    let stepGraph = (maxX - minX) / 100; 

    for(let x = minX; x <= maxX; x += stepGraph){
        labels.push(x.toFixed(2));
        dataY.push(f(x));
    }

    // Usamos el arreglo de raíces únicas para graficar los puntos rojos
    let puntosRaices = raicesUnicasGlobal.map(r => ({ x: r, y: f(r) }));

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'f(x)',
                    data: dataY,
                    borderColor: '#2F6DB3', 
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Raíces Encontradas',
                    data: puntosRaices,
                    type: 'scatter',
                    backgroundColor: '#D64545', 
                    pointRadius: 6,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Eje X',
                    data: new Array(labels.length).fill(0),
                    borderColor: '#000',
                    borderWidth: 1,
                    pointRadius: 0,
                    borderDash: [5, 5]
                }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: { 
                x: { type: 'linear', position: 'bottom', min: minX, max: maxX },
                y: { title: { display: true, text: 'f(x)' } }
            } 
        }
    });
}

function exportarPDF() {
    const tablas = document.querySelectorAll('.tabla-raiz');
    if (tablas.length === 0) { alert("No hay tablas generadas para exportar."); return; }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18); doc.setTextColor(31, 58, 95);
    doc.text("Reporte: Raíces Múltiples (Múltiples Intervalos)", 14, 20);
    
    doc.setFontSize(11); doc.setTextColor(0);
    doc.text(`Función: ${document.getElementById('func').value}`, 14, 30);
    doc.text(`f'(x): ${document.getElementById('deriv1').value}  |  f''(x): ${document.getElementById('deriv2').value}`, 14, 36);
    doc.text(document.getElementById('root-result').textContent, 14, 42);

    let finalY = 50;

    tablas.forEach((tabla, index) => {
        doc.setFontSize(12); doc.setTextColor(31, 58, 95);
        // Título ajustado para el PDF
        doc.text(`Tabla ${index + 1}`, 14, finalY);
        
        doc.autoTable({ 
            html: `#${tabla.id}`, 
            startY: finalY + 5, 
            theme: 'grid', 
            headStyles: { fillColor: [31, 58, 95] },
            styles: { fontSize: 8, cellPadding: 2 } 
        });
        
        finalY = doc.lastAutoTable.finalY + 15;

        if (finalY > doc.internal.pageSize.height - 30) {
            doc.addPage();
            finalY = 20;
        }
    });

    const canvas = document.getElementById('graficaError');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = 80;

        if (finalY + imgHeight > doc.internal.pageSize.height) { 
            doc.addPage(); 
            finalY = 20; 
        }
        
        doc.setFontSize(14); doc.setTextColor(31, 58, 95); 
        doc.text("Gráfica Integrada de Raíces", 14, finalY);
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, imgHeight);
    }
    
    doc.save("RaicesMultiples_Completo.pdf");
}