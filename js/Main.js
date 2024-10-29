let allTours = [];
let filteredTours = [];
let activeFilters = {
  city: null,
  season: null
};

document.addEventListener("DOMContentLoaded", async function () {
  const { tours } = await import("./tours.js");
  allTours = tours;

  const urlParams = new URLSearchParams(window.location.search);
  const tourId = urlParams.get("id");

  if (window.location.pathname.includes("tour.html") && tourId) {
    renderTour(tourId);
  } else if (window.location.pathname.includes("destinos.html")) {
    initializeDestinosPage();
    setupPagination();
    initFilters();
  } else {
    initializeHomePage();
    setupPagination();
    initFilters();
  }

  setupDropdowns();
  navSlide();
});

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".botonmoderno"); // Suponiendo que esos botones tienen esta clase
  
  buttons.forEach(button => {
    button.addEventListener("click", function(e) {
      e.preventDefault();
      
      const season = this.getAttribute("data-season"); // Para el filtro de temporada
      const city = this.getAttribute("data-city");     // Para el filtro de ciudad
      
      let url = "/Destinos.html";  // Redirigimos a la página de destinos
      
      // Si hay un filtro de ciudad o temporada, lo agregamos a la URL
      if (season) {
        url += `?season=${season}`;
      } else if (city) {
        url += `?city=${city}`;
      }

      window.location.href = url;  // Redireccionamos a la página con los filtros
    });
  });
});


document.addEventListener("DOMContentLoaded", function () {
  const ropaBoton = document.getElementById("ropa-boton");
  ropaBoton.addEventListener("click", function () {
    window.location.href = "ropa.html";
  });
});

// Verificar la sesión del usuario
async function checkUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const response = await fetch("http://localhost:3000/usuarios/me", {
      headers: {
        Authorization: token,
      },
    });

    if (!response.ok) {
      throw new Error("Token inválido");
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error("Error al verificar el usuario:", error);
    return null;
  }
}

function initializeDestinosPage() {
  const savedState = loadState();
  const urlParams = new URLSearchParams(window.location.search);
  const season = urlParams.get("season");
  const city = urlParams.get("city");
  const urlPage = parseInt(urlParams.get("page")) || 1;
  const isFirstVisit = !localStorage.getItem('hasVisitedDestinos');
  
  if (savedState && document.referrer.includes('tour.html')) {
    // Restaurar estado cuando volvemos de ver un tour
    currentPage = savedState.currentPage || 1;
    activeFilters = savedState.activeFilters;
    filteredTours = filterTours();
    
    setTimeout(() => {
      window.scrollTo(0, savedState.scrollPosition);
    }, 100);
  } else if (season || city) {
    // Si hay parámetros de filtro en la URL
    currentPage = urlPage;
    activeFilters = {
      season: season || null,
      city: city || null
    };
    filteredTours = filterTours();
  } else if (isFirstVisit) {
    // Primera visita
    currentPage = 1;
    activeFilters = {
      season: null,
      city: null
    };
    filteredTours = allTours;
    localStorage.setItem('hasVisitedDestinos', 'true');
  } else if (savedState) {
    // Restaurar estado guardado
    currentPage = savedState.currentPage || 1;
    activeFilters = savedState.activeFilters;
    filteredTours = filterTours();
  } else {
    // Estado por defecto
    currentPage = 1;
    activeFilters = {
      season: null,
      city: null
    };
    filteredTours = allTours;
  }

  updateFilterButtons();
  displayTours(filteredTours);
}





function filterTours() {
  console.log("Filtering tours with active filters:", activeFilters);
  return allTours.filter(tour => {
    const cityMatch = !activeFilters.city || tour.lugar.toLowerCase() === activeFilters.city.toLowerCase();
    const seasonMatch = !activeFilters.season || 
      (activeFilters.season === 'winter' && tour.temporada === true) ||
      (activeFilters.season === 'summer' && tour.temporada === false);
    return cityMatch && seasonMatch;
  });
}

function toggleFilter(type, value) {
  const previousFilters = { ...activeFilters };
  
  if (value === 'all') {
    // Si se selecciona "Mostrar Todo", resetear todos los filtros
    activeFilters = {
      city: null,
      season: null
    };
    filteredTours = allTours;
  } else {
    // Si ya está activo el filtro, desactivarlo
    if (activeFilters[type] === value) {
      activeFilters[type] = null;
    } else {
      // Si no está activo, activarlo
      activeFilters[type] = value;
    }
    filteredTours = filterTours();
  }

  // Resetear a página 1 solo si los filtros cambiaron
  if (JSON.stringify(previousFilters) !== JSON.stringify(activeFilters)) {
    currentPage = 1;
  }

  updateFilterButtons();
  displayTours(filteredTours);
  saveState();
}







function updateFilterButtons() {
  const filterButtons = document.querySelectorAll('.filtros button');
  filterButtons.forEach(button => {
    const type = button.getAttribute('data-type');
    const value = button.getAttribute('data-value');

    button.classList.remove('active');

    if (value === 'all') {
      // Activar "Mostrar Todo" solo si no hay filtros activos
      if (!activeFilters.city && !activeFilters.season) {
        button.classList.add('active');
      }
    } else if (type && value) {
      // Activar el botón si su filtro correspondiente está activo
      if (activeFilters[type] === value) {
        button.classList.add('active');
      }
    }
  });
}




function resetFilters() {
  activeFilters = { city: [], season: [] };
  updateFilterButtons();
  displayTours(allTours);
}

function applyFilters() {
  filteredTours = allTours;

  // Filtrar por ciudad
  if (activeFilters.city) {
    if (activeFilters.city === 'otros') {
      filteredTours = filteredTours.filter(tour => 
        !['ushuaia', 'calafate', 'antartida'].includes(tour.lugar.toLowerCase())
      );
    } else {
      filteredTours = filteredTours.filter(tour => 
        tour.lugar.toLowerCase() === activeFilters.city.toLowerCase()
      );
    }
  }

  // Filtrar por temporada
  if (activeFilters.season) {
    filteredTours = filteredTours.filter(tour => 
      (activeFilters.season === 'winter' && tour.temporada === true) ||
      (activeFilters.season === 'summer' && tour.temporada === false)
    );
  }
  if (!activeFilters.city && !activeFilters.season) {
    filteredTours = allTours;
  } else {
    filteredTours = filterTours();
  }

  // Resetear a la primera página
  currentPage = 1;
  
  // Actualizar botones de filtro
  updateFilterButtons();
  
  // Mostrar los tours filtrados
  displayTours(filteredTours);

  // Log para debugging
  console.log('Filtros activos:', activeFilters);
  console.log('Número de tours filtrados:', filteredTours.length);
}





function initFilters() {
  const filterButtons = document.querySelectorAll('.filtros button');
  filterButtons.forEach(button => {
    button.addEventListener("click", function(e) {
      e.preventDefault();
      const type = this.getAttribute("data-type");
      const value = this.getAttribute("data-value");
      toggleFilter(type, value);
    });
  });

  // Activar el botón "Mostrar Todo" por defecto si no hay filtros activos
  if (!activeFilters.city && !activeFilters.season) {
    const showAllButton = document.querySelector('.filtros button[data-value="all"]');
    if (showAllButton) {
      showAllButton.classList.add('active');
    }
  }
}


function initializeHomePage() {
  const buttons = document.querySelectorAll(
    ".botonmoderno, .botonmoderno-tours"
  );
  buttons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const season = this.getAttribute("data-season");
      const city = this.getAttribute("data-city");
      if (city) {
        window.location.href = `destinos.html?city=${city}`;
      } else if (season) {
        window.location.href = `destinos.html?season=${season}`;
      }
    });
  });
}

function setupDropdowns() {
  const dropdowns = document.querySelectorAll(".dropdown");
  dropdowns.forEach((dropdown) => {
    const toggleButton = dropdown.querySelector(".dropdown-toggle");
    toggleButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.toggle("active");
    });
  });

  document.addEventListener("click", function () {
    dropdowns.forEach((dropdown) => dropdown.classList.remove("active"));
  });

  const langLinks = document.querySelectorAll(".dropdown-menu [data-lang]");
  langLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const lang = this.getAttribute("data-lang");
      console.log(`Cambiando idioma a: ${lang}`);
    });
  });
}

// Constantes
const TOURS_PER_PAGE = 10; // 2 filas de 5 tours
let currentPage = 1;

function displayTours(tours) {
  const container = document.getElementById("contenedor");
  if (!container) return;
  
  container.innerHTML = '';
  
  if (tours.length === 0) {
    container.innerHTML = '<div class="no-tours">No se encontraron tours con los filtros seleccionados</div>';
    setupPagination(0);
    return;
  }

  const startIndex = (currentPage - 1) * TOURS_PER_PAGE;
  const paginatedTours = tours.slice(startIndex, startIndex + TOURS_PER_PAGE);

  // Verificar si la página actual es válida
  const totalPages = Math.ceil(tours.length / TOURS_PER_PAGE);
  if (currentPage > totalPages) {
    currentPage = totalPages;
    const newStartIndex = (currentPage - 1) * TOURS_PER_PAGE;
    const newPaginatedTours = tours.slice(newStartIndex, newStartIndex + TOURS_PER_PAGE);
    displayToursContent(newPaginatedTours, container);
  } else {
    displayToursContent(paginatedTours, container);
  }
  
  setupPagination(tours.length);
  updateURL();
}



function createPaginationButtons(totalTours) {
  const paginationContainer = document.getElementById("pagination-container");
  if (!paginationContainer) {
    console.error("El contenedor de paginación no existe en el DOM.");
    return;
  }
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(totalTours / TOURS_PER_PAGE);

  // Botón "Anterior"
  const prevButton = createPaginationButton("&laquo; Anterior", () => {
    if (currentPage > 1) {
      currentPage--;
      displayTours(allTours);
    }
  });
  paginationContainer.appendChild(prevButton);

  // Botones numéricos (mostramos solo 5 páginas a la vez)
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  for (let i = startPage; i <= endPage; i++) {
    const button = createPaginationButton(i.toString(), () => {
      currentPage = i;
      displayTours(allTours);
    });
    if (i === currentPage) {
      button.classList.add("active");
    }
    paginationContainer.appendChild(button);
  }

  // Botón "Siguiente"
  const nextButton = createPaginationButton("Siguiente &raquo;", () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayTours(allTours);
    }
  });
  paginationContainer.appendChild(nextButton);
}

function setupPagination(totalTours) {
  const paginationContainer = document.getElementById("pagination-container");
  if (!paginationContainer) return;

  const totalPages = Math.ceil(totalTours / TOURS_PER_PAGE);
  
  if (totalTours === 0 || totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  paginationContainer.innerHTML = '';
  
  // Asegurar que la página actual es válida
  currentPage = Math.max(1, Math.min(currentPage, totalPages));

  // Determinar el rango de páginas a mostrar
  let startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  startPage = Math.max(1, endPage - 4); // Ajustar el inicio si estamos cerca del final

  // Botón "Anterior"
  if (currentPage > 1) {
    const prevButton = createPaginationButton("Anterior", () => {
      currentPage--;
      displayTours(filteredTours);
      saveState();
    });
    paginationContainer.appendChild(prevButton);
  }

  // Primera página y elipsis si es necesario
  if (startPage > 1) {
    const firstButton = createPaginationButton("1", () => {
      currentPage = 1;
      displayTours(filteredTours);
      saveState();
    });
    paginationContainer.appendChild(firstButton);
    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "...";
      paginationContainer.appendChild(ellipsis);
    }
  }

  // Botones de página numerados
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.className = `pagination-button${i === currentPage ? ' active' : ''}`;
    pageButton.textContent = i;

    pageButton.addEventListener('click', function() {
      currentPage = i;
      displayTours(filteredTours);
      saveState();
    });

    paginationContainer.appendChild(pageButton);
  }

  // Última página y elipsis si es necesario
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "...";
      paginationContainer.appendChild(ellipsis);
    }
    const lastButton = createPaginationButton(totalPages.toString(), () => {
      currentPage = totalPages;
      displayTours(filteredTours);
      saveState();
    });
    paginationContainer.appendChild(lastButton);
  }

  // Botón "Siguiente"
  if (currentPage < totalPages) {
    const nextButton = createPaginationButton("Siguiente", () => {
      currentPage++;
      displayTours(filteredTours);
      saveState();
    });
    paginationContainer.appendChild(nextButton);
  }
}

// Nueva función auxiliar para el contenido de los tours
function displayToursContent(tours, container) {
  tours.forEach(tour => {
    const tourCard = document.createElement("div");
    tourCard.className = "tour-card";

    const imageContainer = document.createElement("div");
    imageContainer.className = "tour-image-container";
    const bannerImg = document.createElement("img");
    bannerImg.src = tour.imagenes[0];
    bannerImg.alt = `Banner de ${tour.name}`;
    bannerImg.className = "tour-image";
    imageContainer.appendChild(bannerImg);

    const name = document.createElement("h2");
    name.className = "tour-name";
    const nameSpan = document.createElement("span");
    nameSpan.textContent = tour.name;
    name.appendChild(nameSpan);

    tourCard.appendChild(imageContainer);
    tourCard.appendChild(name);

    tourCard.addEventListener("click", () => {
      saveState();
      window.location.href = `tour.html?id=${tour.id}`;
    });

    container.appendChild(tourCard);
  });
}

// Agregar event listener para guardar el estado antes de salir de la página
window.addEventListener('beforeunload', () => {
  if (window.location.pathname.includes('destinos.html')) {
    saveState();
  }
});

// Añadir esta nueva función auxiliar
function updateURL() {
  const params = new URLSearchParams();
  
  if (currentPage > 1) {
    params.set('page', currentPage.toString());
  }
  
  if (activeFilters.city) {
    params.set('city', activeFilters.city);
  }
  
  if (activeFilters.season) {
    params.set('season', activeFilters.season);
  }
  
  const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newUrl);
}


function saveState() {
  const state = {
    currentPage: currentPage,
    activeFilters: activeFilters,
    scrollPosition: window.scrollY,
    timestamp: Date.now()
  };
  localStorage.setItem('destinosState', JSON.stringify(state));
}


function loadState() {
  const savedState = localStorage.getItem('destinosState');
  if (!savedState) return null;
  
  const state = JSON.parse(savedState);
  const oneHour = 60 * 60 * 1000; // 1 hora en milisegundos
  
  // Si el estado tiene más de 1 hora, lo consideramos expirado
  if (Date.now() - state.timestamp > oneHour) {
    clearState();
    return null;
  }
  
  return state;
}

function clearState() {
  localStorage.removeItem('destinosState');
}

function createPaginationButton(text, onClick) {
  const button = document.createElement("button");
  button.innerHTML = text;
  button.className = "pagination-button";
  button.addEventListener("click", onClick);
  return button;
}

// Asegúrate de llamar a esta función cuando la página se cargue
function initTours(tours) {
  allTours = tours; // Guarda todos los tours en la variable global
  displayTours(tours);
}

// Añade esta función para manejar los filtros
function handleFilter(city, season) {
  let filteredTours = allTours;

  if (city && city !== "all") {
    filteredTours = filteredTours.filter((tour) => tour.lugar === city);
  }

  if (season && season !== "all") {
    filteredTours = filteredTours.filter(
      (tour) => tour.temporada === (season === "winter")
    );
  }

  currentPage = 1; // Reinicia la página actual al filtrar
  displayTours(filteredTours);
}

// Asegúrate de agregar event listeners a tus botones de filtro
document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".filtros button");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const city = button.getAttribute("data-city");
      const season = button.getAttribute("data-season");
      handleFilter(city, season);
    });
  });
});


// header

const navSlide = () => {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav-links");
  const navLinks = document.querySelectorAll(".nav-links li");

  burger.addEventListener("click", () => {
    nav.classList.toggle("nav-active");

    navLinks.forEach((link, index) => {
      if (link.style.animation) {
        link.style.animation = "";
      } else {
        link.style.animation = `navLinkFade 0.5s ease forwards ${
          index / 7 + 0.3
        }s`;
      }
    });

    burger.classList.toggle("toggle");
  });
};

navSlide();

const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav-links");

burger.addEventListener("click", () => {
  nav.classList.toggle("active");
  burger.classList.toggle("toggle");
});

// Cerrar el menú al hacer clic en un enlace
const navLinks = document.querySelectorAll(".nav-links li");
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("active");
    burger.classList.remove("toggle");
  });
});

//render de los tours

function renderTour(tourId) {
  const tour = allTours.find((t) => t.id === tourId);
  if (!tour) {
    console.error("Tour no encontrado");
    return;
  }

  const mainElement = document.querySelector('[role="main"]');
  mainElement.innerHTML = ""; // Limpiar el contenido existente

  // Sección de presentación
  const presentationSection = createSection("presentation", tour.imagenes[0]);
  presentationSection.innerHTML = `
        <h1 class="titulo-tour">${tour.name}</h1>
        <p id="slogan">${tour.slogan || ""}</p>
    `;
  mainElement.appendChild(presentationSection);

  // Nueva sección de recorrido
  const routeSection = createSection("route", tour.imagenes[1]);
  routeSection.innerHTML = `
        <div class="recorrido-desc" id="recorrido-descripcion">
            <h2 class="subtitulo">Recorrido</h2>
            <p>${tour.caracteristicas[0].recorrido || "Información del recorrido no disponible"}</p>
        </div>
        <div class="image-container" id="recorrido">
            <img src="${tour.imagenes_secundarias[0]}" alt="Imagen del recorrido 1">
            <img src="${tour.imagenes_secundarias[1]}" alt="Imagen del recorrido 2">
        </div>
    `;
  mainElement.appendChild(routeSection);

  // Sección de ubicación
  const locationSection = createSection("location", tour.imagenes[2]);
  locationSection.innerHTML = `
        <div class="ubicacion-desc">
         <h2 class="subtitulo">Ubicación</h2>
         <p>${tour.caracteristicas[0].ubicacion}</p>
        </div>
        <div class="image-container" id="ubicacion">
            <img src="${tour.imagenes_secundarias[2]}" alt="Imagen secundaria 1">
            <img src="${tour.imagenes_secundarias[3]}" alt="Imagen secundaria 2">
        </div>
    `;
  mainElement.appendChild(locationSection);

  // Sección de dificultad
  const difficultySection = createSection("difficulty", tour.imagenes[3]);
  difficultySection.innerHTML = `
        <div class="dificultad-desc">
        <h2 class="subtitulo">Dificultad</h2>
        <p>${tour.caracteristicas[0].dificultad}</p>
        </div>
        
        <div class="image-container" id="dificultad">
            <img src="${tour.imagenes_secundarias[4]}" alt="Imagen secundaria 3">
            <img src="${tour.imagenes_secundarias[5]}" alt="Imagen secundaria 4">
        </div>
    `;
  mainElement.appendChild(difficultySection);

  // Sección de más información
  const moreInfoSection = createSection("more-info", tour.imagenes[4]);
  moreInfoSection.innerHTML = `
        <h2 class="subtitulo" id="masinfo">Más Información</h2>
    <div class="mas-info-desc">
        <p>Si desea conocer más información sobre el recorrido de este tour, seleccione la temporada en la que desee asistir y más información será revelada</p>
    </div>
    
    <div class="image-container" id="mas-informacion">
        <div class="image-subtitle-wrapper">
            <img src="${tour.imagenes_secundarias[6]}" alt="Imagen secundaria 5" class="info-trigger" data-info-image="${tour.imagenes_info[0]}">
            <h2 class="sub-desc">Verano</h2>
        </div>
        <div class="image-subtitle-wrapper">
            <img src="${tour.imagenes_secundarias[7]}" alt="Imagen secundaria 6" class="info-trigger" data-info-image="${tour.imagenes_info[1]}">
            <h2 class="sub-desc">Invierno</h2>
        </div>
    </div>
    <div id="info-modal" class="modal">
        <span class="close">&times;</span>
        <img class="modal-content" id="info-image">
    </div>
    `;
  mainElement.appendChild(moreInfoSection);

  // Sección de reserva
  const bookingSection = createSection("booking", tour.imagenes[5]);
  bookingSection.innerHTML = `
        <div class="reserva">
        <h2 class="subtitulo">Reserva</h2>
        <p>¡Descubre ${tour.name} con nuestros guías locales expertos y vive una experiencia inolvidable! Reserva tu aventura hoy mismo y conecta con la naturaleza en su máxima expresión.</p>
        <div class="botonmoderno-tours" id="reserva-btn">¡Reserva ahora!</div>
        </div>
    `;
  mainElement.appendChild(bookingSection);

  setupInfoModal();

  document.getElementById("reserva-btn").addEventListener("click", function () {
    window.location.href = `reserva.html?id=${tourId}`;
  });
}

// Función auxiliar para crear secciones (sin cambios)
function createSection(className, backgroundImage) {
  const section = document.createElement("section");
  section.className = `section secciones-tours ${className}`;
  section.style.backgroundImage = `url(${backgroundImage})`;
  return section;
}


// Función para configurar el modal de información (sin cambios)
function setupInfoModal() {
  const modal = document.getElementById("info-modal");
  const modalImg = document.getElementById("info-image");
  const closeBtn = document.getElementsByClassName("close")[0];

  document.querySelectorAll(".info-trigger").forEach((img) => {
    img.onclick = function () {
      modal.style.display = "block";
      modalImg.src = this.getAttribute("data-info-image");
    };
  });

  closeBtn.onclick = function () {
    modal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}




window.logout = function logout() {
  // Eliminar token y otros datos de sesión

  // Agregar más llamadas a removeItem si necesitas eliminar otros datos de sesión

  // Mostrar notificación de confirmación
  showNotification("¿Seguro que deseas cerrar la sesión?", "warning", {
    showButtons: true,
    callbackYes: () => {
      localStorage.removeItem("token");
      setTimeout(() => {
        window.location.href = "acceso.html";
      }, 500);
    },
    callbackNo: () => {
      console.log("Cancelado");
    }
  });
}

//carrito
window.addToCart = function addToCart(tourId, tourName, tourPrice, tourPriceMinor, tourCapacidad) {
  console.log(
    "Función addToCart llamada con:",
    tourId,
    tourName,
    tourPrice,
    tourPriceMinor,
    tourCapacidad
  );

  const token = localStorage.getItem("token");
  if (!token) {
    console.log("No hay token de autenticación");
    showTemporaryMessage(
      "Por favor, inicia sesión para agregar tours al carrito.",
      "warning"
    );
    window.location.href = "acceso.html";
    return;
  }

  const form = document.getElementById("reserva-form");
  const cantidad = parseInt(form.participantes.value);
  const fechaTourInput = document.getElementById("fecha-tour").value;
  const fechaInicioInput = document.getElementById("fecha-inicio").value;
  const fechaFinInput = document.getElementById("fecha-fin").value;

  if (!fechaTourInput || !fechaInicioInput || !fechaFinInput) {
    showTemporaryMessage(
      "Por favor, complete todos los campos para realizar la reserva.",
      "warning"
    );
    return;
  }

  const fechaTour = new Date(fechaTourInput);
  const fechaInicio = new Date(fechaInicioInput);
  const fechaFin = new Date(fechaFinInput);

  if (!validateDates(fechaTour, fechaInicio, fechaFin)) return;
  if (!validateQuantity(cantidad, tourCapacidad)) return;

  let edades = [];
  let subTotal = 0;

  for (let i = 0; i < cantidad; i++) {
    const edadInput = document.getElementById(`edad-${i}`);
    if (!edadInput) {
      showTemporaryMessage(
        "Por favor, ingresa la cantidad de participantes y sus edades.",
        "warning"
      );
      return;
    }
    const edad = parseInt(edadInput.value);
    if (isNaN(edad)) {
      showTemporaryMessage(
        "Por favor, ingresa todas las edades de los participantes.",
        "warning"
      );
      return;
    }
    edades.push(edad);
    subTotal += edad < 18 ? tourPriceMinor : tourPrice;
  }

  if (!validateAges(edades, cantidad)) return;

  console.log("Enviando solicitud a la API...");
  fetch("http://localhost:3000/api/carrito/agregar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tourId: parseInt(tourId, 10),
      cantidad: cantidad,
      edades: edades,
      fechaInicio: fechaInicio.toISOString().split("T")[0],
      fechaFin: fechaFin.toISOString().split("T")[0],
      fechaTour: fechaTour.toISOString().split("T")[0],
      subTotal: subTotal.toFixed(2),
    }),
  })
    .then((response) => {
      console.log("Respuesta de la API recibida", response);
      return response.json();
    })
    .then((data) => {
      console.log("Datos de la respuesta:", data);
      if (data.success) {
        showTemporaryMessage(
          `Tour agregado al carrito exitosamente. Subtotal: $${data.subTotal}`,
          "info"
        );
        updateCartCount();
        window.location.href = "carrito.html"
      } else {
        showTemporaryMessage(
          "Error al agregar el tour al carrito: " + data.message,
          "warning"
        );
      }
    })
    .catch((error) => {
      console.error("Error al agregar al carrito:", error);
      showTemporaryMessage(
        "Ocurrió un error al agregar el tour al carrito",
        "warning"
      );
    });
}



function validateDates(fechaTour, fechaInicio, fechaFin) {
  const tourDate = new Date(fechaTour);
  const startDate = new Date(fechaInicio);
  const endDate = new Date(fechaFin);

  if (tourDate < startDate || tourDate > endDate) {
    showTemporaryMessage(
      "La fecha del tour debe estar dentro del rango de fechas de estadía.",
      "warning"
    );
    return false;
  }

  return true;
}

// Actualizar la función validateQuantity
function validateQuantity(cantidad, maxPasajeros) {
  if (cantidad <= 0) {
    showTemporaryMessage(
      "La cantidad de personas debe ser mayor que cero.",
      "warning"
    );
    return false;
  }

  if (cantidad > maxPasajeros) {
    showTemporaryMessage(
      `No se pueden agregar más de ${maxPasajeros} personas para este tour.`,
      "warning"
    );
    return false;
  }

  return true;
}

function validateAges(edades, cantidad) {
  if (edades.length !== cantidad) {
    showTemporaryMessage(
      "El número de edades debe coincidir con la cantidad de personas.",
      "warning"
    );
    return false;
  }

  for (let i = 0; i < edades.length; i++) {
    const edad = edades[i];
    if (isNaN(edad) || edad <= 0 || edad > 120) {
      showTemporaryMessage(
        `La edad de la persona ${i + 1} debe estar entre 1 y 120 años.`,
        "warning"
      );
      return false;
    }
  }

  return true;
}

function updateCartCount() {
  const token = localStorage.getItem("token");
  if (!token) return;

  fetch("http://localhost:3000/api/carrito/contar", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const cartCount = document.querySelector(".cart-count");
      cartCount.textContent = data.count;
    })
    .catch((error) =>
      console.error("Error al actualizar el contador del carrito:", error)
    );
}

function showTemporaryMessage(message, type) {
  console.log(`Mostrando mensaje temporal: "${message}" (tipo: ${type})`);
  const messageDiv = document.createElement("div");
  messageDiv.textContent = message;
  messageDiv.className = `temporary-message ${type}`;
  messageDiv.style.position = "fixed";
  messageDiv.style.top = "20px";
  messageDiv.style.left = "50%";
  messageDiv.style.transform = "translateX(-50%)";
  messageDiv.style.padding = "10px 20px";
  messageDiv.style.backgroundColor = type === "info" ? "#4CAF50" : "#f44336";
  messageDiv.style.color = "white";
  messageDiv.style.borderRadius = "5px";
  messageDiv.style.zIndex = "1000";
  document.body.appendChild(messageDiv);

  setTimeout(() => {
    console.log("Aplicando efecto fade-out al mensaje temporal");
    messageDiv.classList.add("fade-out");
    messageDiv.addEventListener("transitionend", () => {
      console.log("Eliminando mensaje temporal del DOM");
      messageDiv.remove();
    });
  }, 3000);
}

function showNotification(message, type = 'info', options = {}) {
  const {
      timeout = 5000,
      showButtons = false,
      callbackYes,
      callbackNo
  } = options;

  const notificationContainer = document.getElementById('notificationContainer') || createNotificationContainer();

  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible fade show`;
  notification.role = 'alert';

  let buttonsHtml = '';
  if (showButtons) {
      buttonsHtml = `
          <div class="mt-2">
              <button type="button" class="btn btn-success btn-sm mr-2" id="notificationYesBtn">Sí</button>
              <button type="button" class="btn btn-danger btn-sm" id="notificationNoBtn">No</button>
          </div>
      `;
  }

  notification.innerHTML = `
      ${message}
      ${buttonsHtml}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  notificationContainer.appendChild(notification);

  if (showButtons) {
      document.getElementById('notificationYesBtn').addEventListener('click', () => {
          if (callbackYes) callbackYes();
          notification.remove();
      });
      document.getElementById('notificationNoBtn').addEventListener('click', () => {
          if (callbackNo) callbackNo();
          notification.remove();
      });
  } else {
      setTimeout(() => {
          notification.remove();
      }, timeout);
  }
}



//DIVIISAS
async function getOfficialExchangeRates() {
  try {
    // Fetching ARS rate (Dólar Oficial) from DolarAPI
    const dolarResponse = await fetch(
      "https://dolarapi.com/v1/dolares/oficial"
    );
    const dolarData = await dolarResponse.json();
    const officialUSDToARS = dolarData.venta; // USD to ARS official rate

    // Fetching EUR to ARS rate from DolarAPI
    const eurResponse = await fetch("https://dolarapi.com/v1/cotizaciones/eur");
    const eurData = await eurResponse.json();
    const eurToARS = eurData.venta; // EUR to ARS

    // Fetching BRL to ARS rate from DolarAPI
    const brlResponse = await fetch("https://dolarapi.com/v1/cotizaciones/brl");
    const brlData = await brlResponse.json();
    const brlToARS = brlData.venta; // BRL to ARS

    // Calculate USD to EUR and USD to BRL via ARS
    const usdToEUR = officialUSDToARS / eurToARS;
    const usdToBRL = officialUSDToARS / brlToARS;

    // Store all the rates in an object
    const rates = {
      USD: 1, // USD is the base currency
      ARS: officialUSDToARS, // USD to ARS rate
      EUR: usdToEUR, // Calculated USD to EUR rate
      BRL: usdToBRL, // Calculated USD to BRL rate
    };

    // Store the rates in localStorage for later use
    localStorage.setItem("exchangeRates", JSON.stringify(rates));
    return rates;
  } catch (error) {
    console.error("Error fetching exchange rates from DolarAPI:", error);
    return null;
  }
}

// Función para cambiar la divis
function changeCurrency(currency) {
  localStorage.setItem('selectedCurrency', currency);
  updateCurrencyDisplay();
  updatePrices();
  
  // Disparar un evento personalizado
  const event = new CustomEvent('currencyChanged', { detail: { currency: currency } });
  document.dispatchEvent(event);
}

// Función para actualizar la visualización de la divisa en el header
function updateCurrencyDisplay() {
  const selectedCurrency = localStorage.getItem("selectedCurrency") || "USD";
  const currencyButton = document.querySelector(".currency-btn");
  if (currencyButton) {
    currencyButton.textContent = selectedCurrency;
  }
}

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  await getOfficialExchangeRates();
  updateCurrencyDisplay();
  updatePrices();

  // Add event listeners for currency options
  const currencyOptions = document.querySelectorAll(".currency-option");
  currencyOptions.forEach((option) => {
    option.addEventListener("click", (e) => {
      e.preventDefault();
      const newCurrency = e.target.dataset.currency;
      changeCurrency(newCurrency);
    });
  });
});

// Exponer funciones globalmente para que puedan ser usadas en otros scripts
window.changeCurrency = changeCurrency;
window.updatePrices = updatePrices;

function scheduleRatesUpdate() {
  getOfficialExchangeRates();
  // Actualizar las tasas cada hora
  setInterval(getOfficialExchangeRates, 60 * 60 * 1000);
}

scheduleRatesUpdate();

export { getOfficialExchangeRates, scheduleRatesUpdate };

function createNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'notificationContainer';
  container.style.position = 'fixed';
  container.style.top = '20px';
  container.style.right = '20px';
  container.style.zIndex = '1000';
  document.body.appendChild(container);
  return container;
}

// Función para actualizar los precios en la página
function updatePrices() {
  const selectedCurrency = localStorage.getItem('selectedCurrency') || 'USD';
  const rates = JSON.parse(localStorage.getItem('exchangeRates'));

  if (!rates) return;

  // Actualiza solo los elementos que tienen el atributo data-price (generalmente fuera de la reserva)
  const priceElements = document.querySelectorAll('[data-price]');
  priceElements.forEach(element => {
    const usdPrice = parseFloat(element.dataset.price);
    const convertedPrice = usdPrice * rates[selectedCurrency];
    element.textContent = `${selectedCurrency} ${convertedPrice.toFixed(2)}`;
  });
}

// Llamar a updateCartCount cuando se carga la página
document.addEventListener("DOMContentLoaded", updateCartCount);
