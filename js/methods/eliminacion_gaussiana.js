// js/methods/eliminacionGaussiana.js

let matrizActual = [];
let chartInstance = null; // Variable global para el gráfico

// 1. Generar la Interfaz de la Matriz (Inputs)
function generarMatrizUI() {
    const n = parseInt(document.getElementById('numIncognitas').value);
    const container = document.getElementById('matriz-container');
    
    if (n < 2 || n > 10) {
        alert("El número de incógnitas debe estar entre 2 y 10.");
        return;
    }

    let html = '<table style="margin: 0 auto; border-spacing: 10px; border-collapse: separate;">';
    
    // Encabezados
    html += '<tr>';
    for(let i=1; i<=n; i++) html += `<th style="color:var(--text-secondary);">x${i}</th>`;
    html += '<th style="color:var(--primary-dark);">= b</th></tr>';

    // Filas de inputs
    for (let i = 0; i < n; i++) {
        html += '<tr>';
        for (let j = 0; j < n; j++) {
            html += `<td><input type="number" id="a_${i}_${j}" class="matrix-input" placeholder="a${i+1}${j+1}" style="width: 70px; text-align: center; padding: 5px; border: 1px solid var(--border); border-radius: 4px;"></td>`;
        }
        // Input para el vector b
        html += `<td><input type="number" id="b_${i}" class="matrix-input" placeholder="b${i+1}" style="width: 70px; text-align: center; padding: 5px; border: 2px solid var(--border); border-radius: 4px; background-color: #fafafa;"></td>`;
        html += '</tr>';
    }
    html += '</table>';
    container.innerHTML = html;
}

// 2. Función Principal: Algoritmo de Gauss
function calcularGauss() {
    const n = parseInt(document.getElementById('numIncognitas').value);
    const msgError = document.getElementById('error-msg');
    const pasoDiv = document.getElementById('paso-a-paso');
    const resultDiv = document.getElementById('resultado-vector');

    // Limpieza
    msgError.textContent = '';
    pasoDiv.textContent = '';
    resultDiv.innerHTML = 'Calculando...';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

    // Leer datos
    let A = []; 
    try {
        for (let i = 0; i < n; i++) {
            let row = [];
            for (let j = 0; j < n; j++) {
                let val = document.getElementById(`a_${i}_${j}`).value;
                if(val === '') throw new Error("Faltan coeficientes.");
                row.push(parseFloat(val));
            }
            let valB = document.getElementById(`b_${i}`).value;
            if(valB === '') throw new Error("Faltan constantes.");
            row.push(parseFloat(valB)); 
            A.push(row);
        }
    } catch (e) {
        msgError.textContent = e.message;
        resultDiv.innerHTML = "Error en entrada.";
        return;
    }

    let pasosLog = "--- MATRIZ INICIAL AUMENTADA ---\n";
    pasosLog += imprimirMatriz(A, n);

    // ETAPA 1: ELIMINACIÓN HACIA ADELANTE
    for (let i = 0; i < n; i++) {
        // Pivoteo Simple
        if (Math.abs(A[i][i]) < 1e-12) {
            let swapIdx = -1;
            for(let k = i + 1; k < n; k++){
                if(Math.abs(A[k][i]) > 1e-12) { swapIdx = k; break; }
            }
            if(swapIdx !== -1) {
                let temp = A[i]; A[i] = A[swapIdx]; A[swapIdx] = temp;
                pasosLog += `\n> Intercambio de Fila ${i+1} con Fila ${swapIdx+1} (Pivoteo)\n`;
            } else {
                msgError.textContent = "El sistema no tiene solución única (Matriz Singular).";
                pasoDiv.textContent = pasosLog + "\nFALLO: Pivote nulo.";
                resultDiv.innerHTML = "Sin solución única.";
                return;
            }
        }

        // Hacer ceros
        for (let j = i + 1; j < n; j++) {
            let factor = A[j][i] / A[i][i];
            if (Math.abs(factor) < 1e-12) continue;

            pasosLog += `\n> Fila ${j+1} = Fila ${j+1} - (${factor.toFixed(4)}) * Fila ${i+1}\n`;
            for (let k = i; k < n + 1; k++) {
                A[j][k] = A[j][k] - factor * A[i][k];
            }
        }
        pasosLog += imprimirMatriz(A, n);
    }

    // ETAPA 2: SUSTITUCIÓN HACIA ATRÁS
    let X = new Array(n).fill(0);
    if (Math.abs(A[n-1][n-1]) < 1e-12) {
        msgError.textContent = "El sistema tiene infinitas soluciones o no tiene solución.";
        resultDiv.innerHTML = "Sin solución única.";
        return;
    }

    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) {
            sum += A[i][j] * X[j];
        }
        X[i] = (A[i][n] - sum) / A[i][i];
    }

    // MOSTRAR RESULTADOS
    pasoDiv.textContent = pasosLog;
    matrizActual = A;

    // --- FORMATEO ESTRICTO A 4 DECIMALES PARA LA RESPUESTA ---
    let htmlRes = '<ul style="list-style:none; padding:0;">';
    X.forEach((val, idx) => {
        // Evitar el -0.0000 visualmente
        let valorFinal = Math.abs(val) < 1e-10 ? 0 : val;
        htmlRes += `<li style="margin-bottom:8px; display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding-bottom:4px;">
            <span style="color:var(--text-secondary);">x<sub>${idx+1}</sub> = </span> 
            <span style="color:var(--action-success); font-weight:bold;">${valorFinal.toFixed(4)}</span>
        </li>`;
    });
    htmlRes += '</ul>';
    resultDiv.innerHTML = htmlRes;

    // Generar Gráfica
    generarGrafica(X);
}

// Función para generar la gráfica de barras
function generarGrafica(vectorX) {
    const ctx = document.getElementById('graficaSolucion').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    const labels = vectorX.map((_, i) => `x${i+1}`);
    const backgroundColors = vectorX.map(val => val >= 0 ? 'rgba(47, 109, 179, 0.6)' : 'rgba(214, 69, 69, 0.6)');
    const borderColors = vectorX.map(val => val >= 0 ? '#2F6DB3' : '#D64545');

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valor de la Incógnita',
                data: vectorX,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Magnitud de las Variables' }
            }
        }
    });
}

// Auxiliar para imprimir matriz en texto (Formateada a 4 decimales)
function imprimirMatriz(M, n) {
    let txt = "";
    for(let i=0; i<n; i++) {
        txt += "| ";
        for(let j=0; j<n+1; j++) {
            // Evitar -0.0000 en la matriz impresa
            let val = Math.abs(M[i][j]) < 1e-10 ? 0 : M[i][j];
            txt += val.toFixed(4).padStart(10, " ") + " ";
            if(j === n-1) txt += "| ";
        }
        txt += "|\n";
    }
    return txt + "\n";
}

function borrarDatos() {
    generarMatrizUI();
    document.getElementById('resultado-vector').innerHTML = '<p style="color:var(--text-disabled);">Esperando cálculo...</p>';
    document.getElementById('paso-a-paso').textContent = '';
    document.getElementById('error-msg').textContent = '';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}

// Función de Exportación PDF con Gráfica
function exportarPDF() {
    const pasoText = document.getElementById('paso-a-paso').textContent;
    if (!pasoText) { alert("Sin resultados para exportar."); return; }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18); doc.setTextColor(31, 58, 95);
    doc.text("Reporte: Eliminación Gaussiana", 14, 20);
    
    doc.setFontSize(11); doc.setTextColor(0);
    
    // Resultados
    const resultados = document.getElementById('resultado-vector').innerText;
    doc.text("Solución del Sistema:", 14, 30);
    doc.setFont("courier", "normal");
    doc.text(resultados, 14, 40);

    // Procedimiento
    doc.setFont("helvetica", "bold");
    doc.text("Procedimiento de Eliminación:", 14, 90);
    
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    
    // Texto largo (Paginación)
    const lineas = pasoText.split('\n');
    let y = 100;
    
    lineas.forEach(line => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        doc.text(line, 14, y);
        y += 5;
    });

    // AGREGAR GRÁFICA EN PÁGINA NUEVA
    const canvas = document.getElementById('graficaSolucion');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        doc.addPage(); // Forzar nueva página para la gráfica
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(31, 58, 95);
        doc.text("Gráfica de la Solución", 14, 20); // Título
        
        doc.addImage(imgData, 'PNG', 15, 30, 180, 100);
    }

    doc.save("Gaussiana_Reporte.pdf");
}