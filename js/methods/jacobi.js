// JavaScript Document
// js/methods/jacobi.js

let chartInstance = null;
let currentDim = 3;

// 1. Generar Inputs de la Matriz Dinámicamente
function crearMatrizInput() {
    const n = parseInt(document.getElementById('dimension').value);
    const container = document.getElementById('matrix-container');
    currentDim = n;
    
    if (n < 2 || n > 10) {
        alert("Por favor elige una dimensión entre 2 y 10.");
        return;
    }

    let html = '<p style="margin-bottom:10px; font-weight:bold; color:#2F6DB3;">Ingrese los coeficientes (A) y constantes (b):</p>';
    html += '<table style="margin: 0 auto;">'; // Centrado

    for (let i = 0; i < n; i++) {
        html += '<tr>';
        // Matriz A
        for (let j = 0; j < n; j++) {
            html += `<td style="padding: 5px;">
                        <input type="number" id="a_${i}_${j}" class="matrix-input" placeholder="x${j+1}" style="width: 60px; text-align: center;">
                     </td>`;
        }
        // Separador visual
        html += '<td style="padding: 0 10px; font-weight:bold;">=</td>';
        // Vector b
        html += `<td style="padding: 5px;">
                    <input type="number" id="b_${i}" class="matrix-input" placeholder="b${i+1}" style="width: 60px; text-align: center; border-color: #2FA36B;">
                 </td>`;
        html += '</tr>';
    }
    html += '</table>';
    
    container.innerHTML = html;
}

// 2. Función Principal: Calcular Jacobi
function calcularJacobi() {
    const n = currentDim;
    const tol = parseFloat(document.getElementById('tol').value) || 0.001; // Estandarizado a 0.001
    const maxIter = parseInt(document.getElementById('maxIter').value) || 100;
    
    const tbody = document.querySelector('#tabla-resultados tbody');
    const theadRow = document.getElementById('table-head-row');
    const msgError = document.getElementById('error-msg');
    const resultDiv = document.getElementById('paso-a-paso');

    // Limpieza
    tbody.innerHTML = '';
    theadRow.innerHTML = '';
    msgError.textContent = '';
    resultDiv.textContent = '';

    // --- A. Construir Estructuras de Datos ---
    let A = [];
    let b = [];
    let x_prev = new Array(n).fill(0); // Vector inicial (0,0,0...)
    let x_curr = new Array(n).fill(0);

    // Leer inputs del DOM
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

    // --- B. Validaciones Matemáticas ---
    // Verificar ceros en la diagonal
    for (let i = 0; i < n; i++) {
        if (Math.abs(A[i][i]) < 1e-10) {
            msgError.textContent = `Error: El elemento diagonal a_${i+1}${i+1} es cero. No se puede dividir. Se requiere reordenar filas (pivoteo).`;
            return;
        }
    }

    // Verificar Dominancia Diagonal (Advertencia)
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
        warningMsg = "⚠️ Advertencia: La matriz NO es diagonalmente dominante. El método podría no converger.\n\n";
    }

    // --- C. Configurar Tabla ---
    // Cabeceras: Iter, x1, x2..., xn, Error
    let heads = '<th>Iter</th>';
    for(let i=0; i<n; i++) heads += `<th>x${i+1}</th>`;
    heads += '<th>Error</th>';
    theadRow.innerHTML = heads;

    // --- D. Algoritmo Jacobi ---
    let error = 100;
    let iter = 0;
    let labels = [];
    let dataError = [];

    while (error > tol && iter < maxIter) {
        
        // Calcular nuevos valores x_curr
        for (let i = 0; i < n; i++) {
            let sigma = 0;
            for (let j = 0; j < n; j++) {
                if (j !== i) {
                    sigma += A[i][j] * x_prev[j]; // Usamos x_prev (Jacobi)
                }
            }
            // Fórmula: x_i = (b_i - Sum(a_ij * x_j)) / a_ii
            x_curr[i] = (b[i] - sigma) / A[i][i];
        }

        // Calcular Error (Norma Euclidiana entre x_curr y x_prev)
        let sumDiffSq = 0;
        for (let i = 0; i < n; i++) {
            sumDiffSq += Math.pow(x_curr[i] - x_prev[i], 2);
        }
        error = Math.sqrt(sumDiffSq); // Norma simple

        // Si es la primera iteración, el error se omite visualmente como 100
        if(iter === 0) error = 100; 

        // Agregar fila a tabla con 4 decimales
        let rowHtml = `<td>${iter + 1}</td>`;
        for(let i=0; i<n; i++) {
            rowHtml += `<td style="font-weight:bold; color:#2C3E50">${x_curr[i].toFixed(4)}</td>`;
        }
        rowHtml += `<td>${iter === 0 ? '-' : error.toFixed(4)}</td>`;
        tbody.innerHTML += `<tr>${rowHtml}</tr>`;

        // Actualizar datos para siguiente iter
        x_prev = [...x_curr]; // Copia por valor
        
        // Datos gráfica
        labels.push(iter + 1);
        dataError.push(error);
        
        // Safety break para valores infinitos
        if (error > 1e10) {
            msgError.textContent = "El método diverge (valores infinitos).";
            break;
        }

        iter++;
    }

    // --- E. Resultados Finales ---
    let resLog = warningMsg;
    resLog += `Solución aproximada en ${iter} iteraciones:\n`;
    for(let i=0; i<n; i++) {
        // Formato final a 4 decimales
        resLog += `x${i+1} = ${x_curr[i].toFixed(4)}\n`;
    }
    resultDiv.textContent = resLog;

    generarGrafica(labels, dataError);
}

// 3. Borrar Datos
function borrarDatos() {
    document.getElementById('tol').value = '0.001'; // Actualizado a 0.001
    document.getElementById('maxIter').value = '100';
    crearMatrizInput(); // Reinicia la matriz inputs
    document.querySelector('#tabla-resultados tbody').innerHTML = '';
    document.getElementById('table-head-row').innerHTML = '';
    document.getElementById('error-msg').textContent = '';
    document.getElementById('paso-a-paso').textContent = '';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}

// 4. Gráfica
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
                borderColor: '#D64545', // Rojo estandarizado
                backgroundColor: 'rgba(214, 69, 69, 0.1)',
                fill: true,
                borderWidth: 2,
                pointRadius: 4,
                tension: 0.2
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: { 
                y: { beginAtZero: true, title: { display: true, text: 'Norma del Error' } },
                x: { title: { display: true, text: 'Iteración' } }
            } 
        }
    });
}

// 5. PDF
function exportarPDF() {
    const tbody = document.querySelector('#tabla-resultados tbody');
    if (tbody.children.length === 0) { alert("Sin resultados para exportar."); return; }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18); doc.setTextColor(31, 58, 95);
    doc.text("Reporte: Método de Jacobi", 14, 20);
    doc.setFontSize(12); doc.setTextColor(0);
    
    // Imprimir Resultados Finales
    const finalRes = document.getElementById('paso-a-paso').textContent;
    const splitTitle = doc.splitTextToSize(finalRes, 180);
    doc.text(splitTitle, 14, 30);

    // Tabla con ajuste de fuente dinámica si el sistema es muy grande (ej. 10x10)
    let fontSizeTable = currentDim > 5 ? 7 : 9;

    doc.autoTable({ 
        html: '#tabla-resultados', 
        startY: 60, 
        theme: 'grid', 
        headStyles: { fillColor: [31, 58, 95] },
        styles: { fontSize: fontSizeTable, cellPadding: 2 }
    });

    const canvas = document.getElementById('graficaError');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        let finalY = doc.lastAutoTable.finalY + 15;
        const pageHeight = doc.internal.pageSize.height;
        const imgHeight = 80;

        if (finalY + imgHeight > pageHeight) { doc.addPage(); finalY=20; }
        
        doc.setFontSize(14); doc.setTextColor(31, 58, 95);
        doc.text("Gráfica de Convergencia del Error", 14, finalY);
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, imgHeight);
    }
    doc.save("Jacobi_Reporte.pdf");
}