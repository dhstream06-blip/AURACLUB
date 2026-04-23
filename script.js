/* ============================================================
   AURA DESIGN — Homepage Script (script.js)
   Loads projects from Supabase, handles gallery, modals
   ============================================================ */

const ADMIN_PASSWORD = '1040';

// ---- Init on load ----
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  await loadGallery();
  setupFilterButtons();
  setupDragDrop();
});

// ---- Load projects from Supabase ----
async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  const emptyState = document.getElementById('emptyState');
  const countEl = document.getElementById('projectCount');

  try {
    const projects = await supabase.select('projects', '?order=created_at.desc');

    if (!projects || projects.length === 0) {
      emptyState.style.display = 'flex';
      countEl.textContent = '0';
      return;
    }

    emptyState.style.display = 'none';
    countEl.textContent = projects.length;

    // Clear grid and render cards
    grid.innerHTML = '';
    projects.forEach((project, index) => {
      const card = createGalleryCard(project, index);
      grid.appendChild(card);
    });

  } catch (err) {
    console.error('Failed to load projects:', err);
    // Fallback to localStorage if Supabase not configured
    loadFromLocalStorage();
  }
}

// ---- Fallback: load from localStorage ----
function loadFromLocalStorage() {
  const grid = document.getElementById('galleryGrid');
  const emptyState = document.getElementById('emptyState');
  const countEl = document.getElementById('projectCount');

  const projects = JSON.parse(localStorage.getItem('aura_projects') || '[]');

  if (projects.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';
  countEl.textContent = projects.length;
  grid.innerHTML = '';

  projects.forEach((project, index) => {
    const card = createGalleryCard(project, index);
    grid.appendChild(card);
  });
}

// ---- Create a gallery card element ----
function createGalleryCard(project, index) {
  const card = document.createElement('div');
  card.className = 'gallery-card';
  card.dataset.category = project.category || 'branding';
  card.style.animationDelay = `${index * 0.07}s`;

  const isPdf = project.file_type === 'pdf';
  const thumbHtml = isPdf
    ? `<div class="card-pdf-thumb">
         <div class="pdf-icon">&#128196;</div>
         <span>PDF Document</span>
       </div>`
    : `<img src="${project.file_url}" alt="${project.title}" loading="lazy" />`;

  card.innerHTML = `
    <div class="card-thumb">${thumbHtml}</div>
    <div class="card-body">
      <div class="card-category">${project.category || 'Design'}</div>
      <div class="card-title">${project.title}</div>
      ${project.client_name ? `<div class="card-client">${project.client_name}</div>` : ''}
      <div class="card-date">${formatDate(project.created_at)}</div>
    </div>
  `;

  card.addEventListener('click', () => openPreview(project));
  return card;
}

// ---- Filter gallery by category ----
function setupFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      document.querySelectorAll('.gallery-card').forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// ---- Open project preview modal ----
function openPreview(project) {
  const modal = document.getElementById('previewModal');
  const content = document.getElementById('previewContent');

  const isPdf = project.file_type === 'pdf';

  content.innerHTML = `
    <div style="padding:32px">
      <div class="card-category" style="margin-bottom:8px">${project.category || 'Design'}</div>
      <h2 style="font-family:var(--font-display);font-size:1.8rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:8px">${project.title}</h2>
      ${project.client_name ? `<p style="color:var(--text-2);margin-bottom:20px">${project.client_name}</p>` : ''}
      ${project.description ? `<p style="color:var(--text-2);font-size:0.9rem;margin-bottom:20px">${project.description}</p>` : ''}

      <div style="border-radius:12px;overflow:hidden;border:1px solid var(--border);margin-bottom:20px;background:var(--bg-2)">
        ${isPdf
          ? `<iframe src="${project.file_url}" style="width:100%;height:500px;border:none"></iframe>`
          : `<img src="${project.file_url}" alt="${project.title}" style="width:100%;display:block" />`
        }
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <a href="${project.file_url}" download class="btn-primary">Download</a>
        <a href="client.html?project=${project.id}" class="btn-ghost" target="_blank">View Client Page</a>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closePreviewModal(event) {
  if (!event || event.target === document.getElementById('previewModal')) {
    document.getElementById('previewModal').classList.remove('active');
  }
}

// ---- Admin Modal ----
function openAdminModal() {
  document.getElementById('adminModal').classList.add('active');
  setTimeout(() => document.getElementById('adminPassword').focus(), 100);
}

function closeAdminModal(event) {
  if (!event || event.target === document.getElementById('adminModal')) {
    document.getElementById('adminModal').classList.remove('active');
    document.getElementById('adminPassword').value = '';
    document.getElementById('modalError').classList.remove('visible');
  }
}

function checkAdminPassword() {
  const input = document.getElementById('adminPassword').value;
  if (input === ADMIN_PASSWORD) {
    window.location.href = 'admin.html';
  } else {
    document.getElementById('modalError').classList.add('visible');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
  }
}

// ---- Drag drop setup for drop zone on admin ----
function setupDragDrop() {
  // Only needed on admin page, but safe to call here
  const dz = document.getElementById('dropZone');
  if (!dz) return;

  dz.addEventListener('dragover', e => {
    e.preventDefault();
    dz.classList.add('dragover');
  });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
}

// ---- Date formatter ----
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}
