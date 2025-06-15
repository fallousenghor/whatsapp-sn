import { 
  sendMessage, 
  getMessagesBetweenUsers, 
  getGroupMessages,
  markMessageAsRead,
  getUserConversations 
} from "../services/message.service.js";
import { getContactById } from "../services/contact.service.js";
import { getGroupeById } from "../services/groupe.service.js";

let currentConversation = null;
let messagePollingInterval = null;

export function setupMessageEvents() {
  const messageInput = document.querySelector('input[placeholder="Entrez un message"]');
  const sendButton = document.querySelector('.bg-green-600');
  const messagesContainer = document.querySelector('.flex-1.p-4.overflow-y-auto');

  if (!messageInput || !sendButton) return;

  // Envoi de message
  sendButton.addEventListener('click', handleSendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  });

  // Démarrer le polling des messages
  startMessagePolling();
}

async function handleSendMessage() {
  const messageInput = document.querySelector('input[placeholder="Entrez un message"]');
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
    
    // Rafraîchir les messages
    await loadMessages();
    
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
  
  if (contactNameElement) {
    contactNameElement.textContent = name;
  }
  
  if (firstCharElement && name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    firstCharElement.textContent = initials;
  }

  // Charger les messages
  await loadMessages();
}

async function loadMessages() {
  if (!currentConversation) return;

  const messagesContainer = document.querySelector('.flex-1.p-4.overflow-y-auto');
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
  }
}

function displayMessages(messages, currentUserId) {
  const messagesContainer = document.querySelector('.flex-1.p-4.overflow-y-auto');
  if (!messagesContainer) return;

  // Garder les séparateurs de date
  const dateSeperators = `
    <div class="text-center mb-6">
      <span class="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
        ${new Date().toLocaleDateString('fr-FR')}
      </span>
    </div>
  `;

  const messagesHTML = messages.map(message => {
    const isOwn = message.senderId === currentUserId;
    const time = new Date(message.timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (isOwn) {
      return `
        <div class="flex justify-end mb-4">
          <div class="message-bubble bg-green-600 p-3 max-w-xs">
            <p class="text-sm text-white">${message.content}</p>
            <div class="flex items-center justify-end space-x-1 mt-1">
              <span class="text-xs text-green-200">${time}</span>
              <i class="fas fa-check-double ${getStatusIcon(message.status)}"></i>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="flex items-start space-x-2 mb-4">
          <div class="avatar bg-blue-500 text-xs">
            ${currentConversation.name ? currentConversation.name.split(' ').map(n => n[0]).join('') : 'U'}
          </div>
          <div class="message-bubble bg-gray-700 p-3 max-w-xs">
            <p class="text-sm text-white">${message.content}</p>
            <span class="text-xs text-gray-400">${time}</span>
          </div>
        </div>
      `;
    }
  }).join('');

  messagesContainer.innerHTML = dateSeperators + messagesHTML;
  
  // Scroll vers le bas
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
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