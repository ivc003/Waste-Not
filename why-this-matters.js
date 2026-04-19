// JavaScript for the Why This Matters page
// Displays the story/narrative content

let currentStepIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
  displayCurrentStep();
  setupNavigation();
});

function displayCurrentStep() {
  const step = storySteps[currentStepIndex];
  const container = document.getElementById('narration-box-static');
  
  container.innerHTML = `
    <div class="story-step">
      <h2 class="story-title">${step.title}</h2>
      <h3 class="story-subtitle">${step.subtitle}</h3>
      <p class="story-text">${step.text}</p>
      <div class="story-controls">
        <button id="prevBtn" class="story-nav-btn" ${currentStepIndex === 0 ? 'disabled' : ''}>← Previous</button>
        <span class="step-counter">${currentStepIndex + 1} of ${storySteps.length}</span>
        <button id="nextBtn" class="story-nav-btn" ${currentStepIndex === storySteps.length - 1 ? 'disabled' : ''}>Next →</button>
      </div>
    </div>
  `;
  
  // Attach event listeners
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', goToPreviousStep);
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', goToNextStep);
  }
}

function goToNextStep() {
  if (currentStepIndex < storySteps.length - 1) {
    currentStepIndex++;
    displayCurrentStep();
    window.scrollTo(0, 0);
  }
}

function goToPreviousStep() {
  if (currentStepIndex > 0) {
    currentStepIndex--;
    displayCurrentStep();
    window.scrollTo(0, 0);
  }
}

function setupNavigation() {
  // Allow keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') goToNextStep();
    if (e.key === 'ArrowLeft') goToPreviousStep();
  });
}
