/* ============================================================
   AURA DESIGN — Client Review Page (client.js)
   Displays project, handles annotations, feedback submission
   ============================================================ */

let currentProject = null;
let annotations = [];
let pendingAnnotation = null; // stores { x_percent, y_percent } before comment entered
let annotationModeActive = false;
let selectedDecision = null;

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('project');

  if (!projectId) {
    showNotFound();
    return;
  }

  await loadProject(projectId);
});

// ---- Load project from Supabase ----
async function loadProject(projectId) {
  try {
    const projects = await supabase.select('projects', `?id=eq.${projectId}`);

    if (!projects || projects.length === 0) {
      showNotFound();
      return;
    }

    currentProject = projects[0];
    renderProject(currentProject);
    await loadExistingAnnotations(projectId);

  } catch (err) {
    console.error('Failed to load project:', err);
    showNotFound();
  }
}

// ---- Render project ----
function renderProject(project) {
  // Hide loading, show page
  document.getElementById('clientLoading').style.display = 'none';
  document.getElementById('clientPage').classList.remove('hidden');

  // Populate fields
  document.getElementById('clientTitle').textContent = project.title;
  document.getElementById('clientCategory').textContent = project.category || 'Design';
  document.getElementById('clientDesc').textContent = project.description || '';

  // Status badge
  const badge = document.getElementById('clientStatusBadge');
  badge.textContent = 'Live Review';
  badge.className = 'client-badge';

  // Download button
  const dlBtn = document.getElementById('downloadBtn');
  const assetUrl = getProjectAssetUrl(project);
  dlBtn.href = assetUrl;
  dlBtn.download = project.title;

  // Render file
  const img = document.getElementById('designImage');
  const pdf = document.getElementById('designPdf');

  const isPdf = isPdfAsset(assetUrl);
  if (isPdf) {
    pdf.src = assetUrl;
    pdf.style.display = 'block';
    img.style.display = 'none';
  } else {
    img.src = assetUrl;
    img.style.display = 'block';
    pdf.style.display = 'none';
  }

  // Set page title
  document.title = `${project.title} — Aura Design`;

  // Setup annotation click handler on the design viewer
  setupAnnotationLayer();
}

// ---- Show not found ----
function showNotFound() {
  document.getElementById('clientLoading').style.display = 'none';
  document.getElementById('clientNotFound').classList.remove('hidden');
}

// ---- Annotation System ----
function setupAnnotationLayer() {
  const layer = document.getElementById('annotationsLayer');

  layer.addEventListener('click', (e) => {
    if (!annotationModeActive) return;

    // Get click position as % of design viewer
    const rect = layer.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Store pending annotation position
    pendingAnnotation = { x_percent: x, y_percent: y };

    // Open comment modal
    openAnnotationModal();
  });
}

function toggleAnnotationMode() {
  annotationModeActive = !annotationModeActive;
  const btn = document.getElementById('annotationToggle');
  const layer = document.getElementById('annotationsLayer');
  const hint = document.getElementById('annotationHint');

  if (annotationModeActive) {
    layer.classList.add('annotation-mode');
    btn.classList.add('annotation-active');
    btn.textContent = 'Stop Adding Comments';
    hint.classList.add('visible');
  } else {
    layer.classList.remove('annotation-mode');
    btn.classList.remove('annotation-active');
    btn.textContent = 'Add Comment';
    hint.classList.remove('visible');
  }
}

function openAnnotationModal() {
  document.getElementById('annotationComment').value = '';
  document.getElementById('annotationModal').classList.add('active');
  setTimeout(() => document.getElementById('annotationComment').focus(), 100);
}

function closeAnnotationModal(event) {
  if (!event || event.target === document.getElementById('annotationModal')) {
    document.getElementById('annotationModal').classList.remove('active');
    pendingAnnotation = null;
  }
}

function saveAnnotation() {
  const comment = document.getElementById('annotationComment').value.trim();
  if (!comment) return;
  if (!pendingAnnotation) return;

  const annotation = {
    id: Date.now().toString(),
    x_percent: pendingAnnotation.x_percent,
    y_percent: pendingAnnotation.y_percent,
    comment,
    project_id: currentProject.id,
    type: 'annotation',
    created_at: new Date().toISOString()
  };

  annotations.push(annotation);
  renderAnnotationMarker(annotation);
  renderCommentInPanel(annotation);
  updateCommentCount();

  document.getElementById('annotationModal').classList.remove('active');
  pendingAnnotation = null;
}

// ---- Render marker dot on design ----
function renderAnnotationMarker(annotation) {
  const layer = document.getElementById('annotationsLayer');
  const num = annotations.indexOf(annotation) + 1;

  const marker = document.createElement('div');
  marker.className = 'annotation-marker';
  marker.style.left = annotation.x_percent + '%';
  marker.style.top = annotation.y_percent + '%';
  marker.textContent = num;
  marker.dataset.id = annotation.id;

  // Tooltip on hover
  const tooltip = document.createElement('div');
  tooltip.className = 'annotation-tooltip';
  tooltip.textContent = annotation.comment;
  // Position tooltip - avoid overflow
  tooltip.style.top = annotation.y_percent > 80 ? 'auto' : '34px';
  tooltip.style.bottom = annotation.y_percent > 80 ? '34px' : 'auto';
  tooltip.style.left = annotation.x_percent > 70 ? 'auto' : '0';
  tooltip.style.right = annotation.x_percent > 70 ? '0' : 'auto';

  marker.appendChild(tooltip);
  layer.appendChild(marker);
}

// ---- Render comment in side panel ----
function renderCommentInPanel(annotation) {
  const list = document.getElementById('commentsList');
  const num = annotations.indexOf(annotation) + 1;

  // Clear empty state
  const empty = list.querySelector('.empty-comments');
  if (empty) empty.remove();

  const item = document.createElement('div');
  item.className = 'comment-item';
  item.innerHTML = `
    <div class="comment-num">${num}</div>
    <div class="comment-text">${annotation.comment}</div>
  `;
  list.appendChild(item);
}

function updateCommentCount() {
  document.getElementById('commentCount').textContent = annotations.length;
  document.getElementById('submitHint').textContent =
    `${annotations.length} comment${annotations.length !== 1 ? 's' : ''} added. Select a decision and submit.`;
}

// ---- Load existing annotations from Supabase ----
async function loadExistingAnnotations(projectId) {
  try {
    const saved = await supabase.select('feedback', `?project_id=eq.${projectId}&type=eq.annotation&order=created_at.asc`);

    if (saved && saved.length > 0) {
      saved.forEach(ann => {
        annotations.push(ann);
        renderAnnotationMarker(ann);
        renderCommentInPanel(ann);
      });
      updateCommentCount();
    }

    // Load decision if already submitted
    try {
      const decisions = await supabase.select('feedback', `?project_id=eq.${projectId}&type=eq.decision`);

      if (decisions && decisions.length > 0) {
        const dec = decisions[0];
        selectedDecision = dec.value;
        showDecisionNote(dec.value);
        document.getElementById('btnApprove').classList.toggle('selected', dec.value === 'approved');
        document.getElementById('btnChanges').classList.toggle('selected', dec.value === 'needs_changes');
      }
    } catch (e) {}

  } catch (err) {
    console.error('Could not load existing annotations:', err);
  }
}

// ---- Decision buttons ----
function submitDecision(decision) {
  selectedDecision = decision;

  document.getElementById('btnApprove').classList.toggle('selected', decision === 'approved');
  document.getElementById('btnChanges').classList.toggle('selected', decision === 'needs_changes');

  showDecisionNote(decision);
}

function showDecisionNote(decision) {
  const note = document.getElementById('decisionNote');
  const noteText = document.getElementById('decisionNoteText');
  note.style.display = 'block';

  if (decision === 'approved') {
    noteText.textContent = 'You have approved this design. Click "Submit Feedback" to confirm.';
  } else {
    noteText.textContent = 'You have requested changes. Add your comments on the design, then submit.';
  }
}

// ---- Submit all feedback ----
async function submitAllFeedback() {
  if (!selectedDecision) {
    alert('Please select "Approved" or "Needs Changes" before submitting.');
    return;
  }

  const btn = document.getElementById('submitFeedbackBtn');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    // 1. Save all annotations to Supabase
    const savePromises = annotations.map(ann => {
      const data = {
        project_id: currentProject.id,
        type: 'annotation',
        x_percent: ann.x_percent,
        y_percent: ann.y_percent,
        comment: ann.comment,
        created_at: new Date().toISOString()
      };
      return supabase.insert('feedback', data);
    });

    // 2. Save decision
    const decisionData = {
      project_id: currentProject.id,
      type: 'decision',
      value: selectedDecision,
      created_at: new Date().toISOString()
    };

    await Promise.all([
      ...savePromises,
      supabase.insert('feedback', decisionData)
    ]);

    // Show thank you modal
    document.getElementById('thankYouModal').style.display = 'flex';

    // Update badge
    const badge = document.getElementById('clientStatusBadge');
    if (selectedDecision === 'approved') {
      badge.textContent = 'Approved';
      badge.className = 'client-badge approved';
    } else {
      badge.textContent = 'Needs Changes';
      badge.className = 'client-badge changes';
    }

    // Turn off annotation mode
    if (annotationModeActive) toggleAnnotationMode();

    btn.textContent = 'Feedback Submitted';

  } catch (err) {
    console.error('Submission error:', err);
    alert('Could not submit to Supabase. Please check internet/RLS and try again.');
    btn.disabled = false;
    btn.textContent = 'Submit Feedback';
  }
}

function getProjectAssetUrl(project) {
  return project.image_url || project.file_url || '';
}

function isPdfAsset(url) {
  return url.toLowerCase().includes('.pdf');
}
