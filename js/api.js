// CONFIGURACIÃ“N DE SUPABASE (Base de Datos)
const SUPABASE_URL = 'https://gbbpsoghivdomhnobxhr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiYnBzb2doaXZkb21obm9ieGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDEzNDEsImV4cCI6MjEwNTY3NzM0MX0.kF2CIgfEADObk38vtfTppQNx0WEq5vOEnCufza6jroY';

// Inicializar cliente Supabase (requiere que el script de CDN esté cargado en HTML)
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/**
 * Inicia sesión con Google usando OAuth.
 */
async function loginConGoogle() {
    if (!supabaseClient) return alert("Cliente de Supabase no cargado.");
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/admin.html'
        }
    });
    if (error) {
        console.error("Error en login:", error);
        alert("Error al iniciar sesión con Google.");
    }
}

/**
 * Verifica si el usuario actual está autenticado y tiene correo @suzuval.cl
 */
async function verificarSesionAdmin() {
    if (!supabaseClient) return false;
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error || !session) {
        return false;
    }

    const email = session.user.email;
    if (!email.endsWith('@suzuval.cl')) {
        alert("Acceso denegado: Solo correos @suzuval.cl están permitidos.");
        await supabaseClient.auth.signOut();
        return false;
    }
    return true;
}

/**
 * Cierra la sesión activa.
 */
async function cerrarSesion() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
}

/**
 * Obtiene los premios disponibles desde Supabase.
 * Filtra los que tengan stock > 0 directamente en la consulta.
 */
async function obtenerPremios() {
    try {
        // GET a la tabla 'premios' donde stock > 0
        const response = await fetch(`${SUPABASE_URL}/rest/v1/premios?select=*&stock=gt.0`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!response.ok) throw new Error("Error obteniendo premios");
        const data = await response.json();
        // Ordenar en JS por la columna 'orden' (si existe, si no 0)
        data.sort((a, b) => (a.orden || 0) - (b.orden || 0));
        return data;
    } catch (error) {
        console.error('Error al obtener premios:', error);
        alert('Hubo un problema conectando con Supabase. ¿Ya creaste la tabla "premios"?');
        return [];
    }
}

/**
 * Actualiza el orden de los premios en Supabase tras hacer drag and drop.
 */
async function actualizarOrdenPremios(ordenes) {
    try {
        const promesas = ordenes.map(item => {
            return fetch(`${SUPABASE_URL}/rest/v1/premios?id=eq.${item.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orden: item.orden })
            });
        });
        await Promise.all(promesas);
        return true;
    } catch (error) {
        console.error("Error al actualizar orden:", error);
        return false;
    }
}

/**
 * Registra al ganador y actualiza el stock del premio restando 1.
 */
async function registrarGanador(datosGanador) {
    try {
        // 1. Guardar registro en la tabla 'ganadores'
        await fetch(`${SUPABASE_URL}/rest/v1/ganadores`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: datosGanador.nombre,
                correo: datosGanador.contacto,
                telefono: datosGanador.telefono,
                premio: datosGanador.premio.nombre
            })
        });

        // 2. Descontar Stock en la tabla 'premios'
        let nuevoStock = parseInt(datosGanador.premio.stock) - 1;
        await fetch(`${SUPABASE_URL}/rest/v1/premios?id=eq.${datosGanador.premio.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                stock: nuevoStock
            })
        });

        console.log("Ganador registrado en Supabase.");
        return true;
    } catch (error) {
        console.error("Error al registrar ganador:", error);
        return false;
    }
}

/**
 * Obtiene los ganadores de forma paginada para la tabla de administración.
 */
async function obtenerGanadores(rangoInicio, rangoFin) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/ganadores?select=*&order=fecha.desc`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Range': `${rangoInicio}-${rangoFin}`
            }
        });
        if (!response.ok) throw new Error("Error obteniendo ganadores");
        return await response.json();
    } catch (error) {
        console.error('Error al obtener ganadores:', error);
        return [];
    }
}

/**
 * Obtiene todos los ganadores para exportar a Excel.
 */
async function obtenerTodosGanadores() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/ganadores?select=*&order=fecha.desc`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!response.ok) throw new Error("Error obteniendo todos los ganadores");
        return await response.json();
    } catch (error) {
        console.error('Error al obtener todos los ganadores:', error);
        return [];
    }
}

/**
 * Agrega un nuevo premio a Supabase.
 */
async function agregarPremio(nuevoPremio) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/premios`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                nombre: nuevoPremio.nombre,
                stock: parseInt(nuevoPremio.stock, 10),
                imagen: nuevoPremio.imagen
            })
        });
        return response.ok;
    } catch (error) {
        console.error("Error al agregar premio:", error);
        return false;
    }
}

/**
 * Elimina un premio de Supabase.
 */
async function eliminarPremio(id) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/premios?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error("Error al eliminar premio:", error);
        return false;
    }
}

