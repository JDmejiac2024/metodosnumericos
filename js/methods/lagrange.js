// JavaScript Document
// js/methods/lagrange.js

let chartInstance = null;

// 1. Generar campos de entrada de forma HORIZONTAL
function generarInputsPuntos() {
    const n = parseInt(document.getElementById('cantidadPuntos').value);
    const container = document.getElementById('puntos-container');
    
    if (n < 2) {
        alert("Se necesitan al menos 2 puntos para interpolar.");
        return;
    }

    // Tabla con ancho responsivo
    let html = '<div style="overflow-x: auto;"><table style="margin: 0 auto; width: 100%; max-width: 800px; text-align: center; border-collapse: collapse;">';
    
    // FILA 1: Valores de X
    html += '<tr>';
    html += '<td style="font-weight:bold; color: var(--primary-dark); background: #eef2f5; width: 60px; padding: 10px; border: 1px solid var(--border);">X</td>';
    for (let i = 0; i < n; i++) {
        html += `<td style="padding: 5px; border: 1px solid var(--border);"><input type="number" id="x_${i}" class="matrix-input" placeholder="x${i}" style="width: 100%; min-width: 60px; text-align:center; padding: 5px;"></td>`;
    }
    html += '</tr>';

    // FILA 2: Valores de Y / f(x)
    html += '<tr>';
    html += '<td style="font-weight:bold; color: var(--primary-dark); background: #eef2f5; width: 60px; padding: 10px; border: 1px solid var(--border);">Y</td>';
    for (let i = 0; i < n; i++) {
        html += `<td style="padding: 5px; border: 1px solid var(--border);"><input type="number" id="y_${i}" class="matrix-input" placeholder="y${i}" style="width: 100%; min-width: 60px; text-align:center; padding: 5px;"></td>`;
    }
    html += '</tr>';

    html += '</table></div>';
    container.innerHTML = html;
}

// 2. Función Principal: Calcular Lagrange al estilo "Cuaderno"
function calcularLagrange() {
    const n = parseInt(document.getElementById('cantidadPuntos').value);
    const valXStr = document.getElementById('valX').value;
    const valX = parseFloat(valXStr);
    
    const divPolinomio = document.getElementById('resultado-polinomio');
    const divEvaluacion = document.getElementById('resultado-evaluacion');
    const msgError = document.getElementById('error-msg');
    const divPasos = document.getElementById('paso-a-paso');

    divPolinomio.innerHTML = '';
    divEvaluacion.innerHTML = '';
    msgError.textContent = '';
    divPasos.textContent = '';

    // Obtener datos de la tabla horizontal
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
            msgError.textContent = "Error: Los valores de X deben ser distintos para evitar división por cero.";
            return;
        }
    } catch (e) {
        msgError.textContent = "Error: Por favor ingresa todos los puntos de la tabla.";
        return;
    }

    let evaluar = valXStr !== '' && !isNaN(valX);

    // --- ALGORITMO Y PASO A PASO LAGRANGE ---
    let pasosLog = "--- 1. FÓRMULA GENERAL DE LAGRANGE ---\n";
    
    // Construir fórmula simbólica general
    let formulaGeneral = "f(x) = ";
    for (let i = 0; i < n; i++) {
        let numVars = "";
        let denVars = "";
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                numVars += `(x - x${j})`;
                denVars += `(x${i} - x${j})`;
            }
        }
        formulaGeneral += `[ ${numVars} / ${denVars} ] * f(x${i})`;
        if (i < n - 1) formulaGeneral += "\n       + ";
    }
    pasosLog += formulaGeneral + "\n\n";

    pasosLog += "--- 2. DATOS IDENTIFICADOS ---\n";
    for (let i = 0; i < n; i++) {
        pasosLog += `x${i} = ${x[i]} \t\t f(x${i}) = ${y[i]}\n`;
    }
    if (evaluar) pasosLog += `x  = ${valX}\n`;
    pasosLog += "\n";

    let polinomioStr = ""; 
    let resultadoFinal = 0;

    let eqSustitucion = evaluar ? `f(${valX}) = ` : `f(x) = `;
    let eqCalculoFracciones = evaluar ? `f(${valX}) = ` : `f(x) = `;
    let eqDivision = evaluar ? `f(${valX}) = ` : `f(x) = `;
    let eqMultiplicacion = evaluar ? `f(${valX}) = ` : `f(x) = `;

    for (let i = 0; i < n; i++) {
        let numSustituido = "";
        let denSustituido = "";
        let numVal = 1;
        let denVal = 1;
        let numPoli = "";

        for (let j = 0; j < n; j++) {
            if (i !== j) {
                // Para el polinomio en pantalla
                let sign = x[j] < 0 ? "+" : "-";
                numPoli += `(x ${sign} ${Math.abs(x[j])})`;
                
                // Para el paso a paso
                let valXStrDisplay = evaluar ? valX : "x";
                numSustituido += `(${valXStrDisplay} - ${x[j]})`;
                denSustituido += `(${x[i]} - ${x[j]})`;
                
                if (evaluar) {
                    numVal *= (valX - x[j]);
                }
                denVal *= (x[i] - x[j]);
            }
        }

        let Li_x = evaluar ? (numVal / denVal) : null;
        let terminoEval = evaluar ? (Li_x * y[i]) : null;
        if (evaluar) resultadoFinal += terminoEval;

        let signoSuma = (i > 0) ? " \n       + " : "";
        let signoPoli = y[i] >= 0 ? (i === 0 ? "" : " + ") : " - ";
        
        polinomioStr += `${signoPoli}${Math.abs(y[i]).toFixed(4)} * [ ${numPoli} / ${denVal.toFixed(4)} ]`;

        eqSustitucion += `${signoSuma}[ ${numSustituido} / ${denSustituido} ] * (${y[i]})`;
        
        if (evaluar) {
            eqCalculoFracciones += `${signoSuma}[ ${numVal.toFixed(4)} / ${denVal.toFixed(4)} ] * (${y[i]})`;
            eqDivision += `${signoSuma}[ ${Li_x.toFixed(4)} ] * (${y[i]})`;
            eqMultiplicacion += `${(i > 0) ? " + " : ""}${terminoEval.toFixed(4)}`;
        }
    }

    pasosLog += "--- 3. SUSTITUCIÓN DE VALORES ---\n";
    pasosLog += eqSustitucion + "\n\n";

    if (evaluar) {
        pasosLog += "--- 4. RESOLVIENDO OPERACIONES ---\n";
        pasosLog += eqCalculoFracciones + "\n";
        pasosLog += eqDivision + "\n";
        pasosLog += `f(${valX}) = ${eqMultiplicacion}\n`;
        // AQUÍ EL RESULTADO FINAL CON 4 DECIMALES
        pasosLog += `f(${valX}) = ${resultadoFinal.toFixed(4)}\n`;
    }

    divPolinomio.textContent = "P(x) = " + polinomioStr;

    if (evaluar) {
        // AQUÍ LA EVALUACIÓN CON 4 DECIMALES
        divEvaluacion.innerHTML = `Resultado Final: f(${valX}) ≈ ${resultadoFinal.toFixed(4)}`;
    } else {
        divEvaluacion.innerHTML = "Ingresa un valor en X para evaluar el polinomio.";
    }

    divPasos.textContent = pasosLog;

    generarGraficaLagrange(x, y, n, valX, resultadoFinal, evaluar);
}

// Función evaluación para gráfica
function evaluarLagrangeEn(z, xData, yData) {
    let n = xData.length;
    let suma = 0;
    
    for (let i = 0; i < n; i++) {
        let producto = 1;
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                producto *= (z - xData[j]) / (xData[i] - xData[j]);
            }
        }
        suma += yData[i] * producto;
    }
    return suma;
}

function generarGraficaLagrange(xData, yData, n, xInterp, yInterp, evaluar) {
    const ctx = document.getElementById('graficaInterpolacion').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    let minX = Math.min(...xData);
    let maxX = Math.max(...xData);
    if (evaluar) {
        minX = Math.min(minX, xInterp);
        maxX = Math.max(maxX, xInterp);
    }
    let padding = (maxX - minX) * 0.1;
    if (padding === 0) padding = 1;

    let curveX = [];
    let curveY = [];
    let steps = 100;
    let stepSize = (maxX + padding - (minX - padding)) / steps;

    for (let i = 0; i <= steps; i++) {
        let val = (minX - padding) + i * stepSize;
        curveX.push(val.toFixed(2)); // La escala X se queda con 2 decimales para que no se amontonen los números
        curveY.push(evaluarLagrangeEn(val, xData, yData));
    }

    const originalPoints = xData.map((x, i) => ({x: x, y: yData[i]}));
    
    let datasetsArr = [
        {
            label: 'Polinomio de Lagrange',
            data: curveY,
            borderColor: '#2F6DB3', 
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.4
        },
        {
            label: 'Puntos de la Tabla',
            data: originalPoints,
            type: 'scatter',
            backgroundColor: '#1F3A5F',
            pointRadius: 6,
            pointHoverRadius: 8
        }
    ];

    if (evaluar) {
        datasetsArr.push({
            // LA LEYENDA DE LA GRÁFICA TAMBIÉN CON 4 DECIMALES
            label: `Resultado: f(${xInterp}) = ${yInterp.toFixed(4)}`,
            data: [{x: xInterp, y: yInterp}],
            type: 'scatter',
            backgroundColor: '#D64545',
            pointRadius: 8,
            pointStyle: 'rectRot'
        });
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: curveX,
            datasets: datasetsArr
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { type: 'linear', position: 'bottom', title: {display:true, text:'X'} },
                y: { title: {display:true, text:'f(X)'} }
            }
        }
    });
}

function borrarDatos() {
    generarInputsPuntos();
    document.getElementById('valX').value = '';
    document.getElementById('resultado-polinomio').textContent = '';
    document.getElementById('resultado-evaluacion').textContent = '';
    document.getElementById('error-msg').textContent = '';
    document.getElementById('paso-a-paso').textContent = '';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18); doc.setTextColor(31, 58, 95);
    doc.text("Interpolación: Método de Lagrange", 14, 20);
    
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text("Polinomio Resultante:", 14, 35);
    
    doc.setFontSize(10);
    let poly = document.getElementById('resultado-polinomio').textContent;
    let splitPoly = doc.splitTextToSize(poly, 180); 
    doc.text(splitPoly, 14, 42);
    
    let lastY = 42 + (splitPoly.length * 5);
    
    let evalText = document.getElementById('resultado-evaluacion').textContent;
    if (evalText) {
        doc.setFontSize(12);
        doc.setTextColor(47, 163, 107);
        doc.text(evalText, 14, lastY + 10);
        lastY += 20;
    } else {
        lastY += 10;
    }

    const canvas = document.getElementById('graficaInterpolacion');
    if(canvas){
        if (lastY + 90 > doc.internal.pageSize.height) {
            doc.addPage();
            lastY = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(31, 58, 95);
        doc.text("Gráfica del Polinomio", 14, lastY);
        
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 15, lastY + 5, 180, 80);
    }
    
    doc.save("Interpolacion_Lagrange.pdf");
}