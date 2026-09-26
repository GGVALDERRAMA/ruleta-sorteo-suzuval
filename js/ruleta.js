let todosLosPremios = [];
let premiosVisibles = [];
let premioGanadoActual = null;
let indexGanadorVisible = 0;
let colores = ['#0033a0', '#ffffff', '#e2e8f0']; // Colores corporativos
let datosUsuario = null;

const canvas = document.getElementById("ruleta-canvas");
const ctx = canvas.getContext("2d");

const form = document.getElementById("registro-form");
const seccionRegistro = document.getElementById("registro-section");
const seccionRuleta = document.getElementById("ruleta-section");
const btnGirar = document.getElementById("btn-girar");

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
    // Configurar fondo dinámico si existe
    const bgUrl = localStorage.getItem('BG_URL');
    if (bgUrl && bgUrl.trim() !== '') {
        document.getElementById('dynamic-bg').style.backgroundImage = `url('${bgUrl}')`;
    }

    todosLosPremios = await obtenerPremios();
    prepararNuevaRuleta();
});

// El botón oculto ahora es un enlace normal a admin.html, donde se verificará la sesión.

function prepararNuevaRuleta() {
    if (todosLosPremios.length === 0) return;
    
    const indexGanadorReal = Math.floor(Math.random() * todosLosPremios.length);
    premioGanadoActual = todosLosPremios[indexGanadorReal];
    
    premiosVisibles = [];
    const otrosPremios = todosLosPremios.filter((_, i) => i !== indexGanadorReal);
    otrosPremios.sort(() => 0.5 - Math.random());
    
    const cantidadRelleno = Math.min(11, otrosPremios.length);
    for(let i=0; i < cantidadRelleno; i++){
        premiosVisibles.push(otrosPremios[i]);
    }
    
    premiosVisibles.push(premioGanadoActual);
    premiosVisibles.sort(() => 0.5 - Math.random());
    
    indexGanadorVisible = premiosVisibles.findIndex(p => p.id === premioGanadoActual.id);
    
    dibujarRuleta();
}

// Enviar formulario (Transición)
form.addEventListener("submit", (e) => {
    e.preventDefault();
    datosUsuario = {
        nombre: document.getElementById("nombre").value,
        contacto: document.getElementById("correo").value,
        telefono: "+56 " + document.getElementById("telefono").value
    };

    // Cambiar vista
    seccionRegistro.classList.remove("active");
    seccionRegistro.classList.add("hidden");
    
    document.getElementById("nombre-participante").innerText = datosUsuario.nombre;
    
    setTimeout(() => {
        seccionRuleta.classList.remove("hidden");
        seccionRuleta.classList.add("active");
    }, 400); // Dar tiempo a la transición CSS
});

// Dibujar Ruleta en Canvas
function dibujarRuleta(anguloRotacion = 0) {
    if (premiosVisibles.length === 0) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centroX = canvas.width / 2;
    const centroY = canvas.height / 2;
    const radio = centroX - 10; // margen
    
    const arco = (2 * Math.PI) / premiosVisibles.length;

    for (let i = 0; i < premiosVisibles.length; i++) {
        const anguloInicio = anguloRotacion + (i * arco);
        const anguloFin = anguloInicio + arco;
        
        // Evitar que dos slices adyacentes tengan el mismo color si el total es impar
        let indexColor = i % colores.length;
        if (premiosVisibles.length % colores.length !== 0 && i === premiosVisibles.length - 1 && indexColor === 0) {
            indexColor = 1;
        }

        ctx.beginPath();
        ctx.fillStyle = colores[indexColor];
        ctx.moveTo(centroX, centroY);
        ctx.arc(centroX, centroY, radio, anguloInicio, anguloFin);
        ctx.fill();
        ctx.stroke(); // Línea separadora
        ctx.closePath();

        // Texto
        ctx.save();
        ctx.translate(centroX, centroY);
        ctx.rotate(anguloInicio + arco / 2);
        
        ctx.textAlign = "right";
        ctx.fillStyle = indexColor === 1 ? "#0033a0" : (indexColor === 0 ? "#ffffff" : "#0f172a");
        ctx.font = "bold 16px sans-serif";
        
        // Truncar texto si es muy largo
        let texto = premiosVisibles[i].nombre;
        if (texto.length > 20) texto = texto.substring(0, 18) + "...";
        
        ctx.fillText(texto, radio - 20, 5);
        ctx.restore();
    }
    
    // Circulo central decorativo
    ctx.beginPath();
    ctx.arc(centroX, centroY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#0033a0";
    ctx.stroke();
    ctx.closePath();
}

// Lógica de Giro
let girando = false;
btnGirar.addEventListener("click", () => {
    if (girando || premiosVisibles.length === 0) return;
    girando = true;
    btnGirar.disabled = true;

    // Elegir ganador internamente
    const indexGanador = indexGanadorVisible;
    const premioGanado = premioGanadoActual;
    
    const arcos = (2 * Math.PI) / premiosVisibles.length;
    // Calcular el ángulo donde el centro del trozo del ganador queda justo arriba (270 grados = 1.5 PI)
    // Canvas inicia 0 en la derecha (3 en punto). Arriba es -Math.PI / 2
    const targetA = indexGanador * arcos + (arcos / 2);
    // Vueltas extra para el efecto
    const vueltas = 10 * 2 * Math.PI;
    const anguloFinal = vueltas - targetA - (Math.PI / 2);
    
    let tiempoActual = 0;
    const tiempoTotal = 5000; // 5 segundos
    
    function animarGiro() {
        tiempoActual += 20; // 60fps aprox
        if (tiempoActual >= tiempoTotal) {
            finalizarGiro(premioGanado, anguloFinal);
            return;
        }
        
        // Easing function (easeOutQuad)
        const progreso = tiempoActual / tiempoTotal;
        const easing = 1 - (1 - progreso) * (1 - progreso);
        const anguloActual = easing * anguloFinal;
        
        dibujarRuleta(anguloActual);
        requestAnimationFrame(animarGiro);
    }
    
    animarGiro();
});

async function finalizarGiro(premioGanado, anguloFinal) {
    dibujarRuleta(anguloFinal);
    
    const titulo = document.getElementById("ruleta-title");
    titulo.innerText = `¡Ganaste: ${premioGanado.nombre}!`;
    titulo.classList.add("win-highlight");

    // Mostrar imagen del premio si existe
    const imgContainer = document.getElementById("premio-ganado-container");
    const imgElement = document.getElementById("premio-ganado-img");
    const canvasContainer = document.getElementById("ruleta-canvas-container");
    
    if (premioGanado.imagen && premioGanado.imagen.trim() !== '') {
        imgElement.src = premioGanado.imagen;
        imgContainer.style.display = "block";
        canvasContainer.style.display = "none"; // Ocultar la rueda para destacar el premio
    }
    
    // Registrar en API
    const exito = await registrarGanador({
        nombre: datosUsuario.nombre,
        contacto: datosUsuario.contacto,
        telefono: datosUsuario.telefono,
        premio: premioGanado
    });
    
    setTimeout(async () => {
        alert(exito ? "¡Premio registrado con éxito! Retíralo en caja." : "Hubo un error al registrar, pero ganaste: " + premioGanado.nombre);
        
        // Redibujar si el stock llegó a 0 y auto-descuento está activado
        if (localStorage.getItem('AUTO_DESCONTAR') !== 'false') {
            premioGanado.stock = parseInt(premioGanado.stock) - 1;
            if (premioGanado.stock <= 0) {
                todosLosPremios = todosLosPremios.filter(p => p.id !== premioGanado.id);
            }
        }
        prepararNuevaRuleta(); // Preparar para el siguiente cliente
        
        // Reiniciar UI
        titulo.innerText = "Gira la Ruleta";
        titulo.classList.remove("win-highlight");
        imgContainer.style.display = "none";
        canvasContainer.style.display = "flex";
        girando = false;
        btnGirar.disabled = false;
        
        // Volver al registro para el siguiente cliente
        seccionRuleta.classList.remove("active");
        seccionRuleta.classList.add("hidden");
        document.getElementById("registro-form").reset();
        setTimeout(() => {
            seccionRegistro.classList.remove("hidden");
            seccionRegistro.classList.add("active");
        }, 400);

    }, 3500); // Dar 3.5 segundos para que la persona vea la imagen de su premio
}









