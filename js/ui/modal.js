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

