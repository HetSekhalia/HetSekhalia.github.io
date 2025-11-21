// Load project content from individual HTML files into modals
// This allows editing project content in separate files

const projectFiles = {
  1: 'projects/proj-1.html',
  2: 'projects/proj-2.html',
  3: 'projects/proj-3.html',
  4: 'projects/proj-4.html'
};

// Cache for loaded content
const contentCache = {};

function loadProjectContent(projectId, imagePathPrefix = '') {
  return new Promise((resolve, reject) => {
    // Check cache first (commented out for development - uncomment to enable caching)
    // if (contentCache[projectId]) {
    //   resolve(contentCache[projectId]);
    //   return;
    // }

    const projectFile = projectFiles[projectId];
    if (!projectFile) {
      reject(new Error(`Project ${projectId} not found`));
      return;
    }

    // Adjust path based on current page location
    let filePath;
    const currentPath = window.location.pathname;
    
    // Determine if we're in the projects directory
    const isInProjectsDir = currentPath.includes('/projects/') || currentPath.endsWith('/projects');
    
    if (isInProjectsDir) {
      // We're in projects/ directory, so use relative path
      filePath = `proj-${projectId}.html`;
    } else {
      // We're at root, so use full path
      filePath = `projects/proj-${projectId}.html`;
    }

    // Append timestamp to bypass browser cache during development
    const cacheBustedPath = `${filePath}?v=${Date.now()}`;

    fetch(cacheBustedPath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load ${cacheBustedPath} (Status: ${response.status})`);
        }
        return response.text();
      })
      .then(html => {
        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract body content (excluding nav)
        const body = doc.body;
        const nav = body.querySelector('nav');
        if (nav) nav.remove();
        
        // Get all content after nav (keep h1 in content, it's the title)
        const content = Array.from(body.children).map(el => {
          // Clone the element
          const clone = el.cloneNode(true);
          
          // Fix image paths - convert absolute paths to relative
          const images = clone.querySelectorAll('img');
          images.forEach(img => {
            let src = img.getAttribute('src');
            if (src && src.startsWith('/')) {
              src = src.substring(1); // Remove leading slash
            }
            if (src && !src.startsWith('http') && imagePathPrefix) {
              src = imagePathPrefix + src;
            }
            img.setAttribute('src', src);
          });
          
          // Fix link paths
          const links = clone.querySelectorAll('a');
          links.forEach(link => {
            let href = link.getAttribute('href');
            if (href && href.startsWith('/')) {
              href = href.substring(1);
            }
            if (href && !href.startsWith('http') && imagePathPrefix && !href.startsWith('#')) {
              href = imagePathPrefix + href;
            }
            link.setAttribute('href', href);
          });
          
          return clone.outerHTML;
        }).join('');
        
        const result = { content };
        contentCache[projectId] = result;
        resolve(result);
      })
    .catch(error => {
      console.error(`Error loading project ${projectId}:`, error);
      console.error(`Attempted path: ${filePath}`);
      console.error(`Current location: ${window.location.href}`);
      reject(new Error(`Load failed: ${error.message}`));
    });
  });
}

function openProjectModal(projectId, imagePathPrefix = '') {
  const modal = document.getElementById(`projectModal${projectId}`);
  if (!modal) {
    console.error(`Modal for project ${projectId} not found`);
    return;
  }

  const contentDiv = modal.querySelector('.project-modal-content');
  if (!contentDiv) {
    console.error(`Content div for project ${projectId} not found`);
    return;
  }

  // Show loading state
  contentDiv.innerHTML = '<p>Loading project content...</p>';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Load content
  loadProjectContent(projectId, imagePathPrefix)
    .then(({ content }) => {
      // Update modal content (h1 title is already in the content)
      contentDiv.innerHTML = content;
    })
    .catch(error => {
      contentDiv.innerHTML = `<p>Error loading project content: ${error.message}</p>`;
    });
}

