let allPremios = [];
let currentIndex = 0;
const PAGE_SIZE = 10;
const bgFileInput = document.getElementById('bg-file');
const bgCurrentText = document.getElementById('bg-current-text');
const btnGuardar = document.getElementById('btn-guardar-config');
const tableBody = document.getElementById('premios-body');
const btnCargarMas = document.getElementById('btn-cargar-mas');

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar config guardada
    const currentBg = localStorage.getItem('BG_URL');
    if (currentBg && bgCurrentText) {
        bgCurrentText.innerHTML = `Fondo actual: <a href="${currentBg}" target="_blank">Ver imagen</a>`;
    }

    // Cargar tabla
    allPremios = await obtenerPremios(); 
    renderizarTabla();
});

btnGuardar.addEventListener('click', async () => {
    let bgUrl = localStorage.getItem('BG_URL') || '';
    if (bgFileInput && bgFileInput.files.length > 0) {
        btnGuardar.disabled = true;
        btnGuardar.innerText = 'Subiendo fondo...';
        // Usamos el bucket 'premios' que sabemos que existe y está configurado
        const uploadedUrl = await uploadImageToSupabase(bgFileInput.files[0], 'premios');
        if (uploadedUrl) {
            bgUrl = uploadedUrl;
        } else {
            alert('Error subiendo el fondo. Verifica la conexión.');
        }
    }
    
    localStorage.setItem('BG_URL', bgUrl);
    alert('Configuración guardada exitosamente.');
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

// Lógica para agregar un nuevo premio desde la web
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
            
            // Subir imagen a Supabase si se seleccionó una
            if (fileInput.files.length > 0) {
                imageUrl = await uploadImageToSupabase(fileInput.files[0]);
                if (!imageUrl) {
                    alert('Error subiendo la imagen. Verifica que el Bucket "premios" exista y sea público.');
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
                alert('¡Premio agregado exitosamente!');
                window.location.reload(); // Recargar para ver los cambios
            } else {
                alert('Hubo un error al guardar el premio en Google Sheets.');
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
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay premios disponibles o falta configurar la API.</td></tr>';
        btnCargarMas.style.display = 'none';
        return;
    }

    const nextBatch = allPremios.slice(currentIndex, currentIndex + PAGE_SIZE);
    
    nextBatch.forEach(p => {
        const tr = document.createElement('tr');
        const imgHtml = p.imagen && p.imagen.trim() !== '' 
            ? `<img src="${p.imagen}" style="width: 50px; height: 35px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc;">`
            : '<span style="color:#94a3b8; font-size:12px;">Sin img</span>';

        tr.innerHTML = `
            <td>${p.id || '-'}</td>
            <td>${imgHtml}</td>
            <td><strong>${p.nombre}</strong></td>
            <td>${p.stock}</td>
        `;
        tableBody.appendChild(tr);
    });

    currentIndex += PAGE_SIZE;

    if (currentIndex >= allPremios.length) {
        btnCargarMas.style.display = 'none';
    } else {
        btnCargarMas.style.display = 'block';
    }
}
