// js/methods/newton.js

let chartInstance = null;

function calcularNewton() {
    // 1. Obtener inputs
    const funcStr = document.getElementById('func').value;
    const derivStr = document.getElementById('deriv').value; 
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

    // Validar vacíos
    if (!funcStr || !derivStr || !x0Input) {
        msgError.textContent = "Error: Debes ingresar la función, su derivada y el valor inicial.";
        return;
    }

    let xi = parseFloat(x0Input);
    const tol = parseFloat(tolInput) || 0.001;
    const maxIter = parseInt(maxIterInput) || 100;

    try {
        // Compilar funciones
        const f = (x) => math.evaluate(funcStr, { x: x });
        const df = (x) => math.evaluate(derivStr, { x: x }); // Derivada

        let error = 100;
        let iter = 0;
        let xi_new = 0;
        
        let labels = [];
        let dataError = [];
        let pasosLog = "";

        // --- BUCLE NEWTON-RAPHSON ---
        while (error > tol && iter < maxIter) {
            
            const f_xi = f(xi);
            const df_xi = df(xi);

            // Evitar división por cero
            if (Math.abs(df_xi) < 1e-10) {
                msgError.textContent = `Error: La derivada se hizo cero en x=${xi}. El método falla.`;
                pasosLog += `\nCRITICAL ERROR: f'(${xi}) ≈ 0. No se puede dividir.`;
                pasoDiv.textContent = pasosLog;
                return;
            }

            // Fórmula Newton: xi+1 = xi - f(xi)/f'(xi)
            xi_new = xi - (f_xi / df_xi);

            // Calcular Error
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
                    <td>${f_xi.toExponential(3)}</td>
                    <td>${df_xi.toExponential(3)}</td>
                    <td>${iter === 0 ? '-' : error.toFixed(4) + '%'}</td>
                </tr>
            `;
            tbody.innerHTML += fila;

            // Paso a Paso Log
            pasosLog += `Iteración ${iter + 1}:\n`;
            pasosLog += `  x_i = ${xi.toFixed(5)}\n`;
            pasosLog += `  f(x_i) = ${f_xi.toFixed(5)}, f'(x_i) = ${df_xi.toFixed(5)}\n`;
            pasosLog += `  x_{i+1} = ${xi.toFixed(5)} - (${f_xi.toFixed(5)} / ${df_xi.toFixed(5)}) = ${xi_new.toFixed(5)}\n`;
            pasosLog += `  Error = ${iter === 0 ? '-' : error.toFixed(4) + '%'}\n\n`;

            // Actualizar valores
            xi = xi_new;
            
            // Datos Gráfica
            labels.push(iter + 1);
            dataError.push(error);

            iter++;
        }

        pasoDiv.textContent = pasosLog;
        rootResult.textContent = `Raíz aprox: ${xi.toFixed(5)}`;
        
        generarGrafica(labels, dataError);

    } catch (e) {
        msgError.textContent = "Error matemático: Revisa la sintaxis de f(x) o f'(x).";
        console.error(e);
    }
}

function borrarDatos() {
    document.getElementById('func').value = '';
    document.getElementById('deriv').value = '';
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
                borderColor: '#2FA36B', // Verde ingeniería (Newton)
                backgroundColor: 'rgba(47, 163, 107, 0.1)',
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
    
    doc.setFontSize(18); doc.setTextColor(31, 58, 95); // Azul oscuro
    doc.text("Reporte: Newton-Raphson", 14, 20);
    
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(`Función f(x): ${document.getElementById('func').value}`, 14, 30);
    doc.text(`Derivada f'(x): ${document.getElementById('deriv').value}`, 14, 36);
    doc.text(`Valor Inicial: ${document.getElementById('x0').value}`, 14, 42);
    doc.text(`Raíz: ${document.getElementById('root-result').textContent}`, 14, 48);

    doc.autoTable({ html: '#tabla-resultados', startY: 55, theme: 'grid', headStyles: { fillColor: [31, 58, 95] } });

    const canvas = document.getElementById('graficaError');
    if(canvas){
        const imgData = canvas.toDataURL('image/png');
        
        let finalY = doc.lastAutoTable.finalY + 10;
        
        // Verificar espacio
        if (finalY + 80 > doc.internal.pageSize.height) { doc.addPage(); finalY=20; }
        
        // --- AGREGAR TÍTULO DE LA GRÁFICA ---
        doc.setFontSize(14);
        doc.setTextColor(31, 58, 95);
        doc.text("Gráfica de Convergencia", 14, finalY);
        
        // Insertar imagen
        doc.addImage(imgData, 'PNG', 15, finalY + 5, 180, 80);
    }
    doc.save("NewtonRaphson_Reporte.pdf");
}