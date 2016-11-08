//функция для перезагрузки контента по ajax
function ReloadAjaxContent(url, objSend, isSetHistory, callback)
{
    if (url.length <= 0) {
        url = document.location.pathname;
    }
    if ('append' in objSend) {
        objSend.append('ajax', 'Y');
    } else {
        objSend['ajax'] = 'Y';
    }
    var curTime = new Date();
    //сбразываем предыдущий запрос
    if (window.ajaxSend) {
        window.ajaxSend.abort();
    }
    //отправляем запрос
    window.ajaxSend = $.ajax({
        url: url,
        type: 'POST',
        data: objSend,
        processData: 'append' in objSend ? false : true,
        contentType: 'append' in objSend ? false : 'application/x-www-form-urlencoded',
        cache: false,
        dataType: 'html',
        success: function(result) {
            curTime = curTime + 300 - new Date();
            window.setTimeout(function(){
                //обновляем контент
                $('.js-ajaxContent').html(result);
                if (isSetHistory && history.pushState && typeof(history.pushState) === 'function') {
                    window.history.pushState(null, null, url);
                }
                if (callback && typeof(callback) === 'function') {
                    callback();
                }
                //убираем загрузчик
                curTime = false;
            }, curTime > 0 ? curTime : 0);
        }
    });
}
$(document).ready(function(){
    if ($('.js-dateInput').length > 0) {
        $('.js-dateInput').each(function(){
            var objInput = $(this);
            objInput.datepicker({
                buttonText: 'Выберите дату',
                showOn: 'button',
                dateFormat: objInput.attr('data-format') != undefined ? objInput.attr('data-format') : 'dd.mm.yy',
                minDate: objInput.attr('data-date-min') != undefined ? objInput.attr('data-date-min') : null,
                maxDate: objInput.attr('data-date-max') != undefined ? objInput.attr('data-date-max') : null,
                changeMonth: true,
                changeYear: true
            });
            objInput.nextAll('.ui-datepicker-trigger').addClass('chooseDate');
            $(objInput).on('click', function(){
                $(this).nextAll('.ui-datepicker-trigger')[0].click();
            });
        });
    }
    if ($('.js-ajaxForm').length > 0 && $('.js-ajaxListener').length > 0) {
        $('.js-ajaxListener').on('change', '.js-ajaxForm .js-checkFile', function(){
            if ($(this).val() && $(this).val() != '') {
                var objSend = {
                    'ajax' : 'Y',
                    'DIR' : $(this).val()
                };
                //var form = $(this).parents('.js-ajaxForm');
                var elem = $(this);
                var curTime = new Date();
                //сбразываем предыдущий запрос
                if (window.ajaxSend) {
                    window.ajaxSend.abort();
                }
                //отправляем запрос
                window.ajaxSend = $.ajax({
                    url: 'ajax.php',
                    type: 'POST',
                    data: objSend,
                    processData: true,
                    contentType: 'application/x-www-form-urlencoded',
                    cache: false,
                    dataType: 'html',
                    success: function(result) {
                        result = JSON.parse(result);
                        if (result['html'] != null && result['html'].length > 0) {
                            curTime = curTime + 300 - new Date();
                            window.setTimeout(function(){
                                //обновляем контент
                                $(elem).nextAll('.js-checkFile').remove();
                                $(elem).after(result['html']);
                                //убираем загрузчик
                                curTime = false;
                            }, curTime > 0 ? curTime : 0);
                        }
                    }
                });
            } else {
                $(this).nextAll('.js-checkFile').remove();
            }
        });
        $('.js-ajaxListener').on('change', '.js-ajaxForm .js-viewFile', function(){
            if ($(this).val() && $(this).val() != '') {
                var form = $(this).parents('.js-ajaxForm');
                var tabID = form.attr('data-tab-id');
                var elem = $(this);
                var curTime = new Date();
                var tabObj = $('.js-ajaxTabContent').last().get(0).repObject;
                if (tabObj) {
                    $.getJSON($(this).val(), function(input){
                        tabObj.appendPreview(input);
                    })
                }
                //сбразываем предыдущий запрос
                /*if (window.ajaxSend) {
                    window.ajaxSend.abort();
                }
                var url = '/app/index.php?har=' + $(this).val();
                //отправляем запрос
                window.ajaxSend = $.ajax({
                    url: url,
                    type: 'GET',
                    //data: {},
                    processData: true,
                    contentType: 'application/x-www-form-urlencoded',
                    cache: false,
                    dataType: 'html',
                    success: function(result) {
                        curTime = curTime + 300 - new Date();
                        window.setTimeout(function(){
                            //обновляем контент
                            $('.js-ajaxTabContent[data-tab-id="' + tabID + '"]').html(result);
                            //убираем загрузчик
                            curTime = false;
                        }, curTime > 0 ? curTime : 0);
                    }
                });*/
            }
        });
    }
});