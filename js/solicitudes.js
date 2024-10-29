document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if(!token) {
        window.location.href = "acceso.html";
        return;
    }
    fetchReservations();
});

async function fetchReservations() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = "acceso.html";
        return;
    }

    let userId;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId; // Cambiado de payload.id a payload.userId
        console.log('User ID from token:', userId);
    } catch (error) {
        console.error('Error decoding token:', error);
        return;
    }

    if (!userId) {
        console.error('User ID not found in token');
        return;
    }

    try {
        console.log('Fetching reservations for user:', userId);
        const response = await fetch(`http://localhost:3000/reservations/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Reservations data received:', data);
        renderReservations(data);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        document.getElementById('reservations').innerHTML = '<p>Error al cargar las reservas. Por favor, intenta de nuevo más tarde.</p>';
    }
}

// El resto del código permanece igual

// El resto del código permanece sin cambios


function renderReservations(reservations) {
    const container = document.getElementById('reservations');
    if (reservations.length === 0) {
        container.innerHTML = '<p>No tienes reservas activas.</p>';
        return;
    }
    container.innerHTML = reservations.map(reservation => `
        <div class="card" onclick="showReservationDetails(${reservation.ID})">
            <h3>${reservation.Email || 'Anónimo'}</h3>
            <p>Reserva #${reservation.ID}</p>
            <p>Fecha: ${new Date(reservation.Fecha_solicitud).toLocaleDateString()}</p>
            <div class="status-container">
                <div class="status-indicator status-${reservation.Estado.toLowerCase()}"></div>
                <p class="status-text status-${reservation.Estado.toLowerCase()}">${reservation.Estado}</p>
            </div>
        </div>
    `).join('');
}



// ... (código anterior sin cambios)

async function showReservationDetails(id) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:3000/reservations/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        data.tours = data.tours.map(tour => {
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

        const detailsContent = document.getElementById('details-content');
        detailsContent.innerHTML = `
            <h2>Detalles de la Reserva #${data.ID}</h2>
            <p><strong>Cliente:</strong> ${data.Nombres} ${data.Apellidos}</p>
            <p><strong>Email:</strong> ${data.Email || 'No disponible'}</p>
            <p><strong>Fecha de solicitud:</strong> ${new Date(data.Fecha_solicitud).toLocaleDateString()}</p>
            <p><strong>Estado:</strong> <span class="status-text status-${data.Estado.toLowerCase()}">${data.Estado}</span></p>
            <p><strong>Asesoría de alojamientos:</strong> ${data.Alojamiento === 'si' ? 'Sí' : 'No'}</p>
            <p><strong>Total:</strong> ${data.Total} ${data.divisa}</p>
            <h3>Tours:</h3>
            <ul class="tour-list">
                ${data.tours.map(tour => `
                    <li class="tour-item">
                        <h4>${tour.Nombre_tour}</h4>
                        <p>Personas: ${tour.Cantidad_personas}</p>
                        <p>Edades: ${tour.Edad_Personas.join(', ')}</p>
                        <p>Fecha de inicio: ${new Date(tour.Fecha_inicio).toLocaleDateString()}</p>
                        <p>Fecha de fin: ${new Date(tour.Fecha_fin).toLocaleDateString()}</p>
                        <p>Fecha deseada para realizar el Tour: ${new Date(tour.Fecha_Tour).toLocaleDateString()}</p>
                        <p><strong>Sub-total:</strong> ${tour.Sub_total} ${data.divisa}</p>
                    </li>
                `).join('')}
            </ul>
            <button class="btn btn-primary" onclick="closeDetails()">Cerrar</button>
        `;
        document.getElementById('overlay').style.display = 'block';
        document.getElementById('reservation-details').style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los detalles de la reserva. Por favor, intenta de nuevo.');
    }
}


// ... (resto del código sin cambios)


function closeDetails() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('reservation-details').style.display = 'none';
}