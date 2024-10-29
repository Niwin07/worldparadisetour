// Función para mostrar notificaciones
// Función para verificar si el usuario es administrador y redirigir si no lo es
function isAdmin() {
  const token = localStorage.getItem('token');
  if (!token) {
      redirectToAccess();
      return false;
  }
  
  try {
      // Decodificar el token JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log("Token payload:", payload); // Para depuración
      if (payload.userRole !== 'admin') { // Cambiado de payload.role a payload.userRole
          redirectToAccess();
          return false;
      }
      return true;
  } catch (e) {
      console.error('Error al decodificar el token:', e);
      redirectToAccess();
      return false;
  }
}

// Función para redirigir a la página de acceso
function redirectToAccess() {
  console.log("Redirigiendo a la página de acceso"); // Para depuración
  window.location.href = 'acceso.html';
}

// Función auxiliar para decodificar y mostrar el contenido del token (para depuración)
function decodeToken() {
  const token = localStorage.getItem('token');
  if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log("Token decodificado:", payload);
  } else {
      console.log("No se encontró token en localStorage");
  }
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

// Función para cargar las tasas de cambio
async function loadExchangeRates() {
  try {
    const rates = await getOfficialExchangeRates();
    if (rates) {
      localStorage.setItem('exchangeRates', JSON.stringify(rates));
    } else {
      throw new Error('No se pudieron obtener las tasas de cambio');
    }
  } catch (error) {
    console.error('Error al cargar las tasas de cambio:', error);
  }
}


// Función para crear el contenedor de notificaciones si no existe
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

// Función para cargar usuarios
function loadUsers() {
  if (!isAdmin()) return;
  fetch('http://localhost:3000/users', {
      headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
  })
  .then(response => response.json())
  .then(users => {
      const usersTable = document.getElementById('usersTableBody');
      usersTable.innerHTML = '';
      users.forEach(user => {
          const row = `
              <tr>
                  <td>${user.cliente_id}</td>
                  <td>${user.Nombres} ${user.Apellidos}</td>
                  <td>${user.Email}</td>
                  <td>
                      <button class="btn btn-warning btn-sm" onclick="editUser(${user.cliente_id})">Editar</button>
                      <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.cliente_id})">Eliminar</button>
                  </td>
              </tr>
          `;
          usersTable.innerHTML += row;
      });
  })
  .catch(error => {
      console.error('Error al cargar usuarios:', error);
      showNotification('Error al cargar usuarios. Por favor, intente de nuevo.', 'danger');
  });
}

// Función para cargar solicitudes
function loadRequests() {
  fetch('http://localhost:3000/reservations', {
      headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
  })
  .then(response => response.json())
  .then(requests => {
      const requestsTable = document.getElementById('requestsTableBody');
      requestsTable.innerHTML = '';
      requests.forEach(request => {
          const row = `
              <tr id="request-${request.ID}" class="${request.Estado === 'Confirmado' ? 'tachado' : ''}">
                  <td>${request.ID}</td>
                  <td><a href="#" onclick="viewClientDetails(${request.Cliente_ID})">${request.Email}</a></td>
                  <td>${new Date(request.Fecha_solicitud).toLocaleDateString()}</td>
                  <td>${request.Estado}</td>
                  <td>
                      <button class="btn btn-info btn-sm" onclick="viewRequestDetails(${request.ID})">Ver Detalle</button>
                      <button class="btn btn-warning btn-sm" onclick="editRequest(${request.ID})">Editar</button>
                      <button class="btn btn-danger btn-sm" onclick="deleteRequest(${request.ID})">Eliminar</button>
                      <button class="btn btn-success btn-sm confirm-btn" onclick="confirmRequest(${request.ID})">
                          ${request.Estado === 'Confirmado' ? 'Revertir' : 'Confirmar'}
                      </button>
                  </td>
              </tr>
          `;
          requestsTable.innerHTML += row;
      });
  })
  .catch(error => {
      console.error('Error al cargar solicitudes:', error);
      showNotification('Error al cargar solicitudes. Por favor, intente de nuevo.', 'danger');
  });
}

// Función para ver detalles de un usuario
function viewClientDetails(clientId) {
  fetch(`http://localhost:3000/clients/${clientId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((response) => response.json())
    .then((client) => {
      const detailsHtml = `
            <h3>Detalles del Cliente</h3>
            <p><strong>Nombre:</strong> ${client.Nombres} ${
        client.Apellidos
      }</p>
            <p><strong>Email:</strong> ${client.Email}</p>
            <p><strong>Teléfono:</strong> ${client.Num_telefono}</p>
            <p><strong>Fecha de Nacimiento:</strong> ${new Date(
              client.Fecha_nacimiento
            ).toLocaleDateString()}</p>
            <p><strong>Sexo:</strong> ${client.Sexo}</p>
            <p><strong>País:</strong> ${client.Pais}</p>
        `;
      const clientDetailsContainer =
        document.getElementById("requestDetailsBody");
      clientDetailsContainer.innerHTML = detailsHtml;
      const modal = new bootstrap.Modal(
        document.getElementById("requestDetailsModal")
      );
      modal.show();
    })
    .catch((error) =>
      console.error("Error al obtener detalles del cliente:", error)
    );
}

//ver deetall de una solicitud
function viewRequestDetails(requestId) {
  fetch(`http://localhost:3000/reservations/${requestId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }
      return response.json();
    })
    .then((details) => {
      details.tours = details.tours.map(tour => {
        if (typeof tour.Edad_Personas === 'string') {
          try {
            tour.Edad_Personas = JSON.parse(tour.Edad_Personas);
          } catch (e) {
            console.warn(`Error al analizar Edad_Personas para el tour ${tour.Tour_ID}:`, e);
            tour.Edad_Personas = [];
          }
        }
        if (!Array.isArray(tour.Edad_Personas)) {
          tour.Edad_Personas = [];
        }
        return tour;
      });

      const detailsHtml = `
        <h3>Detalles de la Solicitud</h3>
        <p><strong>ID de Solicitud:</strong> ${details.ID}</p>
        <p><strong>Cliente:</strong> ${details.Nombres} ${details.Apellidos}</p>
        <p><strong>Email:</strong> ${details.Email}</p>
        <p><strong>Fecha de Solicitud:</strong> ${new Date(details.Fecha_solicitud).toLocaleDateString()}</p>
        <p><strong>Estado:</strong> ${details.Estado}</p>
        <p><strong>¿Desea alojamiento?:</strong> ${details.Alojamiento}</p>
        <p><strong>Total:</strong> ${details.divisa} ${details.Total}</p>
        <p><strong>Divisa:</strong> ${details.divisa}</p>
        <h4>Detalles de los Tours:</h4>
        <ul>
          ${details.tours
            .map(
              (tour) => `
            <li>
              <strong>Tour:</strong> ${tour.Nombre_tour}
              <br><strong>Cantidad de Personas:</strong> ${tour.Cantidad_personas}
              <br><strong>Edades de las Personas:</strong> ${tour.Edad_Personas.join(', ')}
              <br><strong>Fecha de Inicio:</strong> ${new Date(tour.Fecha_inicio).toLocaleDateString()}
              <br><strong>Fecha de Fin:</strong> ${new Date(tour.Fecha_fin).toLocaleDateString()}
              <br><strong>Fecha deseada para realizar el tour:</strong> ${new Date(tour.Fecha_Tour).toLocaleDateString()}
              <br><strong>Sub-Total:</strong> ${details.divisa} ${tour.Sub_total}
            </li>
          `
            )
            .join("")}
        </ul>
      `;
      const requestDetailsContainer = document.getElementById("requestDetailsBody");
      requestDetailsContainer.innerHTML = detailsHtml;
      const modal = new bootstrap.Modal(document.getElementById("requestDetailsModal"));
      modal.show();
    })
    .catch((error) => {
      console.error("Error al obtener detalles de la solicitud:", error);
      alert("Error al cargar los detalles de la solicitud. Por favor, intente de nuevo.");
    });
}

// Función para editar un usuario
function editUser(userId) {
  // Asegúrate de que la URL de la API sea correcta
  fetch(`http://localhost:3000/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Usuario no encontrado o error en el servidor");
      }
      return response.json();
    })
    .then((user) => {
      const formHtml = `
            <div class="mb-3">
                <label for="editUserName" class="form-label">Nombre</label>
                <input type="text" class="form-control" id="editUserName" value="${
                  user.Nombres
                }">
            </div>
            <div class="mb-3">
                <label for="editUserLastName" class="form-label">Apellidos</label>
                <input type="text" class="form-control" id="editUserLastName" value="${
                  user.Apellidos
                }">
            </div>
            <div class="mb-3">
                <label for="editUserEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="editUserEmail" value="${
                  user.Email
                }">
            </div>
            <div class="mb-3">
                <label for="editUserSex" class="form-label">Sexo</label>
                <select class="form-control" id="editUserSex">
                    <option value="Masculino" ${
                      user.Sexo === "Masculino" ? "selected" : ""
                    }>Masculino</option>
                    <option value="Femenino" ${
                      user.Sexo === "Femenino" ? "selected" : ""
                    }>Femenino</option>
                    <option value="Otro" ${
                      user.Sexo === "Otro" ? "selected" : ""
                    }>Otro</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="editUserBirthdate" class="form-label">Fecha de Nacimiento</label>
                <input type="date" class="form-control" id="editUserBirthdate" value="${
                  user.Fecha_nacimiento
                    ? user.Fecha_nacimiento.split("T")[0]
                    : ""
                }">
            </div>
            <div class="mb-3">
                <label for="editUserPhone" class="form-label">Número de Teléfono</label>
                <input type="text" class="form-control" id="editUserPhone" value="${
                  user.Num_telefono
                }">
            </div>
            <div class="mb-3">
                <label for="editUserCountry" class="form-label">País</label>
                <input type="text" class="form-control" id="editUserCountry" value="${
                  user.Pais
                }">
            </div>
            <div class="mb-3">
                <label for="editUserPassword" class="form-label">Nueva Contraseña (dejar en blanco para no cambiar)</label>
                <input type="password" class="form-control" id="editUserPassword">
            </div>
            <button type="button" class="btn btn-primary" onclick="saveUser(${userId})">Guardar Cambios</button>
        `;
      document.getElementById("editUserForm").innerHTML = formHtml;
      const modal = new bootstrap.Modal(
        document.getElementById("editUserModal")
      );
      modal.show();
    })
    .catch((error) =>
      console.error("Error al cargar detalles del usuario:", error)
    );
}

// Función para guardar cambios del usuario
function saveUser(userId) {
  if (!isAdmin()) return;
  const name = document.getElementById("editUserName").value;
  const lastName = document.getElementById("editUserLastName").value;
  const email = document.getElementById("editUserEmail").value;
  const sex = document.getElementById("editUserSex").value;
  const birthdate = document.getElementById("editUserBirthdate").value;
  const phone = document.getElementById("editUserPhone").value;
  const country = document.getElementById("editUserCountry").value;
  const password = document.getElementById("editUserPassword").value;

  const data = {
    Nombres: name,
    Apellidos: lastName,
    Email: email,
    Sexo: sex,
    Fecha_nacimiento: birthdate,
    Num_telefono: phone,
    Pais: country,
  };
  if (password) {
    data.password = password;
  }

  fetch(`http://localhost:3000/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      showNotification("Usuario actualizado exitosamente", "success");
      loadUsers();
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editUserModal")
      );
      modal.hide();
    })
    .catch((error) => {
      console.error("Error al actualizar usuario:", error);
      showNotification("Error al actualizar usuario", "danger");
    });
}

// Función para eliminar un usuario
function deleteUser(userId) {
  if (!isAdmin()) return;
  showNotification(
      "¿Estás seguro de que deseas eliminar este usuario?",
      "warning",
      {
          showButtons: true,
          callbackYes: () => {
              fetch(`http://localhost:3000/users/${userId}`, {
                  method: "DELETE",
                  headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
              })
              .then((response) => response.json())
              .then((data) => {
                  showNotification("Usuario eliminado exitosamente", "success");
                  loadUsers();
              })
              .catch((error) => {
                  console.error("Error al eliminar usuario:", error);
                  showNotification("Error al eliminar usuario", "danger");
              });
          },
          callbackNo: () => {
              console.log("No se eliminó el usuario");
          },
      }
  );
}

// Función para editar una solicitud
async function editRequest(requestId) {
  if (!isAdmin()) return;
  try {
    const response = await fetch(`http://localhost:3000/reservations/${requestId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const details = await response.json();

    let formHtml = `
      <h3>Editar Solicitud</h3>
      <div class="mb-3">
        <label for="editRequestStatus" class="form-label">Estado</label>
        <select class="form-control" id="editRequestStatus">
          <option value="Pendiente" ${details.Estado === "Pendiente" ? "selected" : ""}>Pendiente</option>
          <option value="Confirmada" ${details.Estado === "Confirmada" ? "selected" : ""}>Confirmada</option>
          <option value="Cancelada" ${details.Estado === "Cancelada" ? "selected" : ""}>Cancelada</option>
        </select>
      </div>
      <div class="mb-3">
        <label for="editRequestCurrency" class="form-label">Divisa</label>
        <select class="form-control" id="editRequestCurrency" onchange="updateCurrency(${requestId})">
          <option value="USD" ${details.divisa === "USD" ? "selected" : ""}>USD</option>
          <option value="ARS" ${details.divisa === "ARS" ? "selected" : ""}>ARS</option>
          <option value="BRL" ${details.divisa === "BRL" ? "selected" : ""}>BRL</option>
          <option value="EUR" ${details.divisa === "EUR" ? "selected" : ""}>EUR</option>
        </select>
      </div>
      <div id="totalPriceGeneral">Total General: <span id="totalGeneralValue">${details.divisa} ${details.Total}</span></div>
    `;

    details.tours.forEach((tour, index) => {
      let edadesPersonas = Array.isArray(tour.Edad_Personas) ? tour.Edad_Personas : JSON.parse(tour.Edad_Personas);

      formHtml += `
        <h4>Tour ${index + 1}: ${tour.Nombre_tour}</h4>
        <div class="mb-3">
          <label for="editRequestPersons${index}" class="form-label">Cantidad de Personas</label>
          <input type="number" class="form-control" id="editRequestPersons${index}" 
                 value="${tour.Cantidad_personas}" min="1" max="${tour.Capacidad}"
                 data-tour-id="${tour.Tour_ID}"
                 onchange="updatePersonInputs(${index}, '${tour.Tour_ID}')">
        </div>
        <div id="personAgesContainer${index}">
          ${generatePersonInputs(edadesPersonas, index, tour.Tour_ID)}
        </div>
        <div class="mb-3">
          <label for="editRequestStartDate${index}" class="form-label">Fecha de Inicio</label>
          <input type="date" class="form-control" id="editRequestStartDate${index}" value="${tour.Fecha_inicio.split("T")[0]}" onchange="validateDates(${index})">
        </div>
        <div class="mb-3">
          <label for="editRequestEndDate${index}" class="form-label">Fecha de Fin</label>
          <input type="date" class="form-control" id="editRequestEndDate${index}" value="${tour.Fecha_fin.split("T")[0]}" onchange="validateDates(${index})">
        </div>
        <div class="mb-3">
          <label for="editRequestTourDate${index}" class="form-label">Fecha del Tour</label>
          <input type="date" class="form-control" id="editRequestTourDate${index}" value="${tour.Fecha_Tour.split("T")[0]}" onchange="validateDates(${index})">
        </div>
        <div id="totalPriceContainer${index}">Subtotal: <span id="subTotalValue${index}">${details.divisa} ${tour.Sub_total}</span></div>
      `;
    });

    formHtml += `<button type="button" class="btn btn-primary" onclick="saveRequest(${requestId}, ${details.tours.length})">Guardar Cambios</button>`;

    document.getElementById("requestDetailsBody").innerHTML = formHtml;
    const modal = new bootstrap.Modal(document.getElementById("requestDetailsModal"));
    modal.show();

    // Inicializar los precios
    details.tours.forEach((tour, index) => {
      calculatePrice(index, tour.Tour_ID);
    });
  } catch (error) {
    console.error("Error al cargar detalles de la solicitud:", error);
    showNotification("Error al cargar detalles de la solicitud", "danger");
  }
}

// Función para actualizar la interfaz de usuario con la nueva divisa
async function updateCurrency(requestId) {
  const newCurrency = document.getElementById('editRequestCurrency').value;
  const tourCount = document.querySelectorAll('[id^="editRequestPersons"]').length;

  try {
    const rates = JSON.parse(localStorage.getItem('exchangeRates'));
    if (!rates) {
      throw new Error('Tasas de cambio no disponibles');
    }

    for (let i = 0; i < tourCount; i++) {
      const tourId = document.getElementById(`editRequestPersons${i}`).getAttribute('data-tour-id');
      await calculatePrice(i, tourId);
    }
    updateTotalPrice();
  } catch (error) {
    console.error('Error al actualizar la divisa:', error);
    showNotification('Error al actualizar la divisa', 'danger');
  }
}



// Función para generar los inputs de edades
function generatePersonInputs(edades, tourIndex, tourId) {
  let html = "";
  for (let i = 0; i < edades.length; i++) {
    html += `
      <div class="mb-2">
        <label for="personAge${tourIndex}_${i}" class="form-label">Persona ${i + 1}, Edad:</label>
        <input type="number" class="form-control person-age" id="personAge${tourIndex}_${i}" 
               value="${edades[i]}" min="0" max="120" 
               data-tour-id="${tourId}"
               onchange="calculatePrice(${tourIndex}, '${tourId}')">
      </div>
    `;
  }
  return html;
}

// Función para actualizar los inputs de personas cuando se cambia la cantidad
async function updatePersonInputs(tourIndex, tourId) {
  try {
    if (!tourId || tourId === 'undefined') {
      throw new Error('ID del tour no válido');
    }

    const tourDetails = await getTourDetails(tourId);
    const personCount = parseInt(document.getElementById(`editRequestPersons${tourIndex}`).value);

    // Verificar capacidad máxima del tour
    if (personCount > tourDetails.Capacidad) {
      showNotification(`La cantidad máxima de personas para este tour es ${tourDetails.Capacidad}`, 'warning');
      document.getElementById(`editRequestPersons${tourIndex}`).value = tourDetails.Capacidad;
      return;
    }

    const container = document.getElementById(`personAgesContainer${tourIndex}`);
    container.innerHTML = generatePersonInputs(Array(personCount).fill(""), tourIndex);

    // Actualizar el precio en tiempo real
    await calculatePrice(tourIndex, tourId);
  } catch (error) {
    console.error('Error al actualizar inputs de personas:', error);
    showNotification('Error al actualizar la cantidad de personas', 'danger');
  }
}

// Modificar la función calculatePrice
async function calculatePrice(tourIndex, tourId) {
  try {
    const tourDetails = await getTourDetails(tourId);
    const agesInputs = document.querySelectorAll(`#personAgesContainer${tourIndex} .person-age`);
    const ages = Array.from(agesInputs).map(input => parseInt(input.value) || 0);
    const currentCurrency = document.getElementById('editRequestCurrency').value;
    
    let subTotal = 0;
    ages.forEach(age => {
      if (age < 18) {
        subTotal += parseFloat(tourDetails.Precio_menores);
      } else {
        subTotal += parseFloat(tourDetails.Precio_unitario);
      }
    });

    // Convertir el subtotal a la moneda seleccionada
    const rates = JSON.parse(localStorage.getItem('exchangeRates'));
    if (rates && currentCurrency !== 'USD') {
      subTotal = subTotal * rates[currentCurrency];
    }

    subTotal = parseFloat(subTotal.toFixed(2));
    
    const subTotalElement = document.getElementById(`subTotalValue${tourIndex}`);
    if (subTotalElement) {
      subTotalElement.textContent = `${currentCurrency} ${subTotal.toFixed(2)}`;
    } else {
      console.error(`Elemento con id subTotalValue${tourIndex} no encontrado`);
    }
    
    updateTotalPrice();
  } catch (error) {
    console.error('Error al calcular el precio:', error);
    showNotification('Error al calcular el precio', 'danger');
  }
}


function updateTotalPrice() {
  const subTotals = document.querySelectorAll('[id^="subTotalValue"]');
  const total = Array.from(subTotals).reduce((sum, el) => {
    const [currency, value] = el.textContent.split(' ');
    const subTotal = parseFloat(value);
    return sum + (isNaN(subTotal) ? 0 : subTotal);
  }, 0);
  
  const currentCurrency = document.getElementById('editRequestCurrency').value;
  const totalGeneralElement = document.getElementById('totalGeneralValue');
  if (totalGeneralElement) {
    totalGeneralElement.textContent = `${currentCurrency} ${total.toFixed(2)}`;
  } else {
    console.error('Elemento con id totalGeneralValue no encontrado');
  }
}



// Función para validar las fechas
function validateDates(tourIndex) {
  const startDate = new Date(document.getElementById(`editRequestStartDate${tourIndex}`).value);
  const endDate = new Date(document.getElementById(`editRequestEndDate${tourIndex}`).value);
  const tourDate = new Date(document.getElementById(`editRequestTourDate${tourIndex}`).value);

  if (tourDate < startDate || tourDate > endDate) {
    alert("La fecha del tour debe estar dentro del rango de fechas de estadía.");
    document.getElementById(`editRequestTourDate${tourIndex}`).value = "";
  }
}


// Modificar la función saveRequest
async function saveRequest(requestId, tourCount) {
  const status = document.getElementById('editRequestStatus').value;
  const newCurrency = document.getElementById('editRequestCurrency').value;
  const tours = [];
  let totalGeneral = 0;

  const rates = JSON.parse(localStorage.getItem('exchangeRates'));
  if (!rates) {
    showNotification('Tasas de cambio no disponibles', 'danger');
    return;
  }

  for (let i = 0; i < tourCount; i++) {
    const tourId = document.getElementById(`editRequestPersons${i}`).getAttribute('data-tour-id');
    const persons = parseInt(document.getElementById(`editRequestPersons${i}`).value);
    const agesInputs = document.querySelectorAll(`#personAgesContainer${i} .person-age`);
    const ages = Array.from(agesInputs).map(input => parseInt(input.value) || 0);
    const startDate = document.getElementById(`editRequestStartDate${i}`).value;
    const endDate = document.getElementById(`editRequestEndDate${i}`).value;
    const tourDate = document.getElementById(`editRequestTourDate${i}`).value;
    const subTotalElement = document.getElementById(`subTotalValue${i}`);
    const subTotal = parseFloat(subTotalElement.textContent.split(' ')[1]);

    totalGeneral += subTotal;

    tours.push({
      Tour_ID: tourId,
      Cantidad_personas: persons,
      Edad_Personas: JSON.stringify(ages),
      Fecha_inicio: startDate,
      Fecha_fin: endDate,
      Fecha_Tour: tourDate,
      Sub_total: subTotal
    });
  }

  totalGeneral = parseFloat(totalGeneral.toFixed(2));

  const data = {
    Estado: status,
    tours: tours,
    Total: totalGeneral,
    divisa: newCurrency
  };

  try {
    const response = await fetch(`http://localhost:3000/reservations/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    showNotification('Solicitud actualizada exitosamente', 'success');
    loadRequests();
    const modal = bootstrap.Modal.getInstance(document.getElementById('requestDetailsModal'));
    modal.hide();
  } catch (error) {
    console.error('Error al actualizar la solicitud:', error);
    showNotification(`Error al actualizar la solicitud: ${error.message}`, 'danger');
  }
}

// Modificar el evento DOMContentLoaded para cargar las tasas de cambio
document.addEventListener("DOMContentLoaded", async function () {
  await loadExchangeRates(); // Cargar las tasas de cambio al inicio
  loadUsers();
  loadRequests();
});

// Función auxiliar para convertir divisas
async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        from: fromCurrency,
        to: toCurrency,
        amount: amount
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.convertedAmount;
  } catch (error) {
    console.error('Error al convertir la divisa:', error);
    throw error;
  }
}



// Actualizar esta función en el evento onchange del select de divisa
function onCurrencyChange() {
  const newCurrency = document.getElementById('editRequestCurrency').value;
  updateCurrencyUI(newCurrency);
  // Recalcular y mostrar los nuevos totales
  calculateTotals();
}

// Función para calcular y mostrar los nuevos totales
async function calculateTotals() {
  const newCurrency = document.getElementById('editRequestCurrency').value;
  let totalGeneral = 0;

  for (let i = 0; i < tourCount; i++) {
    const subTotalElement = document.getElementById(`subTotalValue${i}`);
    const currentSubTotal = parseFloat(subTotalElement.textContent.split(' ')[1]);
    const currentCurrency = subTotalElement.textContent.split(' ')[0];

    if (currentCurrency !== newCurrency) {
      const convertedSubTotal = await convertCurrency(currentSubTotal, currentCurrency, newCurrency);
      subTotalElement.textContent = `${newCurrency} ${convertedSubTotal.toFixed(2)}`;
      totalGeneral += convertedSubTotal;
    } else {
      totalGeneral += currentSubTotal;
    }
  }

  const totalGeneralElement = document.getElementById('totalGeneralValue');
  totalGeneralElement.textContent = `${newCurrency} ${totalGeneral.toFixed(2)}`;
}

// Función para obtener detalles de un tour específico
async function getTourDetails(tourId) {
  if (!tourId || tourId === 'undefined') {
    console.error('ID del tour no válido:', tourId);
    throw new Error('ID del tour no válido');
  }

  try {
    const response = await fetch(`http://localhost:3000/api/tours/${tourId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const tour = await response.json();
    return tour;
  } catch (error) {
    console.error('Error al obtener detalles del tour:', error);
    throw error;
  }
}

  // Función para eliminar una solicitud
  function deleteRequest(requestId) {
    if (!isAdmin()) return;
    showNotification(
        "¿Estás seguro de que deseas eliminar esta solicitud?",
        "warning",
        {
            showButtons: true,
            callbackYes: () => {
                fetch(`http://localhost:3000/reservations/${requestId}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                })
                .then((response) => response.json())
                .then((data) => {
                    showNotification("Solicitud eliminada exitosamente", "success");
                    loadRequests();
                })
                .catch((error) => {
                    console.error("Error al eliminar solicitud:", error);
                    showNotification("Error al eliminar solicitud", "danger");
                });
            },
            callbackNo: () => {
                console.log("No se eliminó la solicitud");
            },
        }
    );
}

  // Función para confirmar o revertir una solicitud
  function confirmRequest(requestId) {
    const requestRow = document.querySelector(`#request-${requestId}`);
    let newState = requestRow.classList.contains("tachado")
      ? "Pendiente"
      : "Confirmado";

    fetch(`http://localhost:3000/reservations/${requestId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Estado: newState }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (newState === "Confirmado") {
          requestRow.classList.add("tachado");
        } else {
          requestRow.classList.remove("tachado");
        }
        const confirmButton = requestRow.querySelector(".confirm-btn");
        confirmButton.textContent =
          newState === "Confirmado" ? "Revertir" : "Confirmar";
        showNotification(
          `Reserva ${
            newState === "Confirmado" ? "confirmada" : "revertida"
          } exitosamente`,
          "success"
        );
      })
      .catch((error) => {
        console.error("Error al actualizar el estado de la reserva:", error);
        showNotification(
          "Error al actualizar el estado de la reserva",
          "danger"
        );
      });
  }

  // Función para cancelar una solicitud
  function cancelRequest(requestId) {
    fetch(`http://localhost:3000/reservations/${requestId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Estado: "Cancelado" }),
    })
      .then((response) => response.json())
      .then((data) => {
        const requestRow = document.querySelector(`#request-${requestId}`);
        requestRow.classList.add("tachado");
        const confirmButton = requestRow.querySelector(".confirm-btn");
        confirmButton.textContent = "Revertir";
        showNotification("Reserva cancelada exitosamente", "success");
      })
      .catch((error) => {
        console.error("Error al cancelar la reserva:", error);
        showNotification("Error al cancelar la reserva", "danger");
      });
  }

  

// Llamar a esta función al cargar la página para verificar el token
document.addEventListener("DOMContentLoaded", function () {
  decodeToken(); // Para depuración
  if (isAdmin()) {
      console.log("Usuario autenticado como admin"); // Para depuración
      loadUsers();
      loadRequests();
  } else {
      console.log("Usuario no autenticado como admin"); // Para depuración
  }
});