export const templates = {
  contactInfo: (contact) => `
    <div id="reurnInfo" class="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 overflow-hidden transform transition-all">
        <div class="relative bg-green-600 p-6">
          <div class="absolute top-4 right-4">
            <button class="text-white hover:text-gray-200 close-btn">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center text-green-600 text-2xl font-bold">
              ${contact.prenom[0]}${contact.nom[0]}
            </div>
            <div class="text-white">
              <h2 class="text-xl font-bold">${contact.prenom} ${
    contact.nom
  }</h2>
              <p class="text-green-100">Informations du contact</p>
            </div>
          </div>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="space-y-3">
            <div class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Nom complet</p>
                <p class="font-medium dark:text-white">${contact.prenom} ${
    contact.nom
  }</p>
              </div>
            </div>

            <div class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                <p class="font-medium dark:text-white">${contact.telephone}</p>
              </div>
            </div>

            <div class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                <p class="font-medium ${
                  contact.blocked ? "text-red-500" : "text-green-500"
                }">
                  ${contact.blocked ? "Bloqué" : "Actif"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  blockedContactsList: (blockedContacts) => {
    if (blockedContacts.length === 0) {
      return `<div class="p-4 text-center text-gray-400">Aucun contact bloqué</div>`;
    }

    return blockedContacts
      .map(
        (contact) => `
        <div class="blocked-contact-item flex items-center justify-between p-4 hover:bg-gray-800" data-contact-id="${contact.id}">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white">
              ${contact.prenom[0]}${contact.nom[0]}
            </div>
            <div>
              <h3 class="text-white font-medium">${contact.prenom} ${contact.nom}</h3>
              <p class="text-gray-400 text-sm">${contact.telephone}</p>
            </div>
          </div>
          <button class="unblock-btn text-green-500 hover:text-green-400">
            <i class="fas fa-unlock"></i>
          </button>
        </div>
      `
      )
      .join("");
  },

  blockedContactsError: `<div class="p-4 text-center text-red-500">Erreur lors du chargement des contacts bloqués</div>`,

  groupesList: (groupes) => {
    if (groupes.length === 0) {
      return `
        <div class="text-center p-8">
          <p class="text-gray-500">Aucun groupe trouvé</p>
        </div>`;
    }

    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        ${groupes
          .map(
            (g) => `
          <div class="groupe-item border-b border-gray-200 dark:border-gray-700 last:border-none" data-group-id="${
            g.id
          }">
            <div class="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
              <div class="flex items-center space-x-4">
                <div class="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                  <i class="fas fa-users text-white group-icon"></i>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">${
                    g.nom
                  }</h3>
                  <p class="text-sm text-gray-500">
                    <i class="fas fa-user-friends text-gray-400"></i> ${
                      g.membres.length
                    } ${g.membres.length > 1 ? "membres" : "membre"}
                  </p>
                </div>
              </div>
              <button 
                class="text-sm text-blue-500 hover:text-blue-400"
                onclick="showContactsToAdd('${g.id}')"
              >
                Ajouter des membres
              </button>
            </div>
            <div id="contacts-list-${
              g.id
            }" class="hidden p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <!-- La liste des contacts sera injectée ici -->
            </div>
          </div>
        `
          )
          .join("")}
      </div>`;
  },
};
