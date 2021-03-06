//const e = require("express");

let numAnswers = 2;
let dupProtection = 1; // off = 1, cookie = 2, ip = 3, both = 4

function setInputWidth() { // Form input fields dynamically resize
    const newWidth = $('#qField').width() - 32;
    $('.textInput').width(newWidth);
}

$(document).ready(function () {

    setInputWidth(); // The form inputs dynamic resizing
    window.addEventListener('resize', setInputWidth);


    // On form text inputs, css class "filled" moves the label above
    $("form input").on("blur input focus", function () {
        var $field = $(this).closest(".field");
        if (this.value) {
            $field.addClass("filled");
        } else {
            $field.removeClass("filled");
        }
    });

    // Event handler. Moves label above the field on initial click
    // Slighly different than above - ( "if this" instead of "if this.value" so it IS needed so initial focus doesn't
    // show cursor AND still have the label at cursor location
    $("form input").on("focus", function () {
        var $field = $(this).closest(".field");
        if (this) {
            $field.addClass("filled");
        } else {
            $field.removeClass("filled");
        }
    });

    
    // Blinking cursor effect - nice UI user feedback 
    /* NOTE: In development, it might be good to disable the javascript that toggles the blinking 
    cursor. Otherwise browser dev tools act weird and flash at you. */
    /*setInterval(function () {
        $('.textInput').addClass('clearCursor');
        $('.textInput').removeClass('blackCursor');
        setTimeout(function () {
            $('.textInput').removeClass('clearCursor');
            $('.textInput').addClass('blackCursor');
        }, 500);
    }, 1000);
    */
    
    // Defines the validation function for jquery-validation 
    $('#pollForm').validate({
        validClass: 'success',
        errorPlacement: function (error, element) {
            error.insertBefore(element);
        },
        rules: {
            question: 'required',
            answer1: 'required',
            answer2: 'required'
        },
        messages: {
            question: "Please enter a question before moving on",
            answer1: "Please enter a choice before moving on",
            answer2: "Please enter a choice before moving on"
        }
    }); // end validate

    // Event handler for when the button for "Add answer" is clicked
    $('#addAnswerBtn').click(function (e) {
        e.preventDefault();
        
        // Make sure form is valid (filled) before adding another answer
        if ($('#pollForm').valid()) {
            numAnswers = numAnswers + 1;
            currName = "answer" + numAnswers; // answer3, answer4...

            let theDiv = document.createElement('div');
            let divName = currName + "Div"; // answer3Div, answer4Div...
            theDiv.setAttribute('id', divName); // id will be answer3Div, answer4Div...
            theDiv.setAttribute('class', "hidden field ansDiv"); // hidden because we animate slideDown below

            let label = document.createElement('label');
            label.setAttribute('for', currName);
            //label.setAttribute('class', 'ml-4 mr-3');
            label.innerText = "Enter additional choice";

            var input = document.createElement('input');
            input.type = 'text';
            input.setAttribute('name', currName); /* changed change changed changed */
            input.setAttribute('id', currName);
            input.setAttribute('data-msg-required', "Please enter a choice before moving on");
            input.setAttribute('class', currName + ' textInput mb-2');
            input.setAttribute('required', 'required');
            
            theDiv.appendChild(label);

            // Setup the discard link by an IIFE (immediately invoked function expression)
            (function setupDiscardBtn() {
                let discardBtn = document.createElement('span');
                discardBtn.classList.add('discardSpan');
                let dLink = document.createElement('a');
                dLink.classList.add('discardLink');
                let txtSpan = document.createElement('span');
                txtSpan.classList.add('discardTxt');
                txtSpan.innerText = "Discard";
                dLink.appendChild(txtSpan);
                discardBtn.appendChild(dLink);
                theDiv.appendChild(discardBtn);
                
                // When the discard link is clicked
                dLink.onclick = function removeAnswer() {
                    $('#' + divName).remove();
                    numAnswers = numAnswers - 1;
                }
            })();
            
            theDiv.appendChild(input);
            document.getElementById('moreAnswers').appendChild(theDiv);
            setInputWidth();
            
            /* Event handler for RETURN key on any of the dynamically added "more answers" */
            /* Capture is actually done on the div and grab input's currName (for . class, 2nd param to "on") 
            from above event handling setup for the input. index grabbed by using "this" */
            $('#moreAnswers').on('keydown', '.' + currName, function (e) {
                if (e.keyCode == 13) {
                    e.preventDefault();
                    var index = $('.textInput').index(this);
                    // If it's the last input, advance focus to the add answer button
                    if (index == $('.textInput').length - 1) {
                        $('#dropdownMenuButton1').focus();
                    }
                    else { // otherwise advance to the next text input field
                        $('.textInput').eq(index + 1).focus();
                    }
                }
            })

            // Much the same as below .on - maybe below one is not needed?
            $('#moreAnswers').on('blur input focus', '.' + currName, function (e) {
                let value = $('#' + currName).val();
                let theDiv2 = document.getElementById(divName);
                if ($('#' + currName).val()) { // if the input field isn't empty
                    theDiv2.className += " filled";
                }
                else {
                    theDiv2.classList.remove('filled');
                }
            });

            // Whichever "moreAnswer" was clicked on, add the class "filled" so its label moves out of 
            // its input field to above it
            $('#moreAnswers').on('focus', '.' + currName, function (e) {
                let theDiv3 = document.getElementById(divName);
                theDiv3.classList.add('filled');
            });

            // Show the new answer
            if ($(theDiv).is(':hidden')) {
                $(theDiv).slideDown('slow');
                $(input).focus();
            }
        }
        else { // validation failed
            $(".textInput.error").eq(0).focus();
        }
    }); // end click handler of addAnswerBtn


    // Event handler for when Finish button is clicked
    $('#finishBtn').click(function (e) {
        e.preventDefault();
        let myAnswers = []; // Collect all answers in myAnswers array
        for (let n = 1; n <= numAnswers; n++) {
            myAnswers.push($('#answer' + n).val());
        }

        let cookieCheck = false;
        let ipCheck = false;
        if (dupProtection == 2 || dupProtection == 4) ipCheck = true;
        if (dupProtection == 3 || dupProtection == 4) cookieCheck = true;

        const mydata = {
            "question": $('#question').val(),
            "answers": myAnswers,
            "cookieCheck": cookieCheck,
            "ipCheck": ipCheck
        };
        
        if ($('#pollForm').valid()) {
            console.log('js:193 pollForm valid');
            $.post('/', mydata, function (data, status) {
                console.log("status: " + status);
                // above should return "success" - this can probably be improved with error checking
                // but used below replace() because this is usually a ajax call not a form post
                // but form submit wasn't as easy - I'd have to create hidden form inputs maybe and parse answers array
                window.location.replace(data.url);
            });
            //$('#pollForm').submit(); this was the problem way
        }
        else {
            $('.error')[0].focus();
        }
    });
    
    /* For any .textInput, move to next input (text or "add answer" button) when return is pressed */
    $('.textInput').keydown(function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            var index = $('.textInput').index(this);
                
            if (index == $('.textInput').length - 1) {
                $('#dropdownMenuButton1').focus();
            }
            else { // advance to next text input
                $('.textInput').eq(index + 1).focus();
            }
        }
    }) // end keydown event handler

    $('#question').focusout(function(e){
        if($('#question').val().length > 0){
            if($('#answers').is(':hidden')){
                $('#answers').slideDown('slow');
            }
        }
    });

    $('#dropdownMenuButton1').click(function (e) {
        e.preventDefault();
    });

    /*************** THESE CAN BE REFACTORED INTO ONE ***********/
    $('#dpLi1').click((e) => {
        //console.log('poll-create-form.js:229 click event on dpLi1')
        e.preventDefault();
        dupProtection = 1;
        $('#dupChoiceSpan').text('Off');
        unstyleActiveListItem();
        $('#dpLink1').addClass('active').attr('aria-current', 'true');
    });
    $('#dpLi2').click((e) => {
        //console.log('poll-create-form.js:237 click event on dpLi1')
        e.preventDefault();
        dupProtection = 2;
        $('#dupChoiceSpan').text('IP Address');
        unstyleActiveListItem();
        $('#dpLink2').addClass('active').attr('aria-current', 'true');
    });
    $('#dpLi3').click((e) => {
        //console.log('poll-create-form.js:237 click event on dpLi1')
        e.preventDefault();
        dupProtection = 3;
        $('#dupChoiceSpan').text('Cookie');
        unstyleActiveListItem();
        $('#dpLink3').addClass('active').attr('aria-current', 'true');
    });
    $('#dpLi4').click((e) => {
        //console.log('poll-create-form.js:237 click event on dpLi1')
        e.preventDefault();
        dupProtection = 4;
        $('#dupChoiceSpan').text('Both');
        unstyleActiveListItem();
        $('#dpLink4').addClass('active').attr('aria-current', 'true');
    });
    /**************************************************** */


}); // end document.ready

function unstyleActiveListItem() {
    $('.dropdown-item').removeClass('active').attr('aria-current', 'false');
}

// If user entered a question & pressed RETURN, show the answers section
    // Not sure why but this had to go OUTSIDE document.load for the initial focus away from question to answer1
    $('#question').keydown(function (e) {
        console.log("206");
        if (e.keyCode == 13 && $('#question').val().length > 0) {
            console.log("208");
            e.preventDefault();
            if ($('#answers').is(':hidden')) {
                $('#answers').slideDown('slow');
                $('#answer1').focus();
            }
            setTimeout(function () {
                $('#answer1').focus();
            });
            //$('#answer1').focus();
        }
    }); // end question keydown event listener


        
