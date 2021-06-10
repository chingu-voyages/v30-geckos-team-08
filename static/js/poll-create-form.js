//const e = require("express");

let numAnswers = 2;
let dupProtection = 1; // off = 1, cookie = 2, ip = 3, both = 4

function setInputWidth() { // Form input fields dynamically resize
    $('.textInput').width($('#qField').width() - 32);
}

$(document).ready(function () {

    $('#finalMessageDiv').hide();
    setInputWidth(); // The form inputs dynamic resizing
    window.addEventListener('resize', setInputWidth);

    $('#refreshIcon').hover(function () {
        console.log("running hover handler");
        $('#refreshIconImg').attr("src", "/img/misc-icons/noun_Refresh_Hover_100x100.png")
        $('#refreshIcon').removeClass('refreshIconOrig').addClass('refreshIconHover');
     });
    $('#refreshIcon').mouseleave(function () {
        console.log('running mouseleave');
        $('#refreshIconImg').attr("src", "/img/misc-icons/noun_Refresh_100x100.png")
        $('#refreshIcon').removeClass('refreshIconHover').addClass('refreshIconOrig');
    });
    $('#refreshCaptchaLink').click(function (e) {
        e.preventDefault(); // force a new Captcha to be made/shown
        $('#captchaImg').attr('src', '/captcha.jpg?id=' + Math.random())
            .removeClass('hidden');
        $('#captcha').val(undefined).focus();
    });

    /********************* FORM SUBMISSION  ***************/
    $("form#captchaForm").on('submit', function (e) {
        e.preventDefault();
        if ($('#pollForm').valid()) {
            $('#finalMessageDiv').hide();
            let myAnswers = [];
            for (let n = 1; n <= numAnswers; n++){
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
                "ipCheck": ipCheck,
                "captchaInput": $('#captcha').val()
            }
            $.ajax({
                type: 'post',
                url: '/',
                data: mydata,
                success: function(result){
                    console.log("poll-create-form.js:73 captchacheck returned");
                    
                    if (result.captchaPass == false) {
                        console.log("Captcha failed");
                        $('#captchaImg').addClass('hidden');
                        $('#refreshCaptchaLink').focus();
                    }
                    else {
                        console.log("Captcha passed");
                        console.log("result.url: " + result.url);
                        window.location.replace(result.url);
                    }

                },
                error: function (e) {
                    console.log("poll-create-form.js:77 ERROR: " + e);
                    alert("Sorry! Error creating poll: " + e);
                }
            })
        }
        else {
            $('.error')[0].focus(); // validate failed so focus on error
            $('#finalMessageDiv').show();
        }
    }); /* end captchaForm on submit
    */

    // On form text inputs, css class "filled" moves the label above
    $("form input").on("blur input focus", function (e) {
        if (this.value) {
            $('#finalMessage').hide();
            console.log("89 adding filled")
            $(this).closest('.field').addClass('filled');
            //$field.addClass("filled");
        } else {
            if (e.type == "blur") {
                console.log("92 removing filled")
                $(this).closest('.field').removeClass('filled');
                //$field.removeClass("filled");
            }
        }
    });

    // Event handler. Moves label above the field on initial click
    // Slighly different than above - ( "if this" instead of "if this.value" so it IS needed so initial focus doesn't
    // show cursor AND still have the label at cursor location
    $("form input").on("focus", function () {
        var $field = $(this).closest(".field"); // the enclosing div
        console.log("poll-create-form.js:102 (form input).on(focus) ")
        if (this) {
            console.log("always called? If so, why not check for already filled?")
            console.log("with if(this) triggered so adding filled");
            $field.addClass("filled");
        } else {
            console.log("removing filled")
            $field.removeClass("filled");
        }
    });

    /*
    // Blinking cursor effect - nice UI user feedback 
    /* NOTE: In development, it might be good to disable the javascript that toggles the blinking 
    cursor. Otherwise browser dev tools act weird and flash at you. */
    /*
    setInterval(function () {
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
            $('#finalMessageDiv').hide();
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

            (function setupInputEventListeners() {

                function doFillJob(e) {
                    console.log("211 doFillJob")
                    if (e.target.value) {
                        console.log("205 e.target.parentNode.id: " + e.target.parentNode.id);
                        document.getElementById(e.target.parentNode.id).classList.add('filled');
                    }
                    else {
                        if(e.type == "blur")
                            document.getElementById(e.target.parentNode.id).classList.remove('filled');
                    }
                }
                document.getElementById(currName).addEventListener('blur', doFillJob);
                document.getElementById(currName).addEventListener('input', doFillJob);
                document.getElementById(currName).addEventListener('focus', doFillJob);

                function doFillJob2(e) {
                    console.log("224 doFillJob2");
                    let parentDiv = document.getElementById(e.target.parentNode.id);
                    if (true) {
                        parentDiv.classList.add('filled');
                    }
                    //else
                    //    parentDiv.classList.remove('filled');
                }

                document.getElementById(currName).addEventListener('focus', doFillJob2);

            })(); // end iife setupInputEventListeners


            setInputWidth();

            $('#moreAnswers').on('blur input focus', '.' + currName, function (e) {
                let value = $('#' + currName).val();
                console.log("poll-create-form.js:219 value is: " + value);

                if ($('#' + currName).val()) { // if the input field isn't empty
                    console.log('222 adding filled');
                    $(value).addClass('filled');
                }
                else {
                    console.log("226 removing filled");
                    $(value).removeClass('filled');
                }
            });
            
            // Whichever "moreAnswer" was clicked on, add the class "filled" so its label moves out of 
            // its input field to above it
            $('#moreAnswers').on('focus', '.' + currName, function (e) {
                console.log("234 adding filled to divName: " + divName);
                let theDiv3 = document.getElementById(divName);
                theDiv3.classList.add('filled');
            });

            // Show the new answer
            if ($(theDiv).is(':hidden')) {
                $(theDiv).slideDown('slow');
                $(input).focus();
                $(theDiv).removeClass('hidden');
            }
        }
        else { // validation failed
            $(".textInput.error").eq(0).focus();
            $('#finalMessageDiv').show();
        }
    }); // end click handler of addAnswerBtn
    
    /* For any .textInput, move to next text input or to the add answer button when return is pressed */
    $('.textInput').keydown(function (e) {

        if (e.keyCode == 13) {
            console.log("poll-create-form.js:237 fired event listener on keyCode 13");
            e.preventDefault();
            var index = $('.textInput').index(this);
            // if it's the last answer input, focus on add answer button but put captcha into view
            if (index == $('.textInput').length - 1) {
                $('#addAnswerBtn').focus();
                //document.getElementById('captcha').scrollIntoView();
            }
            // it's not the last input, so just move to next text field
            else { // advance to next text input
                $('.textInput').eq(index + 1).focus();
                
                //document.getElementsByClassName('textInput')[index + 2].scrollIntoView();
            }
        }
    }) // end keydown event handler

    $('#question').focusout(function(e){
        if($('#question').val().length > 0){
            if($('#answers').is(':hidden')){
                $('#answers').slideDown('slow');
            }
            if ($('#bottom').is(':hidden')) {
                $('#bottom').slideDown('slow');
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
            // This trick makes sure it's showing 
            setTimeout(function () {
                $('#answer1').focus();
            });
            //$('#answer1').focus();
        }
    }); // end question keydown event listener


        
