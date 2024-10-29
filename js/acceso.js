document.addEventListener("DOMContentLoaded", function () {
  // Función para mostrar las pestañas (sin cambios)
  window.showTab = function (tabName) {
    document
      .querySelectorAll(".tab-content")
      .forEach((tab) => tab.classList.remove("active"));
    document
      .querySelectorAll(".tab")
      .forEach((tab) => tab.classList.remove("active"));
    document.getElementById(tabName).classList.add("active");
    document
      .querySelector(`.tab[onclick="showTab('${tabName}')"]`)
      .classList.add("active");
  };

  // Función para manejar errores de fetch
  function handleFetchError(response) {
    if (!response.ok) {
      return response.text().then((text) => {
        const errorMessage = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
      });
    }
    return response.json();
  }
  const loginForm = document.querySelector("#loginForm"); // Cambiado de '#login form' a '#loginForm'
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    console.log("Datos a enviar:", data); // Añade un log para verificar los datos antes de enviar

    fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json().catch(() => ({}))) // Manejar posibles errores de JSON en la respuesta
      // Modificación del manejo de la respuesta después del inicio de sesión
      .then((result) => {
        if (result.token) {
          localStorage.setItem("token", result.token);
          showTemporaryMessage("Inicio de sesión exitoso", "info");
          if (result.role === "admin") {
            // Redirigir a la página de administración
            window.location.href = "/admin.html";
          } else {
            // Redirigir a la página principal
            window.location.href = "/index.html";
          }
        } else {
          alert(
            "Error al iniciar sesión: " +
              (result.error || "Credenciales inválidas")
          );
          showTemporaryMessage(
            "Error al iniciar sesión: " +
              (result.error || "Credenciales inválidas"),
            "warning"
          );
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showTemporaryMessage(
          "Error al iniciar sesión: " + error.message,
          "warning"
        );
      });
  });

  // Función para validar la edad
  function validarEdad(fechaNacimiento) {
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const m = hoy.getMonth() - fechaNac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    return edad >= 18 && edad <= 120;
  }

  // Manejo del formulario de registro
  const signupForm = document.querySelector("#signup form");
  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(signupForm);
    const data = Object.fromEntries(formData.entries());

    // Validar que todos los campos estén completos
    for (let key in data) {
      if (data[key].trim() === "") {
        showTemporaryMessage("Por favor, complete todos los campos", "warning");
        return;
      }
    }

    // Validar que el nombre y apellido tengan al menos 3 letras
    if (data.Nombres.length < 3 || data.Apellidos.length < 3) {
      showTemporaryMessage(
        "El nombre y apellido deben tener al menos 3 letras",
        "warning"
      );
      return;
    }

    // Validar que las contraseñas coincidan
    if (data.password !== data.repeatPassword) {
      showTemporaryMessage("Las contraseñas no coinciden", "warning");
      return;
    }

    // Validar la longitud de la contraseña
    if (data.password.length < 8) {
      showTemporaryMessage(
        "La contraseña debe tener al menos 8 caracteres",
        "warning"
      );
      return;
    }

    // Validar que la contraseña tenga al menos una letra mayúscula y una letra minúscula
    if (!/[a-z]/.test(data.password) || !/[A-Z]/.test(data.password)) {
      showTemporaryMessage(
        "La contraseña debe tener al menos una letra mayúscula y una letra minúscula",
        "warning"
      );
      return;
    }

    // Validar la edad
    if (!validarEdad(data.fechaNacimiento)) {
      showTemporaryMessage(
        "Debes tener entre 18 y 120 años para registrarte",
        "warning"
      );
      return;
    }

    // Eliminar repeatPassword del objeto data
    delete data.repeatPassword;

    console.log("Datos a enviar:", data);

    fetch("http://localhost:3000/clientes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json().catch(() => ({})))
      .then((result) => {
        if (result.message) {
          showTemporaryMessage("Usuario registrado exitosamente", "info");
          signupForm.reset();
          window.location.href = "acceso.html";
        } else {
          alert(
            "Error al registrar usuario: " +
              (result.error || "Error desconocido")
          );
          showTemporaryMessage(
            "Error al registrar usuario: " +
              (result.error || "Error desconocido"),
            "warning"
          );
        }
      })
      .catch((error) => {
        console.error("Error en la solicitud:", error);
        showTemporaryMessage(
          "Error al registrar usuario: " + error.message,
          "info"
        );
      });
  });
});

const countryData = [
  { name: "Afghanistan", code: "AF", dialCode: "+93", flag: "🇦🇫" },
  { name: "Albania", code: "AL", dialCode: "+355", flag: "🇦🇱" },
  { name: "Algeria", code: "DZ", dialCode: "+213", flag: "🇩🇿" },
  { name: "Andorra", code: "AD", dialCode: "+376", flag: "🇦🇩" },
  { name: "Angola", code: "AO", dialCode: "+244", flag: "🇦🇴" },
  { name: "Argentina", code: "AR", dialCode: "+54", flag: "🇦🇷" },
  { name: "Armenia", code: "AM", dialCode: "+374", flag: "🇦🇲" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "Austria", code: "AT", dialCode: "+43", flag: "🇦🇹" },
  { name: "Azerbaijan", code: "AZ", dialCode: "+994", flag: "🇦🇿" },
  { name: "Bahamas", code: "BS", dialCode: "+1242", flag: "🇧🇸" },
  { name: "Bahrain", code: "BH", dialCode: "+973", flag: "🇧🇭" },
  { name: "Bangladesh", code: "BD", dialCode: "+880", flag: "🇧🇩" },
  { name: "Barbados", code: "BB", dialCode: "+1246", flag: "🇧🇧" },
  { name: "Belarus", code: "BY", dialCode: "+375", flag: "🇧🇾" },
  { name: "Belgium", code: "BE", dialCode: "+32", flag: "🇧🇪" },
  { name: "Belize", code: "BZ", dialCode: "+501", flag: "🇧🇿" },
  { name: "Benin", code: "BJ", dialCode: "+229", flag: "🇧🇯" },
  { name: "Bhutan", code: "BT", dialCode: "+975", flag: "🇧🇹" },
  { name: "Bolivia", code: "BO", dialCode: "+591", flag: "🇧🇴" },
  { name: "Bosnia and Herzegovina", code: "BA", dialCode: "+387", flag: "🇧🇦" },
  { name: "Botswana", code: "BW", dialCode: "+267", flag: "🇧🇼" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { name: "Brunei", code: "BN", dialCode: "+673", flag: "🇧🇳" },
  { name: "Bulgaria", code: "BG", dialCode: "+359", flag: "🇧🇬" },
  { name: "Burkina Faso", code: "BF", dialCode: "+226", flag: "🇧🇫" },
  { name: "Burundi", code: "BI", dialCode: "+257", flag: "🇧🇮" },
  { name: "Cambodia", code: "KH", dialCode: "+855", flag: "🇰🇭" },
  { name: "Cameroon", code: "CM", dialCode: "+237", flag: "🇨🇲" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "Cape Verde", code: "CV", dialCode: "+238", flag: "🇨🇻" },
  {
    name: "Central African Republic",
    code: "CF",
    dialCode: "+236",
    flag: "🇨🇫",
  },
  { name: "Chad", code: "TD", dialCode: "+235", flag: "🇹🇩" },
  { name: "Chile", code: "CL", dialCode: "+56", flag: "🇨🇱" },
  { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
  { name: "Colombia", code: "CO", dialCode: "+57", flag: "🇨🇴" },
  { name: "Comoros", code: "KM", dialCode: "+269", flag: "🇰🇲" },
  { name: "Congo", code: "CG", dialCode: "+242", flag: "🇨🇬" },
  { name: "Costa Rica", code: "CR", dialCode: "+506", flag: "🇨🇷" },
  { name: "Croatia", code: "HR", dialCode: "+385", flag: "🇭🇷" },
  { name: "Cuba", code: "CU", dialCode: "+53", flag: "🇨🇺" },
  { name: "Cyprus", code: "CY", dialCode: "+357", flag: "🇨🇾" },
  { name: "Czech Republic", code: "CZ", dialCode: "+420", flag: "🇨🇿" },
  { name: "Denmark", code: "DK", dialCode: "+45", flag: "🇩🇰" },
  { name: "Djibouti", code: "DJ", dialCode: "+253", flag: "🇩🇯" },
  { name: "Dominica", code: "DM", dialCode: "+1767", flag: "🇩🇲" },
  { name: "Dominican Republic", code: "DO", dialCode: "+1849", flag: "🇩🇴" },
  { name: "Ecuador", code: "EC", dialCode: "+593", flag: "🇪🇨" },
  { name: "Egypt", code: "EG", dialCode: "+20", flag: "🇪🇬" },
  { name: "El Salvador", code: "SV", dialCode: "+503", flag: "🇸🇻" },
  { name: "Equatorial Guinea", code: "GQ", dialCode: "+240", flag: "🇬🇶" },
  { name: "Eritrea", code: "ER", dialCode: "+291", flag: "🇪🇷" },
  { name: "Estonia", code: "EE", dialCode: "+372", flag: "🇪🇪" },
  { name: "Ethiopia", code: "ET", dialCode: "+251", flag: "🇪🇹" },
  { name: "Fiji", code: "FJ", dialCode: "+679", flag: "🇫🇯" },
  { name: "Finland", code: "FI", dialCode: "+358", flag: "🇫🇮" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "Gabon", code: "GA", dialCode: "+241", flag: "🇬🇦" },
  { name: "Gambia", code: "GM", dialCode: "+220", flag: "🇬🇲" },
  { name: "Georgia", code: "GE", dialCode: "+995", flag: "🇬🇪" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "Ghana", code: "GH", dialCode: "+233", flag: "🇬🇭" },
  { name: "Greece", code: "GR", dialCode: "+30", flag: "🇬🇷" },
  { name: "Grenada", code: "GD", dialCode: "+1473", flag: "🇬🇩" },
  { name: "Guatemala", code: "GT", dialCode: "+502", flag: "🇬🇹" },
  { name: "Guinea", code: "GN", dialCode: "+224", flag: "🇬🇳" },
  { name: "Guinea-Bissau", code: "GW", dialCode: "+245", flag: "🇬🇼" },
  { name: "Guyana", code: "GY", dialCode: "+592", flag: "🇬🇾" },
  { name: "Haiti", code: "HT", dialCode: "+509", flag: "🇭🇹" },
  { name: "Honduras", code: "HN", dialCode: "+504", flag: "🇭🇳" },
  { name: "Hungary", code: "HU", dialCode: "+36", flag: "🇭🇺" },
  { name: "Iceland", code: "IS", dialCode: "+354", flag: "🇮🇸" },
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "Indonesia", code: "ID", dialCode: "+62", flag: "🇮🇩" },
  { name: "Iran", code: "IR", dialCode: "+98", flag: "🇮🇷" },
  { name: "Iraq", code: "IQ", dialCode: "+964", flag: "🇮🇶" },
  { name: "Ireland", code: "IE", dialCode: "+353", flag: "🇮🇪" },
  { name: "Israel", code: "IL", dialCode: "+972", flag: "🇮🇱" },
  { name: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹" },
  { name: "Jamaica", code: "JM", dialCode: "+1876", flag: "🇯🇲" },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵" },
  { name: "Jordan", code: "JO", dialCode: "+962", flag: "🇯🇴" },
  { name: "Kazakhstan", code: "KZ", dialCode: "+7", flag: "🇰🇿" },
  { name: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪" },
  { name: "Kiribati", code: "KI", dialCode: "+686", flag: "🇰🇮" },
  { name: "Korea, North", code: "KP", dialCode: "+850", flag: "🇰🇵" },
  { name: "Korea, South", code: "KR", dialCode: "+82", flag: "🇰🇷" },
  { name: "Kuwait", code: "KW", dialCode: "+965", flag: "🇰🇼" },
  { name: "Kyrgyzstan", code: "KG", dialCode: "+996", flag: "🇰🇬" },
  { name: "Laos", code: "LA", dialCode: "+856", flag: "🇱🇦" },
  { name: "Latvia", code: "LV", dialCode: "+371", flag: "🇱🇻" },
  { name: "Lebanon", code: "LB", dialCode: "+961", flag: "🇱🇧" },
  { name: "Lesotho", code: "LS", dialCode: "+266", flag: "🇱🇸" },
  { name: "Liberia", code: "LR", dialCode: "+231", flag: "🇱🇷" },
  { name: "Libya", code: "LY", dialCode: "+218", flag: "🇱🇾" },
  { name: "Liechtenstein", code: "LI", dialCode: "+423", flag: "🇱🇮" },
  { name: "Lithuania", code: "LT", dialCode: "+370", flag: "🇱🇹" },
  { name: "Luxembourg", code: "LU", dialCode: "+352", flag: "🇱🇺" },
  { name: "Madagascar", code: "MG", dialCode: "+261", flag: "🇲🇬" },
  { name: "Malawi", code: "MW", dialCode: "+265", flag: "🇲🇼" },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾" },
  { name: "Maldives", code: "MV", dialCode: "+960", flag: "🇲🇻" },
  { name: "Mali", code: "ML", dialCode: "+223", flag: "🇲🇱" },
  { name: "Malta", code: "MT", dialCode: "+356", flag: "🇲🇹" },
  { name: "Marshall Islands", code: "MH", dialCode: "+692", flag: "🇲🇭" },
  { name: "Mauritania", code: "MR", dialCode: "+222", flag: "🇲🇷" },
  { name: "Mauritius", code: "MU", dialCode: "+230", flag: "🇲🇺" },
  { name: "Mexico", code: "MX", dialCode: "+52", flag: "🇲🇽" },
  { name: "Micronesia", code: "FM", dialCode: "+691", flag: "🇫🇲" },
  { name: "Moldova", code: "MD", dialCode: "+373", flag: "🇲🇩" },
  { name: "Monaco", code: "MC", dialCode: "+377", flag: "🇲🇨" },
  { name: "Mongolia", code: "MN", dialCode: "+976", flag: "🇲🇳" },
  { name: "Montenegro", code: "ME", dialCode: "+382", flag: "🇲🇪" },
  { name: "Morocco", code: "MA", dialCode: "+212", flag: "🇲🇦" },
  { name: "Mozambique", code: "MZ", dialCode: "+258", flag: "🇲🇿" },
  { name: "Myanmar", code: "MM", dialCode: "+95", flag: "🇲🇲" },
  { name: "Namibia", code: "NA", dialCode: "+264", flag: "🇳🇦" },
  { name: "Nauru", code: "NR", dialCode: "+674", flag: "🇳🇷" },
  { name: "Nepal", code: "NP", dialCode: "+977", flag: "🇳🇵" },
  { name: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱" },
  { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿" },
  { name: "Nicaragua", code: "NI", dialCode: "+505", flag: "🇳🇮" },
  { name: "Niger", code: "NE", dialCode: "+227", flag: "🇳🇪" },
  { name: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬" },
  { name: "Norway", code: "NO", dialCode: "+47", flag: "🇳🇴" },
  { name: "Oman", code: "OM", dialCode: "+968", flag: "🇴🇲" },
  { name: "Pakistan", code: "PK", dialCode: "+92", flag: "🇵🇰" },
  { name: "Palau", code: "PW", dialCode: "+680", flag: "🇵🇼" },
  { name: "Palestine", code: "PS", dialCode: "+970", flag: "🇵🇸" },
  { name: "Panama", code: "PA", dialCode: "+507", flag: "🇵🇦" },
  { name: "Papua New Guinea", code: "PG", dialCode: "+675", flag: "🇵🇬" },
  { name: "Paraguay", code: "PY", dialCode: "+595", flag: "🇵🇾" },
  { name: "Peru", code: "PE", dialCode: "+51", flag: "🇵🇪" },
  { name: "Philippines", code: "PH", dialCode: "+63", flag: "🇵🇭" },
  { name: "Poland", code: "PL", dialCode: "+48", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", dialCode: "+351", flag: "🇵🇹" },
  { name: "Qatar", code: "QA", dialCode: "+974", flag: "🇶🇦" },
  { name: "Romania", code: "RO", dialCode: "+40", flag: "🇷🇴" },
  { name: "Russia", code: "RU", dialCode: "+7", flag: "🇷🇺" },
  { name: "Rwanda", code: "RW", dialCode: "+250", flag: "🇷🇼" },
  { name: "Saint Kitts and Nevis", code: "KN", dialCode: "+1869", flag: "🇰🇳" },
  { name: "Saint Lucia", code: "LC", dialCode: "+1758", flag: "🇱🇨" },
  {
    name: "Saint Vincent and the Grenadines",
    code: "VC",
    dialCode: "+1784",
    flag: "🇻🇨",
  },
  { name: "Samoa", code: "WS", dialCode: "+685", flag: "🇼🇸" },
  { name: "San Marino", code: "SM", dialCode: "+378", flag: "🇸🇲" },
  { name: "Sao Tome and Principe", code: "ST", dialCode: "+239", flag: "🇸🇹" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { name: "Senegal", code: "SN", dialCode: "+221", flag: "🇸🇳" },
  { name: "Serbia", code: "RS", dialCode: "+381", flag: "🇷🇸" },
  { name: "Seychelles", code: "SC", dialCode: "+248", flag: "🇸🇨" },
  { name: "Sierra Leone", code: "SL", dialCode: "+232", flag: "🇸🇱" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬" },
  { name: "Slovakia", code: "SK", dialCode: "+421", flag: "🇸🇰" },
  { name: "Slovenia", code: "SI", dialCode: "+386", flag: "🇸🇮" },
  { name: "Solomon Islands", code: "SB", dialCode: "+677", flag: "🇸🇧" },
  { name: "Somalia", code: "SO", dialCode: "+252", flag: "🇸🇴" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "South Sudan", code: "SS", dialCode: "+211", flag: "🇸🇸" },
  { name: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { name: "Sri Lanka", code: "LK", dialCode: "+94", flag: "🇱🇰" },
  { name: "Sudan", code: "SD", dialCode: "+249", flag: "🇸🇩" },
  { name: "Suriname", code: "SR", dialCode: "+597", flag: "🇸🇷" },
  { name: "Swaziland", code: "SZ", dialCode: "+268", flag: "🇸🇿" },
  { name: "Sweden", code: "SE", dialCode: "+46", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", dialCode: "+41", flag: "🇨🇭" },
  { name: "Syria", code: "SY", dialCode: "+963", flag: "🇸🇾" },
  { name: "Taiwan", code: "TW", dialCode: "+886", flag: "🇹🇼" },
  { name: "Tajikistan", code: "TJ", dialCode: "+992", flag: "🇹🇯" },
  { name: "Tanzania", code: "TZ", dialCode: "+255", flag: "🇹🇿" },
  { name: "Thailand", code: "TH", dialCode: "+66", flag: "🇹🇭" },
  { name: "Timor-Leste", code: "TL", dialCode: "+670", flag: "🇹🇱" },
  { name: "Togo", code: "TG", dialCode: "+228", flag: "🇹🇬" },
  { name: "Tonga", code: "TO", dialCode: "+676", flag: "🇹🇴" },
  { name: "Trinidad and Tobago", code: "TT", dialCode: "+1868", flag: "🇹🇹" },
  { name: "Tunisia", code: "TN", dialCode: "+216", flag: "🇹🇳" },
  { name: "Turkey", code: "TR", dialCode: "+90", flag: "🇹🇷" },
  { name: "Turkmenistan", code: "TM", dialCode: "+993", flag: "🇹🇲" },
  { name: "Tuvalu", code: "TV", dialCode: "+688", flag: "🇹🇻" },
  { name: "Uganda", code: "UG", dialCode: "+256", flag: "🇺🇬" },
  { name: "Ukraine", code: "UA", dialCode: "+380", flag: "🇺🇦" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "Uruguay", code: "UY", dialCode: "+598", flag: "🇺🇾" },
  { name: "Uzbekistan", code: "UZ", dialCode: "+998", flag: "🇺🇿" },
  { name: "Vanuatu", code: "VU", dialCode: "+678", flag: "🇻🇺" },
  { name: "Vatican City", code: "VA", dialCode: "+39", flag: "🇻🇦" },
  { name: "Venezuela", code: "VE", dialCode: "+58", flag: "🇻🇪" },
  { name: "Vietnam", code: "VN", dialCode: "+84", flag: "🇻🇳" },
  { name: "Yemen", code: "YE", dialCode: "+967", flag: "🇾🇪" },
  { name: "Zambia", code: "ZM", dialCode: "+260", flag: "🇿🇲" },
  { name: "Zimbabwe", code: "ZW", dialCode: "+263", flag: "🇿🇼" },
];

const countrySelect = document.getElementById("country-select");
const telInput = document.getElementById("phone");

function populateCountrySelect() {
  countryData.forEach((country) => {
    const option = document.createElement("option");
    option.value = country.dialCode;
    option.textContent = `${country.flag} ${country.name} (${country.dialCode})`;
    countrySelect.appendChild(option);
  });
}

function updatePhoneNumber() {
  const selectedDialCode = countrySelect.value;
  let currentValue = telInput.value;

  // Eliminar cualquier prefijo existente
  currentValue = currentValue.replace(/^\+\d+\s?/, "");

  // Agregar el nuevo prefijo
  telInput.value = selectedDialCode + " " + currentValue;
}

countrySelect.addEventListener("change", updatePhoneNumber);

populateCountrySelect();
updatePhoneNumber();

// Función mejorada para manejar la entrada de teléfono
function handlePhoneInput(input) {
  const phoneInput = input;
  let oldValue = "";
  let oldSelectionStart;
  let oldSelectionEnd;

  phoneInput.addEventListener("input", (e) => {
    const selectedDialCode = countrySelect.value;
    const currentValue = e.target.value;

    // Separar el prefijo y el número
    const [prefix, ...rest] = currentValue.split(" ");
    const number = rest.join("");

    // Validar que el prefijo coincida con el seleccionado, que el resto sean solo números,
    // y que no exceda los 15 dígitos
    if (
      prefix !== selectedDialCode ||
      !/^[0-9]*$/.test(number) ||
      number.length > 15
    ) {
      // Si la entrada no es válida, revertir al valor anterior
      e.target.value = oldValue;
      e.target.setSelectionRange(oldSelectionStart, oldSelectionEnd);
    } else {
      oldValue = currentValue;
      oldSelectionStart = e.target.selectionStart;
      oldSelectionEnd = e.target.selectionEnd;
    }
  });

  phoneInput.addEventListener("keydown", (e) => {
    if (
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      (e.keyCode >= 35 && e.keyCode <= 40)
    ) {
      return;
    }

    oldValue = phoneInput.value;
    oldSelectionStart = phoneInput.selectionStart;
    oldSelectionEnd = phoneInput.selectionEnd;
  });

  phoneInput.addEventListener("paste", (e) => {
    e.preventDefault();
    const selectedDialCode = countrySelect.value;
    const pastedText = (e.clipboardData || window.clipboardData).getData(
      "text"
    );
    const numericText = pastedText.replace(/[^0-9]/g, "").slice(0, 15);
    const newValue = selectedDialCode + " " + numericText;
    phoneInput.value = newValue;
  });
}

// Espera a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function () {
  const phoneInputElement = document.getElementById("phone");

  if (phoneInputElement) {
    handlePhoneInput(phoneInputElement);
  } else {
    console.error("No se encontró el input de teléfono");
  }
});

// Función para mostrar mensajes temporales
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
