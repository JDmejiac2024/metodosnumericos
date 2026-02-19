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
            
            // --- CORRECCIÓN: Si ya encontramos la raíz, detenerse ---
            if (Math.abs(f_xi) < 1e-12) {
                pasosLog += `\n¡Raíz exacta encontrada antes de dividir por cero!\n`;
                // Forzar salida exitosa
                error = 0;
                // Agregamos la fila final para visualización
                tbody.innerHTML += `<tr><td>${iter + 1}</td><td>${xi.toFixed(6)}</td><td>0.000</td><td>0%</td></tr>`;
                break; 
            }
            // --------------------------------------------------------

            const df_xi = df(xi);
            const d2f_xi = d2f(xi);

            const numerador = f_xi * df_xi;
            const denominador = Math.pow(df_xi, 2) - (f_xi * d2f_xi);

            // Evitar división por cero
            if (Math.abs(denominador) < 1e-12) {
                // Si el denominador es 0 pero f(x) es pequeño, asumimos que es la raíz
                if(Math.abs(f_xi) < tol * 10) {
                     error = 0;
                     break; 
                }
                msgError.textContent = `Error: El denominador se hizo cero en x=${xi}.`;
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

            const fila = `
                <tr>
                    <td>${iter + 1}</td>
                    <td>${xi.toFixed(6)}</td>
                    <td>${f_xi.toExponential(3)}</td>
                    <td>${iter === 0 ? '-' : error.toFixed(4) + '%'}</td>
                </tr>
            `;
            tbody.innerHTML += fila;

            pasosLog += `Iteración ${iter + 1}:\n  x_i = ${xi.toFixed(6)}\n  f(x_i) = ${f_xi.toExponential(3)}\n  Error = ${error.toFixed(4)}%\n\n`;

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
        msgError.textContent = "Error matemático: " + e.message;
    }
}

function borrarDatos() {
    document.getElementById('func').value = '';
    document.getElementById('deriv1').value = '';
    document.getElementById('deriv2').value = '';
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
                borderColor: '#D64545',
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
    
    // Encabezado
    doc.setFontSize(18); doc.setTextColor(31, 58, 95);
    doc.text("Reporte: Raíces Múltiples", 14, 20);
    
    // Datos de entrada
    doc.setFontSize(11); doc.setTextColor(0);
    doc.text(`Función: ${document.getElementById('func').value}`, 14, 30);
    doc.text(`Raíz Aprox: ${document.getElementById('root-result').textContent}`, 14, 38);

    // Tabla
    doc.autoTable({ html: '#tabla-resultados', startY: 45, theme: 'grid', headStyles: { fillColor: [31, 58, 95] } });

    // Gráfica con Título
    const canvas = document.getElementById('graficaError');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        
        // Calcular posición después de la tabla
        let finalY = doc.lastAutoTable.finalY + 15; // Un poco más de espacio
        
        // Verificar si cabe en la página, si no, nueva página
        if (finalY + 90 > doc.internal.pageSize.height) { 
            doc.addPage(); 
            finalY = 20; 
        }
        
        // --- AGREGAR TÍTULO DE LA GRÁFICA (AQUÍ ESTÁ EL CAMBIO) ---
        doc.setFontSize(14); 
        doc.setTextColor(31, 58, 95); // Mismo azul del título principal
        doc.text("Gráfica de Convergencia", 14, finalY);
        
        // Insertar imagen debajo del título
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, 80);
    }
    
    doc.save("RaicesMultiples_Reporte.pdf");
}