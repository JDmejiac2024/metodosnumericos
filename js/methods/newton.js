// js/methods/newton.js

let chartInstance = null;

function calcularNewton() {
    // 1. Obtener inputs
    const funcStr = document.getElementById('func').value;
    const x0Input = document.getElementById('x0').value;
    let tol = parseFloat(document.getElementById('tol').value) || 0.0001; 
    const maxIterInput = document.getElementById('maxIter').value;
    
    // Referencias DOM
    const derivInput = document.getElementById('deriv');
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
    if (!funcStr || !x0Input) {
        msgError.textContent = "Error: Debes ingresar la función f(x) y el valor inicial x_i.";
        return;
    }

    let xi = parseFloat(x0Input);
    
    // --- TOLERANCIA PARA LLEGAR A 0.0000  ---
    if (tol > 0.00001) {
        tol = 0.00001;
    }

    const maxIter = parseInt(maxIterInput) || 100;

    try {
        // --- CÁLCULO AUTOMÁTICO DE LA DERIVADA ---
        let derivStr = math.derivative(funcStr, 'x').toString();
        let derivVisual = derivStr;

        // Intentamos ordenar el polinomio de mayor a menor exponente
        try {
            // rationalize() ordena polinomios matemáticamente
            derivVisual = math.rationalize(derivStr).toString(); 
        } catch (e) {
            // Si no es un polinomio puro (ej. tiene senos o cosenos), lo dejamos como estaba
        }

        // Limpieza visual: quitamos asteriscos y espacios extra para que se lea como "3x^2"
        derivVisual = derivVisual.replace(/\s*\*\s*/g, '').replace(/\s+/g, ' ');
        derivInput.value = derivVisual;

        // Compilar funciones
        const f = (x) => math.evaluate(funcStr, { x: x });
        const df = (x) => math.evaluate(derivStr, { x: x }); // Usamos la cadena original para evaluar

        let error = 100;
        let iter = 0;
        let xr = 0; 
        
        let labels = [];
        let dataError = [];
        let pasosLog = "";

        // --- BUCLE NEWTON-RAPHSON ---
        while (error > tol && iter < maxIter) {
            
            const f_xi = f(xi);
            const df_xi = df(xi);

            // Evitar división por cero
            if (Math.abs(df_xi) < 1e-12) {
                msgError.textContent = `Error: La derivada se hizo cero en xi=${xi}. El método falla.`;
                pasosLog += `\nCRITICAL ERROR: f'(${xi.toFixed(4)}) ≈ 0. No se puede dividir.`;
                pasoDiv.textContent = pasosLog;
                return;
            }

            // Fórmula Newton: xr = xi - f(xi)/f'(xi)
            xr = xi - (f_xi / df_xi);

            // Cálculo de la Tolerancia Absoluta (|xi - xr|)
            let tolCalculada = 0;
            if (iter > 0) {
                // REDONDEO PREVIO: 4 decimales como en el cuaderno
                let xiVisual = parseFloat(xi.toFixed(4));
                let xrVisual = parseFloat(xr.toFixed(4));

                tolCalculada = Math.abs(xiVisual - xrVisual);

                if (Math.abs(tolCalculada) < 1e-10) tolCalculada = 0;

                error = tolCalculada;

                // --- FRENO VISUAL ---
                if (parseFloat(error.toFixed(4)) === 0) {
                    error = 0; 
                }
            } else {
                error = 100; // Forzar continuidad
            }

            // Llenar Tabla (Con 4 decimales)
            const fila = `
                <tr>
                    <td>${iter + 1}</td>
                    <td>${xi.toFixed(4)}</td>
                    <td>${f_xi.toFixed(4)}</td>
                    <td>${df_xi.toFixed(4)}</td>
                    <td style="font-weight:bold; color:#2C3E50">${xr.toFixed(4)}</td>
                    <td>${iter === 0 ? '-' : tolCalculada.toFixed(4)}</td>
                </tr>
            `;
            tbody.innerHTML += fila;

            // Paso a Paso Log (4 decimales)
            pasosLog += `Iteración ${iter + 1}:\n`;
            pasosLog += `  xi = ${xi.toFixed(4)}\n`;
            pasosLog += `  f(xi) = ${f_xi.toFixed(4)}, f'(xi) = ${df_xi.toFixed(4)}\n`;
            pasosLog += `  xr = ${xi.toFixed(4)} - (${f_xi.toFixed(4)} / ${df_xi.toFixed(4)}) = ${xr.toFixed(4)}\n`;
            
            if (iter > 0) {
                pasosLog += `  Tolerancia (|xi - xr|): |${xi.toFixed(4)} - ${xr.toFixed(4)}| = ${tolCalculada.toFixed(4)}\n\n`;
            } else {
                pasosLog += `\n`;
            }

            xi = xr;
            
            labels.push(iter + 1);
            if(iter > 0) dataError.push(tolCalculada);
            else dataError.push(null);

            iter++;
        }

        pasoDiv.textContent = pasosLog;
        rootResult.textContent = `Raíz aprox: ${xr.toFixed(4)}`; 
        
        generarGrafica(labels, dataError);

    } catch (e) {
        msgError.textContent = "Error matemático: Revisa la sintaxis de f(x).";
        console.error(e);
    }
}

function borrarDatos() {
    document.getElementById('func').value = '';
    document.getElementById('deriv').value = '';
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
                borderColor: '#2FA36B',
                backgroundColor: 'rgba(47, 163, 107, 0.1)',
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
    doc.text("Reporte: Newton-Raphson", 14, 20);
    
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(`Función f(x): ${document.getElementById('func').value}`, 14, 30);
    doc.text(`Derivada Automática f'(x): ${document.getElementById('deriv').value}`, 14, 36);
    doc.text(`Valor Inicial xi: ${document.getElementById('x0').value}`, 14, 42);
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
    doc.save("NewtonRaphson_Reporte.pdf");
}