if(!self.define){let e,a={};const s=(s,i)=>(s=new URL(s+".js",i).href,a[s]||new Promise((a=>{if("document"in self){const e=document.createElement("script");e.src=s,e.onload=a,document.head.appendChild(e)}else e=s,importScripts(s),a()})).then((()=>{let e=a[s];if(!e)throw new Error(`Module ${s} didn’t register its module`);return e})));self.define=(i,c)=>{const n=e||("document"in self?document.currentScript.src:"")||location.href;if(a[n])return;let o={};const r=e=>s(e,n),f={module:{uri:n},exports:o,require:r};a[n]=Promise.all(i.map((e=>f[e]||r(e)))).then((e=>(c(...e),o)))}}define(["./workbox-475b3d61"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/favicon/android-icon-144x144.png",revision:"a52622b93ad3217604a103a57f0c037d"},{url:"assets/favicon/android-icon-192x192.png",revision:"2675123b8545d497038aa1e28b34fee8"},{url:"assets/favicon/android-icon-36x36.png",revision:"edad7afbbbc44d18dcbf8400a40ffd4c"},{url:"assets/favicon/android-icon-48x48.png",revision:"a4b6637d6aca8d0ba42aeabcd2d7758a"},{url:"assets/favicon/android-icon-72x72.png",revision:"8884b8d1e2779179508b8dd4174c09c8"},{url:"assets/favicon/android-icon-96x96.png",revision:"cfc9d5c2b74ad62076677c08d97030bc"},{url:"assets/favicon/apple-icon-114x114.png",revision:"e63f740061d82c829714916138e9379a"},{url:"assets/favicon/apple-icon-120x120.png",revision:"4a00f6e2487d9a5449e2b1c6262ffc50"},{url:"assets/favicon/apple-icon-144x144.png",revision:"a52622b93ad3217604a103a57f0c037d"},{url:"assets/favicon/apple-icon-152x152.png",revision:"96c751ea19711b8bea951e90ca137d93"},{url:"assets/favicon/apple-icon-180x180.png",revision:"21c63e71f707956abf98ca981b3d4c0b"},{url:"assets/favicon/apple-icon-57x57.png",revision:"a43f0875b4748a326919e2e719138e49"},{url:"assets/favicon/apple-icon-60x60.png",revision:"71dc11f511956db289c430ca9caf9ccd"},{url:"assets/favicon/apple-icon-72x72.png",revision:"8884b8d1e2779179508b8dd4174c09c8"},{url:"assets/favicon/apple-icon-76x76.png",revision:"cd536879e8b80fd4bf0f77f207ad7811"},{url:"assets/favicon/apple-icon-precomposed.png",revision:"fdf990a30b7a39887bd7304e4a6423cf"},{url:"assets/favicon/apple-icon.png",revision:"fdf990a30b7a39887bd7304e4a6423cf"},{url:"assets/favicon/browserconfig.xml",revision:"653d077300a12f09a69caeea7a8947f8"},{url:"assets/favicon/favicon-16x16.png",revision:"82335f9629ae8e6c90f02a9a610df7a7"},{url:"assets/favicon/favicon-32x32.png",revision:"70e030b39b5cc01e165e3e7faab0d21e"},{url:"assets/favicon/favicon-96x96.png",revision:"cfc9d5c2b74ad62076677c08d97030bc"},{url:"assets/favicon/favicon.ico",revision:"94b9b85cbbd422f86fa7c671b41a9d2a"},{url:"assets/favicon/manifest.json",revision:"b58fcfa7628c9205cb11a1b2c3e8f99a"},{url:"assets/favicon/ms-icon-144x144.png",revision:"a52622b93ad3217604a103a57f0c037d"},{url:"assets/favicon/ms-icon-150x150.png",revision:"4cd46939aad96150ba67116eaee8fccd"},{url:"assets/favicon/ms-icon-310x310.png",revision:"6813a6bb8777f8da3b7ac6da66c02900"},{url:"assets/favicon/ms-icon-70x70.png",revision:"66ac126379b7d431159822c44046af80"},{url:"assets/images/love_like_heart_icon_196980.png",revision:"0f050e576aab77821b3cf5c7f1261d7a"},{url:"css/homepage-dist.css",revision:"81ca61e838844540bad737df1d947a63"},{url:"css/homepage.css",revision:"805b9a8c0889b56fa3799fbbad305864"},{url:"css/normalize.css",revision:"112272e51c80ffe5bd01becd2ce7d656"},{url:"index.html",revision:"c45256ff6b1af318bf9912b5cf9c1a42"},{url:"javascript/homepage.js",revision:"e2d9e9b0e8bc2438ee165ad4f913ee95"},{url:"manifest.json",revision:"a7a8512b7aa8cf25e3190ffc9ed47892"},{url:"moduls/animation-dist.css",revision:"104e6fcf652ef411a53c8659b59a58cf"},{url:"moduls/animation.css",revision:"05cb85073c649f80a5a03b9e9a63f0dc"},{url:"moduls/buttons-dist.css",revision:"8e0d2546826f9b457e4e06075d6c7d2e"},{url:"moduls/buttons.css",revision:"e234fc3075d02f0bea5cc840ef071260"},{url:"moduls/main-dist.css",revision:"75db839b8801212af81445b3f83a1543"},{url:"moduls/main.css",revision:"8f5f6844dfc042db7e237365b0e739da"},{url:"moduls/main.js",revision:"aa278dd634eb276eb066c9e5ef2ff300"},{url:"pages/africa/africa.html",revision:"0ab725075e590d5a84da691c1d860beb"},{url:"pages/america/america.html",revision:"87f033dde993dd834abb03d2f60111dc"},{url:"pages/asia/asia.html",revision:"e78e191f837c6c20bd40176a84c4481f"},{url:"pages/career-mode.html",revision:"162ede40087b649565ca17fb351865a0"},{url:"pages/europe/europe.html",revision:"f708e1f87284f8b5e80d1315519d50d1"},{url:"pages/oceania/oceania.html",revision:"dbea1270864adc3b70188d799fab17f8"},{url:"prepros.config",revision:"b3e93cd3929eb02601058b43a3394b00"}],{ignoreURLParametersMatching:[/^utm_/,/^fbclid$/]})}));
//# sourceMappingURL=sw.js.map
