// CONFIGURACIÓN DE SUPABASE (Base de Datos)
const SUPABASE_URL = 'https://gbbpsoghivdomhnobxhr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiYnBzb2doaXZkb21obm9ieGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDEzNDEsImV4cCI6MjEwNTY3NzM0MX0.kF2CIgfEADObk38vtfTppQNx0WEq5vOEnCufza6jroY';

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
        return await response.json();
    } catch (error) {
        console.error('Error al obtener premios:', error);
        alert('Hubo un problema conectando con Supabase. ¿Ya creaste la tabla "premios"?');
        return [];
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
