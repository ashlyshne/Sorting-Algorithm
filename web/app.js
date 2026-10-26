const numbersInput = document.querySelector('#numbers-input');
const numberCount = document.querySelector('#number-count');
const errorMessage = document.querySelector('#error-message');
const chart = document.querySelector('#bar-chart');
const startButton = document.querySelector('#start-button');
const randomizeButton = document.querySelector('#randomize-button');
const resetButton = document.querySelector('#reset-button');
const playPauseButton = document.querySelector('#play-pause-button');
const playPauseIcon = document.querySelector('#play-pause-icon');
const progressSlider = document.querySelector('#progress-slider');
const speedSelect = document.querySelector('#speed-select');
const stepCount = document.querySelector('#step-count');
const elapsedTime = document.querySelector('#elapsed-time');
const stepLabel = document.querySelector('#step-label');
const stateBadge = document.querySelector('.sort-state');
const stateText = document.querySelector('#state-text');
const stateDot = document.querySelector('#state-dot');
const methodName = document.querySelector('#method-name');
const completeMark = document.querySelector('#complete-mark');
const algorithmExplanation = document.querySelector('#algorithm-explanation');
const stepTitle = document.querySelector('#step-title');
const stepExplanation = document.querySelector('#step-explanation');
const stepProcedure = document.querySelector('#step-procedure');
const previousStepButton = document.querySelector('#previous-step-button');
const nextStepButton = document.querySelector('#next-step-button');
const pseudocode = document.querySelector('#pseudocode');
const flowchart = document.querySelector('#flowchart');
const resultMessage = document.querySelector('#result-message');
const resultValues = document.querySelector('#result-values');

const explanations = {
  quick: 'Quick Sort picks a pivot, groups smaller values to its left, then repeats on each side.',
  merge: 'Merge Sort splits the list into smaller halves, then combines each pair in sorted order.'
};

const algorithmGuides = {
  quick: {
    pseudocode: `QUICK-SORT(A, low, high)\n  if low >= high: return\n  pivot = A[high]\n  boundary = low\n\n  for index from low to high - 1:\n    if A[index] <= pivot:\n      swap A[boundary] and A[index]\n      boundary = boundary + 1\n\n  swap A[boundary] and A[high]\n  QUICK-SORT(A, low, boundary - 1)\n  QUICK-SORT(A, boundary + 1, high)`,
    flow: [
      { type: 'start', text: 'Start with section A[low…high]' },
      { type: 'decision', text: 'Is low < high?', branches: [['Yes', 'Choose last value as pivot'], ['No', 'Section has 0 or 1 value'] ] },
      { type: 'process', text: 'Scan values from low to high − 1' },
      { type: 'decision', text: 'Is current value ≤ pivot?', branches: [['Yes', 'Swap into left partition; advance boundary'], ['No', 'Leave in right partition'] ] },
      { type: 'process', text: 'Repeat comparison for each value' },
      { type: 'process', text: 'Place pivot at the boundary' },
      { type: 'process', text: 'Recursively sort left and right sections' },
      { type: 'end', text: 'Done: pivot stays in final position' }
    ]
  },
  merge: {
    pseudocode: `MERGE-SORT(A, start, end)\n  if start >= end: return\n  middle = floor((start + end) / 2)\n\n  MERGE-SORT(A, start, middle)\n  MERGE-SORT(A, middle + 1, end)\n  MERGE(A, start, middle, end)\n\nMERGE(A, start, middle, end)\n  compare front of each sorted half\n  copy the smaller value to output\n  advance that half's pointer\n  repeat until one half is empty\n  append remaining values`,
    flow: [
      { type: 'start', text: 'Start with section A[start…end]' },
      { type: 'decision', text: 'Does section contain 2+ values?', branches: [['Yes', 'Find the midpoint'], ['No', 'Already sorted'] ] },
      { type: 'process', text: 'Split into left and right halves' },
      { type: 'process', text: 'Sort each half recursively' },
      { type: 'process', text: 'Compare the front values of both halves' },
      { type: 'decision', text: 'Which front value is smaller?', branches: [['Left', 'Copy left value; advance left pointer'], ['Right', 'Copy right value; advance right pointer'] ] },
      { type: 'process', text: 'Repeat, then append any remaining values' },
      { type: 'end', text: 'Done: merged section is sorted' }
    ]
  }
};

function renderAlgorithmGuide(algorithm) {
  const guide = algorithmGuides[algorithm];
  pseudocode.textContent = guide.pseudocode;
  flowchart.replaceChildren();
  guide.flow.forEach((item, index) => {
    if (index > 0) {
      const arrow = document.createElement('div');
      arrow.className = 'flow-arrow';
      arrow.textContent = '↓';
      flowchart.append(arrow);
    }
    const node = document.createElement('div');
    node.className = `flow-node ${item.type}`;
    node.textContent = item.text;
    flowchart.append(node);
    if (item.branches) {
      const branches = document.createElement('div');
      branches.className = 'flow-branches';
      item.branches.forEach(([choice, text]) => {
        const branch = document.createElement('div');
        branch.className = 'flow-branch';
        const tag = document.createElement('span');
        tag.textContent = choice;
        const branchNode = document.createElement('div');
        branchNode.textContent = text;
        branch.append(tag, branchNode);
        branches.append(branch);
      });
      flowchart.append(branches);
    }
  });
}

let originalValues = [38, 12, 27, 5, 44, 19, 31, 8];
let steps = [];
let currentStep = 0;
let timerId = null;
let animationStartedAt = 0;
let accumulatedTime = 0;
let activeValues = originalValues;

function selectedAlgorithm() {
  return document.querySelector('input[name="algorithm"]:checked').value;
}

function parseInput() {
  const tokens = numbersInput.value.split(',').map((token) => token.trim());
  if (tokens.length < 2 || tokens.length > 80 || tokens.some((token) => !/^\d+$/.test(token))) {
    throw new Error('Enter 2 to 80 whole numbers, separated by commas.');
  }
  const values = tokens.map(Number);
  if (values.some((value) => !Number.isSafeInteger(value) || value > 2147483647)) {
    throw new Error('Each number must be between 0 and 2,147,483,647.');
  }
  return values;
}

function updateCount() {
  const count = numbersInput.value.split(',').filter((token) => token.trim()).length;
  numberCount.textContent = `${Math.min(count, 80)} / 80`;
  numberCount.classList.toggle('over-limit', count > 80);
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = !message;
}

function setState(state) {
  stateBadge.classList.toggle('running', state === 'RUNNING');
  stateBadge.classList.toggle('done', state === 'COMPLETE');
  stateText.textContent = state;
  stateDot.setAttribute('aria-label', state.toLowerCase());
  completeMark.classList.toggle('visible', state === 'COMPLETE');
}

function renderBars(values, activeStart = -1, activeEnd = -1) {
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const span = maximum - minimum || 1;
  chart.replaceChildren();
  chart.setAttribute('aria-label', `Numbers: ${values.join(', ')}`);

  values.forEach((value, index) => {
    const bar = document.createElement('div');
    const inRange = index >= activeStart && index <= activeEnd;
    const height = 16 + ((value - minimum) / span) * 77;
    bar.className = `bar${inRange ? ' active' : ''}`;
    bar.style.height = `${height}%`;
    bar.setAttribute('aria-label', String(value));

    const label = document.createElement('span');
    label.className = 'bar-value';
    label.textContent = value;
    bar.append(label);
    chart.append(bar);
  });
}

function updateProgress(stepIndex) {
  const total = steps.length;
  currentStep = stepIndex;
  const shownStep = total === 0 ? 0 : Math.min(stepIndex + 1, total);
  stepCount.innerHTML = `${shownStep} <span>/ ${total}</span>`;
  progressSlider.max = String(Math.max(0, total - 1));
  progressSlider.value = String(Math.max(0, Math.min(stepIndex, total - 1)));

  if (total === 0) {
    renderBars(activeValues);
    stepLabel.textContent = 'Your list is ready when you are.';
    stepTitle.textContent = 'Ready to explore?';
    stepExplanation.textContent = 'Start a sort to see each comparison, split, and placement explained as it happens.';
    stepProcedure.replaceChildren();
    previousStepButton.disabled = true;
    nextStepButton.disabled = true;
    return;
  }

  const step = steps[Math.min(stepIndex, total - 1)];
  renderBars(step.values, step.start, step.end);
  stepLabel.textContent = step.label;
  stepTitle.textContent = step.label;
  stepExplanation.textContent = step.explanation;
  stepProcedure.replaceChildren();
  (step.procedure || []).forEach((item) => {
    const procedureItem = document.createElement('li');
    procedureItem.textContent = item;
    stepProcedure.append(procedureItem);
  });
  previousStepButton.disabled = stepIndex <= 0;
  nextStepButton.disabled = stepIndex >= total - 1;
  if (stepIndex >= total - 1) showSortedResult();
}

function updateElapsed() {
  const elapsed = accumulatedTime + (timerId ? performance.now() - animationStartedAt : 0);
  elapsedTime.innerHTML = `${(elapsed / 1000).toFixed(1)}<span> s</span>`;
}

function stopTimer() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
    accumulatedTime += performance.now() - animationStartedAt;
  }
  updateElapsed();
  playPauseIcon.textContent = '▶';
  playPauseButton.setAttribute('aria-label', 'Play animation');
}

function finishAnimation() {
  stopTimer();
  setState('COMPLETE');
  playPauseButton.disabled = true;
  playPauseIcon.textContent = '✓';
  playPauseButton.setAttribute('aria-label', 'Animation complete');
  updateProgress(steps.length - 1);
  showSortedResult();
}

function showSortedResult() {
  const sorted = steps.length ? steps[steps.length - 1].values : [...activeValues].sort((a, b) => a - b);
  resultMessage.textContent = `Finished in ${steps.length} simulation steps. Here is the list in ascending order:`;
  resultValues.replaceChildren();
  sorted.forEach((value) => {
    const item = document.createElement('li');
    item.textContent = value;
    resultValues.append(item);
  });
}

function scheduleNextStep() {
  if (currentStep >= steps.length - 1) {
    finishAnimation();
    return;
  }
  timerId = setTimeout(() => {
    accumulatedTime += performance.now() - animationStartedAt;
    timerId = null;
    currentStep += 1;
    updateProgress(currentStep);
    if (currentStep >= steps.length - 1) {
      finishAnimation();
      return;
    }
    scheduleNextStep();
  }, Number(speedSelect.value));
  animationStartedAt = performance.now();
  playPauseIcon.textContent = 'Ⅱ';
  playPauseButton.setAttribute('aria-label', 'Pause animation');
}

function beginAnimation() {
  accumulatedTime = 0;
  currentStep = 0;
  playPauseButton.disabled = false;
  setState('RUNNING');
  updateProgress(0);
  updateElapsed();
  scheduleNextStep();
}

async function startSort() {
  stopTimer();
  showError('');
  startButton.disabled = true;
  try {
    activeValues = parseInput();
    originalValues = [...activeValues];
    const algorithm = selectedAlgorithm();
    const response = await fetch('/api/sort', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ algorithm, numbers: activeValues })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The sort could not be started.');

    steps = result.steps;
    resultMessage.textContent = 'Sorting in progress… the final sequence will appear here.';
    resultValues.replaceChildren();
    methodName.textContent = algorithm === 'quick' ? 'Quick Sort' : 'Merge Sort';
    algorithmExplanation.textContent = explanations[algorithm];
    beginAnimation();
  } catch (error) {
    setState('READY');
    showError(error instanceof TypeError ? 'Could not reach Sort Lab. Make sure the Java server is running.' : error.message);
  } finally {
    startButton.disabled = false;
  }
}

function resetSort() {
  stopTimer();
  showError('');
  activeValues = [...originalValues];
  steps = [];
  currentStep = 0;
  accumulatedTime = 0;
  stepCount.innerHTML = '0 <span>/ 0</span>';
  elapsedTime.innerHTML = '0.0<span> s</span>';
  stepLabel.textContent = 'Your list is ready when you are.';
  progressSlider.max = '0';
  progressSlider.value = '0';
  stepTitle.textContent = 'Ready to explore?';
  stepExplanation.textContent = 'Start a sort to see each comparison, split, and placement explained as it happens.';
  stepProcedure.replaceChildren();
  resultMessage.textContent = 'Run the simulation to reveal the ordered sequence.';
  resultValues.replaceChildren();
  setState('READY');
  playPauseButton.disabled = true;
  playPauseIcon.textContent = '▶';
  playPauseButton.setAttribute('aria-label', 'Play animation');
  renderBars(activeValues);
}

function randomize() {
  const count = 8 + Math.floor(Math.random() * 9);
  const values = Array.from({ length: count }, () => Math.floor(Math.random() * 96) + 5);
  numbersInput.value = values.join(', ');
  updateCount();
  originalValues = values;
  resetSort();
}

startButton.addEventListener('click', startSort);
randomizeButton.addEventListener('click', randomize);
resetButton.addEventListener('click', resetSort);
numbersInput.addEventListener('input', updateCount);
document.querySelectorAll('input[name="algorithm"]').forEach((input) => {
  input.addEventListener('change', () => {
    algorithmExplanation.textContent = explanations[selectedAlgorithm()];
    methodName.textContent = selectedAlgorithm() === 'quick' ? 'Quick Sort' : 'Merge Sort';
    renderAlgorithmGuide(selectedAlgorithm());
  });
});

playPauseButton.addEventListener('click', () => {
  if (timerId) {
    stopTimer();
    setState('READY');
  } else if (steps.length && currentStep < steps.length - 1) {
    setState('RUNNING');
    scheduleNextStep();
  }
});

progressSlider.addEventListener('input', () => {
  stopTimer();
  setState('READY');
  if (steps.length) {
    updateProgress(Number(progressSlider.value));
    playPauseButton.disabled = currentStep >= steps.length - 1;
    if (!playPauseButton.disabled) {
      playPauseIcon.textContent = '▶';
      playPauseButton.setAttribute('aria-label', 'Play animation');
    }
  }
});

previousStepButton.addEventListener('click', () => {
  stopTimer();
  setState('READY');
  if (steps.length) {
    updateProgress(Math.max(0, currentStep - 1));
    playPauseButton.disabled = false;
  }
});

nextStepButton.addEventListener('click', () => {
  stopTimer();
  setState('READY');
  if (steps.length) {
    updateProgress(Math.min(steps.length - 1, currentStep + 1));
    playPauseButton.disabled = currentStep >= steps.length - 1;
    if (!playPauseButton.disabled) {
      playPauseIcon.textContent = '▶';
      playPauseButton.setAttribute('aria-label', 'Play animation');
    }
  }
});

speedSelect.addEventListener('change', () => {
  if (timerId) {
    stopTimer();
    setState('RUNNING');
    scheduleNextStep();
  }
});

window.setInterval(updateElapsed, 100);
updateCount();
renderBars(originalValues);
renderAlgorithmGuide(selectedAlgorithm());
