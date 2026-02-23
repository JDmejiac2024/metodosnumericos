// JavaScript Document
// js/methods/reglaFalsa.js

let chartInstance = null;

function calcularReglaFalsa() {
    // 1. Obtener inputs
    const funcStr = document.getElementById('func').value;
    const xiInput = document.getElementById('xi').value;
    const xuInput = document.getElementById('xu').value;
    const tolInput = document.getElementById('tol').value;
    const maxIterInput = document.getElementById('maxIter').value;
    
    // Elementos del DOM
    const tbody = document.querySelector('#tabla-resultados tbody');
    const msgError = document.getElementById('error-msg');
    const pasoDiv = document.getElementById('paso-a-paso');
    const rootResult = document.getElementById('root-result');

    // Limpieza
    tbody.innerHTML = '';
    msgError.textContent = '';
    pasoDiv.textContent = '';
    rootResult.textContent = '';

    if (!funcStr || !xiInput || !xuInput) {
        msgError.textContent = "Error: Por favor ingresa la función y los límites [a, b].";
        return;
    }

    let xi = parseFloat(xiInput); // a
    let xu = parseFloat(xuInput); // b
    const tol = parseFloat(tolInput) || 0.001; // Actualizado a 0.001
    const maxIter = parseInt(maxIterInput) || 100;

    try {
        const f = (x) => math.evaluate(funcStr, { x: x });

        // Validación Bolzano
        if (f(xi) * f(xu) >= 0) {
            msgError.textContent = "Error: El intervalo no cumple el Teorema de Bolzano (f(a) * f(b) < 0).";
            return;
        }

        let xr = 0;
        let xrAnt = 0;
        let error = 100;
        let iter = 0;
        
        let labels = [];
        let dataError = [];
        let pasosLog = "";

        while (error > tol && iter < maxIter) {
            xrAnt = xr;

            let fa = f(xi);
            let fb = f(xu);

            // --- FÓRMULA DE REGLA FALSA ---
            // xr = xu - ( f(xu) * (xi - xu) ) / ( f(xi) - f(xu) )
            xr = xu - (fb * (xi - xu)) / (fa - fb);
            
            let fxr = f(xr);

            // Calcular Error
            if (iter > 0) {
                error = Math.abs((xr - xrAnt) / xr) * 100;
            } else {
                error = 100;
            }

            // Actualizar Tabla (Con 4 decimales)
            const fila = `
                <tr>
                    <td>${iter + 1}</td>
                    <td>${xi.toFixed(4)}</td>
                    <td>${xu.toFixed(4)}</td>
                    <td>${fa.toFixed(4)}</td>
                    <td>${fb.toFixed(4)}</td>
                    <td style="font-weight:bold; color:#2C3E50">${xr.toFixed(4)}</td>
                    <td>${fxr.toFixed(4)}</td>
                    <td>${iter === 0 ? '-' : error.toFixed(4) + '%'}</td>
                </tr>
            `;
            tbody.innerHTML += fila;

            // Paso a Paso (Con 4 decimales)
            pasosLog += `Iteración ${iter + 1}:\n`;
            pasosLog += `  a=${xi.toFixed(4)}, b=${xu.toFixed(4)}\n`;
            pasosLog += `  f(a)=${fa.toFixed(4)}, f(b)=${fb.toFixed(4)}\n`;
            pasosLog += `  Aplicando fórmula Regla Falsa -> xr = ${xr.toFixed(4)}\n`;
            
            // Decisión de cambio de intervalo
            if (fa * fxr < 0) {
                xu = xr;
                pasosLog += `  f(a)*f(xr) < 0. La raíz está entre [a, xr]. Nuevo b = ${xr.toFixed(4)}\n\n`;
            } else {
                xi = xr;
                pasosLog += `  f(a)*f(xr) > 0. La raíz está entre [xr, b]. Nuevo a = ${xr.toFixed(4)}\n\n`;
            }

            labels.push(iter + 1);
            dataError.push(error);
            iter++;
        }

        pasoDiv.textContent = pasosLog;
        rootResult.textContent = `Raíz aprox: ${xr.toFixed(4)}`;
        
        generarGrafica(labels, dataError);

    } catch (e) {
        msgError.textContent = "Error en la función. Revisa la sintaxis.";
        console.error(e);
    }
}

function borrarDatos() {
    document.getElementById('func').value = '';
    document.getElementById('xi').value = '';
    document.getElementById('xu').value = '';
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
                borderColor: '#D64545',
                backgroundColor: 'rgba(214, 69, 69, 0.1)',
                borderWidth: 2,
                pointRadius: 4,
                fill: true,
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
    
    doc.setFontSize(18); doc.setTextColor(44, 62, 80);
    doc.text("Reporte: Regla Falsa", 14, 20);
    
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(`Función: ${document.getElementById('func').value}`, 14, 30);
    doc.text(`Raíz: ${document.getElementById('root-result').textContent}`, 14, 38);
    
    // Ajuste de tabla en PDF para las columnas extra
    doc.autoTable({ 
        html: '#tabla-resultados', 
        startY: 45, 
        theme: 'grid', 
        headStyles: { fillColor: [44, 62, 80] },
        styles: { fontSize: 9, cellPadding: 2 } 
    });
    
    const canvas = document.getElementById('graficaError');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        
        let finalY = doc.lastAutoTable.finalY + 10;
        const pageHeight = doc.internal.pageSize.height;
        const imgHeight = 80;
        
        // Verificar espacio
        if (finalY + imgHeight > pageHeight) { doc.addPage(); finalY=20; }
        
        // --- AGREGAR TÍTULO DE LA GRÁFICA ---
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text("Gráfica de Convergencia", 14, finalY);
        
        // Insertar imagen
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, imgHeight);
    }
    doc.save("ReglaFalsa_Reporte.pdf");
}