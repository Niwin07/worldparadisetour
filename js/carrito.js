// Global variables
let isEditing = false;
let originalCartData = [];
let tourDetails = {};

// Modificar la función loadTourDetails para usar el nuevo endpoint
async function loadTourDetails(tourId) {
  if (!tourId) {
    console.error("Tour ID is undefined");
    return null;
  }
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const response = await fetch(`http://localhost:3000/api/tours/${tourId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok)
      throw new Error(`Failed to fetch tour details for ID ${tourId}`);
    const data = await response.json();
    console.log("Tour details loaded:", data);
    return data;
  } catch (error) {
    console.error("Error loading tour details:", error);
    return null;
  }
}

// Modificar la función loadCarrito para cargar los detalles del tour
async function loadCarrito() {
  console.log("Cargando carrito...");

  const token = localStorage.getItem("token");
  if (!token) {
    showTemporaryMessage(
      "Por favor, inicia sesión para ver tu carrito.",
      "warning"
    );
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/carrito", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();

    console.log("Datos del carrito:", data);

    const carritoContainer = document.getElementById("carrito-container");
    const cartActions = document.getElementById("cart-actions");
    carritoContainer.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      carritoContainer.innerHTML = "<p>Tu carrito está vacío.</p>";
      cartActions.style.display = "none";
      return;
    }

    originalCartData = JSON.parse(JSON.stringify(data.items));
    cartActions.style.display = "block";

    for (const item of data.items) {
      console.log("Item del carrito:", item);
      if (!item.Tour_ID) {
        console.error("Tour ID is missing for item:", item);
        continue;
      }
      try {
        const tourDetail = await loadTourDetails(item.Tour_ID);
        console.log("Detalles del tour cargados:", tourDetail);
        tourDetails[item.Tour_ID] = tourDetail;
        renderCartItem(item, tourDetail);
      } catch (error) {
        console.error(
          `Error loading details for tour ID ${item.Tour_ID}:`,
          error
        );
        renderCartItem(item, null);
      }
    }

    // Actualizamos el total una sola vez después de cargar todos los items
    updateTotalAmount();
  } catch (error) {
    console.error("Error al cargar el carrito:", error);
    const carritoContainer = document.getElementById("carrito-container");
    carritoContainer.innerHTML =
      "<p>Hubo un error al cargar tu carrito. Por favor, intenta de nuevo más tarde.</p>";
  }
}

// Modificar la función renderCartItem para usar los detalles del tour y convertir los precios
function renderCartItem(item, tourDetail) {
  const carritoContainer = document.getElementById("carrito-container");
  const itemElement = document.createElement("div");
  itemElement.className = "cart-item";
  itemElement.dataset.itemId = item.ID;
  itemElement.dataset.tourId = item.Tour_ID;
  itemElement.dataset.subTotal = item.sub_total || "0";

  // Convert the adult and minor prices from USD to the selected currency
  const selectedCurrency = localStorage.getItem('selectedCurrency') || 'USD';
  const rates = JSON.parse(localStorage.getItem('exchangeRates'));
  
  const precioAdultoUSD = tourDetail ? Number(tourDetail.Precio_unitario) : 0;
  const precioMenorUSD = tourDetail ? Number(tourDetail.Precio_menores) : 0;
  
  // Convert the prices based on the selected currency
  const precioAdulto = precioAdultoUSD * rates[selectedCurrency];
  const precioMenor = precioMenorUSD * rates[selectedCurrency];
  
  const maxPasajeros = tourDetail ? tourDetail.Capacidad : item.Cantidad_personas;

  itemElement.dataset.maxPasajeros = maxPasajeros;
  itemElement.dataset.precioAdulto = precioAdulto;
  itemElement.dataset.precioMenor = precioMenor;

  let edades = item.Edad_Personas;
  if (typeof edades === "string") {
    try {
      edades = JSON.parse(edades);
    } catch (e) {
      console.error("Error parsing ages:", e);
      edades = [];
    }
  }

  itemElement.innerHTML = `
    <div class="item-details">
      <h3 class="item-name">${item.Nombre_tour || "Tour sin nombre"}</h3>
      <p class="item-price">Precio adulto: <span class="precio-adulto" data-price="${precioAdultoUSD.toFixed(2)}">${selectedCurrency} ${precioAdulto.toFixed(2)}</span></p>
      <p class="item-price">Precio menor: <span class="precio-menor" data-price="${precioMenorUSD.toFixed(2)}">${selectedCurrency} ${precioMenor.toFixed(2)}</span></p>
      <p class="item-subtotal">Subtotal: <span class="subtotal-value" data-price="${parseFloat(item.sub_total || "0").toFixed(2)}">${parseFloat(item.sub_total || "0").toFixed(2)}</span></p>
    </div>
    <div class="item-editable">
      <div class="item-dates">
        <label>Fecha del tour: <input type="date" class="tour-date" value="${formatDateForInput(item.Fecha_Tour)}" ${isEditing ? "" : "disabled"}></label>
        <label>Fecha de inicio: <input type="date" class="start-date" value="${formatDateForInput(item.Fecha_inicio)}" ${isEditing ? "" : "disabled"}></label>
        <label>Fecha de fin: <input type="date" class="end-date" value="${formatDateForInput(item.Fecha_fin)}" ${isEditing ? "" : "disabled"}></label>
      </div>
      <div class="item-quantity">
        <label>Cantidad de personas: <input type="number" class="quantity-input" value="${edades.length}" min="1" max="${maxPasajeros}" ${isEditing ? "" : "disabled"}></label>
      </div>
      <div class="item-ages">
        ${renderAgeInputs(edades, isEditing, maxPasajeros)}
      </div>
    </div>
    <div class="item-actions">
      <button class="remove-btn" onclick="eliminarItem(${item.ID})">
        <i class="fas fa-trash-alt"></i> Eliminar
      </button>
    </div>
  `;

  // Add listeners for changing quantity or ages
  const quantityInput = itemElement.querySelector(".quantity-input");
  quantityInput.addEventListener("change", () => {
    updateAgeInputs(itemElement, parseInt(quantityInput.value));
  });

  console.log(`Precios para tour ${item.Tour_ID}:`, {
    precioAdulto: precioAdulto,
    precioMenor: precioMenor,
    maxPasajeros: maxPasajeros
  });

  addAgeInputListeners(itemElement);

  carritoContainer.appendChild(itemElement);
}


// Modificar la función updateSubTotal para considerar la capacidad máxima
function updateSubTotal(itemElement) {
  const ageInputs = itemElement.querySelectorAll(".age-input");
  const precioAdulto = parseFloat(itemElement.dataset.precioAdulto) || 0;
  const precioMenor = parseFloat(itemElement.dataset.precioMenor) || 0;
  let subTotal = 0;

  ageInputs.forEach((input) => {
    const edad = parseInt(input.value);
    if (!isNaN(edad)) {
      subTotal += edad < 18 ? precioMenor : precioAdulto;
    }
  });

  console.log('Cálculo del subtotal:', {
    precioAdulto,
    precioMenor,
    edades: Array.from(ageInputs).map(input => parseInt(input.value)),
    subTotal
  });

  const selectedCurrency = localStorage.getItem('selectedCurrency') || 'USD';
  const rates = JSON.parse(localStorage.getItem('exchangeRates')) || { USD: 1 };
  const subTotalConverted = (subTotal * rates[selectedCurrency]).toFixed(2);

  const subTotalElement = itemElement.querySelector(".subtotal-value");
  if (subTotalElement) {
    subTotalElement.textContent = `${selectedCurrency} ${subTotalConverted}`;
    subTotalElement.dataset.price = subTotal.toFixed(2);
  }

  itemElement.dataset.subTotal = subTotal.toFixed(2);

  return subTotal;
}

function updateTotalAmount() {
  const cartItems = document.querySelectorAll(".cart-item");
  let totalUSD = 0;

  cartItems.forEach((item) => {
    const subTotalUSD = parseFloat(item.dataset.subTotal || "0");
    totalUSD += subTotalUSD;
    console.log('Subtotal del item:', subTotalUSD);
  });

  console.log('Total del carrito en USD:', totalUSD);

  const selectedCurrency = localStorage.getItem('selectedCurrency') || 'USD';
  const rates = JSON.parse(localStorage.getItem('exchangeRates')) || { USD: 1 };
  const totalConverted = (totalUSD * rates[selectedCurrency]).toFixed(2);

  const totalElement = document.getElementById("total-amount");
  if (totalElement) {
    totalElement.textContent = `${selectedCurrency} ${totalConverted}`;
    totalElement.dataset.price = totalUSD.toFixed(2);
  }
}

// Modificar la función updateAgeInputs
function updateAgeInputs(itemElement, newQuantity) {
  const agesContainer = itemElement.querySelector(".item-ages");
  const maxCapacity = parseInt(itemElement.dataset.maxPasajeros);
  const adjustedQuantity = Math.min(newQuantity, maxCapacity);

  let currentAges = Array.from(itemElement.querySelectorAll(".age-input"))
    .map((input) => parseInt(input.value) || 0);

  while (currentAges.length < adjustedQuantity) {
    currentAges.push(0);
  }

  agesContainer.innerHTML = renderAgeInputs(
    currentAges.slice(0, adjustedQuantity),
    isEditing,
    maxCapacity
  );

  addAgeInputListeners(itemElement);

  // Actualizar el subtotal después de cambiar las edades
  const newSubTotal = updateSubTotal(itemElement);
  console.log('Nuevo subtotal después de actualizar edades:', newSubTotal);

  // Actualizar el total del carrito
  updateTotalAmount();
}

// Asegurarse de que esta función esté presente y correcta
function renderAgeInputs(ages, isEditing, maxCapacity) {
  return ages
    .map(
      (age, index) => `
    <label>Edad persona ${index + 1}: 
      <input type="number" class="age-input" value="${age}" min="0" max="120" ${
        isEditing ? "" : "disabled"
      }>
    </label>
  `
    )
    .join("");
}

// Asegurarse de que esta función esté presente para agregar los event listeners
function addAgeInputListeners(itemElement) {
  const ageInputs = itemElement.querySelectorAll(".age-input");
  const quantityInput = itemElement.querySelector(".quantity-input");

  ageInputs.forEach(input => {
    input.removeEventListener("change", handleAgeChange);
    input.addEventListener("change", handleAgeChange);
  });

  if (quantityInput) {
    quantityInput.removeEventListener("change", handleQuantityChange);
    quantityInput.addEventListener("change", handleQuantityChange);
  }

  function handleAgeChange() {
    const newSubTotal = updateSubTotal(itemElement);
    console.log('Subtotal actualizado después de cambio de edad:', newSubTotal);
    updateTotalAmount();
  }

  function handleQuantityChange() {
    const newQuantity = parseInt(quantityInput.value);
    updateAgeInputs(itemElement, newQuantity);
  }
}

function precisionRound(number, precision) {
  const factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function formatDateForInput(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
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
    showTemporaryMessage("La cantidad de personas debe ser mayor que cero.", "warning");
    return false;
  }

  if (cantidad > maxPasajeros) {
    showTemporaryMessage(`No se pueden agregar más de ${maxPasajeros} personas para este tour.`, "warning");
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

function toggleEditMode() {
  isEditing = !isEditing;
  const editAllButton = document.getElementById("edit-all-btn");
  const discardButton = document.getElementById("discard-changes-btn");
  const saveButton = document.getElementById("save-changes-btn");
  const cartActions = document.getElementById("cart-actions");
  const inputs = document.querySelectorAll(".cart-item input");

  editAllButton.textContent = isEditing
    ? "Cancelar edición"
    : "Editar todos los tours";
  discardButton.style.display = isEditing ? "inline-block" : "none";
  saveButton.style.display = isEditing ? "inline-block" : "none";

  cartActions.style.display = "block"; // Asegúrate de que los botones sean visibles.

  inputs.forEach((input) => {
    input.disabled = !isEditing;
  });
}

document.getElementById("edit-all-btn").addEventListener("click", toggleEditMode);

function discardChanges() {
  const carritoContainer = document.getElementById("carrito-container");
  originalCartData.forEach((item) => {
    const itemElement = carritoContainer.querySelector(
      `.cart-item[data-item-id='${item.ID}']`
    );
    if (itemElement) {
      itemElement.querySelector(".tour-date").value = formatDateForInput(
        item.Fecha_Tour
      );
      itemElement.querySelector(".start-date").value = formatDateForInput(
        item.Fecha_inicio
      );
      itemElement.querySelector(".end-date").value = formatDateForInput(
        item.Fecha_fin
      );
      itemElement.querySelector(".quantity-input").value =
        item.Cantidad_personas;
      updateAgeInputs(itemElement, item.Cantidad_personas);
      const ageInputs = itemElement.querySelectorAll(".age-input");
      item.Edad_Personas.forEach((age, index) => {
        if (ageInputs[index]) {
          ageInputs[index].value = age;
        }
      });
      updateSubTotal(itemElement, tourDetails[item.Tour_ID]);
    }
  });
  showTemporaryMessage("Los cambios fueron descartados", "warning");
  toggleEditMode();
}

// Modificar la función saveChanges para manejar correctamente las ediciones
async function saveChanges() {
  const cartItems = document.querySelectorAll(".cart-item");
  const updatedItems = [];

  for (const item of cartItems) {
    const itemId = item.dataset.itemId;
    const tourId = item.dataset.tourId;
    const fechaTour = item.querySelector(".tour-date").value;
    const fechaInicio = item.querySelector(".start-date").value;
    const fechaFin = item.querySelector(".end-date").value;
    const edades = Array.from(item.querySelectorAll(".age-input"))
      .map((input) => parseInt(input.value))
      .filter((age) => !isNaN(age));
    const subTotalUSD = updateSubTotal(item);

    if (!validateDates(fechaTour, fechaInicio, fechaFin)) return;
    if (!validateQuantity(edades.length, parseInt(item.dataset.maxPasajeros)))
      return;
    if (!validateAges(edades, edades.length)) return;

    updatedItems.push({
      itemId,
      tourId,
      cantidad: edades.length,
      fechaTour,
      fechaInicio,
      fechaFin,
      edades,
      subTotal: subTotalUSD,
    });
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showTemporaryMessage(
        "Por favor, inicia sesión para guardar los cambios.",
        "warning"
      );
      return;
    }

    for (const item of updatedItems) {
      const response = await fetch(
        `http://localhost:3000/api/carrito/editar/${item.itemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cantidad: item.cantidad,
            fechaTour: item.fechaTour,
            fechaInicio: item.fechaInicio,
            fechaFin: item.fechaFin,
            edades: item.edades,
            subTotal: item.subTotal,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Error al actualizar el item");
      }
    }

    showTemporaryMessage(
      "Todos los cambios se guardaron correctamente",
      "success"
    );
    toggleEditMode();
    await loadCarrito();
  } catch (error) {
    console.error("Error al guardar los cambios:", error);
    showTemporaryMessage(
      `Error al guardar los cambios: ${error.message}`,
      "error"
    );
  }
}

// Agregar un evento listener para el cambio de divisa
document.addEventListener('currencyChanged', () => {
  updateTotalAmount();
});

function changesDetected(updatedItems) {
  return JSON.stringify(originalCartData) !== JSON.stringify(updatedItems);
}

function showTemporaryMessage(message, type) {
  const messageDiv = document.createElement("div");
  messageDiv.textContent = message;
  messageDiv.className = `temporary-message ${type}`;
  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.classList.add("fade-out");
    messageDiv.addEventListener("transitionend", () => {
      messageDiv.remove();
    });
  }, 3000);
}

async function eliminarItem(itemId) {
  const token = localStorage.getItem("token");
  if (!token) {
    showTemporaryMessage(
      "Por favor, inicia sesión para eliminar items.",
      "warning"
    );
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/api/carrito/eliminar/${itemId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    if (data.success) {
      await loadCarrito();
      showTemporaryMessage("Item eliminado con éxito", "success");
    } else {
      throw new Error(data.message || "Error al eliminar el item");
    }
  } catch (error) {
    console.error("Error al eliminar el item:", error);
    showTemporaryMessage(
      `Error al eliminar el item: ${error.message}`,
      "error"
    );
  }
}

// Modificar la función crearSolicitud para adaptarse a los nuevos cambios

async function crearSolicitud() {
  const token = localStorage.getItem("token");
  if (!token) {
    showTemporaryMessage(
      "Por favor, inicia sesión para crear una solicitud.",
      "warning"
    );
    return;
  }

  const cartItems = document.querySelectorAll(".cart-item");
  const asesoriaAlojamiento = document.querySelector("#asesoria-alojamiento").value;
  const selectedCurrency = localStorage.getItem('selectedCurrency') || 'USD';
  const rates = JSON.parse(localStorage.getItem('exchangeRates')) || { USD: 1 };
  
  if (cartItems.length === 0) {
    showTemporaryMessage("Tu carrito está vacío.", "warning");
    return;
  }

  const solicitudesData = [];

  for (const item of cartItems) {
    const tourId = item.dataset.tourId;
    const fechaTour = item.querySelector(".tour-date").value;
    const fechaInicio = item.querySelector(".start-date").value;
    const fechaFin = item.querySelector(".end-date").value;
    const edades = Array.from(item.querySelectorAll(".age-input"))
      .map((input) => parseInt(input.value))
      .filter((age) => !isNaN(age));
    const maxPasajeros = parseInt(item.dataset.maxPasajeros);
    
    // Convertir el subTotal a la divisa seleccionada
    const subTotalUSD = parseFloat(item.dataset.subTotal);
    const subTotalConverted = (subTotalUSD * rates[selectedCurrency]).toFixed(2);

    if (!fechaTour || !fechaInicio || !fechaFin || edades.length === 0) {
      showTemporaryMessage(
        "Por favor, completa todos los campos para cada tour.",
        "warning"
      );
      return;
    }

    if (!validateDates(fechaTour, fechaInicio, fechaFin)) return;
    if (!validateAges(edades, edades.length)) return;
    if (edades.length > maxPasajeros) {
      showTemporaryMessage(
        `No se pueden agregar más de ${maxPasajeros} personas para este tour.`,
        "warning"
      );
      return;
    }

    solicitudesData.push({
      tourId,
      fechaTour,
      fechaInicio,
      fechaFin,
      edades,
      cantidadPersonas: edades.length,
      subTotal: subTotalConverted,
    });
  }

  try {
    const response = await fetch("http://localhost:3000/api/solicitud/crear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        solicitudes: solicitudesData,
        asesoriaAlojamiento,
        divisa: selectedCurrency
      }),
    });

    const result = await response.json();
    if (result.success) {
      showTemporaryMessage("Solicitud enviada con éxito", "success");
      setTimeout(() => {
        window.location.href = "/solicitudes.html";
      }, 3000);
    } else {
      throw new Error(result.message || "Error al enviar la solicitud");
    }
  } catch (error) {
    console.error("Error al crear la solicitud:", error);
    showTemporaryMessage(
      `Error al enviar la solicitud: ${error.message}`,
      "error"
    );
  }
}


document.addEventListener("DOMContentLoaded", () => {
  loadCarrito();
  document
    .getElementById("edit-all-btn")
    .addEventListener("click", toggleEditMode);
  document
    .getElementById("discard-changes-btn")
    .addEventListener("click", discardChanges);
  document
    .getElementById("save-changes-btn")
    .addEventListener("click", saveChanges);
  document
    .getElementById("create-solicitud-btn")
    .addEventListener("click", crearSolicitud);
  window.updatePrices();
});
