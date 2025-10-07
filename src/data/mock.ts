export const azubis = [
  { id: 'a1', name: 'Lukas Keller', role: 'azubi', alter: 18, ort: 'Stuttgart', lat: 48.7758, lon: 9.1829, schulabschluss: 'Realschule', sucht: ['Zimmermann','Dachdecker'], avatarUrl: 'https://randomuser.me/api/portraits/men/11.jpg' },
  { id: 'a2', name: 'Mia Schröder', role: 'azubi', alter: 19, ort: 'Ludwigsburg', lat: 48.8973, lon: 9.1916, schulabschluss: 'Abi', sucht: ['KFZ-Mechatroniker'], avatarUrl: 'https://randomuser.me/api/portraits/women/21.jpg' },
  { id: 'a3', name: 'Can Yilmaz', role: 'azubi', alter: 17, ort: 'Esslingen', lat: 48.7396, lon: 9.3047, schulabschluss: 'Hauptschule', sucht: ['Schweißer','Elektriker'], avatarUrl: 'https://randomuser.me/api/portraits/men/31.jpg' },
  { id: 'a4', name: 'Sofia Weber', role: 'azubi', alter: 20, ort: 'Sindelfingen', lat: 48.7081, lon: 9.0037, schulabschluss: 'Fachabi', sucht: ['Sanitär-Heizung-Klima'], avatarUrl: 'https://randomuser.me/api/portraits/women/41.jpg' },
  { id: 'a5', name: 'Jonas Brandt', role: 'azubi', alter: 18, ort: 'Fellbach', lat: 48.8060, lon: 9.2795, schulabschluss: 'Realschule', sucht: ['Elektriker','KFZ-Mechatroniker'], avatarUrl: 'https://randomuser.me/api/portraits/men/51.jpg' }
];

export const firmen = [
  { id: 'f1', name: 'Holzbau Huber', role: 'firma', branche: 'Zimmerei', ort: 'Stuttgart', lat: 48.7758, lon: 9.1829, avatarUrl: 'https://picsum.photos/seed/holzbau/200' },
  { id: 'f2', name: 'Autohaus König', role: 'firma', branche: 'KFZ', ort: 'Ludwigsburg', lat: 48.8973, lon: 9.1916, avatarUrl: 'https://picsum.photos/seed/autohaus/200' },
  { id: 'f3', name: 'Schweißtechnik Maier', role: 'firma', branche: 'Schweißerei', ort: 'Esslingen', lat: 48.7396, lon: 9.3047, avatarUrl: 'https://picsum.photos/seed/schweiss/200' },
  { id: 'f4', name: 'Elektro Schäfer', role: 'firma', branche: 'Elektrik', ort: 'Sindelfingen', lat: 48.7081, lon: 9.0037, avatarUrl: 'https://picsum.photos/seed/elektro/200' }
];

export const initialMatches = [
  { id: 'm1', azubiId: 'a1', firmaId: 'f1', createdAt: Date.now() - 1000 * 60 * 60 * 24 },
  { id: 'm2', azubiId: 'a2', firmaId: 'f2', createdAt: Date.now() - 1000 * 60 * 60 * 6 },
];

export const initialMessages = [
  { id: 'msg1', chatId: 'a1_f1', senderId: 'a1', text: 'Hallo! Ich interessiere mich für die Zimmerer-Ausbildung.', createdAt: Date.now() - 1000 * 60 * 60 * 23 },
  { id: 'msg2', chatId: 'a1_f1', senderId: 'f1', text: 'Hi Lukas, lass uns gern sprechen!', createdAt: Date.now() - 1000 * 60 * 60 * 22 },
  { id: 'msg3', chatId: 'a2_f2', senderId: 'a2', text: 'Gibt es noch Plätze als KFZ-Mechatronikerin?', createdAt: Date.now() - 1000 * 60 * 30 },
];
