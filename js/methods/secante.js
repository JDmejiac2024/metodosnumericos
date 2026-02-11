// JavaScript Document
// js/methods/secante.js

let chartInstance = null;

function calcularSecante() {
    // 1. Obtener inputs
    const funcStr = document.getElementById('func').value;
    const x0Input = document.getElementById('x0').value;
    const x1Input = document.getElementById('x1').value;
    const tolInput = document.getElementById('tol').value;
    const maxIterInput = document.getElementById('maxIter').value;
    
    // Referencias DOM
    const tbody = document.querySelector('#tabla-resultados tbody');
    const msgError = document.getElementById('error-msg');
    const pasoDiv = document.getElementById('paso-a-paso');
    const rootResult = document.getElementById('root-result');

    // Limpieza
    tbody.innerHTML = '';
    msgError.textContent = '';
    pasoDiv.textContent = '';
    rootResult.textContent = '';

    // Validar vacíos
    if (!funcStr || !x0Input || !x1Input) {
        msgError.textContent = "Error: Debes ingresar la función y los dos valores iniciales (x0 y x1).";
        return;
    }

    let x_prev = parseFloat(x0Input); // x_{i-1}
    let x_curr = parseFloat(x1Input); // x_i
    const tol = parseFloat(tolInput) || 0.0001;
    const maxIter = parseInt(maxIterInput) || 100;

    try {
        const f = (x) => math.evaluate(funcStr, { x: x });

        let error = 100;
        let iter = 0;
        let x_next = 0; // x_{i+1}
        
        let labels = [];
        let dataError = [];
        let pasosLog = "";

        // --- BUCLE SECANTE ---
        while (error > tol && iter < maxIter) {
            
            const f_prev = f(x_prev);
            const f_curr = f(x_curr);

            // Evitar división por cero (si f(x_curr) == f(x_prev))
            const denominador = f_prev - f_curr;
            if (Math.abs(denominador) < 1e-10) {
                msgError.textContent = `Error: División por cero en iteración ${iter+1}. f(x_i) es casi igual a f(x_{i-1}).`;
                return;
            }

            // Fórmula Secante: x_{i+1} = x_i - ( f(x_i) * (x_{i-1} - x_i) ) / ( f(x_{i-1}) - f(x_i) )
            // Nota: Es equivalente a x_curr - (f_curr * (x_prev - x_curr)) / (f_prev - f_curr)
            x_next = x_curr - (f_curr * (x_prev - x_curr)) / (f_prev - f_curr);

            // Calcular Error Relativo
            if (Math.abs(x_next) > 0) {
                 error = Math.abs((x_next - x_curr) / x_next) * 100;
            } else {
                 error = Math.abs(x_next - x_curr) * 100;
            }

            // Llenar Tabla
            const fila = `
                <tr>
                    <td>${iter + 1}</td>
                    <td>${x_prev.toFixed(5)}</td>
                    <td>${x_curr.toFixed(5)}</td>
                    <td style="font-weight:bold; color:#2C3E50">${x_next.toFixed(5)}</td>
                    <td>${error.toFixed(4)}%</td>
                </tr>
            `;
            tbody.innerHTML += fila;

            // Paso a Paso
            pasosLog += `Iteración ${iter + 1}:\n`;
            pasosLog += `  x_{i-1} = ${x_prev.toFixed(5)}, f(x_{i-1}) = ${f_prev.toFixed(5)}\n`;
            pasosLog += `  x_i     = ${x_curr.toFixed(5)}, f(x_i)     = ${f_curr.toFixed(5)}\n`;
            pasosLog += `  x_{i+1} = ${x_curr.toFixed(5)} - [${f_curr.toFixed(4)} * (${x_prev.toFixed(4)} - ${x_curr.toFixed(4)})] / (${f_prev.toFixed(4)} - ${f_curr.toFixed(4)})\n`;
            pasosLog += `  Nuevo x = ${x_next.toFixed(5)} | Error = ${error.toFixed(4)}%\n\n`;

            // Actualizar valores para la siguiente iteración
            x_prev = x_curr;
            x_curr = x_next;
            
            // Datos Gráfica
            labels.push(iter + 1);
            dataError.push(error);

            iter++;
        }

        pasoDiv.textContent = pasosLog;
        rootResult.textContent = `Raíz aprox: ${x_curr.toFixed(5)}`;
        
        generarGrafica(labels, dataError);

    } catch (e) {
        msgError.textContent = "Error matemático: Revisa la sintaxis de f(x).";
        console.error(e);
    }
}

// --- Funciones Auxiliares ---
function borrarDatos() {
    document.getElementById('func').value = '';
    document.getElementById('x0').value = '';
    document.getElementById('x1').value = '';
    document.querySelector('#tabla-resultados tbody').innerHTML = '';
    document.getElementById('error-msg').textContent = '';
    document.getElementById('paso-a-paso').textContent = '';
    document.getElementById('root-result').textContent = '';
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
                label: '% Error Relativo',
                data: data,
                borderColor: '#D64545', // Azul medio (Diferente a Newton para variedad)
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
    doc.text("Reporte: Método de la Secante", 14, 20);
    
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(`Función: ${document.getElementById('func').value}`, 14, 30);
    doc.text(`Valores Iniciales: x0=${document.getElementById('x0').value}, x1=${document.getElementById('x1').value}`, 14, 36);
    doc.text(`Raíz Encontrada: ${document.getElementById('root-result').textContent}`, 14, 42);

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
    doc.save("Secante_Reporte.pdf");
}