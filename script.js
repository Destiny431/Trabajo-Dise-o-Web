const schedules = {
  "Matemática": ["Lunes, 3:00–4:00 p. m."],
  "Lenguaje": ["Miércoles, 3:00–4:00 p. m."],
  "Ciencias": ["Viernes, 2:00–3:00 p. m."]
};

const storageKey = "portalTutoriasRegistros";
const form = document.getElementById("registration-form");
const course = document.getElementById("course");
const studentName = document.getElementById("student-name");
const email = document.getElementById("email");
const schedule = document.getElementById("schedule");
const topic = document.getElementById("topic");
const message = document.getElementById("form-message");
const formTitle = document.getElementById("form-title");
const fields = [course, studentName, email, schedule]; // el tema es opcional: no se valida

/* ---------- Almacenamiento ---------- */

function getRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(records) ? records : [];
  } catch (e) {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(storageKey, JSON.stringify(records));
}

/* ---------- Validación (mensajes específicos por campo) ---------- */

const validators = {
  "course": () => (course.value ? "" : "Selecciona un curso."),
  "student-name": () => {
    const value = studentName.value.trim();
    if (!value) return "Escribe tu nombre completo.";
    return value.length < 3 ? "Escribe al menos 3 caracteres." : "";
  },
  "email": () => {
    if (!email.value.trim()) return "Ingresa tu correo electrónico.";
    return email.validity.valid ? "" : "Revisa el formato, por ejemplo: alumno@correo.com.";
  },
  "schedule": () => {
    if (schedule.value) return "";
    return course.value ? "Selecciona un horario." : "Primero selecciona un curso.";
  }
};

function showError(field, text) {
  document.getElementById(field.id + "-error").textContent = text;
  if (text) field.setAttribute("aria-invalid", "true");
  else field.removeAttribute("aria-invalid");
}

function validateField(field) {
  const error = validators[field.id]();
  showError(field, error);
  return !error;
}

// Valida todos los campos a la vez para mostrar todos los problemas juntos.
function validateForm() {
  return fields.map(validateField).every(Boolean);
}

// El error desaparece apenas el usuario corrige el campo.
fields.forEach(field => {
  const eventName = field.tagName === "SELECT" ? "change" : "input";
  field.addEventListener(eventName, () => {
    if (field.getAttribute("aria-invalid") === "true") validateField(field);
  });
});

/* ---------- Mensajes y horario ---------- */

function showMessage(type, text) {
  message.className = "notice " + type;
  message.textContent = text;
}

function hideMessage() {
  message.className = "notice hidden";
  message.textContent = "";
}

function updateSchedules() {
  const options = schedules[course.value] || [];
  schedule.innerHTML = '<option value="">Selecciona un horario</option>';
  options.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    schedule.appendChild(option);
  });
  // Con un único horario no hay nada que decidir.
  if (options.length === 1) schedule.value = options[0];
  showError(schedule, "");
}

function onCourseChange() {
  updateSchedules();
  showError(email, ""); // limpia un aviso de duplicado del curso anterior
  formTitle.textContent = course.value ? "Registro de " + course.value : "Registro de tutoría";
}

/* ---------- Lista de registros ---------- */

function renderRecords() {
  const list = document.getElementById("records-list");
  const records = getRecords();
  list.replaceChildren();

  document.getElementById("records-count").textContent = records.length ? "(" + records.length + ")" : "";
  document.getElementById("clear-records").disabled = !records.length;

  if (!records.length) {
    const p = document.createElement("p");
    p.textContent = "Aún no hay registros.";
    list.appendChild(p);
    return;
  }

  records.forEach((record, index) => {
    const item = document.createElement("div");
    item.className = "record-item";

    const text = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = record.course + " — " + record.name;
    const details = document.createElement("p");
    details.textContent = record.schedule + " | " + record.email;
    text.append(title, details);
    if (record.topic) {
      const topicLine = document.createElement("p");
      topicLine.textContent = "Tema: " + record.topic;
      text.appendChild(topicLine);
    }

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "danger";
    cancel.textContent = "Cancelar registro";
    cancel.dataset.index = index;
    cancel.setAttribute("aria-label", "Cancelar registro de " + record.course);

    item.append(text, cancel);
    list.appendChild(item);
  });
}

/* ---------- Eventos ---------- */

document.querySelectorAll("[data-course]").forEach(button =>
  button.addEventListener("click", () => {
    course.value = button.dataset.course;
    onCourseChange();
    document.getElementById("registro").scrollIntoView();
    (studentName.value.trim() ? email : studentName).focus({ preventScroll: true });
  })
);

course.addEventListener("change", onCourseChange);

form.addEventListener("submit", event => {
  event.preventDefault();
  hideMessage();

  if (!validateForm()) {
    showMessage("error", "Revisa los campos señalados antes de confirmar tu registro.");
    form.querySelector('[aria-invalid="true"]').focus();
    return;
  }

  const record = {
    course: course.value,
    name: studentName.value.trim(),
    email: email.value.trim(),
    schedule: schedule.value,
    topic: topic.value.trim()
  };

  const records = getRecords();
  const duplicate = records.some(
    item => item.course === record.course && item.email.toLowerCase() === record.email.toLowerCase()
  );
  if (duplicate) {
    showError(email, "Este correo ya está registrado en " + record.course + ".");
    showMessage("error", "Ya tienes un registro en " + record.course + ". Puedes cancelarlo en «Mis registros».");
    email.focus();
    return;
  }

  try {
    records.push(record);
    saveRecords(records);
  } catch (e) {
    showMessage("error", "No se pudo guardar el registro en este navegador.");
    return;
  }

  form.reset();
  showMessage("success", "¡Listo! Quedaste registrado en " + record.course + ": " + record.schedule + ".");
  renderRecords();
});

// Se ejecuta tras el reinicio (el navegador restaura los valores después del evento).
form.addEventListener("reset", () =>
  setTimeout(() => {
    fields.forEach(field => showError(field, ""));
    onCourseChange();
  }, 0)
);

// «Limpiar formulario» también oculta el mensaje anterior (el reinicio tras guardar no lo hace).
document.getElementById("reset-btn").addEventListener("click", hideMessage);

document.getElementById("records-list").addEventListener("click", event => {
  const button = event.target.closest("[data-index]");
  if (!button) return;
  const records = getRecords();
  const record = records[Number(button.dataset.index)];
  if (!record) return;
  if (confirm("¿Cancelar tu registro en " + record.course + "?")) {
    records.splice(Number(button.dataset.index), 1);
    saveRecords(records);
    renderRecords();
  }
});

document.getElementById("clear-records").addEventListener("click", () => {
  const total = getRecords().length;
  if (total && confirm("¿Borrar los " + total + " registros guardados en este navegador? Esta acción no se puede deshacer.")) {
    localStorage.removeItem(storageKey);
    renderRecords();
  }
});

/* ---------- Inicio ---------- */

updateSchedules();
renderRecords();
