// Ensure DOM is loaded before executing script
document.addEventListener("DOMContentLoaded", function() {
    const startButton = document.getElementById('start-button');
    const contentSection = document.getElementById('content-section');
    const passageContent = document.querySelector('.passage-content');
    const questionsContainer = document.getElementById('questions-container');
    const timerElement = document.getElementById('timer');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const backButton = document.getElementById('back-button');
    const nextButton = document.getElementById('next-button');
    const submitButton = document.getElementById('submit-button');
    const navigationButtons = document.getElementById('navigation-buttons');

    let timeLeft = 35 * 60; // 35 minutes in seconds
    let currentQuestionIndex = 0;
    let currentPassageIndex = 0;
    let questions = [];
    let passages = [];
    let userAnswers = [];
    let correctAnswers = []; // To store the correct answers

    // Function to update the timer every second
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        // Update the progress bar
        const progressPercentage = 100 - (timeLeft / (35 * 60)) * 100;
        progressBarFill.style.width = `${progressPercentage}%`;

        if (timeLeft > 0) {
            timeLeft--;
            setTimeout(updateTimer, 1000);
        } else {
            alert('Time is up!');
            showResult();
        }
    }

    // Function to load the next question
    function loadQuestion() {
        if (currentQuestionIndex < 10) {
            const questionData = questions[currentPassageIndex][currentQuestionIndex];
            const questionParts = questionData.split('\n');
            const questionText = questionParts[0].replace('Q:', ''); // Remove extra "Q:"
            const options = questionParts.slice(1);

            questionsContainer.innerHTML = `
                <p>Question ${currentQuestionIndex + 1}: ${questionText}</p>
                <ul>
                    ${options.map((option, index) => `
                        <li>
                            <input type="radio" name="question${currentQuestionIndex}" id="q${currentQuestionIndex}_${index}" value="${option}" />
                            <label for="q${currentQuestionIndex}_${index}">${option}</label>
                        </li>
                    `).join('')}
                </ul>
            `;

            if (currentQuestionIndex === 9 && currentPassageIndex === 1) {
                submitSection.classList.remove('hidden');
            }

            currentQuestionIndex++;
        } else if (currentPassageIndex === 0 && currentQuestionIndex === 10) {
            // Load the next passage and reset question index
            currentPassageIndex++;
            currentQuestionIndex = 0;
            loadPassageAndQuestions();
        } else {
            showResult();
        }
    }

    // Function to load the previous question
    function loadPreviousQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            const questionData = questions[currentPassageIndex][currentQuestionIndex];
            const questionParts = questionData.split('\n');
            const questionText = questionParts[0].replace('Q:', ''); // Remove extra "Q:"
            const options = questionParts.slice(1);

            questionsContainer.innerHTML = `
                <p>Question ${currentQuestionIndex + 1}: ${questionText}</p>
                <ul>
                    ${options.map((option, index) => `
                        <li>
                            <input type="radio" name="question${currentQuestionIndex}" id="q${currentQuestionIndex}_${index}" value="${option}" />
                            <label for="q${currentQuestionIndex}_${index}">${option}</label>
                        </li>
                    `).join('')}
                </ul>
            `;
        } else if (currentPassageIndex === 1 && currentQuestionIndex === 0) {
            // Go back to the last question of the first passage
            currentPassageIndex--;
            currentQuestionIndex = 9;
            loadPassageAndQuestions();
        }
    }

    // Function to load the passage and questions
    async function loadPassageAndQuestions() {
        try {
            if (passages.length === 0) {
                // Fetch the passages and questions from the server
                const response1 = await fetch('http://127.0.0.1:5000/get_passage');
                const passageData1 = await response1.json();
                passages.push(passageData1.passage);

                const response2 = await fetch('http://127.0.0.1:5000/get_passage');
                const passageData2 = await response2.json();
                passages.push(passageData2.passage);

                const questionsResponse1 = await fetch('http://127.0.0.1:5000/generate_questions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ passage: passages[0] })
                });
                const questionsData1 = await questionsResponse1.json();
                questions.push(questionsData1.questions);

                const questionsResponse2 = await fetch('http://127.0.0.1:5000/generate_questions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ passage: passages[1] })
                });
                const questionsData2 = await questionsResponse2.json();
                questions.push(questionsData2.questions);

                // Simulate storing the correct answers (for demo purposes, assume the first option is always correct)
                correctAnswers = questions.map(questionSet => questionSet.map(q => q.split('\n')[1]));
            }

            // Display the current passage and first question
            passageContent.textContent = passages[currentPassageIndex];
            loadQuestion();

        } catch (error) {
            console.error('Error loading passage or questions:', error);
        }
    }

    // Function to show the result and redirect to the completion page
    function showResult() {
        let correct = 0;
        let wrong = 0;
        let unanswered = 0;

        userAnswers.forEach((answer, index) => {
            if (!answer) {
                unanswered++;
            } else if (answer === correctAnswers[Math.floor(index / 10)][index % 10]) {
                correct++;
            } else {
                wrong++;
            }
        });

        // Redirect to the completion page
        window.location.href = '/completion';
    }

    startButton.addEventListener('click', () => {
        startButton.classList.add('hidden');
        contentSection.classList.remove('hidden');
        navigationButtons.classList.remove('hidden');

        // Start the timer
        updateTimer();

        // Load the first passage and questions
        loadPassageAndQuestions();
    });

    nextButton.addEventListener('click', () => {
        const selectedOption = document.querySelector(`input[name="question${currentQuestionIndex - 1}"]:checked`);
        if (selectedOption) {
            userAnswers[currentPassageIndex * 10 + currentQuestionIndex - 1] = selectedOption.value;
        } else {
            alert('Please select an answer before proceeding.');
            return;
        }
        
        loadQuestion();
    });

    backButton.addEventListener('click', loadPreviousQuestion);

    submitButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to submit?')) {
            showResult();
        }
    });
});