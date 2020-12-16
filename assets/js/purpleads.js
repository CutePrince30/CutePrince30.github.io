document.addEventListener('DOMContentLoaded',  function() {
    var purpleAdsCheck = false;
    if ($(window).width() < 750) {
        purpleAdsCheck = 1000;
        $("body").addClass("purpleads-hide");
    }
    $(window).scroll(function() {
        if (purpleAdsCheck) {
            if ($(window).scrollTop() > purpleAdsCheck) {
                purpleAdsCheck = false;
                $("body").removeClass("purpleads-hide");
            }
        }
    })
});
