// JavaScript Document
// js/methods/steffensen.js

let chartInstance = null;

function calcularSteffensen() {
    // 1. Obtener inputs
    const funcStr = document.getElementById('func').value;
    const x0Input = document.getElementById('x0').value;
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

    // Validaciones
    if (!funcStr || !x0Input) {
        msgError.textContent = "Error: Faltan datos (Función o Valor Inicial).";
        return;
    }

    let xi = parseFloat(x0Input);
    const tol = parseFloat(tolInput) || 0.0001;
    const maxIter = parseInt(maxIterInput) || 100;

    try {
        const f = (x) => math.evaluate(funcStr, { x: x });

        let error = 100;
        let iter = 0;
        let xi_new = 0;
        
        let labels = [];
        let dataError = [];
        let pasosLog = "--- INICIO MÉTODO DE STEFFENSEN ---\n\n";

        // --- BUCLE ---
        while (error > tol && iter < maxIter) {
            
            const f_xi = f(xi);
            
            // Verificación de éxito (Raíz exacta)
            if (Math.abs(f_xi) < 1e-12) {
                pasosLog += `\n¡Raíz exacta encontrada!\n`;
                error = 0;
                tbody.innerHTML += `<tr><td>${iter + 1}</td><td>${xi.toFixed(6)}</td><td>0.000</td><td>0%</td></tr>`;
                break;
            }

            // Calcular términos auxiliares para la fórmula
            // Denominador = f(x + f(x)) - f(x)
            
            const val_aux = xi + f_xi;       // x + f(x)
            const f_val_aux = f(val_aux);    // f(x + f(x))
            
            const denominador = f_val_aux - f_xi;

            // Evitar división por cero
            if (Math.abs(denominador) < 1e-12) {
                msgError.textContent = `Error: División por cero en iteración ${iter+1}. El método falla o converge muy rápido.`;
                pasosLog += `\nCRITICAL ERROR: Denominador ≈ 0.`;
                pasoDiv.textContent = pasosLog;
                return;
            }

            // Fórmula: xi+1 = xi - (f(xi)^2) / ( f(x+f(x)) - f(x) )
            xi_new = xi - ( Math.pow(f_xi, 2) / denominador );

            // Calcular Error
            if (iter > 0 || iter === 0) {
                if (Math.abs(xi_new) > 0) {
                     error = Math.abs((xi_new - xi) / xi_new) * 100;
                } else {
                     error = Math.abs(xi_new - xi) * 100;
                }
            }
            if (iter === 0) error = 100;

            // Tabla
            const fila = `
                <tr>
                    <td>${iter + 1}</td>
                    <td>${xi.toFixed(6)}</td>
                    <td>${f_xi.toExponential(3)}</td>
                    <td>${iter === 0 ? '-' : error.toFixed(4) + '%'}</td>
                </tr>
            `;
            tbody.innerHTML += fila;

            // Log Detallado
            pasosLog += `Iteración ${iter + 1}:\n`;
            pasosLog += `  x_i = ${xi.toFixed(6)}, f(x_i) = ${f_xi.toExponential(3)}\n`;
            pasosLog += `  f(x_i + f(x_i)) = ${f_val_aux.toExponential(3)}\n`;
            pasosLog += `  x_{i+1} = ${xi_new.toFixed(6)}\n`;
            pasosLog += `  Error = ${iter === 0 ? '-' : error.toFixed(4) + '%'}\n\n`;

            xi = xi_new;
            labels.push(iter + 1);
            dataError.push(error);

            iter++;
        }

        pasosLog += `\n--- FIN DEL PROCESO ---\nRaíz aproximada: ${xi.toFixed(6)}`;
        pasoDiv.textContent = pasosLog;
        rootResult.textContent = `Raíz: ${xi.toFixed(6)}`;
        
        generarGrafica(labels, dataError);

    } catch (e) {
        msgError.textContent = "Error matemático: Revisa la sintaxis de la función.";
        console.error(e);
    }
}

function borrarDatos() {
    document.getElementById('func').value = '';
    document.getElementById('x0').value = '';
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
                borderColor: '#D64545', // Azul
                backgroundColor: 'rgba(47, 109, 179, 0.1)',
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
    doc.text("Reporte: Método de Steffensen", 14, 20);
    
    doc.setFontSize(11); doc.setTextColor(0);
    doc.text(`Función: ${document.getElementById('func').value}`, 14, 30);
    doc.text(`Raíz Aprox: ${document.getElementById('root-result').textContent}`, 14, 38);

    doc.autoTable({ html: '#tabla-resultados', startY: 45, theme: 'grid', headStyles: { fillColor: [31, 58, 95] } });

    const canvas = document.getElementById('graficaError');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        let finalY = doc.lastAutoTable.finalY + 15;
        if (finalY + 90 > doc.internal.pageSize.height) { doc.addPage(); finalY=20; }
        
        doc.setFontSize(14); doc.setTextColor(31, 58, 95);
        doc.text("Gráfica de Convergencia", 14, finalY);
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, 80);
    }
    doc.save("Steffensen_Reporte.pdf");
}