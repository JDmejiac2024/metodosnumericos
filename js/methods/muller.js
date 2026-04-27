// JavaScript Document
// js/methods/muller.js

let chartInstance = null;

// Función auxiliar para formatear números reales y complejos a 4 decimales
function formatoComplejo(c) {
    if (typeof c === 'number') {
        let val = Math.abs(c) < 1e-10 ? 0 : c;
        return val.toFixed(4);
    }
    let re = Math.abs(c.re) < 1e-10 ? 0 : c.re;
    let im = Math.abs(c.im) < 1e-10 ? 0 : c.im;
    if (im === 0) return re.toFixed(4);
    let sign = im < 0 ? '-' : '+';
    return `${re.toFixed(4)} ${sign} ${Math.abs(im).toFixed(4)}i`;
}

function calcularMuller() {
    // 1. Obtener Inputs
    const funcStr = document.getElementById('func').value;
    const x0Val = parseFloat(document.getElementById('x0').value);
    const x1Val = parseFloat(document.getElementById('x1').value);
    const x2Val = parseFloat(document.getElementById('x2').value);
    let tol = parseFloat(document.getElementById('tol').value) || 0.0001; 
    
    // --- TOLERANCIA PARA LLEGAR A 0.0000 ---
    if (tol > 0.00001) {
        tol = 0.00001;
    }

    const maxIter = parseInt(document.getElementById('maxIter').value) || 100;

    const tbody = document.querySelector('#tabla-resultados tbody');
    const msgError = document.getElementById('error-msg');
    const pasoDiv = document.getElementById('paso-a-paso');
    const rootResult = document.getElementById('root-result');

    // Limpieza
    tbody.innerHTML = '';
    msgError.textContent = '';
    pasoDiv.textContent = '';
    rootResult.textContent = '';

    if (!funcStr || isNaN(x0Val) || isNaN(x1Val) || isNaN(x2Val)) {
        msgError.textContent = "Error: Ingresa la función y los 3 puntos iniciales.";
        return;
    }

    try {
        // Compilar función con math.js para soporte complejo
        const f = (x) => {
            try {
                return math.evaluate(funcStr, { x: x });
            } catch (e) {
                return math.complex(0, 0); 
            }
        };

        // Convertir inputs a números complejos de math.js
        let x0 = math.complex(x0Val, 0);
        let x1 = math.complex(x1Val, 0);
        let x2 = math.complex(x2Val, 0);

        let iter = 0;
        let error = 100;
        let x3 = math.complex(0, 0);
        let pasosLog = "--- INICIO MÉTODO DE MÜLLER ---\n\n";
        
        // --- BUCLE MÜLLER ---
        while (error > tol && iter < maxIter) {
            
            // Evaluaciones de la función
            let fx0 = f(x0);
            let fx1 = f(x1);
            let fx2 = f(x2);

            // Cálculos de h y d
            let h0 = math.subtract(x1, x0);
            let h1 = math.subtract(x2, x1);
            
            let d0 = math.divide(math.subtract(fx1, fx0), h0);
            let d1 = math.divide(math.subtract(fx2, fx1), h1);
            
            // Coeficientes de la parábola: a*x^2 + b*x + c
            let a = math.divide(math.subtract(d1, d0), math.add(h1, h0));
            // b = (a * h1) + d1
            let b = math.add(math.multiply(a, h1), d1);
            let c = fx2;

            // --- LÓGICA DEL SIGNO BASADA EN 'b' ---
            let b_re = (typeof b === 'number') ? b : b.re;
            let signStr = (b_re >= 0) ? '+' : '-';

            // Discriminante: sqrt(b^2 - 4*a*c)
            let rad = math.sqrt(math.subtract(math.multiply(b, b), math.multiply(4, math.multiply(a, c))));

            // Elegir el denominador según el signo de b
            let den;
            if (b_re >= 0) {
                den = math.add(b, rad);
            } else {
                den = math.subtract(b, rad);
            }

            // Calcular dx (diferencia para el nuevo punto)
            let dx = math.divide(math.multiply(-2, c), den);
            
            // Nuevo punto x3
            x3 = math.add(x2, dx);

            // --- CÁLCULO DE ERROR CORREGIDO (SIN *100 NI %) ---
            if (math.abs(x3) > 1e-10) { 
                // Error = |(x3 - x2) / x3| 
                error = math.abs(math.divide(math.subtract(x3, x2), x3));
            } else {
                error = 100;
            }

            // Freno visual para tabla
            if (parseFloat(error.toFixed(4)) === 0) {
                error = 0; 
            }

            // Llenar tabla con las 16 columnas
            let fila = `
                <tr>
                    <td>${iter + 1}</td>
                    <td>${formatoComplejo(x0)}</td>
                    <td>${formatoComplejo(x1)}</td>
                    <td>${formatoComplejo(x2)}</td>
                    <td>${formatoComplejo(fx0)}</td>
                    <td>${formatoComplejo(fx1)}</td>
                    <td>${formatoComplejo(fx2)}</td>
                    <td>${formatoComplejo(h0)}</td>
                    <td>${formatoComplejo(h1)}</td>
                    <td>${formatoComplejo(d0)}</td>
                    <td>${formatoComplejo(d1)}</td>
                    <td>${formatoComplejo(a)}</td>
                    <td>${formatoComplejo(b)}</td>
                    <td>${formatoComplejo(c)}</td>
                    <td style="font-family: monospace; font-weight:bold; color:var(--primary-dark);">${formatoComplejo(x3)}</td>
                    <td style="color:#D64545;">${error.toFixed(4)}</td>
                </tr>
            `;
            tbody.innerHTML += fila;

            // Log de pasos detallado mostrando la operación de x3
            pasosLog += `Iteración ${iter + 1}:\n`;
            pasosLog += `  Valores iniciales: x0 = ${formatoComplejo(x0)}, x1 = ${formatoComplejo(x1)}, x2 = ${formatoComplejo(x2)}\n`;
            pasosLog += `  Coeficientes: a = ${formatoComplejo(a)}, b = ${formatoComplejo(b)}, c = ${formatoComplejo(c)}\n\n`;
            pasosLog += `  Operación x3:\n`;
            pasosLog += `  Como el valor de b (${formatoComplejo(b)}) es ${b_re >= 0 ? 'positivo' : 'negativo'}, utilizamos el signo [ ${signStr} ] en el denominador.\n`;
            pasosLog += `  x3 = x2 + (-2c) / (b ${signStr} sqrt(b² - 4ac))\n`;
            pasosLog += `  x3 = ${formatoComplejo(x2)} + (-2 * ${formatoComplejo(c)}) / (${formatoComplejo(b)} ${signStr} sqrt(rad))\n`;
            pasosLog += `  Calculado x3 = ${formatoComplejo(x3)}\n`;
            pasosLog += `  Error = |(${formatoComplejo(x3)} - ${formatoComplejo(x2)}) / ${formatoComplejo(x3)}| = ${error.toFixed(4)}\n`;
            pasosLog += `--------------------------------------------------\n\n`;

            // Actualizar puntos (desplazamiento) para la siguiente iteración
            x0 = x1;
            x1 = x2;
            x2 = x3;

            iter++;
        }

        pasosLog += `--- RESULTADO FINAL ---\nRaíz aproximada: ${formatoComplejo(x3)}`;
        pasoDiv.textContent = pasosLog;
        rootResult.textContent = `Raíz: ${formatoComplejo(x3)}`;

        // Graficar (Solo si la raíz final tiene parte imaginaria pequeña o nula)
        if (Math.abs(x3.im) < 1e-5) {
            generarGraficaReal(funcStr, x3.re);
        } else {
            msgError.textContent = "Nota: La raíz es compleja. La gráfica mostrará la función solo en el eje real cerca de x2.";
            generarGraficaReal(funcStr, x2Val); 
        }

    } catch (e) {
        msgError.textContent = "Error matemático: Revisa la sintaxis de la función.";
        console.error(e);
    }
}

// Función para graficar (invariable)
function generarGraficaReal(funcStr, centerVal) {
    const ctx = document.getElementById('graficaError').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    let range = 5;
    let minX = centerVal - range;
    let maxX = centerVal + range;
    let steps = 100;
    let stepSize = (maxX - minX) / steps;

    let labels = [];
    let dataY = [];

    const f = (x) => {
        try { return math.evaluate(funcStr, {x: x}); } 
        catch { return null; }
    };

    for (let i = 0; i <= steps; i++) {
        let x = minX + i * stepSize;
        let y = f(x);
        if (y !== null && !isNaN(y) && typeof y === 'number') {
            labels.push(x.toFixed(2));
            dataY.push(y);
        }
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'f(x)',
                data: dataY,
                borderColor: '#2F6DB3', 
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                tension: 0.4
            },
            {
                label: 'Eje X',
                data: new Array(labels.length).fill(0),
                borderColor: '#000',
                borderWidth: 1,
                pointRadius: 0,
                borderDash: [5, 5]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                x: { display: true }, 
                y: { beginAtZero: false } 
            }
        }
    });
}

function borrarDatos() {
    document.getElementById('func').value = '';
    document.getElementById('x0').value = '';
    document.getElementById('x1').value = '';
    document.getElementById('x2').value = '';
    document.getElementById('tol').value = '0.0001';
    document.getElementById('maxIter').value = '100';
    document.querySelector('#tabla-resultados tbody').innerHTML = '';
    document.getElementById('root-result').textContent = '';
    document.getElementById('paso-a-paso').textContent = '';
    document.getElementById('error-msg').textContent = '';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}

// --- FUNCIÓN EXPORTAR PDF ACTUALIZADA ---
function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18); doc.setTextColor(31, 58, 95);
    doc.text("Reporte: Método de Müller", 14, 20);
    
    doc.setFontSize(11); doc.setTextColor(0);
    doc.text("Función: " + document.getElementById('func').value, 14, 30);
    doc.text("Raíz Aprox: " + document.getElementById('root-result').textContent, 14, 36);
    
    doc.autoTable({ 
        html: '#tabla-resultados', 
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [31, 58, 95] },
        styles: { fontSize: 6, cellPadding: 1, overflow: 'linebreak' }
    });

    const canvas = document.getElementById('graficaError');
    if(canvas) {
        const imgData = canvas.toDataURL('image/png');
        
        let finalY = doc.lastAutoTable.finalY + 15; 

        if (finalY + 90 > doc.internal.pageSize.height) { 
            doc.addPage(); 
            finalY = 20; 
        }
        
        doc.setFontSize(14);
        doc.setTextColor(31, 58, 95);
        doc.text("Gráfica de la Función", 14, finalY);

        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, 80);
    }
    
    doc.save("Muller_Reporte.pdf");
}