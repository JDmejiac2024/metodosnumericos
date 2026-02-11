// JavaScript Document
// js/methods/puntoFijo.js

let chartInstance = null;

function calcularPuntoFijo() {
    // 1. Obtener inputs
    const funcStr = document.getElementById('func').value; // Opcional
    const gxStr = document.getElementById('gx').value;     // Obligatorio
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

    // Validar vacíos (g(x) y x0 son obligatorios)
    if (!gxStr || !x0Input) {
        msgError.textContent = "Error: Debes ingresar la función despejada g(x) y el valor inicial.";
        return;
    }

    let xi = parseFloat(x0Input);
    const tol = parseFloat(tolInput) || 0.0001;
    const maxIter = parseInt(maxIterInput) || 100;

    try {
        // Compilar funciones
        const g = (x) => math.evaluate(gxStr, { x: x });
        
        // Si el usuario ingresó f(x), la usamos para verificar, si no, devolvemos null
        const f = funcStr ? (x) => math.evaluate(funcStr, { x: x }) : null;

        let error = 100;
        let iter = 0;
        let xi_new = 0;
        
        let labels = [];
        let dataError = [];
        let pasosLog = "";

        // --- BUCLE PUNTO FIJO ---
        while (error > tol && iter < maxIter) {
            
            // Evaluar la iteración: x_{i+1} = g(x_i)
            xi_new = g(xi);

            // Validar divergencia extrema
            if (Math.abs(xi_new) > 1e12 || isNaN(xi_new)) {
                msgError.textContent = "Error: El método diverge (el valor tiende a infinito o no existe). Intenta con otro despeje g(x).";
                pasosLog += `\nCRITICAL: Divergencia detectada en iteración ${iter+1}. Valor demasiado grande.`;
                pasoDiv.textContent = pasosLog;
                return;
            }

            // Calcular Error Relativo
            if (iter > 0 || iter === 0) {
                 if (Math.abs(xi_new) > 0) {
                     error = Math.abs((xi_new - xi) / xi_new) * 100;
                 } else {
                     error = Math.abs(xi_new - xi) * 100;
                 }
            }
            if (iter === 0) error = 100;

            // Llenar Tabla
            const fila = `
                <tr>
                    <td>${iter + 1}</td>
                    <td>${xi.toFixed(5)}</td>
                    <td>${xi_new.toFixed(5)}</td>
                    <td>${iter === 0 ? '-' : error.toFixed(4) + '%'}</td>
                </tr>
            `;
            tbody.innerHTML += fila;

            // Paso a Paso Log
            pasosLog += `Iteración ${iter + 1}:\n`;
            pasosLog += `  x_i = ${xi.toFixed(5)}\n`;
            pasosLog += `  g(x_i) = ${xi_new.toFixed(5)}\n`;
            pasosLog += `  Error = ${iter === 0 ? '-' : error.toFixed(4) + '%'}\n\n`;

            // Actualizar
            xi = xi_new;
            
            labels.push(iter + 1);
            dataError.push(error);

            iter++;
        }

        pasoDiv.textContent = pasosLog;
        rootResult.textContent = `Raíz aprox: ${xi.toFixed(5)}`;
        
        // Si hay f(x), mostramos cuánto vale f en la raíz encontrada
        if (f) {
            pasoDiv.textContent += `\nVerificación en f(x): f(${xi.toFixed(5)}) = ${f(xi).toExponential(3)}`;
        }
        
        generarGrafica(labels, dataError);

    } catch (e) {
        msgError.textContent = "Error matemático: Revisa la sintaxis de g(x).";
        console.error(e);
    }
}

// --- Funciones Auxiliares ---
function borrarDatos() {
    document.getElementById('func').value = '';
    document.getElementById('gx').value = '';
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
                borderColor: '#D64545', // Morado para Punto Fijo
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
    doc.text("Reporte: Método de Punto Fijo", 14, 20);
    
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(`Función g(x): ${document.getElementById('gx').value}`, 14, 30);
    if(document.getElementById('func').value) {
        doc.text(`Función Original f(x): ${document.getElementById('func').value}`, 14, 36);
    }
    doc.text(`Valor Inicial: ${document.getElementById('x0').value}`, 14, 42);
    doc.text(`Raíz: ${document.getElementById('root-result').textContent}`, 14, 48);

    doc.autoTable({ html: '#tabla-resultados', startY: 55, theme: 'grid', headStyles: { fillColor: [31, 58, 95] } });

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
    doc.save("PuntoFijo_Reporte.pdf");
}