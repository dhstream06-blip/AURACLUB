/* ============================================================
   AURA DESIGN — Admin Dashboard (admin.js)
   Upload, manage projects, view feedback
   ============================================================ */

const ADMIN_PASS = '1040';
let selectedFile = null;
let deleteTargetId = null;
let deleteTargetStoragePath = null;
let hasCategoryColumn = true;

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  setupDropZone();
});

// ---- Auth Gate ----
function checkAdminAuth() {
  const authed = sessionStorage.getItem('aura_admin') === 'true';
  if (authed) {
    showDashboard();
  }
}

function gateCheck() {
  const input = document.getElementById('gatePassword').value;
  if (input === ADMIN_PASS) {
    sessionStorage.setItem('aura_admin', 'true');
    showDashboard();
  } else {
    const err = document.getElementById('gateError');
    err.classList.add('visible');
    document.getElementById('gatePassword').value = '';
    document.getElementById('gatePassword').focus();
    setTimeout(() => err.classList.remove('visible'), 3000);
  }
}

function showDashboard() {
  document.getElementById('adminGate').style.display = 'none';
  document.getElementById('adminDashboard').classList.remove('hidden');
  loadProjects();
}

function adminLogout() {
  sessionStorage.removeItem('aura_admin');
  window.location.reload();
}

// ---- Tab switching ----
function showTab(name, triggerEl = null) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.remove('hidden');
  const activeTrigger = triggerEl || (typeof event !== 'undefined' ? event.currentTarget : null);
  if (activeTrigger) activeTrigger.classList.add('active');

  if (name === 'projects') loadProjects();
  if (name === 'feedback') loadFeedback();
}

// ---- File handling ----
function setupDropZone() {
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

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) handleFile(file);
}

function handleFile(file) {
  // Validate type and size
  const allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf'];
  if (!allowed.includes(file.type)) {
    alert('Please upload an image (JPG, PNG, GIF, WebP) or PDF file.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('File size must be under 10MB.');
    return;
  }

  selectedFile = file;

  // Show preview
  const preview = document.getElementById('filePreview');
  preview.style.display = 'flex';
  preview.innerHTML = '';

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML = `<img src="${e.target.result}" style="max-height:200px;width:100%;object-fit:contain" />`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-2)">
      <div style="font-size:2.5rem;margin-bottom:8px">&#128196;</div>
      <div style="font-size:0.9rem">${file.name}</div>
      <div style="font-size:0.75rem;color:var(--text-3);margin-top:4px">${(file.size/1024).toFixed(0)} KB</div>
    </div>`;
  }

  // Update drop zone text
  document.querySelector('.drop-text').textContent = file.name;
  document.querySelector('.drop-sub').textContent = `${(file.size / 1024).toFixed(0)} KB · Ready to upload`;
}

// ---- Upload Project ----
async function uploadProject() {
  const title = document.getElementById('projectTitle').value.trim();
  const category = document.getElementById('projectCategory').value;
  const clientName = document.getElementById('clientName').value.trim();
  const description = document.getElementById('projectDesc').value.trim();

  if (!title) { alert('Please enter a project title.'); return; }
  if (!selectedFile) { alert('Please select a file to upload.'); return; }

  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  btn.textContent = 'Uploading...';

  const progress = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  progress.style.display = 'flex';

  // Simulate progress (real progress with fetch is complex)
  let prog = 0;
  const interval = setInterval(() => {
    prog = Math.min(prog + Math.random() * 15, 85);
    progressFill.style.width = prog + '%';
  }, 200);

  try {
    const projectId = crypto.randomUUID();
    const fileExt = selectedFile.name.split('.').pop();
    const storagePath = `projects/${projectId}.${fileExt}`;
    let fileUploaded = false;

    // 1. Upload file to Supabase Storage
    progressText.textContent = 'Uploading file...';
    const fileUrl = await supabase.uploadFile('designs', storagePath, selectedFile);
    fileUploaded = true;

    clearInterval(interval);
    progressFill.style.width = '90%';
    progressText.textContent = 'Saving project...';

    // 2. Save project metadata to Supabase database
    const projectData = {
      id: projectId,
      title,
      category,
      description: description || null,
      image_url: fileUrl,
      user_id: clientName || 'admin'
    };

    try {
      await insertProjectWithSchemaFallback(projectData);
    } catch (dbErr) {
      if (fileUploaded) {
        await supabase.deleteFile('designs', storagePath).catch(() => {});
      }
      throw dbErr;
    }

    progressFill.style.width = '100%';
    progressText.textContent = 'Done!';

    // 3. Generate client link
    const clientLink = `${getSiteBaseUrl()}/client.html?project=${projectId}`;

    setTimeout(() => {
      progress.style.display = 'none';

      // Show generated link
      const linkBox = document.getElementById('generatedLink');
      document.getElementById('clientLinkInput').value = clientLink;
      linkBox.style.display = 'flex';

      // Reset form
      resetUploadForm();
      btn.disabled = false;
      btn.textContent = 'Upload & Generate Client Link';
    }, 800);

  } catch (err) {
    clearInterval(interval);
    console.error('Upload failed:', err);
    alert('Upload failed. Please check your Supabase configuration and try again.\n\nError: ' + err.message);
    progress.style.display = 'none';
    btn.disabled = false;
    btn.textContent = 'Upload & Generate Client Link';
  }
}

function resetUploadForm() {
  document.getElementById('projectTitle').value = '';
  document.getElementById('clientName').value = '';
  document.getElementById('projectDesc').value = '';
  document.getElementById('filePreview').style.display = 'none';
  document.querySelector('.drop-text').textContent = 'Drop file here or click to browse';
  document.querySelector('.drop-sub').textContent = 'JPG, PNG, GIF, WebP or PDF — Max 10MB';
  document.getElementById('fileInput').value = '';
  selectedFile = null;
}

function copyLink() {
  const input = document.getElementById('clientLinkInput');
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = document.querySelector('.btn-copy');
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
  });
}

// ---- Load and render all projects ----
async function loadProjects() {
  const list = document.getElementById('adminProjectsList');
  list.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const projects = await supabase.select('projects');

    if (!projects || projects.length === 0) {
      list.innerHTML = '<p style="color:var(--text-3);text-align:center;padding:40px">No projects yet. Upload your first design.</p>';
      return;
    }

    list.innerHTML = '';
    projects.forEach((project, index) => {
      const card = document.createElement('div');
      card.className = 'admin-project-card';
      card.style.animationDelay = `${index * 0.06}s`;

      const assetUrl = getProjectAssetUrl(project);
      const isPdf = isPdfAsset(assetUrl);
      const clientLink = `${getSiteBaseUrl()}/client.html?project=${project.id}`;
      const storagePath = extractStoragePath(assetUrl);

      card.innerHTML = `
        <div class="admin-card-thumb">
          ${isPdf
            ? `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--text-3)">
                 <div style="font-size:2rem">&#128196;</div>
                 <span style="font-size:0.8rem">PDF</span>
               </div>`
            : `<img src="${assetUrl}" alt="${project.title}" loading="lazy" />`
          }
        </div>
        <div class="admin-card-body">
          <div class="admin-card-title">${project.title}</div>
          <div class="admin-card-meta">${project.category || ''}${project.user_id ? ' · ' + project.user_id : ''}</div>
          <div class="admin-card-actions">
            <button class="btn-sm" onclick="copyProjectLink('${clientLink}', this)">Copy Link</button>
            <a href="client.html?project=${project.id}" class="btn-sm" target="_blank">Preview</a>
            <button class="btn-sm danger" onclick="confirmDelete('${project.id}', '${storagePath || ''}')">Delete</button>
          </div>
        </div>
      `;

      list.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load projects from Supabase:', err);
    list.innerHTML = '<p style="color:var(--danger);text-align:center;padding:40px">Could not load projects from Supabase. Check your table RLS/API setup and reload.</p>';
  }
}

function copyProjectLink(link, btn) {
  navigator.clipboard.writeText(link).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

// ---- Delete Project ----
function confirmDelete(id, storagePath) {
  deleteTargetId = id;
  deleteTargetStoragePath = storagePath;
  document.getElementById('deleteModal').classList.add('active');

  document.getElementById('confirmDeleteBtn').onclick = async () => {
    try {
      await supabase.delete('projects', deleteTargetId);
      if (deleteTargetStoragePath) {
        await supabase.deleteFile('designs', deleteTargetStoragePath).catch(() => {});
      }
      // Also remove feedback
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback?project_id=eq.${deleteTargetId}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          }
        });
      } catch(e) {}
    } catch (err) {
      console.error('Could not delete project from Supabase:', err);
      alert('Delete failed in Supabase. Please verify RLS policies for projects/storage.');
    }

    closeDeleteModal();
    loadProjects();
  };
}

function closeDeleteModal(event) {
  if (!event || event.target === document.getElementById('deleteModal')) {
    document.getElementById('deleteModal').classList.remove('active');
    deleteTargetId = null;
    deleteTargetStoragePath = null;
  }
}

// ---- Load Feedback ----
async function loadFeedback() {
  const list = document.getElementById('adminFeedbackList');
  list.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const feedback = await supabase.select('feedback', '?order=created_at.desc');

    if (!feedback || feedback.length === 0) {
      list.innerHTML = '<p style="color:var(--text-3);text-align:center;padding:40px">No client feedback yet.</p>';
      return;
    }

    // Group by project
    const byProject = {};
    feedback.forEach(f => {
      if (!byProject[f.project_id]) byProject[f.project_id] = [];
      byProject[f.project_id].push(f);
    });

    list.innerHTML = '';

    for (const [projectId, items] of Object.entries(byProject)) {
      const card = document.createElement('div');
      card.className = 'feedback-card';

      const decision = items.find(f => f.type === 'decision');
      const annotations = items.filter(f => f.type === 'annotation');

      card.innerHTML = `
        <div class="feedback-card-title">Project: ${projectId}</div>
        <div class="feedback-card-meta">
          ${items.length} feedback item(s) · ${formatDate(items[0].created_at)}
          ${decision ? ` · Decision: <strong style="color:${decision.value === 'approved' ? 'var(--approve)' : 'var(--changes)'}">${decision.value === 'approved' ? 'Approved' : 'Needs Changes'}</strong>` : ''}
        </div>
        <div class="feedback-comments">
          ${annotations.map((ann, i) => `
            <div class="feedback-comment">
              <div class="feedback-comment-num">Comment ${i + 1} · Position: ${Math.round(ann.x_percent)}%, ${Math.round(ann.y_percent)}%</div>
              ${ann.comment}
            </div>
          `).join('')}
          ${annotations.length === 0 ? '<p style="color:var(--text-3);font-size:0.85rem">No annotation comments.</p>' : ''}
        </div>
      `;

      list.appendChild(card);
    }
  } catch (err) {
    console.error('Failed to load feedback from Supabase:', err);
    list.innerHTML = '<p style="color:var(--danger);text-align:center;padding:40px">Could not load feedback from Supabase. Check RLS policies and reload.</p>';
  }
}

// ---- Helpers ----
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function extractStoragePath(publicUrl) {
  if (!publicUrl) return '';
  const marker = '/storage/v1/object/public/designs/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return '';
  return publicUrl.substring(idx + marker.length);
}

function getProjectAssetUrl(project) {
  return project.image_url || project.file_url || '';
}

function isPdfAsset(url) {
  return url.toLowerCase().includes('.pdf');
}

async function insertProjectWithSchemaFallback(projectData) {
  if (!hasCategoryColumn) {
    const { category: _omit, ...withoutCategory } = projectData;
    return supabase.insert('projects', withoutCategory);
  }

  try {
    return await supabase.insert('projects', projectData);
  } catch (err) {
    const message = (err && err.message) || '';
    const rlsDenied = message.includes('"code":"42501"') || message.includes('row-level security policy');
    if (rlsDenied) {
      throw new Error(
        'RLS blockiert INSERT auf projects (42501). ' +
        'Erstelle in Supabase eine INSERT-Policy für anon/authenticated oder deaktiviere RLS für diese Tabelle.'
      );
    }

    const categoryMissing = message.includes('PGRST204') && message.includes("'category' column");
    if (!categoryMissing) throw err;

    hasCategoryColumn = false;
    const { category: _omit, ...withoutCategory } = projectData;
    try {
      return await supabase.insert('projects', withoutCategory);
    } catch (fallbackErr) {
      const fallbackMessage = (fallbackErr && fallbackErr.message) || '';
      const rlsDeniedFallback = fallbackMessage.includes('"code":"42501"') || fallbackMessage.includes('row-level security policy');
      if (rlsDeniedFallback) {
        throw new Error(
          'RLS blockiert INSERT auf projects (42501). ' +
          'Erstelle in Supabase eine INSERT-Policy für anon/authenticated oder deaktiviere RLS für diese Tabelle.'
        );
      }
      throw fallbackErr;
    }
  }
}
