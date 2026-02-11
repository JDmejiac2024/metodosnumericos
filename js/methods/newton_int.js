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
                    <td style="font-weight:bold;">${i}</td>
                    <td><input type="number" id="x_${i}" class="matrix-input" placeholder="x${i}" style="width: 100%;"></td>
                    <td><input type="number" id="y_${i}" class="matrix-input" placeholder="y${i}" style="width: 100%;"></td>
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
            
            // Log del paso
            pasosLog += `   f[x${i},...,x${i+j}] = (${valSup.toFixed(4)} - ${valInf.toFixed(4)}) / (${xSup} - ${xInf}) = ${F[i][j].toFixed(5)}\n`;
        }
        pasosLog += "\n";
    }

    // Coeficientes (Diagonal superior)
    let b = [];
    pasosLog += "--- COEFICIENTES DEL POLINOMIO (b) ---\n";
    for (let j = 0; j < n; j++) {
        b.push(F[0][j]);
        pasosLog += `b${j} = ${F[0][j].toFixed(5)}\n`;
    }

    // --- MOSTRAR RESULTADOS ---
    
    // 1. Tabla
    let heads = '<th>i</th><th>x</th><th>f(x)</th>';
    for (let j = 1; j < n; j++) heads += `<th>Orden ${j}</th>`;
    tableHead.innerHTML = heads;

    for (let i = 0; i < n; i++) {
        let row = `<td>${i}</td><td>${x[i]}</td>`;
        for (let j = 0; j < n - i; j++) {
            row += `<td>${F[i][j].toFixed(4)}</td>`;
        }
        tableBody.innerHTML += `<tr>${row}</tr>`;
    }

    // 2. Construir Polinomio String
    let poliStr = `P(x) = ${b[0].toFixed(4)}`;
    for (let i = 1; i < n; i++) {
        let term = (b[i] >= 0 ? " + " : " - ") + Math.abs(b[i]).toFixed(4);
        for (let k = 0; k < i; k++) {
            term += `(x - ${x[k]})`;
        }
        poliStr += term;
    }
    divPolinomio.innerHTML = poliStr;
    pasosLog += `\n--- POLINOMIO FINAL ---\n${poliStr}`;

    // 3. Evaluación
    if (!isNaN(valX)) {
        let res = evaluarPolinomio(valX, x, b);
        divEvaluacion.innerHTML = `Resultado: f(${valX}) ≈ ${res.toFixed(6)}`;
        pasosLog += `\n\n--- EVALUACIÓN EN x = ${valX} ---\nResultado aproximado: ${res.toFixed(6)}`;
    }

    // Mostrar pasos en el HTML
    divPasos.textContent = pasosLog;

    // 4. Gráfica
    generarGrafica(x, y, b);
}

// Función auxiliar Horner
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
                    borderColor: '#2FA36B',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Puntos Dados',
                    data: originalPoints,
                    type: 'scatter',
                    backgroundColor: '#D64545',
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
    doc.text("Interpolación: Newton (Diferencias)", 14, 20);
    
    doc.setFontSize(10); doc.setTextColor(0);
    let poly = document.getElementById('resultado-polinomio').textContent;
    let splitPoly = doc.splitTextToSize("Polinomio: " + poly, 180);
    doc.text(splitPoly, 14, 30);

    // Tabla de diferencias
    doc.autoTable({ html: '#tabla-diferencias', startY: 50, theme: 'grid', headStyles: { fillColor: [31, 58, 95] } });

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
        
        // --- AQUÍ ESTÁ EL TÍTULO QUE PEDISTE ---
        doc.setFontSize(14);
        doc.setTextColor(31, 58, 95); // Mismo azul del header
        doc.text("Gráfica del Polinomio", 14, finalY);

        // Insertar imagen debajo del título
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, 80);
    }
    doc.save("Interpolacion_Newton.pdf");
}// JavaScript Document