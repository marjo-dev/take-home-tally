// App and settings description toggle functionality

export function initToggles() {
  // App description toggle
  const appToggleButton = document.querySelector(".app-description-toggle");
  const appContent = document.getElementById("app-description-content");
  
  if (appToggleButton && appContent) {
    appToggleButton.addEventListener("click", () => {
      const isExpanded = appContent.classList.contains("expanded");
      
      if (isExpanded) {
        appContent.classList.remove("expanded");
        appToggleButton.classList.remove("expanded");
        appToggleButton.setAttribute("aria-expanded", "false");
        const hint = appToggleButton.querySelector(".toggle-hint");
        if (hint) hint.textContent = "tap to expand";
      } else {
        appContent.classList.add("expanded");
        appToggleButton.classList.add("expanded");
        appToggleButton.setAttribute("aria-expanded", "true");
        const hint = appToggleButton.querySelector(".toggle-hint");
        if (hint) hint.textContent = "tap to hide";
      }
    });
  }

  // Settings description toggle
  const settingsToggleButton = document.querySelector(".settings-description-toggle");
  const settingsContent = document.getElementById("settings-description-content");
  
  if (settingsToggleButton && settingsContent) {
    settingsToggleButton.addEventListener("click", () => {
      const isExpanded = settingsContent.classList.contains("expanded");
      
      if (isExpanded) {
        settingsContent.classList.remove("expanded");
        settingsToggleButton.classList.remove("expanded");
        settingsToggleButton.setAttribute("aria-expanded", "false");
        const hint = settingsToggleButton.querySelector(".toggle-hint");
        if (hint) hint.textContent = "tap to expand";
      } else {
        settingsContent.classList.add("expanded");
        settingsToggleButton.classList.add("expanded");
        settingsToggleButton.setAttribute("aria-expanded", "true");
        const hint = settingsToggleButton.querySelector(".toggle-hint");
        if (hint) hint.textContent = "tap to hide";
      }
    });
  }

  // Settings page description toggle
  const settingsPageToggleButton = document.querySelector(".settings-page-description-toggle");
  const settingsPageContent = document.getElementById("settings-page-description-content");
  
  if (settingsPageToggleButton && settingsPageContent) {
    settingsPageToggleButton.addEventListener("click", () => {
      const isExpanded = settingsPageContent.classList.contains("expanded");
      
      if (isExpanded) {
        settingsPageContent.classList.remove("expanded");
        settingsPageToggleButton.classList.remove("expanded");
        settingsPageToggleButton.setAttribute("aria-expanded", "false");
        const hint = settingsPageToggleButton.querySelector(".toggle-hint");
        if (hint) hint.textContent = "tap to expand";
      } else {
        settingsPageContent.classList.add("expanded");
        settingsPageToggleButton.classList.add("expanded");
        settingsPageToggleButton.setAttribute("aria-expanded", "true");
        const hint = settingsPageToggleButton.querySelector(".toggle-hint");
        if (hint) hint.textContent = "tap to hide";
      }
    });
  }
}

