//get all elements(divs) with class page
const pages = document.querySelectorAll('.page');

function showPage(pageName) {//showPage is called with the button eg showPage('dashboard')
    pages.forEach(function(page) {
        page.style.display = 'none';//hide all the element
    });

    const target = document.getElementById('page-' + pageName);
    target.style.display = 'block';//('page-' + pageName); makes (page-dashboard) which is our id
}

showPage('dashboard');