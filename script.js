const main = document.querySelector("main");
const botonMenu = document.getElementById("botonMenu");
const botonLogo = document.getElementById("botonLogo");
const contenedorScroll = document.getElementById("content");
const enlacesMenu = document.querySelectorAll(".menu a");

// 1. Enlaces del menú: hacen scroll suave a su sección
//    (el href="#id" ya lo hace el navegador solo). El primer
//    clic revela la columna de contenido (antes solo se ve
//    el nav a pantalla completa, en cualquier tamaño de
//    pantalla).
enlacesMenu.forEach(link => {
    link.addEventListener("click", () => {
        document.body.classList.add("mostrar-contenido");
        // .derecha pasa de oculta a visible aquí: recalculamos
        // el parallax ahora que ya tiene una altura real.
        requestAnimationFrame(actualizarParallaxHobbies);
    });
});

// 2. Logo/personaje: vuelve a la pantalla de bienvenida
//    (solo nav a pantalla completa, como al entrar) y
//    sube el scroll del contenido arriba del todo para
//    la próxima vez que se abra.
function volverAlInicio() {
    document.body.classList.remove("mostrar-contenido");
    contenedorScroll.scrollTo({ top: 0, behavior: "instant" });
}

botonLogo.addEventListener("click", () => {
    // Si estamos viendo una sección, vuelve al menú completo.
    if (document.body.classList.contains("mostrar-contenido")) {
        volverAlInicio();
        return;
    }

    // Si el menú ya está completo, abre la landing directamente en INICIO.
    document.body.classList.add("mostrar-contenido");
    requestAnimationFrame(() => {
        const inicio = document.getElementById("juanjo");
        if (inicio) inicio.scrollIntoView({ behavior: "smooth", block: "start" });
        actualizarParallaxHobbies();
    });
});

// 3. Botón "volver al menú" (solo visible en móvil/tablet,
//    una vez se está viendo contenido — ahí el panel está
//    oculto y esta es la única forma de volver a verlo)
botonMenu.addEventListener("click", volverAlInicio);

// Volver al inicio también con la tecla Escape
document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        volverAlInicio();
    }
});

// 4. Puntos del mapa: hacen scroll suave a su sección
//    (los de escritorio usan id="p-xxx", los de la lista
//    de móvil usan data-destino="xxx" directamente)
contenedorScroll.addEventListener("click", e => {
    const punto = e.target.closest(".map-point, .mapa-movil__parada");
    if (!punto) return;

    const idDestino = punto.dataset.destino || punto.id.replace("p-", "");
    const destino = document.getElementById(idDestino);
    if (destino) {
        destino.scrollIntoView({ behavior: "smooth" });
    }
});

// 5. Scrollspy: resalta en el menú la sección que se está viendo
const secciones = Array.from(enlacesMenu)
    .map(link => document.getElementById(link.getAttribute("data-page")))
    .filter(Boolean);

const observador = new IntersectionObserver(
    entradas => {
        entradas.forEach(entrada => {
            const enlace = document.querySelector(`.menu a[data-page="${entrada.target.id}"]`);
            if (!enlace) return;

            if (entrada.isIntersecting) {
                enlacesMenu.forEach(a => {
                    a.classList.remove("activo");
                    a.removeAttribute("aria-current");
                });
                enlace.classList.add("activo");
                enlace.setAttribute("aria-current", "true");
            }
        });
    },
    {
        root: contenedorScroll,
        // Considera "activa" la sección cuando ocupa la franja
        // central de la ventana de scroll.
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0
    }
);

secciones.forEach(seccion => observador.observe(seccion));


// 6. Parallax de Hobbies (mediante scroll real, ya que
//    "background-attachment: fixed" no funciona anidado
//    dentro de .derecha — ver nota en hobbies.css)
//    A diferencia de antes (que se quedaba en "0" cuando la
//    sección estaba centrada, y por tanto apenas se notaba
//    justo mientras la estás mirando), ahora el desplazamiento
//    es CONTINUO mientras recorres la sección: el fondo avanza
//    más despacio que el texto durante todo el scroll, que es
//    el efecto parallax clásico.
//    Si el sistema tiene activado "reducir movimiento" se
//    suaviza el efecto en vez de desactivarlo del todo.
const prefiereMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const factorParallax = prefiereMenosMovimiento ? 0.1 : 0.4;
const hobbies = document.querySelectorAll(".jj-hobby");

function actualizarParallaxHobbies() {
    if (hobbies.length === 0 || contenedorScroll.clientHeight === 0) return;

    hobbies.forEach(seccion => {
        // -rect.top equivale a "cuánto se ha desplazado el
        // scroll desde que esta sección empezó a entrar por
        // arriba" — pero calculado con getBoundingClientRect
        // (siempre relativo al viewport visible) en vez de
        // offsetTop, que depende del ancestro posicionado más
        // cercano y aquí daba 0 para todas las secciones.
        const rect = seccion.getBoundingClientRect();
        const altoVentana = contenedorScroll.clientHeight || window.innerHeight;
        const centroSeccion = rect.top + rect.height / 2;
        const centroVentana = altoVentana / 2;
        const distanciaNormalizada = (centroSeccion - centroVentana) / ((altoVentana + rect.height) / 2);
        const limite = window.innerWidth <= 700 ? 0 : 28;
        const desplazamiento = Math.max(-limite, Math.min(limite, -distanciaNormalizada * limite * (factorParallax / 0.4)));

        seccion.style.setProperty("--jj-parallax", `${desplazamiento.toFixed(1)}px`);
    });
}

let parallaxPendiente = false;

contenedorScroll.addEventListener("scroll", () => {
    if (parallaxPendiente) return;
    parallaxPendiente = true;

    requestAnimationFrame(() => {
        actualizarParallaxHobbies();
        parallaxPendiente = false;
    });
});

window.addEventListener("resize", actualizarParallaxHobbies);

actualizarParallaxHobbies();

// 7. El mapa móvil usa una ruta vertical visual definida en mapa.css.

/* ============================
   PORTADA: interacción suave
============================ */
(() => {
  const portada = document.querySelector('.juanjo-container');
  if (!portada) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    portada.addEventListener('pointermove', (e) => {
      if (window.innerWidth <= 700) return;
      const r = portada.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      portada.style.setProperty('--mx', `${x * 14}px`);
      portada.style.setProperty('--my', `${y * 8}px`);
    });

    portada.addEventListener('pointerleave', () => {
      portada.style.setProperty('--mx', '0px');
      portada.style.setProperty('--my', '0px');
    });
  }

  document.querySelectorAll('.juanjo-container [data-destino]').forEach((boton) => {
    boton.addEventListener('click', () => {
      const destino = document.getElementById(boton.dataset.destino);
      if (destino) destino.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block:'start'});
    });
  });
})();

/* ============================
   INICIO — ESCENA TIPO WALLPAPER ENGINE
============================ */
(() => {
  const hero = document.querySelector('.juanjo-container');
  const canvas = hero?.querySelector('.juanjo-particulas');
  if (!hero || !canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let raf = null;
  let active = true;

  function resizeCanvas() {
    const r = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.floor(r.width * dpr));
    canvas.height = Math.max(1, Math.floor(r.height * dpr));
    canvas.style.width = `${r.width}px`;
    canvas.style.height = `${r.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedParticles();
  }

  function seedParticles() {
    const r = hero.getBoundingClientRect();
    const count = window.innerWidth <= 600 ? 16 : 34;
    particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * r.width,
      y: Math.random() * r.height,
      size: 1.1 + Math.random() * (i % 5 === 0 ? 5 : 2.7),
      vx: -0.12 - Math.random() * 0.45,
      vy: 0.08 + Math.random() * 0.34,
      rot: Math.random() * Math.PI * 2,
      vr: (-0.015 + Math.random() * 0.03),
      alpha: 0.14 + Math.random() * 0.34,
      leaf: Math.random() > 0.58,
      blur: Math.random() > 0.83 ? 1.6 : 0
    }));
  }

  function drawParticles() {
    if (!active || reduceMotion) return;
    const r = hero.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.x < -30) p.x = r.width + 25;
      if (p.y > r.height + 30) p.y = -20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      if (p.blur) ctx.filter = `blur(${p.blur}px)`;

      if (p.leaf) {
        ctx.fillStyle = '#66594b';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.9, p.size * .7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#7c756b';
        ctx.beginPath();
        ctx.arc(0, 0, p.size * .45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    raf = requestAnimationFrame(drawParticles);
  }

  function clearFlashClasses() {
    hero.classList.remove('flash-1', 'flash-2', 'afterglow');
  }

  function lightningSequence() {
    if (reduceMotion || !active) return;
    clearFlashClasses();

    // Un relámpago irregular: destello corto, pausa y segundo golpe más fuerte.
    hero.classList.add('flash-1');
    setTimeout(() => {
      hero.classList.remove('flash-1');
      setTimeout(() => {
        hero.classList.add('flash-2');
        setTimeout(() => {
          hero.classList.remove('flash-2');
          hero.classList.add('afterglow');
          setTimeout(() => hero.classList.remove('afterglow'), 420);
        }, 105 + Math.random() * 70);
      }, 65 + Math.random() * 115);
    }, 55 + Math.random() * 50);

    scheduleLightning();
  }

  let lightningTimer;
  function scheduleLightning() {
    clearTimeout(lightningTimer);
    const delay = 18000 + Math.random() * 18000;
    lightningTimer = setTimeout(lightningSequence, delay);
  }

  if (!reduceMotion) {
    hero.addEventListener('pointermove', (e) => {
      if (window.innerWidth <= 700) return;
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - .5) * 8;
      const y = ((e.clientY - r.top) / r.height - .5) * 5;
      hero.style.setProperty('--mx', `${x}px`);
      hero.style.setProperty('--my', `${y}px`);
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--mx', '0px');
      hero.style.setProperty('--my', '0px');
    });

    resizeCanvas();
    drawParticles();
  }

  const io = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active && !reduceMotion) {
      if (!raf) drawParticles();
      scheduleLightning();
    } else {
      clearTimeout(lightningTimer);
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      clearFlashClasses();
    }
  }, { threshold: .05 });
  io.observe(hero);

  window.addEventListener('resize', resizeCanvas, { passive: true });
})();

/* ============================
   NAVEGACIÓN ENTRE SECCIONES
============================ */
contenedorScroll.addEventListener('click', (e) => {
  const boton = e.target.closest('.seccion-nav__boton');
  if (!boton) return;

  const destino = document.getElementById(boton.dataset.destino);
  if (!destino) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  destino.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start'
  });
});


/* ============================
   ACCESIBILIDAD — navegación entre secciones
============================ */
(() => {
  const nombres = {
    juanjo: 'Inicio',
    sobremi: 'Sobre mí',
    portfolio: 'Proyectos',
    educacion: 'Formación',
    skills: 'Skills',
    hobbies: 'Hobbies',
    contacto: 'Contacto',
    mapa: 'Mapa'
  };

  document.querySelectorAll('.seccion-nav__boton, .juanjo-scroll').forEach((boton) => {
    const destino = boton.dataset.destino;
    if (!destino || !nombres[destino]) return;
    const esAnterior = boton.closest('.seccion-nav--anterior');
    boton.setAttribute(
      'aria-label',
      `${esAnterior ? 'Ir a la sección anterior' : 'Ir a la siguiente sección'}: ${nombres[destino]}`
    );
    boton.setAttribute('title', nombres[destino]);
  });
})();


// Accesibilidad: si el sistema solicita menos movimiento, pausamos el vídeo decorativo.
(() => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const actualizarVideo = () => {
    const video = document.querySelector('.juanjo-video--principal');
    if (!video) return;
    if (media.matches) {
      video.pause();
      video.removeAttribute('autoplay');
    } else {
      video.setAttribute('autoplay', '');
      video.muted = true;
      const intento = video.play();
      if (intento && typeof intento.catch === 'function') intento.catch(() => {});
    }
  };
  actualizarVideo();
  if (typeof media.addEventListener === 'function') media.addEventListener('change', actualizarVideo);
})();
