// Global variable for Three.js animation script path
const threeScriptPath = 'assets/index-DYQf9W6Q.js';

// Wait for the document to fully load
document.addEventListener("DOMContentLoaded", () => {
  // Handle burger menu toggle for mobile
  const burger = document.getElementById("burger-toggle");
  const navMenu = document.querySelector(".nav-menu");

  if (burger && navMenu) {
    // Toggle menu on burger click
    burger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      burger.classList.toggle("active");
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !burger.contains(e.target)) {
        navMenu.classList.remove("active");
        burger.classList.remove("active");
      }
    });
  }

  // Load Three.js animation only on home page
  if (window.location.pathname.endsWith("/") || window.location.pathname.endsWith("/index.html")) {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = threeScriptPath;
    document.body.appendChild(script);
  }

  // Handle navigation clicks (prevent full reload)
  document.querySelectorAll(".nav-menu a").forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const href = link.getAttribute("href").replace(/^\.\/|\/$/g, "");

      // Skip handling links that are not real navigation links
      // (e.g., links with href="javascript:void(0);" used for dropdown toggles).
      // These links should not trigger page fetch or change the URL.
      if (!href || href.startsWith("javascript:")) {
        return;
      }

      const page = href || "index";
      history.pushState(null, "", `./${page}`);
      loadPage(page);
    });
  });

  // Logo click to navigate to home page
  const logoImg = document.getElementById("logo-img");
  if (logoImg) {
    logoImg.addEventListener("click", (e) => {
      e.preventDefault();
      history.pushState(null, "", "/");  // push to /, back to https://www.bmds-lab.com/
      loadPage("index");
    });
  }  

  // Update footer year dynamically
  const yearSpan = document.getElementById("footer-year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Load the initial page on start up
  const page = window.location.pathname.split("/").pop().replace(".html", "") || "index";
  loadPage(page);
});

// Handle browser back/forward button navigation (<- and ->, next to refresh page)
window.addEventListener("popstate", () => {
  const page = window.location.pathname.split("/").pop().replace(".html", "") || "index";
  loadPage(page);
});

// Track the currently loaded page to avoid redundant reloads
let currentPage = "";

// Load the requested page dynamically
function loadPage(page) {
  if (currentPage === page) {
    return;// Prevent reloading the same page
  }
  currentPage = page;

  fetch(`${page}.html`)
    .then(res => {
      if (!res.ok) throw new Error(`Page not found: ${page}`);
      return res.text();
    })
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const mainContent = doc.querySelector("main");
      if (mainContent) {
        document.getElementById("content").innerHTML = mainContent.innerHTML;
      } else {
        document.getElementById("content").innerHTML = html;
      }

      // Update the body class based on the current page
      // This controls background and nav style (homepage vs other pages)
      if (page === "index") {
        document.body.classList.add("homepage"); // Add homepage class on home page
      } else {
        document.body.classList.remove("homepage"); // Remove homepage class on other pages
      }

      // Update active nav link
      setActiveNav(page);

      // Load additional page-specific content
      if (page === "students") loadStudentsPage();
      if (page === "publications") loadPublicationsPage();
      if (page === "contact") generateEmail();

      // Close burger menu if it's open
      const burger = document.getElementById("burger-toggle");
      const navMenu = document.querySelector(".nav-menu");
      if (burger?.classList.contains("active")) {
        burger.classList.remove("active");
        navMenu?.classList.remove("active");
      }

      // Handle optional page-specific features
      handleThreeJS(page);
      handleFooter(page);

      // Force reflow animation
      document.body.style.display = 'none';
      document.body.offsetHeight;
      document.body.style.display = 'flex';
    })
    .catch(error => {
      console.error(error);
      loadPage("about"); // fallback page if load fails
    });
}

// Set the active navigation link based on current page
function setActiveNav(page) {
  const cleanPage = page.replace(".html", "");

  document.querySelectorAll(".nav-menu a").forEach(link => link.classList.remove("active"));
  document.getElementById("team-link")?.classList.remove("active");
  document.getElementById("resources-link")?.classList.remove("active");

  document.querySelectorAll(".nav-menu a").forEach(link => {
    const href = link.getAttribute("href").replace(/^\.\/|\/$/g, "").replace(".html", "");
    if (href === cleanPage) {
      link.classList.add("active");
    }
  });

  const teamPages = ["students", "pi"];
  const resourcePages = ["admissions", "software"];
  if (teamPages.includes(cleanPage)) document.getElementById("team-link")?.classList.add("active");
  if (resourcePages.includes(cleanPage)) document.getElementById("resources-link")?.classList.add("active");
}

// Generate contact email dynamically
function generateEmail() {
  const username = "yli2";
  const domain = "brocku.ca";
  const emailLink = `<a href="mailto:${username}@${domain}">${username}@${domain}</a>`;
  const emailElement = document.getElementById("email");
  if (emailElement) {
    emailElement.innerHTML = emailLink;
  }
}

// Load and render the Students page
function loadStudentsPage() {
  fetch("students.json")
    .then(res => res.json())
    .then(data => {
      const row = document.querySelector(".team .row");
      row.innerHTML = "";

      data.students.forEach(student => {
        const card = document.createElement("div");
        card.className = "col-lg-6 mt-4";

        const imgSrc = student.image?.trim() || "./img/team/default.png";
        card.innerHTML = `
          <div class="member d-flex align-items-start" data-role="${student.status} ${student.degree}">
            <div class="teampic">
              <img src="${imgSrc}" class="img-fluid" alt="${student.name}">
            </div>
            <div class="member-info">
              <h4 class="student-name">${student.linkedin ? `<a href="${student.linkedin}" target="_blank">${student.name}</a>` : student.name}</h4>
              <span>${student.degree}</span>
              <p>${student.description || ""}</p>
            </div>
          </div>
        `;
        row.appendChild(card);
      });

      const filterButtons = document.querySelectorAll(".role-filters .filter-button");
      const searchInput = document.getElementById("searchBox");
      const clearBtn = document.getElementById("clearSearch");
      const members = document.querySelectorAll(".member");

      let currentFilter = "Current";

      // Filter students by role and search input
      function filterStudents() {
        const keyword = searchInput.value.trim().toLowerCase();

        members.forEach(member => {
          const [status, degree] = (member.getAttribute("data-role") || "").split(" ");
          const nameElement = member.querySelector(".student-name");
          const nameText = nameElement.textContent.trim().toLowerCase();

          const roleMatch = currentFilter === "All" || (currentFilter === "Alumni" && status === "Alumni") || (status === "Current" && (degree === currentFilter || currentFilter === "Current"));
          const searchMatch = keyword === "" || nameText.includes(keyword);

          member.parentElement.style.display = roleMatch && searchMatch ? "block" : "none";

          // Highlight matched text
          if (searchMatch && keyword.length > 0) {
            highlightElementText(nameElement, keyword, true);
          } else {
            removeAllHighlights(pub);
          }
        });
      }

      setupFilterButtons(filterButtons, () => {
        currentFilter = document.querySelector(".role-filters .filter-button.active")?.getAttribute("data-filter") || "Current";
        filterStudents();
      });

      setupSearchClear(searchInput, clearBtn, filterStudents);

      filterStudents();
    });
}

// Load and render the Publications page
function loadPublicationsPage() {
  const container = document.getElementById("publicationContainer");
  if (!container) return;
  container.innerHTML = "";

  const filterButtons = document.querySelectorAll(".filter-button");
  const searchInput = document.getElementById("searchBox");
  const clearBtn = document.getElementById("clearSearch");

  let currentFilter = "All";

  fetch("publications.json")
    .then(res => res.json())
    .then(data => {
      const grouped = {};

      // Group publications by year
      data.publications.forEach(pub => {
        if (!grouped[pub.year]) grouped[pub.year] = [];
        grouped[pub.year].push(pub);
      });

      Object.keys(grouped).sort((a, b) => b - a).forEach(year => {
        const group = document.createElement("div");
        group.className = "pub-group";
        group.setAttribute("data-year", year);

        group.innerHTML = `<h3 class="pub-year">${year}</h3>`;

        grouped[year].forEach(pub => {
          const item = document.createElement("div");
          item.className = "publication-item";
          item.setAttribute("data-year", pub.year);
          item.setAttribute("data-type", pub.type);

          item.innerHTML = `<p>${pub.authors},<br><a href="${pub.link}" target="_blank" class="pub-title">"${pub.title}"</a>, <em>${pub.venue}</em>, ${pub.date}${pub.pages ? ", " + pub.pages : ""}${pub.note ? ", " + pub.note : ""}.</p>`;

          group.appendChild(item);
        });

        container.appendChild(group);
      });

      const pubGroups = document.querySelectorAll(".pub-group");

      // Filter publications by type, year, and search
      function filterPublications() {
        const keyword = searchInput.value.trim().toLowerCase();

        pubGroups.forEach(group => {
          const items = group.querySelectorAll(".publication-item");
          let hasVisible = false;

          items.forEach(pub => {
            const type = pub.getAttribute("data-type");
            const year = pub.getAttribute("data-year");
            const text = pub.innerText.toLowerCase();

            const matchTypeYear = (currentFilter === "All" || currentFilter === type || currentFilter === year);
            const matchSearch = keyword === "" || text.includes(keyword);

            const show = matchTypeYear && matchSearch;
            pub.style.display = show ? "block" : "none";
            if (show) hasVisible = true;

            if (matchSearch && keyword.length > 0) {
              highlightElementText(pub, keyword);
            } else {
              removeAllHighlights(pub);
            }
          });

          group.style.display = hasVisible ? "block" : "none";
        });
      }

      setupFilterButtons(filterButtons, () => {
        currentFilter = document.querySelector(".filter-button.active")?.getAttribute("data-filter") || "All";
        filterPublications();
      });

      setupSearchClear(searchInput, clearBtn, filterPublications);

      filterPublications();
    });
}

// Show/hide back-to-top button based on scroll position
window.addEventListener("scroll", function () {
  const backToTop = document.querySelector(".back-to-top");
  backToTop.style.display = window.scrollY > 300 ? "flex" : "none";
});

// Setup search box and clear button 
function setupSearchClear(searchInput, clearBtn, onFilter) {
  searchInput.addEventListener("input", () => {
    clearBtn.style.display = searchInput.value.length > 0 ? "block" : "none";
    onFilter();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.style.display = "none";
    searchInput.focus();
    onFilter();
  });
}
// Setup filter button
function setupFilterButtons(buttons, onFilter) {
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      onFilter();
    });
  });
}

// Highlight matching keyword in element text
function highlightElementText(element, keyword) {
  if (!element || !keyword) return;

  const regex = new RegExp(`(${keyword})`, "gi");

  const walk = (node) => {
    if (node.nodeType === 3) { // Text node
      const match = node.nodeValue.match(regex);
      if (match) {
        const span = document.createElement("span");
        span.innerHTML = node.nodeValue.replace(regex, "<mark>$1</mark>");
        node.replaceWith(...span.childNodes);
      }
    } else if (node.nodeType === 1 && node.nodeName !== "MARK") {
      Array.from(node.childNodes).forEach(child => walk(child));
    }
  };

  walk(element);
}

// Dynamically load/unload the Three.js DNA animation based on the page
function handleThreeJS(page) {
  const threeContainer = document.getElementById("three-container");

  if (page === "index") {
    if (threeContainer) {
      threeContainer.style.display = "block";
    }

    // Always remove old Three.js script if exists
    const oldScript = document.querySelector(`script[src="${threeScriptPath}"]`);
    if (oldScript) {
      oldScript.remove();
    }

    // Reload the Three.js DNA script
    const newScript = document.createElement('script');
    newScript.type = 'module';
    newScript.src = threeScriptPath;
    document.body.appendChild(newScript);

  } else {
    if (threeContainer) {
      threeContainer.style.display = "none";
    }
  }
}

// Show or hide the footer depending on the current page
function handleFooter(page) {
  const footer = document.querySelector(".footer");
  if (!footer) return;

  if (page === "index" || page === "") {
    footer.style.display = "none"; // Hide footer on the home page
  } else {
    footer.style.display = "block"; // Show footer on other pages
  }
}

// Remove <mark> element
function removeAllHighlights(element) {
  const marks = element.querySelectorAll('mark');
  marks.forEach(mark => {
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });
}