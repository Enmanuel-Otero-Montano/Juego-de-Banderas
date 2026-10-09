const translations = {
  es: {
    title: 'Verificación exitosa',
    alt: 'Banderas, países y regiones',
    heading: '¡Correo verificado!',
    message: 'Tu cuenta ya está lista para usarse.',
    stepOne: 'Cierra esta página y vuelve a abrir la aplicación.',
    stepTwo: 'Inicia sesión con el alias y la contraseña que elegiste.',
    note: 'Puedes cerrar esta página con tranquilidad: la verificación ya se completó.',
  },
  en: {
    title: 'Email verified',
    alt: 'Flags, Countries and Regions',
    heading: 'Email verified!',
    message: 'Your account is ready to use.',
    stepOne: 'Close this page and return to the app.',
    stepTwo: 'Sign in with the alias and password you chose.',
    note: 'You can safely close this page: verification is complete.',
  },
  pt: {
    title: 'E-mail verificado',
    alt: 'Bandeiras, Países e Regiões',
    heading: 'E-mail verificado!',
    message: 'Sua conta está pronta para usar.',
    stepOne: 'Feche esta página e volte ao aplicativo.',
    stepTwo: 'Entre com o apelido e a senha que você escolheu.',
    note: 'Você pode fechar esta página com tranquilidade: a verificação foi concluída.',
  },
  fr: {
    title: 'E-mail vérifié',
    alt: 'Drapeaux, pays et régions',
    heading: 'E-mail vérifié !',
    message: 'Ton compte est prêt à être utilisé.',
    stepOne: 'Ferme cette page et retourne dans l’application.',
    stepTwo: 'Connecte-toi avec l’alias et le mot de passe choisis.',
    note: 'Tu peux fermer cette page en toute sécurité : la vérification est terminée.',
  },
  de: {
    title: 'E-Mail bestätigt',
    alt: 'Flaggen, Länder und Regionen',
    heading: 'E-Mail bestätigt!',
    message: 'Dein Konto ist jetzt bereit.',
    stepOne: 'Schließe diese Seite und kehre zur App zurück.',
    stepTwo: 'Melde dich mit dem gewählten Alias und Passwort an.',
    note: 'Du kannst diese Seite sicher schließen: Die Bestätigung ist abgeschlossen.',
  },
};

const language = new URLSearchParams(window.location.search).get('lang');
const copy = translations[language] || translations.en;

document.documentElement.lang = translations[language] ? language : 'en';
document.title = copy.title;
document.querySelector('.brand-mark').alt = copy.alt;
document.querySelector('#verification-title').textContent = copy.heading;
document.querySelector('.message').textContent = copy.message;
document.querySelectorAll('.next-step p')[0].textContent = copy.stepOne;
document.querySelectorAll('.next-step p')[1].textContent = copy.stepTwo;
document.querySelector('.note').textContent = copy.note;
