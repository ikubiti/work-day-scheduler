// Wrap all code that interacts with the DOM in a call to jQuery to ensure that
// the code isn't run until the browser has finished rendering all the elements
// in the html.

$(function () {
  let scheduleEl = $('.container-lg');
  let dateDisplayEl = $('#currentDate');
  let timeDisplayEl = $('#currentTime');
  const timeOffset = 12;
  const DayOffset = 25;
  let previousHour = DayOffset;
  let selectedDate = '';
  // TODO: Add a listener for click events on the save button. This code should
  // use the id in the containing time-block as a key to save the user input in
  // local storage. HINT: What does `this` reference in the click listener
  // function? How can DOM traversal be used to get the "hour-x" id of the
  // time-block containing the button that was clicked? How might the id be
  // useful when saving the description in local storage?
  //
  // TODO: Add code to apply the past, present, or future class to each time
  // block by comparing the id to the current hour. HINTS: How can the id
  // attribute of each time-block be used to conditionally add or remove the
  // past, present, and future classes? How can Day.js be used to get the
  // current hour in 24-hour time?
  //
  // TODO: Add code to get any user input that was saved in localStorage and set
  // the values of the corresponding textarea elements. HINT: How can the id
  // attribute of each time-block be used to do this?

  // display the time-blocks for the day selected
  function displaySchedule(day, itinerary) {
    scheduleEl.empty();
    for(let i = 0; i < itinerary.length; i++) {
      let checkHour = i + timeOffset;
      // container for time-block
      let timeBlockEl = $('<div id="hour-' + checkHour +'"></div>');
      timeBlockEl.addClass('row time-block');
      let currentHour = parseInt(getDateTime().format('H'));
      let status = (currentHour == checkHour) ? "present" : ((currentHour > checkHour) ? "past" : "future");
      timeBlockEl.addClass(status);

      let timeHourEl = $('<div class="col-2 col-md-1 hour text-center py-3"></div>');
      let hourDisplay = checkHour < 12 ? `${checkHour}AM` : ((checkHour > 12) ? `${checkHour - 12}PM` : `${checkHour}PM`);
      timeHourEl.text(hourDisplay);
      timeBlockEl.append(timeHourEl);

      let textInput = $('<textarea class="col-8 col-md-10 description" rows="3"></textarea>');
      textInput.text(itinerary[i]);
      timeBlockEl.append(textInput);

      let saveHourEvent = $('<button class="btn saveBtn col-2 col-md-1" aria-label="save">').append('<i class="fas fa-save" aria-hidden="true"></i>');
      timeBlockEl.append(saveHourEvent);
      scheduleEl.append(timeBlockEl);
    }

    // user feedback element
    // scheduleEl.append('<br><br><div id=userFeedback></div>');
    scheduleEl.append('<div id=userFeedback></div>');
    // Scroll to present time if present
    var presentBlock = $('.present')[0];
    if(presentBlock){
      presentBlock.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
    }
  }

  // save the day's schedule
  function saveDaySchedule(day, theSchedule) {
    localStorage.setItem(day, JSON.stringify(theSchedule));
  }


  // Get or generate a new empty day schedule
  function readDaySchedule(targetDate) {
    var dayEvents = JSON.parse(localStorage.getItem(targetDate));

    if(!dayEvents) {
      dayEvents = generateDaySchedule();
      saveDaySchedule(targetDate, dayEvents);
    }

    return dayEvents;
  }

  // Generate a day's schedule from scratch
  function generateDaySchedule(){
    var aSchedule = new Array(timeOffset);
    aSchedule.fill('', 0, timeOffset)
    return aSchedule;
  }

  // TODO: Add code to display the current date in the header of the page.
  function updateDate(){
    var theDate = getDateTime().format('dddd, MMMM DD, YYYY');
    dateDisplayEl.text(theDate);
    // Needs revision
    selectedDate = getDateTime().format('YYYY-MM-DD');;
  }

  // Update the schedule hourly
  function updateHourly() {
    var currentSchedule = getDaySchedule(getDateTime());
    displaySchedule(getDateTime(), currentSchedule);
  }

  // Returns the current unix timestamp
  function getDateTime(){
    return dayjs.unix(dayjs().unix());
  }

  function getDaySchedule(targetDate){
    var dateTarget = targetDate.format('YYYY-MM-DD');
    let newSchedule = readDaySchedule(dateTarget);
    return newSchedule;
  }

  // function init(){
  //   updateDate();
  //   var currentSchedule = getDaySchedule(getDateTime());
  //   displaySchedule(getDateTime(), currentSchedule);

  //   // const date1 = dayjs('2019-01-25');
  //   // const date2 = dayjs('2018-06-05');
  //   // console.log(date1.diff(date2, 'day'));

  // }

  // init();

  function displayUserMessage(message) {
    let userMessage = $('#userFeedback');
    userMessage.text(message);
    userMessage[0].scrollIntoView({behavior: "smooth", block: "center"});

    // Provide user with adequate time to observe feedback
    setTimeout(function(){
      userMessage.text('');
    }, 2000);
  }

  // Save uer input if any
  function saveImportantEvent(event) {
    var ticketTarget = $(event.target);
    // couldn't find a leaner approach to prevent child click events
    if(ticketTarget.hasClass('fas')) {
      ticketTarget = ticketTarget.parent();
    }
    
    // get ticket update
    let currentTicket = ticketTarget.siblings('.description').val().trim();
    if (!currentTicket.length) {
      displayUserMessage('Update failed!!! BLANK EVENT CREATED!');
      return;
    }

    let hourSelected = parseInt(ticketTarget.parent().attr('id').slice(5));
    let hourIndex = hourSelected - timeOffset;
    console.log(currentTicket);
    console.log(hourSelected);
    console.log($('#currentDate').text());
    console.log(selectedDate);

    let storedEvents = readDaySchedule(selectedDate);
    storedEvents[hourIndex] = currentTicket;
    saveDaySchedule(selectedDate, storedEvents);
    displayUserMessage('Event Update successfully saved!');
  }

  // Display the current time in the header of the page
  function displayTime(){
    var theTime = getDateTime().format('hh:mm:ss A');
    timeDisplayEl.text(theTime);

    // update the schedule hourly and automatically update the date 
    let currentHour = parseInt(getDateTime().format('H'));
    if(currentHour != previousHour){
      if(!currentHour || previousHour == DayOffset) {
        updateDate();
      }

      previousHour = currentHour;
      updateHourly();
    }
  }  

  // Show the current time of day
  setInterval(displayTime, 1000);

  // get any schedule update or edit from user
  // $('.saveBtn').on('click', saveImportantEvent);
  scheduleEl.on('click', '.saveBtn', saveImportantEvent);
});
