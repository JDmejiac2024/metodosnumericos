// JavaScript Document
// js/methods/lineal.js

let chartInstance = null;

function calcularInterpolacion() {
    // 1. Obtener valores de entrada con los nuevos IDs
    const x1 = parseFloat(document.getElementById('x1').value);
    const y1 = parseFloat(document.getElementById('y1').value);
    const x2 = parseFloat(document.getElementById('x2').value);
    const y2 = parseFloat(document.getElementById('y2').value);
    const x = parseFloat(document.getElementById('valX').value);
    const valVerdaderoStr = document.getElementById('valVerdadero').value;
    
    // Contenedores de resultados
    const divFuncion = document.getElementById('resultado-funcion');
    const divEvaluacion = document.getElementById('resultado-evaluacion');
    const divError = document.getElementById('resultado-error');
    const msgError = document.getElementById('error-msg');
    const divPasos = document.getElementById('paso-a-paso');

    // Limpieza inicial
    divFuncion.innerHTML = '';
    divEvaluacion.innerHTML = '';
    divError.innerHTML = '';
    msgError.textContent = '';
    divPasos.textContent = '';

    // Validaciones
    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2) || isNaN(x)) {
        msgError.textContent = "Error: Por favor ingresa los puntos x₁, y₁, x₂, y₂ y el valor a evaluar x.";
        return;
    }

    if (x1 === x2) {
        msgError.textContent = "Error: x₁ y x₂ no pueden ser iguales (causaría división por cero).";
        return;
    }

    // 2. Cálculo Matemático Basado Exactamente en la Fórmula: y = ((x - x1) / (x2 - x1)) * (y2 - y1) + y1
    let numeradorX = x - x1;
    let denominadorX = x2 - x1;
    let factorX = numeradorX / denominadorX;
    
    let restaY = y2 - y1;
    
    // Resultado Final
    let y_interp = (factorX * restaY) + y1;

    // 3. Generar Procedimiento Paso a Paso Idéntico al Ejemplo
    let pasosLog = "--- FÓRMULA DE INTERPOLACIÓN LINEAL ---\n";
    pasosLog += "y = [ (x - x₁) / (x₂ - x₁) ] * (y₂ - y₁) + y₁\n\n";
    
    pasosLog += "--- 1. DATOS IDENTIFICADOS ---\n";
    pasosLog += `x₁ = ${x1} \t\t y₁ = ${y1}\n`;
    pasosLog += `x₂ = ${x2} \t\t y₂ = ${y2}\n`;
    pasosLog += `x  = ${x}\n\n`;
    
    pasosLog += "--- 2. SUSTITUCIÓN Y CÁLCULO ---\n";
    pasosLog += `y = [ (${x} - ${x1}) / (${x2} - ${x1}) ] * (${y2} - ${y1}) + ${y1}\n`;
    pasosLog += `y = [ (${numeradorX}) / (${denominadorX}) ] * (${restaY}) + ${y1}\n`;
    pasosLog += `y = [ ${factorX.toFixed(6)} ] * (${restaY}) + ${y1}\n`;
    pasosLog += `y = ${parseFloat((factorX * restaY).toFixed(6))} + ${y1}\n`;
    pasosLog += `y = ${y_interp.toFixed(6)}\n\n`;

    // Imprimir Resultados Visuales en la Interfaz
    divFuncion.innerHTML = `Fórmula Armada: y = [ (x - ${x1}) / (${x2} - ${x1}) ] * (${y2} - ${y1}) + ${y1}`;
    divEvaluacion.innerHTML = `Resultado: y = ${y_interp.toFixed(6)}`;

    // 4. Calcular Error Verdadero (Si se proporcionó)
    if (valVerdaderoStr !== '') {
        let valVerdadero = parseFloat(valVerdaderoStr);
        let errorRelativo = Math.abs((valVerdadero - y_interp) / valVerdadero) * 100;
        
        divError.innerHTML = `Error Relativo (E_t) = ${errorRelativo.toFixed(2)}%`;
        
        pasosLog += "--- 3. CÁLCULO DE ERROR VERDADERO (Et) ---\n";
        pasosLog += `Et = | (Valor Verdadero - Valor Aproximado) / Valor Verdadero | * 100%\n`;
        pasosLog += `Et = | (${valVerdadero} - ${y_interp.toFixed(6)}) / ${valVerdadero} | * 100%\n`;
        pasosLog += `Et = ${errorRelativo.toFixed(2)}%\n`;
    }

    divPasos.textContent = pasosLog;

    // 5. Renderizar Gráfica con los nuevos valores
    generarGrafica(x1, y1, x2, y2, x, y_interp);
}

function generarGrafica(x1, y1, x2, y2, xInterp, yInterp) {
    const ctx = document.getElementById('graficaInterpolacion').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    const puntosOriginales = [
        { x: x1, y: y1 },
        { x: x2, y: y2 }
    ];

    const puntoInterpolado = [
        { x: xInterp, y: yInterp }
    ];

    puntosOriginales.sort((a, b) => a.x - b.x);

    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Línea de Interpolación',
                    data: puntosOriginales,
                    borderColor: '#2FA36B',
                    backgroundColor: '#2FA36B',
                    showLine: true,
                    borderWidth: 2,
                    pointRadius: 6
                },
                {
                    label: `Punto Interpolado (${xInterp}, ${yInterp.toFixed(4)})`,
                    data: puntoInterpolado,
                    backgroundColor: '#D64545',
                    borderColor: '#D64545',
                    pointRadius: 8,
                    pointStyle: 'rectRot'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { type: 'linear', position: 'bottom', title: {display: true, text: 'X'} },
                y: { title: {display: true, text: 'Y'} }
            }
        }
    });
}

function borrarDatos() {
    document.getElementById('x1').value = '';
    document.getElementById('y1').value = '';
    document.getElementById('x2').value = '';
    document.getElementById('y2').value = '';
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