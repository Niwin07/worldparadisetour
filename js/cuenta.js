const token = localStorage.getItem('token');
let userId;
let userData = null;

document.addEventListener('DOMContentLoaded', function() {
  const token =  localStorage.getItem('token');
  if (!token) { 
    window.location.href = 'acceso.html';
   }

  console.log('DOM cargado, llamando a cargarInformacionUsuario');
  cargarInformacionUsuario();

  document.getElementById('btnCambiarInfo').addEventListener('click', habilitarEdicion);
  document.getElementById('btnGuardarCambios').addEventListener('click', guardarCambios);
  document.getElementById('btnDescartarCambios').addEventListener('click', descartarCambios);
  document.getElementById('btnCambiarPassword').addEventListener('click', mostrarCambioPassword);
});

function cargarInformacionUsuario() {
  console.log('Iniciando carga de información del usuario');
  fetch('http://localhost:3000/auth/me', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Datos recibidos del servidor:', data);
    
    // Verificar si data.user existe
    if (!data.user) {
      console.error('La respuesta del servidor no contiene datos de usuario');
      window.location.href = 'acceso.html';
      return;
    }

    userData = data.user;
    userId = userData.id || userData.cliente_id; // Intentar obtener el ID de ambas formas
    console.log('UserId establecido:', userId);

    if (!userId) {
      console.error('No se pudo obtener el ID del usuario de la respuesta del servidor');
      return;
    }

    console.log('Datos del usuario cargados:', userData);
    console.log('ID del usuario:', userId);

    // Asegúrate de que los nombres de los campos coincidan con la respuesta del servidor
    document.getElementById('nombres').value = userData.Nombres || userData.nombres;
    document.getElementById('apellidos').value = userData.Apellidos || userData.apellidos;
    document.getElementById('email').value = userData.Email || userData.email;
    document.getElementById('telefono').value = userData.Num_telefono || userData.telefono;
    document.getElementById('fechaNacimiento').value = formatearFecha(userData.Fecha_nacimiento);
    document.getElementById('sexo').value = userData.Sexo || userData.sexo;
    document.getElementById('pais').value = userData.Pais || userData.pais;

    deshabilitarCampos();
  })
  .catch(error => console.error('Error al cargar información del usuario:', error));
}

function formatearFecha(fecha) {
  if (!(fecha instanceof Date)) {
    fecha = new Date(fecha);
  }
  
  if (isNaN(fecha.getTime())) {
    console.error('Fecha inválida:', fecha);
    return '';
  }

  return fecha.toISOString().split('T')[0];
}

function habilitarEdicion() {
  const campos = ['nombres', 'apellidos', 'email', 'telefono', 'fechaNacimiento', 'sexo', 'pais'];
  campos.forEach(campo => document.getElementById(campo).disabled = false);

  document.getElementById('btnCambiarInfo').style.display = 'none';
  document.getElementById('btnGuardarCambios').style.display = 'inline-block';
  document.getElementById('btnDescartarCambios').style.display = 'inline-block';
  document.getElementById('btnCambiarPassword').style.display = 'none';
}

function guardarCambios() {
  console.log('Iniciando guardarCambios');
  console.log('userId actual:', userId);

  const nuevosDatos = {
    Nombres: document.getElementById('nombres').value,
    Apellidos: document.getElementById('apellidos').value,
    Email: document.getElementById('email').value,
    Num_telefono: document.getElementById('telefono').value,
    Fecha_nacimiento: document.getElementById('fechaNacimiento').value,
    Sexo: document.getElementById('sexo').value,
    Pais: document.getElementById('pais').value
  };

  console.log('Nuevos datos a enviar:', nuevosDatos);

  if (!userId) {
    console.error('El ID del usuario no está definido. No se puede hacer la solicitud PUT.');
    return;
  }

  console.log('Realizando solicitud PUT a:', 'http://localhost:3000/usuarios/' + userId);

  fetch('http://localhost:3000/usuarios/' + userId, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(nuevosDatos)
  })
  .then(response => response.json())
  .then(data => {
    console.log('Respuesta del servidor:', data);
    alert('Datos actualizados con éxito');
    userData = {...userData, ...nuevosDatos};
    deshabilitarCampos();
    mostrarBotonesOriginales();
  })
  .catch(error => console.error('Error al guardar cambios:', error));
}

function descartarCambios() {
  document.getElementById('nombres').value = userData.nombres;
  document.getElementById('apellidos').value = userData.apellidos;
  document.getElementById('email').value = userData.email;
  document.getElementById('telefono').value = userData.telefono;
  document.getElementById('fechaNacimiento').value = formatearFecha(userData.Fecha_nacimiento);
  document.getElementById('sexo').value = userData.sexo;
  document.getElementById('pais').value = userData.pais;

  deshabilitarCampos();
  mostrarBotonesOriginales();
}

function deshabilitarCampos() {
  const campos = ['nombres', 'apellidos', 'email', 'telefono', 'fechaNacimiento', 'sexo', 'pais'];
  campos.forEach(campo => document.getElementById(campo).disabled = true);
}

function mostrarBotonesOriginales() {
  document.getElementById('btnCambiarInfo').style.display = 'inline-block';
  document.getElementById('btnGuardarCambios').style.display = 'none';
  document.getElementById('btnDescartarCambios').style.display = 'none';
  document.getElementById('btnCambiarPassword').style.display = 'inline-block';
}

function mostrarCambioPassword() {
  document.getElementById('cambioPasswordGroup').style.display = 'block';
}

document.getElementById('btnCambiarPassword').addEventListener('click', cambiarPassword);

function cambiarPassword() {
  const passwordActual = document.getElementById('passwordActual').value;
  const nuevaPassword = document.getElementById('nuevaPassword').value;
  const confirmarPassword = document.getElementById('confirmarPassword').value;

  // Validaciones en el cliente
  

  if (nuevaPassword !== confirmarPassword) {
    alert('Las nuevas contraseñas no coinciden');
    return;
  }

  if (nuevaPassword === passwordActual) {
    alert('La nueva contraseña debe ser diferente a la actual');
    return;
  }
  
  if (!passwordActual || !nuevaPassword || !confirmarPassword) {
    alert('Por favor, complete todos los campos de contraseña');
    return;
  }

  fetch('http://localhost:3000/cambiar-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      passwordActual: passwordActual,
      nuevaPassword: nuevaPassword
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }
    return response.json();
  })
  .then(data => {
    if (data.message) {
      alert('Contraseña cambiada con éxito');
      document.getElementById('cambioPasswordGroup').style.display = 'none';
      // Limpiar los campos de contraseña
      document.getElementById('passwordActual').value = '';
      document.getElementById('nuevaPassword').value = '';
      document.getElementById('confirmarPassword').value = '';
    } else {
      alert('Error al cambiar la contraseña: ' + (data.error || 'Error desconocido'));
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error al cambiar la contraseña: ' + error.message);
  });
}