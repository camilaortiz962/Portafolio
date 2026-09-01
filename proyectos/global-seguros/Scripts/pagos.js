document.addEventListener("DOMContentLoaded", () => {

    const productosPago = {
        platino: "GlobalUniversidad Garantizada Platino",
        garantizada: "GlobalUniversidad Garantizada",
        semestres: "GlobalSemestres",
        flex: "GlobalEducación Flex",
        seguraPlus: "GlobalUniversidad Segura Plus",
        seguraPlusSemestres: "GlobalUniversidad Segura Plus Semestres",
        masProfesional: "GlobalMás Profesional",
        posgrado: "GlobalUniversidad Posgrado",
        posgradoPlus: "GlobalUniversidad Posgrado Plus"
    };

    const parametros = new URLSearchParams(window.location.search);
    const producto = parametros.get("producto");
    const nombreProducto = productosPago[producto] || "Seguro Educativo Anual";

    const productoPago = document.getElementById("productoPago");
    const productoCompra = document.getElementById("productoCompra");

    if (productoPago) {
        productoPago.textContent = nombreProducto;
    }

    if (productoCompra) {
        productoCompra.textContent = nombreProducto;
    }

    const nombre = document.getElementById("nombre");
    const documento = document.getElementById("documento");
    const correo = document.getElementById("correo");
    const telefono = document.getElementById("telefono");

    const continuar = document.getElementById("continuar");
    const volver = document.getElementById("volver");
    const btnPagar = document.getElementById("btnPagar");

    const metodos = document.querySelectorAll(".metodo");
    const paneles = document.querySelectorAll(".panel-pago");

    const modalCompra = document.getElementById("modalCompra");

    function limpiarErrores() {
        document.querySelectorAll("small").forEach((item) => {
            item.textContent = "";
        });

        document.querySelectorAll(".error").forEach((item) => {
            item.classList.remove("error");
        });
    }

    function mostrarError(campo, idError, mensaje) {
        campo.classList.add("error");
        document.getElementById(idError).textContent = mensaje;
    }

    if (nombre) {
        nombre.addEventListener("input", () => {
            nombre.value = nombre.value
                .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "")
                .slice(0, 50);
        });
    }

    if (documento) {
        documento.addEventListener("input", () => {
            documento.value = documento.value.replace(/\D/g, "").slice(0, 15);
        });
    }

    if (telefono) {
        telefono.addEventListener("input", () => {
            telefono.value = telefono.value.replace(/\D/g, "").slice(0, 10);
        });
    }

    if (continuar) {
        continuar.addEventListener("click", () => {

            limpiarErrores();

            let valido = true;

            if (nombre.value.trim().length < 5) {
                mostrarError(nombre, "errorNombre", "Ingrese nombre y apellido válidos.");
                valido = false;
            }

            if (!/^[0-9]{8,15}$/.test(documento.value.trim())) {
                mostrarError(documento, "errorDocumento", "Debe contener entre 8 y 15 números.");
                valido = false;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value.trim())) {
                mostrarError(correo, "errorCorreo", "Correo electrónico inválido.");
                valido = false;
            }

            if (!/^[0-9]{10}$/.test(telefono.value.trim())) {
                mostrarError(telefono, "errorTelefono", "Debe contener 10 números.");
                valido = false;
            }

            if (!valido) return;

            document.getElementById("paso1").classList.remove("mostrar");
            document.getElementById("paso2").classList.add("mostrar");

            document.getElementById("circulo1").classList.remove("activo");
            document.getElementById("circulo2").classList.add("activo");
        });
    }

    if (volver) {
        volver.addEventListener("click", () => {
            document.getElementById("paso2").classList.remove("mostrar");
            document.getElementById("paso1").classList.add("mostrar");

            document.getElementById("circulo2").classList.remove("activo");
            document.getElementById("circulo1").classList.add("activo");
        });
    }

    metodos.forEach((metodo) => {
        metodo.addEventListener("click", () => {

            metodos.forEach((item) => {
                item.classList.remove("activo");
            });

            paneles.forEach((item) => {
                item.classList.remove("mostrar");
            });

            metodo.classList.add("activo");

            const panelActivo = document.getElementById(metodo.dataset.metodo);

            if (panelActivo) {
                panelActivo.classList.add("mostrar");
            }
        });
    });

    const numeroTarjeta = document.getElementById("numeroTarjeta");
    const titular = document.getElementById("titular");
    const fecha = document.getElementById("fecha");
    const cvv = document.getElementById("cvv");
    const numeroNequi = document.getElementById("numeroNequi");
    const numeroDaviplata = document.getElementById("numeroDaviplata");

    if (numeroTarjeta) {
        numeroTarjeta.addEventListener("input", () => {
            numeroTarjeta.value = numeroTarjeta.value.replace(/\D/g, "").slice(0, 16);
        });
    }

    if (titular) {
        titular.addEventListener("input", () => {
            titular.value = titular.value
                .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "")
                .slice(0, 50);
        });
    }

    if (fecha) {
        fecha.addEventListener("input", () => {
            fecha.value = fecha.value.replace(/\D/g, "").slice(0, 4);

            if (fecha.value.length >= 3) {
                fecha.value = fecha.value.slice(0, 2) + "/" + fecha.value.slice(2);
            }
        });
    }

    if (cvv) {
        cvv.addEventListener("input", () => {
            cvv.value = cvv.value.replace(/\D/g, "").slice(0, 4);
        });
    }

    if (numeroNequi) {
        numeroNequi.addEventListener("input", () => {
            numeroNequi.value = numeroNequi.value.replace(/\D/g, "").slice(0, 10);
        });
    }

    if (numeroDaviplata) {
        numeroDaviplata.addEventListener("input", () => {
            numeroDaviplata.value = numeroDaviplata.value.replace(/\D/g, "").slice(0, 10);
        });
    }

    function mostrarModalCompra() {
     if (modalCompra) {
        modalCompra.removeAttribute("hidden");
        modalCompra.classList.add("activo");
        document.body.classList.add("modal-abierto");
     }
    }

    if (btnPagar) {
        btnPagar.addEventListener("click", () => {

            const acepto = document.getElementById("acepto");

            if (!acepto.checked) {
                alert("Debe aceptar las condiciones.");
                return;
            }

            const metodoActivo = document.querySelector(".metodo.activo");

            if (!metodoActivo) {
                alert("Seleccione un método de pago.");
                return;
            }

            const metodo = metodoActivo.dataset.metodo;

            if (metodo === "tarjeta") {

                if (numeroTarjeta.value.trim().length !== 16) {
                    alert("Ingrese un número de tarjeta válido.");
                    numeroTarjeta.focus();
                    return;
                }

                if (titular.value.trim().length < 5) {
                    alert("Ingrese el nombre completo del titular.");
                    titular.focus();
                    return;
                }

                if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(fecha.value.trim())) {
                    alert("Ingrese una fecha válida en formato MM/AA.");
                    fecha.focus();
                    return;
                }

                if (cvv.value.trim().length < 3) {
                    alert("Ingrese un CVV válido.");
                    cvv.focus();
                    return;
                }

                mostrarModalCompra();
            }

            if (metodo === "pse") {

                const banco = document.getElementById("banco");

                if (banco.value === "") {
                    alert("Seleccione un banco.");
                    banco.focus();
                    return;
                }

                mostrarModalCompra();
            }

            if (metodo === "nequi") {

                if (!/^[0-9]{10}$/.test(numeroNequi.value)) {
                    alert("Ingrese un número Nequi válido.");
                    numeroNequi.focus();
                    return;
                }

                mostrarModalCompra();
            }

            if (metodo === "daviplata") {

                if (!/^[0-9]{10}$/.test(numeroDaviplata.value)) {
                    alert("Ingrese un número Daviplata válido.");
                    numeroDaviplata.focus();
                    return;
                }

                mostrarModalCompra();
            }

        });
    }

});