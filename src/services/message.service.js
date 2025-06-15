const BASE_URL = "https://backend-js-server-vrai.onrender.com/messages";
// const BASE_URL = "http://localhost:3000/messages";

async function fetchData(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  return await response.json();
}

function getCurrentUser() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user?.id) throw new Error("Utilisateur non connecté");
  return user;
}

export async function sendMessage(messageData) {
  try {
    const user = getCurrentUser();
    
    const message = {
      ...messageData,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      status: 'sent', // sent, delivered, read
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };

    return await fetchData(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error("Erreur envoi message:", error);
    throw error;
  }
}

export async function getMessagesBetweenUsers(userId1, userId2) {
  try {
    const messages = await fetchData(`${BASE_URL}?senderId=${userId1}&receiverId=${userId2}`);
    const reverseMessages = await fetchData(`${BASE_URL}?senderId=${userId2}&receiverId=${userId1}`);
    
    return [...messages, ...reverseMessages].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
  } catch (error) {
    console.error("Erreur récupération messages:", error);
    throw error;
  }
}

export async function getGroupMessages(groupId) {
  try {
    return await fetchData(`${BASE_URL}?groupId=${groupId}`);
  } catch (error) {
    console.error("Erreur récupération messages groupe:", error);
    throw error;
  }
}

export async function markMessageAsRead(messageId) {
  try {
    return await fetchData(`${BASE_URL}/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: 'read' }),
    });
  } catch (error) {
    console.error("Erreur marquage message lu:", error);
    throw error;
  }
}

export async function markMessageAsDelivered(messageId) {
  try {
    return await fetchData(`${BASE_URL}/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: 'delivered' }),
    });
  } catch (error) {
    console.error("Erreur marquage message livré:", error);
    throw error;
  }
}

export async function getUserConversations(userId) {
  try {
    const sentMessages = await fetchData(`${BASE_URL}?senderId=${userId}`);
    const receivedMessages = await fetchData(`${BASE_URL}?receiverId=${userId}`);
    
    const conversations = new Map();
    
    [...sentMessages, ...receivedMessages].forEach(message => {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const conversationId = message.groupId || otherUserId;
      
      if (!conversations.has(conversationId)) {
        conversations.set(conversationId, {
          id: conversationId,
          isGroup: !!message.groupId,
          lastMessage: message,
          unreadCount: 0,
          messages: []
        });
      }
      
      const conversation = conversations.get(conversationId);
      conversation.messages.push(message);
      
      // Compter les messages non lus
      if (message.receiverId === userId && message.status !== 'read') {
        conversation.unreadCount++;
      }
      
      // Garder le dernier message
      if (new Date(message.timestamp) > new Date(conversation.lastMessage.timestamp)) {
        conversation.lastMessage = message;
      }
    });
    
    return Array.from(conversations.values()).sort((a, b) => 
      new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
    );
  } catch (error) {
    console.error("Erreur récupération conversations:", error);
    throw error;
  }
}