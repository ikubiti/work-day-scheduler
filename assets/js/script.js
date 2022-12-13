// Wrap all code to ensure that the code isn't run until the browser has finished
// rendering all the elements in the html.

$(function () {
  let scheduleEl = $('.container-lg');
  let dateDisplayEl = $('#currentDate');
  let timeDisplayEl = $('#currentTime');
  let userFeedBackEl = $('#userFeedback');
  const timeOffset = 9;
  const workHours = 9;
  const DayOffset = 30;
  const minSearch = 3;
  let previousHour = DayOffset;
  let selectedDate = '';
  let currentDate = '';
  let blockStatus = '';
  let presentHourID = DayOffset;

  // Pick any date to edit or schedule ahead
  $( "#datepicker" ).datepicker({
    changeMonth: true,
    changeYear: true
  });

  // sets the user selected data and displays the day selected
  $("#datepicker").on('change', function() {
    selectedDate = dayjs($('#datepicker').val()).format('YYYY-MM-DD');
    displaySchedule();
  });

  // dynamically display the time-blocks for the day selected
  function displaySchedule() {
    var currentSchedule = readDaySchedule();
    let presentStatus = setDateBlockStatus();
    scheduleEl.empty();
    for (hourlyObject in currentSchedule) {
      let currentBlock = currentSchedule[hourlyObject];
      let timeBlockEl = $('<div id="' + hourlyObject + '" class="row time-block"></div>');
      if (!presentStatus) {
        presentStatus = setTimeBlockStatus(currentBlock.hourNumber);
      }
      timeBlockEl.addClass(blockStatus);

      let timeHourEl = $('<div class="col-2 col-md-1 hour text-center py-3"></div>');
      timeHourEl.text(currentBlock.displayHour);
      timeBlockEl.append(timeHourEl);

      let textInput = $('<textarea class="col-8 col-md-10 description" rows="3"></textarea>');
      textInput.text(currentBlock.eventTicket);
      timeBlockEl.append(textInput);

      let saveHourEvent = $('<button class="btn saveBtn col-2 col-md-1" aria-label="save">').append('<i class="fas fa-save" aria-hidden="true"></i>');
      timeBlockEl.append(saveHourEvent);
      scheduleEl.append(timeBlockEl);
    }

    // Scroll to present time if present
    var presentBlock = $('.present');
    presentHourID = DayOffset;
    if (presentBlock[0]) {
      presentHourID = presentBlock.attr('id');
      presentBlock[0].scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
    }
  }

  // Use the current date to set the time block status
  function setDateBlockStatus() {
    let difference = dayjs(selectedDate).diff(dayjs(currentDate), 'day');
    if(difference < 0) {
      blockStatus = 'past';     // won't change
    } else if(!difference) {
      blockStatus = '';         // fluid and subject to change
    } else {
      blockStatus = 'future';   // won't change
    }
    return blockStatus.length;  // For quick comparisons
  }

  function setTimeBlockStatus(currentTimeBlock) {
    // Only one present hour block is possible
    if (blockStatus === 'present') { 
      blockStatus ='future'
      return blockStatus.length;      
    }

    blockStatus = (previousHour == currentTimeBlock) ? "present" : ((previousHour > currentTimeBlock) ? "past" : "future");
    // Status won't change for current session
    if (blockStatus === 'future') {
      return blockStatus.length;      
    }

    // Status can change
    return 0;
  }

  // save the day's schedule
  function saveDaySchedule(theSchedule) {
    localStorage.setItem(selectedDate, JSON.stringify(theSchedule));
  }

  // Get or generate a new empty day schedule
  function readDaySchedule() {
    var dayEvents = JSON.parse(localStorage.getItem(selectedDate));
    if(!dayEvents) {
      dayEvents = generateDaySchedule();
      saveDaySchedule(dayEvents);
    }

    return dayEvents;
  }

  // Generate a day's schedule from scratch
  function generateDaySchedule() {
    // A full day schedule template
    let workDaySchedule = {};
    for (var i = timeOffset; i < timeOffset + workHours; i++) {
      // let index = i - timeOffset;
      let hourNumber = i % 24;
      let hourID = 'hour-' + hourNumber;
      let displayHour = (i % 12) === 0 ? 12 : i % 12;
      displayHour = hourNumber < 12 ? displayHour + 'AM' : displayHour + 'PM';

      // add the hourly schedule object
      workDaySchedule[hourID] = {
        hourNumber: i,
        displayHour: displayHour,
        eventTicket: ''
      }
    }

    return workDaySchedule;
  }

  // Returns the current unix timestamp
  function getNow(){
    return dayjs.unix(dayjs().unix());
  }

  // Provide feedback about success or failure of event scheduling
  function displayUserMessage(message, timeID, background) {
    userFeedBackEl.addClass(background)
    userFeedBackEl.addClass('border border-primary')
    userFeedBackEl.text(message);
    userFeedBackEl[0].scrollIntoView({behavior: "smooth", block: "center"});    

    // Provide user with adequate time to observe feedback
    setTimeout(function () {
      userFeedBackEl.removeClass(background)
      userFeedBackEl.removeClass('border border-success')
      userFeedBackEl.text('');
      displaySchedule();
      let timeBlock = $('#' + timeID)[0];
      timeBlock.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
    }, 3000);
  }

  // Initialize the application's library
  function getDictionary() {
    let tempDict = JSON.parse(localStorage.getItem('dictionary'));
    if (!tempDict) {
      tempDict = [];
      setDictionary(tempDict);
    }

    return tempDict;
  }

  // save the library to local storage
  function setDictionary(newLibrary) {
    localStorage.setItem('dictionary', JSON.stringify(newLibrary));    
  }

  // save new events to library
  function saveDictionary(newSentence) {
    var fullLibrary = getDictionary();
    let dictionary = fullLibrary.filter(function (sentence) {
      return sentence.toLowerCase().includes(newSentence.toLowerCase());
    });

    if (dictionary.length > 0) {
      return;
    }

    // This is a new sentence, add it to the dictionary
    fullLibrary.push(newSentence);
    setDictionary(fullLibrary);
  }

  // Save user input if any
  function saveImportantEvent(event) {
    var ticketTarget = $(event.target);
    // couldn't find a leaner approach to prevent child click events
    if(ticketTarget.hasClass('fas')) {
      ticketTarget = ticketTarget.parent();
    }
    
    // get ticket update
    let currentTicket = ticketTarget.siblings('.description').val().trim();
    let targetBlock = ticketTarget.parent();
    let blockID = targetBlock.attr('id');
    if (!currentTicket.length) {
      displayUserMessage('Update failed!!! BLANK EVENT CREATED!', blockID, 'bg-danger');
      return;
    }

    let storedEvents = readDaySchedule();
    storedEvents[blockID].eventTicket = currentTicket;
    saveDaySchedule(storedEvents);
    saveDictionary(currentTicket);
    displayUserMessage('Event Update successfully saved!', blockID, 'bg-primary');
  }

  // Activate autocomplete after 3 character inputs
  function getAutoComplete(event) {
    $(event.target).autocomplete({
      minLength: minSearch,
      source: function (request, response) {
        response( $.ui.autocomplete.filter(
        getDictionary(), request.term ) );
      }
    });
  }
  

  // Display the current time in the header of the page
  function displayTime(){
    var presentTime = getNow();
    timeDisplayEl.text(presentTime.format('hh:mm:ss A'));
    // update the schedule hourly and automatically update the date 
    let currentHour = parseInt(presentTime.format('H'));
    if(currentHour != previousHour){
        // If day changes, update the display
      if (!currentHour || previousHour == DayOffset) {
        // Update the display date
        dateDisplayEl.text(presentTime.format('dddd, MMMM DD, YYYY'));
        // Set the current date
        currentDate = presentTime.format('YYYY-MM-DD');
      }
      
      // update the display hourly for  current day
      previousHour = currentHour;
      if (currentDate == selectedDate || presentHourID === 'hour-23') {
        // Follow present day if viewing present day
        selectedDate = currentDate;
        displaySchedule();
      }
    }
  }
  
  // Initialize the application
  function init(){
    // Initializes the selected Date to the current Date
    selectedDate = getNow().format('YYYY-MM-DD');
  }

  // Start the application
  init();  

  // Show the current time of day
  setInterval(displayTime, 1000);

  // get any schedule update or edit from user
  scheduleEl.on('click', '.saveBtn', saveImportantEvent);

  // Engage autocomplete when in focus
  scheduleEl.on('focus', '.description', getAutoComplete);
});
