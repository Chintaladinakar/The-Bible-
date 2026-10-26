// Scriptura - Progressive Web App (PWA) lifecycle, installation, toasts & haptics

class PWAController {
  constructor() {
    this.deferredPrompt = null;
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    this.onConnectivityChange = null;
  }

  init() {
    this.registerServiceWorker();
    this.listenInstallPrompt();
    this.listenConnectivity();
  }

  registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showToast('A new version of The Bible is ready.', 'update', {
                  actionLabel: 'Refresh',
                  onAction: () => window.location.reload(),
                  duration: 12000
                });
              }
            };
          };
        })
        .catch((error) => {
          console.warn('[The Bible PWA] Service Worker registration failed:', error);
        });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register);
  }

  listenInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Keep the browser's banner quiet; offer install from our own buttons
      e.preventDefault();
      this.deferredPrompt = e;
      this.setInstallButtons(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isStandalone = true;
      this.setInstallButtons(false);
      this.showToast('The Bible is installed on this device.', 'success');
    });

    // iOS never fires beforeinstallprompt; offer the manual route in settings
    if (this.isIOS && !this.isStandalone) {
      document.querySelectorAll('#settings-install').forEach(btn => btn.classList.remove('hidden'));
    }
  }

  setInstallButtons(show) {
    document.querySelectorAll('.pwa-install-btn').forEach(btn => {
      btn.classList.toggle('hidden', !show);
      btn.disabled = !show;
    });
  }

  async promptInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.setInstallButtons(false);
    } else if (this.isIOS && !this.isStandalone) {
      this.showToast('Tap the Share button, then “Add to Home Screen”.', 'info', { duration: 7000 });
    } else if (this.isStandalone) {
      this.showToast('The Bible is already installed.', 'info');
    } else {
      this.showToast('Use your browser’s menu to install The Bible.', 'info');
    }
  }

  listenConnectivity() {
    const updateStatus = () => {
      const banner = document.getElementById('offline-indicator');
      if (banner) banner.classList.toggle('hidden', navigator.onLine);
      if (this.onConnectivityChange) this.onConnectivityChange(navigator.onLine);
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
  }

  haptic(ms = 10) {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(ms); } catch {}
    }
  }

  // Returns a function that dismisses the toast early
  showToast(message, type = 'info', { actionLabel, onAction, duration } = {}) {
    const container = document.getElementById('toast-container');
    if (!container) return () => {};

    while (container.children.length >= 2) container.firstElementChild.remove();

    const toast = document.createElement('div');
    toast.className = `scriptura-toast toast-${type}`;
    const text = document.createElement('span');
    text.className = 'toast-text';
    text.textContent = message;
    toast.append(text);

    let timer;
    const dismiss = () => {
      clearTimeout(timer);
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 260);
    };

    if (actionLabel && onAction) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toast-action';
      btn.textContent = actionLabel;
      btn.addEventListener('click', () => {
        onAction();
        dismiss();
      });
      toast.classList.add('has-action');
      toast.append(btn);
    }

    container.append(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    timer = setTimeout(dismiss, duration || (actionLabel ? 5600 : 3200));
    return dismiss;
  }
}

export const pwa = new PWAController();
