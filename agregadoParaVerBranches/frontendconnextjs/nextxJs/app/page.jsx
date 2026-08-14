
/*copie el codigo de chatgpt a codex y me paso estos codigos*/


const categorias = [
  "📊 Administración y Gestión",
  "🏗 Construcciones",
  "💻 Informática / Tecnología",
  "🍳 Gastronomía",
  "☀ Energías Renovables",
  "🪚 Carpintería",
  "🚜 Actividades Agropecuarias",
  "👜 Marroquinería",
  "🇬🇧 Inglés",
  "🚀 Tecnología Aplicada",
];

export default function Home() {
  return (
    <>
      <header className="encabezado">
        <div className="logo">
          <h1>CFL N° 401</h1>
          <p>Centro de Formación Laboral</p>
        </div>

        <nav className="menu" aria-label="Navegación principal">
          <a href="#inicio">Inicio</a>
          <a href="#cursos">Cursos</a>
          <a href="#inscripcion">Inscripciones</a>
          <a href="#contacto">Contacto</a>
        </nav>
      </header>

      <main>
        <section id="inicio" className="inicio">
          <h2>Formate en oficios y tecnologías</h2>
          <p>Con salida laboral real</p>
          <a className="boton-principal" href="#cursos">
            Ver cursos
          </a>
        </section>

        <section id="cursos" className="cursos">
          <h2>Nuestra oferta formativa</h2>

          <div className="categorias">
            {categorias.map((categoria) => (
              <article className="categoria" key={categoria}>
                <h3>{categoria}</h3>
                <button type="button">Ver cursos</button>
              </article>
            ))}
          </div>
        </section>

        <section id="inscripcion" className="inscripcion">
          <h2>📢 Preinscripciones e Inscripciones 2026</h2>
          <p>¡Ya están abiertas las inscripciones a los cursos!</p>
          <button className="boton-principal" type="button">
            Inscribirme
          </button>
        </section>

        <section id="contacto" className="contacto">
          <h2>Contacto</h2>
          <p>Centro de Formación Laboral CFL N° 401 - Azul</p>
          <button type="button">Consultar</button>
        </section>
      </main>

      <footer>
        <p>CFL N° 401 - Centro de Formación Laboral</p>
      </footer>
    </>
  );
}