// DOM Elements
const visualizerContainer = document.getElementById('visualizer-container');
const generateArrayBtn = document.getElementById('generate-array-btn');
const startSortBtn = document.getElementById('start-sort-btn');
const pauseSortBtn = document.getElementById('pause-sort-btn');
const resumeSortBtn = document.getElementById('resume-sort-btn');
const arraySizeSlider = document.getElementById('array-size');
const speedSlider = document.getElementById('speed-slider');
const algorithmSelector = document.getElementById('algorithm-selector');
const explainBtn = document.getElementById('explain-btn');
const quizBtn = document.getElementById('quiz-btn');
const explanationText = document.getElementById('explanation-text');
const quizContainer = document.getElementById('quiz-container');
const quizContent = document.getElementById('quiz-content');
const comparisonsCount = document.getElementById('comparisons-count');
const swapsCount = document.getElementById('swaps-count');
const userInput = document.getElementById('user-input');
const useCustomBtn = document.getElementById('use-custom-btn');
const messageBox = document.getElementById('message-box');

// State
let array = [];
let arraySize = 15;
let animationSpeed = 50;
let isSorting = false;
let isPaused = false;
let animationIndex = 0;
let animations = [];
let comparisonCounter = 0;
let swapCounter = 0;

// Gemini API Configuration
const API_KEY = ""; // Use the provided API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

// Event Listeners
generateArrayBtn.addEventListener('click', () => {
    if (!isSorting) {
        generateArray();
    }
});
startSortBtn.addEventListener('click', () => {
    if (!isSorting) {
        startSorting();
    }
});
pauseSortBtn.addEventListener('click', () => {
    isPaused = true;
    pauseSortBtn.classList.add('hidden');
    resumeSortBtn.classList.remove('hidden');
});
resumeSortBtn.addEventListener('click', () => {
    isPaused = false;
    pauseSortBtn.classList.remove('hidden');
    resumeSortBtn.classList.add('hidden');
    animateSorting(animations, document.querySelectorAll('.bar'), animationIndex);
});
arraySizeSlider.addEventListener('input', () => {
    if (!isSorting) {
        arraySize = arraySizeSlider.value;
        generateArray();
    }
});
speedSlider.addEventListener('input', () => {
    // Reversing the speed logic: higher slider value means faster speed (less delay)
    const minSliderValue = 10;
    const maxSliderValue = 500;
    const newMinSpeed = 10;
    const newMaxSpeed = 500;
    const currentSliderValue = parseInt(speedSlider.value);
    
    animationSpeed = newMaxSpeed - (currentSliderValue - minSliderValue);
});
useCustomBtn.addEventListener('click', parseUserArray);

// New event listener for the Explain button
explainBtn.addEventListener('click', explainAlgorithm);
quizBtn.addEventListener('click', generateQuiz);

// Function to generate a new array
function generateArray() {
    isSorting = false;
    isPaused = false;
    messageBox.style.display = 'none';
    array = [];
    visualizerContainer.innerHTML = '';
    comparisonCounter = 0;
    swapCounter = 0;
    comparisonsCount.textContent = 0;
    swapsCount.textContent = 0;
    for (let i = 0; i < arraySize; i++) {
        // Values between 10 and 380 to ensure they fit in the container
        const value = Math.floor(Math.random() * 370) + 10;
        array.push(value);
        const bar = document.createElement('div');
        bar.classList.add('bar');
        bar.style.height = `${value}px`;

        // Add a span to display the bar value
        const barValue = document.createElement('span');
        barValue.classList.add('bar-value');
        barValue.textContent = value;
        bar.appendChild(barValue);

        visualizerContainer.appendChild(bar);
    }
    // Enable buttons after generating new array
    startSortBtn.disabled = false;
    generateArrayBtn.disabled = false;
    arraySizeSlider.disabled = false;
    speedSlider.disabled = false;
    algorithmSelector.disabled = false;
    explainBtn.disabled = false;
    quizBtn.disabled = false;
    pauseSortBtn.classList.add('hidden');
    resumeSortBtn.classList.add('hidden');
}

// Function to parse and use a user-defined array
function parseUserArray() {
    if (isSorting) return;
    const rawInput = userInput.value;
    const parsedArray = rawInput.split(',').map(num => parseInt(num.trim(), 10));

    // Validation
    const invalidNumbers = parsedArray.some(isNaN);
    if (invalidNumbers) {
        showMessage("Invalid input. Please enter a comma-separated list of numbers.", "error");
        return;
    }

    if (parsedArray.length < 5 || parsedArray.length > 15) {
        showMessage(`Array size must be between 5 and 15 numbers. You entered ${parsedArray.length}.`, "error");
        return;
    }

    // All good, use the custom array
    arraySize = parsedArray.length;
    array = parsedArray;
    visualizerContainer.innerHTML = '';
    
    // Re-generate bars from the new array
    for (let i = 0; i < arraySize; i++) {
        const value = array[i];
        const bar = document.createElement('div');
        bar.classList.add('bar');
        bar.style.height = `${value}px`;

        const barValue = document.createElement('span');
        barValue.classList.add('bar-value');
        barValue.textContent = value;
        bar.appendChild(barValue);

        visualizerContainer.appendChild(bar);
    }

    // Reset state and display success message
    isSorting = false;
    isPaused = false;
    comparisonCounter = 0;
    swapCounter = 0;
    comparisonsCount.textContent = 0;
    swapsCount.textContent = 0;
    showMessage("Custom array loaded successfully!", "success");
    
    startSortBtn.disabled = false;
    pauseSortBtn.classList.add('hidden');
    resumeSortBtn.classList.add('hidden');
}

// Function to show a message
function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.style.display = 'block';
    if (type === "error") {
        messageBox.style.backgroundColor = '#ef4444';
    } else {
        messageBox.style.backgroundColor = '#10b981';
    }
}


// Function to start the sorting process
async function startSorting() {
    isSorting = true;
    isPaused = false;
    messageBox.style.display = 'none';

    // Disable controls during sorting
    startSortBtn.disabled = true;
    generateArrayBtn.disabled = true;
    arraySizeSlider.disabled = true;
    speedSlider.disabled = true;
    algorithmSelector.disabled = true;
    explainBtn.disabled = true;
    quizBtn.disabled = true;
    useCustomBtn.disabled = true;

    // Show pause button
    pauseSortBtn.classList.remove('hidden');
    startSortBtn.classList.add('hidden');
    
    comparisonCounter = 0;
    swapsCount.textContent = 0;
    
    const algorithm = algorithmSelector.value;
    const bars = document.querySelectorAll('.bar');
    
    // Generate a list of animations
    animations = [];
    switch (algorithm) {
        case 'bubbleSort':
            animations = getBubbleSortAnimations(array.slice());
            break;
        case 'selectionSort':
            animations = getSelectionSortAnimations(array.slice());
            break;
        case 'insertionSort':
            animations = getInsertionSortAnimations(array.slice());
            break;
        case 'mergeSort':
            animations = getMergeSortAnimations(array.slice());
            break;
        case 'quickSort':
            animations = getQuickSortAnimations(array.slice());
            break;
        default:
            break;
    }

    // Execute the animations
    await animateSorting(animations, bars, 0);
    
    isSorting = false;
    // Re-enable controls after sorting is complete
    startSortBtn.disabled = false;
    generateArrayBtn.disabled = false;
    arraySizeSlider.disabled = false;
    speedSlider.disabled = false;
    algorithmSelector.disabled = false;
    explainBtn.disabled = false;
    quizBtn.disabled = false;
    useCustomBtn.disabled = false;
    pauseSortBtn.classList.add('hidden');
    resumeSortBtn.classList.add('hidden');
    startSortBtn.classList.remove('hidden');
}

// Function to get LLM explanation for the algorithm
async function explainAlgorithm() {
    explanationText.textContent = 'Generating explanation...';
    
    const algorithmName = algorithmSelector.options[algorithmSelector.selectedIndex].text;
    
    const prompt = `Explain the "${algorithmName}" sorting algorithm in simple terms for a beginner.
    Focus on the main steps and how it works. Keep the explanation concise and easy to understand.`;
    
    const payload = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }]
    };

    let retries = 0;
    const maxRetries = 3;
    const baseDelay = 1000;

    while (retries < maxRetries) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 429) {
                retries++;
                const delay = baseDelay * Math.pow(2, retries - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (!response.ok) {
                throw new Error(`API request failed with status: ${response.status}`);
            }

            const result = await response.json();
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'No explanation found.';
            explanationText.textContent = text;
            return; // Exit the loop on success
        } catch (error) {
            console.error('Error fetching explanation:', error);
            retries++;
            const delay = baseDelay * Math.pow(2, retries - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    explanationText.textContent = 'Failed to fetch explanation. Please try again.';
}

// Function to generate and display a quiz
async function generateQuiz() {
    quizContainer.classList.remove('hidden');
    quizContent.innerHTML = '<p>Generating quiz questions...</p>';

    const algorithmName = algorithmSelector.options[algorithmSelector.selectedIndex].text;
    const prompt = `Generate a 3-question multiple-choice quiz about "${algorithmName}" sorting.
    Provide the output in a JSON array format. Each object in the array should have "question" (string), "options" (array of strings), and "answer" (string, the correct option text).`;

    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        "question": { "type": "STRING" },
                        "options": {
                            "type": "ARRAY",
                            "items": { "type": "STRING" }
                        },
                        "answer": { "type": "STRING" }
                    }
                }
            }
        }
    };
    
    let retries = 0;
    const maxRetries = 3;
    const baseDelay = 1000;

    while (retries < maxRetries) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 429) {
                retries++;
                const delay = baseDelay * Math.pow(2, retries - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (!response.ok) {
                throw new Error(`API request failed with status: ${response.status}`);
            }

            const result = await response.json();
            const jsonString = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!jsonString) {
                quizContent.innerHTML = '<p>Failed to generate quiz. Please try again.</p>';
                return;
            }
            const quizData = JSON.parse(jsonString);
            renderQuiz(quizData);
            return;
        } catch (error) {
            console.error('Error fetching quiz:', error);
            retries++;
            const delay = baseDelay * Math.pow(2, retries - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    quizContent.innerHTML = '<p>Failed to fetch quiz. Please try again.</p>';
}

// Function to render the quiz questions
function renderQuiz(questions) {
    quizContent.innerHTML = '';
    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('mb-4');
        questionDiv.innerHTML = `<p class="font-bold">Q${index + 1}: ${q.question}</p>`;
        
        const optionsDiv = document.createElement('div');
        optionsDiv.classList.add('flex', 'flex-col', 'gap-2', 'mt-2');
        q.options.forEach(option => {
            const optionBtn = document.createElement('button');
            optionBtn.textContent = option;
            optionBtn.classList.add('quiz-option');
            optionBtn.onclick = () => checkAnswer(optionBtn, option, q.answer, optionsDiv);
            optionsDiv.appendChild(optionBtn);
        });
        questionDiv.appendChild(optionsDiv);
        quizContent.appendChild(questionDiv);
    });
}

// Function to check the user's answer
function checkAnswer(selectedBtn, selectedOption, correctAnswer, optionsDiv) {
    Array.from(optionsDiv.children).forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correctAnswer) {
            btn.classList.add('correct');
        }
    });

    if (selectedOption === correctAnswer) {
        selectedBtn.classList.add('correct');
    } else {
        selectedBtn.classList.add('incorrect');
    }
}


// Function to animate the sorting steps
async function animateSorting(animations, bars, index) {
    for (let i = index; i < animations.length; i++) {
        if (isPaused) {
            animationIndex = i;
            return;
        }
        const [action, ...args] = animations[i];
        
        if (action === 'compare') {
            const [barOneIdx, barTwoIdx] = args;
            bars[barOneIdx].classList.add('comparing');
            bars[barTwoIdx].classList.add('comparing');
            comparisonCounter++;
            comparisonsCount.textContent = comparisonCounter;
            await new Promise(resolve => setTimeout(resolve, animationSpeed));
            bars[barOneIdx].classList.remove('comparing');
            bars[barTwoIdx].classList.remove('comparing');
        } else if (action === 'swap') {
            const [barOneIdx, barTwoIdx] = args;
            const tempHeight = bars[barOneIdx].style.height;
            const tempValue = bars[barOneIdx].querySelector('.bar-value').textContent;
            
            bars[barOneIdx].classList.add('swapping');
            bars[barTwoIdx].classList.add('swapping');
            
            // Swap heights
            bars[barOneIdx].style.height = bars[barTwoIdx].style.height;
            bars[barTwoIdx].style.height = tempHeight;

            // Swap values
            bars[barOneIdx].querySelector('.bar-value').textContent = bars[barTwoIdx].querySelector('.bar-value').textContent;
            bars[barTwoIdx].querySelector('.bar-value').textContent = tempValue;

            swapCounter++;
            swapsCount.textContent = swapCounter;

            await new Promise(resolve => setTimeout(resolve, animationSpeed));
            
            bars[barOneIdx].classList.remove('swapping');
            bars[barTwoIdx].classList.remove('swapping');
        } else if (action === 'overwrite') {
            const [barIdx, newHeight] = args;
            bars[barIdx].style.height = `${newHeight}px`;
            bars[barIdx].querySelector('.bar-value').textContent = newHeight;
            bars[barIdx].classList.add('swapping');
            await new Promise(resolve => setTimeout(resolve, animationSpeed));
            bars[barIdx].classList.remove('swapping');
        } else if (action === 'sorted') {
            const [barIdx] = args;
            bars[barIdx].classList.add('sorted');
        } else if (action === 'highlight-active') {
            const [barIdx] = args;
            bars[barIdx].classList.add('active-element');
            await new Promise(resolve => setTimeout(resolve, animationSpeed));
            // The class is removed by the next action, e.g. a compare or overwrite
        } else if (action === 'remove-highlight-active') {
            const [barIdx] = args;
            bars[barIdx].classList.remove('active-element');
            await new Promise(resolve => setTimeout(resolve, animationSpeed));
        }
    }
}

// --- Sorting Algorithms ---

// Bubble Sort
function getBubbleSortAnimations(arr) {
    const animations = [];
    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            animations.push(['compare', j, j + 1]);
            if (arr[j] > arr[j + 1]) {
                animations.push(['swap', j, j + 1]);
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
        animations.push(['sorted', arr.length - 1 - i]);
    }
    animations.push(['sorted', 0]);
    return animations;
}

// Selection Sort
function getSelectionSortAnimations(arr) {
    const animations = [];
    for (let i = 0; i < arr.length - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < arr.length; j++) {
            animations.push(['compare', minIdx, j]);
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        animations.push(['swap', i, minIdx]);
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        animations.push(['sorted', i]);
    }
    animations.push(['sorted', arr.length - 1]);
    return animations;
}

// Insertion Sort
function getInsertionSortAnimations(arr) {
    const animations = [];
    for (let i = 1; i < arr.length; i++) {
        let key = arr[i];
        let j = i - 1;
        animations.push(['highlight-active', i]); // Highlight the bar to be inserted
        while (j >= 0 && arr[j] > key) {
            animations.push(['compare', i, j]);
            animations.push(['overwrite', j + 1, arr[j]]);
            arr[j + 1] = arr[j];
            j = j - 1;
            if (j >= 0) {
                animations.push(['compare', i, j]);
            }
        }
        animations.push(['overwrite', j + 1, key]);
        arr[j + 1] = key;
        animations.push(['remove-highlight-active', i]);
        animations.push(['sorted', i]);
    }
    // Mark all elements as sorted at the end
    for (let i = 0; i < arr.length; i++) {
        animations.push(['sorted', i]);
    }
    return animations;
}

// Merge Sort
function getMergeSortAnimations(arr) {
    const animations = [];
    if (arr.length <= 1) return arr;
    const auxiliaryArray = arr.slice();
    mergeSortHelper(arr, 0, arr.length - 1, auxiliaryArray, animations);
    return animations;
}

function mergeSortHelper(mainArray, startIdx, endIdx, auxiliaryArray, animations) {
    if (startIdx === endIdx) return;
    const middleIdx = Math.floor((startIdx + endIdx) / 2);
    mergeSortHelper(auxiliaryArray, startIdx, middleIdx, mainArray, animations);
    mergeSortHelper(auxiliaryArray, middleIdx + 1, endIdx, mainArray, animations);
    doMerge(mainArray, startIdx, middleIdx, endIdx, auxiliaryArray, animations);
}

function doMerge(mainArray, startIdx, middleIdx, endIdx, auxiliaryArray, animations) {
    let k = startIdx;
    let i = startIdx;
    let j = middleIdx + 1;
    while (i <= middleIdx && j <= endIdx) {
        animations.push(['compare', i, j]);
        if (auxiliaryArray[i] <= auxiliaryArray[j]) {
            animations.push(['overwrite', k, auxiliaryArray[i]]);
            mainArray[k++] = auxiliaryArray[i++];
        } else {
            animations.push(['overwrite', k, auxiliaryArray[j]]);
            mainArray[k++] = auxiliaryArray[j++];
        }
    }
    while (i <= middleIdx) {
        animations.push(['compare', i, i]);
        animations.push(['overwrite', k, auxiliaryArray[i]]);
        mainArray[k++] = auxiliaryArray[i++];
    }
    while (j <= endIdx) {
        animations.push(['compare', j, j]);
        animations.push(['overwrite', k, auxiliaryArray[j]]);
        mainArray[k++] = auxiliaryArray[j++];
    }
    for (let idx = startIdx; idx <= endIdx; idx++) {
        animations.push(['sorted', idx]);
    }
}

// Quick Sort (Lomuto Partition Scheme)
function getQuickSortAnimations(arr) {
    const animations = [];
    quickSortHelper(arr, 0, arr.length - 1, animations);
    return animations;
}

function quickSortHelper(arr, low, high, animations) {
    if (low < high) {
        const pi = partition(arr, low, high, animations);
        quickSortHelper(arr, low, pi - 1, animations);
        quickSortHelper(arr, pi + 1, high, animations);
    }
}

function partition(arr, low, high, animations) {
    const pivot = arr[high];
    animations.push(['highlight-active', high]); // Highlight the pivot
    let i = low - 1;
    for (let j = low; j < high; j++) {
        animations.push(['compare', j, high]); // Compare current element with pivot
        if (arr[j] <= pivot) {
            i++;
            animations.push(['swap', i, j]);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    animations.push(['swap', i + 1, high]);
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    animations.push(['remove-highlight-active', i + 1]);
    return i + 1;
}

// Initialize the app
generateArray();


