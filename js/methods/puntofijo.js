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
    let tol = parseFloat(tolInput) || 0.0001; 
    
    // --- TOLERANCIA PARA LLEGAR A 0.0000 ---
    if (tol > 0.00001) {
        tol = 0.00001;
    }

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
                pasosLog += `\nCRITICAL: Divergencia detectada en iteración ${iter+1}. Valor demasiado grande o indefinido.`;
                pasoDiv.textContent = pasosLog;
                return;
            }

            // Cálculo de la Tolerancia
            let tolCalculada = 0;
            if (iter > 0) {
                // REDONDEO PREVIO: Extraemos los valores exactos de la tabla visual
                let xiVisual = parseFloat(xi.toFixed(4));
                let xi_newVisual = parseFloat(xi_new.toFixed(4));

                // Restamos el valor anterior (xi) menos el nuevo (xi_new)
                tolCalculada = xiVisual - xi_newVisual;

                // Limpiar posibles errores de punto flotante (-0.0000)
                if (Math.abs(tolCalculada) < 1e-10) tolCalculada = 0;

                // Usamos el valor absoluto para la condición de parada del while
                error = Math.abs(tolCalculada);

                // --- FRENO VISUAL ---
                if (parseFloat(error.toFixed(4)) === 0) {
                    error = 0; 
                }
            } else {
                error = 100; // Forzar que siga en la primera iteración
            }

            // Llenar Tabla (Con 4 decimales estandarizados)
            const fila = `
                <tr>
                    <td>${iter + 1}</td>
                    <td>${xi.toFixed(4)}</td>
                    <td>${xi_new.toFixed(4)}</td>
                    <td style="font-weight:bold; color:#2C3E50">${xi_new.toFixed(4)}</td>
                    <td>${iter === 0 ? '-' : tolCalculada.toFixed(4)}</td>
                </tr>
            `;
            tbody.innerHTML += fila;

            // Paso a Paso Log (Con 4 decimales)
            pasosLog += `Iteración ${iter + 1}:\n`;
            pasosLog += `  x_i = ${xi.toFixed(4)}\n`;
            pasosLog += `  g(x_i) = ${xi_new.toFixed(4)}\n`;
            pasosLog += `  x_{i+1} = ${xi_new.toFixed(4)}\n`;
            
            if (iter > 0) {
                pasosLog += `  Tolerancia (x_i - x_{i+1}): ${xi.toFixed(4)} - ${xi_new.toFixed(4)} = ${tolCalculada.toFixed(4)}\n\n`;
            } else {
                pasosLog += `\n`;
            }

            // Actualizar
            xi = xi_new;
            
            // Datos Gráfica
            labels.push(iter + 1);
            if(iter > 0) dataError.push(Math.abs(tolCalculada));
            else dataError.push(null);

            iter++;
        }

        pasoDiv.textContent = pasosLog;
        rootResult.textContent = `Raíz aprox: ${xi.toFixed(4)}`; 
        
        // Si hay f(x), mostramos cuánto vale f en la raíz encontrada con 4 decimales
        if (f) {
            pasoDiv.textContent += `\nVerificación en f(x):\n  f(${xi.toFixed(4)}) = ${f(xi).toFixed(4)}`;
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
    document.getElementById('tol').value = '0.0001'; 
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
                label: 'Tolerancia Absoluta',
                data: data,
                borderColor: '#D64545', // Color para Punto Fijo
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
                y: { beginAtZero: true, title: { display: true, text: 'Tolerancia' } },
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
    doc.text("Reporte: Método de Punto Fijo", 14, 20);
    
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(`Función g(x): ${document.getElementById('gx').value}`, 14, 30);
    if(document.getElementById('func').value) {
        doc.text(`Función Original f(x): ${document.getElementById('func').value}`, 14, 36);
    }
    doc.text(`Valor Inicial: ${document.getElementById('x0').value}`, 14, 42);
    doc.text(`Raíz: ${document.getElementById('root-result').textContent}`, 14, 48);

    doc.autoTable({ 
        html: '#tabla-resultados', 
        startY: 55, 
        theme: 'grid', 
        headStyles: { fillColor: [31, 58, 95] },
        styles: { fontSize: 10, cellPadding: 2 }
    });

    const canvas = document.getElementById('graficaError');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        let finalY = doc.lastAutoTable.finalY + 10;
        const pageHeight = doc.internal.pageSize.height;
        const imgHeight = 80;
        
        if (finalY + imgHeight > pageHeight) { doc.addPage(); finalY=20; }
        
        doc.setFontSize(14);
        doc.setTextColor(31, 58, 95);
        doc.text("Gráfica de Convergencia", 14, finalY);
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, imgHeight);
    }
    doc.save("PuntoFijo_Reporte.pdf");
}