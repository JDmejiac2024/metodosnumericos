// JavaScript Document
// js/methods/secanteModificado.js

let chartInstance = null;

function calcularSecanteMod() {
    // 1. Obtener inputs
    const funcStr = document.getElementById('func').value;
    const x0Input = document.getElementById('x0').value;
    const deltaInput = document.getElementById('delta').value;
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
    if (!funcStr || !x0Input || !deltaInput) {
        msgError.textContent = "Error: Faltan datos (Función, x0 o Delta).";
        return;
    }

    let xi = parseFloat(x0Input);
    const delta = parseFloat(deltaInput);
    const tol = parseFloat(tolInput) || 0.001; // Tolerancia por defecto en 0.001
    const maxIter = parseInt(maxIterInput) || 100;

    if (delta === 0) {
        msgError.textContent = "Error: Delta no puede ser cero.";
        return;
    }

    try {
        const f = (x) => math.evaluate(funcStr, { x: x });

        let error = 100;
        let iter = 0;
        let xi_new = 0;
        
        let labels = [];
        let dataError = [];
        let pasosLog = "--- INICIO MÉTODO SECANTE MODIFICADO ---\n";
        pasosLog += `Perturbación (δ) = ${delta}\n\n`;

        // --- BUCLE ---
        while (error > tol && iter < maxIter) {
            
            const f_xi = f(xi);
            
            // Verificación de éxito prematuro
            if (Math.abs(f_xi) < 1e-12) {
                pasosLog += `\n¡Raíz exacta encontrada!\n`;
                error = 0;
                tbody.innerHTML += `<tr>
                    <td>${iter + 1}</td>
                    <td>${xi.toFixed(4)}</td>
                    <td>0.0000</td>
                    <td>-</td>
                    <td>-</td>
                    <td style="font-weight:bold; color:#2C3E50">${xi.toFixed(4)}</td>
                    <td>0.0000%</td>
                </tr>`;
                break;
            }

            // Calcular x + delta*x
            const dx = delta * xi;
            const xi_plus_dx = xi + dx;
            const f_xi_plus_dx = f(xi_plus_dx);

            // Denominador: f(xi + dx) - f(xi)
            const denominador = f_xi_plus_dx - f_xi;

            if (Math.abs(denominador) < 1e-12) {
                msgError.textContent = `Error: División por cero en iteración ${iter+1}. Ajusta Delta o x0.`;
                pasosLog += `\nCRITICAL ERROR: Denominador ≈ 0.`;
                pasoDiv.textContent = pasosLog;
                return;
            }

            // Fórmula: xi+1 = xi - (f(xi) * dx) / (f(xi+dx) - f(xi))
            xi_new = xi - ( (f_xi * dx) / denominador );

            // Calcular Error
            if (iter > 0 || iter === 0) {
                if (Math.abs(xi_new) > 0) {
                     error = Math.abs((xi_new - xi) / xi_new) * 100;
                } else {
                     error = Math.abs(xi_new - xi) * 100;
                }
            }
            if (iter === 0) error = 100;

            // Tabla (7 columnas, 4 decimales)
            const fila = `
                <tr>
                    <td>${iter + 1}</td>
                    <td>${xi.toFixed(4)}</td>
                    <td>${f_xi.toFixed(4)}</td>
                    <td>${xi_plus_dx.toFixed(4)}</td>
                    <td>${f_xi_plus_dx.toFixed(4)}</td>
                    <td style="font-weight:bold; color:#2C3E50">${xi_new.toFixed(4)}</td>
                    <td>${iter === 0 ? '-' : error.toFixed(4) + '%'}</td>
                </tr>
            `;
            tbody.innerHTML += fila;

            // Log (4 decimales estandarizados)
            pasosLog += `Iteración ${iter + 1}:\n`;
            pasosLog += `  x_i = ${xi.toFixed(4)}, f(x_i) = ${f_xi.toFixed(4)}\n`;
            pasosLog += `  x_i + δx_i = ${xi_plus_dx.toFixed(4)}, f(...) = ${f_xi_plus_dx.toFixed(4)}\n`;
            pasosLog += `  x_{i+1} = ${xi_new.toFixed(4)}\n`;
            pasosLog += `  Error = ${iter === 0 ? '-' : error.toFixed(4) + '%'}\n\n`;

            xi = xi_new;
            labels.push(iter + 1);
            dataError.push(error);

            iter++;
        }

        pasosLog += `\n--- FIN DEL PROCESO ---\nRaíz aproximada: ${xi.toFixed(4)}`;
        pasoDiv.textContent = pasosLog;
        rootResult.textContent = `Raíz aprox: ${xi.toFixed(4)}`;
        
        generarGrafica(labels, dataError);

    } catch (e) {
        msgError.textContent = "Error matemático: Revisa la sintaxis de la función.";
        console.error(e);
    }
}

function borrarDatos() {
    document.getElementById('func').value = '';
    document.getElementById('x0').value = '';
    document.getElementById('delta').value = '0.01';
    document.getElementById('tol').value = '0.001'; // Actualizado a 0.001
    document.getElementById('maxIter').value = '100';
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
                borderColor: '#D64545', // Rojo para secante mod.
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
                y: { beginAtZero: true, title: { display: true, text: 'Porcentaje de Error' } },
                x: { title: { display: true, text: 'Iteración' } }
            } 
        }
    });
}

function exportarPDF() {
    const tbody = document.querySelector('#tabla-resultados tbody');
    if (tbody.children.length === 0) { alert("Sin resultados para exportar."); return; }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18); doc.setTextColor(31, 58, 95);
    doc.text("Reporte: Secante Modificada", 14, 20);
    
    doc.setFontSize(11); doc.setTextColor(0);
    doc.text(`Función: ${document.getElementById('func').value}`, 14, 30);
    doc.text(`Perturbación (δ): ${document.getElementById('delta').value}`, 14, 36);
    doc.text(`Raíz Aprox: ${document.getElementById('root-result').textContent}`, 14, 42);

    // Fuente reducida a 9 para acomodar las 7 columnas cómodamente
    doc.autoTable({ 
        html: '#tabla-resultados', 
        startY: 50, 
        theme: 'grid', 
        headStyles: { fillColor: [31, 58, 95] },
        styles: { fontSize: 9, cellPadding: 2 } 
    });

    const canvas = document.getElementById('graficaError');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        let finalY = doc.lastAutoTable.finalY + 15;
        const pageHeight = doc.internal.pageSize.height;
        const imgHeight = 80;

        if (finalY + imgHeight > pageHeight) { doc.addPage(); finalY=20; }
        
        doc.setFontSize(14); doc.setTextColor(31, 58, 95);
        doc.text("Gráfica de Convergencia", 14, finalY);
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, imgHeight);
    }
    doc.save("SecanteModificada_Reporte.pdf");
}