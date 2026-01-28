var questions = []
var i = 0
var count = 0
var score = 0
var Ansgiven = [] // This will be properly loaded from localStorage
var previousQuestionIndex = null
var topicName = ''
const submitSound = document.getElementById('submit-sound')

const uniqueKey = 'SE6TH_Number Series'

// Helper function to save data in local storage under the unique key
function saveToLocalStorage (key, value) {
  let storageData = JSON.parse(localStorage.getItem(uniqueKey)) || {}
  storageData[key] = value
  localStorage.setItem(uniqueKey, JSON.stringify(storageData))
}

// Helper function to get data from local storage under the unique key
function getFromLocalStorage (key) {
  let storageData = JSON.parse(localStorage.getItem(uniqueKey)) || {}
  return storageData[key]
}

// Fetch the questions from the JSON file
fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    // Get the selected topic from the URL
    const urlParams = new URLSearchParams(window.location.search)
    topicName = urlParams.get('topic')

    // Find the questions for the selected topic
    const selectedTopic = data.topics.find(t => t.heading === topicName)

    if (selectedTopic) {
      questions = selectedTopic.questions
      count = questions.length

      // Initialize Ansgiven array with proper length
      // Load previously saved answers from localStorage
      const savedAnswers = getFromLocalStorage('Ansgiven')
      if (savedAnswers && Array.isArray(savedAnswers) && savedAnswers.length === count) {
        Ansgiven = savedAnswers
      } else {
        // Initialize with null values for all questions
        Ansgiven = new Array(count).fill(null)
      }

      // Store total number of questions
      saveToLocalStorage(topicName + '_totalQuestions', count)

      // Load the heading from the selected topic
      document.getElementById('heading').innerText = topicName || 'PS'
      
      // Load current question index from localStorage if available
      const savedIndex = getFromLocalStorage('currentQuestionIndex')
      if (savedIndex !== undefined && savedIndex !== null && savedIndex < count) {
        i = savedIndex
      }
      
      loadButtons()
      loadQuestion(i)

      // Store topics in local storage for the results page
      const topics = JSON.parse(localStorage.getItem('topics')) || []
      if (!topics.find(t => t.heading === topicName)) {
        topics.push(selectedTopic)
        saveToLocalStorage('topics', topics)
      }
    } else {
      document.getElementById('heading').innerText = 'Topic not found'
      document.getElementById('buttonContainer').innerHTML =
        'No questions available for this topic.'
    }
  })

function loadButtons () {
  var buttonContainer = document.getElementById('buttonContainer')
  buttonContainer.innerHTML = '' // Clear previous buttons
  for (var j = 0; j < questions.length; j++) {
    var btn = document.createElement('button')
    btn.className = 'btnButton btn smallbtn'
    btn.innerHTML = 'Q' + (j + 1)
    btn.setAttribute('onclick', 'abc(' + (j + 1) + ')')

    // Check if the topic has been completed and disable the button if necessary
    if (getFromLocalStorage(topicName + '_completed')) {
      btn.classList.add('disabled-btn')
      btn.disabled = true
    }

    buttonContainer.appendChild(btn)
  }
  // Update button styles based on answered questions
  updateButtonStyles()
}
//////////////for rendering fraction inputs//////////////////

function renderQuestionText (questionParts, questionElement) {
  questionElement.innerHTML = '' // Clear old content

  questionParts.forEach(part => {
    if (typeof part === 'string') {
      // Create a temporary div to parse HTML content
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = part

      // If the string contains HTML tags, append as HTML
      if (part.includes('<') && part.includes('>')) {
        // Append all child nodes from the temporary div
        while (tempDiv.firstChild) {
          questionElement.appendChild(tempDiv.firstChild)
        }
      } else {
        // Plain text, append as text node
        questionElement.appendChild(document.createTextNode(part))
      }
    } else if (part.fraction) {
      const { whole, numerator, denominator } = part.fraction

      const span = document.createElement('span')
      span.className = 'mixed-fraction'

      if (whole !== undefined && whole !== '') {
        span.innerHTML = `
          <span class="whole">${whole}</span>
          <span class="fraction">
            <span class="numerator">${numerator}</span>
            <span class="denominator">${denominator}</span>
          </span>
        `
      } else {
        // Simple fraction only
        span.innerHTML = `
            <span class="whole">&nbsp;</span>

          <span class="fraction">
            <span class="numerator">${numerator}</span>
            <span class="denominator">${denominator}</span>
          </span>
        `
      }
      questionElement.appendChild(span)
    }
  })
}

function loadQuestion (index) {
  var randomQuestion = questions[index]

  if (!randomQuestion) {
    console.error('No question found at index:', index)
    return
  }

  // Set question text
  var questionElement = document.getElementById('question')
  // questionElement.innerHTML = randomQuestion.question // Set the question text

  /////////////////Fraction format for questions////////////////

  if (Array.isArray(randomQuestion.question)) {
    renderQuestionText(randomQuestion.question, questionElement)
  } else {
    questionElement.innerHTML = randomQuestion.question
  }

  // Display question image in picdiv
  var picDiv = document.getElementById('picdiv')
  picDiv.innerHTML = '' // Clear previous content

  if (randomQuestion.image) {
    const element = document.querySelector('.question-image-area')
    element.style.display = 'block'
    picDiv.style.display = 'flex'
    const questionQuentent = document.querySelector('.question-content')
    questionQuentent.style.display = 'flex'
    var questionImage = document.createElement('img')
    questionImage.src = randomQuestion.image
    questionImage.alt = 'Question Image'
    questionImage.style.maxWidth = '100%'
    questionImage.style.maxHeight = '300px'
    questionImage.style.objectFit = 'contain'
    questionImage.style.borderRadius = '8px'
    picDiv.appendChild(questionImage)
  } else {
    // Display placeholder text if no image
    picDiv.style.display = 'none'
    const element = document.querySelector('.question-image-area')
    element.style.display = 'none'

    const questionQuentent = document.querySelector('.question-content')
    questionQuentent.style.display = 'block'
  }

  // Check if there is a sound associated with the question
  if (randomQuestion.questionSound) {
    var soundButton = document.createElement('button')
    soundButton.className = 'btn btn-sound'
    soundButton.innerText = '🔊 Play Sound'
    soundButton.onclick = function () {
      var sound = new Audio(randomQuestion.questionSound)
      sound.play()
    }
    questionElement.appendChild(soundButton)
  }
  if (!(randomQuestion.input && Array.isArray(randomQuestion.input))) {
    // questionElement.innerHTML = randomQuestion.question // Set the question text only for regular questions

    if (Array.isArray(randomQuestion.question)) {
      renderQuestionText(randomQuestion.question, questionElement)
    } else {
      questionElement.innerHTML = randomQuestion.question
    }
  } else {
    questionElement.innerHTML = '' // Clear question text for input questions since it will be handled in loadInputQuestion
  }

  // Get options element
  var optionsElement = document.getElementById('options')
  optionsElement.innerHTML = '' // Clear existing options

  // Check if this question has input fields instead of options
  if (randomQuestion.input && Array.isArray(randomQuestion.input)) {
    // Handle input type questions
    loadInputQuestion(randomQuestion, optionsElement, index)
  } else if (randomQuestion.options) {
    // Handle regular option-based questions
    loadOptionQuestion(randomQuestion, optionsElement, index)
  }

  // Update button visibility based on whether an answer is selected
  updateButtonVisibility()
  // Update button styles
  updateButtonStyles()
  // Update the Next button or Submit Answers button
  updateButtonText()
}

function loadInputQuestion(randomQuestion, optionsElement, index) {
  // Set up styling for input questions
  optionsElement.innerHTML = '';
  optionsElement.style.display = 'flex';
  optionsElement.style.flexDirection = 'column';
  optionsElement.style.alignItems = 'center';
  optionsElement.classList.add('input-question');

  // Create a container for the question with embedded inputs
  var questionContainer = document.createElement('div');
  questionContainer.className = 'question-container';
  questionContainer.style.display = 'flex';
  questionContainer.style.flexWrap = 'wrap';
  questionContainer.style.justifyContent = 'center';
  questionContainer.style.alignItems = 'center';
  questionContainer.style.gap = '5px';
  questionContainer.style.fontSize = '1.5em';
  questionContainer.style.textAlign = 'center';

  let inputIndex = 0;

  // Check if question is an array (contains fractions) or a string
  if (Array.isArray(randomQuestion.question)) {
    // Handle array format with fractions
    randomQuestion.question.forEach(part => {
      if (typeof part === 'string') {
        // Split string parts by "______" and process each piece
        let stringParts = part.split('______');
        
        stringParts.forEach((stringPart, idx) => {
          if (stringPart) {
            // Check if the string part contains <br> tags
            if (stringPart.includes('<br>')) {
              // Split by <br> and handle each segment
              let brParts = stringPart.split('<br>');
              brParts.forEach((brPart, brIdx) => {
                if (brPart.trim()) {
                  let span = document.createElement('span');
                  span.innerHTML = brPart;
                  questionContainer.appendChild(span);
                }
                
                // Add line break if not the last part
                if (brIdx < brParts.length - 1) {
                  let br = document.createElement('br');
                  questionContainer.appendChild(br);
                  
                  // Add a flex-basis to force new line
                  let lineBreak = document.createElement('div');
                  lineBreak.style.flexBasis = '100%';
                  lineBreak.style.height = '0';
                  questionContainer.appendChild(lineBreak);
                }
              });
            } else {
              // Add text part normally
              let span = document.createElement('span');
              span.innerHTML = stringPart;
              questionContainer.appendChild(span);
            }
          }
          
          // Add input field if there's a corresponding input and it's not the last part
          if (idx < stringParts.length - 1 && inputIndex < randomQuestion.input.length) {
            addInputField(questionContainer, randomQuestion.input[inputIndex]);
            inputIndex++;
          }
        });
      } else if (part.fraction) {
        // Handle fraction part - check for "______" in fraction components
        const { whole, numerator, denominator } = part.fraction;
        const span = document.createElement('span');
        span.className = 'mixed-fraction';

        let wholeContent = '';
        let numeratorContent = '';
        let denominatorContent = '';

        // Handle whole number
        if (whole !== undefined && whole !== '') {
          if (whole === '______') {
            // Create input for whole number
            let wholeInput = createInputElement(randomQuestion.input[inputIndex]);
            span.appendChild(document.createTextNode(' '));
            span.appendChild(wholeInput);
            inputIndex++;
          } else {
            wholeContent = `<span class="whole">${whole}</span>`;
          }
        } else {
          wholeContent = '<span class="whole">&nbsp;</span>';
        }

        // Handle numerator
        if (numerator === '______') {
          // Create input for numerator
          let numeratorInput = createInputElement(randomQuestion.input[inputIndex]);
          numeratorInput.style.width = '80px';
          numeratorInput.style.maxWidth = '80px';
          
          span.innerHTML = wholeContent + '<span class="fraction"><span class="numerator"></span><span class="denominator">' + denominator + '</span></span>';
          
          // Insert the input into the numerator span
          let numeratorSpan = span.querySelector('.numerator');
          numeratorSpan.appendChild(numeratorInput);
          inputIndex++;
        } else {
          numeratorContent = numerator;
        }

        // Handle denominator
        if (denominator === '______') {
          // Create input for denominator
          let denominatorInput = createInputElement(randomQuestion.input[inputIndex]);
          denominatorInput.style.width = '80px';
          denominatorInput.style.maxWidth = '80px';
          
          if (numerator !== '______') {
            span.innerHTML = wholeContent + '<span class="fraction"><span class="numerator">' + numerator + '</span><span class="denominator"></span></span>';
            
            // Insert the input into the denominator span
            let denominatorSpan = span.querySelector('.denominator');
            denominatorSpan.appendChild(denominatorInput);
          }
          inputIndex++;
        }

        // If neither numerator nor denominator is an input, use standard HTML
        if (numerator !== '______' && denominator !== '______') {
          span.innerHTML = wholeContent + '<span class="fraction"><span class="numerator">' + numerator + '</span><span class="denominator">' + denominator + '</span></span>';
        }

        questionContainer.appendChild(span);
      }
    });
  } else {
    // Handle string format (original logic with <br> support)
    let questionText = randomQuestion.question;
    
    // First, split by <br> to handle line breaks
    let brParts = questionText.split('<br>');
    
    brParts.forEach((brPart, brIdx) => {
      if (brPart.trim()) {
        // Now split each part by "______" for inputs
        let stringParts = brPart.split('______');
        
        stringParts.forEach((part, idx) => {
          // Add the text part
          if (part) {
            let span = document.createElement('span');
            span.innerHTML = part;
            questionContainer.appendChild(span);
          }

          // Add an input field if there's a corresponding input
          if (idx < stringParts.length - 1 && inputIndex < randomQuestion.input.length) {
            addInputField(questionContainer, randomQuestion.input[inputIndex]);
            inputIndex++;
          }
        });
      }
      
      // Add line break if not the last part
      if (brIdx < brParts.length - 1) {
        let br = document.createElement('br');
        questionContainer.appendChild(br);
        
        // Add a flex-basis to force new line
        let lineBreak = document.createElement('div');
        lineBreak.style.flexBasis = '100%';
        lineBreak.style.height = '0';
        questionContainer.appendChild(lineBreak);
      }
    });
  }

  optionsElement.appendChild(questionContainer);

  // Restore previous answers
  var previouslyEntered = Ansgiven[index];
  if (previouslyEntered && Array.isArray(previouslyEntered)) {
    let inputs = questionContainer.querySelectorAll('.answer-input');
    inputs.forEach((input, idx) => {
      if (previouslyEntered[idx] !== undefined) {
        input.value = previouslyEntered[idx];
      }
    });
  }
}

// Helper function to create and add input fields
function addInputField(container, inputField) {
  let inputElement = createInputElement(inputField);
  container.appendChild(inputElement);
}

// Helper function to create input element
function createInputElement(inputField) {
  let inputElement = document.createElement('input');
  inputElement.type = 'text';
  inputElement.className = 'answer-input';
  // inputElement.placeholder = inputField.operand; 
  inputElement.style.padding = '8px';
  inputElement.style.fontSize = '1em';
  inputElement.style.border = '2px solid #ccc';
  inputElement.style.borderRadius = '6px';
  inputElement.style.textAlign = 'center';
  inputElement.style.width = '80px';
  inputElement.style.maxWidth = '80px';

  // Event listener to capture changes
  inputElement.addEventListener('input', function() {
    handleInputAnswerChange();
  });

  return inputElement;
}

function loadOptionQuestion (randomQuestion, optionsElement, index) {
  // Check if any option has an image
  var hasImageOptions = randomQuestion.options.some(option => option.image)
  var hasTextOnlyOptions = randomQuestion.options.every(option => !option.image)

  // Apply layout based on content
  if (hasImageOptions) {
    optionsElement.style.display = 'grid'
    optionsElement.style.gridTemplateColumns = 'repeat(2, 1fr)' // Two columns per row
    optionsElement.style.gap = '1rem' // Space between grid items
    optionsElement.style.justifyContent = 'center'
    optionsElement.classList.remove('text-only')
  } else if (hasTextOnlyOptions) {
    optionsElement.classList.add('text-only')
    optionsElement.classList.remove('input-question')
  }

  var selectedLi = null
  var defaultBackgroundColor = '#699e19'

  // Iterate through the options and display them
  randomQuestion.options.forEach(function (option, idx) {
    var li = document.createElement('li')
    li.classList.add('option-container')
    li.setAttribute('onclick', 'optionContainer()')
    li.onclick = function () {
      // If there is already a selected li, remove its style
      if (selectedLi) {
        selectedLi.style.border = ''
      }

      

      // Update the selectedLi variable to the currently clicked li
      selectedLi = li
    }

    // Create the radio button for the option
    var radioButton = document.createElement('input')
    radioButton.type = 'radio'
    radioButton.name = 'answer'
    radioButton.value = idx
    radioButton.style.display = 'none' // Hide the radio button

    if (option.image) {
      // Create the image element for the option
      var optionWithImage = document.getElementById('options')
      optionWithImage.style.gap = '1rem'
      var optionImage = document.createElement('img')
      optionImage.src = option.image
      optionImage.alt = 'Option Image'
      optionImage.style.width = '90%'
      optionImage.style.maxWidth = '250px'
      optionImage.style.height = 'auto'
      // optionImage.style.borderRadius = "12px";
      optionImage.style.cursor = 'pointer'

      optionImage.onclick = function () {
    radioButton.checked = true

    // Remove border from all images
    optionsElement.querySelectorAll("img").forEach(img => {
        img.style.border = "none";
    });

    // Highlight currently selected image
    optionImage.style.border = "3px solid #007bff";

    handleAnswerChange();
};


      optionImage.onmouseover = function () {
        if (option.sound) {
          playOptionSound(option.sound)
        }
      }

      optionImage.onmouseout = function () {
        if (!radioButton.checked) {
          optionImage.style.border = 'none'
        }
      }

      // Append the image to the list item
      li.appendChild(optionImage)
    } else {
      var selectedButton = null
      var defaultBackgroundColor = '#699e19'

      var optionWithText = document.getElementById('options')
      optionWithText.style.display = 'grid'
      // optionWithText.style.flexDirection = "column";

      var optionTextButton = document.createElement('button')

      optionTextButton.className = 'btnOption'
      // optionTextButton.innerHTML = option.text

      //////////////// for Inserting fraction in options ///////////////
      if (option.fraction) {
        const { whole, numerator, denominator } = option.fraction
        optionTextButton.innerHTML = `
    <span class="mixed-fraction">
      <span class="whole">${whole}</span>
      <span class="fraction">
        <span class="numerator">${numerator}</span>
        <span class="denominator">${denominator}</span>
      </span>
    </span>
  `
      } else {
        optionTextButton.innerHTML = option.text
      }
      // optionTextButton.style.marginBottom = "20px";
      optionTextButton.onclick = function () {
        radioButton.checked = true // Select the corresponding radio button

        // Reset all option buttons
        var allOptionButtons = document.querySelectorAll('.btnOption')
        allOptionButtons.forEach(btn => {
          btn.style.backgroundColor = ''
          btn.style.border = ''
        })

        // Highlight selected button
        optionTextButton.style.backgroundColor = '#e3f2fd'
        optionTextButton.style.border = '2px solid #007bff'
        optionTextButton.style.color = 'black'

        selectedButton = optionTextButton
        handleAnswerChange() // Call the answer change handler
      }

      // Append the text button to the list item
      li.appendChild(optionTextButton)
    }

    // Append the radio button to the list item
    li.appendChild(radioButton)

    // Append the list item to the options container
    optionsElement.appendChild(li)
  })

  // Restore previously selected answer if exists
var previouslySelected = Ansgiven[index];
if (previouslySelected !== null && previouslySelected !== undefined) {
    var previouslySelectedElement = optionsElement.querySelector(
        'input[name="answer"][value="' + previouslySelected + '"]'
    );

    if (previouslySelectedElement) {
        previouslySelectedElement.checked = true;

        var previouslySelectedLi = previouslySelectedElement.closest('li');

        if (previouslySelectedLi) {

            // Highlight TEXT option
            var textButton = previouslySelectedLi.querySelector('.btnOption');
            if (textButton) {
                textButton.style.backgroundColor = '#e3f2fd';
                textButton.style.border = '2px solid #007bff';
                textButton.style.color = 'black';
            }

            // Highlight IMAGE option (THIS WAS MISSING)
            var img = previouslySelectedLi.querySelector("img");
            if (img) {
                img.style.border = "3px solid #007bff";
            }
        }
    }
}

}

function handleInputAnswerChange () {
  // Auto-save the current answer when input changes
  saveCurrentAnswer()
  
  // Show the Submit Answer button and hide the Next button when input is entered
  document.getElementById('subbtn').style.display = 'inline-block'
  document.getElementById('nextbtn').style.display = 'none'
}

function playOptionSound (option) {
  var sound = new Audio(option)
  sound.play()
}

function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function getOptionLabel (option) {
  if (option.endsWith && option.endsWith('.mp3')) {
    var label = option.split('/').pop().replace('.mp3', '')
    return capitalizeFirstLetter(label)
  }
  return option.text || option
}

function handleAnswerChange () {
  // Auto-save the current answer when option is selected
  saveCurrentAnswer()
  
  // Show the Submit Answer button and hide the Next button when an answer is selected
  document.getElementById('subbtn').style.display = 'inline-block'
  document.getElementById('nextbtn').style.display = 'none'
}

function newques () {
  // Save the answer for the current question
  saveCurrentAnswer()
  
  // Save current question index
  saveToLocalStorage('currentQuestionIndex', i + 1)

  if (i === count - 1) {
    document.getElementById('questiondiv').style.textAlign = 'center'

    // Display results
    displayResults()

    // Hide buttonContainer
    document.getElementById('buttonContainer').style.display = 'none'
    
    // Clear the current question index when quiz is completed
    saveToLocalStorage('currentQuestionIndex', null)
  } else {
    // Move to the next question
    i++
    loadQuestion(i)
    document.getElementById('result').innerHTML = ''
    document.getElementById('subbtn').style.display = 'inline-block'
    document.getElementById('nextbtn').style.display = 'none'

    // Update button visibility and styles
    updateButtonVisibility()
    updateButtonStyles()
  }
}

// Save the answer for the current question
function saveCurrentAnswer () {
  var currentQuestion = questions[i]

  if (currentQuestion.input && Array.isArray(currentQuestion.input)) {
    // Handle input type questions
    var inputs = document.querySelectorAll('.answer-input')
    var inputAnswers = []
    var hasAnswer = false

    inputs.forEach(function (input) {
      var value = input.value.trim()
      inputAnswers.push(value)
      if (value !== '') {
        hasAnswer = true
      }
    })

    Ansgiven[i] = hasAnswer ? inputAnswers : null
  } else {
    // Handle regular option-based questions
    var selectedAnswer = document.querySelector('input[name="answer"]:checked')
    if (selectedAnswer) {
      Ansgiven[i] = parseInt(selectedAnswer.value) // Store answer as an index
    } else {
      Ansgiven[i] = null // Mark as not answered
    }
  }

  console.log('score', score)
  // Always save to localStorage immediately after updating Ansgiven
  saveToLocalStorage('Ansgiven', Ansgiven)
  console.log('Saved answers to localStorage:', Ansgiven)
}

// Add this helper function at the top of your file, after the existing helper functions
// Replace the existing formatFractionForDisplay function with this updated version
function formatFractionForDisplay(option) {
  if (option && option.fraction) {
    const { whole, numerator, denominator } = option.fraction;
    
    // Create HTML structure for visual fraction display
    let fractionHTML = '<span class="display-fraction">';
    
    if (whole !== undefined && whole !== '' && whole !== null) {
      // Mixed fraction: whole number + fraction
      fractionHTML += `
        <span class="whole-part">${whole}</span>
        <span class="fraction-part">
          <span class="numerator">${numerator}</span>
         
          <span class="denominator">${denominator}</span>
        </span>
      `;
    } else {
      // Simple fraction only
      fractionHTML += `
        <span class="fraction-part">
          <span class="numerator">${numerator}</span>

          <span class="denominator">${denominator}</span>
        </span>
      `;
    }
    
    fractionHTML += '</span>';
    return fractionHTML;
  }
  return option.text || option;
}

function formatInputAnswers(question, answersArray) {
  if (!answersArray || answersArray.length === 0) return '';

  // Convert question to text
  let questionText = '';
  if (Array.isArray(question)) {
    questionText = question.map(p => (typeof p === 'string' ? p : '')).join('');
  } else {
    questionText = question;
  }

  let result = [];
  let index = 0;

  // Count decimal blanks
  const decimalBlanks = (questionText.match(/______.______/g) || []).length;

  // ✅ Handle decimal blanks ONLY
  for (let i = 0; i < decimalBlanks; i++) {
    if (answersArray[index + 1] !== undefined) {
      result.push(answersArray[index] + '.' + answersArray[index + 1]);
      index += 2;
    }
  }

  // ✅ Handle remaining normal blanks
  while (index < answersArray.length) {
    result.push(answersArray[index]);
    index++;
  }

  return result.join(', ');
}



// Also update the displayResults function to properly handle HTML content
// Replace the section where you build the pageDiv content with this:

function displayResults() {
  window.location.href = './graph.html'

  // Calculate the score
  score = Ansgiven.reduce((total, answer, index) => {
    var currentQuestion = questions[index]
    var isCorrect = false

    if (currentQuestion.input && Array.isArray(currentQuestion.input)) {
      // Handle input type questions
      if (
        answer &&
        Array.isArray(answer) &&
        Array.isArray(currentQuestion.answer)
      ) {
        isCorrect = currentQuestion.answer.every((correctAnswer, idx) => {
          return (
            answer[idx] &&
            answer[idx].toLowerCase().trim() ===
              correctAnswer.toLowerCase().trim()
          )
        })
      }
    } else {
      // Handle regular option-based questions
      isCorrect = answer === currentQuestion.answer
    }

    return isCorrect ? total + 1 : total
  }, 0)

  // Save score and completion status to local storage
  saveToLocalStorage(topicName + '_score', score)
  saveToLocalStorage(topicName + '_completed', 'true') // Mark topic as completed

  var percentage = (score / count) * 100
  var progressBarColor = ''
  var feedbackMessage = ''

  // Save report content to local storage
  var home =
    "<a href='./graph.html'><b class='btn btn-success next-btn-progress'>Click here to View Report</b></a><br>"
  var content = home
  saveToLocalStorage(topicName + '_results_content', content)

  var questionsPerPage = 5
  var numberOfPages = Math.ceil(questions.length / questionsPerPage)
  var questionContent = ''
  var paginationControls = ''

  // Iterate through the pages of questions
  for (var page = 0; page < numberOfPages; page++) {
    var start = page * questionsPerPage
    var end = Math.min(start + questionsPerPage, questions.length)
    var pageDiv =
      "<div class='question-page' style='display: " +
      (page === 0 ? 'block' : 'none') +
      ";'><h2>Page " +
      (page + 1) +
      '</h2>'

    for (var j = start; j < end; j++) {
      var quesgroup = questions[j]
      
      // Handle question display - format fractions in questions
      var questionDisplay = ''
      if (Array.isArray(quesgroup.question)) {
        questionDisplay = quesgroup.question.map(part => {
          if (typeof part === 'string') {
            return part
          } else if (part.fraction) {
            return formatFractionForDisplay(part)
          }
          return part
        }).join('')
      } else {
        questionDisplay = quesgroup.question
      }

      // Add question image if available
      var questionImageContent = ''
      if (quesgroup.image) {
        questionImageContent =
          "<br><img src='" +
          quesgroup.image +
          "' alt='Question Image' style='max-width: 300px; max-height: 200px; object-fit: contain; border-radius: 8px; margin: 10px 0;'><br>"
      }

      var ansContent = ''
      var givenContent = ''

      if (quesgroup.input && Array.isArray(quesgroup.input)) {
  const correctAnswers = quesgroup.answer || [];
  const givenAnswers = Ansgiven[j];

  ansContent = formatInputAnswers(
    quesgroup.question,
    correctAnswers
  );

  if (givenAnswers && Array.isArray(givenAnswers)) {
    const isCorrect = correctAnswers.every((correctAnswer, idx) => {
      return (
        givenAnswers[idx] &&
        givenAnswers[idx].toLowerCase().trim() ===
          correctAnswer.toLowerCase().trim()
      );
    });

    givenContent =
      "<span style='color:" +
      (isCorrect ? 'inherit' : 'red') +
      ";'>" +
      formatInputAnswers(quesgroup.question, givenAnswers) +
      '</span>';
  } else {
    givenContent = "<span style='color:red'>Not Answered</span>";
  }
}
 else {
        // Handle regular option-based questions
        var ans = questions[j].options[questions[j].answer]
        var givenAnswer =
          Ansgiven[j] !== undefined ? questions[j].options[Ansgiven[j]] : null

        // Display the correct answer - handle fractions
        if (ans.image) {
          ansContent = "<img src='" +
            ans.image +
            "' alt='Answer Image' style='width: 120px; height: 50px;'>"
        } else if (ans.fraction) {
          ansContent = formatFractionForDisplay(ans)
        } else {
          ansContent = getOptionLabel(ans)
        }

        // Display the given answer - handle fractions and apply red color if incorrect
        if (givenAnswer) {
          var isCorrect = Ansgiven[j] === questions[j].answer
          if (givenAnswer.image) {
            givenContent = "<img src='" +
              givenAnswer.image +
              "' alt='Given Answer Image' style='width: 120px; height: 50px;" +
              (isCorrect ? '' : ' border: 2px solid red;') +
              "'>"
          } else if (givenAnswer.fraction) {
            var fractionHTML = formatFractionForDisplay(givenAnswer)
            givenContent = "<span style='color: " +
              (isCorrect ? 'inherit' : 'red') +
              ";'>" +
              fractionHTML +
              '</span>'
          } else {
            givenContent = "<span style='color: " +
              (isCorrect ? 'inherit' : 'red') +
              ";'>" +
              getOptionLabel(givenAnswer) +
              '</span>'
          }
        } else {
          givenContent = "<span style='color:red'>Not Answered</span>"
        }
      }

      var num = j + 1
      pageDiv +=
        'Q.' +
        num +
        ' ' +
        questionDisplay +
        questionImageContent +
        '<br>' +
        'Correct Answer: ' +
        ansContent +
        '<br>' +
        'Answer Given: ' +
        givenContent +
        '<br><br>'
    }

    pageDiv += '</div>'
    questionContent += pageDiv
  }

  // Pagination controls
  paginationControls =
    "<div class='pagination-controls' style='text-align: center; margin-top: 20px;'>"
  for (var page = 0; page < numberOfPages; page++) {
    paginationControls +=
      "<button class='btnOption btn btn-default' onclick='showPage(" +
      page +
      ")'>" +
      (page + 1) +
      '</button> '
  }
  paginationControls += '</div>'

  // Save question content to local storage
  saveToLocalStorage(topicName + '_question_content', questionContent)

  // Hide unnecessary elements
  document.getElementById('picdiv').innerHTML = ''
  document.getElementById('picdiv').style.display = 'none'
  document.getElementById('questiondiv').style.display = 'none'
  document.getElementById('nextbtn').style.textAlign = 'center'

  // Play confetti animation
  confetti({
    particleCount: 200,
    spread: 70,
    origin: { y: 0.6 }
  })

  // Play well-done sound
  var sound = new Audio('./assests/sounds/well-done.mp3')
  sound.play()
}

function showPage (page) {
  var pages = document.querySelectorAll('.question-page')
  pages.forEach((p, index) => {
    p.style.display = index === page ? 'block' : 'none'
  })
}

function checkAnswer () {
  submitSound.play()
  saveCurrentAnswer()
  
  // Save current question index
  saveToLocalStorage('currentQuestionIndex', i)
  
  document.getElementById('subbtn').style.display = 'none'
  document.getElementById('nextbtn').style.display = 'inline-block'

  // Update button styles after submitting answer
  updateButtonStyles()
}

function abc (x) {
  // Save the current answer before changing questions
  saveCurrentAnswer()
  i = x - 1
  
  // Save current question index
  saveToLocalStorage('currentQuestionIndex', i)
  
  loadQuestion(i)
  document.getElementById('result').innerHTML = ''
  document.getElementById('subbtn').style.display = 'inline-block'
  document.getElementById('nextbtn').style.display = 'none'

  // Update button styles and visibility
  updateButtonStyles()
}

function updateButtonVisibility () {
  var currentQuestion = questions[i]
  var hasAnswer = false

  if (currentQuestion.input && Array.isArray(currentQuestion.input)) {
    // Check if any input field has content
    var inputs = document.querySelectorAll('.answer-input')
    inputs.forEach(function (input) {
      if (input.value.trim() !== '') {
        hasAnswer = true
      }
    })
  } else {
    // Check for selected radio button
    var selectedAnswer = document.querySelector('input[name="answer"]:checked')
    hasAnswer = selectedAnswer !== null
  }

  if (hasAnswer) {
    document.getElementById('subbtn').style.display = 'inline-block'
    document.getElementById('nextbtn').style.display = 'none'
  } else {
    document.getElementById('subbtn').style.display = 'none'
    document.getElementById('nextbtn').style.display = 'none'
  }
}

function updateButtonStyles () {
  var buttonContainer = document.getElementById('buttonContainer')

  if (buttonContainer) {
    var buttons = buttonContainer.getElementsByTagName('button')

    // Remove all styling classes from buttons
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].classList.remove(
        'answered-btn',
        'current-btn',
        'unanswered-btn'
      )
    }

    // Apply styles based on question status
    for (var j = 0; j < buttons.length; j++) {
      var hasValidAnswer = false
      var answer = Ansgiven[j]

      if (Array.isArray(answer)) {
        // For input type questions, check if any input has content
        hasValidAnswer = answer.some(val => val && val.trim() !== '')
      } else {
        // For option type questions
        hasValidAnswer = answer !== null && answer !== undefined
      }

      if (j === i) {
        // Current question - simple/default styling (no special class)
        // Just keep the default btnButton styling
      } else if (hasValidAnswer) {
        // Submitted questions - green
        buttons[j].classList.add('answered-btn')
      } else {
        // Not submitted questions - yellow
        buttons[j].classList.add('unanswered-btn')
      }
    }
  } else {
    console.error('Button container not found')
  }
}

function updateButtonText () {
  var nextButton = document.getElementById('nextbtn')
  if (i === count - 1) {
    nextButton.innerHTML = 'FINISH TEST'
    nextButton.onclick = function () {
      newques() // Calls newques which will hide buttonContainer
    }
  } else {
    nextButton.innerHTML = 'Next'
  }
}
