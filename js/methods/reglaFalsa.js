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
    const tol = parseFloat(tolInput) || 0.001;
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

            // --- FÓRMULA DE REGLA FALSA ---
            // xr = xu - ( f(xu) * (xi - xu) ) / ( f(xi) - f(xu) )
            xr = xu - (f(xu) * (xi - xu)) / (f(xi) - f(xu));

            // Calcular Error
            if (iter > 0) {
                error = Math.abs((xr - xrAnt) / xr) * 100;
            } else {
                error = 100;
            }

            // Actualizar Tabla
            const fila = `
                <tr>
                    <td>${iter + 1}</td>
                    <td>${xi.toFixed(5)}</td>
                    <td>${xu.toFixed(5)}</td>
                    <td style="font-weight:bold; color:#2C3E50">${xr.toFixed(5)}</td>
                    <td>${f(xr).toExponential(3)}</td>
                    <td>${iter === 0 ? '-' : error.toFixed(4) + '%'}</td>
                </tr>
            `;
            tbody.innerHTML += fila;

            // Paso a Paso
            pasosLog += `Iteración ${iter + 1}:\n`;
            pasosLog += `  a=${xi.toFixed(5)}, b=${xu.toFixed(5)}\n`;
            pasosLog += `  f(a)=${f(xi).toFixed(4)}, f(b)=${f(xu).toFixed(4)}\n`;
            pasosLog += `  Aplicando fórmula Regla Falsa -> x_r = ${xr.toFixed(5)}\n`;
            
            // Decisión de cambio de intervalo
            if (f(xi) * f(xr) < 0) {
                xu = xr;
                pasosLog += `  f(a)*f(xr) < 0. La raíz está entre [a, xr]. Nuevo b = ${xr.toFixed(5)}\n\n`;
            } else {
                xi = xr;
                pasosLog += `  f(a)*f(xr) > 0. La raíz está entre [xr, b]. Nuevo a = ${xr.toFixed(5)}\n\n`;
            }

            labels.push(iter + 1);
            dataError.push(error);
            iter++;
        }

        pasoDiv.textContent = pasosLog;
        rootResult.textContent = `Raíz aprox: ${xr.toFixed(5)}`;
        
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
    
    doc.setFontSize(18); doc.setTextColor(44, 62, 80);
    doc.text("Reporte: Regla Falsa", 14, 20);
    
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(`Función: ${document.getElementById('func').value}`, 14, 30);
    doc.text(`Raíz: ${document.getElementById('root-result').textContent}`, 14, 38);
    
    doc.autoTable({ html: '#tabla-resultados', startY: 45, theme: 'grid', headStyles: { fillColor: [44, 62, 80] } });
    
    const canvas = document.getElementById('graficaError');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        
        let finalY = doc.lastAutoTable.finalY + 10;
        
        // Verificar espacio
        if (finalY + 80 > doc.internal.pageSize.height) { doc.addPage(); finalY=20; }
        
        // --- AGREGAR TÍTULO DE LA GRÁFICA ---
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text("Gráfica de Convergencia", 14, finalY);
        
        // Insertar imagen un poco más abajo (+5)
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, 80);
    }
    doc.save("ReglaFalsa_Reporte.pdf");
}