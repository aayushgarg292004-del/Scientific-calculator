let currentInput = "";
let isDegree = true;
let lastResult = "";
let history = [];

const displayCurrent = document.getElementById('display-current');
const displayHistory = document.getElementById('display-history');
const historyContainer = document.getElementById('history-container');
const modeDegBtn = document.getElementById('mode-deg');
const modeRadBtn = document.getElementById('mode-rad');

// Mode toggle
modeDegBtn.addEventListener('click', () => {
    isDegree = true;
    modeDegBtn.className = "text-xs font-bold px-2 py-1 rounded bg-blue-500 dark:bg-calc-accent text-white transition-colors";
    modeRadBtn.className = "text-xs font-bold px-2 py-1 rounded text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors";
});

modeRadBtn.addEventListener('click', () => {
    isDegree = false;
    modeRadBtn.className = "text-xs font-bold px-2 py-1 rounded bg-blue-500 dark:bg-calc-accent text-white transition-colors";
    modeDegBtn.className = "text-xs font-bold px-2 py-1 rounded text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors";
});

function updateDisplay() {
    displayCurrent.innerText = currentInput || "0";
    displayCurrent.scrollLeft = displayCurrent.scrollWidth;
}

function inputValue(val) {
    if (currentInput === "Error" || currentInput === "Infinity") {
        currentInput = "";
    }
    currentInput += val;
    updateDisplay();
}

function inputFunc(func) {
    if (currentInput === "Error" || currentInput === "Infinity") {
        currentInput = "";
    }
    currentInput += func;
    updateDisplay();
}

function clearAll() {
    currentInput = "";
    displayHistory.innerText = "";
    updateDisplay();
}

function deleteLast() {
    if (currentInput === "Error" || currentInput === "Infinity") {
        currentInput = "";
    } else if (currentInput.length > 0) {
        const funcMatch = currentInput.match(/(sin\($|cos\($|tan\($|asin\($|acos\($|atan\($|log\($|ln\($|sqrt\($)/);
        if (funcMatch) {
            currentInput = currentInput.slice(0, -funcMatch[0].length);
        } else if (currentInput.endsWith('Ans')) {
            currentInput = currentInput.slice(0, -3);
        } else {
            currentInput = currentInput.slice(0, -1);
        }
    }
    updateDisplay();
}

function trigWrapper(func, val) {
    let radians = isDegree ? val * (Math.PI / 180) : val;
    let res = func(radians);
    if (Math.abs(res) < 1e-10) return 0;
    return res;
}

function invTrigWrapper(func, val) {
    let res = func(val);
    if (isDegree) {
        res = res * (180 / Math.PI);
    }
    return res;
}

function formatResult(num) {
    if (isNaN(num)) return "Error";
    if (!isFinite(num)) return "Infinity";
    let resStr = parseFloat(num.toFixed(10)).toString();
    if (resStr.replace('.', '').replace('-', '').length > 12) {
        resStr = num.toExponential(6);
    }
    return resStr;
}

function calculate() {
    if (!currentInput) return;
    try {
        let parsed = currentInput;
        parsed = parsed.replace(/(\d)(\()/g, '$1*$2');
        parsed = parsed.replace(/(\))(\()/g, '$1*$2');
        parsed = parsed.replace(/(\d)(π|e|sin|cos|tan|asin|acos|atan|log|ln|sqrt|Ans)/g, '$1*$2');
        parsed = parsed.replace(/(π|e)(\()/g, '$1*$2');
        parsed = parsed.replace(/(π|e)(\d)/g, '$1*$2');
        
        parsed = parsed.replace(/asin\(/g, 'invTrig(Math.asin, ');
        parsed = parsed.replace(/acos\(/g, 'invTrig(Math.acos, ');
        parsed = parsed.replace(/atan\(/g, 'invTrig(Math.atan, ');
        parsed = parsed.replace(/sin\(/g, 'trig(Math.sin, ');
        parsed = parsed.replace(/cos\(/g, 'trig(Math.cos, ');
        parsed = parsed.replace(/tan\(/g, 'trig(Math.tan, ');
        parsed = parsed.replace(/log\(/g, 'Math.log10(');
        parsed = parsed.replace(/ln\(/g, 'Math.log(');
        parsed = parsed.replace(/sqrt\(/g, 'Math.sqrt(');
        parsed = parsed.replace(/π/g, 'Math.PI');
        parsed = parsed.replace(/e/g, 'Math.E');
        parsed = parsed.replace(/\^/g, '**');
        parsed = parsed.replace(/×/g, '*');
        parsed = parsed.replace(/÷/g, '/');
        parsed = parsed.replace(/−/g, '-');
        
        parsed = parsed.replace(/--/g, '- -');
        
        const safeAns = lastResult ? `(${lastResult})` : '0';
        parsed = parsed.replace(/Ans/g, safeAns);

        let openParenCount = (parsed.match(/\(/g) || []).length;
        let closeParenCount = (parsed.match(/\)/g) || []).length;
        while (openParenCount > closeParenCount) {
            parsed += ')';
            closeParenCount++;
        }

        const result = new Function('trig', 'invTrig', `return ${parsed};`)(trigWrapper, invTrigWrapper);
        const formattedResult = formatResult(result);
        
        addToHistory(currentInput, formattedResult);
        displayHistory.innerText = currentInput + ' =';
        currentInput = formattedResult;
        lastResult = formattedResult;
        updateDisplay();
    } catch (err) {
        currentInput = "Error";
        updateDisplay();
    }
}

function addToHistory(expr, res) {
    if (res === "Error") return;
    history.unshift({ expr, res });
    if (history.length > 20) history.pop();
    renderHistory();
}

function renderHistory() {
    if (history.length === 0) {
        historyContainer.innerHTML = '<div class="text-slate-500 text-sm italic text-center mt-4">No history yet.</div>';
        return;
    }
    historyContainer.innerHTML = history.map((item, index) => `
        <div class="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700" onclick="restoreHistory(${index})">
            <div class="text-slate-500 dark:text-slate-400 text-xs mb-1 text-right break-all">${item.expr} =</div>
            <div class="text-slate-900 dark:text-white font-mono text-lg text-right font-bold break-all">${item.res}</div>
        </div>
    `).join('');
}

function restoreHistory(index) {
    const item = history[index];
    currentInput = item.expr;
    updateDisplay();
}

function clearHistory() {
    history = [];
    renderHistory();
}

// Modal handling
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }
}

document.querySelectorAll('[id$="-modal"]').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if(yearEl) yearEl.innerText = new Date().getFullYear();
    document.querySelectorAll('.current-date').forEach(el => {
        el.innerText = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    });
});

document.addEventListener('keydown', (e) => {
    const openModals = document.querySelectorAll('[id$="-modal"]:not(.hidden)');
    if (openModals.length > 0) return;
    const key = e.key;
    if (/[0-9\.]/.test(key)) inputValue(key);
    else if (key === '+' || key === '-') inputValue(key === '-' ? '−' : '+');
    else if (key === '*') inputValue('×');
    else if (key === '/') { e.preventDefault(); inputValue('÷'); }
    else if (key === '^') inputValue('^');
    else if (key === '(' || key === ')') inputValue(key);
    else if (key === 'Enter' || key === '=') { e.preventDefault(); calculate(); }
    else if (key === 'Backspace') deleteLast();
    else if (key === 'Escape') clearAll();
});

// Theme Toggle Logic
const themeToggleBtn = document.getElementById('theme-toggle');
const darkIcon = document.getElementById('theme-toggle-dark-icon');
const lightIcon = document.getElementById('theme-toggle-light-icon');

if (themeToggleBtn) {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        lightIcon.classList.remove('hidden');
    } else {
        darkIcon.classList.remove('hidden');
    }

    themeToggleBtn.addEventListener('click', function() {
        darkIcon.classList.toggle('hidden');
        lightIcon.classList.toggle('hidden');

        if (localStorage.getItem('theme')) {
            if (localStorage.getItem('theme') === 'light') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        } else {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            }
        }
    });
}
