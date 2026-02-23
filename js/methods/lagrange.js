// JavaScript Document
// js/methods/lagrange.js

let chartInstance = null;

// 1. Generar campos de entrada (Reutilizable)
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

// 2. Función Principal: Calcular Lagrange
function calcularLagrange() {
    const n = parseInt(document.getElementById('cantidadPuntos').value);
    const valX = parseFloat(document.getElementById('valX').value);
    
    const divPolinomio = document.getElementById('resultado-polinomio');
    const divEvaluacion = document.getElementById('resultado-evaluacion');
    const msgError = document.getElementById('error-msg');
    const divPasos = document.getElementById('paso-a-paso');

    divPolinomio.innerHTML = '';
    divEvaluacion.innerHTML = '';
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

    // --- ALGORITMO LAGRANGE ---
    let pasosLog = "--- CONSTRUCCIÓN DE TÉRMINOS L_i(x) ---\n\n";
    let polinomioStr = ""; 

    let evaluar = !isNaN(valX);
    let resultadoFinal = 0;

    for (let i = 0; i < n; i++) {
        pasosLog += `>>> Término L_${i}(x) para punto (${x[i]}, ${y[i]}):\n`;
        
        let numeradorStr = "";
        let denominadorVal = 1;
        let terminoVal = 1; 
        
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                // Formateo matemático para (x - xj)
                let xj = x[j];
                if (xj === 0) {
                    numeradorStr += `(x)`;
                } else {
                    let sign = xj < 0 ? "+" : "-";
                    numeradorStr += `(x ${sign} ${Math.abs(xj)})`;
                }

                denominadorVal *= (x[i] - x[j]);
                
                if (evaluar) {
                    terminoVal *= (valX - x[j]) / (x[i] - x[j]);
                }
            }
        }
        
        // Limpiar -0.0000
        let denClean = Math.abs(denominadorVal) < 1e-10 ? 0 : denominadorVal;

        pasosLog += `   Numerador:   ${numeradorStr}\n`;
        pasosLog += `   Denominador: ${denClean.toFixed(4)}\n`;
        
        // Construimos el string visual
        let signo = y[i] >= 0 ? (i===0 ? "" : " + ") : " - ";
        polinomioStr += `${signo}${Math.abs(y[i]).toFixed(4)} * [ ${numeradorStr} / ${denClean.toFixed(4)} ]`;

        if (evaluar) {
            let aporte = y[i] * terminoVal;
            resultadoFinal += aporte;
            
            let termClean = Math.abs(terminoVal) < 1e-10 ? 0 : terminoVal;
            let aporteClean = Math.abs(aporte) < 1e-10 ? 0 : aporte;
            
            pasosLog += `   Evaluación:  L_${i}(${valX}) = ${termClean.toFixed(4)}\n`;
            pasosLog += `   Aporte:      ${y[i]} * ${termClean.toFixed(4)} = ${aporteClean.toFixed(4)}\n\n`;
        } else {
            pasosLog += "\n";
        }
    }

    // Mostramos el polinomio en el HTML
    divPolinomio.textContent = "P(x) = " + polinomioStr;

    if (evaluar) {
        let resClean = Math.abs(resultadoFinal) < 1e-10 ? 0 : resultadoFinal;
        divEvaluacion.innerHTML = `Evaluación: f(${valX}) ≈ ${resClean.toFixed(4)}`;
        pasosLog += `--- RESULTADO FINAL ---\nP(${valX}) ≈ ${resClean.toFixed(4)}`;
    }

    divPasos.textContent = pasosLog;

    generarGraficaLagrange(x, y);
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

function generarGraficaLagrange(xData, yData) {
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
        curveY.push(evaluarLagrangeEn(val, xData, yData));
    }

    const originalPoints = xData.map((x, i) => ({x: x, y: yData[i]}));

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: curveX,
            datasets: [
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
    document.getElementById('resultado-polinomio').textContent = '';
    document.getElementById('resultado-evaluacion').textContent = '';
    document.getElementById('paso-a-paso').textContent = '';
    document.getElementById('valX').value = '';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}

// --- FUNCIÓN PDF ---
function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título Principal
    doc.setFontSize(18); 
    doc.setTextColor(31, 58, 95);
    doc.text("Interpolación: Método de Lagrange", 14, 20);
    
    // 1. Polinomio Resultante
    doc.setFontSize(12); 
    doc.setTextColor(0);
    doc.text("Polinomio Resultante:", 14, 35);
    
    doc.setFontSize(10);
    let poly = document.getElementById('resultado-polinomio').textContent;
    // Dividimos el texto para que no se salga de la hoja
    let splitPoly = doc.splitTextToSize(poly, 180); 
    doc.text(splitPoly, 14, 42);
    
    // Calculamos dónde terminó el polinomio para poner el resultado abajo
    let lastY = 42 + (splitPoly.length * 5);
    
    // 2. Resultado de Evaluación (si existe)
    let evalText = document.getElementById('resultado-evaluacion').textContent;
    if (evalText) {
        doc.setFontSize(12);
        doc.setTextColor(47, 163, 107); // Verde éxito
        doc.text(evalText, 14, lastY + 10);
        lastY += 20; // Espacio extra
    } else {
        lastY += 10;
    }

    // 3. Gráfica del Polinomio
    const canvas = document.getElementById('graficaInterpolacion');
    if(canvas){
        // Verificar si cabe en la hoja, si no, nueva página
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