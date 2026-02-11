// JavaScript Document
// js/methods/factorizacion_lu.js

let matrizActual = [];
let chartInstance = null;

// 1. Generar la Interfaz (Igual a los anteriores)
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

// 2. Función Principal: Factorización LU
function calcularLU() {
    const n = parseInt(document.getElementById('numIncognitas').value);
    const msgError = document.getElementById('error-msg');
    const pasoDiv = document.getElementById('paso-a-paso');
    const resultDiv = document.getElementById('resultado-vector');

    msgError.textContent = '';
    pasoDiv.textContent = '';
    resultDiv.innerHTML = 'Calculando...';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

    // Leer datos A y b
    let A = [];
    let b = [];
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
            b.push(parseFloat(valB));
            A.push(row);
        }
    } catch (e) {
        msgError.textContent = e.message;
        resultDiv.innerHTML = "Error en entrada.";
        return;
    }

    let pasosLog = "--- INICIO FACTORIZACIÓN LU (Doolittle) ---\n\n";

    // Inicializar L y U
    // L tiene 1s en la diagonal
    // U tiene 0s inicialmente
    let L = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
    let U = Array.from({ length: n }, () => Array(n).fill(0));

    // --- DESCOMPOSICIÓN ---
    for (let i = 0; i < n; i++) {
        // Calcular filas de U
        for (let k = i; k < n; k++) {
            let sum = 0;
            for (let j = 0; j < i; j++) {
                sum += (L[i][j] * U[j][k]);
            }
            U[i][k] = A[i][k] - sum;
        }

        // Calcular columnas de L
        for (let k = i + 1; k < n; k++) {
            let sum = 0;
            for (let j = 0; j < i; j++) {
                sum += (L[k][j] * U[j][i]);
            }
            if (Math.abs(U[i][i]) < 1e-12) {
                msgError.textContent = "El sistema requiere pivoteo (división por cero en U).";
                pasoDiv.textContent = pasosLog + `\nFALLO: U[${i+1}][${i+1}] es 0.`;
                resultDiv.innerHTML = "Fallo: División por 0.";
                return;
            }
            L[k][i] = (A[k][i] - sum) / U[i][i];
        }
    }

    pasosLog += "1. Matriz L (Lower - Triangular Inferior):\n";
    pasosLog += imprimirMatrizSimple(L, n);
    
    pasosLog += "\n2. Matriz U (Upper - Triangular Superior):\n";
    pasosLog += imprimirMatrizSimple(U, n);

    // --- RESOLUCIÓN ---
    
    // 1. Resolver L * d = b (Sustitución hacia adelante)
    let d = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < i; j++) {
            sum += L[i][j] * d[j];
        }
        d[i] = (b[i] - sum) / L[i][i]; // L[i][i] siempre es 1 en Doolittle, pero lo dejamos por generalidad
    }

    pasosLog += "\n3. Vector intermedio d (L*d = b):\n";
    pasosLog += "[" + d.map(val => val.toFixed(4)).join(", ") + "]\n";

    // 2. Resolver U * x = d (Sustitución hacia atrás)
    let x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) {
            sum += U[i][j] * x[j];
        }
        if (Math.abs(U[i][i]) < 1e-12) {
             msgError.textContent = "Sistema singular.";
             return;
        }
        x[i] = (d[i] - sum) / U[i][i];
    }

    // --- RESULTADOS ---
    pasoDiv.textContent = pasosLog;
    matrizActual = x; 

    let htmlRes = '<ul style="list-style:none; padding:0;">';
    x.forEach((val, idx) => {
        htmlRes += `<li style="margin-bottom:8px; display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding-bottom:4px;">
            <span style="color:var(--text-secondary);">x<sub>${idx+1}</sub> = </span> 
            <span style="color:var(--action-success); font-weight:bold;">${val.toFixed(6)}</span>
        </li>`;
    });
    htmlRes += '</ul>';
    resultDiv.innerHTML = htmlRes;

    generarGrafica(x);
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
                label: 'Valor',
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

function imprimirMatrizSimple(M, n) {
    let txt = "";
    for(let i=0; i<n; i++) {
        txt += "| ";
        for(let j=0; j<n; j++) {
            txt += M[i][j].toFixed(4).padStart(10, " ") + " ";
        }
        txt += "|\n";
    }
    return txt;
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
    doc.text("Reporte: Factorización LU", 14, 20);
    
    doc.setFontSize(11); doc.setTextColor(0);
    const resultados = document.getElementById('resultado-vector').innerText;
    doc.text("Solución del Sistema:", 14, 30);
    doc.setFont("courier", "normal"); 
    doc.text(resultados, 14, 40);

    doc.setFont("helvetica", "bold");
    doc.text("Descomposición L y U:", 14, 90);
    
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

    doc.save("LU_Reporte.pdf");
}