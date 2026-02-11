// JavaScript Document
// js/methods/gauss_seidel.js

let chartInstance = null;
let currentDim = 3;

// 1. Generar Inputs (Igual que Jacobi, reutilizable)
function crearMatrizInput() {
    const n = parseInt(document.getElementById('dimension').value);
    const container = document.getElementById('matrix-container');
    currentDim = n;
    
    if (n < 2 || n > 10) {
        alert("Por favor elige una dimensión entre 2 y 10.");
        return;
    }

    let html = '<p style="margin-bottom:10px; font-weight:bold; color:#2F6DB3;">Ingrese los coeficientes (A) y constantes (b):</p>';
    html += '<table style="margin: 0 auto;">';

    for (let i = 0; i < n; i++) {
        html += '<tr>';
        for (let j = 0; j < n; j++) {
            html += `<td style="padding: 5px;">
                        <input type="number" id="a_${i}_${j}" class="matrix-input" placeholder="x${j+1}" style="width: 60px; text-align: center;">
                     </td>`;
        }
        html += '<td style="padding: 0 10px; font-weight:bold;">=</td>';
        html += `<td style="padding: 5px;">
                    <input type="number" id="b_${i}" class="matrix-input" placeholder="b${i+1}" style="width: 60px; text-align: center; border-color: #2FA36B;">
                 </td>`;
        html += '</tr>';
    }
    html += '</table>';
    
    container.innerHTML = html;
}

// 2. Función Principal: Calcular Gauss-Seidel
function calcularGaussSeidel() {
    const n = currentDim;
    const tol = parseFloat(document.getElementById('tol').value) || 0.0001;
    const maxIter = parseInt(document.getElementById('maxIter').value) || 100;
    
    const tbody = document.querySelector('#tabla-resultados tbody');
    const theadRow = document.getElementById('table-head-row');
    const msgError = document.getElementById('error-msg');
    const resultDiv = document.getElementById('paso-a-paso');

    tbody.innerHTML = '';
    theadRow.innerHTML = '';
    msgError.textContent = '';
    resultDiv.textContent = '';

    // --- A. Construir Matrices ---
    let A = [];
    let b = [];
    let x = new Array(n).fill(0); // Vector solución (se actualiza in-place)

    try {
        for (let i = 0; i < n; i++) {
            let row = [];
            for (let j = 0; j < n; j++) {
                const val = document.getElementById(`a_${i}_${j}`).value;
                if (val === '') throw new Error("Faltan coeficientes.");
                row.push(parseFloat(val));
            }
            A.push(row);
            const valB = document.getElementById(`b_${i}`).value;
            if (valB === '') throw new Error("Faltan constantes.");
            b.push(parseFloat(valB));
        }
    } catch (e) {
        msgError.textContent = "Error: Por favor llena todos los campos de la matriz.";
        return;
    }

    // --- B. Validaciones ---
    for (let i = 0; i < n; i++) {
        if (Math.abs(A[i][i]) < 1e-10) {
            msgError.textContent = `Error: El elemento diagonal a_${i+1}${i+1} es cero. Se requiere reordenar filas.`;
            return;
        }
    }

    let esDominante = true;
    for (let i = 0; i < n; i++) {
        let diag = Math.abs(A[i][i]);
        let sumaOtros = 0;
        for (let j = 0; j < n; j++) {
            if (i !== j) sumaOtros += Math.abs(A[i][j]);
        }
        if (diag <= sumaOtros) esDominante = false;
    }
    
    let warningMsg = "";
    if (!esDominante) {
        warningMsg = "⚠️ Advertencia: La matriz NO es diagonalmente dominante. Gauss-Seidel podría no converger.\n\n";
    }

    // --- C. Configurar Tabla ---
    let heads = '<th>Iter</th>';
    for(let i=0; i<n; i++) heads += `<th>x${i+1}</th>`;
    heads += '<th>Error</th>';
    theadRow.innerHTML = heads;

    // --- D. Algoritmo Gauss-Seidel ---
    let error = 100;
    let iter = 0;
    let labels = [];
    let dataError = [];
    let x_old = []; // Para calcular el error comparando con la iteración anterior

    while (error > tol && iter < maxIter) {
        
        // Guardamos copia del vector antes de empezar la ronda de actualizaciones
        x_old = [...x];

        // Recorremos cada ecuación
        for (let i = 0; i < n; i++) {
            let sigma = 0;
            for (let j = 0; j < n; j++) {
                if (j !== i) {
                    // AQUÍ ESTÁ LA MAGIA DE GAUSS-SEIDEL:
                    // Usamos x[j] directamente del array 'x'. 
                    // Si j < i, x[j] ya fue actualizado en este ciclo (valor nuevo).
                    // Si j > i, x[j] es valor del ciclo anterior (valor viejo).
                    sigma += A[i][j] * x[j];
                }
            }
            x[i] = (b[i] - sigma) / A[i][i]; // Actualización inmediata
        }

        // Calcular Error (Norma Euclidiana entre x actual y x_old)
        let sumDiffSq = 0;
        for (let i = 0; i < n; i++) {
            sumDiffSq += Math.pow(x[i] - x_old[i], 2);
        }
        error = Math.sqrt(sumDiffSq);

        if(iter === 0) error = 100; 

        // Tabla
        let rowHtml = `<td>${iter + 1}</td>`;
        for(let i=0; i<n; i++) {
            rowHtml += `<td>${x[i].toFixed(5)}</td>`;
        }
        rowHtml += `<td>${error.toFixed(5)}</td>`;
        tbody.innerHTML += `<tr>${rowHtml}</tr>`;
        
        // Gráfica
        labels.push(iter + 1);
        dataError.push(error);
        
        if (error > 1e10) {
            msgError.textContent = "El método diverge (valores infinitos).";
            break;
        }

        iter++;
    }

    // --- E. Resultados ---
    let resLog = warningMsg;
    resLog += `Solución aproximada en ${iter} iteraciones:\n`;
    for(let i=0; i<n; i++) {
        resLog += `x${i+1} = ${x[i].toFixed(6)}\n`;
    }
    resultDiv.textContent = resLog;

    generarGrafica(labels, dataError);
}

function borrarDatos() {
    crearMatrizInput(); 
    document.querySelector('#tabla-resultados tbody').innerHTML = '';
    document.getElementById('error-msg').textContent = '';
    document.getElementById('paso-a-paso').textContent = '';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}

function generarGrafica(labels, data) {
    const ctx = document.getElementById('graficaError').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Error (Norma)',
                data: data,
                borderColor: '#D64545', // Color Naranja para diferenciar de Jacobi
                backgroundColor: 'rgba(214, 69, 69, 0.1)',
                fill: true,
                tension: 0.2
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

function exportarPDF() {
    const tbody = document.querySelector('#tabla-resultados tbody');
    if (tbody.children.length === 0) { alert("Sin resultados para exportar."); return; }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18); doc.setTextColor(31, 58, 95);
    doc.text("Reporte: Método de Gauss-Seidel", 14, 20);
    doc.setFontSize(12); doc.setTextColor(0);
    
    const finalRes = document.getElementById('paso-a-paso').textContent;
    const splitTitle = doc.splitTextToSize(finalRes, 180);
    doc.text(splitTitle, 14, 30);

    doc.autoTable({ html: '#tabla-resultados', startY: 50, theme: 'grid', headStyles: { fillColor: [31, 58, 95] } });

    const canvas = document.getElementById('graficaError');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        let finalY = doc.lastAutoTable.finalY + 10;
        if (finalY + 80 > doc.internal.pageSize.height) { doc.addPage(); finalY=20; }
        
        doc.setFontSize(14);
        doc.setTextColor(31, 58, 95);
        doc.text("Gráfica de Convergencia", 14, finalY);
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, 80);
    }
    doc.save("GaussSeidel_Reporte.pdf");
}