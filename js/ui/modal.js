// Modal display functionality

export function showModal(message) {
  if (!message) return;

  // Remove existing modal if present
  const existingModal = document.querySelector(".modal-overlay");
  if (existingModal) {
    existingModal.remove();
    document.body.style.overflow = "";
  }

  // Prevent body scrolling when modal is open
  document.body.style.overflow = "hidden";

  // Create modal overlay
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  // Create modal content
  const modal = document.createElement("div");
  modal.className = "modal";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  modalContent.textContent = message;

  const closeButton = document.createElement("button");
  closeButton.className = "modal-close";
  closeButton.textContent = "Close";

  const closeModal = () => {
    overlay.classList.remove("visible");
    document.body.style.overflow = "";
    setTimeout(() => {
      overlay.remove();
    }, 250);
  };

  closeButton.addEventListener("click", closeModal);

  modal.appendChild(modalContent);
  modal.appendChild(closeButton);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Show modal with animation
  requestAnimationFrame(() => {
    overlay.classList.add("visible");
  });

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
}

// Toast notification for success messages
export function showToast(message, duration = 3000) {
  if (!message) return;

  // Remove existing toast if present
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.className = "toast";

  const toastContent = document.createElement("div");
  toastContent.className = "toast-content";
  toastContent.textContent = message;

  toast.appendChild(toastContent);
  document.body.appendChild(toast);

  // Show toast with animation
  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  // Auto-dismiss after duration
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => {
      toast.remove();
    }, 300); // Wait for fade-out animation
  }, duration);
}

