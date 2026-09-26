let allPremios = [];
let currentIndex = 0;
const PAGE_SIZE = 10;
const bgFileInput = document.getElementById('bg-file');
const bgCurrentText = document.getElementById('bg-current-text');
const btnGuardar = document.getElementById('btn-guardar-config');
const tableBody = document.getElementById('premios-body');
const btnCargarMas = document.getElementById('btn-cargar-mas');

document.addEventListener('DOMContentLoaded', async () => {
    const loginPanel = document.getElementById('login-panel');
    const adminPanel = document.getElementById('admin-panel');
    const btnLogin = document.getElementById('btn-login-google');

    if (btnLogin) {
        btnLogin.addEventListener('click', () => {
            btnLogin.innerText = 'Redirigiendo...';
            btnLogin.disabled = true;
            loginConGoogle();
        });
    }

    // Verificar sesiÃ³n (solo usuarios @suzuval.cl)
    const autenticado = await verificarSesionAdmin();
    if (!autenticado) {
        if (loginPanel) loginPanel.style.display = 'block';
        return; // Se detiene la ejecuciÃ³n si no estÃ¡ logueado
    }

    // Mostrar panel de administraciÃ³n
    if (adminPanel) adminPanel.style.display = 'block';

    // LÃ³gica del botÃ³n cerrar sesiÃ³n
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', async (e) => {
            e.preventDefault();
            btnCerrarSesion.innerText = 'Cerrando...';
            btnCerrarSesion.disabled = true;
            await cerrarSesion();
        });
    }

    // Cargar config guardada
    const currentBg = localStorage.getItem('BG_URL');
    if (currentBg && bgCurrentText) {
        bgCurrentText.innerHTML = `Fondo actual: <a href="${currentBg}" target="_blank">Ver imagen</a>`;
    }

    const checkDescontar = document.getElementById('check-descontar-premio');
    if (checkDescontar) {
        const autoDescontar = localStorage.getItem('AUTO_DESCONTAR');
        if (autoDescontar !== null) {
            checkDescontar.checked = autoDescontar === 'true';
        }
    }

    // Cargar tabla de ganadores
    await renderizarGanadores();

    // Cargar tabla de premios
    allPremios = await obtenerPremios(); 
    renderizarTabla();
});

// Variables y lÃ³gica de ganadores
let ganadoresPage = 0;
const GANADORES_PAGE_SIZE = 10;
const ganadoresBody = document.getElementById('ganadores-body');
const btnCargarMasGanadores = document.getElementById('btn-cargar-mas-ganadores');
const btnExportarExcel = document.getElementById('btn-exportar-excel');

async function renderizarGanadores() {
    const rangoInicio = ganadoresPage * GANADORES_PAGE_SIZE;
    const rangoFin = rangoInicio + GANADORES_PAGE_SIZE - 1;
    
    const ganadores = await obtenerGanadores(rangoInicio, rangoFin);
    
    if (ganadores.length === 0 && ganadoresPage === 0) {
        ganadoresBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">AÃºn no hay ganadores.</td></tr>';
        btnCargarMasGanadores.style.display = 'none';
        return;
    }

    ganadores.forEach(g => {
        const tr = document.createElement('tr');
        // Formatear fecha si existe (Supabase la devuelve en ISO 8601)
        let fechaFormateada = '-';
        if (g.fecha) {
            const fecha = new Date(g.fecha);
            fechaFormateada = fecha.toLocaleString('es-CL', {
                year: 'numeric', month: '2-digit', day: '2-digit', 
                hour: '2-digit', minute: '2-digit'
            });
        }

        tr.innerHTML = `
            <td>${fechaFormateada}</td>
            <td><strong>${g.nombre}</strong></td>
            <td>${g.correo}</td>
            <td>${g.telefono}</td>
            <td><span style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: #0f172a;">${g.premio}</span></td>
        `;
        ganadoresBody.appendChild(tr);
    });

    if (ganadores.length < GANADORES_PAGE_SIZE) {
        btnCargarMasGanadores.style.display = 'none';
    } else {
        btnCargarMasGanadores.style.display = 'block';
    }
}

if (btnCargarMasGanadores) {
    btnCargarMasGanadores.addEventListener('click', async () => {
        ganadoresPage++;
        await renderizarGanadores();
    });
}

if (btnExportarExcel) {
    btnExportarExcel.addEventListener('click', async () => {
        btnExportarExcel.innerText = 'Generando...';
        btnExportarExcel.disabled = true;

        const todosLosGanadores = await obtenerTodosGanadores();
        
        if (todosLosGanadores.length === 0) {
            alert("No hay ganadores para exportar.");
            btnExportarExcel.innerText = 'Exportar a Excel';
            btnExportarExcel.disabled = false;
            return;
        }

        // Formatear datos para el excel
        const dataParaExcel = todosLosGanadores.map(g => {
            let fechaF = '';
            if (g.fecha) {
                const f = new Date(g.fecha);
                fechaF = f.toLocaleString('es-CL');
            }
            return {
                "Fecha y Hora": fechaF,
                "Nombre": g.nombre,
                "Correo": g.correo,
                "TelÃ©fono": g.telefono,
                "Premio Ganado": g.premio
            };
        });

        // Crear libro de trabajo con SheetJS
        const worksheet = XLSX.utils.json_to_sheet(dataParaExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ganadores");
        
        // Descargar archivo
        XLSX.writeFile(workbook, "Ganadores_Suzuval.xlsx");

        btnExportarExcel.innerText = 'Exportar a Excel';
        btnExportarExcel.disabled = false;
    });
}

btnGuardar.addEventListener('click', async () => {
    let bgUrl = localStorage.getItem('BG_URL') || '';
    if (bgFileInput && bgFileInput.files.length > 0) {
        btnGuardar.disabled = true;
        btnGuardar.innerText = 'Subiendo fondo...';
        // Usamos el bucket 'fondos' para guardar las imÃ¡genes de fondo
        const uploadedUrl = await uploadImageToSupabase(bgFileInput.files[0], 'fondos');
        if (uploadedUrl) {
            bgUrl = uploadedUrl;
        } else {
            alert('Error subiendo el fondo. Verifica la conexiÃ³n.');
        }
    }
    
    localStorage.setItem('BG_URL', bgUrl);
    const checkDescontar = document.getElementById('check-descontar-premio');
    if (checkDescontar) {
        localStorage.setItem('AUTO_DESCONTAR', checkDescontar.checked);
    }
    alert('ConfiguraciÃ³n guardada exitosamente.');
    window.location.reload();
});

btnCargarMas.addEventListener('click', () => {
    renderizarTabla();
});

const BUCKET_NAME = 'premios';

async function uploadImageToSupabase(file, bucket = BUCKET_NAME) {
    if (!file) return '';
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': file.type
            },
            body: file
        });

        if (!response.ok) return '';
        return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;
    } catch (error) {
        return '';
    }
}

// LÃ³gica para agregar un nuevo premio desde la web
const formAgregarPremio = document.getElementById('form-agregar-premio');
if (formAgregarPremio) {
    formAgregarPremio.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = formAgregarPremio.querySelector('button');
        btnSubmit.disabled = true;
        btnSubmit.innerText = 'Subiendo...';

        try {
            const fileInput = document.getElementById('nuevo-imagen-file');
            let imageUrl = '';
            
            // Subir imagen a Supabase si se seleccionÃ³ una
            if (fileInput.files.length > 0) {
                imageUrl = await uploadImageToSupabase(fileInput.files[0]);
                if (!imageUrl) {
                    alert('Error subiendo la imagen. Verifica que el Bucket "premios" exista y sea pÃºblico.');
                    throw new Error('Fallo upload imagen');
                }
            }

            btnSubmit.innerText = 'Guardando...';

            const nuevoPremio = {
                nombre: document.getElementById('nuevo-nombre').value,
                stock: document.getElementById('nuevo-stock').value,
                imagen: imageUrl
            };

            const exito = await agregarPremio(nuevoPremio);

            if (exito) {
                alert('Â¡Premio agregado exitosamente!');
                window.location.reload(); // Recargar para ver los cambios
            } else {
                alert('Hubo un error al guardar el premio en la Base de Datos. Verifica las PolÃ­ticas (Policies) de la tabla "premios" en Supabase.');
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Agregar';
            }
        } catch (error) {
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Agregar';
        }
    });
}

function renderizarTabla() {
    if (allPremios.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay premios disponibles o falta configurar la API.</td></tr>';
        btnCargarMas.style.display = 'none';
        return;
    }

    const nextBatch = allPremios.slice(currentIndex, currentIndex + PAGE_SIZE);
    
    nextBatch.forEach(p => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-row-id', p.id);
        tr.style.cursor = 'grab'; // Indicador visual de arrastrar
        const imgHtml = p.imagen && p.imagen.trim() !== '' 
            ? `<img src="${p.imagen}" style="width: 50px; height: 35px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc;">`
            : '<span style="color:#94a3b8; font-size:12px;">Sin img</span>';

        tr.innerHTML = `
            <td><span style="color:#94a3b8; margin-right:8px; cursor:grab;">â˜°</span> ${p.id || '-'}</td>
            <td>${imgHtml}</td>
            <td><strong>${p.nombre}</strong></td>
            <td>${p.stock}</td>
            <td>
                <button class="btn-duplicar" data-nombre="${p.nombre}" data-imagen="${p.imagen || ''}" style="background-color: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Duplicar</button>
                <button class="btn-eliminar" data-id="${p.id}" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Agregar event listeners a los botones de duplicar
    document.querySelectorAll('.btn-duplicar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const nombre = e.target.getAttribute('data-nombre');
            const imagen = e.target.getAttribute('data-imagen');
            if (confirm(`Â¿Deseas duplicar el premio "${nombre}"?`)) {
                e.target.disabled = true;
                e.target.innerText = 'Duplicando...';
                
                const nuevoPremio = {
                    nombre: nombre,
                    stock: 1,
                    imagen: imagen
                };
                
                const exito = await agregarPremio(nuevoPremio);
                if (exito) {
                    alert('Premio duplicado exitosamente.');
                    window.location.reload();
                } else {
                    alert('Error al duplicar el premio.');
                    e.target.disabled = false;
                    e.target.innerText = 'Duplicar';
                }
            }
        });
    });

    // Agregar event listeners a los botones de eliminar
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Â¿EstÃ¡s seguro de que deseas eliminar este premio?')) {
                e.target.disabled = true;
                e.target.innerText = 'Eliminando...';
                const exito = await eliminarPremio(id);
                if (exito) {
                    alert('Premio eliminado exitosamente.');
                    window.location.reload();
                } else {
                    alert('Error al eliminar el premio. Verifica la conexiÃ³n o permisos.');
                    e.target.disabled = false;
                    e.target.innerText = 'Eliminar';
                }
            }
        });
    });

    currentIndex += PAGE_SIZE;

    if (currentIndex >= allPremios.length) {
        btnCargarMas.style.display = 'none';
    } else {
        btnCargarMas.style.display = 'block';
    }

    // Inicializar o reinicializar Drag & Drop
    if (window.Sortable) {
        if (window.miSortable) window.miSortable.destroy(); // Destruir instancia previa si existe
        
        window.miSortable = new Sortable(tableBody, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: async function () {
                const rows = tableBody.querySelectorAll('tr');
                const nuevosOrdenes = [];
                rows.forEach((row, index) => {
                    const id = row.getAttribute('data-row-id');
                    if (id) {
                        nuevosOrdenes.push({ id: id, orden: index });
                    }
                });
                
                if (nuevosOrdenes.length > 0) {
                    console.log("Guardando nuevo orden...");
                    const success = await actualizarOrdenPremios(nuevosOrdenes);
                    if (!success) {
                        alert("No se pudo guardar el orden. AsegÃºrate de haber creado la columna 'orden' (tipo entero) en tu tabla 'premios' en Supabase.");
                    }
                }
            }
        });
    }
}



