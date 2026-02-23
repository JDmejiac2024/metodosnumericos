// JavaScript Document
// js/methods/newton_int.js

let chartInstance = null;

// 1. Generar campos de entrada para X e Y
function generarInputsPuntos() {
    const n = parseInt(document.getElementById('cantidadPuntos').value);
    const container = document.getElementById('puntos-container');
    
    if (n < 2) {
        alert("Se necesitan al menos 2 puntos para interpolar.");
        return;
    }

    let html = '<table style="margin: 0 auto; width: 80%; max-width: 600px;">';
    html += '<thead><tr><th>i</th><th>x</th><th>f(x)</th></tr></thead><tbody>';

    for (let i = 0; i < n; i++) {
        html += `<tr>
                    <td style="font-weight:bold; text-align:center;">${i}</td>
                    <td><input type="number" id="x_${i}" class="matrix-input" placeholder="x${i}" style="width: 100%; text-align:center;"></td>
                    <td><input type="number" id="y_${i}" class="matrix-input" placeholder="y${i}" style="width: 100%; text-align:center;"></td>
                 </tr>`;
    }
    html += '</tbody></table>';
    container.innerHTML = html;
}

// 2. Función Principal: Calcular Interpolación
function calcularInterpolacion() {
    const n = parseInt(document.getElementById('cantidadPuntos').value);
    const valX = parseFloat(document.getElementById('valX').value); // Opcional
    
    const divPolinomio = document.getElementById('resultado-polinomio');
    const divEvaluacion = document.getElementById('resultado-evaluacion');
    const tableHead = document.getElementById('headers-tabla');
    const tableBody = document.querySelector('#tabla-diferencias tbody');
    const msgError = document.getElementById('error-msg');
    const divPasos = document.getElementById('paso-a-paso');

    // Limpieza
    divPolinomio.innerHTML = '';
    divEvaluacion.innerHTML = '';
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    msgError.textContent = '';
    divPasos.textContent = '';

    // Obtener datos
    let x = [];
    let y = [];
    try {
        for (let i = 0; i < n; i++) {
            const val_x = document.getElementById(`x_${i}`).value;
            const val_y = document.getElementById(`y_${i}`).value;
            if (val_x === '' || val_y === '') throw new Error("Faltan valores.");
            x.push(parseFloat(val_x));
            y.push(parseFloat(val_y));
        }
        
        if (new Set(x).size !== x.length) {
            msgError.textContent = "Error: Los valores de X deben ser distintos.";
            return;
        }
    } catch (e) {
        msgError.textContent = "Error: Por favor ingresa todos los puntos.";
        return;
    }

    // --- ALGORITMO DIFERENCIAS DIVIDIDAS ---
    let F = Array.from(Array(n), () => new Array(n).fill(0));
    let pasosLog = "--- CÁLCULO DE DIFERENCIAS DIVIDIDAS ---\n\n";

    // Llenar primera columna con Y
    for (let i = 0; i < n; i++) F[i][0] = y[i];

    // Calcular tabla
    for (let j = 1; j < n; j++) { // Columna (Orden)
        pasosLog += `>>> Orden ${j}:\n`;
        for (let i = 0; i < n - j; i++) { // Fila
            let valSup = F[i+1][j-1];
            let valInf = F[i][j-1];
            let xSup = x[i+j];
            let xInf = x[i];
            
            // Cálculo
            F[i][j] = (valSup - valInf) / (xSup - xInf);
            
            // Limpieza de -0.0000
            let v = Math.abs(F[i][j]) < 1e-10 ? 0 : F[i][j];
            F[i][j] = v;

            pasosLog += `   f[x${i},...,x${i+j}] = (${valSup.toFixed(4)} - ${valInf.toFixed(4)}) / (${xSup} - ${xInf}) = ${F[i][j].toFixed(4)}\n`;
        }
        pasosLog += "\n";
    }

    // Coeficientes (Diagonal superior)
    let b = [];
    pasosLog += "--- COEFICIENTES DEL POLINOMIO (b) ---\n";
    for (let j = 0; j < n; j++) {
        b.push(F[0][j]);
        pasosLog += `b${j} = ${F[0][j].toFixed(4)}\n`;
    }

    // --- MOSTRAR RESULTADOS ---
    
    // 1. Tabla Html
    let heads = '<th>i</th><th>x_i</th><th>f(x_i)</th>';
    for (let j = 1; j < n; j++) heads += `<th>Orden ${j}</th>`;
    tableHead.innerHTML = heads;

    for (let i = 0; i < n; i++) {
        // x_i se deja original para claridad, los demás con 4 decimales
        let row = `<td>${i}</td><td style="font-weight:bold; color:var(--primary-dark);">${x[i]}</td>`;
        for (let j = 0; j < n - i; j++) {
            row += `<td>${F[i][j].toFixed(4)}</td>`;
        }
        tableBody.innerHTML += `<tr>${row}</tr>`;
    }

    // 2. Construir Polinomio String Mejorado Matemáticamente
    let poliStr = `P(x) = ${b[0].toFixed(4)}`;
    for (let i = 1; i < n; i++) {
        if (Math.abs(b[i]) < 1e-10) continue; // Si es cero, saltar término
        
        let term = (b[i] > 0 ? " + " : " - ") + Math.abs(b[i]).toFixed(4);
        
        for (let k = 0; k < i; k++) {
            let xk = x[k];
            if (xk === 0) {
                term += `(x)`;
            } else {
                // Si la x es negativa, mostramos (x + n), si es positiva (x - n)
                let sign = xk < 0 ? "+" : "-";
                term += `(x ${sign} ${Math.abs(xk)})`;
            }
        }
        poliStr += term;
    }
    divPolinomio.innerHTML = poliStr;
    pasosLog += `\n--- POLINOMIO FINAL ---\n${poliStr}`;

    // 3. Evaluación
    if (!isNaN(valX)) {
        let res = evaluarPolinomio(valX, x, b);
        let resClean = Math.abs(res) < 1e-10 ? 0 : res;
        divEvaluacion.innerHTML = `Evaluación: f(${valX}) ≈ ${resClean.toFixed(4)}`;
        pasosLog += `\n\n--- EVALUACIÓN EN x = ${valX} ---\nResultado aproximado: ${resClean.toFixed(4)}`;
    }

    // Mostrar pasos en el HTML
    divPasos.textContent = pasosLog;

    // 4. Gráfica
    generarGrafica(x, y, b);
}

// Función auxiliar Horner para evaluar polinomio de Newton
function evaluarPolinomio(val, xData, b) {
    let n = b.length;
    let suma = b[0];
    for (let i = 1; i < n; i++) {
        let term = b[i];
        for (let k = 0; k < i; k++) {
            term *= (val - xData[k]);
        }
        suma += term;
    }
    return suma;
}

function generarGrafica(xData, yData, b) {
    const ctx = document.getElementById('graficaInterpolacion').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    let minX = Math.min(...xData);
    let maxX = Math.max(...xData);
    let padding = (maxX - minX) * 0.1; 
    
    let curveX = [];
    let curveY = [];
    let steps = 100;
    let stepSize = (maxX + padding - (minX - padding)) / steps;

    for (let i = 0; i <= steps; i++) {
        let val = (minX - padding) + i * stepSize;
        curveX.push(val.toFixed(2));
        curveY.push(evaluarPolinomio(val, xData, b));
    }

    const originalPoints = xData.map((x, i) => ({x: x, y: yData[i]}));

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: curveX,
            datasets: [
                {
                    label: 'Polinomio Interpolante',
                    data: curveY,
                    borderColor: '#2FA36B', // Verde
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Puntos Dados',
                    data: originalPoints,
                    type: 'scatter',
                    backgroundColor: '#D64545', // Rojo
                    pointRadius: 6,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { type: 'linear', position: 'bottom', title: {display:true, text:'X'} }
            }
        }
    });
}

function borrarDatos() {
    generarInputsPuntos();
    document.getElementById('resultado-polinomio').innerHTML = '';
    document.getElementById('resultado-evaluacion').innerHTML = '';
    document.querySelector('#tabla-diferencias tbody').innerHTML = '';
    document.getElementById('headers-tabla').innerHTML = '';
    document.getElementById('valX').value = '';
    document.getElementById('paso-a-paso').textContent = '';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18); doc.setTextColor(31, 58, 95);
    doc.text("Interpolación: Newton (Diferencias Divididas)", 14, 20);
    
    doc.setFontSize(10); doc.setTextColor(0);
    let poly = document.getElementById('resultado-polinomio').textContent;
    let splitPoly = doc.splitTextToSize(poly, 180);
    doc.text(splitPoly, 14, 30);

    // Ajuste del tamaño de fuente en base a la cantidad de puntos
    let n = parseInt(document.getElementById('cantidadPuntos').value);
    let tableFont = n > 5 ? 8 : 10;

    // Tabla de diferencias
    doc.autoTable({ 
        html: '#tabla-diferencias', 
        startY: 45, 
        theme: 'grid', 
        headStyles: { fillColor: [31, 58, 95] },
        styles: { fontSize: tableFont, cellPadding: 2 } 
    });

    // Sección de Gráfica con Título
    const canvas = document.getElementById('graficaInterpolacion');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        
        // Calcular posición Y después de la tabla
        let finalY = doc.lastAutoTable.finalY + 15; 

        // Si no cabe, añadir página
        if (finalY + 90 > doc.internal.pageSize.height) { 
            doc.addPage(); 
            finalY = 20; 
        }
        
        doc.setFontSize(14);
        doc.setTextColor(31, 58, 95);
        doc.text("Gráfica del Polinomio", 14, finalY);

        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, 80);
    }
    doc.save("Interpolacion_Newton_Reporte.pdf");
}