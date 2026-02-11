// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Configurar el comportamiento de los menús desplegables
    setupDropdowns();

    // 2. Resaltar automáticamente el enlace activo según la página actual
    highlightCurrentLink();

    // 3. Configurar el menú móvil (Hamburguesa)
    setupMobileMenu();
});

/**
 * Configura los eventos click para los botones de menú desplegable.
 */
function setupDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-btn');

    dropdowns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Detener propagación para evitar conflictos con el cierre automático
            e.stopPropagation();

            // Alternar clase 'active' en el botón (para rotar la flecha)
            this.classList.toggle('active');
            
            // El contenido es el siguiente elemento hermano en el HTML
            const dropdownContent = this.nextElementSibling;
            
            // Alternar visibilidad (clase .show definida en CSS)
            if (dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
            } else {
                dropdownContent.classList.add('show');
            }
        });
    });
}

/**
 * Detecta la URL actual y resalta el enlace correspondiente en el sidebar.
 * También abre el menú desplegable si el enlace activo está dentro de uno.
 */
function highlightCurrentLink() {
    const currentPath = window.location.pathname;
    // Obtenemos solo el nombre del archivo (ej: "biseccion.html")
    const filename = currentPath.split('/').pop(); 

    // Detectar si estamos en el Home (index.html o raíz)
    const isRoot = currentPath.endsWith('/') || currentPath.endsWith('index.html');

    const navLinks = document.querySelectorAll('#sidebar nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Limpiamos estados previos
        link.classList.remove('active');

        if (!href) return; // Si no tiene href, ignorar

        // CASO 1: Estamos en el Inicio
        if (isRoot && (href === 'index.html' || href === './index.html' || href.endsWith('index.html'))) {
            link.classList.add('active');
            return;
        }

        // CASO 2: Estamos en una página interna
        // Verificamos si el enlace termina con el nombre del archivo actual
        if (!isRoot && href !== '#' && href.endsWith(filename)) {
            
            // Activar el enlace
            link.classList.add('active');
            
            // Lógica para abrir el menú padre automáticamente
            // Buscamos si este enlace está dentro de un dropdown-content
            const parentDropdown = link.closest('.dropdown-content');
            
            if (parentDropdown) {
                // Abrir el panel
                parentDropdown.classList.add('show');
                // Activar el botón padre (para que la flecha se vea hacia abajo)
                const parentBtn = parentDropdown.previousElementSibling;
                if (parentBtn) {
                    parentBtn.classList.add('active');
                }
            }
        }
    });
}

/**
 * Configura la lógica del menú hamburguesa para versión móvil.
 * Incluye cambio de icono y cierre al hacer clic fuera.
 */
function setupMobileMenu() {
    const menuBtn = document.getElementById('menu-toggle');
    const nav = document.querySelector('#sidebar nav');
    
    // Solo ejecutar si los elementos existen (evita errores en páginas sin sidebar)
    if (menuBtn && nav) {
        const icon = menuBtn.querySelector('i');

        // Evento Click en el botón
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el evento llegue al document y cierre el menú inmediatamente
            nav.classList.toggle('active');
            
            // Cambiar icono: de Barras (fa-bars) a Cerrar (fa-times)
            if (nav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Mejora UX: Cerrar menú al hacer clic fuera del sidebar
        document.addEventListener('click', (e) => {
            // Si el menú está abierto Y el clic NO fue dentro del nav NI en el botón
            if (nav.classList.contains('active') && !nav.contains(e.target) && !menuBtn.contains(e.target)) {
                nav.classList.remove('active');
                // Restaurar icono original
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
}