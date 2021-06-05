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
        
        console.log("poll-create-form.js:186 captcha.val(): " + $('#captcha').val());
        

        const mydata = {
            "question": $('#question').val(),
            "answers": myAnswers,
            "cookieCheck": cookieCheck,
            "ipCheck": ipCheck,
            "captchaInput": $('#captcha').val(),
        };
        console.log("poll-create-form.js:231 submitting: " + mydata);

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