// JavaScript Document
// js/methods/gauss_jordan.js

let matrizActual = [];
let chartInstance = null;

// 1. Generar la Interfaz (Idéntico a Gaussiana)
function generarMatrizUI() {
    const n = parseInt(document.getElementById('numIncognitas').value);
    const container = document.getElementById('matriz-container');
    
    if (n < 2 || n > 10) {
        alert("El número de incógnitas debe estar entre 2 y 10.");
        return;
    }

    let html = '<table style="margin: 0 auto; border-spacing: 10px; border-collapse: separate;">';
    html += '<tr>';
    for(let i=1; i<=n; i++) html += `<th style="color:var(--text-secondary);">x${i}</th>`;
    html += '<th style="color:var(--primary-dark);">= b</th></tr>';

    for (let i = 0; i < n; i++) {
        html += '<tr>';
        for (let j = 0; j < n; j++) {
            html += `<td><input type="number" id="a_${i}_${j}" class="matrix-input" placeholder="a${i+1}${j+1}" style="width: 70px; text-align: center; padding: 5px; border: 1px solid var(--border); border-radius: 4px;"></td>`;
        }
        html += `<td><input type="number" id="b_${i}" class="matrix-input" placeholder="b${i+1}" style="width: 70px; text-align: center; padding: 5px; border: 2px solid var(--border); border-radius: 4px; background-color: #fafafa;"></td>`;
        html += '</tr>';
    }
    html += '</table>';
    container.innerHTML = html;
}

// 2. Función Principal: Gauss-Jordan
function calcularGaussJordan() {
    const n = parseInt(document.getElementById('numIncognitas').value);
    const msgError = document.getElementById('error-msg');
    const pasoDiv = document.getElementById('paso-a-paso');
    const resultDiv = document.getElementById('resultado-vector');

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

    let pasosLog = "--- MATRIZ INICIAL ---\n";
    pasosLog += imprimirMatriz(A, n);

    // --- ALGORITMO GAUSS-JORDAN ---
    for (let i = 0; i < n; i++) {
        
        // 1. Pivoteo Parcial (Estabilidad)
        let maxRow = i;
        for(let k = i + 1; k < n; k++){
            if(Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) { maxRow = k; }
        }

        if (Math.abs(A[maxRow][i]) < 1e-12) {
            msgError.textContent = "El sistema no tiene solución única (Matriz Singular).";
            pasoDiv.textContent = pasosLog + "\nFALLO: Pivote nulo en columna " + (i+1);
            resultDiv.innerHTML = "Sin solución única.";
            return;
        }

        // Intercambio de filas si es necesario
        if (maxRow !== i) {
            let temp = A[i]; A[i] = A[maxRow]; A[maxRow] = temp;
            pasosLog += `\n> Intercambio: Fila ${i+1} <-> Fila ${maxRow+1}\n`;
        }

        // 2. Normalizar la fila pivote (Hacer 1 en la diagonal)
        let pivot = A[i][i];
        pasosLog += `\n> Normalizar Fila ${i+1} (Dividir entre ${pivot.toFixed(4)})\n`;
        
        for (let j = i; j < n + 1; j++) {
            A[i][j] = A[i][j] / pivot;
        }
        pasosLog += imprimirMatriz(A, n);

        // 3. Eliminación (Hacer ceros arriba y abajo)
        for (let k = 0; k < n; k++) {
            if (k !== i) { // No operar sobre la fila del pivote
                let factor = A[k][i];
                if (Math.abs(factor) > 1e-12) {
                    pasosLog += `\n> Fila ${k+1} = Fila ${k+1} - (${factor.toFixed(4)}) * Fila ${i+1}\n`;
                    for (let j = i; j < n + 1; j++) {
                        A[k][j] = A[k][j] - factor * A[i][j];
                    }
                }
            }
        }
        pasosLog += imprimirMatriz(A, n);
    }

    // --- RESULTADOS ---
    // En Gauss-Jordan, la última columna (índice n) ya tiene las soluciones
    let X = [];
    for(let i=0; i<n; i++) {
        X.push(A[i][n]);
    }

    pasoDiv.textContent = pasosLog;
    matrizActual = A;

    let htmlRes = '<ul style="list-style:none; padding:0;">';
    X.forEach((val, idx) => {
        htmlRes += `<li style="margin-bottom:8px; display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding-bottom:4px;">
            <span style="color:var(--text-secondary);">x<sub>${idx+1}</sub> = </span> 
            <span style="color:var(--action-success); font-weight:bold;">${val.toFixed(6)}</span>
        </li>`;
    });
    htmlRes += '</ul>';
    resultDiv.innerHTML = htmlRes;

    generarGrafica(X);
}

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
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}

function imprimirMatriz(M, n) {
    let txt = "";
    for(let i=0; i<n; i++) {
        txt += "| ";
        for(let j=0; j<n+1; j++) {
            txt += M[i][j].toFixed(4).padStart(10, " ") + " ";
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

function exportarPDF() {
    const pasoText = document.getElementById('paso-a-paso').textContent;
    if (!pasoText) { alert("Sin resultados para exportar."); return; }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18); doc.setTextColor(31, 58, 95);
    doc.text("Reporte: Método Gauss-Jordan", 14, 20);
    
    doc.setFontSize(11); doc.setTextColor(0);
    const resultados = document.getElementById('resultado-vector').innerText;
    doc.text("Solución del Sistema:", 14, 30);
    doc.setFont("courier", "normal"); 
    doc.text(resultados, 14, 40);

    doc.setFont("helvetica", "bold");
    doc.text("Procedimiento (Diagonalización):", 14, 90);
    
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    
    const lineas = pasoText.split('\n');
    let y = 100;
    lineas.forEach(line => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, 14, y);
        y += 5;
    });

    const canvas = document.getElementById('graficaSolucion');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        doc.addPage();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(31, 58, 95);
        doc.text("Gráfica de la Solución", 14, 20);
        doc.addImage(imgData, 'PNG', 15, 30, 180, 100);
    }

    doc.save("GaussJordan_Reporte.pdf");
}