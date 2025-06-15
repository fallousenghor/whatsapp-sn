import {
  sortContactsAlphabetically,
  filterContacts,
  handleContactSearch,
} from "../utils/search.utils";
import { getContactsByUserId } from "../services/contact.service";

export async function setupNouvelleDiscussionEvents() {
  const contactsContainer = document.getElementById("contacts-list");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const searchInput = document.querySelector(
    "#nouvelleDiscussion input[type='text']"
  );

  if (!currentUser?.id || !contactsContainer || !searchInput) return;

  let allContacts = [];

  try {
    allContacts = await getContactsByUserId(currentUser.id);

    const renderContacts = (contacts) => {
      const nonBlockedContacts = contacts.filter((contact) => !contact.blocked);

      contactsContainer.innerHTML = nonBlockedContacts
        .map(
          (contact) => `
          <div class="contact-item flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-800"
               data-contact-id="${contact.id}">
            <div class="flex items-center">
              <div class="w-12 h-12 rounded-full bg-black flex-shrink-0 mr-3 overflow-hidden">
                <div class="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex justify-center items-center font-bold text-white">
                  ${contact.prenom.charAt(0).toUpperCase()}${contact.nom
            .charAt(0)
            .toUpperCase()}
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-white text-base">${contact.prenom} ${
            contact.nom
          }</div>
                <div class="text-gray-400 text-sm">${contact.telephone}</div>
              </div>
            </div>
          </div>
        `
        )
        .join("");

      attachContactListeners();
    };

    const attachContactListeners = () => {
      document.querySelectorAll(".contact-item").forEach((item) => {
        item.addEventListener("click", () => {
          const contactId = item.dataset.contactId;
          const contact = allContacts.find((c) => c.id === contactId);
          if (contact) {
            document.getElementById(
              "contactName"
            ).textContent = `${contact.prenom} ${contact.nom}`;
          }
        });
      });
    };

    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.trim();
      handleContactSearch(searchTerm, allContacts, renderContacts);
    });

    renderContacts(allContacts);
  } catch (error) {
    console.error("Erreur lors du chargement des contacts:", error);
    contactsContainer.innerHTML = `
      <div class="text-red-500 p-4">
        Une erreur est survenue lors du chargement des contacts.
      </div>
    `;
  }
}
