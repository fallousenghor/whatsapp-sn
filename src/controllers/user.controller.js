import { redirectTo, loadView } from "../router.js";
import { setupLoginEvents } from "./login.controller.js";
import { createUser, getUserByTelephone } from "../services/user.service.js";
import { validateRegisterForm } from "../validators/validation.js";
import { showError } from "../utils/utils.js";

export function setupFormEvents() {
  const form = document.getElementById("registerForm");
  const prenomInput = document.getElementById("prenom");
  const nomInput = document.getElementById("nom");
  const indicatifSelect = document.getElementById("indicatif");
  const telephoneInput = document.getElementById("telephone");
  const redirectToLoginLink = document.getElementById("redirectToLogin");
  const addContactBtn = document.getElementById("addContactBtn");

  if (!form || !prenomInput || !nomInput || !indicatifSelect || !telephoneInput)
    return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const isValid = validateRegisterForm(form);
    if (!isValid) return;

    const prenom = prenomInput.value.trim();
    const nom = nomInput.value.trim();
    const indicatif = indicatifSelect.value;
    const telephone = telephoneInput.value.trim().replace(/\s+/g, "");
    const numeroComplet = indicatif + telephone;

    try {
      const existingUser = await getUserByTelephone(numeroComplet);
      if (existingUser) {
        showError("Ce numéro est déjà utilisé. Veuillez vous connecter.");
        return;
      }

      const user = { prenom, nom, telephone: numeroComplet };
      const createdUser = await createUser(user);

      localStorage.setItem("user", JSON.stringify(createdUser));

      redirectTo("/views/pages/login.views.html", () => {
        setupLoginEvents(createdUser.telephone);
      });
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      showError("Une erreur est survenue lors de la création du compte.");
    }
  });

  if (addContactBtn) {
    addContactBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const prenom = prenomInput.value.trim();
      const nom = nomInput.value.trim();
      const indicatif = indicatifSelect.value;
      const telephone = telephoneInput.value.trim().replace(/\s+/g, "");

      if (!prenom || !nom || !indicatif || !telephone) {
        alert("Merci de remplir tous les champs avant d'ajouter un contact.");
        return;
      }

      const contact = {
        prenom,
        nom,
        telephone: indicatif + telephone,
        createdAt: new Date().toISOString(),
      };

      console.log("Contact ajouté :", contact);

      let contacts = JSON.parse(localStorage.getItem("contacts") || "[]");
      contacts.push(contact);
      localStorage.setItem("contacts", JSON.stringify(contacts));

      alert("Contact ajouté avec succès !");
    });
  }

  if (redirectToLoginLink) {
    redirectToLoginLink.addEventListener("click", (e) => {
      e.preventDefault();
      loadView("/views/pages/login.views.html", setupLoginEvents);
    });
  }
}
