try {
  const preferences = JSON.parse(localStorage.getItem("atelier-python-v1") || "{}");
  document.documentElement.dataset.theme = preferences?.theme === "dark" ? "dark" : "light";
} catch {
  // Le thème clair reste disponible si les préférences locales sont inaccessibles.
}

const resume = new URLSearchParams(location.search).get("retour");
if (resume === "console-libre" || /^defi-\d{3}$/.test(resume ?? "")) {
  for (const id of ["help-home", "help-return"]) {
    document.getElementById(id).href = "./#" + resume;
  }
}
