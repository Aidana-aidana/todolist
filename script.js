document.addEventListener('DOMContentLoaded', () => {
    generateWeek();
    checkAuth();
});

function checkAuth() {
    const loggedInUser = localStorage.getItem('loggedIn');
    if (loggedInUser) {
        document.getElementById('login-button').style.display = 'none';
        document.getElementById('logout-button').style.display = 'inline-block';
        loadTasks();
    } else {
        document.getElementById('login-button').style.display = 'inline-block';
        document.getElementById('logout-button').style.display = 'none';
        generateWeek(); // Regenerate the week even when logged out
    }
}

function showLoginPopup() {
    document.getElementById('login-popup').style.display = 'block';
    showLoginForm();
}

function hideLoginPopup() {
    document.getElementById('login-popup').style.display = 'none';
}

function showLoginForm() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (username === '' || password === '') {
        alert('Please enter both username and password');
        return;
    }

    const userKey = `user_${username}`;
    const userData = localStorage.getItem(userKey);

    if (!userData) {
        alert('User not found. Please register first.');
        return;
    }

    const parsedUserData = JSON.parse(userData);
    if (parsedUserData.password !== password) {
        alert('Incorrect password');
        return;
    }

    localStorage.setItem('loggedIn', username);
    hideLoginPopup();
    checkAuth();
}

function register() {
    const email = document.getElementById('register-email').value.trim();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value.trim();

    if (email === '' || username === '' || password === '') {
        alert('Please fill in all fields');
        return;
    }

    const userKey = `user_${username}`;
    const userData = localStorage.getItem(userKey);

    if (userData) {
        alert('Username already taken. Please choose another one.');
        return;
    }

    const newUserData = {
        email: email,
        password: password,
        tasks: {}
    };
    localStorage.setItem(userKey, JSON.stringify(newUserData));
    localStorage.setItem('loggedIn', username);
    sendRegistrationEmail(email, username, password);
    hideLoginPopup();
    checkAuth();
}

function sendRegistrationEmail(email, username, password) {
    emailjs.send('service_pf4gxc9', 'YOUR_TEMPLATE_ID', {
        to_email: email,
        username: username,
        password: password
    })
        .then(response => {
            console.log('SUCCESS!', response.status, response.text);
        }, error => {
            console.log('FAILED...', error);
        });
}

function logout() {
    localStorage.removeItem('loggedIn');
    checkAuth();
}

function generateWeek() {
    const weekContainer = document.getElementById('week-container');
    weekContainer.innerHTML = ''; // Clear previous content
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const startOfWeek = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    for (let i = 0; i < 7; i++) {
        const date = new Date(currentYear, currentMonth, startOfWeek + i);
        const dayName = daysOfWeek[date.getDay()];
        const dayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const dayContainer = document.createElement('div');
        dayContainer.className = 'day-container';
        dayContainer.id = `${dayName.toLowerCase()}-${startOfWeek + i}`;

        dayContainer.innerHTML = `
            <h2>${dayName} - ${dayDate}</h2>
            <input type="text" placeholder="Add a new task" onkeypress="handleKeyPress(event, '${dayName.toLowerCase()}-${startOfWeek + i}')">
            <button onclick="addTask('${dayName.toLowerCase()}-${startOfWeek + i}')">Add</button>
            <ul class="task-list"></ul>
        `;

        weekContainer.appendChild(dayContainer);
    }
}

function handleKeyPress(event, day) {
    if (event.key === 'Enter') {
        addTask(day);
    }
}

function addTask(day) {
    const dayContainer = document.getElementById(day);
    const taskInput = dayContainer.querySelector('input[type="text"]');
    const taskText = taskInput.value.trim();

    if (taskText !== '') {
        const taskList = dayContainer.querySelector('.task-list');
        const newTask = document.createElement('li');

        newTask.innerHTML = `
            <div class="task-item">
                <div class="start-time"><span class="start">Not set</span></div>
                <span>${taskText}</span>
                <div class="task-actions">
                    <div class="timer-box" style="display: none;"><span class="time">Not set</span></div>
                    <button class="icon-button complete" onclick="toggleComplete(this)">✔</button>
                    <button class="icon-button delete" onclick="deleteTask(this)">🗑️</button>
                </div>
            </div>
            <div class="timer-inputs">
                <div class="slider" id="slider-${Date.now()}"></div>
                <button onclick="setTaskTime(this, '${day}')">Set Task Time</button>
            </div>
        `;

        taskList.appendChild(newTask);

        const slider = newTask.querySelector('.slider');
        $(slider).slider({
            range: true,
            min: 0,
            max: 1440,
            step: 30,
            values: [480, 1020],
            slide: function (event, ui) {
                $(slider).find('.ui-slider-handle').eq(0).attr('data-value', minutesToTime(ui.values[0]));
                $(slider).find('.ui-slider-handle').eq(1).attr('data-value', minutesToTime(ui.values[1]));
            },
            create: function (event, ui) {
                $(slider).find('.ui-slider-handle').eq(0).attr('data-value', minutesToTime(480));
                $(slider).find('.ui-slider-handle').eq(1).attr('data-value', minutesToTime(1020));
            }
        });

        taskInput.value = '';
        saveTasks();
    }
}

function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours < 10 ? '0' + hours : hours}:${mins === 0 ? '00' : mins < 10 ? '0' + mins : mins}`;
}

function toggleComplete(button) {
    const taskItem = button.closest('li');
    taskItem.classList.toggle('completed');
    saveTasks();
}

function deleteTask(button) {
    const taskItem = button.closest('li');
    taskItem.remove();
    saveTasks();
}

function setTaskTime(button, day) {
    const taskItem = button.closest('li');
    const timerInputs = button.parentElement;
    const slider = $(timerInputs.querySelector('.slider')).slider("option", "values");
    const timeDisplay = taskItem.querySelector('.time');
    const timerBox = taskItem.querySelector('.timer-box');
    const startTimeDisplay = taskItem.querySelector('.start');

    const startMinutes = slider[0];
    const endMinutes = slider[1];

    const dayInfo = day.split('-');
    const dayOffset = parseInt(dayInfo[1]);

    const startTime = minutesToDateTime(startMinutes, dayOffset);
    const endTime = minutesToDateTime(endMinutes, dayOffset);

    if (endTime <= startTime) {
        alert('End time must be after start time');
        return;
    }

    startTimeDisplay.textContent = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
    startTimeDisplay.parentElement.style.display = 'block';

    function updateTimer() {
        const now = new Date();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            timeDisplay.textContent = '00:00';
            clearInterval(timerInterval);
            return;
        }

        const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);

        timeDisplay.textContent = `${daysLeft}d ${hoursLeft.toString().padStart(2, '0')}h ${minutesLeft.toString().padStart(2, '0')}m ${secondsLeft.toString().padStart(2, '0')}s`;
    }

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    timerBox.style.display = 'block';
    button.parentElement.style.display = 'none';

    sortTasks(taskItem.parentElement);
    saveTasks();
}

function minutesToDateTime(minutes, dayOffset) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (dayOffset - now.getDate()), hours, mins);
    return date;
}

function sortTasks(taskList) {
    const tasks = Array.from(taskList.children);
    tasks.sort((a, b) => {
        const startA = new Date(`1970-01-01T${a.querySelector('.start').textContent}:00`);
        const startB = new Date(`1970-01-01T${b.querySelector('.start').textContent}:00`);
        return startA - startB;
    });

    tasks.forEach(task => taskList.appendChild(task));
}

function saveTasks() {
    const loggedInUser = localStorage.getItem('loggedIn');
    if (!loggedInUser) return;

    const userKey = `user_${loggedInUser}`;
    const userData = JSON.parse(localStorage.getItem(userKey)) || { password: '', tasks: {} };

    const tasks = {};
    document.querySelectorAll('.day-container').forEach(dayContainer => {
        const day = dayContainer.id;
        const taskList = dayContainer.querySelector('.task-list');
        const dayTasks = [];

        taskList.querySelectorAll('li').forEach(taskItem => {
            const startTime = taskItem.querySelector('.start').textContent;
            const taskText = taskItem.querySelector('.task-item span').textContent;
            const isCompleted = taskItem.classList.contains('completed');
            dayTasks.push({ startTime, taskText, isCompleted });
        });

        tasks[day] = dayTasks;
    });

    userData.tasks = tasks;
    localStorage.setItem(userKey, JSON.stringify(userData));
}

function loadTasks() {
    const loggedInUser = localStorage.getItem('loggedIn');
    if (!loggedInUser) return;

    const userKey = `user_${loggedInUser}`;
    const userData = JSON.parse(localStorage.getItem(userKey)) || { tasks: {} };

    for (const [day, dayTasks] of Object.entries(userData.tasks)) {
        const dayContainer = document.getElementById(day);
        const taskList = dayContainer.querySelector('.task-list');

        dayTasks.forEach(task => {
            const newTask = document.createElement('li');

            newTask.innerHTML = `
                <div class="task-item">
                    <div class="start-time"><span class="start">${task.startTime}</span></div>
                    <span>${task.taskText}</span>
                    <div class="task-actions">
                        <div class="timer-box" style="display: none;"><span class="time">Not set</span></div>
                        <button class="icon-button complete" onclick="toggleComplete(this)">✔</button>
                        <button class="icon-button delete" onclick="deleteTask(this)">🗑️</button>
                    </div>
                </div>
                <div class="timer-inputs">
                    <div class="slider" id="slider-${Date.now()}"></div>
                    <button onclick="setTaskTime(this, '${day}')">Set Task Time</button>
                </div>
            `;

            taskList.appendChild(newTask);

            if (task.isCompleted) {
                newTask.classList.add('completed');
            }

            const slider = newTask.querySelector('.slider');
            $(slider).slider({
                range: true,
                min: 0,
                max: 1440,
                step: 30,
                values: [480, 1020],
                slide: function (event, ui) {
                    $(slider).find('.ui-slider-handle').eq(0).attr('data-value', minutesToTime(ui.values[0]));
                    $(slider).find('.ui-slider-handle').eq(1).attr('data-value', minutesToTime(ui.values[1]));
                },
                create: function (event, ui) {
                    $(slider).find('.ui-slider-handle').eq(0).attr('data-value', minutesToTime(480));
                    $(slider).find('.ui-slider-handle').eq(1).attr('data-value', minutesToTime(1020));
                }
            });

            setTaskTime(newTask.querySelector('button'), day);
        });
    }
}