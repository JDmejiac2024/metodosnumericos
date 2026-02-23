// js/methods/raicesMultiples.js

let chartInstance = null;

function calcularRaicesMultiples() {
    const funcStr = document.getElementById('func').value;
    const deriv1Str = document.getElementById('deriv1').value;
    const deriv2Str = document.getElementById('deriv2').value;
    const x0Input = document.getElementById('x0').value;
    const tolInput = document.getElementById('tol').value;
    const maxIterInput = document.getElementById('maxIter').value;
    
    const tbody = document.querySelector('#tabla-resultados tbody');
    const msgError = document.getElementById('error-msg');
    const pasoDiv = document.getElementById('paso-a-paso');
    const rootResult = document.getElementById('root-result');

    tbody.innerHTML = '';
    msgError.textContent = '';
    pasoDiv.textContent = '';
    rootResult.textContent = '';

    if (!funcStr || !deriv1Str || !deriv2Str || !x0Input) {
        msgError.textContent = "Error: Debes ingresar la función, la primera y la segunda derivada, y el valor inicial.";
        return;
    }

    let xi = parseFloat(x0Input);
    const tol = parseFloat(tolInput) || 0.001;
    const maxIter = parseInt(maxIterInput) || 100;

    try {
        const f = (x) => math.evaluate(funcStr, { x: x });
        const df = (x) => math.evaluate(deriv1Str, { x: x });
        const d2f = (x) => math.evaluate(deriv2Str, { x: x });

        let error = 100;
        let iter = 0;
        let xi_new = 0;
        let labels = [];
        let dataError = [];
        let pasosLog = "--- INICIO MÉTODO RAÍCES MÚLTIPLES ---\n\n";

        while (error > tol && iter < maxIter) {
            const f_xi = f(xi);
            
            // --- CORRECCIÓN: Si ya encontramos la raíz exacta ---
            if (Math.abs(f_xi) < 1e-12) {
                pasosLog += `\n¡Raíz exacta encontrada antes de dividir por cero!\n`;
                error = 0;
                // Fila final para visualización
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

            const df_xi = df(xi);
            const d2f_xi = d2f(xi);

            const numerador = f_xi * df_xi;
            const denominador = Math.pow(df_xi, 2) - (f_xi * d2f_xi);

            // Evitar división por cero
            if (Math.abs(denominador) < 1e-12) {
                if(Math.abs(f_xi) < tol * 10) {
                     error = 0;
                     break; 
                }
                msgError.textContent = `Error: El denominador se hizo cero en x=${xi.toFixed(4)}.`;
                pasosLog += `\nCRITICAL ERROR: Denominador ≈ 0 en iteración ${iter+1}.`;
                pasoDiv.textContent = pasosLog;
                return;
            }

            xi_new = xi - (numerador / denominador);

            if (iter > 0 || iter === 0) {
                if (Math.abs(xi_new) > 0) {
                     error = Math.abs((xi_new - xi) / xi_new) * 100;
                } else {
                     error = Math.abs(xi_new - xi) * 100;
                }
            }
            if (iter === 0) error = 100;

            // Tabla (7 Columnas a 4 decimales)
            const fila = `
                <tr>
                    <td>${iter + 1}</td>
                    <td>${xi.toFixed(4)}</td>
                    <td>${f_xi.toFixed(4)}</td>
                    <td>${df_xi.toFixed(4)}</td>
                    <td>${d2f_xi.toFixed(4)}</td>
                    <td style="font-weight:bold; color:#2C3E50">${xi_new.toFixed(4)}</td>
                    <td>${iter === 0 ? '-' : error.toFixed(4) + '%'}</td>
                </tr>
            `;
            tbody.innerHTML += fila;

            // Paso a Paso (4 decimales)
            pasosLog += `Iteración ${iter + 1}:\n`;
            pasosLog += `  x_i = ${xi.toFixed(4)}\n`;
            pasosLog += `  f(x_i) = ${f_xi.toFixed(4)}, f'(x_i) = ${df_xi.toFixed(4)}, f''(x_i) = ${d2f_xi.toFixed(4)}\n`;
            pasosLog += `  x_{i+1} = ${xi_new.toFixed(4)}\n`;
            pasosLog += `  Error = ${iter === 0 ? '-' : error.toFixed(4) + '%'}\n\n`;

            xi = xi_new;
            labels.push(iter + 1);
            dataError.push(error);
            iter++;
        }

        pasosLog += `\n--- FIN DEL PROCESO ---\nRaíz aproximada: ${xi.toFixed(4)}`;
        pasoDiv.textContent = pasosLog;
        rootResult.textContent = `Raíz: ${xi.toFixed(4)}`;
        
        generarGrafica(labels, dataError);

    } catch (e) {
        msgError.textContent = "Error matemático: " + e.message;
    }
}

function borrarDatos() {
    document.getElementById('func').value = '';
    document.getElementById('deriv1').value = '';
    document.getElementById('deriv2').value = '';
    document.getElementById('x0').value = '';
    document.getElementById('tol').value = '0.001';
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
                borderColor: '#D64545',
                backgroundColor: 'rgba(47, 109, 179, 0.1)',
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
    
    // Encabezado
    doc.setFontSize(18); doc.setTextColor(31, 58, 95);
    doc.text("Reporte: Raíces Múltiples", 14, 20);
    
    // Datos de entrada
    doc.setFontSize(11); doc.setTextColor(0);
    doc.text(`Función: ${document.getElementById('func').value}`, 14, 30);
    doc.text(`Raíz Aprox: ${document.getElementById('root-result').textContent}`, 14, 38);

    // Tabla - Ajuste de fuente a 8 para que quepan las 7 columnas cómodamente
    doc.autoTable({ 
        html: '#tabla-resultados', 
        startY: 45, 
        theme: 'grid', 
        headStyles: { fillColor: [31, 58, 95] },
        styles: { fontSize: 8, cellPadding: 2 } 
    });

    // Gráfica con Título
    const canvas = document.getElementById('graficaError');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        
        let finalY = doc.lastAutoTable.finalY + 15; 
        const pageHeight = doc.internal.pageSize.height;
        const imgHeight = 80;

        if (finalY + imgHeight > pageHeight) { 
            doc.addPage(); 
            finalY = 20; 
        }
        
        doc.setFontSize(14); 
        doc.setTextColor(31, 58, 95); 
        doc.text("Gráfica de Convergencia", 14, finalY);
        
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, imgHeight);
    }
    
    doc.save("RaicesMultiples_Reporte.pdf");
}