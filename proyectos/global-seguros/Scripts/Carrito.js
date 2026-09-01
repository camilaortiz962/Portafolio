const productosCarrito = {
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

const tituloProducto = document.getElementById("productoSeleccionado");
const botonAceptar = document.getElementById("botonAceptar");

if (tituloProducto) {
    if (producto && productosCarrito[producto]) {
        tituloProducto.innerHTML = productosCarrito[producto].replace(" ", "<br>");
    } else {
        tituloProducto.textContent = "Producto no seleccionado";
    }
}

if (botonAceptar) {
    botonAceptar.addEventListener("click", () => {
        if (producto && productosCarrito[producto]) {
            window.location.href = `Pago.html?producto=${producto}`;
        } else {
            window.location.href = "index.html#beneficios";
        }
    });

}


