// JavaScript Document
// js/methods/lineal.js

let chartInstance = null;

// Generar tabla de entradas
function generarInputsPuntos() {
    const n = parseInt(document.getElementById('cantidadPuntos').value);
    const container = document.getElementById('puntos-container');
    
    if (n < 2) {
        alert("Se necesitan al menos 2 puntos."); return;
    }

    let html = '<table style="margin: 0 auto; width: 80%; max-width: 600px;">';
    html += '<thead><tr><th>Punto</th><th>X (ej. Horas)</th><th>Y (ej. Temperatura)</th></tr></thead><tbody>';

    for (let i = 0; i < n; i++) {
        html += `<tr>
                    <td style="font-weight:bold; text-align:center;">P${i+1}</td>
                    <td><input type="number" id="x_${i}" class="matrix-input" placeholder="x${i+1}" style="width: 100%; text-align:center;"></td>
                    <td><input type="number" id="y_${i}" class="matrix-input" placeholder="y${i+1}" style="width: 100%; text-align:center;"></td>
                 </tr>`;
    }
    html += '</tbody></table>';
    container.innerHTML = html;
}

function calcularInterpolacion() {
    const n = parseInt(document.getElementById('cantidadPuntos').value);
    const valX = parseFloat(document.getElementById('valX').value);
    const valVerdaderoStr = document.getElementById('valVerdadero').value;
    
    const msgError = document.getElementById('error-msg');
    
    // Limpieza
    document.getElementById('resultado-funcion').innerHTML = '';
    document.getElementById('resultado-evaluacion').innerHTML = '';
    document.getElementById('resultado-error').innerHTML = '';
    msgError.textContent = '';
    document.getElementById('paso-a-paso').textContent = '';

    if (isNaN(valX)) {
        msgError.textContent = "Error: Ingresa el valor a interpolar (x)."; return;
    }

    // 1. Recopilar y ordenar puntos
    let pts = [];
    try {
        for (let i = 0; i < n; i++) {
            let xVal = document.getElementById(`x_${i}`).value;
            let yVal = document.getElementById(`y_${i}`).value;
            if (xVal === '' || yVal === '') throw new Error();
            pts.push({ x: parseFloat(xVal), y: parseFloat(yVal) });
        }
    } catch (e) {
        msgError.textContent = "Error: Llena todos los campos de la tabla."; return;
    }

    // Ordenar de menor a mayor X
    pts.sort((a, b) => a.x - b.x);

    // 2. Buscar los dos puntos que encierran a "valX"
    let p1 = pts[0];
    let p2 = pts[1];
    
    for (let i = 0; i < pts.length - 1; i++) {
        if (valX >= pts[i].x && valX <= pts[i+1].x) {
            p1 = pts[i];
            p2 = pts[i+1];
            break;
        }
    }
    
    // Si valX se sale de los rangos, tomamos los extremos (extrapolación)
    if (valX < pts[0].x) { p1 = pts[0]; p2 = pts[1]; }
    else if (valX > pts[pts.length-1].x) { p1 = pts[pts.length-2]; p2 = pts[pts.length-1]; }

    let x1 = p1.x, y1 = p1.y;
    let x2 = p2.x, y2 = p2.y;

    if (x1 === x2) {
        msgError.textContent = "Error: Dos valores de X son idénticos."; return;
    }

    // 3. Aplicar fórmula lineal: y = ((x - x1) / (x2 - x1)) * (y2 - y1) + y1
    let numeradorX = valX - x1;
    let denominadorX = x2 - x1;
    let factorX = numeradorX / denominadorX;
    let restaY = y2 - y1;
    let y_interp = (factorX * restaY) + y1;

    // 4. Escribir paso a paso
    let pasosLog = "--- BÚSQUEDA DE INTERVALO ---\n";
    pasosLog += `Para x = ${valX}, se usan los puntos adyacentes de la tabla:\n`;
    pasosLog += `Punto 1: x₁ = ${x1}, y₁ = ${y1}\n`;
    pasosLog += `Punto 2: x₂ = ${x2}, y₂ = ${y2}\n\n`;

    pasosLog += "--- FÓRMULA DE INTERPOLACIÓN LINEAL ---\n";
    pasosLog += "y = [ (x - x₁) / (x₂ - x₁) ] * (y₂ - y₁) + y₁\n\n";
    
    pasosLog += "--- SUSTITUCIÓN Y CÁLCULO ---\n";
    pasosLog += `y = [ (${valX} - ${x1}) / (${x2} - ${x1}) ] * (${y2} - ${y1}) + ${y1}\n`;
    pasosLog += `y = [ (${numeradorX}) / (${denominadorX}) ] * (${restaY}) + ${y1}\n`;
    pasosLog += `y = [ ${factorX.toFixed(6)} ] * (${restaY}) + ${y1}\n`;
    pasosLog += `y = ${parseFloat((factorX * restaY).toFixed(6))} + ${y1}\n`;
    pasosLog += `y = ${y_interp.toFixed(6)}\n\n`;

    document.getElementById('resultado-funcion').innerHTML = `Fórmula: y = [ (x - ${x1}) / (${x2} - ${x1}) ] * (${y2} - ${y1}) + ${y1}`;
    document.getElementById('resultado-evaluacion').innerHTML = `Resultado: y(${valX}) = ${y_interp.toFixed(4)}`;

    if (valVerdaderoStr !== '') {
        let valV = parseFloat(valVerdaderoStr);
        let errorRelativo = Math.abs((valV - y_interp) / valV) * 100;
        document.getElementById('resultado-error').innerHTML = `Error Relativo (E_t) = ${errorRelativo.toFixed(2)}%`;
        pasosLog += `--- ERROR ---\nEt = |(${valV} - ${y_interp.toFixed(4)}) / ${valV}| * 100% = ${errorRelativo.toFixed(2)}%\n`;
    }

    document.getElementById('paso-a-paso').textContent = pasosLog;

    // 5. Gráfica
    generarGraficaLineal(pts, x1, y1, x2, y2, valX, y_interp);
}

function generarGraficaLineal(todosLosPuntos, x1, y1, x2, y2, xInterp, yInterp) {
    const ctx = document.getElementById('graficaInterpolacion').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    const puntoInterpolado = [{ x: xInterp, y: yInterp }];
    const segmentoActivo = [{x: x1, y: y1}, {x: x2, y: y2}];

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Tabla Completa',
                    data: todosLosPuntos,
                    borderColor: '#1F3A5F',
                    backgroundColor: '#1F3A5F',
                    showLine: true,
                    borderWidth: 1,
                    pointRadius: 4,
                    borderDash: [5, 5]
                },
                {
                    label: 'Segmento Utilizado',
                    data: segmentoActivo,
                    borderColor: '#2FA36B',
                    backgroundColor: '#2FA36B',
                    showLine: true,
                    borderWidth: 3,
                    pointRadius: 6
                },
                {
                    label: `Resultado: ${yInterp.toFixed(2)}`,
                    data: puntoInterpolado,
                    type: 'scatter',
                    backgroundColor: '#D64545',
                    pointRadius: 8,
                    pointStyle: 'rectRot'
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { type: 'linear', position: 'bottom', title: {display: true, text: 'X (Horas)'} },
                y: { title: {display: true, text: 'Y (Grados)'} }
            }
        }
    });
}

function borrarDatos() {
    generarInputsPuntos();
    document.getElementById('valX').value = '';
    document.getElementById('valVerdadero').value = '';
    document.getElementById('resultado-funcion').innerHTML = '';
    document.getElementById('resultado-evaluacion').innerHTML = '';
    document.getElementById('resultado-error').innerHTML = '';
    document.getElementById('error-msg').textContent = '';
    document.getElementById('paso-a-paso').textContent = '';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18); doc.setTextColor(31, 58, 95);
    doc.text("Interpolación Lineal", 14, 20);
    
    doc.setFontSize(12); doc.setTextColor(0);
    let resFunc = document.getElementById('resultado-funcion').textContent;
    let resEval = document.getElementById('resultado-evaluacion').textContent;
    let resErr = document.getElementById('resultado-error').textContent;
    
    doc.text(resFunc, 14, 30);
    doc.text(resEval, 14, 40);
    if(resErr) doc.text(resErr, 14, 50);

    const canvas = document.getElementById('graficaInterpolacion');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        let finalY = resErr ? 60 : 50;
        doc.setFontSize(14); doc.setTextColor(31, 58, 95);
        doc.text("Gráfica", 14, finalY);
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, 80);
    }
    doc.save("Interpolacion_Lineal_Reporte.pdf");
}