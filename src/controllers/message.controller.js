import { 
  sendMessage, 
  getMessagesBetweenUsers, 
  getGroupMessages,
  markMessageAsRead
} from "../services/message.service.js";
import { getContactById } from "../services/contact.service.js";
import { getGroupeById } from "../services/groupe.service.js";
import { refreshDiscussions } from "./discussion.controller.js";

let currentConversation = null;
let messagePollingInterval = null;

export function setupMessageEvents() {
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');

  if (!messageInput || !sendButton) return;

  // Envoi de message
  sendButton.addEventListener('click', handleSendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Activer/désactiver le bouton d'envoi selon le contenu
  messageInput.addEventListener('input', () => {
    const hasContent = messageInput.value.trim().length > 0;
    sendButton.disabled = !hasContent || !currentConversation;
    sendButton.classList.toggle('opacity-50', !hasContent || !currentConversation);
  });

  // Démarrer le polling des messages
  startMessagePolling();
}

async function handleSendMessage() {
  const messageInput = document.getElementById('message-input');
  const messageText = messageInput.value.trim();
  
  if (!messageText || !currentConversation) return;

  try {
    const messageData = {
      content: messageText,
      type: 'text'
    };

    if (currentConversation.type === 'contact') {
      messageData.receiverId = currentConversation.id;
    } else if (currentConversation.type === 'group') {
      messageData.groupId = currentConversation.id;
    }

    await sendMessage(messageData);
    messageInput.value = '';
    
    // Désactiver le bouton d'envoi
    const sendButton = document.getElementById('send-button');
    sendButton.disabled = true;
    sendButton.classList.add('opacity-50');
    
    // Rafraîchir les messages et discussions
    await loadMessages();
    await refreshDiscussions();
    
  } catch (error) {
    console.error('Erreur envoi message:', error);
    alert('Erreur lors de l\'envoi du message');
  }
}

export async function setCurrentConversation(type, id, name) {
  currentConversation = { type, id, name };
  
  // Mettre à jour l'interface
  const contactNameElement = document.getElementById('contactName');
  const firstCharElement = document.getElementById('firstChar');
  const contactStatusElement = document.getElementById('contactStatus');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  
  if (contactNameElement) {
    contactNameElement.textContent = name;
  }
  
  if (firstCharElement && name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    firstCharElement.textContent = initials;
    firstCharElement.innerHTML = initials;
  }

  if (contactStatusElement) {
    contactStatusElement.textContent = type === 'group' ? 'Groupe' : 'en ligne';
  }

  // Activer la zone de saisie
  if (messageInput) {
    messageInput.disabled = false;
    messageInput.placeholder = `Envoyer un message à ${name}`;
  }

  if (sendButton) {
    sendButton.disabled = !messageInput?.value.trim();
    sendButton.classList.toggle('opacity-50', !messageInput?.value.trim());
  }

  // Charger les messages
  await loadMessages();
}

async function loadMessages() {
  if (!currentConversation) return;

  const messagesContainer = document.getElementById('messages-container');
  if (!messagesContainer) return;

  try {
    let messages = [];
    const currentUser = JSON.parse(localStorage.getItem('user'));

    if (currentConversation.type === 'contact') {
      messages = await getMessagesBetweenUsers(currentUser.id, currentConversation.id);
    } else if (currentConversation.type === 'group') {
      messages = await getGroupMessages(currentConversation.id);
    }

    // Marquer les messages comme lus
    const unreadMessages = messages.filter(m => 
      m.receiverId === currentUser.id && m.status !== 'read'
    );
    
    for (const message of unreadMessages) {
      await markMessageAsRead(message.id);
    }

    displayMessages(messages, currentUser.id);
    
  } catch (error) {
    console.error('Erreur chargement messages:', error);
    displayEmptyMessages();
  }
}

function displayEmptyMessages() {
  const messagesContainer = document.getElementById('messages-container');
  if (!messagesContainer) return;

  messagesContainer.innerHTML = `
    <div class="text-center p-8 text-gray-400">
      <i class="fas fa-comment-dots text-4xl mb-4"></i>
      <p>Aucun message dans cette conversation</p>
      <p class="text-sm mt-2">Envoyez le premier message !</p>
    </div>
  `;
}

function displayMessages(messages, currentUserId) {
  const messagesContainer = document.getElementById('messages-container');
  if (!messagesContainer) return;

  if (messages.length === 0) {
    displayEmptyMessages();
    return;
  }

  // Grouper les messages par date
  const messagesByDate = groupMessagesByDate(messages);
  
  let messagesHTML = '';

  Object.entries(messagesByDate).forEach(([date, dayMessages]) => {
    // Ajouter le séparateur de date
    messagesHTML += `
      <div class="text-center mb-6">
        <span class="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
          ${formatDateSeparator(date)}
        </span>
      </div>
    `;

    // Ajouter les messages du jour
    dayMessages.forEach(message => {
      const isOwn = message.senderId === currentUserId;
      const time = new Date(message.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      if (isOwn) {
        messagesHTML += `
          <div class="flex justify-end mb-4">
            <div class="message-bubble bg-green-600 p-3 max-w-xs lg:max-w-md">
              <p class="text-sm text-white break-words">${escapeHtml(message.content)}</p>
              <div class="flex items-center justify-end space-x-1 mt-1">
                <span class="text-xs text-green-200">${time}</span>
                <i class="fas fa-check-double ${getStatusIcon(message.status)}"></i>
              </div>
            </div>
          </div>
        `;
      } else {
        messagesHTML += `
          <div class="flex items-start space-x-2 mb-4">
            <div class="avatar bg-blue-500 text-xs">
              ${currentConversation.name ? currentConversation.name.split(' ').map(n => n[0]).join('') : 'U'}
            </div>
            <div class="message-bubble bg-gray-700 p-3 max-w-xs lg:max-w-md">
              <p class="text-sm text-white break-words">${escapeHtml(message.content)}</p>
              <span class="text-xs text-gray-400">${time}</span>
            </div>
          </div>
        `;
      }
    });
  });

  messagesContainer.innerHTML = messagesHTML;
  
  // Scroll vers le bas
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function groupMessagesByDate(messages) {
  const groups = {};
  
  messages.forEach(message => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });

  return groups;
}

function formatDateSeparator(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Aujourd\'hui';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Hier';
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getStatusIcon(status) {
  switch (status) {
    case 'sent':
      return 'text-gray-400';
    case 'delivered':
      return 'text-blue-300';
    case 'read':
      return 'text-blue-400';
    default:
      return 'text-gray-400';
  }
}

function startMessagePolling() {
  if (messagePollingInterval) {
    clearInterval(messagePollingInterval);
  }
  
  messagePollingInterval = setInterval(async () => {
    if (currentConversation) {
      await loadMessages();
    }
  }, 3000); // Vérifier les nouveaux messages toutes les 3 secondes
}

export function stopMessagePolling() {
  if (messagePollingInterval) {
    clearInterval(messagePollingInterval);
    messagePollingInterval = null;
  }
}

// Fonction pour réinitialiser la conversation
export function clearCurrentConversation() {
  currentConversation = null;
  
  const contactNameElement = document.getElementById('contactName');
  const firstCharElement = document.getElementById('firstChar');
  const contactStatusElement = document.getElementById('contactStatus');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const messagesContainer = document.getElementById('messages-container');
  
  if (contactNameElement) {
    contactNameElement.textContent = 'Sélectionnez une conversation';
  }
  
  if (firstCharElement) {
    firstCharElement.innerHTML = '<i class="fas fa-user"></i>';
  }

  if (contactStatusElement) {
    contactStatusElement.textContent = '';
  }

  if (messageInput) {
    messageInput.disabled = true;
    messageInput.placeholder = 'Entrez un message';
    messageInput.value = '';
  }

  if (sendButton) {
    sendButton.disabled = true;
    sendButton.classList.add('opacity-50');
  }

  if (messagesContainer) {
    messagesContainer.innerHTML = `
      <div class="text-center p-8 text-gray-400">
        <i class="fas fa-comment-dots text-4xl mb-4"></i>
        <p>Sélectionnez une conversation pour commencer à discuter</p>
      </div>
    `;
  }
}