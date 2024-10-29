let allTours = [];

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const { tours } = await import("./tours.js");
    allTours = tours;

    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get("id");

    if (tourId) {
      renderReservaForm(tourId);
      updateCostos(); // Llamar a updateCostos después de renderizar el formulario
    } else {
      renderErrorMessage(
        "No se proporcionó ID del tour. Por favor, selecciona un tour desde la página principal."
      );
    }
  } catch (error) {
    console.error("Error al cargar los tours:", error);
    renderErrorMessage(
      "Hubo un problema al cargar la información del tour. Por favor, intenta de nuevo más tarde."
    );
  }
});

function renderReservaForm(tourId) {
  const tour = allTours.find((t) => t.id === tourId);
  if (!tour) {
    renderErrorMessage(
      "Tour no encontrado. Por favor, selecciona un tour válido."
    );
    return;
  }

  const reservaContainer = document.getElementById("reserva-container");
  reservaContainer.innerHTML = `
        <div class="reserva-container">
  <div class="tour-card">
    <img src="${tour.imagenes[0]}" alt="${tour.name}" class="tour-image">
    <div class="tour-info">
      <h1 class="tour-name">${tour.name}</h1>
      <p class="tour-slogan">${tour.slogan}</p>
      <div class="tour-details">
        <div class="tour-detail">
          <i class="fas fa-map-marker-alt"></i>
          <span>${tour.lugar.charAt(0).toUpperCase()}${tour.lugar.slice(1)}</span>
        </div>
        <div class="tour-detail">
          <i class="fas fa-hiking"></i>
          <span>Tipo: ${tour.caracteristicas[0].tipo}</span>
        </div>
        <div class="tour-detail">
          <i class="fas fa-users"></i>
          <span>Mín: ${tour.caracteristicas[0].Minimo_de_pasajeros} - Máx: ${
    tour.caracteristicas[0].Maximo_de_pasajeros
  } pasajeros</span>
        </div>
        <div class="tour-detail">
          <i class="fas fa-sun"></i>
          <span>Temporada: ${tour.temporada ? "Invierno" : "Verano"}</span>
        </div>
      </div>
    </div>
  </div>

  <form id="reserva-form" class="reserva-form">
    <div class="form-group">
      <label for="fecha-inicio">Comienzo de su estadia:</label>
      <input type="date" id="fecha-inicio" name="fecha" required>
    </div>
    <div class="form-group">
      <label for="fecha-fin">Fin de su estadia:</label>
      <input type="date" id="fecha-fin" name="fecha" required>
    </div>
    <div class="form-group">
      <label for="fecha-tour">Fecha de la excursión:</label>
      <input type="date" id="fecha-tour" name="fecha" required>
    </div>
    <div class="form-group">
      <label for="participantes">Número de participantes:</label>
      <input type="number" id="participantes" name="participantes" min="1" max="${
        tour.caracteristicas[0].Maximo_de_pasajeros
      }" required>
    </div>
    <div id="edades-container" class="form-group">
      <!-- Age inputs will be dynamically added here -->
    </div>
    <div id="resumen-costos" class="resumen-costos">
      <p>Precio base por adulto: <span id="precio-base" data-price-usd="${
        tour.caracteristicas[0].Precio
      }">USD ${tour.caracteristicas[0].Precio}</span></p>
      <p>Precio base por menor: <span id="precio-menor" data-price-usd="${
        tour.caracteristicas[0].Precio_menor
      }">USD ${tour.caracteristicas[0].Precio_menor}</span></p>
      <p>Total: <span id="total">USD 0</span></p>
    </div>
    <button type="button" id="agregar-carrito" class="submit-btn" onclick="window.addToCart('${tour.id}', '${tour.name}', ${tour.caracteristicas[0].Precio}, ${tour.caracteristicas[0].Precio_menor}, ${tour.caracteristicas[0].Maximo_de_pasajeros})">Agregar al carrito</button>
  </form>
</div>
    `;

  setupReservaFormListeners(tour);
}

// <div class="form-group">
//                         <label for="asesoria-alojamiento">¿Desea asesoría de alojamientos?</label>
//                         <select id="asesoria-alojamiento" name="asesoria-alojamiento" required>
//                             <option value="si">Sí</option>
//                             <option value="no">No</option>
//                         </select>
//                     </div>

function setupReservaFormListeners(tour) {
  const form = document.getElementById("reserva-form");
  const participantesInput = document.getElementById("participantes");
  const edadesContainer = document.getElementById("edades-container");

  // Escuchar cambios en el número de participantes y recalcular los precios
  participantesInput.addEventListener("input", () => {
    updateParticipantesInputs(); // Actualiza inputs dinámicos
    updateCostos(); // Actualiza los costos cuando cambia el número de participantes
  });

  form.addEventListener("input", updateCostos); // Recalcula precios en cada input

  // Escuchar cambios en el número de participantes
  participantesInput.addEventListener("input", updateParticipantesInputs);
  form.addEventListener("input", updateCostos); // Asegurarnos de recalcular cuando algo cambie

  function updateParticipantesInputs() {
    const participantes = parseInt(participantesInput.value) || 0;
    const maxPasajeros = tour.caracteristicas[0].Maximo_de_pasajeros;
    edadesContainer.innerHTML = "";

    if (participantes > maxPasajeros) {
      participantesInput.value = maxPasajeros;
      showTemporaryMessage(
        `No se pueden agregar más de ${maxPasajeros} participantes.`,
        "warning"
      );
    }

    // Crear inputs de edades dinámicamente según el número de participantes
    for (let i = 0; i < Math.min(participantes, maxPasajeros); i++) {
      const edadInput = document.createElement("input");
      edadInput.type = "number";
      edadInput.name = `edad-${i}`;
      edadInput.id = `edad-${i}`;
      edadInput.min = "0";
      edadInput.required = true;
      edadInput.placeholder = `Edad del participante ${i + 1}`;
      edadInput.classList.add("edad-input");

      const label = document.createElement("label");
      label.htmlFor = `edad-${i}`;
      label.textContent = `Edad del participante ${i + 1}:`;

      const wrapper = document.createElement("div");
      wrapper.classList.add("edad-wrapper");
      wrapper.appendChild(label);
      wrapper.appendChild(edadInput);

      edadesContainer.appendChild(wrapper);
    }
  }
}

function updateCostos() {
  const selectedCurrency = localStorage.getItem("selectedCurrency") || "USD";
  const rates = JSON.parse(localStorage.getItem("exchangeRates"));

  if (!rates) {
    console.error("No se encontraron tasas de cambio");
    return;
  }

  const precioAdultoUSD = parseFloat(
    document.getElementById("precio-base").dataset.priceUsd
  );
  const precioMenorUSD = parseFloat(
    document.getElementById("precio-menor").dataset.priceUsd
  );

  const precioAdulto = precioAdultoUSD * rates[selectedCurrency];
  const precioMenor = precioMenorUSD * rates[selectedCurrency];

  // Actualizar los precios mostrados
  document.getElementById(
    "precio-base"
  ).textContent = `${selectedCurrency} ${precioAdulto.toFixed(2)}`;
  document.getElementById(
    "precio-menor"
  ).textContent = `${selectedCurrency} ${precioMenor.toFixed(2)}`;

  // Recalcular el total
  const participantes =
    parseInt(document.getElementById("participantes").value) || 0;
  let subtotal = 0;
  const edadesInputs = document.querySelectorAll(".edad-input");

  edadesInputs.forEach((input) => {
    const edad = parseInt(input.value) || 0;
    subtotal += edad < 18 ? precioMenor : precioAdulto;
  });

  document.getElementById(
    "total"
  ).textContent = `${selectedCurrency} ${subtotal.toFixed(2)}`;
}

function renderErrorMessage(message) {
  const reservaContainer = document.getElementById("reserva-container");
  reservaContainer.innerHTML = `
        <h1>Error</h1>
        <p>${message}</p>
        <a href="index.html">Volver a la página principal</a>
    `;
}

document.addEventListener("DOMContentLoaded", () => {
  updateCostos();
});

document.addEventListener("currencyChanged", (event) => {
  updateCostos();
});

// Escuchar cambios en la divisa
window.addEventListener("storage", (event) => {
  if (event.key === "selectedCurrency") {
    updateCostos();
  }
});