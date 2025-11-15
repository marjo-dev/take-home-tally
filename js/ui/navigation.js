// Navigation bar functionality

export function initNavigation() {
  const navButtons = Array.from(document.querySelectorAll(".top-nav button"));
  const pages = Array.from(document.querySelectorAll(".page"));

  const activatePage = (pageKey) => {
    const targetId = `page-${pageKey}`;
    pages.forEach((page) => {
      page.classList.toggle("active", page.id === targetId);
    });

    navButtons.forEach((button) => {
      const isActive = button.dataset.page === pageKey;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  };

  navButtons.forEach((button) => {
    button.addEventListener("click", () => activatePage(button.dataset.page));
  });

  const initialPage = document.querySelector(".page.active")?.id.replace("page-", "") || "entry";
  activatePage(initialPage);
}

