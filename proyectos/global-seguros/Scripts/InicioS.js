const formulario = document.getElementById("formulario");

const nombre = document.getElementById("nombre");
const correo = document.getElementById("correo");
const password = document.getElementById("password");
const verificarPassword = document.getElementById("verificarPassword");

const errorNombre = document.getElementById("errorNombre");
const errorCorreo = document.getElementById("errorCorreo");
const errorPassword = document.getElementById("errorPassword");
const mensajeVerificacion = document.getElementById("mensajeVerificacion");

if (nombre) {
    nombre.addEventListener("input", () => {
        nombre.value = nombre.value
            .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "")
            .slice(0, 40);

        if (nombre.value.trim().length < 5) {
            errorNombre.textContent = "Debe ingresar nombre y apellido.";
        } else {
            errorNombre.textContent = "";
        }
    });
}

if (correo) {
    correo.addEventListener("input", () => {
        correo.value = correo.value.slice(0, 50);

        const expresionCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!expresionCorreo.test(correo.value)) {
            errorCorreo.textContent = "Correo electrónico inválido.";
        } else {
            errorCorreo.textContent = "";
        }
    });
}

if (password) {
    password.addEventListener("input", () => {
        const expresionPassword = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

        if (!expresionPassword.test(password.value)) {
            errorPassword.textContent = "Mínimo 8 caracteres, un número y un carácter especial.";
        } else {
            errorPassword.textContent = "";
        }

        validarCoincidencia();
    });
}

if (verificarPassword) {
    verificarPassword.addEventListener("input", validarCoincidencia);
}

function validarCoincidencia() {
    if (!password || !verificarPassword) return;

    if (verificarPassword.value === "") {
        mensajeVerificacion.textContent = "";
        return;
    }

    if (password.value === verificarPassword.value) {
        mensajeVerificacion.textContent = "Las contraseñas coinciden.";
        mensajeVerificacion.style.color = "green";
    } else {
        mensajeVerificacion.textContent = "Las contraseñas NO coinciden.";
        mensajeVerificacion.style.color = "red";
    }
}

if (formulario) {
    formulario.addEventListener("submit", (e) => {
        e.preventDefault();

        const expresionCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const expresionPassword = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

        let formularioValido = true;

        if (nombre.value.trim().length < 5) {
            errorNombre.textContent = "Debe ingresar nombre y apellido.";
            formularioValido = false;
        }

        if (!expresionCorreo.test(correo.value)) {
            errorCorreo.textContent = "Correo electrónico inválido.";
            formularioValido = false;
        }

        if (!expresionPassword.test(password.value)) {
            errorPassword.textContent = "Mínimo 8 caracteres, un número y un carácter especial.";
            formularioValido = false;
        }

        if (password.value !== verificarPassword.value) {
            mensajeVerificacion.textContent = "Las contraseñas NO coinciden.";
            mensajeVerificacion.style.color = "red";
            formularioValido = false;
        }

        if (formularioValido) {
            alert("Formulario enviado correctamente.");
            formulario.reset();
            window.location.href = "index.html#inicio";
        } else {
            alert("Por favor complete correctamente el formulario.");
        }
    });
}