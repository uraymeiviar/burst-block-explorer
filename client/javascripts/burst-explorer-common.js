$.ajaxSetup({
    cache: true
});

function onPageLoaded() {
    var path = $(location)[0].pathname;
    var paths = path.split('/');
    $.getScript('/javascripts/'+paths[1]+'/module.js', function( data, textStatus, jqxhr) {
       onModuleLoaded(paths);
    });
}