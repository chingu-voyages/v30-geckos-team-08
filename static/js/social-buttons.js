$(document).ready(function () {

    // Initialize the Bootstrap tooltips
    $(function () {
        $('[data-bs-toggle="tooltip"]').tooltip()
    });
    $('#fb-img').hover(function () {
        $('#fb-img').attr("src", "/img/social-icons/iconmonstr-facebook-1-240.png");
    });
    $('#fb-img').mouseleave(function () {
        $('#fb-img').attr("src", "/img/social-icons/iconmonstr-facebook-1-240-gr.png");
    });
    $('#twitter-img').hover(function () {
        $('#twitter-img').attr("src", "/img/social-icons/iconmonstr-twitter-1-240.png");
    });
    $('#twitter-img').mouseleave(function () {
        $('#twitter-img').attr("src", "/img/social-icons/iconmonstr-twitter-1-240-gr.png");
    });
    $('#reddit-img').hover(function () {
        $('#reddit-img').attr("src", "/img/social-icons/iconmonstr-reddit-1-240.png");
    });
    $('#reddit-img').mouseleave(function () {
        $('#reddit-img').attr("src", "/img/social-icons/iconmonstr-reddit-1-240-gr.png");
    });
    $('#linkedin-img').hover(function () {
        $('#linkedin-img').attr("src", "/img/social-icons/iconmonstr-linkedin-1-240.png");
    });
    $('#linkedin-img').mouseleave(function () {
        $('#linkedin-img').attr("src", "/img/social-icons/iconmonstr-linkedin-1-240-gr.png");
    });

})


