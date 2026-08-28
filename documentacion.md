##Documento de Requerimientos — Plataforma Web CFL 401
##Versión actualizada
##1. Descripción general
El proyecto consiste en desarrollar una plataforma web propia para el CFL 401, orientada a presentar de forma clara, completa y actualizada la oferta de cursos disponibles y facilitar el acceso a la información necesaria para las personas interesadas en realizar una capacitación.
Actualmente, el CFL 401 no cuenta con una página web propia destinada a presentar sus cursos. La información disponible a través del sitio del Instituto Provincial de Formación Laboral no siempre permite conocer con suficiente detalle las características de cada propuesta, como sus contenidos, modalidad, temas, horarios o duración. Además, el proceso de inscripción y la documentación necesaria no se encuentran explicados de manera suficientemente clara.
La plataforma busca solucionar esta situación centralizando la información relevante en un único sitio y permitiendo que el personal autorizado del CFL 401 pueda mantenerla actualizada mediante un sistema de administración.

##2. Objetivo del proyecto
El objetivo principal es desarrollar un sitio web que permita a cualquier persona interesada consultar la oferta educativa del CFL 401 y obtener información suficiente para conocer las características de los cursos antes de realizar una inscripción.
El sistema deberá proporcionar información sobre cada curso, incluyendo su descripción, modalidad, horarios, período de cursada, fecha de inicio, docente y programa o contenidos.
La plataforma también contará con una guía general de inscripción, ubicada en la página principal, donde se explicarán los pasos que debe seguir una persona interesada y la documentación necesaria para realizar el trámite.
Por otra parte, el sistema contará con un panel de administración mediante el cual los usuarios autorizados podrán gestionar los contenidos de la plataforma de acuerdo con sus permisos.

##3. Alcance del MVP
El MVP estará enfocado en dos aspectos principales: la presentación de la oferta educativa y la gestión interna de sus contenidos.
Desde el sitio público, los visitantes podrán consultar los cursos disponibles, acceder a la información básica de cada uno y visualizar una descripción más completa junto con su programa o contenidos. También podrán acceder desde la página principal a una guía general que explique cómo realizar la inscripción y qué documentación es necesaria.
Desde el panel administrativo, los usuarios autorizados podrán gestionar los cursos y modificar la información publicada de acuerdo con el nivel de permisos correspondiente.
La inscripción online queda fuera del MVP. La plataforma informará sobre el procedimiento de inscripción, pero no permitirá realizar ni gestionar la inscripción directamente desde el sitio.

##4. Usuarios y niveles de acceso
El sistema contará con cuatro tipos de usuarios: visitante, administrador, preceptor y docente.
#4.1 Visitante
Es cualquier persona que accede al sitio público sin iniciar sesión.
Podrá consultar la oferta de cursos, visualizar sus detalles y acceder a la guía general de inscripción.
No tendrá acceso al panel administrativo.

#4.2 Administrador
El administrador tendrá acceso total a las funcionalidades administrativas del sistema.
Podrá gestionar los cursos en su totalidad, incluyendo su creación, modificación y eliminación. Al crear o editar un curso podrá asignarle uno o más docentes según corresponda.
Además, podrá crear y administrar usuarios dentro del sistema. Tendrá la capacidad de crear usuarios preceptores y docentes, además de administrar los permisos correspondientes.
El administrador será el nivel superior dentro de la estructura de usuarios del sistema.

#4.3 Preceptor
El preceptor tendrá permisos para realizar las tareas necesarias para la gestión cotidiana de los cursos.
Podrá crear, editar y eliminar cursos y gestionar la información correspondiente a estos. También podrá asignar docentes al momento de crear un curso o modificar un curso existente.
El preceptor podrá crear usuarios docentes, pero no tendrá permisos para crear administradores ni otros usuarios preceptores.
De esta manera, la creación de usuarios con privilegios administrativos superiores quedará restringida al administrador.

#4.4 Docente
El docente podrá gestionar los cursos que le hayan sido asignados.
Si un docente tiene asignados, por ejemplo, los cursos de Programación y Refrigeración, podrá modificar y gestionar esos cursos, pero no tendrá acceso a los demás cursos existentes en el sistema.
El docente no podrá crear nuevos cursos, eliminarlos ni asignarse cursos a sí mismo. La asignación deberá ser realizada por un administrador o preceptor autorizado. La asignación de docentes y terminación de cursos será responsabilidad exclusiva de los administradores y preceptores autorizados.

##5. Jerarquía de permisos
La estructura de permisos puede representarse de la siguiente manera:
Administrador
→ Acceso total
→ Gestiona cursos
→ Asigna docentes
→ Crea administradores/preceptores/docentes según las reglas definidas
Preceptor
→ Gestiona cursos
→ Asigna docentes
→ Crea docentes
→ No puede crear administradores ni preceptores
Docente
→ Gestiona únicamente los cursos asignados
→ No puede crear cursos
→ No puede asignarse cursos
→ No puede gestionar cursos de otros docentes
Visitante
→ Solo consulta información pública
Esto es importante porque los permisos no deben limitarse únicamente a ocultar botones en la interfaz. El sistema deberá validar los permisos también en el backend, de manera que un usuario no pueda acceder manualmente a una funcionalidad para la cual no está autorizado.

#6. Requisitos funcionales

RF-01 — Visualización de cursos
El sistema deberá permitir a los visitantes visualizar los cursos disponibles del CFL 401.

RF-02 — Información básica del curso
Cada curso deberá presentar como mínimo su nombre, descripción, horarios, meses de cursada, fecha de inicio y docente asignado.

RF-03 — Detalle del curso
El sistema deberá permitir acceder a una vista detallada de cada curso, donde se podrá consultar información ampliada y el programa o contenido de la propuesta.

RF-04 — Organización de cursos
El sistema deberá permitir organizar los cursos mediante categorías u otro mecanismo que facilite su consulta, según lo que se determine durante el diseño.

RF-05 — Guía general de inscripción
La página principal deberá incluir una sección destinada a explicar el proceso general de inscripción y la documentación necesaria.
Esta información será común al instituto y no estará asociada individualmente a cada curso.

RF-06 — Autenticación
El sistema deberá permitir que los usuarios administrativos ingresen al panel mediante un mecanismo de autenticación.

RF-07 — Panel de administración
El sistema deberá contar con un panel de administración cuyo contenido y funcionalidades estarán determinadas por los permisos del usuario autenticado.

RF-08 — Crear cursos
Los administradores y preceptores podrán crear nuevos cursos.

RF-09 — Editar cursos
Los administradores y preceptores podrán editar cualquier curso.
Los docentes podrán editar todos los datos de los cursos que tengan asignados, incluyendo nombre, descripción, modalidad, horarios, meses de cursada, fecha de inicio, contenidos y demás información asociada.

RF-10 — Eliminar cursos
Los administradores y preceptores podrán eliminar cursos.
Los docentes no podrán eliminar ningún curso, incluyendo aquellos que tengan asignados.

RF-11 — Asignación de docentes
Los administradores y preceptores podrán asignar docentes a un curso durante su creación o posteriormente mediante la edición del curso.

RF-12 — Restricción de asignación
Los docentes no podrán asignarse cursos a sí mismos ni modificar la asignación de docentes de un curso. La asignación deberá ser realizada por un administrador o preceptor autorizado.

RF-13 — Creación de usuarios docentes
Los administradores y preceptores podrán crear usuarios docentes.

RF-14 — Creación de usuarios administrativos
Los administradores podrán crear usuarios con permisos administrativos.
Los preceptores no podrán crear administradores ni otros preceptores.

RF-15 — Gestión de usuarios
Los administradores podrán gestionar los usuarios del sistema de acuerdo con los permisos establecidos.

RF-16 — Restricción de acceso por docente
El sistema deberá verificar que un docente únicamente pueda acceder y modificar los cursos que tenga asignados. Dentro de esos cursos tendrá permisos para modificar todos sus datos, pero no podrá eliminarlos ni modificar su asignación.

##7. Información de los cursos
Cada curso deberá contar con información estructurada que permita mostrarla tanto en el catálogo como en su vista detallada.
La información mínima será:

Nombre
Descripción
Modalidad
Horarios
Meses de cursada
Fecha de inicio
Docente
Programa / contenidos

Durante el desarrollo podrán incorporarse otros datos, como requisitos, duración, ubicación, cupos, imagen o información adicional.

##8. Guía general de inscripción
La plataforma contará con una sección específica dentro de la página principal dedicada al proceso de inscripción.
Esta sección deberá explicar de manera clara:
Cómo inscribirse: pasos que debe seguir una persona interesada.
Documentación necesaria: documentos que deberá presentar.
Requisitos generales: condiciones necesarias para realizar la inscripción, si las hubiera.
Información adicional: fechas, lugares, horarios de atención o medios de contacto relevantes.
Esta información será gestionada desde el panel administrativo para permitir su actualización cuando cambien los procedimientos establecidos por la institución.

##9. Requisitos no funcionales

RNF-01 — Usabilidad
La información deberá presentarse de forma clara y comprensible para personas que no tengan conocimientos técnicos.

RNF-02 — Diseño responsive
La plataforma deberá funcionar correctamente en computadoras, tablets y dispositivos móviles.

RNF-03 — Seguridad
El acceso a las funciones administrativas deberá estar protegido mediante autenticación y autorización.

RNF-04 — Control de permisos
Cada operación administrativa deberá comprobar que el usuario tenga los permisos necesarios para realizarla.

RNF-05 — Mantenibilidad
La información de los cursos y de la guía de inscripción deberá poder actualizarse desde el panel administrativo sin modificar directamente el código fuente.

RNF-06 — Consistencia
La información publicada en el sitio deberá corresponder con la información almacenada y gestionada desde el panel administrativo.

RNF-07 — Accesibilidad
La interfaz deberá contemplar principios básicos de accesibilidad para facilitar el acceso a la información.

##10. Experiencia del visitante
El recorrido principal será:
Página principal → consultar cursos → seleccionar un curso → visualizar sus detalles → consultar la guía general de inscripción → realizar la inscripción mediante el procedimiento establecido por el CFL 401.
El visitante no necesitará crear una cuenta para consultar la información durante el MVP.

##11. Experiencia administrativa
El acceso administrativo dependerá del tipo de usuario.
El administrador podrá acceder a todas las funcionalidades disponibles y gestionar tanto cursos como usuarios.
El preceptor podrá gestionar cursos y asignar docentes, además de crear usuarios docentes, pero tendrá restringida la administración de usuarios con privilegios de administrador o preceptor.
El docente podrá acceder únicamente a los cursos que le hayan sido asignados y gestionar la información permitida de estos. La asignación deberá realizarla un administrador o preceptor.


##12. Matriz de permisos

Funcionalidad

                  Administrador         Preceptor                 Docente 


Ver cursos             ✓                    ✓                        ✓  

Crear cursos           ✓                    ✓                        ✗

 
Editar cualquier curso  ✓                   ✓                        ✗


Editar cursos asignados ✓                   ✓                        ✓


Eliminar cursos         ✓                   ✓                        ✗


Asignar docentes        ✓                   ✓                        ✗



Asignar cursos          ✓                   ✓                        ✗


Crear docentes          ✓                   ✓                        ✗


Crear preceptores       ✓                   ✗                        ✗


Crear administradores   ✓                   ✗                        ✗





##13. Fuera del alcance del MVP
La inscripción online queda explícitamente fuera del MVP. La plataforma únicamente proporcionará información sobre cómo realizarla.
También quedan fuera de esta primera versión el registro de alumnos, perfiles de alumnos, seguimiento académico, gestión de calificaciones, certificados, pagos online y otras funcionalidades destinadas a administrar la actividad académica de los estudiantes.
Las funcionalidades relacionadas con inteligencia artificial también podrán ser evaluadas como una extensión del proyecto, dependiendo de las decisiones posteriores del equipo.

##14. Criterio general de éxito
El MVP podrá considerarse cumplido cuando una persona que nunca haya utilizado el sitio pueda encontrar un curso, comprender qué ofrece, conocer su modalidad, horarios, período de cursada, fecha de inicio, docente y contenidos, y entender claramente cómo debe realizar la inscripción.
Al mismo tiempo, el personal autorizado deberá poder mantener actualizada la información desde el panel administrativo, respetando la jerarquía de permisos establecida para administradores, preceptores y docentes.

