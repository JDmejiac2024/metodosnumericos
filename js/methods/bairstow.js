// JavaScript Document
// js/methods/bairstow.js

let chartInstance = null;
let raicesGlobales = []; // Para guardar en el PDF

// 1. Generar inputs para coeficientes
function generarInputsCoeficientes() {
    const grado = parseInt(document.getElementById('grado').value);
    const container = document.getElementById('coef-container');
    
    if (grado < 2) {
        alert("El grado debe ser al menos 2.");
        return;
    }

    let html = '<p style="margin-bottom:10px; font-size:0.9rem; color:var(--text-secondary);">Ingrese coeficientes: a<sub>n</sub>x<sup>n</sup> + ... + a<sub>0</sub></p>';
    html += '<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">';

    for (let i = grado; i >= 0; i--) {
        html += `<div style="display:flex; flex-direction:column; align-items:center;">
                    <label style="font-size:0.8em; margin-bottom:2px;">x<sup>${i}</sup></label>
                    <input type="number" id="coef_${i}" class="matrix-input" value="1" style="width: 70px;">
                 </div>`;
        if (i > 0) html += '<span style="font-size:1.2em; font-weight:bold;">+</span>';
    }
    html += '</div>';
    container.innerHTML = html;
}

// 2. Función Principal: Bairstow
function calcularBairstow() {
    const grado = parseInt(document.getElementById('grado').value);
    const r0 = parseFloat(document.getElementById('valR').value) || 0;
    const s0 = parseFloat(document.getElementById('valS').value) || 0;
    const tol = parseFloat(document.getElementById('tol').value) || 0.0001;
    const maxIter = parseInt(document.getElementById('maxIter').value) || 100;

    const tablaBody = document.querySelector('#tabla-raices tbody');
    const msgError = document.getElementById('error-msg');
    const divPasos = document.getElementById('paso-a-paso');
    const divPoly = document.getElementById('polinomio-display');

    // Limpieza
    tablaBody.innerHTML = '';
    msgError.textContent = '';
    divPasos.textContent = '';
    raicesGlobales = [];

    // Obtener coeficientes
    let a = []; // Coeficientes originales
    try {
        for (let i = grado; i >= 0; i--) {
            let val = document.getElementById(`coef_${i}`).value;
            if (val === '') throw new Error("Faltan coeficientes.");
            a.push(parseFloat(val));
        }
    } catch (e) {
        msgError.textContent = e.message;
        return;
    }

    // Mostrar polinomio original
    divPoly.innerHTML = "P(x) = " + construirPolinomioStr(a);

    let n = a.length - 1; // Grado actual
    let coefs = [...a]; // Copia para trabajar (se irá reduciendo)
    let raices = [];
    let log = "--- INICIO MÉTODO DE BAIRSTOW ---\n\n";

    let iterTotal = 0;

    // --- BUCLE PRINCIPAL (Deflación) ---
    while (n >= 3) {
        let r = r0;
        let s = s0;
        let iter = 0;
        let ea_r = 100;
        let ea_s = 100;
        
        log += `>>> Buscando factor cuadrático para grado ${n}...\n`;

        // Iteración para encontrar r y s (Newton-Raphson Multivariable)
        while ((ea_r > tol || ea_s > tol) && iter < maxIter) {
            let b = new Array(n + 1).fill(0);
            let c = new Array(n + 1).fill(0);

            // División sintética para obtener b (coefs del polinomio)
            b[0] = coefs[0];
            b[1] = coefs[1] + r * b[0];
            for (let i = 2; i <= n; i++) {
                b[i] = coefs[i] + r * b[i-1] + s * b[i-2];
            }

            // División sintética para obtener c (derivadas parciales)
            c[0] = b[0];
            c[1] = b[1] + r * c[0];
            for (let i = 2; i < n; i++) {
                c[i] = b[i] + r * c[i-1] + s * c[i-2];
            }

            // Sistema de ecuaciones para dr y ds
            // c[n-2]*dr + c[n-3]*ds = -b[n-1]
            // c[n-1]*dr + c[n-2]*ds = -b[n]
            
            let det = c[n-2] * c[n-2] - c[n-1] * c[n-3];
            
            if (Math.abs(det) < 1e-12) {
                log += "  ! Determinante cercano a cero. Ajustando r, s aleatoriamente.\n";
                r += 0.1; s += 0.1; // Perturbación simple
                det = 1; // Evitar división por cero en siguiente paso (falso pero permite continuar)
                continue; 
            }

            let dr = (-b[n-1] * c[n-2] - (-b[n]) * c[n-3]) / det;
            let ds = (c[n-2] * (-b[n]) - c[n-1] * (-b[n-1])) / det;

            r = r + dr;
            s = s + ds;

            if (r !== 0) ea_r = Math.abs(dr / r) * 100;
            if (s !== 0) ea_s = Math.abs(ds / s) * 100;

            iter++;
        }

        log += `  Factor encontrado: x² - (${r.toFixed(4)})x - (${s.toFixed(4)}) en ${iter} it.\n`;

        // Calcular 2 raíces del factor cuadrático: x^2 - rx - s = 0
        let [x1, x2] = resolverCuadratica(1, -r, -s);
        raices.push(x1, x2);
        
        log += `  Raíces: ${formatoComplejo(x1)}, ${formatoComplejo(x2)}\n\n`;

        // Deflación: El nuevo polinomio son los coeficientes 'b' (sin los residuos)
        // b tiene n+1 elementos. b[n] y b[n-1] son residuos.
        // El nuevo grado es n-2.
        let nuevosCoefs = [];
        // División sintética final con los r, s óptimos para asegurar precisión
        let b = new Array(n + 1).fill(0);
        b[0] = coefs[0];
        b[1] = coefs[1] + r * b[0];
        for (let i = 2; i <= n; i++) {
            b[i] = coefs[i] + r * b[i-1] + s * b[i-2];
        }
        
        for (let i = 0; i <= n - 2; i++) {
            nuevosCoefs.push(b[i]);
        }
        coefs = nuevosCoefs;
        n = n - 2;
    }

    // --- RESOLVER RESTO (Cuadrático o Lineal) ---
    if (n === 2) {
        log += `>>> Resolviendo cuadrática final: ${coefs[0]}x² + ${coefs[1]}x + ${coefs[2]}\n`;
        let [x1, x2] = resolverCuadratica(coefs[0], coefs[1], coefs[2]);
        raices.push(x1, x2);
        log += `  Raíces: ${formatoComplejo(x1)}, ${formatoComplejo(x2)}\n`;
    } else if (n === 1) {
        log += `>>> Resolviendo lineal final: ${coefs[0]}x + ${coefs[1]}\n`;
        // ax + b = 0  ->  x = -b/a
        let val = -coefs[1] / coefs[0];
        raices.push({re: val, im: 0});
        log += `  Raíz: ${val.toFixed(5)}\n`;
    }

    // --- MOSTRAR RESULTADOS ---
    divPasos.textContent = log;
    raicesGlobales = raices; // Guardar para PDF

    raices.forEach((r, i) => {
        tablaBody.innerHTML += `
            <tr>
                <td>x${i+1}</td>
                <td>${r.re.toFixed(6)}</td>
                <td>${r.im.toFixed(6)}i</td>
            </tr>
        `;
    });

    generarGraficaBairstow(a);
}

// Auxiliares
function resolverCuadratica(a, b, c) {
    let disc = b*b - 4*a*c;
    let r1, r2;
    if (disc >= 0) {
        r1 = { re: (-b + Math.sqrt(disc))/(2*a), im: 0 };
        r2 = { re: (-b - Math.sqrt(disc))/(2*a), im: 0 };
    } else {
        r1 = { re: -b/(2*a), im: Math.sqrt(-disc)/(2*a) };
        r2 = { re: -b/(2*a), im: -Math.sqrt(-disc)/(2*a) };
    }
    return [r1, r2];
}

function formatoComplejo(n) {
    if (Math.abs(n.im) < 1e-6) return n.re.toFixed(5);
    return `${n.re.toFixed(5)} ${n.im >= 0 ? '+' : '-'} ${Math.abs(n.im).toFixed(5)}i`;
}

function construirPolinomioStr(a) {
    let str = "";
    let n = a.length - 1;
    for (let i = 0; i <= n; i++) {
        let coef = a[i];
        if (coef === 0) continue;
        let signo = (coef >= 0 && i !== 0) ? " + " : " ";
        let exp = (n - i) > 1 ? `x^${n-i}` : ((n-i) === 1 ? "x" : "");
        str += `${signo}${coef}${exp}`;
    }
    return str;
}

function generarGraficaBairstow(coefs) {
    const ctx = document.getElementById('graficaBairstow').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    // Evaluar polinomio original (Horner)
    const evaluarP = (x) => {
        let res = coefs[0];
        for(let i=1; i<coefs.length; i++) res = res*x + coefs[i];
        return res;
    };

    // Determinar rango basado en las raíces reales encontradas
    let reales = raicesGlobales.filter(r => Math.abs(r.im) < 1e-5).map(r => r.re);
    let minX = -5, maxX = 5;
    if (reales.length > 0) {
        minX = Math.min(...reales) - 2;
        maxX = Math.max(...reales) + 2;
    }

    let labels = [];
    let dataY = [];
    let step = (maxX - minX) / 100;
    
    for(let x = minX; x <= maxX; x += step) {
        labels.push(x.toFixed(2));
        dataY.push(evaluarP(x));
    }

    // Dataset para puntos de raíces reales
    let puntosRaices = reales.map(r => ({x: r, y: 0}));

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels, // Esto es referencial para chartjs line
            datasets: [
                {
                    label: 'P(x)',
                    data: labels.map(l => evaluarP(parseFloat(l))),
                    borderColor: '#2F6DB3',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Raíces Reales',
                    data: puntosRaices,
                    type: 'scatter',
                    backgroundColor: '#D64545',
					backgroundColor: 'rgba(47, 109, 179, 0.1)',
                    pointRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { 
                    type: 'linear', 
                    position: 'bottom',
                    min: minX,
                    max: maxX
                }
            }
        }
    });
}

function borrarDatos() {
    generarInputsCoeficientes();
    document.querySelector('#tabla-raices tbody').innerHTML = '';
    document.getElementById('polinomio-display').textContent = '';
    document.getElementById('paso-a-paso').textContent = '';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18); doc.setTextColor(31, 58, 95);
    doc.text("Reporte: Método de Bairstow", 14, 20);
    
    doc.setFontSize(10); doc.setTextColor(0);
    doc.text(document.getElementById('polinomio-display').textContent, 14, 30);

    doc.autoTable({ 
        html: '#tabla-raices', 
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [31, 58, 95] }
    });

    const canvas = document.getElementById('graficaBairstow');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        let finalY = doc.lastAutoTable.finalY + 15;
        
        if (finalY + 90 > doc.internal.pageSize.height) { 
            doc.addPage(); 
            finalY = 20; 
        }

        doc.setFontSize(14); doc.setTextColor(31, 58, 95);
        doc.text("Gráfica del Polinomio", 14, finalY);
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, 80);
    }
    
    doc.save("Bairstow_Reporte.pdf");
}