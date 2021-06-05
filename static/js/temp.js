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

/***************************************  */
    

app.post('/checkCaptcha', function (req, res) {
    console.log("app.js:166 req.data: " + req.data);
    
    console.log("app.js:165 req.body.data: " + req.body.data);
    console.log("app.js:169 req.body: " + req.body);
    console.dir(req.body);
    const input = req.body.one;
    console.log("input: " + input);

    const validCaptcha = captcha.check(req, input);
    if (!validCaptcha) {
        console.log("Invalid captcha");
        return res.send(false);
        //return res.end('Invalid Captcha!');
    }
    else {
        console.log("Valid capture");
        return res.send(true);
    }
});