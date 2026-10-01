import type { LocaleCode } from '../types';

const copy = {
  es: {
    mode: 'Carrera de Banderas', detail: 'Compite en tiempo real con 2–8 personas', private: 'CARRERA PRIVADA',
    createTitle: 'Crea una carrera', createDetail: 'Elige la ruta, comparte el código y resuelve 12 banderas antes que los demás.',
    route: 'Recorrido', difficulty: 'Dificultad', create: 'Crear carrera', joinTitle: '¿Te invitaron?',
    code: 'Código de 6 caracteres', join: 'Entrar con código', account: 'Necesitas una cuenta',
    accountDetail: 'La cuenta permite reservar tu plaza y recuperar la carrera si pierdes conexión.', login: 'Iniciar sesión o crear cuenta',
    lobby: 'Sala de espera', share: 'Compartir invitación', ready: 'Listo', notReady: 'Preparando', connected: 'En el lobby',
    disconnected: 'Sin conexión', reviewing: 'Viendo resultado', break: 'Pausa entre rondas', waitingOne: 'Esperando a {count} persona',
    waitingMany: 'Esperando a {count} personas', start: 'Comenzar carrera', leave: 'Salir de la sala', host: 'Anfitrión',
    you: 'Tú', countdown: 'Prepárate', go: '¡YA!', progress: '{current}/12', question: '¿De qué país es esta bandera?',
    unstable: 'Conexión inestable. El servidor confirmará tu avance.', result: 'Resultado de la carrera',
    completed: 'Meta completada', timeout: 'Ganador por avance', rematch: 'Volver al lobby', shareResult: 'Compartir resultado',
    mistakes: '{count} errores', time: 'Tiempo', winner: 'Ganador', error: 'No pudimos completar la operación.', retry: 'Reintentar',
    easy: 'Fácil', normal: 'Normal', hard: 'Difícil', World: 'Mundo', Americas: 'América', Europe: 'Europa', Asia: 'Asia', Africa: 'África', Oceania: 'Oceanía',
  },
  en: {
    mode: 'Flag Race', detail: 'Race 2–8 people in real time', private: 'PRIVATE RACE', createTitle: 'Create a race',
    createDetail: 'Pick a route, share the code, and solve 12 flags before everyone else.', route: 'Route', difficulty: 'Difficulty',
    create: 'Create race', joinTitle: 'Were you invited?', code: '6-character code', join: 'Join with code', account: 'An account is required',
    accountDetail: 'Your account reserves your place and restores the race after a connection loss.', login: 'Sign in or create account',
    lobby: 'Waiting room', share: 'Share invitation', ready: 'Ready', notReady: 'Getting ready', connected: 'In the lobby',
    disconnected: 'Offline', reviewing: 'Viewing result', break: 'Between-round break', waitingOne: 'Waiting for {count} person',
    waitingMany: 'Waiting for {count} people', start: 'Start race', leave: 'Leave room', host: 'Host', you: 'You', countdown: 'Get ready',
    go: 'GO!', progress: '{current}/12', question: 'Which country does this flag belong to?', unstable: 'Unstable connection. The server will confirm your progress.',
    result: 'Race result', completed: 'Finish line reached', timeout: 'Winner by progress', rematch: 'Return to lobby', shareResult: 'Share result',
    mistakes: '{count} mistakes', time: 'Time', winner: 'Winner', error: 'We could not complete the operation.', retry: 'Try again',
    easy: 'Easy', normal: 'Normal', hard: 'Hard', World: 'World', Americas: 'Americas', Europe: 'Europe', Asia: 'Asia', Africa: 'Africa', Oceania: 'Oceania',
  },
  pt: {
    mode: 'Corrida de Bandeiras', detail: 'Compita em tempo real com 2–8 pessoas', private: 'CORRIDA PRIVADA', createTitle: 'Crie uma corrida',
    createDetail: 'Escolha a rota, compartilhe o código e resolva 12 bandeiras antes dos outros.', route: 'Percurso', difficulty: 'Dificuldade',
    create: 'Criar corrida', joinTitle: 'Recebeu um convite?', code: 'Código de 6 caracteres', join: 'Entrar com código', account: 'Você precisa de uma conta',
    accountDetail: 'A conta reserva sua vaga e recupera a corrida se a conexão cair.', login: 'Entrar ou criar conta', lobby: 'Sala de espera',
    share: 'Compartilhar convite', ready: 'Pronto', notReady: 'Preparando', connected: 'Na sala', disconnected: 'Sem conexão', reviewing: 'Vendo resultado',
    break: 'Pausa entre rodadas', waitingOne: 'Esperando {count} pessoa', waitingMany: 'Esperando {count} pessoas', start: 'Começar corrida',
    leave: 'Sair da sala', host: 'Anfitrião', you: 'Você', countdown: 'Prepare-se', go: 'JÁ!', progress: '{current}/12',
    question: 'De que país é esta bandeira?', unstable: 'Conexão instável. O servidor confirmará seu avanço.', result: 'Resultado da corrida',
    completed: 'Chegada concluída', timeout: 'Vencedor por avanço', rematch: 'Voltar à sala', shareResult: 'Compartilhar resultado',
    mistakes: '{count} erros', time: 'Tempo', winner: 'Vencedor', error: 'Não foi possível concluir a operação.', retry: 'Tentar novamente',
    easy: 'Fácil', normal: 'Normal', hard: 'Difícil', World: 'Mundo', Americas: 'América', Europe: 'Europa', Asia: 'Ásia', Africa: 'África', Oceania: 'Oceania',
  },
  fr: {
    mode: 'Course aux drapeaux', detail: 'Affrontez 2 à 8 personnes en temps réel', private: 'COURSE PRIVÉE', createTitle: 'Créer une course',
    createDetail: 'Choisissez le parcours, partagez le code et trouvez 12 drapeaux avant les autres.', route: 'Parcours', difficulty: 'Difficulté',
    create: 'Créer la course', joinTitle: 'Vous avez une invitation ?', code: 'Code à 6 caractères', join: 'Rejoindre avec le code', account: 'Un compte est requis',
    accountDetail: 'Le compte réserve votre place et restaure la course après une coupure.', login: 'Se connecter ou créer un compte', lobby: "Salle d'attente",
    share: "Partager l'invitation", ready: 'Prêt', notReady: 'Préparation', connected: 'Dans le salon', disconnected: 'Hors ligne', reviewing: 'Consulte le résultat',
    break: 'Pause entre les manches', waitingOne: 'En attente de {count} personne', waitingMany: 'En attente de {count} personnes', start: 'Lancer la course',
    leave: 'Quitter la salle', host: 'Hôte', you: 'Vous', countdown: 'Préparez-vous', go: 'PARTEZ !', progress: '{current}/12',
    question: 'À quel pays appartient ce drapeau ?', unstable: 'Connexion instable. Le serveur confirmera votre progression.', result: 'Résultat de la course',
    completed: "Ligne d'arrivée franchie", timeout: 'Gagnant à la progression', rematch: 'Retour au salon', shareResult: 'Partager le résultat',
    mistakes: '{count} erreurs', time: 'Temps', winner: 'Gagnant', error: "L'opération n'a pas pu aboutir.", retry: 'Réessayer',
    easy: 'Facile', normal: 'Normal', hard: 'Difficile', World: 'Monde', Americas: 'Amériques', Europe: 'Europe', Asia: 'Asie', Africa: 'Afrique', Oceania: 'Océanie',
  },
  de: {
    mode: 'Flaggenrennen', detail: 'Tritt in Echtzeit gegen 2–8 Personen an', private: 'PRIVATES RENNEN', createTitle: 'Rennen erstellen',
    createDetail: 'Wähle die Route, teile den Code und löse 12 Flaggen vor allen anderen.', route: 'Route', difficulty: 'Schwierigkeit',
    create: 'Rennen erstellen', joinTitle: 'Wurdest du eingeladen?', code: '6-stelliger Code', join: 'Mit Code beitreten', account: 'Ein Konto ist erforderlich',
    accountDetail: 'Das Konto reserviert deinen Platz und stellt das Rennen nach Verbindungsverlust wieder her.', login: 'Anmelden oder Konto erstellen', lobby: 'Warteraum',
    share: 'Einladung teilen', ready: 'Bereit', notReady: 'Vorbereitung', connected: 'In der Lobby', disconnected: 'Offline', reviewing: 'Sieht Ergebnis an',
    break: 'Pause zwischen Runden', waitingOne: 'Warten auf {count} Person', waitingMany: 'Warten auf {count} Personen', start: 'Rennen starten',
    leave: 'Raum verlassen', host: 'Gastgeber', you: 'Du', countdown: 'Mach dich bereit', go: 'LOS!', progress: '{current}/12',
    question: 'Zu welchem Land gehört diese Flagge?', unstable: 'Instabile Verbindung. Der Server bestätigt deinen Fortschritt.', result: 'Rennergebnis',
    completed: 'Ziel erreicht', timeout: 'Sieger nach Fortschritt', rematch: 'Zurück zur Lobby', shareResult: 'Ergebnis teilen',
    mistakes: '{count} Fehler', time: 'Zeit', winner: 'Sieger', error: 'Der Vorgang konnte nicht abgeschlossen werden.', retry: 'Erneut versuchen',
    easy: 'Leicht', normal: 'Normal', hard: 'Schwer', World: 'Welt', Americas: 'Amerika', Europe: 'Europa', Asia: 'Asien', Africa: 'Afrika', Oceania: 'Ozeanien',
  },
} as const;

export type RaceCopyKey = keyof typeof copy.es;

export const raceText = (language: LocaleCode, key: RaceCopyKey, values?: Record<string, string | number>): string => {
  let value: string = copy[language][key];
  Object.entries(values || {}).forEach(([name, replacement]) => { value = value.replace(`{${name}}`, String(replacement)); });
  return value;
};
