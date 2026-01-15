/**
 * Crée un formulaire de filtre de dates avec des sélecteurs jour, mois et année
 * @param {HTMLElement} container - Élément DOM où le formulaire sera inséré
 * @param {number} anneeDebut - Année de début pour le filtre
 * @param {number} anneeFin - Année de fin pour le filtre
 * @param {Function} onChange - Fonction de callback appelée lorsqu'un filtre change
 */
function createFilterForm(container, anneeDebut, anneeFin, onChange) {
  // Créer le formulaire
  const form = document.createElement("form");
  form.className = "formulaire-filtre-dates";

  // Noms des mois en français
  const moisFrancais = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  // Créer le sélecteur de jour
  const selectJour = document.createElement("select");
  selectJour.id = "filtre-jour";
  selectJour.name = "jour";

  // Option par défaut pour le jour
  const optionJourDefaut = document.createElement("option");
  optionJourDefaut.value = "";
  optionJourDefaut.textContent = "-- Tous --";
  selectJour.appendChild(optionJourDefaut);

  // Ajouter les options pour les jours (1-31)
  for (let i = 1; i <= 31; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    selectJour.appendChild(option);
  }

  // Créer le sélecteur de mois
  const selectMois = document.createElement("select");
  selectMois.id = "filtre-mois";
  selectMois.name = "mois";

  // Option par défaut pour le mois
  const optionMoisDefaut = document.createElement("option");
  optionMoisDefaut.value = "";
  optionMoisDefaut.textContent = "-- Tous --";
  selectMois.appendChild(optionMoisDefaut);

  // Ajouter les options pour les mois
  for (let i = 0; i < 12; i++) {
    const option = document.createElement("option");
    option.value = i + 1; // Les mois sont indexés à partir de 1
    option.textContent = moisFrancais[i];
    selectMois.appendChild(option);
  }

  // Créer le sélecteur d'année
  const selectAnnee = document.createElement("select");
  selectAnnee.id = "filtre-annee";
  selectAnnee.name = "annee";

  // Option par défaut pour l'année
  const optionAnneeDefaut = document.createElement("option");
  optionAnneeDefaut.value = "";
  optionAnneeDefaut.textContent = "-- Tous --";
  selectAnnee.appendChild(optionAnneeDefaut);

  // Ajouter les options pour les années
  for (let i = anneeDebut; i <= anneeFin; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    selectAnnee.appendChild(option);
  }

  if (typeof onChange === "function") {
    let callback = function () {
      // Ajuster les jours valides en fonction du mois et de l'année sélectionnés
      onChange({
        day: selectJour.value ? parseInt(selectJour.value) : null,
        month: selectMois.value ? parseInt(selectMois.value) : null,
        year: selectAnnee.value ? parseInt(selectAnnee.value) : null,
      });
    };

    // Ajouter des écouteurs d'événements à chaque sélecteur
    selectJour.addEventListener("change", callback);
    selectMois.addEventListener("change", callback);
    selectAnnee.addEventListener("change", callback);
  }

  const fieldset = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent = "Filtrer";
  fieldset.appendChild(legend);
  form.append(fieldset);

  // Créer des wrappers pour chaque sélecteur avec des labels
  const jourWrapper = document.createElement("div");
  jourWrapper.className = "filtre-date-wrapper";
  const jourLabel = document.createElement("label");
  jourLabel.htmlFor = "filtre-jour";
  jourLabel.textContent = "Jour: ";
  jourWrapper.appendChild(jourLabel);
  jourWrapper.appendChild(selectJour);

  const moisWrapper = document.createElement("div");
  moisWrapper.className = "filtre-date-wrapper";
  const moisLabel = document.createElement("label");
  moisLabel.htmlFor = "filtre-mois";
  moisLabel.textContent = "Mois: ";
  moisWrapper.appendChild(moisLabel);
  moisWrapper.appendChild(selectMois);

  const anneeWrapper = document.createElement("div");
  anneeWrapper.className = "filtre-date-wrapper";
  const anneeLabel = document.createElement("label");
  anneeLabel.htmlFor = "filtre-annee";
  anneeLabel.textContent = "Année: ";
  anneeWrapper.appendChild(anneeLabel);
  anneeWrapper.appendChild(selectAnnee);

  // Ajouter les éléments au formulaire
  fieldset.appendChild(jourWrapper);
  fieldset.appendChild(moisWrapper);
  fieldset.appendChild(anneeWrapper);

  // Ajouter le formulaire au conteneur
  container.appendChild(form);

  // Retourner les sélecteurs pour permettre un accès externe
  return {
    formElement: form,
    jourSelect: selectJour,
    moisSelect: selectMois,
    anneeSelect: selectAnnee,
  };
}

/**
 * Fonction de filtrage des dates
 * if day is not null, show only the day elements that match the date
 * if it is null, show all day elements
 * same for month and year
 * @param {object} date - has properties year, month, day, which can be null.
 */
function filterDate(date) {
  console.log("Filtering date:", date);

  document.querySelectorAll("month-calendar").forEach((cal) => {
    if (date.day) {
      cal.shadowRoot.querySelectorAll(".day").forEach((e) => {
        if (e.classList.contains(`day-${date.day}`)) {
          e.style.display = "block";
        } else {
          e.style.display = "none";
        }
      });
    } else {
      cal.shadowRoot.querySelectorAll(".day").forEach((e) => {
        e.style.display = "block";
      });
    }

    // get month and year of that elements
    const month = parseInt(cal.getAttribute("month"));
    const year = parseInt(cal.getAttribute("year"));

    if (
      (date.month && date.month !== month) ||
      (date.year && date.year !== year)
    ) {
      cal.style.display = "none";
    } else {
      cal.style.display = "block";
    }

    // show / hide the year when there is a filter on the month
    if (date.month) {
      cal.shadowRoot.querySelectorAll(".toggle-year-header").forEach((e) => {
        e.style.display = "inline";
      });
    } else {
      cal.shadowRoot.querySelectorAll(".toggle-year-header").forEach((e) => {
        e.style.display = "none";
      });
    }
  });
}
