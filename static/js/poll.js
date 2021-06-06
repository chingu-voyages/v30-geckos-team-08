/** OLD 
$('.ansButt').click(function (e) {
    e.preventDefault();
    let vote = $(this).data('index');
    //console.log("index: " + vote);
    const ansDivId = "#ansDiv" + vote;
    //console.log("ansDivId: "  + ansDivId); 
    $('.takePollAnsDiv').removeClass('highlightAns');
    $(ansDivId).addClass('highlightAns');


    $('input[name="voteIndex"]').val(vote);
    $('#submitButton').removeClass('disabled hidden').addClass('d-inline-block');
});
**/
$('.myRadio').click(function inputClicked(){
    if ($(this).is(':checked')) {
        let vote = $(this).data('index');
        $("input[name='voteIndex']").val(vote);
        console.log("setting vote to: " + vote);

        $('#submitButton').removeClass('disabled hidden')
            .addClass('d-inline-block');
    }
})
