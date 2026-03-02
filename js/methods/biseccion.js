// js/methods/biseccion.js

// 1. Variable global para la gráfica
let chartInstance = null;

// ==========================================
// FUNCIÓN PRINCIPAL: CALCULAR
// ==========================================
function calcularBiseccion() {
    // A. Obtener referencias del DOM
    const funcStr = document.getElementById('func').value;
    const xiInput = document.getElementById('xi').value;
    const xuInput = document.getElementById('xu').value;
    const tolInput = document.getElementById('tol').value;
    const maxIterInput = document.getElementById('maxIter').value;
    
    // Referencias a zonas de resultados
    const tbody = document.querySelector('#tabla-resultados tbody');
    const msgError = document.getElementById('error-msg');
    const pasoDiv = document.getElementById('paso-a-paso');
    const rootResult = document.getElementById('root-result');

    // B. Limpieza inicial de la interfaz
    tbody.innerHTML = '';
    msgError.textContent = '';
    pasoDiv.textContent = '';
    rootResult.textContent = '';

    // C. Validación de Entradas Vacías
    if (!funcStr || !xiInput || !xuInput) {
        msgError.textContent = "Error: Por favor ingresa la función y los límites [a, b].";
        return;
    }

    // Convertir a números
    let xi = parseFloat(xiInput);
    let xu = parseFloat(xuInput);
    let tol = parseFloat(tolInput) || 0.0001; 
    
    // Tolerancia internamente para obligar a llegar a 0.0000
    if (tol > 0.00001) {
        tol = 0.00001;
    }

    const maxIter = parseInt(maxIterInput) || 100;

    try {
        // D. Compilar la función usando math.js
        const f = (x) => math.evaluate(funcStr, { x: x });

        // E. Validar Teorema de Bolzano (Cambio de signo)
        if (f(xi) * f(xu) >= 0) {
            msgError.textContent = "Error: El intervalo no cumple el Teorema de Bolzano (f(a) * f(b) < 0). Intenta con otros límites.";
            return;
        }

        // --- INICIO DEL ALGORITMO DE BISECCIÓN ---
        let xr = 0;      
        let xrAnt = 0;   
        let error = 100; // Usado internamente para controlar el bucle
        let iter = 0;
        
        let labels = [];
        let dataError = [];
        let pasosLog = ""; 

        while (error > tol && iter < maxIter) {
            xrAnt = xr;
            
            // Fórmula de Bisección
            xr = (xi + xu) / 2;

            // Evaluaciones de la función
            let fa = f(xi);
            let fb = f(xu);
            let fxr = f(xr);

            // Cálculo de la Tolerancia (Tolerancia = xr_anterior - xr_actual)
            let tolCalculada = 0;
            if (iter > 0) {
                // REDONDEO PREVIO: Extraemos los valores exactos de la tabla visual
                let xrAntVisual = parseFloat(xrAnt.toFixed(4));
                let xrVisual = parseFloat(xr.toFixed(4));

                // Restamos los valores visuales para que cuadre la matemática manual
                tolCalculada = xrAntVisual - xrVisual;
                
                // Limpiar posibles errores de punto flotante (-0.0000)
                if (Math.abs(tolCalculada) < 1e-10) tolCalculada = 0;
                
                // Usamos el valor absoluto para la condición de parada del while
                error = Math.abs(tolCalculada); 
            } else {
                error = 100; // Forzar que siga en la primera iteración
            }

            // 1. Agregar fila a la tabla HTML
            const fila = `
                <tr>
                    <td>${iter + 1}</td>
                    <td>${xi.toFixed(4)}</td>
                    <td>${xu.toFixed(4)}</td>
                    <td>${fa.toFixed(4)}</td>
                    <td>${fb.toFixed(4)}</td>
                    <td style="font-weight:bold; color:#2C3E50">${xr.toFixed(4)}</td>
                    <td>${fxr.toFixed(4)}</td>
                    <td>${iter === 0 ? '-' : tolCalculada.toFixed(4)}</td>
                </tr>
            `;
            tbody.innerHTML += fila;

            // 2. Registrar explicación en el Paso a Paso
            pasosLog += `Iteración ${iter + 1}:\n`;
            pasosLog += `  Intervalo: [${xi.toFixed(4)}, ${xu.toFixed(4)}]\n`;
            pasosLog += `  Raíz (xr): ${xr.toFixed(4)}\n`;
            if (iter > 0) {
                pasosLog += `  Tolerancia (xr_ant - xr): ${xrAnt.toFixed(4)} - ${xr.toFixed(4)} = ${tolCalculada.toFixed(4)}\n`;
            }
            
            // 3. Lógica de cambio de límites
            if (fa * fxr < 0) {
                xu = xr;
                pasosLog += `  Signo cambia a la izquierda. Nuevo intervalo: [${xi.toFixed(4)}, ${xr.toFixed(4)}]\n\n`;
            } else {
                xi = xr;
                pasosLog += `  Signo cambia a la derecha. Nuevo intervalo: [${xr.toFixed(4)}, ${xu.toFixed(4)}]\n\n`;
            }

            // 4. Guardar datos para la gráfica
            labels.push(iter + 1);
            if(iter > 0) dataError.push(Math.abs(tolCalculada)); 
            else dataError.push(null); 

            iter++;
        }
        // --- FIN DEL ALGORITMO ---

        pasoDiv.textContent = pasosLog;
        rootResult.textContent = `Raíz aprox: ${xr.toFixed(4)}`;
        
        generarGrafica(labels, dataError);

    } catch (e) {
        msgError.textContent = "Error de sintaxis en la función. Usa formato JS: 'x^3 - 2*x', 'sin(x)', etc.";
        console.error(e);
    }
}

function borrarDatos() {
    document.getElementById('func').value = '';
    document.getElementById('xi').value = '';
    document.getElementById('xu').value = '';
    document.getElementById('tol').value = '0.0001'; 
    document.getElementById('maxIter').value = '100'; 
    
    document.querySelector('#tabla-resultados tbody').innerHTML = '';
    document.getElementById('error-msg').textContent = '';
    document.getElementById('paso-a-paso').textContent = '';
    document.getElementById('root-result').textContent = '';

    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}

function generarGrafica(labels, data) {
    const ctx = document.getElementById('graficaError').getContext('2d');
    
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tolerancia Absoluta',
                data: data,
                borderColor: '#D64545',
                backgroundColor: 'rgba(214, 69, 69, 0.1)',
                borderWidth: 2,
                pointRadius: 4,
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Tolerancia' }
                },
                x: {
                    title: { display: true, text: 'Iteración' }
                }
            }
        }
    });
}

function exportarPDF() {
    const tbody = document.querySelector('#tabla-resultados tbody');
    if (tbody.children.length === 0) {
        alert("Primero debes calcular un resultado para poder exportarlo.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text("Reporte: Método de Bisección", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Función: ${document.getElementById('func').value}`, 14, 30);
    doc.text(`Intervalo Final: [${document.getElementById('xi').value}, ${document.getElementById('xu').value}]`, 14, 36);
    doc.text(`Raíz Aprox: ${document.getElementById('root-result').textContent}`, 14, 42);

    doc.autoTable({
        html: '#tabla-resultados',
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80] },
        styles: { fontSize: 9, cellPadding: 2 } 
    });

    const canvas = document.getElementById('graficaError');
    if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        
        let finalY = doc.lastAutoTable.finalY + 10; 
        const pageHeight = doc.internal.pageSize.height;
        const imgHeight = 80; 

        if (finalY + imgHeight > pageHeight) {
            doc.addPage();
            finalY = 20; 
        }

        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text("Gráfica de Convergencia", 14, finalY);
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, imgHeight);
    }

    doc.save("Reporte_Biseccion_Completo.pdf");
}