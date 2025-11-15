// Service Worker and PWA functionality

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    let refreshing = false;

    // Register service worker
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .then((reg) => {
          console.log("✅ Service Worker registered", reg.scope);

          // Check for updates periodically (every hour)
          setInterval(() => {
            reg.update();
          }, 60 * 60 * 1000);

          // Listen for service worker updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            console.log('🔄 New service worker found, installing...');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is ready, reload to activate it
                console.log('✅ New version available! Reloading...');
                if (!refreshing) {
                  refreshing = true;
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((err) => console.error("❌ Service Worker failed", err));
    });

    // Handle service worker controller change (when new one takes over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

export function initPWAInstallPrompt() {
  // PWA Install Prompt Handler
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('✅ Install prompt available');
    // You can show a custom install button here if needed
  });

  // Log install event
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully');
    deferredPrompt = null;
  });
}

